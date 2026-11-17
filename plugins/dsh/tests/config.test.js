import test from 'node:test'
import assert from 'node:assert/strict'
import * as fs from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { Config, snapshotConfig, validateStorageRoot } from '../config.js'
import { Vault } from '../vault.js'
import { encode } from '../contracts.js'
import { Engine } from '../engine.js'

const anchor = process.env.DSH_INSTALL_DIR
const load = async name => import(pathToFileURL(createRequire(join(anchor, 'package.json')).resolve(name)).href)

// A genuine native Loader + Settings + ConfigEditor, with an entirely temporary
// fictional profile/home/workspace. Never loads the user's profile or model.
async function nativeFixture(t, { active = false, completion = () => '{"meaningful":false}', configOverrides = {} } = {}) {
  const [{ Context }, { Loader }, { mountRootInclude, readProfilePatches }, { ConfigEditor }, { SettingsForms },
    { SandboxedFileSystem }, { default: Tools }, { default: Skills }, { default: SystemPrompt }, { CommandRuntime }] = await Promise.all([
    load('@deepseek-ai/cordis'), load('@deepseek-ai/cordis-plugin-loader'), load('@deepseek-ai/dsh-app-boot'),
    load('@deepseek-ai/dsh-config-editor'), load('@deepseek-ai/dsh-settings'), load('@deepseek-ai/dsh-fs-sandbox'),
    load('@deepseek-ai/dsh-tools'), load('@deepseek-ai/dsh-skill'), load('@deepseek-ai/dsh-system-prompt'), load('@deepseek-ai/dsh-commands'),
  ])
  const temp = await fs.realpath(await fs.mkdtemp(join(tmpdir(), 'ctxkit-settings-')))
  const dir = join(temp, 'profile'), home = join(temp, 'home'), root = join(temp, 'vault'), other = join(temp, 'other')
  await Promise.all([dir, home, root, other].map(path => fs.mkdir(path)))
  await fs.writeFile(join(dir, 'package.json'), JSON.stringify({ name: 'fictional-settings-profile', private: true, dsh: { profile: { bundles: [] } } }))
  const patchPath = join(dir, 'cordis.patch.yml')
  const ordinary = { allowedWorkspaces: [temp], provider: 'fictional', model: 'fictional', maxTokens: 2300, includeSubagents: true }
  const config = { ...ordinary, root: active ? root : '', enabled: active, ...configOverrides }
  const patches = [{ insert: [{ id: 'ctxkit', name: new URL('../index.js', import.meta.url).href, config }] }]
  await fs.writeFile(patchPath, JSON.stringify(patches))
  const includePath = join(dir, 'base.yml')
  await fs.writeFile(includePath, '[]\n')
  const ctx = new Context()
  t.after(async () => { await ctx.fiber.dispose(); await fs.rm(temp, { recursive: true, force: true }) })
  let modelCalls = 0
  const modelRequests = []
  ctx.provide('profileContext', { name: 'fictional', dir, patchPath, home, cwd: temp, installAnchor: join(anchor, 'package.json'), startedBundles: [], overlays: [], telemetryDisabledEnv: undefined })
  ctx.provide('sandboxPolicy', { defaultMode: 'workspace-write', resolve: () => ({ mode: 'workspace-write', workspaceRoot: temp }) })
  ctx.provide('llm', { async *stream(request) { modelCalls++; modelRequests.push(request); yield { type: 'text-delta', text: completion(request) }; yield { type: 'finish', reason: { kind: 'stop' } } } })
  ctx.provide('sessions', {})
  ctx.provide('agents', { get: id => id === 'fictional-settings-session' ? { session, model: { current: () => ({ provider: 'session-fixture', model: 'session-model' }) } } : undefined })
  for (const [implementation, options] of [[Loader, {}], [SandboxedFileSystem, { cwd: temp }], [Tools, {}], [Skills, {}], [SystemPrompt, { includeRuntimeContext: false }], [CommandRuntime, {}]]) {
    await ctx.plugin(implementation, options).await()
  }
  await mountRootInclude(ctx, includePath, readProfilePatches('dsh', ctx.profileContext))
  await ctx.loader.await()
  const entry = ctx.loader.resolve('include:ctxkit')
  await entry.fiber.await()
  // Settings arrives after CtxKit: optional configure() must still own the parent.
  await ctx.plugin(ConfigEditor).await()
  await ctx.plugin(SettingsForms).await()
  await entry.fiber.await()
  const session = { id: 'fictional-settings-session', header: { cwd: temp, origin: 'user' }, append() { return { seq: 0 } } }
  const execute = async (args = {}) => JSON.parse((await ctx.commands.execute({ session }, '/ctxkit-library ' + JSON.stringify(args), [], new AbortController().signal)).result.text)
  const descriptor = () => ctx.settings.describe().find(item => item.ns === 'ctxkit')
  return { ctx, entry, temp, root, other, patchPath, ordinary, session, execute, descriptor, modelRequests, modelCalls: () => modelCalls }
}

test('schema snapshots unwrap the complete atomic directory onboarding selection', () => {
  const config = Config({})
  const plain = snapshotConfig(config)
  assert.equal(config.root.get(), '')
  assert.equal(config.enabled.get(), false)
  assert.deepEqual(plain, { root: '', enabled: false, allowedWorkspaces: [], useSessionModel: false, exactWorkspaces: false, provider: '', model: '', maxInputChars: 24000,
    maxEventChars: 4000, maxOutputChars: 24000, maxTokens: 4000, timeoutMs: 60000, maxBufferedSessions: 128,
    maxPendingTurns: 16, maxRecoveryEvents: 2000, includeSubagents: false })
  assert.equal(Config.dict.root.type, 'string')
  assert.equal(Config.dict.enabled.type, 'boolean')
  assert.deepEqual(Object.entries(Config.dict).filter(([, field]) => field.meta.volatile).map(([key]) => key), ['root', 'enabled', 'allowedWorkspaces', 'useSessionModel', 'exactWorkspaces'])
  const ordinary = Config({ allowedWorkspaces: ['/fictional'], provider: 'fake', model: 'fake', maxTokens: 7, includeSubagents: true })
  assert.equal(snapshotConfig(ordinary).maxTokens, 7)
  assert.notEqual(snapshotConfig(ordinary).allowedWorkspaces, ordinary.allowedWorkspaces)
  assert.throws(() => Config({ root: 3 }))
  assert.throws(() => Config({ enabled: 'true' }))
})

test('directory validation accepts empty or real directories and never creates storage', async t => {
  const temp = await fs.realpath(await fs.mkdtemp(join(tmpdir(), 'ctxkit-path-')))
  t.after(() => fs.rm(temp, { recursive: true, force: true }))
  await fs.writeFile(join(temp, 'file'), 'fictional')
  await fs.symlink(temp, join(temp, 'link'))
  const before = await fs.readdir(temp)
  validateStorageRoot('')
  validateStorageRoot(temp)
  for (const root of ['relative', '~', '\0bad']) assert.throws(() => validateStorageRoot(root), { code: 'CTXKIT_CONFIG_PATH' })
  for (const root of [join(temp, 'missing'), join(temp, 'file'), join(temp, 'link')]) assert.throws(() => validateStorageRoot(root), { code: 'CTXKIT_CONFIG_DIRECTORY' })
  assert.deepEqual(await fs.readdir(temp), before)
})

test('native settings persists root alone, late configuration owns parent, and conflicts refuse writes', { skip: !anchor }, async t => {
  const f = await nativeFixture(t)
  const first = f.descriptor()
  assert.equal(first.autoGenerate, false)
  assert.deepEqual(first.value, { root: '', enabled: false, allowedWorkspaces: [f.temp], useSessionModel: false, exactWorkspaces: false })
  const form = first.schema.refs[first.schema.uid]
  assert.deepEqual(Object.keys(form.dict), ['root', 'enabled', 'allowedWorkspaces', 'useSessionModel', 'exactWorkspaces'])
  assert.equal(first.schema.refs[form.dict.root].type, 'string')
  const uid = f.entry.fiber.uid
  await f.ctx.settings.update('ctxkit', { root: f.root, enabled: false }, first.revision)
  assert.equal(f.entry.fiber.uid, uid, 'volatile fields must not remount the owner')
  assert.equal(f.entry.fiber.effectiveConfig.root.get(), f.root)
  assert.deepEqual(f.descriptor().value, { root: f.root, enabled: false, allowedWorkspaces: [f.temp], useSessionModel: false, exactWorkspaces: false })
  for (const [key, value] of Object.entries(f.ordinary)) assert.deepEqual(f.entry.options.config[key], value)
  assert.equal((await f.execute()).state, 'ready')
  assert.equal((await f.execute({ action: 'status' })).processing.reason, 'CTXKIT_CAPTURE_DISABLED')
  assert.deepEqual(await fs.readdir(f.root), [])
  assert.equal(f.modelCalls(), 0)
  const saved = await fs.readFile(f.patchPath, 'utf8')
  await assert.rejects(() => f.ctx.settings.update('ctxkit', { root: f.other, enabled: false }, first.revision), { code: 'SETTINGS_CONFLICT' })
  assert.equal(await fs.readFile(f.patchPath, 'utf8'), saved)
  await f.ctx.settings.update('ctxkit', { root: '', enabled: false }, f.descriptor().revision)
  assert.equal(f.entry.fiber.effectiveConfig.root.get(), '')
})

test('native editor rejects invalid roots and nonvolatile edits before changing profile bytes', { skip: !anchor }, async t => {
  const f = await nativeFixture(t)
  await fs.symlink(f.root, join(f.temp, 'link'))
  await fs.writeFile(join(f.temp, 'file'), 'fixture')
  const before = await fs.readFile(f.patchPath, 'utf8')
  for (const root of ['relative', join(f.temp, 'missing'), join(f.temp, 'file'), join(f.temp, 'link')]) {
    await assert.rejects(() => f.ctx.settings.update('ctxkit', { root, enabled: false }, f.descriptor().revision), /CTXKIT_CONFIG_(PATH|DIRECTORY)/)
    assert.equal(await fs.readFile(f.patchPath, 'utf8'), before)
    assert.equal(f.entry.fiber.effectiveConfig.root.get(), '')
  }
  await assert.rejects(() => f.ctx.settings.update('ctxkit', { provider: 'do-not-change' }, f.descriptor().revision))
  assert.equal(await fs.readFile(f.patchPath, 'utf8'), before)
  assert.deepEqual(await fs.readdir(f.root), [])
})

test('native volatile root swap cancels old browser reads and discards old tools and buffered source', { skip: !anchor }, async t => {
  const f = await nativeFixture(t, { active: true })
  await fs.mkdir(join(f.root, 'topics/topic_old'), { recursive: true })
  await fs.writeFile(join(f.root, 'topics/topic_old/OVERVIEW.md'), encode({ kind: 'topic', id: 'topic_old', title: 'Fictional old root only' }, '# Old fixture'))
  const oldRecall = f.ctx.tools.definitions().find(item => item.name === 'recall_context')
  f.ctx.emit('session/event', f.session, { seq: 0, type: 'turn/start', data: { turn: 1 } })
  f.ctx.emit('session/event', f.session, { seq: 1, type: 'user/message', data: { source: { kind: 'user' }, content: [{ type: 'text', text: 'Fictional source buffered only in previous root.' }] } })
  let reached, release
  const entered = new Promise(resolve => { reached = resolve })
  const gate = new Promise(resolve => { release = resolve })
  const original = Vault.prototype.list
  Vault.prototype.list = async function (...args) { if (this.root === f.root) { reached(); await gate }; return original.apply(this, args) }
  t.after(() => { Vault.prototype.list = original; release() })
  const reading = f.execute({ action: 'topics' })
  await entered
  await f.ctx.settings.update('ctxkit', { root: f.other, enabled: false }, f.descriptor().revision)
  release()
  const rejected = await reading
  assert.equal(rejected.ok, false)
  assert.doesNotMatch(JSON.stringify(rejected), /Fictional old root only/)
  assert.ok(f.ctx.tools.definitions().some(item => item.name === 'recall_context'))
  assert.notEqual(f.ctx.tools.definitions().find(item => item.name === 'recall_context'), oldRecall)
  assert.equal((await f.execute()).state, 'ready')
  assert.equal((await f.execute({ action: 'status' })).processing.reason, 'CTXKIT_CAPTURE_DISABLED')
  await assert.rejects(() => oldRecall.execute({ query: 'old' }, { agent: { session: f.session }, signal: new AbortController().signal }), /CTXKIT_DISPOSED/)
  // Legacy native enable remains supported with the preserved fixed model configuration.
  await f.ctx.settings.update('ctxkit', { enabled: true }, f.descriptor().revision)
  f.ctx.emit('session/event', f.session, { seq: 2, type: 'turn/end', data: { turn: 1 } })
  const retry = f.ctx.tools.definitions().find(item => item.name === 'ctxkit_retry')
  await retry.execute({}, { agent: { session: f.session }, signal: new AbortController().signal })
  assert.equal(f.modelCalls(), 0, 'old buffered source must never be retried into new root')
  assert.equal((await f.execute({ action: 'topics' })).total, 0)
  assert.deepEqual(await fs.readdir(f.other), [])
})

test('native directory confirmation atomically enables exact scope and publishes new context through native fs', { skip: !anchor }, async t => {
  const f = await nativeFixture(t, { completion: request => JSON.stringify(request.purpose === 'ctxkit:capture' ? {
    meaningful: true, title: 'Fictional directory onboarding', summary: 'Fictional local checks passed; no deployment.', next: 'Review the result.', topicHints: ['Atlas'],
    facts: [{ text: 'Fictional local checks passed.', kind: 'result', evidence: 'observed', sourceSeqs: [2] }],
  } : { topics: [{ id: 'topic_atlas', title: 'Atlas', aliases: [], scope: 'Fictional example', body: '# Atlas\n\nFictional local checks passed.', expectedRevision: null }], documents: [], relations: [], note: '' }) })
  assert.deepEqual(await f.execute({ action: 'tree' }), { ok: true, configured: false, state: 'setup_required' })
  const selected = { root: f.root, enabled: true, allowedWorkspaces: [f.temp], useSessionModel: true, exactWorkspaces: true }
  const before = f.descriptor()
  await f.ctx.settings.update('ctxkit', selected, before.revision)
  const saved = f.descriptor()
  assert.deepEqual(saved.value, selected)
  assert.equal(saved.revision, before.revision + 1)
  assert.equal((await f.execute({ action: 'tree' })).total, 0)
  const readiness = (await f.execute({ action: 'status' })).processing
  assert.equal(readiness.captureEligible, true, JSON.stringify(readiness))
  assert.equal(f.modelCalls(), 0, 'choosing storage must not backfill or invoke the model')
  const turns = [], original = Engine.prototype.enqueueTurn
  Engine.prototype.enqueueTurn = function (...args) { const result = original.apply(this, args); turns.push(result); return result }
  t.after(() => { Engine.prototype.enqueueTurn = original })
  f.ctx.emit('session/event', f.session, { seq: 0, type: 'turn/start', data: { turn: 1 } })
  f.ctx.emit('session/event', f.session, { seq: 1, type: 'user/message', data: { source: { kind: 'user' }, content: [{ type: 'text', text: 'Check fictional Atlas locally.' }] } })
  f.ctx.emit('session/event', f.session, { seq: 2, type: 'assistant/message', data: { message: { content: [{ type: 'text', text: 'Fictional Atlas local checks passed; nothing was deployed.' }] } } })
  f.ctx.emit('session/event', f.session, { seq: 3, type: 'turn/end', data: { turn: 1 } })
  assert.equal(turns.length, 1)
  const [result] = await Promise.all(turns)
  assert.equal(result.status, 'done', result.error)
  assert.equal(f.modelCalls(), 2)
  assert.ok(f.modelRequests.every(request => request.provider === 'session-fixture' && request.model === 'session-model' && request.tools.length === 0))
  const tree = await f.execute({ action: 'tree', limit: 50 })
  assert.ok(tree.results.some(file => file.path === 'topics/topic_atlas/OVERVIEW.md'))
  assert.ok(tree.results.some(file => file.kind === 'session'))
  assert.ok(tree.results.some(file => file.kind === 'checkpoint'))
  const doc = await f.execute({ action: 'read', path: 'topics/topic_atlas/OVERVIEW.md' })
  assert.match(doc.body, /Fictional local checks passed/)
  assert.equal(doc.ok, true)
})

test('invalid dormant runtime limits reject onboarding before the native profile is committed', { skip: !anchor }, async t => {
  const f = await nativeFixture(t, { configOverrides: { maxInputChars: 1 } })
  const before = await fs.readFile(f.patchPath, 'utf8'), descriptor = f.descriptor()
  await assert.rejects(() => f.ctx.settings.update('ctxkit', { root: f.root, enabled: true, allowedWorkspaces: [f.temp], useSessionModel: true, exactWorkspaces: true }, descriptor.revision), /CTXKIT_CONFIG_LIMIT/)
  assert.equal(await fs.readFile(f.patchPath, 'utf8'), before)
  assert.deepEqual(f.descriptor().value, descriptor.value)
  assert.deepEqual(await f.execute({ action: 'tree' }), { ok: true, configured: false, state: 'setup_required' })
  assert.equal(f.modelCalls(), 0)
  assert.deepEqual(await fs.readdir(f.root), [])
})

test('invalid workspace in an atomic selection leaves every native configuration field unchanged', { skip: !anchor }, async t => {
  const f = await nativeFixture(t)
  const before = await fs.readFile(f.patchPath, 'utf8'), descriptor = f.descriptor()
  await assert.rejects(() => f.ctx.settings.update('ctxkit', { root: f.root, enabled: true, allowedWorkspaces: [join(f.temp, 'missing')], useSessionModel: true, exactWorkspaces: true }, descriptor.revision), /CTXKIT_CONFIG_DIRECTORY/)
  assert.equal(await fs.readFile(f.patchPath, 'utf8'), before)
  assert.deepEqual(f.descriptor().value, descriptor.value)
  assert.equal(f.modelCalls(), 0)
  assert.deepEqual(await fs.readdir(f.root), [])
})
