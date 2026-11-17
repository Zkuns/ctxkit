import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { readFile } from 'node:fs/promises'
import { Config } from '../config.js'

// These are loader/registration, pure request-lifecycle and static contract tests.
// They do not emulate React, render a DOM, or claim live-host/UI verification.
const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
const locales = Object.fromEntries(await Promise.all(['en', 'zh'].map(async lang => [lang, JSON.parse(await readFile(new URL(`../locale/${lang}.json`, import.meta.url), 'utf8'))])))
const plain = value => JSON.parse(JSON.stringify(value))
const response = value => ({ ok: true, value: { commandId: 'fictional-command', result: { kind: value.ok ? 'success' : 'error', text: JSON.stringify(value) } } })
const tick = () => new Promise(resolve => setImmediate(resolve))
function namespace(root = '/fictional/vault', revision = 0) {
  return { ns: 'ctxkit', revision, value: { root, enabled: false, allowedWorkspaces: [], useSessionModel: false, exactWorkspaces: false }, schema: { uid: 1, refs: { 1: { type: 'object', dict: { root: 2, enabled: 3, allowedWorkspaces: 4, useSessionModel: 3, exactWorkspaces: 3 } }, 2: { type: 'string' }, 3: { type: 'boolean' }, 4: { type: 'array', inner: 2 } } } }
}

const setupPatch = root => ({ root, enabled: true, allowedWorkspaces: ['/fictional/workspace'], useSessionModel: true, exactWorkspaces: true })
const configured = (root, revision) => ({ ...namespace(root, revision), value: setupPatch(root) })
function fixture({ settings = true, picker = true, panel = true } = {}) {
  let bundle, dictionaries, execute = async () => response({ ok: true, results: [], total: 0 })
  let describe = async () => ({ ok: true, value: { writable: true, namespaces: [namespace()] } }), update = async () => ({ ok: true, value: configured('/fictional/new', 1) });
  let list = async path => ({ ok: true, value: { path: path ?? '/fictional', home: '/fictional', crumbs: [], entries: [], truncated: false } }), pick = async () => ({ ok: true, value: null });
  const settingsCalls = [], folderCalls = [];
  const settingsService = { describe(...args) { settingsCalls.push(['describe', ...args]); return describe(...args) }, update(...args) { settingsCalls.push(['update', ...args]); return update(...args) } };
  const pickerService = { list(...args) { folderCalls.push(['list', ...args]); return list(...args) }, pick(...args) { folderCalls.push(['pick', ...args]); return pick(...args) } };
  const timers = new Map(), calls = [], registrations = [], disposers = [], events = new Map()
  let timerId = 0
  vm.runInNewContext(source, {
    window: { __ModuleLoader__: { load(value) { assert.equal(bundle, undefined); bundle = value } } },
    AbortController,
    setTimeout(fn, delay) { assert.ok([15000, 120000].includes(delay)); const id = ++timerId; timers.set(id, fn); return id },
    clearTimeout(id) { timers.delete(id) },
  })
  assert.equal(bundle.id, 'ctxkit-dsh')
  const plugin = bundle.factory(name => {
    assert.equal(name, 'react')
    // No React components or Hooks are executed by this contract suite.
    return Object.freeze({ createElement() { assert.fail('not a rendering test') } })
  })
  assert.equal(timers.size, 0, 'factory must not start resources')
  const own = dispose => { if (typeof dispose === 'function') disposers.push(dispose); return dispose }
  const ctx = {
    get(name) { return name === 'remote.settings' ? settings ? settingsService : undefined : name === 'remote.directoryPicker' ? picker ? pickerService : undefined : undefined },
    effect(fn) { return own(fn()) },
    on(name, fn) { events.set(name, fn); return own(() => events.delete(name)) },
    locale: {
      register(ns, value) { assert.equal(ns, 'ctxkit.library'); dictionaries = value; return () => {} },
      bind() { return key => { assert.ok(locales.en.library[key], `missing locale key ${key}`); return locales.en.library[key] } },
    },
    remote: {
      commands: { execute(...args) { calls.push(args); return execute(...args) } },
      $on(name, fn) { events.set(name, fn); return own(() => events.delete(name)) },
    },
    slots: {
      inject(name, fn) { assert.ok(['main', 'sidebar.panellist', 'plugins.bundle.config'].includes(name)); return name === 'plugins.bundle.config' && !panel ? undefined : own(fn()) },
      register(options, Component) { const entry = { options, Component }; registrations.push(entry); return () => registrations.splice(registrations.indexOf(entry), 1) },
    },
  }
  plugin.apply(ctx)
  const main = registrations.find(row => row.options.name === 'main').options.inject()
  const panelFace = registrations.find(row => row.options.name === 'plugins.bundle.config')?.options.inject?.() ?? {}
  // The Library now owns both read and setup faces; the plugin panel only guides.
  const storage = main, injected = main
  return { plugin, registrations, dictionaries, calls, events, timers, injected, main, storage, panelFace, settingsCalls, folderCalls,
    setDescribe(fn) { describe = fn }, setUpdate(fn) { update = fn }, setList(fn) { list = fn }, setPick(fn) { pick = fn },
    setExecute(fn) { execute = fn }, dispose() { [...disposers].reverse().forEach(fn => fn()) } }
}

test('lazy React-only artifact registers native slots, synchronized locales and owned effects', () => {
  const f = fixture()
  assert.equal(f.registrations.length, 3)
  const main = f.registrations.find(row => row.options.name === 'main')
  const storage = f.registrations.find(row => row.options.name === 'plugins.bundle.config')
  const sidebar = f.registrations.find(row => row.options.name === 'sidebar.panellist')
  assert.equal(main.options.key, 'ctxkit-library')
  assert.equal(storage.options.key, 'ctxkit-dsh')
  assert.equal(sidebar.options.id, 'ctxkit-library')
  assert.equal(sidebar.options.label(), 'Context library')
  assert.equal(typeof f.main.startStorage, 'function')
  assert.equal(typeof f.main.startChoosing, 'function')
  assert.equal(f.panelFace.startStorage, undefined)
  assert.equal(typeof f.storage.startChoosing, 'function')
  for (const lang of ['en', 'zh']) { assert.deepEqual(plain(f.dictionaries[lang]), locales[lang].library); assert.ok(locales[lang].meta.title) }
  assert.deepEqual(Object.keys(locales.en.library), Object.keys(locales.zh.library))
  assert.doesNotMatch(source, /dangerouslySetInnerHTML|innerHTML|document\.body|fetch\(|localStorage|setInterval|require\(['"]@deepseek/)
  f.dispose()
  assert.equal(f.registrations.length, 0)
  assert.equal(f.events.size, 0)
})

test('request face requires a real session and follows native RemoteResult command contract', async () => {
  const f = fixture(), values = []
  f.injected.startRead(undefined, { action: 'topics' }, value => values.push(value))
  await tick(); assert.equal(f.calls.length, 0)
  f.injected.startRead('fictional-session', { action: 'topics', query: '', offset: 0, limit: 20 }, value => values.push(value))
  await tick()
  assert.equal(f.calls[0][0], 'fictional-session')
  assert.deepEqual(JSON.parse(f.calls[0][1].slice('/ctxkit-library '.length)), { action: 'topics', query: '', offset: 0, limit: 20 })
  assert.deepEqual(plain(f.calls[0][2]), [])
  assert.ok(f.calls[0][3] instanceof AbortSignal)
  assert.deepEqual(plain(values), [{ ok: true, results: [], total: 0 }])
  assert.equal(f.timers.size, 0)
  f.dispose()
})

test('cleanup aborts requests and ignores late responses', async () => {
  const f = fixture(), values = []; let complete
  f.setExecute(() => new Promise(resolve => { complete = resolve }))
  const cancel = f.injected.startRead('fictional-session', { action: 'topics' }, value => values.push(value))
  await tick(); cancel()
  assert.equal(f.calls[0][3].aborted, true)
  complete(response({ ok: true, results: [{ title: 'STALE PRIVATE RECORD' }] })); await tick()
  assert.deepEqual(values, [])
  assert.equal(f.timers.size, 0)
  f.dispose()
})

test('timeout settles once, aborts transport and ignores late completion', async () => {
  const f = fixture(), values = []; let complete
  f.setExecute(() => new Promise(resolve => { complete = resolve }))
  f.injected.startRead('fictional-session', { action: 'read', path: 'topics/topic_fake/OVERVIEW.md' }, value => values.push(value))
  await tick(); assert.equal(f.timers.size, 1)
  const timeout = [...f.timers.values()][0]; timeout()
  assert.equal(f.calls[0][3].aborted, true)
  assert.deepEqual(plain(values), [{ ok: false, state: 'timeout' }])
  complete(response({ ok: true, body: 'LATE RECORD' })); await tick()
  assert.equal(values.length, 1)
  assert.equal(f.timers.size, 0)
  f.dispose()
})

test('profile/connection changes invalidate source and synchronously cancel pending reads', async () => {
  const f = fixture(), values = [], snapshots = [], pending = []
  f.setExecute(() => new Promise(resolve => pending.push(resolve)))
  const epoch = f.injected.hooks.libraryEpoch
  const unsubscribe = epoch.subscribe(() => snapshots.push(epoch.getSnapshot()))
  for (const name of ['plugin-manager/changed', 'connection/reset']) {
    f.injected.startRead('fictional-session', { action: 'topics' }, value => values.push(value)); await tick()
    f.events.get(name)()
    assert.equal(f.calls.at(-1)[3].aborted, true)
    pending.at(-1)(response({ ok: true, results: [] })); await tick()
  }
  assert.deepEqual(snapshots, [1, 2]); assert.deepEqual(values, [])
  unsubscribe(); f.dispose()
})

test('plugin disposal cancels pending reads before React unmount and prevents new reads', async () => {
  const f = fixture(), values = []; let complete
  f.setExecute(() => new Promise(resolve => { complete = resolve }))
  f.injected.startRead('fictional-session', { action: 'topics' }, value => values.push(value)); await tick()
  f.dispose(); assert.equal(f.calls[0][3].aborted, true)
  complete(response({ ok: true, results: [] })); await tick()
  f.injected.startRead('fictional-session', { action: 'topics' }, value => values.push(value)); await tick()
  assert.equal(f.calls.length, 1); assert.deepEqual(values, []); assert.equal(f.timers.size, 0)
})

test('empty, unconfigured, denied, unavailable and malformed wire results remain distinct', async () => {
  for (const [wire, expected] of [
    [response({ ok: true, results: [], total: 0 }), { ok: true, results: [], total: 0 }],
    [response({ ok: false, state: 'unconfigured', error: 'CTXKIT_UNCONFIGURED' }), { ok: false, state: 'unconfigured', error: 'CTXKIT_UNCONFIGURED' }],
    [{ ok: false, error: { code: 'access/denied', message: 'PRIVATE DETAILS' } }, { ok: false, state: 'denied' }],
    [{ ok: true, value: undefined }, { ok: false, state: 'unavailable' }],
    [{ ok: true, value: { result: { kind: 'success', text: '<html>PRIVATE DETAILS</html>' } } }, { ok: false, state: 'error' }],
    [{ ok: true, value: { result: { kind: 'success', text: 'x'.repeat(25001) } } }, { ok: false, state: 'error' }],
    [{ ok: true, value: { result: { kind: 'error', text: '{"ok":true}' } } }, { ok: false, state: 'error' }],
  ]) {
    const f = fixture(), values = []; f.setExecute(async () => wire)
    f.injected.startRead('fictional-session', { action: 'status' }, value => values.push(value)); await tick()
    assert.deepEqual(plain(values), [expected]); assert.doesNotMatch(JSON.stringify(values), /PRIVATE DETAILS/)
    f.dispose()
  }
})

test('static UX/security contracts retain scope keys, plain text, labels and reduced motion', () => {
  assert.match(source, /retainedBy\?\.mainView/)
  assert.match(source, /JSON\.stringify\(\[session\.id, session\.cwd, session\.permission, permitted, epoch\]\)/)
  assert.match(source, /list\.projectionsBySession\?\.\[row\.id\]\?\.values\?\.permissions\?\.currentValue/)
  assert.match(source, /current\.metadata\.sources\.slice\(0, 8\)/)
  assert.match(source, /current\?\.metadataTruncated/)
  assert.match(source, /t\('relations'\)/)
  assert.match(source, /item\.linksTruncated/)
  assert.match(source, /loaded\?\.key === requestKey \? loaded\.value : null/)
  assert.match(source, /h\('article', \{ className: 'ck-document' \}, text\(current\.body, 24000\)\)/)
  assert.match(source, /prefers-reduced-motion:reduce/)
  assert.match(source, /:focus-visible/)
  assert.match(source, /'aria-busy'/)
  assert.match(source, /h\('label'/)
  assert.match(source, /'aria-pressed'/)
  assert.match(source, /name: 'sidebar\.panellist'/)
  assert.doesNotMatch(source, /action: '(pause|retry|configure|write)'/)
})

test('storage settings remain optional and never suppress the existing sidebar', async () => {
  const f = fixture({ settings: false, picker: false }), values = []
  assert.deepEqual(plain(f.plugin.inject), ['slots', 'locale', 'remote', 'remote.commands'])
  assert.equal(f.registrations.length, 3)
  f.injected.startStorage({ action: 'load' }, value => values.push(value)); await tick()
  assert.deepEqual(plain(values), [{ ok: false, state: 'unavailable', diagnostic: 'CTXKIT_SETTINGS_CLIENT_SERVICE_MISSING' }])
  assert.equal(f.settingsCalls.length, 0); f.dispose()
})

test('load projects only the exact native entry descriptor and handles read-only profiles', async () => {
  const f = fixture(), values = []
  f.setDescribe(async () => ({ ok: true, value: { writable: false, namespaces: [
    { ...namespace('/secret-other-plugin'), ns: 'other', value: { token: 'DO_NOT_RETAIN' } }, namespace(),
  ] } }))
  f.injected.startStorage({ action: 'load' }, value => values.push(value)); await tick()
  assert.deepEqual(plain(values), [{ ok: true, writable: false, descriptor: { ns: 'ctxkit', root: '/fictional/vault', enabled: false, revision: 0, allowedWorkspaces: [], useSessionModel: false, exactWorkspaces: false } }])
  assert.doesNotMatch(JSON.stringify(values), /DO_NOT_RETAIN|secret-other-plugin/)
  assert.deepEqual(f.settingsCalls, [['describe']]); assert.equal(f.calls.length, 0); f.dispose()
})

test('unknown, ambiguous or incompatible settings namespaces never become editable', async () => {
  const f = fixture()
  for (const namespaces of [[{ ...namespace(), ns: 'ctxkit-other' }], [namespace(), namespace()], [{ ...namespace(), schema: {} }]]) {
    f.setDescribe(async () => ({ ok: true, value: { writable: true, namespaces } })); let value
    f.injected.startStorage({ action: 'load' }, v => { value = v }); await tick()
    assert.equal(value.state, 'unavailable')
  }
  f.dispose()
})

test('explicit native settings setup atomically persists only the five consented fields', async () => {
  const f = fixture(), values = [], epoch = f.injected.hooks.libraryEpoch
  f.injected.startStorage({ action: 'save', workspace: '/fictional/workspace', sessionId: 'fictional-session', ns: 'ctxkit', revision: 0, root: '/fictional/new', allowedWorkspaces: ['ignored'], enabled: true }, v => values.push(v)); await tick()
  assert.deepEqual(plain(f.settingsCalls), [['update', 'ctxkit', setupPatch('/fictional/new'), 0]])
  assert.equal(values[0].saved, true); assert.equal(epoch.getSnapshot(), 1)
  assert.equal(f.calls.length, 0); assert.equal(f.folderCalls.length, 0); f.dispose()
})

test('save validates namespace, revision and absolute path before dispatch', async () => {
  const f = fixture()
  for (const request of [{ root: '~/vault' }, { root: 'relative/path' }, { revision: undefined }, { ns: 'other' }, { root: '' }, { root: '/bad\npath' }]) {
    let value
    f.injected.startStorage({ action: 'save', workspace: '/fictional/workspace', sessionId: 'fictional-session', ns: 'ctxkit', revision: 0, root: '/fictional', ...request }, v => { value = v }); await tick()
    assert.equal(value.state, 'invalid')
  }
  assert.equal(f.settingsCalls.length, 0); f.dispose()
})

test('settings conflicts and rejected paths remain failures without leaking host errors', async () => {
  const f = fixture()
  for (const [code, state] of [['settings/conflict', 'conflict'], ['settings/rejected', 'rejected'], ['gateway/forbidden', 'denied'], ['gateway/internal', 'error']]) {
    let value
    f.setUpdate(async () => ({ ok: false, error: { code, message: '/private/DO_NOT_RETAIN' } }))
    f.injected.startStorage({ action: 'save', workspace: '/fictional/workspace', sessionId: 'fictional-session', ns: 'ctxkit', revision: 0, root: '/fictional/new' }, v => { value = v }); await tick()
    assert.deepEqual(plain(value), { ok: false, state }); assert.doesNotMatch(JSON.stringify(value), /DO_NOT_RETAIN/)
  }
  f.dispose()
})

test('native settings events invalidate library results and prevent stale success', async () => {
  const f = fixture(), values = []; let finishRead, finishSave
  f.setExecute(() => new Promise(resolve => { finishRead = resolve }))
  f.injected.startRead('fictional-session', { action: 'topics' }, v => values.push(v)); await tick()
  f.setUpdate(() => new Promise(resolve => { finishSave = resolve }))
  f.injected.startStorage({ action: 'save', workspace: '/fictional/workspace', sessionId: 'fictional-session', ns: 'ctxkit', revision: 0, root: '/fictional/new' }, v => values.push(v)); await tick()
  f.events.get('settings/document-updated')('other', 10)
  assert.equal(f.injected.hooks.libraryEpoch.getSnapshot(), 0)
  f.events.get('settings/document-updated')('ctxkit', 2)
  assert.equal(f.calls[0][3].aborted, true)
  finishRead(response({ ok: true, body: 'OLD ROOT' })); finishSave({ ok: true, value: configured('/fictional/new', 1) }); await tick()
  assert.deepEqual(plain(values), [{ ok: false, state: 'conflict' }])
  f.injected.startStorage({ action: 'save', workspace: '/fictional/workspace', sessionId: 'fictional-session', ns: 'ctxkit', revision: 0, root: '/fictional/new' }, v => values.push(v)); await tick()
  assert.equal(f.settingsCalls.length, 1); f.dispose()
})

test('saved root and recording state must match the explicit request', async () => {
  const f = fixture()
  for (const row of [configured('/fictional/wrong', 1), { ...configured('/fictional/new', 1), value: { root: '/fictional/new', enabled: true } }]) {
    let value; f.setUpdate(async () => ({ ok: true, value: row }))
    f.injected.startStorage({ action: 'save', workspace: '/fictional/workspace', sessionId: 'fictional-session', ns: 'ctxkit', revision: 0, root: '/fictional/new' }, v => { value = v }); await tick()
    assert.equal(value.state, 'conflict')
  }
  f.dispose()
})

test('connection change, local cancellation and timeout never accept a late save outcome', async () => {
  for (const action of ['connection/reset', 'cancel', 'timeout', 'dispose']) {
    const f = fixture(), values = []; let complete
    f.setUpdate(() => new Promise(resolve => { complete = resolve }))
    const cancel = f.injected.startStorage({ action: 'save', workspace: '/fictional/workspace', sessionId: 'fictional-session', ns: 'ctxkit', revision: 0, root: '/fictional/new' }, v => values.push(v)); await tick()
    if (action === 'cancel') cancel()
    else if (action === 'timeout') [...f.timers.values()][0]()
    else if (action === 'dispose') f.dispose()
    else f.events.get(action)()
    complete({ ok: true, value: configured('/fictional/new', 1) }); await tick()
    assert.deepEqual(plain(values), action === 'timeout' ? [{ ok: false, state: 'error' }] : [])
    assert.equal(f.timers.size, 0); f.dispose()
  }
})

test('folder browser uses native host listing only and never writes configuration', async () => {
  const f = fixture(), values = []
  f.setList(async () => ({ ok: true, value: { path: '/fictional', home: '/fictional', crumbs: [{ name: '/', path: '/', hidden: false }],
    entries: [{ name: 'work', path: '/fictional/work', hidden: false }, { name: '.private', path: '/fictional/.private', hidden: true }, { name: 'bad', path: 'relative' }], truncated: true } }))
  f.injected.startFolders({ path: '/fictional', canList: true, canPick: true }, v => values.push(v)); await tick()
  assert.equal(f.folderCalls[0][0], 'list'); assert.equal(f.folderCalls[0][1], '/fictional')
  assert.ok(f.folderCalls[0][2] instanceof AbortSignal)
  assert.equal(values[0].entries.length, 2); assert.equal(values[0].truncated, true)
  assert.equal(f.settingsCalls.length, 0); assert.equal(f.calls.length, 0); f.dispose()
})

test('native chooser is called only for the exact native capability and ignores cancelled lifetime', async () => {
  const f = fixture(), values = []; let complete
  f.setList(async () => ({ ok: false, error: { code: 'directory-picker/unavailable', details: { capability: 'native' } } }))
  f.setPick(() => new Promise(resolve => { complete = resolve }))
  const cancel = f.injected.startFolders({ canList: true, canPick: true }, v => values.push(v)); await tick()
  assert.deepEqual(plain(values), [{ ok: true, nativeWaiting: true }]); assert.equal(f.folderCalls[1][0], 'pick')
  assert.ok(f.folderCalls[1][1] instanceof AbortSignal)
  cancel(); assert.equal(f.folderCalls[1][1].aborted, true)
  complete({ ok: true, value: '/fictional/chosen' }); await tick()
  assert.equal(values.length, 1); assert.equal(f.settingsCalls.length, 0); f.dispose()
})

test('native Config JSON reference table is accepted after real serialization', async () => {
  const f = fixture(), values = []
  const schema = JSON.parse(JSON.stringify(Config.toJSON()))
  // Settings projects the five volatile setup fields. Keep the real Schemastery uid
  // table and field schemas rather than substituting made-up reference types.
  const root = schema.refs[schema.uid]
  root.dict = Object.fromEntries(['root', 'enabled', 'allowedWorkspaces', 'useSessionModel', 'exactWorkspaces'].map(key => [key, root.dict[key]]))
  const descriptor = { ns: 'ctxkit', revision: 3, schema, value: namespace('', 3).value }
  f.setDescribe(async () => JSON.parse(JSON.stringify({ ok: true, value: { writable: true, hasDocument: true, namespaces: [descriptor] } })))
  f.injected.startStorage({ action: 'load' }, value => values.push(value)); await tick()
  assert.deepEqual(plain(values), [{ ok: true, writable: true, descriptor: { ns: 'ctxkit', revision: 3, root: '', enabled: false, allowedWorkspaces: [], useSessionModel: false, exactWorkspaces: false } }])
  f.dispose()
})

test('settings load diagnostics distinguish each failure without leaking other namespaces or values', async () => {
  const f = fixture()
  const badSchema = { ...namespace(), schema: {} }
  const badValue = { ...namespace(), value: { root: 123, enabled: false } }
  const cases = [
    [{ ok: false, error: { code: 'gateway/internal', message: '/PRIVATE/DO_NOT_SHOW', details: { secret: 'DO_NOT_SHOW' } } }, 'CTXKIT_SETTINGS_HOST_FAILED', 'gateway/internal'],
    [{ ok: false, error: { code: '/PRIVATE/DO_NOT_SHOW' } }, 'CTXKIT_SETTINGS_HOST_FAILED', ''],
    [{ ok: true, value: {} }, 'CTXKIT_SETTINGS_RESPONSE_INVALID'],
    [{ ok: true, value: { namespaces: [{ ...namespace(), ns: 'PRIVATE_OTHER_NAMESPACE', value: { password: 'DO_NOT_SHOW' } }] } }, 'CTXKIT_SETTINGS_DESCRIPTOR_MISSING'],
    [{ ok: true, value: { namespaces: [namespace(), namespace()] } }, 'CTXKIT_SETTINGS_DESCRIPTOR_AMBIGUOUS'],
    [{ ok: true, value: { namespaces: [badSchema] } }, 'CTXKIT_SETTINGS_SCHEMA_INCOMPATIBLE'],
    [{ ok: true, value: { namespaces: [badValue] } }, 'CTXKIT_SETTINGS_VALUE_INVALID'],
  ]
  for (const [reply, diagnostic, nativeCode] of cases) {
    let value
    f.setDescribe(async () => reply)
    f.injected.startStorage({ action: 'load' }, v => { value = v }); await tick()
    assert.equal(value.diagnostic, diagnostic)
    assert.equal(value.nativeCode, nativeCode)
    assert.doesNotMatch(JSON.stringify(value), /PRIVATE|DO_NOT_SHOW|password/)
  }
  f.setDescribe(async () => { throw new Error('/PRIVATE/DO_NOT_SHOW') }); let failure
  f.injected.startStorage({ action: 'load' }, v => { failure = v }); await tick()
  assert.equal(failure.diagnostic, 'CTXKIT_SETTINGS_REQUEST_FAILED')
  assert.doesNotMatch(JSON.stringify(failure), /PRIVATE|DO_NOT_SHOW/)
  f.dispose()
})

test('Library owns the prominent chooser, one setup confirmation and accessible feedback', () => {
  const page = source.slice(source.indexOf('function Page('), source.indexOf("inject: ['slots'"))
  assert.match(page, /h\(StorageAccess/)
  assert.match(source, /name: 'plugins\.bundle\.config', key: 'ctxkit-dsh'/)
  assert.match(source, /settings\/describe/); assert.match(source, /settings\/update/)
  assert.match(source, /key: JSON.stringify\(\[epoch, readable, canWrite, canList, canPick, props.session\?\.id, props.session\?\.cwd, props.session\?\.permission\]\)/)
  assert.match(source, /'aria-describedby': ids/)
  assert.match(source, /'storageSelect'/); assert.match(source, /t\('storageChoose'\)/)
  assert.match(source, /t\('storageCloseBrowse'\)/); assert.match(source, /t\('storageReload'\)/)
  assert.match(source, /event\.key === 'Escape'/)
  assert.match(source, /React\.useLayoutEffect/)
  assert.match(source, /disabled: busy \|\| folderOpen \|\| !writable \|\| needsReload/)
  assert.match(source, /h\('details'/); assert.match(source, /role: notice === 'storageSaved' \? 'status' : 'alert'/)
  assert.match(source, /const notice = uncertain \? 'storageError' : changed \? 'storageChanged' : message/)
  const chooserSource = source.slice(source.indexOf('function StorageChooser('), source.indexOf('function SessionContent('))
  assert.doesNotMatch(chooserSource, /type: 'submit'|h\('form'|className: 'ck-path-input'/)
  assert.doesNotMatch(source, /t\('storageSave'\)|h\(Storage, props\)/)
  assert.doesNotMatch(source, /createDirectory\(|createWorkspace\(|showDirectoryPicker\(|webkitdirectory/)
})

const choose = (f, values, overrides = {}) => f.storage.startChoosing({ ns: 'ctxkit', revision: 0, workspace: '/fictional/workspace', sessionId: 'fictional-session', path: '/fictional/new', canList: true, canPick: true, ...overrides }, value => values.push(value))
const updates = f => f.settingsCalls.filter(call => call[0] === 'update')
const listing = path => ({ ok: true, value: { path, home: '/fictional', entries: [], crumbs: [], truncated: false } })

test('confirming the current listed directory automatically saves exactly one guarded selection', async () => {
  const f = fixture(), values = []
  const actor = choose(f, values); await tick()
  assert.equal(values.at(-1).path, '/fictional/new')
  assert.equal(updates(f).length, 0, 'opening a chooser does not save')
  actor.confirm('/fictional/new'); await tick()
  assert.deepEqual(plain(updates(f)), [['update', 'ctxkit', setupPatch('/fictional/new'), 0]])
  assert.ok(values.some(value => value.saving === true))
  assert.equal(values.at(-1).saved, true)
  assert.equal(values.at(-1).descriptor.root, '/fictional/new')
  actor.confirm('/fictional/new'); actor.navigate('/fictional/ignored'); await tick()
  assert.equal(updates(f).length, 1); assert.equal(f.folderCalls.length, 1)
  assert.equal(f.timers.size, 0); f.dispose()
})

test('directory navigation and cancellation are draft-only and abort pending listing', async () => {
  const f = fixture(), values = []; let finish
  const actor = choose(f, values); await tick()
  actor.navigate('/fictional/other'); await tick()
  assert.equal(values.at(-1).path, '/fictional/other')
  f.setList(() => new Promise(resolve => { finish = resolve }))
  actor.navigate('/fictional/pending'); await tick()
  const count = values.length
  actor.cancel()
  assert.equal(f.folderCalls.at(-1)[2].aborted, true)
  finish(listing('/fictional/pending')); await tick()
  actor.confirm('/fictional/pending'); await tick()
  assert.equal(values.length, count); assert.equal(updates(f).length, 0)
  assert.equal(f.timers.size, 0); f.dispose()
})

test('confirmation cannot name another path or use an old path while navigation is loading', async () => {
  const f = fixture(), values = []; let finish
  const actor = choose(f, values); await tick()
  actor.confirm('/fictional/not-listed'); await tick()
  assert.equal(updates(f).length, 0)
  f.setList(() => new Promise(resolve => { finish = resolve }))
  actor.navigate('/fictional/next'); await tick()
  actor.confirm('/fictional/new'); actor.confirm('/fictional/next'); await tick()
  assert.equal(updates(f).length, 0)
  finish(listing('/fictional/next')); await tick()
  f.setUpdate(async () => ({ ok: true, value: configured('/fictional/next', 1) }))
  actor.confirm('/fictional/next'); await tick()
  assert.equal(updates(f).length, 1)
  assert.equal(updates(f)[0][2].root, '/fictional/next')
  assert.equal(values.at(-1).saved, true); f.dispose()
})

test('a stale listing or failed navigation never makes a directory selectable', async () => {
  const f = fixture(), values = [], replies = []
  f.setList(() => new Promise(resolve => replies.push(resolve)))
  const actor = choose(f, values); await tick()
  actor.navigate('/fictional/next'); await tick()
  replies[0](listing('/fictional/new')); await tick()
  actor.confirm('/fictional/new'); await tick()
  assert.equal(updates(f).length, 0)
  replies[1]({ ok: false, error: { code: 'directory-picker/denied' } }); await tick()
  actor.confirm('/fictional/next'); await tick()
  assert.equal(updates(f).length, 0)
  actor.cancel(); f.dispose()
})

test('native picker success joins the same automatic persistence boundary', async () => {
  const f = fixture(), values = []
  f.setList(async () => ({ ok: false, error: { code: 'directory-picker/unavailable', details: { capability: 'native' } } }))
  f.setPick(async () => ({ ok: true, value: '/fictional/new' }))
  choose(f, values); await tick()
  assert.deepEqual(f.folderCalls.map(call => call[0]), ['list', 'pick'])
  assert.ok(f.folderCalls[1][1] instanceof AbortSignal)
  assert.deepEqual(plain(updates(f)), [['update', 'ctxkit', setupPatch('/fictional/new'), 0]])
  assert.equal(values.at(-1).saved, true); f.dispose()
})

test('native picker cancel and unavailable providers never write settings', async () => {
  for (const mode of ['cancelled', 'unavailable', 'no-capability']) {
    const f = fixture({ picker: mode !== 'unavailable' }), values = []
    f.setList(async () => ({ ok: false, error: { code: 'directory-picker/unavailable', details: { capability: 'native' } } }))
    const actor = choose(f, values, mode === 'no-capability' ? { canList: false, canPick: false } : {})
    await tick()
    if (mode === 'cancelled') assert.equal(values.at(-1).cancelled, true)
    else assert.equal(values.at(-1).state, 'unavailable')
    actor.confirm('/fictional/new'); await tick()
    assert.equal(updates(f).length, 0); actor.cancel(); f.dispose()
  }
})

test('closing, disposal or connection reset before native selection cannot start a save', async () => {
  for (const action of ['cancel', 'dispose', 'connection/reset', 'plugin-manager/changed']) {
    const f = fixture(), values = []; let finish
    f.setPick(() => new Promise(resolve => { finish = resolve }))
    const actor = choose(f, values, { canList: false }); await tick()
    assert.ok(values.some(value => value.nativeWaiting))
    if (action === 'cancel') actor.cancel()
    else if (action === 'dispose') f.dispose()
    else f.events.get(action)()
    const count = values.length
    assert.equal(f.folderCalls.at(-1)[1].aborted, true)
    finish({ ok: true, value: '/fictional/new' }); await tick()
    actor.confirm('/fictional/new'); await tick()
    assert.equal(values.length, count); assert.equal(updates(f).length, 0)
    assert.equal(f.timers.size, 0); f.dispose()
  }
})

test('cancellation, disposal and reset immediately after confirm stop the deferred save dispatch', async () => {
  for (const action of ['cancel', 'dispose', 'connection/reset']) {
    const f = fixture(), values = []
    const actor = choose(f, values); await tick()
    actor.confirm('/fictional/new')
    if (action === 'cancel') actor.cancel()
    else if (action === 'dispose') f.dispose()
    else f.events.get(action)()
    await tick()
    assert.equal(updates(f).length, 0)
    assert.equal(f.storage.hooks.storageOutcome.getSnapshot(), false)
    assert.equal(f.timers.size, 0); f.dispose()
  }
})

test('double confirmation and navigation during saving cannot issue a second write', async () => {
  const f = fixture(), values = []; let finish
  f.setUpdate(() => new Promise(resolve => { finish = resolve }))
  const actor = choose(f, values); await tick()
  actor.confirm('/fictional/new'); actor.confirm('/fictional/new'); actor.navigate('/fictional/other'); await tick()
  assert.equal(updates(f).length, 1); assert.equal(f.folderCalls.length, 1)
  actor.confirm('/fictional/new'); actor.navigate('/fictional/other'); await tick()
  assert.equal(updates(f).length, 1); assert.equal(f.folderCalls.length, 1)
  finish({ ok: true, value: configured('/fictional/new', 1) }); await tick()
  assert.equal(values.filter(value => value.saved).length, 1); f.dispose()
})

test('known revision changes block chooser dispatch and host conflicts or readonly refusals stay failures', async () => {
  const f = fixture(), values = []
  const actor = choose(f, values); await tick()
  f.events.get('settings/document-updated')('ctxkit', 1)
  actor.confirm('/fictional/new'); await tick()
  assert.equal(updates(f).length, 0); assert.equal(values.at(-1).state, 'conflict'); f.dispose()
  for (const [code, expected] of [['settings/conflict', 'conflict'], ['gateway/forbidden', 'denied'], ['settings/rejected', 'rejected']]) {
    const f = fixture(), values = []
    f.setUpdate(async () => ({ ok: false, error: { code, message: 'PRIVATE_HOST_DETAIL' } }))
    const actor = choose(f, values); await tick(); actor.confirm('/fictional/new'); await tick()
    assert.equal(values.at(-1).state, expected)
    assert.equal(values.some(value => value.saved), false)
    assert.doesNotMatch(JSON.stringify(values), /PRIVATE_HOST_DETAIL/)
    assert.equal(updates(f).length, 1); f.dispose()
  }
})

test('unknown dispatched save remains blocked across chooser remount until explicit authoritative reload', async () => {
  const f = fixture(), values = []; let finish
  f.setUpdate(() => new Promise(resolve => { finish = resolve }))
  const actor = choose(f, values); await tick(); actor.confirm('/fictional/new'); await tick()
  actor.cancel()
  assert.equal(f.storage.hooks.storageOutcome.getSnapshot(), true)
  finish({ ok: true, value: configured('/fictional/new', 1) }); await tick()
  f.events.get('connection/reset')()
  f.setDescribe(async () => ({ ok: true, value: { writable: true, namespaces: [configured('/fictional/new', 1)] } }))
  f.storage.startStorage({ action: 'load' }, () => {}); await tick()
  assert.equal(f.storage.hooks.storageOutcome.getSnapshot(), true, 'automatic panel mount/read cannot acknowledge uncertainty')
  const next = choose(f, values, { revision: 1 }); await tick(); next.confirm('/fictional/new'); await tick()
  assert.equal(updates(f).length, 1); assert.equal(values.at(-1).state, 'error')
  f.storage.startStorage({ action: 'load', acknowledge: true }, value => values.push(value)); await tick()
  assert.equal(f.storage.hooks.storageOutcome.getSnapshot(), false)
  assert.equal(values.at(-1).descriptor.revision, 1)
  f.setUpdate(async () => ({ ok: true, value: configured('/fictional/new', 2) }))
  const accepted = choose(f, values, { revision: 1 }); await tick(); accepted.confirm('/fictional/new'); await tick()
  assert.equal(updates(f).length, 2); assert.equal(updates(f)[1][3], 1)
  assert.equal(values.at(-1).saved, true); f.dispose()
})

test('chooser timeout keeps an unknown save outcome and never accepts late success', async () => {
  const f = fixture(), values = []; let finish
  f.setUpdate(() => new Promise(resolve => { finish = resolve }))
  const actor = choose(f, values); await tick(); actor.confirm('/fictional/new'); await tick()
  assert.equal(f.timers.size, 1)
  ;[...f.timers.values()][0]()
  assert.equal(values.at(-1).state, 'error')
  assert.equal(f.storage.hooks.storageOutcome.getSnapshot(), true)
  const count = values.length
  finish({ ok: true, value: configured('/fictional/new', 1) }); await tick()
  assert.equal(values.length, count); assert.equal(values.some(value => value.saved), false)
  assert.equal(f.timers.size, 0); f.dispose()
})

test('missing plugin-panel owner does not suppress the read-only library or start settings work', async () => {
  const f = fixture({ panel: false }), values = []
  assert.deepEqual(f.registrations.map(row => row.options.name), ['main', 'sidebar.panellist'])
  assert.equal(typeof f.storage.startChoosing, 'function')
  f.main.startRead('fictional-session', { action: 'topics' }, value => values.push(value)); await tick()
  assert.equal(values[0].ok, true)
  assert.equal(f.settingsCalls.length, 0); assert.equal(f.folderCalls.length, 0); f.dispose()
})

test('a synchronous close on native saving feedback prevents deferred persistence', async () => {
  const f = fixture(), values = []; let actor
  f.setPick(async () => ({ ok: true, value: '/fictional/new' }))
  actor = f.storage.startChoosing({ ns: 'ctxkit', revision: 0, workspace: '/fictional/workspace', sessionId: 'fictional-session', canList: false, canPick: true }, value => {
    values.push(value)
    if (value.saving) actor.cancel()
  })
  await tick()
  assert.ok(values.some(value => value.saving))
  assert.equal(updates(f).length, 0)
  assert.equal(f.storage.hooks.storageOutcome.getSnapshot(), false)
  assert.equal(f.timers.size, 0); f.dispose()
})

test('save receipts cannot regress behind the requested revision but allow an equal accepted revision', async () => {
  for (const revision of [2, 3]) {
    const f = fixture(), values = []
    f.setUpdate(async () => ({ ok: true, value: configured('/fictional/new', revision) }))
    const actor = choose(f, values, { revision: 3 }); await tick(); actor.confirm('/fictional/new'); await tick()
    assert.equal(updates(f)[0][3], 3)
    if (revision < 3) { assert.equal(values.at(-1).state, 'conflict'); assert.equal(values.some(value => value.saved), false) }
    else assert.equal(values.at(-1).saved, true)
    f.dispose()
  }
})

test('chooser success requires complete setup and an accepted revision', async () => {
  for (const wrong of [configured('/fictional/wrong', 1), { ...configured('/fictional/new', 1), value: { root: '/fictional/new', enabled: true } }, { ...configured('/fictional/new', 1), revision: '1' }]) {
    const f = fixture(), values = []
    f.setUpdate(async () => ({ ok: true, value: wrong }))
    const actor = choose(f, values); await tick(); actor.confirm('/fictional/new'); await tick()
    assert.equal(values.at(-1).state, 'conflict')
    assert.equal(values.some(value => value.saved), false); f.dispose()
  }
})


test('flat managed entries form stable nested directories including a managed root index', () => {
  const f = fixture(), records = [
    { path: 'topics/topic_alpha/docs/architecture.md', kind: 'document', title: 'Architecture', revision: 'a' },
    { path: 'sessions/session_beta/checkpoints/cp_one.md', kind: 'checkpoint', title: 'Checkpoint', revision: 'b' },
    { path: 'topics/topic_alpha/OVERVIEW.md', kind: 'topic', title: 'Alpha', revision: 'c' },
    { path: 'INDEX.md', kind: 'index', title: 'Library index', revision: 'd' },
  ]
  const tree = plain(f.main.buildTree(records))
  assert.deepEqual(tree.map(node => [node.name, node.kind]), [['sessions', 'directory'], ['topics', 'directory'], ['INDEX.md', 'file']])
  const alpha = tree[1].children[0]
  assert.equal(alpha.path, 'topics/topic_alpha')
  assert.deepEqual(alpha.children.map(node => node.name), ['docs', 'OVERVIEW.md'])
  assert.deepEqual(alpha.children[0].children[0], { path: records[0].path, name: 'architecture.md', kind: 'file', title: 'Architecture', recordKind: 'document', revision: 'a' })
  assert.deepEqual(plain(f.main.buildTree([...records].reverse())), tree)
  assert.equal(records[0].children, undefined, 'constructing a tree does not mutate its source')
  f.dispose()
})

test('tree rejects unsafe paths and bounds titles, depth, records and duplicate leaves', () => {
  const f = fixture()
  const invalid = ['../INDEX.md', '/INDEX.md', '.ctxkit/jobs/job.md', 'topics//x.md', 'topics/../x.md', 'topics/a/../../x.md', 'secrets/data.md', 'topics/a/file.html', 'topics/a/file.md/evil.md', 'topics/' + 'a/'.repeat(22) + 'b.md']
  assert.deepEqual(plain(f.main.buildTree(invalid.map(path => ({ path })))), [])
  const duplicate = f.main.buildTree([{ path: 'INDEX.md', title: 'x'.repeat(1000) }, { path: 'INDEX.md', title: 'ignored' }])
  assert.equal(duplicate.length, 1); assert.equal(duplicate[0].title.length, 500)
  const many = f.main.buildTree(Array.from({ length: 75 }, (_, i) => ({ path: 'topics/topic_a/doc_' + i + '.md' })))
  assert.equal(many[0].children[0].children.length, 50)
  assert.deepEqual(plain(f.main.buildTree(null)), [])
  const safeKey = f.main.buildTree([{ path: 'topics/__proto__/OVERVIEW.md', title: '<script>inert title</script>' }])
  assert.equal(safeKey[0].children[0].name, '__proto__')
  assert.equal({}.polluted, undefined); assert.equal(f.calls.length, 0); f.dispose()
})

test('tree requests preserve the Host cursor and can read the managed INDEX through the same bridge', async () => {
  const f = fixture(), values = []
  const tree = { ok: true, configured: true, state: 'ready', action: 'tree', results: [{ path: 'INDEX.md', kind: 'index', title: 'Index', revision: 'a' }], offset: 0, limit: 50, total: 23, nextOffset: 1, truncated: true, readOnly: true, untrusted: true }
  f.setExecute(async () => response(tree))
  f.main.startRead('fictional-session', { action: 'tree', offset: 0, limit: 50 }, value => values.push(value)); await tick()
  assert.deepEqual(plain(values), [tree])
  assert.equal(values[0].nextOffset, 1, 'the Host may return fewer entries than the requested limit')
  f.main.startRead('fictional-session', { action: 'read', path: 'INDEX.md', offset: 0, limit: 10000 }, () => {}); await tick()
  assert.equal(JSON.parse(f.calls.at(-1)[1].slice('/ctxkit-library '.length)).path, 'INDEX.md')
  assert.equal(f.settingsCalls.length, 0); f.dispose()
})

test('browse setup gate is independent of capture and the chosen model', () => {
  const f = fixture(), session = { id: 'fictional-session', cwd: '/fictional/workspace' }
  const descriptor = { root: '/fictional/vault', enabled: false, allowedWorkspaces: ['/fictional/workspace'], useSessionModel: false, exactWorkspaces: true }
  assert.equal(f.main.canBrowseStorage(descriptor, session), true)
  assert.equal(f.main.canBrowseStorage({ ...descriptor, root: '' }, session), false)
  assert.equal(f.main.canBrowseStorage({ ...descriptor, allowedWorkspaces: [] }, session), false)
  assert.equal(f.main.canBrowseStorage(descriptor, { ...session, cwd: '/fictional/workspace/child' }), false)
  assert.equal(f.main.canBrowseStorage({ ...descriptor, exactWorkspaces: false }, { ...session, cwd: '/fictional/workspace/child' }), true)
  assert.equal(f.main.canBrowseStorage({ ...descriptor, exactWorkspaces: false }, { ...session, cwd: '/fictional/workspace-other' }), false)
  assert.equal(f.main.canBrowseStorage(descriptor, null), false)
  assert.equal(f.main.canBrowseStorage(undefined, session), false)
  assert.equal(f.calls.length, 0); f.dispose()
})

test('legacy chosen root can be explicitly connected without navigating or issuing two writes', async () => {
  const f = fixture(), values = []
  const actor = choose(f, values, { existing: true })
  await tick(); assert.equal(f.folderCalls.length, 0); assert.equal(updates(f).length, 0)
  actor.confirm('/fictional/other'); await tick(); assert.equal(updates(f).length, 0)
  actor.confirm('/fictional/new'); actor.confirm('/fictional/new'); await tick()
  assert.deepEqual(plain(updates(f)), [['update', 'ctxkit', setupPatch('/fictional/new'), 0]])
  assert.equal(values.at(-1).saved, true); f.dispose()
})

test('setup without an actual session id or absolute workspace never dispatches', async () => {
  for (const overrides of [{ sessionId: undefined }, { sessionId: '' }, { workspace: undefined }, { workspace: 'relative' }, { workspace: '' }]) {
    const f = fixture(), values = []
    const actor = choose(f, values, { existing: true, ...overrides })
    actor.confirm('/fictional/new'); await tick()
    assert.equal(updates(f).length, 0); assert.equal(values.at(-1).state, 'invalid'); f.dispose()
  }
})

test('every setup field in the receipt must match the explicit scoped confirmation', async () => {
  for (const wrong of [{ enabled: false }, { allowedWorkspaces: [] }, { allowedWorkspaces: ['/fictional/other'] }, { allowedWorkspaces: ['/fictional/workspace', '/fictional/other'] }, { useSessionModel: false }, { exactWorkspaces: false }]) {
    const f = fixture(), values = []
    f.setUpdate(async () => ({ ok: true, value: { ...configured('/fictional/new', 1), value: { ...setupPatch('/fictional/new'), ...wrong } } }))
    const actor = choose(f, values); await tick(); actor.confirm('/fictional/new'); await tick()
    assert.equal(updates(f).length, 1); assert.equal(values.at(-1).state, 'conflict'); assert.equal(values.some(value => value.saved), false); f.dispose()
  }
})

test('older Host schemas cannot silently receive incomplete root-only setup', async () => {
  const f = fixture(), values = [], old = namespace('/fictional/vault', 0)
  delete old.schema.refs[1].dict.useSessionModel
  f.setDescribe(async () => ({ ok: true, value: { writable: true, namespaces: [old] } }))
  f.main.startStorage({ action: 'load' }, value => values.push(value)); await tick()
  assert.equal(values[0].diagnostic, 'CTXKIT_SETTINGS_SCHEMA_INCOMPATIBLE')
  assert.equal(updates(f).length, 0); f.dispose()
})

test('new user setup response is normal onboarding while denied and malformed results remain errors', async () => {
  const f = fixture(), values = [], onboarding = { ok: true, configured: false, state: 'setup_required', action: 'tree', results: [], offset: 0, limit: 50, total: 0, nextOffset: null, truncated: false, readOnly: true }
  f.setExecute(async () => response(onboarding))
  f.main.startRead('fictional-session', { action: 'tree' }, value => values.push(value)); await tick()
  assert.deepEqual(plain(values), [onboarding]); assert.equal(values[0].error, undefined); f.dispose()
  assert.ok(source.includes("current.configured === false || ['unconfigured', 'setup_required'].includes(current.state)"))
  assert.ok(source.includes("body = h(Notice, { t, kind: 'unconfigured' })"))
})

test('file-first UI uses real disclosure controls, two views and visible scoped consent', () => {
  assert.ok(source.includes("React.useState('files')"))
  assert.ok(source.includes("['files', 'sessions'].map"))
  assert.ok(source.includes("action: tab === 'files' ? 'tree' : 'sessions'"))
  assert.ok(source.includes("'aria-expanded': opened")); assert.ok(source.includes("'aria-controls': group"))
  assert.ok(source.includes("className: 'ck-tree-branch'")); assert.ok(source.includes('border-inline-start'))
  assert.doesNotMatch(source, /role: 'tree'|\['topics', 'sessions', 'status'\]/)
  assert.ok(source.includes("h(StorageAccess, { ...props, session, onStorage: setStorage })"))
  assert.ok(source.includes('!canBrowseStorage(storage, session)'))
  assert.ok(source.includes("className: 'ck-directory-pick'")); assert.ok(source.includes('border:2px dashed'))
  assert.ok(source.includes("t('setupConsent')")); assert.ok(source.includes("t('setupWorkspace')"))
  assert.ok(source.includes("t('storageUseExisting')")); assert.ok(source.includes('disabled: !sessionReady'))
  assert.match(locales.zh.library.setupConsent, /额外模型调用/); assert.match(locales.zh.library.setupConsent, /不导入历史/)
  assert.doesNotMatch(locales.zh.library.unconfiguredBody, /插件.*面板/)
  assert.ok(source.includes("CTXKIT_CAPTURE_DISABLED: 'disabled'")); assert.ok(source.includes("CTXKIT_MODEL_UNAVAILABLE: 'modelUnavailable'"))
})
