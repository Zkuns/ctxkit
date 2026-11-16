import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtempSync, mkdirSync, realpathSync, symlinkSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import {
  createAdapter, createGenerator, createPublisher, createScope,
  resolveConfig, createTurnBuffer, appendEvent, bufferText, eventText,
} from '../adapter.js'

const hash = text => createHash('sha256').update(text).digest('hex')
function fixture(t, config = {}) {
  const temp = realpathSync(mkdtempSync(join(tmpdir(), 'ctxkit-adapter-')))
  const workspace = join(temp, 'workspace'), root = join(workspace, 'vault'), outside = join(temp, 'outside')
  mkdirSync(workspace); mkdirSync(root); mkdirSync(outside)
  t.after(() => rmSync(temp, { recursive: true, force: true }))
  const listeners = new Map(), tools = new Map(), skillProviders = new Map(), sections = new Map(), files = new Map(), warnings = [], writes = [], calls = []
  let mode = 'workspace-write', token = 0, policyOverride = {}
  const session = { id: 'synthetic-session', header: { id: 'synthetic-session', cwd: workspace, isSeeded: false }, inheritedEventCount: 0 }
  const input = { root, allowedWorkspaces: [workspace], provider: 'synthetic-provider', model: 'synthetic-model', ...config }
  function register(map, name, item) { map.set(name, item); return () => map.delete(name) }
  const ctx = {
    logger: { warn: message => warnings.push(message) },
    on: (name, fn) => register(listeners, name, fn),
    tools: { register: (definition, options) => register(tools, definition.name, { definition, options }) },
    skills: { registerProvider: create => {
      assert.equal(typeof create, 'function', 'DSH registerProvider requires a lifecycle factory')
      const controller = new AbortController()
      const provider = create({ signal: controller.signal, invalidate() {} })
      const unregister = register(skillProviders, provider.name, provider)
      return () => { unregister(); controller.abort() }
    } },
    systemPrompt: { section: section => register(sections, section.name, section) },
    sandboxPolicy: { resolve: ({ session }) => ({ mode, workspaceRoot: session.header.cwd, ...policyOverride }) },
    fs: {
      sandboxMode: 'workspace-write',
      resolve: async path => ({ targetKey: path, displayPath: path }),
      stat: async target => files.has(target.targetKey) ? { version: files.get(target.targetKey).version, type: 'file', size: files.get(target.targetKey).text.length } : undefined,
      readText: async target => files.get(target.targetKey).text,
      async writeText(target, text, expected, signal, policy) {
        signal?.throwIfAborted()
        assert.notEqual(policy.mode, 'read-only')
        const current = files.get(target.targetKey)
        if (expected.kind === 'createIfAbsent' ? current : current?.version !== expected.version) throw Object.assign(new Error('native stale'), { code: 'FS_STALE_VERSION' })
        files.set(target.targetKey, { text, version: `v${++token}` })
        writes.push({ path: target.targetKey, text, expected, policy })
      },
    },
    llm: { async *stream(options) { calls.push(options); yield { type: 'text-delta', text: '{"meaningful":false}', index: 0 }; yield { type: 'finish', reason: { kind: 'stop' } } } },
  }
  class Engine {
    constructor(options) {
      this.options = options; this.turns = []; this.recoveries = []; this.controls = new Map(); this.disposed = false
      this.vault = { search: async (query, options) => [{ path: 'topics/demo/OVERVIEW.md', title: query, ...options }], read: async path => ({ path, revision: 'demo', metadata: {}, body: 'synthetic knowledge' }) }
    }
    async enqueueTurn(turn) { await this.options.authorize([], turn.context); this.turns.push(turn); return { done: true } }
    async status(id) { return { paused: this.controls.get(id) ?? false, jobs: [] } }
    async setPaused(id, paused, context) { this.controls.set(id, paused); await this.options.authorize(['.ctxkit/controls.json'], context) }
    async recover(value) { this.recoveries.push(value) }
    dispose() { this.disposed = true }
  }
  const f = { temp, root, workspace, outside, input, ctx, session, Engine, tools, listeners, skillProviders, sections, files, writes, calls, warnings,
    setMode(value) { mode = value }, setPolicy(value) { policyOverride = value },
    exec: { agent: { session }, signal: new AbortController().signal },
    invoke(name, args, exec) { return tools.get(name).definition.execute(args, exec ?? f.exec) },
  }
  return f
}
function event(seq, type, data) { return { seq, type, data } }
function user(seq, text, source = 'user') { return event(seq, 'user/message', { role: 'user', content: [{ type: 'text', text }], source: { kind: source } }) }
function assistant(seq, text) { return event(seq, 'assistant/message', { turn: 1, step: 1, message: { role: 'assistant', content: [{ type: 'text', text }] } }) }
function emitTurn(adapter, session, start = 0) {
  adapter.onEvent(session, event(start, 'turn/start', { turn: 1 }))
  adapter.onEvent(session, user(start + 1, 'Build a synthetic feature.'))
  adapter.onEvent(session, assistant(start + 2, 'Implemented and tested locally. Not deployed.'))
  adapter.onEvent(session, event(start + 3, 'turn/end', { turn: 1, reason: 'completed' }))
}

test('missing explicit settings stays inert without touching paths or registering capabilities', () => {
  assert.equal(resolveConfig({ root: '/does-not-exist' }), null)
  assert.equal(createAdapter({}, {}, class {}).active, false)
  assert.equal(resolveConfig({ enabled: false, root: '/does-not-exist', allowedWorkspaces: ['x'], provider: 'p', model: 'm' }), null)
})

test('configuration requires physical directories and finite bounded limits', t => {
  const f = fixture(t)
  assert.equal(resolveConfig(f.input).root, f.root)
  assert.throws(() => resolveConfig({ ...f.input, maxInputChars: Infinity }), /Invalid/)
  symlinkSync(f.root, join(f.workspace, 'linked'))
  assert.throws(() => resolveConfig({ ...f.input, root: join(f.workspace, 'linked') }), { code: 'CTXKIT_CONFIG_DIRECTORY' })
})

test('live turn-end captures only bounded visible text and exact source seqs', async t => {
  const f = fixture(t), adapter = createAdapter(f.ctx, f.input, f.Engine)
  adapter.onEvent(f.session, event(0, 'turn/start', { turn: 1 }))
  adapter.onEvent(f.session, user(1, 'User-confirmed synthetic decision'))
  adapter.onEvent(f.session, user(2, 'Do not ingest this instruction', 'plugin:another'))
  adapter.onEvent(f.session, event(3, 'assistant/message', { message: { content: [{ type: 'reasoning', text: 'PRIVATE REASONING' }, { type: 'text', text: 'Visible result' }] } }))
  adapter.onEvent(f.session, event(4, 'tool/call', { callId: 'call-a', name: 'bash', arguments: 'SECRET TOOL ARGS' }))
  adapter.onEvent(f.session, event(5, 'tool/result', { message: { toolCallId: 'call-a', content: [{ type: 'text', text: 'Tests passed' }] } }))
  adapter.onEvent(f.session, event(6, 'tool/call', { callId: 'call-b', name: 'ctxkit_read' }))
  adapter.onEvent(f.session, event(7, 'tool/result', { message: { toolCallId: 'call-b', content: [{ type: 'text', text: 'RECYCLED MEMORY' }] } }))
  assert.equal(adapter.engine.turns.length, 0)
  adapter.onEvent(f.session, event(8, 'turn/end', { turn: 1, reason: 'completed' }))
  await adapter.idle()
  const turn = adapter.engine.turns[0]
  assert.equal(turn.sessionId, f.session.id)
  assert.equal(turn.cwd, f.workspace)
  assert.deepEqual(turn.sourceSeqs, [1, 3, 5])
  assert.equal(turn.fromSeq, 0); assert.equal(turn.toSeq, 8)
  assert.match(turn.text, /Tests passed/)
  assert.doesNotMatch(turn.text, /PRIVATE|SECRET|RECYCLED|Do not ingest/)
  adapter.dispose()
})

test('truncation stays bounded and marks omitted source explicitly', () => {
  const config = { maxInputChars: 256, maxEventChars: 80 }
  const buffer = createTurnBuffer(0, 1)
  for (let seq = 1; seq < 30; seq++) appendEvent(buffer, user(seq, 'x'.repeat(500)), config)
  const text = bufferText(buffer, config.maxInputChars)
  assert.ok(text.length <= 256)
  assert.match(text, /source truncated/)
  assert.ok(buffer.sourceSeqs.length < 29)
  assert.equal(buffer.sourceSeqs[0], 1)
  assert.equal(buffer.sourceSeqs.at(-1), 29)
  assert.equal(eventText(event(20, 'system/message', { text: 'secret' })), '')
})

test('outside-workspace and subagent sessions are excluded; forks have independent source IDs', async t => {
  const f = fixture(t), adapter = createAdapter(f.ctx, f.input, f.Engine)
  const outside = { id: 'outside', header: { cwd: f.outside } }
  const child = { id: 'child', header: { cwd: f.workspace, origin: 'subagent' } }
  emitTurn(adapter, outside); emitTurn(adapter, child)
  const fork = { id: 'fork', header: { cwd: f.workspace, isSeeded: true }, inheritedEventCount: 4 }
  emitTurn(adapter, fork, 0); emitTurn(adapter, fork, 4)
  await adapter.idle()
  assert.equal(adapter.engine.turns.length, 1)
  assert.equal(adapter.engine.turns[0].sessionId, 'fork')
  assert.equal(adapter.engine.turns[0].fromSeq, 4)
  await assert.rejects(f.invoke('ctxkit_search', { query: 'x' }, { agent: { session: outside } }), { code: 'CTXKIT_SCOPE_DENIED' })
  assert.equal(f.tools.get('ctxkit_read').options.when({ agent: { session: outside } }), false)
  adapter.dispose()
})

test('read-only sessions never capture or call model; scoped recall remains read-only', async t => {
  const f = fixture(t), adapter = createAdapter(f.ctx, f.input, f.Engine)
  f.setMode('read-only')
  emitTurn(adapter, f.session)
  await adapter.idle()
  assert.equal(adapter.engine.turns.length, 0)
  await assert.rejects(adapter.engine.options.generate({ system: 's', user: 'u', context: { session: f.session } }), { code: 'CTXKIT_READ_ONLY' })
  assert.equal(f.calls.length, 0)
  assert.equal((await f.invoke('ctxkit_search', { query: 'demo' })).results.length, 1)
  adapter.dispose()
})

test('allowlist does not grant vault writes; native sandbox backend is required for scoped mode', async t => {
  const f = fixture(t)
  const config = resolveConfig({ ...f.input, root: f.outside })
  const scope = createScope(f.ctx, config)
  await assert.rejects(scope.authorize(['x.md'], { session: f.session }), { code: 'CTXKIT_VAULT_NOT_WRITABLE' })
  f.setPolicy({ additionalWritableRoots: [f.outside] })
  await scope.authorize(['x.md'], { session: f.session })
  f.ctx.fs.sandboxMode = undefined
  await assert.rejects(scope.authorize(['x.md'], { session: f.session }), { code: 'CTXKIT_FS_SANDBOX_UNAVAILABLE' })
})

test('native publisher rechecks policy, revisions and child symlinks', async t => {
  const f = fixture(t), scope = createScope(f.ctx, resolveConfig(f.input)), publish = createPublisher(f.ctx, scope), context = { session: f.session }
  await publish({ relativePath: 'topics/a/OVERVIEW.md', text: 'first', expectedRevision: null, context })
  assert.equal(f.writes[0].expected.kind, 'createIfAbsent')
  await publish({ relativePath: 'topics/a/OVERVIEW.md', text: 'second', expectedRevision: hash('first'), context })
  assert.equal(f.writes[1].expected.kind, 'replaceIfVersion')
  await assert.rejects(publish({ relativePath: 'topics/a/OVERVIEW.md', text: 'bad', expectedRevision: hash('first'), context }), { code: 'CTXKIT_REVISION_CONFLICT' })
  f.setMode('read-only')
  await assert.rejects(publish({ relativePath: 'new.md', text: 'bad', expectedRevision: null, context }), { code: 'CTXKIT_READ_ONLY' })
  f.setMode('workspace-write')
  symlinkSync(f.outside, join(f.root, 'escape'))
  await assert.rejects(publish({ relativePath: 'escape/new.md', text: 'bad', expectedRevision: null, context }), { code: 'CTXKIT_SYMLINK_DENIED' })
  await assert.rejects(scope.authorize(['../escape.md'], context), { code: 'CTXKIT_PATH_DENIED' })
  assert.equal(f.writes.length, 2)
})

test('publication observes policy changes during filesystem read', async t => {
  const f = fixture(t), scope = createScope(f.ctx, resolveConfig(f.input)), publish = createPublisher(f.ctx, scope), context = { session: f.session }
  f.files.set(join(f.root, 'a.md'), { version: 'v1', text: 'old' })
  f.ctx.fs.readText = async () => { f.setMode('read-only'); return 'old' }
  await assert.rejects(publish({ relativePath: 'a.md', text: 'new', expectedRevision: hash('old'), context }), { code: 'CTXKIT_READ_ONLY' })
  assert.equal(f.writes.length, 0)
})

test('text-only LLM uses the exact configured route, no credentials or agent tools', async t => {
  const f = fixture(t), config = resolveConfig(f.input), scope = createScope(f.ctx, config)
  const generate = createGenerator(f.ctx, config, scope, new AbortController().signal)
  assert.equal(await generate({ purpose: 'capture', system: 'summarize', user: 'synthetic source', context: { session: f.session } }), '{"meaningful":false}')
  const call = f.calls[0]
  assert.equal(call.provider, 'synthetic-provider'); assert.equal(call.model, 'synthetic-model')
  assert.deepEqual(call.tools, []); assert.equal(call.maxTokens, 4000)
  assert.equal(call.sessionId, f.session.id)
  assert.equal(call.purpose, 'ctxkit:capture')
  assert.equal(call.messages[0].id, undefined)
  assert.equal(call.messages[0].source, undefined)
})

test('LLM terminal failures, truncation, tool calls and output overflow reject without fallback', async t => {
  const f = fixture(t), config = resolveConfig({ ...f.input, maxOutputChars: 128 }), scope = createScope(f.ctx, config)
  const generate = createGenerator(f.ctx, config, scope, new AbortController().signal)
  const request = { system: 's', user: 'u', context: { session: f.session } }
  for (const [chunks, code] of [
    [[{ type: 'finish', reason: { kind: 'error', failure: { code: 'AUTH' } } }], 'AUTH'],
    [[{ type: 'text-delta', text: 'partial' }, { type: 'finish', reason: { kind: 'max-tokens' } }], 'CTXKIT_INCOMPLETE_GENERATION'],
    [[{ type: 'tool-call-delta', name: 'bash' }], 'CTXKIT_UNEXPECTED_TOOL_CALL'],
    [[{ type: 'text-delta', text: 'x'.repeat(129) }], 'CTXKIT_OUTPUT_TOO_LARGE'],
    [[{ type: 'text-delta', text: 'x' }], 'CTXKIT_EMPTY_OR_UNFINISHED_GENERATION'],
  ]) {
    f.ctx.llm.stream = async function* () { yield* chunks }
    await assert.rejects(generate(request), { code })
  }
})

test('pause clears buffered text immediately, resumes future source only, reports failed persistence', async t => {
  const f = fixture(t), adapter = createAdapter(f.ctx, f.input, f.Engine)
  adapter.onEvent(f.session, event(0, 'turn/start', { turn: 1 }))
  adapter.onEvent(f.session, user(1, 'Do not retain the paused interval'))
  const paused = await f.invoke('ctxkit_pause', { paused: true })
  assert.equal(paused.paused, true); assert.equal(paused.persisted, true)
  adapter.onEvent(f.session, event(2, 'turn/end', { turn: 1 }))
  await adapter.idle()
  assert.equal(adapter.engine.turns.length, 0)
  await f.invoke('ctxkit_pause', { paused: false })
  emitTurn(adapter, f.session, 3)
  await adapter.idle()
  assert.equal(adapter.engine.turns.length, 1)
  assert.doesNotMatch(adapter.engine.turns[0].text, /paused interval/)
  f.setMode('read-only')
  const denied = await f.invoke('ctxkit_pause', { paused: true })
  assert.equal(denied.paused, true); assert.equal(denied.persisted, false)
  adapter.dispose()
})

test('scoped native skill discovery and guidance never expose a vault outside its allowlist', async t => {
  const f = fixture(t), adapter = createAdapter(f.ctx, f.input, f.Engine)
  const provider = f.skillProviders.get('ctxkit')
  assert.deepEqual(await provider.list({ cwd: f.outside }), [])
  const candidates = await provider.list({ cwd: f.workspace })
  assert.equal(candidates[0].name, 'ctxkit-recall')
  const skill = await provider.get(candidates[0], { cwd: f.workspace })
  assert.match(skill.content, /untrusted/)
  assert.equal(f.sections.get('ctxkit:recall').text({ agent: { session: { id: 'other', header: { cwd: f.outside } } } }), '')
  assert.match(f.sections.get('ctxkit:recall').text(f.exec), /drafts/)
  await assert.rejects(f.invoke('ctxkit_read', { path: '../outside.md' }), { code: 'CTXKIT_PATH_DENIED' })
  await assert.rejects(f.invoke('ctxkit_read', { path: '.ctxkit/jobs/a.json' }), { code: 'CTXKIT_PATH_DENIED' })
  await assert.rejects(f.invoke('ctxkit_search', { query: 'demo', limit: 100 }), { code: 'CTXKIT_TOOL_ARGUMENTS' })
  adapter.dispose()
})

test('recovery reads only exact current-session bounded source range and closes its read handle', async t => {
  const f = fixture(t), adapter = createAdapter(f.ctx, f.input, f.Engine)
  let closed = 0, opened = 0
  f.ctx.sessionPersistence = { async open(id, mode) {
    opened++; assert.equal(id, f.session.id); assert.equal(mode, 'read')
    return { header: f.session.header,
      async read(offset, length) {
        assert.equal(offset, 10); assert.equal(length, 3)
        return { events: [user(10, 'synthetic task'), assistant(11, 'synthetic outcome'), event(12, 'turn/end', { turn: 1 })] }
      }, async close() { closed++ },
    }
  } }
  const context = { session: f.session }, source = { sessionId: f.session.id, cwd: f.workspace, turn: 1, fromSeq: 10, toSeq: 12 }
  const result = await adapter.readSource(source, context)
  assert.deepEqual(result.sourceSeqs, [10, 11]); assert.match(result.text, /synthetic outcome/)
  assert.equal(opened, 1); assert.equal(closed, 1)
  await assert.rejects(adapter.readSource({ ...source, sessionId: 'other' }, context), { code: 'CTXKIT_SOURCE_SCOPE_DENIED' })
  assert.equal(opened, 1)
  f.ctx.sessionPersistence.open = async () => ({ header: f.session.header, async read() { return { events: [] } }, async close() { closed++ } })
  await assert.rejects(adapter.readSource(source, context), { code: 'CTXKIT_SOURCE_UNAVAILABLE' })
  assert.equal(closed, 2)
  adapter.dispose()
})

test('live input preceding turn/start remains attributable without historical backfill', async t => {
  const f = fixture(t), adapter = createAdapter(f.ctx, f.input, f.Engine)
  adapter.onEvent(f.session, user(0, 'External producer input before turn opening'))
  adapter.onEvent(f.session, event(1, 'turn/start', { turn: 1 }))
  adapter.onEvent(f.session, assistant(2, 'Synthetic response'))
  adapter.onEvent(f.session, event(3, 'turn/end', { turn: 1 }))
  await adapter.idle()
  assert.equal(adapter.engine.turns[0].fromSeq, 0)
  assert.deepEqual(adapter.engine.turns[0].sourceSeqs, [0, 2])
  assert.match(adapter.engine.turns[0].text, /External producer input/)
  adapter.dispose()
})

test('lock cleanup survives cancellation and unload but grants no other writes or mode escalation', async t => {
  const f = fixture(t), abort = new AbortController()
  let stopped = false, paused = false
  const scope = createScope(f.ctx, resolveConfig(f.input), () => stopped, () => paused)
  const context = { session: f.session, signal: abort.signal }
  abort.abort(); stopped = true; paused = true
  await assert.rejects(scope.authorize(['.ctxkit/writer.lock'], context), { code: 'CTXKIT_DISPOSED' })
  await scope.authorize(['.ctxkit/writer.lock'], { ...context, cleanup: true })
  await assert.rejects(scope.authorize(['topics/a/OVERVIEW.md'], { ...context, cleanup: true }), { code: 'CTXKIT_CLEANUP_DENIED' })
  await assert.rejects(scope.authorize(['.ctxkit/writer.lock', '.ctxkit/other'], { ...context, cleanup: true }), { code: 'CTXKIT_CLEANUP_DENIED' })
  f.setMode('read-only')
  await assert.rejects(scope.authorize(['.ctxkit/writer.lock'], { ...context, cleanup: true }), { code: 'CTXKIT_READ_ONLY' })
})

test('read windows carry bounded bidirectional topic relations and explicit truncation', async t => {
  const f = fixture(t), adapter = createAdapter(f.ctx, f.input, f.Engine)
  adapter.engine.vault.read = async path => ({ path, revision: 'v', metadata: { kind: 'topic', id: 'topic_demo' }, body: 'abcdefghijklmnopqrstuvwxyz' })
  adapter.engine.vault.related = async topic => Array.from({ length: 22 }, (_, index) => ({ from: index % 2 ? topic : 'topic_other', to: index % 2 ? 'topic_other' : topic, type: 'uses', reason: 'synthetic relation' }))
  const value = await f.invoke('ctxkit_read', { path: 'topics/topic_demo/OVERVIEW.md', offset: 5, limit: 10 })
  assert.equal(value.body, 'fghijklmno')
  assert.equal(value.nextOffset, 15); assert.equal(value.totalChars, 26); assert.equal(value.truncated, true)
  assert.equal(value.related.length, 20); assert.equal(value.relatedTruncated, true)
  assert.equal(value.related[0].to, 'topic_demo'); assert.equal(value.related[1].from, 'topic_demo')
  adapter.dispose()
})

test('pause reports engine nonthrowing persistence denial honestly', async t => {
  const f = fixture(t), adapter = createAdapter(f.ctx, f.input, f.Engine)
  adapter.engine.setPaused = async () => ({ paused: true, persisted: false, error: 'PERMISSION' })
  const value = await f.invoke('ctxkit_pause', { paused: true })
  assert.equal(value.persisted, false); assert.equal(value.error, 'PERMISSION')
  emitTurn(adapter, f.session); await adapter.idle()
  assert.equal(adapter.engine.turns.length, 0)
  adapter.dispose()
})

test('status reports capture eligibility and exact permission or pause reason', async t => {
  const f = fixture(t), adapter = createAdapter(f.ctx, f.input, f.Engine)
  assert.equal((await f.invoke('ctxkit_status', {})).captureEligible, true)
  f.setMode('read-only')
  const denied = await f.invoke('ctxkit_status', {})
  assert.equal(denied.captureEligible, false); assert.equal(denied.reason, 'CTXKIT_READ_ONLY')
  f.setMode('workspace-write'); f.setPolicy({ workspaceRoot: f.outside })
  assert.equal((await f.invoke('ctxkit_status', {})).reason, 'CTXKIT_VAULT_NOT_WRITABLE')
  f.setPolicy({}); await f.invoke('ctxkit_pause', { paused: true })
  assert.equal((await f.invoke('ctxkit_status', {})).reason, 'CTXKIT_PAUSED')
  adapter.dispose()
})

test('explicit retry is current-session scoped and refuses paused or read-only capture', async t => {
  const f = fixture(t), adapter = createAdapter(f.ctx, f.input, f.Engine)
  await f.invoke('ctxkit_retry', {})
  assert.equal(adapter.engine.recoveries.length, 1)
  assert.equal(adapter.engine.recoveries[0].context.session.id, f.session.id)
  assert.equal(typeof adapter.engine.recoveries[0].resolveTurn, 'function')
  f.setMode('read-only')
  await assert.rejects(f.invoke('ctxkit_retry', {}), { code: 'CTXKIT_READ_ONLY' })
  f.setMode('workspace-write')
  await f.invoke('ctxkit_pause', { paused: true })
  await assert.rejects(f.invoke('ctxkit_retry', {}), { code: 'CTXKIT_PAUSED' })
  assert.equal(adapter.engine.recoveries.length, 1)
  adapter.dispose()
})

test('canonical search, read and status outputs have a hard serialized size budget', async t => {
  const f = fixture(t, { maxOutputChars: 1024 }), adapter = createAdapter(f.ctx, f.input, f.Engine)
  adapter.engine.vault.search = async () => Array.from({ length: 20 }, (_, index) => ({ path: `topics/topic_${index}/OVERVIEW.md`, title: 'title'.repeat(100), excerpt: 'excerpt'.repeat(1000), score: 1, metadata: { id: 'topic_demo', kind: 'topic', secretExtra: 'NEVER_RETURN', sources: Array(100).fill('long-source') } }))
  const search = await f.invoke('ctxkit_search', { query: 'x', limit: 20 })
  assert.ok(JSON.stringify(search).length <= 1024); assert.equal(search.truncated, true)
  assert.doesNotMatch(JSON.stringify(search), /NEVER_RETURN|secretExtra/)
  adapter.engine.vault.read = async path => ({ path, revision: 'v', metadata: { id: 'topic_demo', kind: 'topic', sources: Array(100).fill('s'.repeat(500)), relations: Array(100).fill('UNBOUNDED_RELATION'), privateExtra: 'NEVER_RETURN' }, body: '\"\\n'.repeat(18000) })
  adapter.engine.vault.related = async () => []
  const read = await f.invoke('ctxkit_read', { path: 'topics/topic_demo/OVERVIEW.md' })
  assert.ok(JSON.stringify(read).length <= 1024); assert.equal(read.truncated, true)
  assert.equal(read.nextOffset, read.body.length)
  assert.doesNotMatch(JSON.stringify(read), /NEVER_RETURN|UNBOUNDED_RELATION/)
  adapter.engine.status = async () => ({ paused: false, jobs: Array.from({ length: 100 }, (_, i) => ({ id: `job_${i}`, status: 'error', error: 'x'.repeat(10000) })) })
  const status = await f.invoke('ctxkit_status', {})
  assert.ok(JSON.stringify(status).length <= 1024); assert.equal(status.captureEligible, true)
  adapter.dispose()
})

test('tool JSON schemas satisfy the installed DSH schema subset', { skip: !process.env.DSH_INSTALL_DIR }, async t => {
  const require = createRequire(join(process.env.DSH_INSTALL_DIR, 'package.json'))
  const { assertSupportedJsonSchema } = await import(pathToFileURL(require.resolve('@deepseek-ai/dsh-tools')).href)
  const f = fixture(t), adapter = createAdapter(f.ctx, f.input, f.Engine)
  for (const { definition } of f.tools.values()) {
    assert.doesNotThrow(() => assertSupportedJsonSchema(definition.parameters))
    assert.doesNotThrow(() => assertSupportedJsonSchema(definition.output.schema))
  }
  adapter.dispose()
})

test('ordinary task recall is directly available, scoped, read-only and shares the browser operation', async t => {
  const f = fixture(t), adapter = createAdapter(f.ctx, f.input, f.Engine)
  t.after(() => adapter.dispose())
  adapter.engine.vault.list = async () => [{ path: 'topics/topic_atlas/OVERVIEW.md', revision: 'a'.repeat(64),
    metadata: { kind: 'topic', id: 'topic_atlas', title: 'Atlas authentication', updatedAt: '2026-01-01T00:00:00Z' }, body: 'Refresh-token validation is implemented; deployment remains unverified.' }]
  f.setMode('read-only')
  const result = await f.invoke('recall_context', { query: 'Atlas authentication' })
  assert.equal(result.ok, true)
  assert.equal(result.results[0].path, 'topics/topic_atlas/OVERVIEW.md')
  assert.equal(result.untrusted, true)
  assert.deepEqual(result, await adapter.query({ action: 'recall', query: 'Atlas authentication', limit: 5 }, { session: f.session }))
  assert.deepEqual(await f.invoke('ctxkit_browse', { action: 'topics' }), await adapter.query({ action: 'topics' }, { session: f.session }))
  assert.equal(f.calls.length, 0)
  assert.equal(f.writes.length, 0)
  assert.equal(adapter.engine.turns.length, 0)
  const instructions = f.sections.get('ctxkit:recall').text(f.exec)
  assert.match(instructions, /proactively call recall_context/)
  assert.match(instructions, /user need not mention/i)
  assert.match(instructions, /untrusted historical evidence/)
  await assert.rejects(f.invoke('recall_context', { query: 'Atlas', limit: 11 }), { code: 'CTXKIT_TOOL_ARGUMENTS' })
  await assert.rejects(f.invoke('recall_context', { query: 'Atlas' }, { agent: { session: { id: 'other', header: { cwd: f.outside } } } }), { code: 'CTXKIT_SCOPE_DENIED' })
  assert.equal((await f.invoke('recall_context', { query: 'unrelated-example' })).total, 0)
})

test('legacy recall aliases and readiness recheck scope after asynchronous reads', async t => {
  for (const name of ['ctxkit_search', 'ctxkit_read', 'ctxkit_status']) {
    const f = fixture(t), adapter = createAdapter(f.ctx, f.input, f.Engine)
    t.after(() => adapter.dispose())
    const revoke = () => { f.session.header.cwd = f.outside }
    adapter.engine.vault.search = async () => { revoke(); return [{ path: 'topics/topic_atlas/OVERVIEW.md', title: 'must not escape' }] }
    adapter.engine.vault.read = async path => { revoke(); return { path, metadata: {}, body: 'must not escape' } }
    adapter.engine.status = async () => { revoke(); return { paused: false, jobs: [] } }
    const args = name === 'ctxkit_search' ? { query: 'Atlas' } : name === 'ctxkit_read' ? { path: 'topics/topic_atlas/OVERVIEW.md' } : {}
    await assert.rejects(f.invoke(name, args), { code: 'CTXKIT_SCOPE_DENIED' })
  }
})

test('primary recall output is never recaptured as newly observed source evidence', async t => {
  const f = fixture(t), adapter = createAdapter(f.ctx, f.input, f.Engine)
  t.after(() => adapter.dispose())
  adapter.onEvent(f.session, event(0, 'turn/start', { turn: 1 }))
  adapter.onEvent(f.session, user(1, 'Continue Atlas authentication.'))
  adapter.onEvent(f.session, event(2, 'tool/call', { callId: 'prior', name: 'recall_context', arguments: { query: 'Atlas' } }))
  adapter.onEvent(f.session, event(3, 'tool/result', { message: { toolCallId: 'prior', content: [{ type: 'text', text: 'OLD_LIBRARY_CONTENT' }] } }))
  adapter.onEvent(f.session, assistant(4, 'I will check the current code before changing it.'))
  adapter.onEvent(f.session, event(5, 'turn/end', { turn: 1 }))
  await adapter.idle()
  assert.deepEqual(adapter.engine.turns[0].sourceSeqs, [1, 4])
  assert.doesNotMatch(adapter.engine.turns[0].text, /OLD_LIBRARY_CONTENT/)
})

test('agent created uses payload.agent; disposal cancels calls and removes all registrations', async t => {
  const f = fixture(t), adapter = createAdapter(f.ctx, f.input, f.Engine)
  f.listeners.get('agent/created')({ agent: f.exec.agent, source: 'new' })
  await adapter.idle()
  assert.equal(adapter.engine.recoveries.length, 1)
  assert.equal(adapter.engine.recoveries[0].context.session, f.session)
  adapter.dispose()
  assert.equal(adapter.engine.disposed, true)
  assert.equal(adapter.engine.options.signal.aborted, true)
  assert.equal(f.tools.size, 0); assert.equal(f.skillProviders.size, 0); assert.equal(f.sections.size, 0); assert.equal(f.listeners.size, 0)
  emitTurn(adapter, f.session)
  assert.equal(adapter.engine.turns.length, 0)
  adapter.dispose()
})
