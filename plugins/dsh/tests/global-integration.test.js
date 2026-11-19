import test from 'node:test'
import assert from 'node:assert/strict'
import * as fs from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import { Engine } from '../engine.js'
import { encode, decode } from '../contracts.js'
import { globalStateChange, readGlobalState } from '../global-state.js'
import { globalContext } from '../global-context.js'
import { preferenceContext } from '../preference-context.js'
import { createScope, resolveConfig } from '../adapter.js'
import { createLibrary } from '../library.js'

// Fictional turns, deterministic model responses, isolated temporary roots only.
const plan = { topics: [], documents: [], relations: [], note: '' }
const preference = 'For future tasks, prefer concise replies.'
async function fixture(t) {
  const root = await fs.realpath(await fs.mkdtemp(join(tmpdir(), 'ctxkit-global-')))
  const session = { id: 'fictional-global-session', header: { cwd: root } }
  const calls = [], batches = []
  const state = { text: 'The shared fictional test service is unavailable.', action: 'set', evidence: 'observed', withPreferences: true, failOrganize: false, beforeReturn: null, transform: value => value }
  let clock = 0
  const engine = new Engine({ root, now: () => new Date(Date.UTC(2026, 0, 1) + clock++ * 1000).toISOString(),
    authorize: async (_paths, context) => context?.signal?.throwIfAborted(),
    generate: async request => {
      const payload = JSON.parse(request.user); calls.push({ purpose: request.purpose, payload })
      if (request.purpose === 'ctxkit.organize') { if (state.failOrganize) throw Error('fictional failure'); return JSON.stringify(plan) }
      const result = { meaningful: true, title: 'Shared service update', summary: 'A fictional shared service changed state.', next: '', topicHints: [],
        facts: [{ text: state.text, kind: 'result', evidence: state.evidence, sourceSeqs: [payload.source.fromSeq + 1] }],
        globalState: [{ id: 'global_shared_service', action: state.action, ...(state.action === 'set' ? { text: state.text, category: 'fact' } : {}), factIndexes: [0] }],
        preferences: state.withPreferences ? [{ id: 'pref_reply_style', action: 'set', text: 'Prefer concise replies.', sourceSeq: payload.source.fromSeq, quote: preference }] : [] }
      await state.beforeReturn?.(engine)
      return JSON.stringify(state.transform(result))
    } })
  const commit = engine.vault.commit.bind(engine.vault)
  engine.vault.commit = (changes, ...args) => { batches.push(changes.map(c => c.path)); return commit(changes, ...args) }
  const scope = createScope({}, resolveConfig({ root, allowedWorkspaces: [root], provider: 'fixture', model: 'fixture' }))
  const library = createLibrary({ active: true, scope, engine, status: async () => ({ paused: false, pending: 0 }) })
  const turn = (n = 1) => ({ sessionId: session.id, cwd: root, turn: n, fromSeq: n * 10, toSeq: n * 10 + 2, sourceSeqs: [n * 10, n * 10 + 1],
    userSources: [{ seq: n * 10, text: preference }], text: `${preference}\n${state.text}`, context: { session } })
  t.after(async () => { engine.dispose(); await engine.queue; await fs.rm(root, { recursive: true, force: true }) })
  return { root, session, engine, scope, library, state, calls, batches, turn, context: () => globalContext(scope, session) }
}

test('GLOBAL and USER are distinct sourced records in one capture transaction and two model calls', async t => {
  const f = await fixture(t)
  assert.equal(f.context(), '')
  assert.equal((await f.engine.enqueueTurn(f.turn())).status, 'done')
  assert.deepEqual(f.calls.map(c => c.purpose), ['ctxkit.capture', 'ctxkit.organize'])
  assert.ok(f.batches[0].includes('GLOBAL.md') && f.batches[0].includes('USER.md'))
  const global = await f.engine.vault.read('GLOBAL.md'), user = await f.engine.vault.read('USER.md')
  const entry = readGlobalState(global)[0]
  assert.deepEqual(entry.sourceSeqs, [11]); assert.deepEqual(entry.evidence, ['observed'])
  assert.match(global.body, /observed/); assert.match(global.body, /2026-01-01/)
  assert.doesNotMatch(f.context(), /Prefer concise replies/)
  assert.doesNotMatch(preferenceContext(f.scope, f.session), /fictional test service/)
  assert.match((await f.engine.vault.read('INDEX.md')).body, /\(GLOBAL\.md\)/)
  for (const action of ['tree', 'recall']) {
    const result = await f.library.query({ action, ...(action === 'recall' ? { query: 'shared fictional' } : {}) }, { session: f.session })
    assert.ok(result.results.some(row => row.path === 'GLOBAL.md'))
  }
  const read = await f.library.query({ action: 'read', path: 'GLOBAL.md' }, { session: f.session })
  assert.equal(read.ok, true)
  f.state.withPreferences = false; f.state.text = 'The shared fictional test service has recovered.'
  assert.equal((await f.engine.enqueueTurn(f.turn(2))).status, 'done')
  assert.equal(f.calls[2].payload.currentGlobalState[0].text, entry.text)
  assert.equal(readGlobalState(await f.engine.vault.read('GLOBAL.md'))[0].text, f.state.text)
  assert.equal((await f.engine.vault.read('USER.md')).revision, user.revision)
  f.state.action = 'remove'
  assert.equal((await f.engine.enqueueTurn(f.turn(3))).status, 'done')
  assert.equal(readGlobalState(await f.engine.vault.read('GLOBAL.md')).length, 0)
  assert.match(f.context(), /"retiredIds":\["global_shared_service"\]/)
  assert.doesNotMatch(f.context(), /test service has recovered/)
  assert.equal((await f.engine.vault.read('USER.md')).revision, user.revision)
})

test('invalid global fact references refuse the entire capture, including otherwise valid preferences', async t => {
  const f = await fixture(t)
  f.state.transform = result => ({ ...result, globalState: [{ ...result.globalState[0], factIndexes: [9] }] })
  assert.equal((await f.engine.enqueueTurn(f.turn())).status, 'error')
  assert.equal(await f.engine.vault.maybeRead('GLOBAL.md'), null)
  assert.equal(await f.engine.vault.maybeRead('USER.md'), null)
  assert.equal(f.batches.length, 0)
})

test('planned shared facts retain their evidence label in Markdown and automatic context', async t => {
  const f = await fixture(t); f.state.evidence = 'planned'; f.state.text = 'The shared test service upgrade is planned, not deployed.'
  assert.equal((await f.engine.enqueueTurn(f.turn())).status, 'done')
  assert.deepEqual(readGlobalState(await f.engine.vault.read('GLOBAL.md'))[0].evidence, ['planned'])
  assert.match(f.context(), /"evidence":\["planned"\]/)
  assert.match(f.context(), /not a live check/)
})

test('organizer failure preserves shared state and recovery never re-extracts it', async t => {
  const f = await fixture(t); f.state.failOrganize = true
  assert.equal((await f.engine.enqueueTurn(f.turn())).status, 'error')
  const before = await f.engine.vault.read('GLOBAL.md')
  f.state.failOrganize = false
  const results = await f.engine.recover({ context: { session: f.session } })
  assert.equal(results[0].status, 'done')
  assert.equal(f.calls.filter(c => c.purpose === 'ctxkit.capture').length, 1)
  assert.equal((await f.engine.vault.read('GLOBAL.md')).revision, before.revision)
})

test('concurrent manual correction causes CAS conflict and keeps both root records safe', async t => {
  const f = await fixture(t); await f.engine.enqueueTurn(f.turn())
  const user = await f.engine.vault.read('USER.md'), originalText = f.state.text
  f.state.text = 'A newer generated service status.'
  f.state.beforeReturn = async engine => {
    const doc = await engine.vault.read('GLOBAL.md')
    await fs.writeFile(join(f.root, 'GLOBAL.md'), encode(doc.metadata, doc.body.replace(originalText, 'Manual service correction.')))
  }
  const result = await f.engine.enqueueTurn(f.turn(2))
  assert.equal(result.status, 'error'); assert.match(result.error, /^CONFLICT:/)
  assert.equal(readGlobalState(await f.engine.vault.read('GLOBAL.md'))[0].text, 'Manual service correction.')
  assert.equal((await f.engine.vault.read('USER.md')).revision, user.revision)
})

test('unmanaged GLOBAL stays intact; context refuses outside scope, cancellation and symlinks', async t => {
  const f = await fixture(t)
  await fs.writeFile(join(f.root, 'GLOBAL.md'), 'Existing personal document.')
  assert.equal((await f.engine.enqueueTurn(f.turn())).status, 'error')
  assert.equal(await fs.readFile(join(f.root, 'GLOBAL.md'), 'utf8'), 'Existing personal document.')
  assert.throws(f.context, { code: 'UNMANAGED' })
  assert.throws(() => globalContext(f.scope, { id: 'outside', header: { cwd: tmpdir() } }), { code: 'CTXKIT_SCOPE_DENIED' })
  assert.throws(() => globalContext(f.scope, f.session, AbortSignal.abort(Error('cancelled'))), /cancelled/)
  await fs.rename(join(f.root, 'GLOBAL.md'), join(f.root, 'saved.md'))
  await fs.symlink(join(f.root, 'saved.md'), join(f.root, 'GLOBAL.md'))
  assert.throws(f.context, { code: 'CTXKIT_SYMLINK_DENIED' })
})

test('older queued evidence cannot resurrect a shared item withdrawn by a newer session', async t => {
  const f = await fixture(t); let release
  f.engine.queue = new Promise(resolve => { release = resolve })
  const pending = f.engine.enqueueTurn(f.turn())
  const newer = globalStateChange(null, [{ id: 'global_shared_service', action: 'remove', sourceSeqs: [50], evidence: ['user_reported'] }], {
    source: 'sessions/session_other/checkpoints/cp_newer.md', observedAt: '2026-01-01T00:00:01.000Z', updatedAt: '2026-01-01T00:00:01.000Z' })
  try { await fs.writeFile(join(f.root, 'GLOBAL.md'), encode(newer.metadata, newer.body)) } finally { release() }
  assert.equal((await pending).status, 'done')
  assert.equal(readGlobalState(await f.engine.vault.read('GLOBAL.md')).length, 0)
})

test('escaped shared context is bounded and visibly truncated', async t => {
  const f = await fixture(t); let doc = null
  for (let i = 0; i < 10; i++) {
    const change = globalStateChange(doc, [{ id: 'global_example_' + i, action: 'set', category: 'fact', text: '<'.repeat(590), sourceSeqs: [i], evidence: ['observed'] }], {
      source: 'sessions/session_fictional/checkpoints/cp_fictional.md', observedAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' })
    doc = decode(encode(change.metadata, change.body), 'GLOBAL.md')
  }
  await fs.writeFile(join(f.root, 'GLOBAL.md'), encode(doc.metadata, doc.body))
  assert.ok(f.context().length < 8000); assert.match(f.context(), /"truncated":true/)
})

test('installed native SystemPrompt refreshes GLOBAL only as user-role context', { skip: !process.env.DSH_INSTALL_DIR }, async t => {
  const f = await fixture(t); await f.engine.enqueueTurn(f.turn())
  const require = createRequire(join(process.env.DSH_INSTALL_DIR, 'package.json'))
  const { Context } = await import(require.resolve('@deepseek-ai/cordis'))
  const { SystemPrompt, renderPrompt } = await import(require.resolve('@deepseek-ai/dsh-system-prompt'))
  const ctx = new Context(), fiber = ctx.plugin(SystemPrompt, {}); await fiber.await(); t.after(() => fiber.dispose())
  const dispose = ctx.systemPrompt.context({ name: 'fixture:global-state', order: 670, required: true, interpolate: false, text: f.context }); t.after(dispose)
  const assembly = await ctx.systemPrompt.assemble({ agent: { session: f.session } })
  assert.match(assembly.contexts.find(c => c.name === 'fixture:global-state').text, /fictional test service/)
  assert.doesNotMatch(renderPrompt(assembly), /fictional test service/)
  f.state.action = 'remove'; f.state.withPreferences = false; await f.engine.enqueueTurn(f.turn(2))
  const refreshed = ctx.systemPrompt.refreshContext(assembly, { agent: { session: f.session } })
  assert.match(refreshed.contexts.find(c => c.name === 'fixture:global-state').text, /"entries":\[\]/)
})
