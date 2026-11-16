import test from 'node:test'
import assert from 'node:assert/strict'
import * as fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { Engine } from '../engine.js'
import { Vault } from '../vault.js'
import { checkpointKey, sessionKey, encode, hash, validateCapture, validatePlan } from '../contracts.js'

// All fixtures are synthetic and all writes stay inside isolated temporary roots.
const context = { sessionId: 's1' }
const authorize = async () => {}
const topicPath = id => `topics/${id}/OVERVIEW.md`
const turn = (root, extra = {}) => ({ sessionId: 's1', cwd: root, turn: 1, fromSeq: 10, toSeq: 14, sourceSeqs: [10, 12, 14], text: '[10] User requested Atlas deployment.\n[12] Local validation passed.\n[14] Deployment remains unexecuted.', context, ...extra })
const capture = payload => ({ meaningful: true, title: 'Atlas validation', summary: 'Local validation passed; production deployment was not executed.', next: 'Check production prerequisites.', topicHints: ['Atlas'], facts: [{ text: 'Local validation passed; production is unverified.', kind: 'result', evidence: 'observed', sourceSeqs: [payload.allowedSourceSeqs?.[0] ?? payload.source.fromSeq] }] })
const topic = (id = 'topic_atlas', extra = {}) => ({ id, title: id === 'topic_atlas' ? 'Atlas' : 'Release procedures', aliases: [], scope: 'Synthetic project knowledge', body: '# Atlas\n\nLocal validation passed.\n\n- [Deployment](docs/deployment.md)\n- [Deploy draft](skills/deploy/SKILL.md)', expectedRevision: null, ...extra })
const plan = (extra = {}) => ({ topics: [topic()], documents: [], relations: [], note: '', ...extra })
const change = (relative, body, expectedRevision = null, metadata = {}) => ({ path: relative, expectedRevision, metadata: { kind: 'document', title: relative, ...metadata }, body })
const stagePath = input => `sessions/${sessionKey(input.sessionId)}/checkpoints/${checkpointKey(input)}.md`
const json = value => JSON.stringify(value)
function deferred() { let resolve; const promise = new Promise(r => { resolve = r }); return { promise, resolve } }
async function fixture(t, options = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ctxkit-core-'))
  const calls = []
  const generate = async request => {
    const payload = JSON.parse(request.user)
    calls.push({ purpose: request.purpose, payload, signal: request.signal, context: request.context })
    if (options.generate) return options.generate(request, payload)
    return json(request.purpose === 'ctxkit.capture' ? capture(payload) : plan())
  }
  const engine = new Engine({ root, authorize, generate, now: () => '2026-01-01T00:00:00.000Z', ...options, generate })
  t.after(async () => { engine.dispose(); await engine.queue; await fs.rm(root, { recursive: true, force: true }) })
  return { root, engine, vault: engine.vault, calls, input: turn(root) }
}
async function filesBelow(root, dir = '') {
  const out = []
  for (const entry of await fs.readdir(path.join(root, dir), { withFileTypes: true })) {
    const name = dir ? `${dir}/${entry.name}` : entry.name
    if (entry.isDirectory()) out.push(...await filesBelow(root, name))
    else out.push(name)
  }
  return out.sort()
}

test('automatic capture/organize creates sourced session, checkpoint, two topics, relation and inert skill draft', async t => {
  const f = await fixture(t, { generate: async (request, payload) => {
    assert.deepEqual(request.context, context)
    assert.equal(Object.hasOwn(request, 'tools'), false)
    if (request.purpose === 'ctxkit.capture') {
      assert.deepEqual(payload.source, { sessionId: 's1', turn: 1, fromSeq: 10, toSeq: 14 })
      return json(capture(payload))
    }
    assert.equal(request.purpose, 'ctxkit.organize')
    return json(plan({
      topics: [topic(), topic('topic_release', { body: '# Release procedures\n\nReusable validation method.' })],
      documents: [
        { topicId: 'topic_atlas', path: 'docs/deployment.md', title: 'Deployment architecture', body: '# Deployment\n\nProduction was not deployed.', expectedRevision: null },
        { topicId: 'topic_atlas', path: 'skills/deploy/SKILL.md', title: 'Deployment draft', body: '# Deploy\n\n## Scope\nAtlas only.\n## Prerequisites\nExplicit production permission.\n## Steps\nBuild, then deploy only when authorized.\n## Validation\nCheck health.\n## Failure\nStop and investigate.\n## Limits\nOnly local validation is observed.', expectedRevision: null },
      ],
      relations: [{ from: 'topic_atlas', to: 'topic_release', type: 'uses', reason: 'Atlas reused the documented local validation procedure.' }],
    }))
  } })
  const result = await f.engine.enqueueTurn(f.input)
  assert.equal(result.status, 'done', result.error)
  assert.deepEqual(f.calls.map(c => c.purpose), ['ctxkit.capture', 'ctxkit.organize'])
  const checkpoint = await f.vault.read(stagePath(f.input))
  assert.equal(checkpoint.metadata.organized, true)
  assert.deepEqual(checkpoint.metadata.topics, ['topic_atlas', 'topic_release'])
  assert.deepEqual(checkpoint.metadata.source.sourceSeqs, [10, 12, 14])
  const session = await f.vault.read(`sessions/${sessionKey('s1')}/SESSION.md`)
  assert.deepEqual(session.metadata.topics, ['topic_atlas', 'topic_release'])
  assert.match(session.body, /Check production prerequisites/)
  const draft = await f.vault.read('topics/topic_atlas/skills/deploy/SKILL.md')
  assert.equal(draft.metadata.kind, 'skill-draft')
  assert.equal(draft.metadata.status, 'draft')
  assert.equal(draft.metadata.executable, false)
  assert.deepEqual(draft.metadata.sources, [checkpoint.path])
  assert.match(draft.body, /not installed or authorized/)
  assert.deepEqual(await f.vault.related('topic_atlas'), await f.vault.related('topic_release'))
  assert.equal((await f.vault.related('topic_release'))[0].from, 'topic_atlas')
  assert.match((await f.vault.read('INDEX.md')).body, /topic_atlas\/OVERVIEW.md/)
  const statuses = await f.engine.status('s1')
  assert.equal(statuses.jobs[0].status, 'done')
  assert.equal((await filesBelow(f.root)).some(name => name.endsWith('.sh')), false)
})

test('replaying a completed turn is byte-idempotent, including after an engine restart', async t => {
  const f = await fixture(t)
  assert.equal((await f.engine.enqueueTurn(f.input)).status, 'done')
  const names = await filesBelow(f.root)
  const before = await Promise.all(names.map(name => fs.readFile(path.join(f.root, name), 'utf8')))
  assert.equal((await f.engine.enqueueTurn(f.input)).duplicate, true)
  const restarted = new Engine({ root: f.root, authorize, generate: async () => assert.fail('duplicate must not invoke model') })
  t.after(() => restarted.dispose())
  assert.equal((await restarted.enqueueTurn(f.input)).duplicate, true)
  assert.deepEqual(await filesBelow(f.root), names)
  assert.deepEqual(await Promise.all(names.map(name => fs.readFile(path.join(f.root, name), 'utf8'))), before)
  assert.equal(f.calls.length, 2)
})

test('meaningless turns skip without checkpoint, session or topic and are deduplicated', async t => {
  const f = await fixture(t, { generate: async request => { assert.equal(request.purpose, 'ctxkit.capture'); return json({ meaningful: false }) } })
  assert.equal((await f.engine.enqueueTurn(f.input)).status, 'skipped')
  assert.equal((await f.engine.enqueueTurn(f.input)).duplicate, true)
  assert.equal(f.calls.length, 1)
  assert.deepEqual(await f.vault.list(), [])
  const job = (await f.vault.controls('jobs'))[0].value
  assert.equal(Object.hasOwn(job, 'text'), false)
  assert.equal(json(job).includes('User requested'), false)
})

test('successive turns retain one session and both checkpoints; separate sessions get separate identities', async t => {
  const f = await fixture(t, { generate: async (request, payload) => {
    if (request.purpose === 'ctxkit.capture') return json(capture(payload))
    const old = payload.readableDocuments.find(d => d.path === topicPath('topic_atlas'))
    return json(plan({ topics: [topic('topic_atlas', { expectedRevision: old?.revision ?? null })] }))
  } })
  assert.equal((await f.engine.enqueueTurn(f.input)).status, 'done')
  const second = turn(f.root, { turn: 2, fromSeq: 20, toSeq: 24, sourceSeqs: [20, 24] })
  assert.equal((await f.engine.enqueueTurn(second)).status, 'done')
  const third = turn(f.root, { sessionId: 's2', context: { session: { id: 's2' } } })
  assert.equal((await f.engine.enqueueTurn(third)).status, 'done')
  const docs = await f.vault.list()
  assert.equal(docs.filter(d => d.metadata.kind === 'session').length, 2)
  assert.equal(docs.filter(d => d.metadata.kind === 'checkpoint' && d.metadata.sessionId === 's1').length, 2)
  assert.equal((await f.vault.read(topicPath('topic_atlas'))).metadata.sources.length, 3)
})

for (const sourceSeqs of [[9], [15], [11], [10.5], []]) {
  test(`capture rejects out-of-range, omitted or invalid source citations: ${json(sourceSeqs)}`, async t => {
    const f = await fixture(t, { generate: async (request, payload) => {
      assert.equal(request.purpose, 'ctxkit.capture')
      const value = capture(payload); value.facts[0].sourceSeqs = sourceSeqs
      return json(value)
    } })
    const result = await f.engine.enqueueTurn(f.input)
    assert.equal(result.status, 'error')
    assert.match(result.error, /^SOURCE:/)
    assert.deepEqual(await f.vault.list(), [])
  })
}

test('stale revision rejects the complete organize batch and preserves external changes', async t => {
  let root
  let externallyWritten
  const f = await fixture(t, { generate: async (request, payload) => {
    if (request.purpose === 'ctxkit.capture') return json(capture(payload))
    const old = payload.readableDocuments.find(d => d.path === topicPath('topic_atlas'))
    assert.ok(old, 'fixture must actually expose full topic to organizer')
    externallyWritten = encode(old.metadata, '# Atlas\n\nExternal writer has newer facts.')
    await fs.writeFile(path.join(root, old.path), externallyWritten)
    return json(plan({ topics: [topic('topic_atlas', { expectedRevision: old.revision })] }))
  } })
  root = f.root
  await f.vault.commit([change(topicPath('topic_atlas'), '# Atlas\n\nOld knowledge.', null, { kind: 'topic', id: 'topic_atlas', title: 'Atlas', aliases: [], scope: 'Atlas', relations: [] })], context)
  const result = await f.engine.enqueueTurn(f.input)
  assert.equal(result.status, 'error')
  assert.match(result.error, /^CONFLICT:/)
  assert.equal(await fs.readFile(path.join(f.root, topicPath('topic_atlas')), 'utf8'), externallyWritten)
  assert.equal((await f.vault.read(stagePath(f.input))).metadata.organized, false)
  assert.equal(await f.vault.raw('INDEX.md'), null)
})

test('organize cannot update a catalog-only topic even when its correct revision is guessed', async t => {
  let hiddenRevision
  const hidden = topicPath('topic_hidden')
  const f = await fixture(t, { generate: async (request, payload) => {
    if (request.purpose === 'ctxkit.capture') return json(capture(payload))
    assert.ok(payload.catalog.some(item => item.id === 'topic_hidden'))
    assert.equal(payload.readableDocuments.some(item => item.path === hidden), false)
    return json(plan({ topics: [topic('topic_hidden', { expectedRevision: hiddenRevision, title: 'Hidden unrelated topic', body: '# Overwritten' })] }))
  } })
  await f.vault.commit([change(hidden, '# Quasar\n\nUnique unrelated knowledge.', null, { kind: 'topic', id: 'topic_hidden', title: 'Quasar', scope: 'Orbital mechanics', aliases: [], relations: [] })], context)
  const before = await f.vault.raw(hidden); hiddenRevision = hash(before)
  const result = await f.engine.enqueueTurn(f.input)
  assert.equal(result.status, 'error')
  assert.match(result.error, /not fully read/)
  assert.equal(await f.vault.raw(hidden), before)
})

test('an existing document cannot be overwritten with a null expected revision', async t => {
  const f = await fixture(t)
  await f.vault.commit([change(topicPath('topic_atlas'), '# Atlas\n\nDo not overwrite.', null, { kind: 'topic', id: 'topic_atlas', title: 'Atlas', scope: 'Atlas', aliases: [], relations: [] })], context)
  const before = await f.vault.raw(topicPath('topic_atlas'))
  const result = await f.engine.enqueueTurn(f.input)
  assert.equal(result.status, 'error')
  assert.match(result.error, /^CONFLICT:/)
  assert.equal(await f.vault.raw(topicPath('topic_atlas')), before)
})

test('plan rejects traversal, absolute, hidden and executable output paths', () => {
  for (const invalid of ['../escape.md', '/tmp/escape.md', 'docs/../../escape.md', 'docs/.secret.md', 'docs\\escape.md', 'skills/deploy/run.sh', 'skills/deploy/../SKILL.md']) {
    assert.throws(() => validatePlan(plan({ documents: [{ topicId: 'topic_atlas', path: invalid, title: 'Unsafe', body: 'Must not write.', expectedRevision: null }] })), error => error.code === 'PATH', invalid)
  }
})

test('vault refuses traversal and symlink roots, ancestors and files without touching outside data', async t => {
  const f = await fixture(t)
  const outside = await fs.mkdtemp(path.join(os.tmpdir(), 'ctxkit-outside-'))
  t.after(() => fs.rm(outside, { recursive: true, force: true }))
  const sentinel = path.join(outside, 'sentinel.md')
  await fs.writeFile(sentinel, 'external sentinel')
  await assert.rejects(f.vault.raw('../sentinel.md'), error => error.code === 'PATH')
  await assert.rejects(f.vault.raw(sentinel), error => error.code === 'PATH')
  await fs.symlink(outside, path.join(f.root, 'topics'))
  await assert.rejects(f.vault.raw('topics/sentinel.md'), error => error.code === 'SYMLINK')
  await assert.rejects(f.vault.commit([change('topics/new.md', 'unsafe')], context), error => error.code === 'SYMLINK')
  await fs.symlink(sentinel, path.join(f.root, 'linked.md'))
  await assert.rejects(f.vault.read('linked.md'), error => error.code === 'SYMLINK')
  const linkedRoot = path.join(outside, 'vault-link')
  await fs.symlink(f.root, linkedRoot)
  await assert.rejects(new Vault({ root: linkedRoot, authorize }).read('INDEX.md'), error => error.code === 'ROOT')
  assert.equal(await fs.readFile(sentinel, 'utf8'), 'external sentinel')
  assert.equal(await fs.stat(path.join(outside, 'new.md')).then(() => true, () => false), false)
})

test('unmanaged Markdown is never overwritten', async t => {
  const f = await fixture(t)
  await fs.writeFile(path.join(f.root, 'INDEX.md'), '# User-owned index\n')
  await assert.rejects(f.vault.commit([change('INDEX.md', 'replace', hash('# User-owned index\n'))], context), error => error.code === 'UNMANAGED')
  assert.equal(await fs.readFile(path.join(f.root, 'INDEX.md'), 'utf8'), '# User-owned index\n')
})

test('denied writes fail before model invocation and leave the root empty', async t => {
  const f = await fixture(t, { authorize: async (paths, ctx) => {
    assert.deepEqual(ctx, context)
    assert.ok(paths.length)
    throw Object.assign(new Error('Read-only session'), { code: 'PERMISSION' })
  } })
  await assert.rejects(f.engine.enqueueTurn(f.input), error => error.code === 'PERMISSION')
  assert.equal(f.calls.length, 0)
  assert.deepEqual(await fs.readdir(f.root), [])
})

test('pause is persisted and blocks captures after restart, then unpause resumes normally', async t => {
  const f = await fixture(t)
  assert.deepEqual(await f.engine.setPaused('s1', true, context), { paused: true, persisted: true })
  assert.equal((await f.engine.enqueueTurn(f.input)).status, 'paused')
  assert.equal(f.calls.length, 0)
  const restarted = new Engine({ root: f.root, authorize, generate: async () => assert.fail('paused capture') })
  t.after(() => restarted.dispose())
  assert.equal((await restarted.enqueueTurn(f.input)).status, 'paused')
  assert.equal((await f.engine.status('s1')).totalJobs, 0)
  await f.engine.setPaused('s1', false, context)
  assert.equal((await f.engine.enqueueTurn(f.input)).status, 'done')
})

test('pausing while capture awaits the model prevents checkpoint and topic writes', async t => {
  const entered = deferred(); const release = deferred()
  const f = await fixture(t, { generate: async (request, payload) => {
    assert.equal(request.purpose, 'ctxkit.capture')
    entered.resolve(); await release.promise
    return json(capture(payload))
  } })
  const running = f.engine.enqueueTurn(f.input)
  await entered.promise
  await f.engine.setPaused('s1', true, context)
  release.resolve()
  assert.equal((await running).status, 'paused')
  assert.deepEqual(await f.vault.list(), [])
})

test('organization failure recovers the saved checkpoint without re-capturing or reloading transcript', async t => {
  const f = await fixture(t, { generate: async (request, payload) => {
    if (request.purpose === 'ctxkit.capture') return json(capture(payload))
    throw new Error('Synthetic organizer outage')
  } })
  const failed = await f.engine.enqueueTurn(f.input)
  assert.equal(failed.status, 'error')
  const before = await f.vault.read(stagePath(f.input))
  assert.equal(before.metadata.organized, false)
  f.engine.dispose()
  const purposes = []
  const restarted = new Engine({ root: f.root, authorize, generate: async request => {
    purposes.push(request.purpose)
    assert.equal(request.purpose, 'ctxkit.organize')
    return json(plan())
  } })
  t.after(() => restarted.dispose())
  const results = await restarted.recover({ context: { session: { id: 's1' } }, resolveTurn: async () => assert.fail('saved checkpoint needs no raw source') })
  assert.equal(results.length, 1)
  assert.equal(results[0].status, 'done', results[0].error)
  assert.deepEqual(purposes, ['ctxkit.organize'])
  const after = await restarted.vault.read(stagePath(f.input))
  assert.equal(after.body, before.body)
  assert.equal(after.metadata.organized, true)
  assert.equal((await restarted.status('s1')).jobs[0].status, 'done')
})

test('missing unsaved source becomes waiting_source, and recovery is scoped to current session', async t => {
  const f = await fixture(t, { generate: async () => { throw new Error('Synthetic capture outage') } })
  assert.equal((await f.engine.enqueueTurn(f.input)).status, 'error')
  assert.deepEqual(await f.engine.recover({ context: { sessionId: 'other' } }), [])
  const results = await f.engine.recover({ context })
  assert.equal(results[0].status, 'waiting_source')
  assert.equal(f.calls.length, 1)
  await assert.rejects(f.engine.recover(), error => error.code === 'SCOPE')
})

async function interruptedJournal(t) {
  const f = await fixture(t)
  const paths = ['topics/topic_atlas/docs/a.md', 'topics/topic_atlas/docs/b.md', 'topics/topic_atlas/docs/c.md']
  await f.vault.commit(paths.map(p => change(p, `old:${p}`)), context, { sessionId: 's1' })
  const previous = await Promise.all(paths.map(p => f.vault.read(p)))
  let failOnce = true
  const writer = new Vault({ root: f.root, authorize, publishText: async ({ relativePath, text }) => {
    if (relativePath === paths[1] && failOnce) { failOnce = false; throw new Error('Synthetic crash after first published target') }
    const target = path.join(f.root, relativePath)
    await fs.mkdir(path.dirname(target), { recursive: true })
    await fs.writeFile(target, text)
  } })
  await assert.rejects(writer.commit(paths.map((p, i) => change(p, `new:${p}`, previous[i].revision)), context, { sessionId: 's1' }), /Synthetic crash/)
  return { ...f, paths, previous }
}

test('partial journal recovery is idempotent and resumes only the owning session', async t => {
  const f = await interruptedJournal(t)
  assert.match((await f.vault.read(f.paths[0])).body, /^new:/)
  assert.match((await f.vault.read(f.paths[1])).body, /^old:/)
  assert.deepEqual(await f.vault.recoverTransactions({ sessionId: 's2' }, 's2'), [])
  const recovered = await f.vault.recoverTransactions(context, 's1')
  assert.equal(recovered.length, 1)
  for (const p of f.paths) assert.match((await f.vault.read(p)).body, /^new:/)
  assert.deepEqual(await f.vault.recoverTransactions(context, 's1'), [])
  assert.equal((await f.vault.controls('transactions')).some(t => t.value.status === 'prepared'), false)
})

test('partial journal recovery preflights all targets and never overwrites an external edit', async t => {
  const f = await interruptedJournal(t)
  const external = encode(f.previous[2].metadata, 'External newer content — retain exactly.')
  await fs.writeFile(path.join(f.root, f.paths[2]), external)
  const before = await Promise.all(f.paths.map(p => f.vault.raw(p)))
  await assert.rejects(f.vault.recoverTransactions(context, 's1'), error => error.code === 'CONFLICT')
  assert.deepEqual(await Promise.all(f.paths.map(p => f.vault.raw(p))), before)
  assert.equal((await f.vault.controls('transactions')).filter(t => t.value.status === 'prepared').length, 1)
  await assert.rejects(f.vault.commit([change('topics/topic_atlas/docs/unrelated.md', 'Blocked until recovery')], context), error => error.code === 'RECOVERY_REQUIRED')
})

test('dispose aborts in-flight generation, performs no subsequent writes, and rejects new jobs', async t => {
  const entered = deferred(); const release = deferred()
  let signal
  const f = await fixture(t, { generate: async (request, payload) => {
    signal = request.signal
    entered.resolve(); await release.promise
    return json(capture(payload))
  } })
  const running = f.engine.enqueueTurn(f.input)
  await entered.promise
  const names = await filesBelow(f.root)
  const before = await Promise.all(names.map(name => fs.readFile(path.join(f.root, name), 'utf8')))
  f.engine.dispose()
  assert.equal(signal.aborted, true)
  release.resolve()
  const result = await running
  assert.equal(result.status, 'error')
  assert.deepEqual(await filesBelow(f.root), names)
  assert.deepEqual(await Promise.all(names.map(name => fs.readFile(path.join(f.root, name), 'utf8'))), before)
  assert.equal(await f.vault.raw(stagePath(f.input)), null)
  await assert.rejects(f.engine.enqueueTurn(f.input), /disposed/)
})

test('source and model output common credential patterns are redacted before publication', async t => {
  const secret = 'sk-abcdefghijklmnopqrstuvwxy123456'
  const f = await fixture(t, { generate: async (request, payload) => {
    assert.equal(request.user.includes(secret), false)
    if (request.purpose === 'ctxkit.capture') return json({ ...capture(payload), summary: `Token must be redacted: ${secret}` })
    return json(plan({ topics: [topic('topic_atlas', { body: `# Atlas\nToken: ${secret}` })] }))
  } })
  assert.equal((await f.engine.enqueueTurn(turn(f.root, { text: `[10] Token ${secret}; local validation completed.` }))).status, 'done')
  for (const name of await filesBelow(f.root)) assert.equal((await fs.readFile(path.join(f.root, name), 'utf8')).includes(secret), false, name)
})

test('invalid supplied source sequence lists fail before any persistence or model call', async t => {
  const f = await fixture(t)
  for (const sourceSeqs of ['10,12', null, [9], [15], [12.5], Array(2001).fill(10)]) {
    assert.throws(() => f.engine.enqueueTurn(turn(f.root, { sourceSeqs })), error => ['INVALID', 'SOURCE'].includes(error.code))
  }
  assert.equal(f.calls.length, 0)
  assert.deepEqual(await fs.readdir(f.root), [])
})

test('capture facts deduplicate only valid supplied evidence and reject unsupported fields', () => {
  const input = turn('/synthetic')
  const value = capture({ source: input, allowedSourceSeqs: input.sourceSeqs })
  value.facts[0].sourceSeqs = [10, 10, 14]
  assert.deepEqual(validateCapture(value, input).facts[0].sourceSeqs, [10, 14])
  assert.throws(() => validateCapture({ ...value, command: 'deploy' }, input), error => error.code === 'INVALID')
})

test('permission revocation while the model runs prevents all further persistent writes', async t => {
  const entered = deferred(); const release = deferred()
  let allowed = true
  const f = await fixture(t, {
    authorize: async () => { if (!allowed) throw Object.assign(new Error('Permission revoked'), { code: 'PERMISSION' }) },
    generate: async (request, payload) => { entered.resolve(); await release.promise; return json(capture(payload)) },
  })
  const running = f.engine.enqueueTurn(f.input)
  await entered.promise
  const names = await filesBelow(f.root)
  const before = await Promise.all(names.map(name => fs.readFile(path.join(f.root, name), 'utf8')))
  allowed = false
  release.resolve()
  const result = await running
  assert.equal(result.status, 'error')
  assert.match(result.error, /^PERMISSION:/)
  assert.deepEqual(await filesBelow(f.root), names)
  assert.deepEqual(await Promise.all(names.map(name => fs.readFile(path.join(f.root, name), 'utf8'))), before)
  assert.equal(await f.vault.raw(stagePath(f.input)), null)
})

test('malformed model JSON and unsupported model actions leave only a retryable job', async t => {
  for (const answer of ['not JSON', json({ meaningful: true, execute: 'deployment' })]) {
    const f = await fixture(t, { generate: async () => answer })
    const result = await f.engine.enqueueTurn(f.input)
    assert.equal(result.status, 'error')
    assert.match(result.error, /^(MODEL_FORMAT|INVALID):/)
    assert.deepEqual(await f.vault.list(), [])
    assert.equal((await f.engine.status('s1')).jobs[0].status, 'error')
  }
})

test('an unassigned checkpoint is retained with an organization note, without inventing a topic', async t => {
  const f = await fixture(t, { generate: async (request, payload) => json(request.purpose === 'ctxkit.capture' ? capture(payload) : plan({ topics: [], note: 'Identity remains uncertain; keep this checkpoint unassigned.' })) })
  const result = await f.engine.enqueueTurn(f.input)
  assert.equal(result.status, 'done')
  const checkpoint = await f.vault.read(stagePath(f.input))
  assert.equal(checkpoint.metadata.organized, true)
  assert.deepEqual(checkpoint.metadata.topics, [])
  assert.match(checkpoint.metadata.organizationNote, /uncertain/)
  assert.equal((await f.vault.list()).some(doc => doc.metadata.kind === 'topic'), false)
})

test('a pause introduced during publication must stop subsequent knowledge writes', async t => {
  let engine
  let paused = false
  const f = await fixture(t, { authorize: async paths => {
    // Simulate a user pause after organize's active check, at first topic publication.
    if (engine && paths.length === 1 && paths[0] === topicPath('topic_atlas') && !paused) {
      paused = true
      engine.paused.set('s1', true)
    }
  } })
  engine = f.engine
  const result = await engine.enqueueTurn(f.input)
  assert.equal(paused, true, 'fixture must reach publication')
  assert.equal(await f.vault.raw(topicPath('topic_atlas')), null, 'pause must be checked at the write boundary, not only before applyPlan')
  assert.equal(result.status, 'paused')
})
