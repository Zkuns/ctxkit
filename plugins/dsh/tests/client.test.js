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
  return { ns: 'ctxkit', revision, value: { root, enabled: false }, schema: { uid: 1, refs: { 1: { type: 'object', dict: { root: 2, enabled: 3 } }, 2: { type: 'string' }, 3: { type: 'boolean' } } } }
}

function fixture({ settings = true, picker = true } = {}) {
  let bundle, dictionaries, execute = async () => response({ ok: true, results: [], total: 0 })
  let describe = async () => ({ ok: true, value: { writable: true, namespaces: [namespace()] } }), update = async () => ({ ok: true, value: namespace('/fictional/new', 1) });
  let list = async () => ({ ok: true, value: { path: '/fictional', home: '/fictional', crumbs: [], entries: [], truncated: false } }), pick = async () => ({ ok: true, value: null });
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
      inject(name, fn) { assert.ok(['main', 'sidebar.panellist'].includes(name)); return own(fn()) },
      register(options, Component) { const entry = { options, Component }; registrations.push(entry); return () => registrations.splice(registrations.indexOf(entry), 1) },
    },
  }
  plugin.apply(ctx)
  const injected = registrations.find(row => row.options.name === 'main').options.inject()
  return { plugin, registrations, dictionaries, calls, events, timers, injected, settingsCalls, folderCalls,
    setDescribe(fn) { describe = fn }, setUpdate(fn) { update = fn }, setList(fn) { list = fn }, setPick(fn) { pick = fn },
    setExecute(fn) { execute = fn }, dispose() { [...disposers].reverse().forEach(fn => fn()) } }
}

test('lazy React-only artifact registers native slots, synchronized locales and owned effects', () => {
  const f = fixture()
  assert.equal(f.registrations.length, 2)
  assert.equal(f.registrations[0].options.key, 'ctxkit-library')
  assert.equal(f.registrations[1].options.id, 'ctxkit-library')
  assert.equal(f.registrations[1].options.label(), 'Context library')
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
  assert.equal(f.registrations.length, 2)
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
  assert.deepEqual(plain(values), [{ ok: true, writable: false, descriptor: { ns: 'ctxkit', root: '/fictional/vault', enabled: false, revision: 0 } }])
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

test('explicit native settings save changes only root and enabled false with expected revision', async () => {
  const f = fixture(), values = [], epoch = f.injected.hooks.libraryEpoch
  f.injected.startStorage({ action: 'save', ns: 'ctxkit', revision: 0, root: '/fictional/new', allowedWorkspaces: ['ignored'], enabled: true }, v => values.push(v)); await tick()
  assert.deepEqual(plain(f.settingsCalls), [['update', 'ctxkit', { root: '/fictional/new', enabled: false }, 0]])
  assert.equal(values[0].saved, true); assert.equal(epoch.getSnapshot(), 1)
  assert.equal(f.calls.length, 0); assert.equal(f.folderCalls.length, 0); f.dispose()
})

test('save validates namespace, revision and absolute path before dispatch', async () => {
  const f = fixture()
  for (const request of [{ root: '~/vault' }, { root: 'relative/path' }, { revision: undefined }, { ns: 'other' }, { root: '' }, { root: '/bad\npath' }]) {
    let value
    f.injected.startStorage({ action: 'save', ns: 'ctxkit', revision: 0, root: '/fictional', ...request }, v => { value = v }); await tick()
    assert.equal(value.state, 'invalid')
  }
  assert.equal(f.settingsCalls.length, 0); f.dispose()
})

test('settings conflicts and rejected paths remain failures without leaking host errors', async () => {
  const f = fixture()
  for (const [code, state] of [['settings/conflict', 'conflict'], ['settings/rejected', 'rejected'], ['gateway/forbidden', 'denied'], ['gateway/internal', 'error']]) {
    let value
    f.setUpdate(async () => ({ ok: false, error: { code, message: '/private/DO_NOT_RETAIN' } }))
    f.injected.startStorage({ action: 'save', ns: 'ctxkit', revision: 0, root: '/fictional/new' }, v => { value = v }); await tick()
    assert.deepEqual(plain(value), { ok: false, state }); assert.doesNotMatch(JSON.stringify(value), /DO_NOT_RETAIN/)
  }
  f.dispose()
})

test('native settings events invalidate library results and prevent stale success', async () => {
  const f = fixture(), values = []; let finishRead, finishSave
  f.setExecute(() => new Promise(resolve => { finishRead = resolve }))
  f.injected.startRead('fictional-session', { action: 'topics' }, v => values.push(v)); await tick()
  f.setUpdate(() => new Promise(resolve => { finishSave = resolve }))
  f.injected.startStorage({ action: 'save', ns: 'ctxkit', revision: 0, root: '/fictional/new' }, v => values.push(v)); await tick()
  f.events.get('settings/document-updated')('other', 10)
  assert.equal(f.injected.hooks.libraryEpoch.getSnapshot(), 0)
  f.events.get('settings/document-updated')('ctxkit', 2)
  assert.equal(f.calls[0][3].aborted, true)
  finishRead(response({ ok: true, body: 'OLD ROOT' })); finishSave({ ok: true, value: namespace('/fictional/new', 1) }); await tick()
  assert.deepEqual(plain(values), [{ ok: false, state: 'conflict' }])
  f.injected.startStorage({ action: 'save', ns: 'ctxkit', revision: 0, root: '/fictional/new' }, v => values.push(v)); await tick()
  assert.equal(f.settingsCalls.length, 1); f.dispose()
})

test('saved root and recording state must match the explicit request', async () => {
  const f = fixture()
  for (const row of [namespace('/fictional/wrong', 1), { ...namespace('/fictional/new', 1), value: { root: '/fictional/new', enabled: true } }]) {
    let value; f.setUpdate(async () => ({ ok: true, value: row }))
    f.injected.startStorage({ action: 'save', ns: 'ctxkit', revision: 0, root: '/fictional/new' }, v => { value = v }); await tick()
    assert.equal(value.state, 'conflict')
  }
  f.dispose()
})

test('connection change, local cancellation and timeout never accept a late save outcome', async () => {
  for (const action of ['connection/reset', 'cancel', 'timeout', 'dispose']) {
    const f = fixture(), values = []; let complete
    f.setUpdate(() => new Promise(resolve => { complete = resolve }))
    const cancel = f.injected.startStorage({ action: 'save', ns: 'ctxkit', revision: 0, root: '/fictional/new' }, v => values.push(v)); await tick()
    if (action === 'cancel') cancel()
    else if (action === 'timeout') [...f.timers.values()][0]()
    else if (action === 'dispose') f.dispose()
    else f.events.get(action)()
    complete({ ok: true, value: namespace('/fictional/new', 1) }); await tick()
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
  // Settings projects the two volatile fields. Keep the real Schemastery uid
  // table and field schemas rather than substituting made-up reference types.
  const root = schema.refs[schema.uid]
  root.dict = { root: root.dict.root, enabled: root.dict.enabled }
  const descriptor = { ns: 'ctxkit', revision: 3, schema, value: { root: '', enabled: false } }
  f.setDescribe(async () => JSON.parse(JSON.stringify({ ok: true, value: { writable: true, hasDocument: true, namespaces: [descriptor] } })))
  f.injected.startStorage({ action: 'load' }, value => values.push(value)); await tick()
  assert.deepEqual(plain(values), [{ ok: true, writable: true, descriptor: { ns: 'ctxkit', revision: 3, root: '', enabled: false } }])
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

test('storage UX contracts include no-session placement, explicit save, cancel and accessible errors', () => {
  assert.ok(source.indexOf('h(Storage, props)') < source.indexOf("!session ? h(Notice"))
  assert.match(source, /settings\/describe/); assert.match(source, /settings\/update/)
  assert.match(source, /key: JSON.stringify\(\[epoch, readable, canWrite, canList, canPick\]\)/)
  assert.match(source, /'aria-describedby': ids/); assert.match(source, /'aria-invalid'/)
  assert.match(source, /t\('storageCancel'\)/); assert.match(source, /t\('storageSafety'\)/)
  assert.match(source, /t\('storageReload'\)/); assert.match(source, /t\('storageChoose'\)/)
  assert.doesNotMatch(source, /createDirectory\(|createWorkspace\(|showDirectoryPicker\(|webkitdirectory/)
})
