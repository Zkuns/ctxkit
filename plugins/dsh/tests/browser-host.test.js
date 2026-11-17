import test from 'node:test'
import assert from 'node:assert/strict'
import * as fs from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { createScope, resolveConfig } from '../adapter.js'
import { Vault } from '../vault.js'
import { encode, sessionKey } from '../contracts.js'
import { createLibrary, LIBRARY_MAX_BYTES } from '../library.js'
import { registerBrowser, BROWSER_COMMAND } from '../browser-host.js'

async function fixture(t, options = {}) {
  const temp = await fs.realpath(await fs.mkdtemp(join(tmpdir(), 'ctxkit-browser-')))
  const root = join(temp, 'vault'), workspace = join(temp, 'workspace'), outside = join(temp, 'outside')
  await Promise.all([root, workspace, outside].map(path => fs.mkdir(path)))
  t.after(() => fs.rm(temp, { recursive: true, force: true }))
  const session = { id: 'fictional-session', header: { cwd: workspace, origin: 'user' } }
  const scope = createScope({ sandboxPolicy: { resolve: () => ({ mode: 'read-only' }) } },
    resolveConfig({ root, allowedWorkspaces: [workspace], provider: 'fictional', model: 'fictional' }))
  const vault = new Vault({ root, authorize: async () => assert.fail('Read operations must never write') })
  const adapter = { active: true, scope, engine: { vault, disposed: false },
    status: async () => ({ captureEligible: false, reason: 'CTXKIT_READ_ONLY', paused: false, pending: 0 }), ...options }
  const library = createLibrary(adapter)
  async function put(path, metadata, body = '# Fictional knowledge\n\nObserved local test; not deployed.') {
    await fs.mkdir(dirname(join(root, path)), { recursive: true })
    await fs.writeFile(join(root, path), encode(metadata, body))
  }
  async function job(id, value) {
    await fs.mkdir(join(root, '.ctxkit/jobs'), { recursive: true })
    await fs.writeFile(join(root, '.ctxkit/jobs', `${id}.json`), JSON.stringify({ id, sessionId: session.id, status: 'queued', ...value }))
  }
  return { temp, root, workspace, outside, session, adapter, vault, put, job, library,
    query: (args, context = { session }) => library.query(args, context) }
}
function fakeCommands() {
  const definitions = new Map()
  return { definitions, commands: { register(definition) { definitions.set(definition.name, definition); return () => definitions.delete(definition.name) } } }
}

test('inactive library reports a normal setup state with zero scope or filesystem access', async () => {
  const bomb = () => assert.fail('Inactive adapter accessed a service')
  const library = createLibrary({ active: false, get engine() { bomb() }, get scope() { bomb() } })
  assert.deepEqual(await library.query({ action: 'overview', cwd: '/forged' }, {}),
    { ok: true, configured: false, state: 'setup_required' })
})

test('every action gates reads by trusted current session, not request cwd or root', async t => {
  const f = await fixture(t)
  let calls = 0
  f.vault.list = async () => { calls++; return [] }
  f.vault.controls = async () => { calls++; return [] }
  f.vault.read = async () => { calls++; return {} }
  for (const action of ['overview', 'topics', 'sessions', 'status', 'read', 'recall']) {
    const args = { action, ...(action === 'read' ? { path: 'INDEX.md' } : {}) }
    assert.equal((await f.query(args, {})).error, 'CTXKIT_SESSION_REQUIRED')
    assert.equal((await f.query(args, { session: { id: 'outside', header: { cwd: f.outside } } })).error, 'CTXKIT_SCOPE_DENIED')
    assert.equal((await f.query({ ...args, cwd: f.workspace })).error, 'CTXKIT_QUERY_ARGUMENTS')
  }
  assert.equal(calls, 0)
})

test('complete topic and session pagination exceeds search top30 and stays read-only', async t => {
  const f = await fixture(t)
  for (let i = 0; i < 37; i++) {
    await f.put(`topics/topic_demo_${i}/OVERVIEW.md`, { kind: 'topic', id: `topic_demo_${i}`, title: `Atlas ${i}`, aliases: ['Fictional atlas'] })
    await f.put(`sessions/session_demo_${i}/SESSION.md`, { kind: 'session', id: `session_demo_${i}`, title: `Work ${i}` })
  }
  for (const action of ['topics', 'sessions']) {
    const paths = []
    let offset = 0
    do {
      const result = await f.query({ action, offset, limit: 7 })
      assert.equal(result.ok, true); assert.equal(result.total, 37)
      paths.push(...result.results.map(value => value.path)); offset = result.nextOffset
    } while (offset !== null)
    assert.equal(paths.length, 37); assert.equal(new Set(paths).size, 37)
  }
  const result = await f.query({ action: 'overview' })
  assert.equal(result.counts.topics, 37); assert.equal(result.counts.sessions, 37)
  assert.equal(result.processing.reason, 'CTXKIT_READ_ONLY')
  assert.equal(result.processing.captureEligible, false)
  assert.equal(await fs.stat(join(f.root, '.ctxkit')).catch(() => null), null)
})

test('recall and browsing share lexical queries, provenance and managed navigation', async t => {
  const f = await fixture(t), sessionPath = `sessions/${sessionKey(f.session.id)}/SESSION.md`
  const checkpointPath = sessionPath.replace('SESSION.md', 'checkpoints/cp_demo.md')
  await f.put('topics/topic_atlas/OVERVIEW.md', { kind: 'topic', id: 'topic_atlas', title: 'Atlas', aliases: ['Orion'], sources: [checkpointPath] })
  await f.put('topics/topic_atlas/docs/auth.md', { kind: 'document', topicId: 'topic_atlas', title: 'Authentication', sources: [checkpointPath] }, '# Authentication\n\nOrion uses offline keys.')
  await f.put(sessionPath, { kind: 'session', id: sessionKey(f.session.id), sessionId: f.session.id, title: 'Atlas work' })
  await f.put(checkpointPath, { kind: 'checkpoint', id: 'cp_demo', sessionId: f.session.id, title: 'Decision', topics: ['topic_atlas'], source: { sessionId: f.session.id, turn: 1, fromSeq: 1, toSeq: 4, sourceSeqs: [2] } })
  const recall = await f.query({ action: 'recall', query: 'Orion' })
  assert.equal(recall.method, 'lexical'); assert.equal(recall.untrusted, true)
  assert.equal(recall.results[0].path, 'topics/topic_atlas/OVERVIEW.md')
  assert.deepEqual(recall.results[0].metadata.sources, [checkpointPath])
  assert.match(recall.results[0].revision, /^[a-f0-9]{64}$/)
  assert.equal(recall.results[0].sessions[0].path, sessionPath)
  const sessions = await f.query({ action: 'sessions' })
  assert.equal(sessions.results[0].topics[0].id, 'topic_atlas')
  const read = await f.query({ action: 'read', path: 'topics/topic_atlas/OVERVIEW.md', offset: 2, limit: 10 })
  assert.equal(read.children[0].path, 'topics/topic_atlas/docs/auth.md')
  assert.equal(read.offset, 2); assert.equal(read.nextOffset, 12); assert.equal(read.body.length, 10)
  assert.equal((await f.query({ action: 'read', path: sessionPath })).children[0].path, checkpointPath)
})

test('processing is paginated current-session metadata without payloads, raw errors or source', async t => {
  const f = await fixture(t)
  for (let i = 0; i < 35; i++) await f.job(`cp_${i}`, { status: 'error', error: 'MODEL: /private/fictional-secret-provider-response', cwd: '/private/fictional-workspace', note: 'DO_NOT_RETURN', source: { raw: 'NO_TRANSCRIPTS' }, text: 'NO_TRANSCRIPTS', attempts: 2 })
  await f.job('cp_other', { sessionId: 'unrelated-session', status: 'done' })
  const one = await f.query({ action: 'status', query: 'error', limit: 30 })
  const two = await f.query({ action: 'status', query: 'error', offset: one.nextOffset, limit: 30 })
  assert.equal(one.total, 35); assert.equal(two.results.length, 5)
  assert.deepEqual(one.counts, { error: 35 })
  assert.equal(one.processing.captureEligible, false)
  assert.doesNotMatch(JSON.stringify(one), /private|DO_NOT_RETURN|NO_TRANSCRIPTS|unrelated-session|cwd|source/)
  assert.equal(one.results[0].error, 'CTXKIT_QUERY_FAILED')
})

test('recognized processing filters match exact status, not retained errors or IDs', async t => {
  const f = await fixture(t)
  await f.job('cp_failed', { status: 'error', error: 'CTXKIT_QUERY_FAILED' })
  await f.job('cp_error_recovered', { status: 'done', error: 'CTXKIT_QUERY_FAILED' })
  await f.job('cp_error_queued', { status: 'queued' })
  const failures = await f.query({ action: 'status', query: 'ERROR' })
  assert.equal(failures.total, 1)
  assert.equal(failures.results[0].id, 'cp_failed')
  assert.equal((await f.query({ action: 'status', query: 'done' })).results[0].id, 'cp_error_recovered')
  assert.equal((await f.query({ action: 'status', query: 'recovered' })).results[0].id, 'cp_error_recovered')
  assert.equal((await f.query({ action: 'status' })).total, 3)
})

test('read rejects traversal, hidden state, unmanaged Markdown and symlinks', async t => {
  const f = await fixture(t)
  for (const path of ['../secret.md', '/secret.md', '.ctxkit/jobs/cp_demo.json', 'topics/.hidden.md', 'transcript.md', 'topics/topic_atlas/docs/../../secret.md', 'topics\\topic_atlas\\OVERVIEW.md']) {
    assert.equal((await f.query({ action: 'read', path })).ok, false)
  }
  await fs.mkdir(join(f.root, 'topics/topic_atlas'), { recursive: true })
  await fs.writeFile(join(f.root, 'topics/topic_atlas/OVERVIEW.md'), 'Not managed')
  assert.equal((await f.query({ action: 'read', path: 'topics/topic_atlas/OVERVIEW.md' })).error, 'UNMANAGED')
  await fs.symlink(f.outside, join(f.root, 'topics/topic_link'))
  assert.equal((await f.query({ action: 'read', path: 'topics/topic_link/OVERVIEW.md' })).error, 'CTXKIT_SYMLINK_DENIED')
  assert.equal((await f.query({ action: 'topics' })).ok, false)
})

test('scope and root are rechecked after each awaited vault or readiness operation', async t => {
  for (const target of ['list', 'read', 'controls', 'status']) {
    const f = await fixture(t)
    await f.put('topics/topic_atlas/OVERVIEW.md', { kind: 'topic', id: 'topic_atlas', title: 'NEVER_LEAK' })
    const owner = target === 'status' ? f.adapter : f.vault
    const operation = owner[target].bind(owner)
    owner[target] = async (...args) => {
      const result = await operation(...args)
      f.session.header.cwd = f.outside
      return result
    }
    const args = target === 'read' ? { action: 'read', path: 'topics/topic_atlas/OVERVIEW.md' } : { action: target === 'controls' || target === 'status' ? 'status' : 'topics' }
    const result = await f.query(args)
    assert.equal(result.error, 'CTXKIT_SCOPE_DENIED'); assert.doesNotMatch(JSON.stringify(result), /NEVER_LEAK/)
  }
  const f = await fixture(t), operation = f.vault.list.bind(f.vault)
  f.vault.list = async () => {
    const result = await operation()
    await fs.rename(f.root, `${f.root}-saved`)
    await fs.symlink(f.outside, f.root)
    return result
  }
  assert.equal((await f.query({ action: 'topics' })).ok, false)
})

test('serialized Unicode output is hard capped and cursors never skip omitted rows or text', async t => {
  const f = await fixture(t, { maxOutputChars: 4096 })
  for (let i = 0; i < 10; i++) await f.put(`topics/topic_${i}/OVERVIEW.md`, { kind: 'topic', id: `topic_${i}`, title: '界'.repeat(180), privateExtra: 'DO_NOT_RETURN', cwd: '/private/workspace' }, '界\\\"\n'.repeat(3000))
  const result = await f.query({ action: 'topics', limit: 10 })
  assert.equal(result.ok, true); assert.equal(result.truncated, true)
  assert.equal(result.nextOffset, result.results.length)
  assert.ok(Buffer.byteLength(JSON.stringify(result)) <= 4096)
  assert.doesNotMatch(JSON.stringify(result), /DO_NOT_RETURN|privateExtra|cwd/)
  const read = await f.query({ action: 'read', path: 'topics/topic_0/OVERVIEW.md' })
  assert.equal(read.ok, true); assert.equal(read.truncated, true)
  assert.ok(Buffer.byteLength(JSON.stringify(read)) <= 4096)
  assert.equal(read.nextOffset, read.body.length)
  const next = await f.query({ action: 'read', path: 'topics/topic_0/OVERVIEW.md', offset: read.nextOffset })
  assert.equal(next.offset, read.body.length)
  assert.ok(Buffer.byteLength(JSON.stringify(next)) <= LIBRARY_MAX_BYTES)
})

test('bridge dispatches the identical shared operation with loaded session and safe teardown', async t => {
  const f = await fixture(t), ctx = fakeCommands()
  await f.put('topics/topic_atlas/OVERVIEW.md', { kind: 'topic', id: 'topic_atlas', title: 'Atlas' })
  const remove = registerBrowser(ctx, f.library), definition = ctx.definitions.get(BROWSER_COMMAND)
  const args = { action: 'topics' }, invocation = { agent: { session: f.session }, rawInput: JSON.stringify(args), attachments: [], signal: new AbortController().signal }
  const ui = await definition.handler(invocation)
  assert.equal(ui.kind, 'success'); assert.deepEqual(JSON.parse(ui.text), await f.query(args))
  const forged = await definition.handler({ ...invocation, rawInput: JSON.stringify({ ...args, session: f.session, root: f.root }) })
  assert.equal(JSON.parse(forged.text).error, 'CTXKIT_QUERY_ARGUMENTS')
  assert.equal(JSON.parse((await definition.handler({ ...invocation, rawInput: '{bad' })).text).error, 'CTXKIT_QUERY_ARGUMENTS')
  assert.equal(definition.recordInput, false)
  remove(); remove(); assert.equal(ctx.definitions.size, 0)
  assert.equal(JSON.parse((await definition.handler(invocation)).text).error, 'CTXKIT_DISPOSED')
})

test('bridge cancels an in-flight result on unload and sanitizes thrown errors', async () => {
  const ctx = fakeCommands()
  let release
  const result = new Promise(resolve => { release = resolve })
  const remove = registerBrowser(ctx, { query: async () => result })
  const handler = ctx.definitions.get(BROWSER_COMMAND).handler
  const pending = handler({ agent: { session: {} }, rawInput: '{}', signal: new AbortController().signal })
  remove(); release({ ok: true, secret: 'DO_NOT_RETURN' })
  assert.equal(JSON.parse((await pending).text).error, 'CTXKIT_DISPOSED')
  const other = fakeCommands()
  registerBrowser(other, { query: async () => { throw new Error('/private/DO_NOT_RETURN') } })
  assert.doesNotMatch((await other.definitions.get(BROWSER_COMMAND).handler({ agent: { session: {} }, rawInput: '{}' })).text, /private|DO_NOT_RETURN/)
})

test('argument bounds, disposal, cancellation and error serialization fail closed', async t => {
  const f = await fixture(t, { maxOutputChars: 128 })
  for (const args of [{ action: 'retry' }, { limit: 51 }, { offset: -1 }, { query: 'a'.repeat(501) }, { action: 'read', path: 'INDEX.md', limit: 18001 }, { sessionId: 'forged' }]) {
    assert.equal((await f.query(args)).error, 'CTXKIT_QUERY_ARGUMENTS')
  }
  f.vault.list = async () => { throw Object.assign(new Error('/private/NEVER_RETURN'), { code: `CTXKIT_${'A'.repeat(70)}` }) }
  const failed = await f.query({ action: 'topics' })
  assert.equal(failed.ok, false); assert.ok(Buffer.byteLength(JSON.stringify(failed)) <= 128)
  assert.doesNotMatch(JSON.stringify(failed), /private|NEVER_RETURN/)
  const controller = new AbortController(); controller.abort()
  assert.equal((await f.query({ action: 'overview' }, { session: f.session, signal: controller.signal })).error, 'CTXKIT_CANCELLED')
  f.adapter.engine.disposed = true
  assert.equal((await f.query({ action: 'overview' })).error, 'CTXKIT_DISPOSED')
})

test('topics sort by title and sessions by newest activity with stable ties', async t => {
  const f = await fixture(t)
  await f.put('topics/topic_z/OVERVIEW.md', { kind: 'topic', id: 'topic_z', title: 'Alpha' })
  await f.put('topics/topic_a/OVERVIEW.md', { kind: 'topic', id: 'topic_a', title: 'Zulu' })
  await f.put('sessions/session_a/SESSION.md', { kind: 'session', id: 'session_a', title: 'Earlier', updatedAt: '2026-01-01T00:00:00Z' })
  await f.put('sessions/session_z/SESSION.md', { kind: 'session', id: 'session_z', title: 'Later', updatedAt: '2026-02-01T00:00:00Z' })
  assert.equal((await f.query({ action: 'topics' })).results[0].title, 'Alpha')
  assert.equal((await f.query({ action: 'sessions' })).results[0].title, 'Later')
})

test('read derives both relation directions and clips untrusted metadata', async t => {
  const f = await fixture(t)
  await f.put('topics/topic_a/OVERVIEW.md', { kind: 'topic', id: 'topic_a', title: 'Atlas', aliases: Array.from({ length: 20 }, (_, i) => `alias-${i}`), cwd: '/private/DO_NOT_RETURN', relations: [{ to: 'topic_b', type: 'uses', reason: 'Synthetic relation', sources: ['.ctxkit/jobs/raw.json'] }] })
  await f.put('topics/topic_b/OVERVIEW.md', { kind: 'topic', id: 'topic_b', title: 'Beacon', relations: [{ to: 'topic_a', type: 'depends_on', reason: 'Synthetic reverse relation' }] })
  const result = await f.query({ action: 'read', path: 'topics/topic_a/OVERVIEW.md' })
  assert.equal(result.related.length, 2); assert.equal(result.metadata.aliases.length, 8)
  assert.equal(result.metadataTruncated, true)
  assert.equal(result.related[0].from, 'topic_a'); assert.equal(result.related[1].to, 'topic_a')
  assert.doesNotMatch(JSON.stringify(result), /DO_NOT_RETURN|raw.json|cwd/)
})

// Real installed Commands runtime, synthetic session append sink only. No profile,
// actual session log, LLM, network, or personal data is opened.
test('installed native Commands registry invokes bridge with exact receiving Session', { skip: !process.env.DSH_INSTALL_DIR }, async t => {
  const require = createRequire(join(process.env.DSH_INSTALL_DIR, 'package.json'))
  const load = name => import(pathToFileURL(require.resolve(name)).href)
  const { Context } = await load('@deepseek-ai/cordis')
  const { CommandRuntime } = await load('@deepseek-ai/dsh-commands')
  const ctx = new Context()
  const fiber = ctx.plugin(CommandRuntime)
  await fiber.await()
  t.after(() => ctx.fiber.dispose())
  const events = [], session = { id: 'synthetic-native', header: { cwd: '/fictional' }, append(type, data) { events.push({ type, data }); return { seq: events.length - 1 } } }
  const agent = { session }
  let received
  const dispose = registerBrowser(ctx, { query: async (args, context) => { received = context.session; return { ok: true, action: args.action } } })
  const execution = await ctx.commands.execute(agent, '/ctxkit-library {"action":"topics"}', [], new AbortController().signal)
  assert.equal(received, session)
  assert.deepEqual(JSON.parse(execution.result.text), { ok: true, action: 'topics' })
  assert.deepEqual(events.map(event => event.type), ['command/run', 'command/done'])
  assert.equal(events[0].data.args, undefined)
  dispose()
  assert.equal(await ctx.commands.execute(agent, '/ctxkit-library {}', [], new AbortController().signal), undefined)
})
