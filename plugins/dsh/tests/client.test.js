import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { readFile } from 'node:fs/promises'

// These are loader/registration, pure request-lifecycle and static contract tests.
// They do not emulate React, render a DOM, or claim live-host/UI verification.
const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
const locales = Object.fromEntries(await Promise.all(['en', 'zh'].map(async lang => [lang, JSON.parse(await readFile(new URL(`../locale/${lang}.json`, import.meta.url), 'utf8'))])))
const plain = value => JSON.parse(JSON.stringify(value))
const response = value => ({ ok: true, value: { commandId: 'fictional-command', result: { kind: value.ok ? 'success' : 'error', text: JSON.stringify(value) } } })
const tick = () => new Promise(resolve => setImmediate(resolve))

function fixture() {
  let bundle, dictionaries, execute = async () => response({ ok: true, results: [], total: 0 })
  const timers = new Map(), calls = [], registrations = [], disposers = [], events = new Map()
  let timerId = 0
  vm.runInNewContext(source, {
    window: { __ModuleLoader__: { load(value) { assert.equal(bundle, undefined); bundle = value } } },
    AbortController,
    setTimeout(fn, delay) { assert.equal(delay, 15000); const id = ++timerId; timers.set(id, fn); return id },
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
  return { plugin, registrations, dictionaries, calls, events, timers, injected,
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
