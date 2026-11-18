import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, realpath, mkdir, symlink, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createDesktopActions } from '../desktop-host.js'

const deferred = () => {
  let resolve
  const promise = new Promise(done => { resolve = done })
  return { promise, resolve }
}
async function fixture(t, options = {}) {
  const temp = await realpath(await mkdtemp(join(tmpdir(), 'ctxkit-desktop-test-')))
  t.after(() => rm(temp, { recursive: true, force: true }))
  const root = join(temp, 'fictional-library')
  await mkdir(root)
  const config = { root }
  const peerController = new AbortController(), requestController = new AbortController()
  const browserPeer = { principal: { kind: 'owner' }, signal: peerController.signal }
  const calls = [], decisions = [], events = new Map()
  let handler, removed = 0
  const ctx = {
    on(name, listener) { events.set(name, listener); return () => { events.delete(name); removed++ } },
    connection: { browserPeer },
    settings: { writable: true },
    remoteAccess: { decide(request) { decisions.push(request); return { kind: 'allow' } } },
  }
  const actions = createDesktopActions(ctx, {
    platform: 'darwin', getConfig: () => config,
    pickDirectory: async signal => { calls.push(['pick', signal]); return root },
    openDirectory: async (path, signal) => { calls.push(['open', path, signal]) },
    ...options,
  })
  const dispose = actions.dispose
  handler = actions.dispatch
  t.after(dispose)
  return { temp, root, config, ctx, calls, decisions, events, dispose, peerController, requestController,
    get removed() { return removed },
    invoke: (endpoint = 'pick', payload = {}, peer = browserPeer, signal = requestController.signal) => handler(endpoint, payload, signal, peer),
  }
}
function code(result, expected) {
  assert.equal(result.ok, false)
  assert.equal(result.error.code, 'CTXKIT_DESKTOP_' + expected)
  assert.deepEqual(Object.keys(result.error).sort(), ['code', 'details', 'message'])
  assert.deepEqual(result.error.details, {})
  assert.equal(result.error.message, result.error.code)
}

test('configuration changes abort an already-open system chooser', async t => {
  const entered = deferred()
  const f = await fixture(t, { pickDirectory: signal => { entered.resolve(); return new Promise(resolve => signal.addEventListener('abort', () => resolve(null), { once: true })) } })
  const pending = f.invoke(); await entered.promise
  f.events.get('loader/volatile-update')()
  code(await pending, 'CANCELLED')
})

test('lazy native loading rechecks authority immediately before showing a chooser', async t => {
  const entered = deferred(), gate = deferred(); let launched = 0
  const f = await fixture(t, { pickDirectory: async (_signal, check) => { entered.resolve(); await gate.promise; check(); launched++; return null } })
  const pending = f.invoke(); await entered.promise
  f.ctx.remoteAccess.decide = () => ({ kind: 'deny' })
  gate.resolve(); code(await pending, 'DENIED'); assert.equal(launched, 0)
})

test('lazy Finder loading cannot launch a root that changed while loading', async t => {
  const entered = deferred(), gate = deferred(); let launched = 0
  const f = await fixture(t, { openDirectory: async (_path, _signal, check) => { entered.resolve(); await gate.promise; check(); launched++ } })
  const pending = f.invoke('open'); await entered.promise
  f.config.root = '/fictional/changed'; gate.resolve()
  code(await pending, 'CONFIG_CHANGED'); assert.equal(launched, 0)
})

test('chooser uses admitted owner browser and explicit global settings/update authority', async t => {
  const f = await fixture(t)
  assert.deepEqual(await f.invoke(), { ok: true, value: f.root })
  assert.equal(f.calls.length, 1)
  assert.equal(f.calls[0][0], 'pick')
  assert.ok(f.calls[0][1] instanceof AbortSignal)
  assert.ok(f.decisions.length >= 2)
  for (const decision of f.decisions) assert.deepEqual(decision, {
    principal: f.ctx.connection.browserPeer.principal,
    action: 'settings/update', resources: [{ kind: 'global' }],
  })
})

test('native picker errors are bounded and do not leave the chooser busy', async t => {
  const f = await fixture(t, { pickDirectory: async () => { throw new Error('PRIVATE_NATIVE_STDERR') } })
  for (let i = 0; i < 2; i++) {
    const result = await f.invoke()
    code(result, 'FAILED')
    assert.doesNotMatch(JSON.stringify(result), /PRIVATE/)
  }
})

test('pre-aborted or absent request/Peer lifetimes never invoke native helpers', async t => {
  const f = await fixture(t)
  code(await f.invoke('pick', {}, f.ctx.connection.browserPeer, null), 'DENIED')
  const signal = f.ctx.connection.browserPeer.signal
  f.ctx.connection.browserPeer.signal = undefined
  code(await f.invoke(), 'DENIED')
  f.ctx.connection.browserPeer.signal = signal
  f.requestController.abort()
  code(await f.invoke(), 'CANCELLED')
  code(await f.invoke('open'), 'CANCELLED')
  assert.equal(f.calls.length, 0)
})

test('native cancel returns null without a configuration write or opener call', async t => {
  const f = await fixture(t, { pickDirectory: async () => null })
  const before = { ...f.config }
  assert.deepEqual(await f.invoke(), { ok: true, value: null })
  assert.deepEqual(f.config, before)
  assert.equal(f.calls.length, 0)
})

test('all client arguments and unknown endpoints are refused before native calls', async t => {
  const f = await fixture(t)
  for (const endpoint of ['pick', 'open']) {
    for (const payload of [null, [], 'path', { path: f.root }, { root: f.root }, { sessionId: 'fictional' }]) {
      code(await f.invoke(endpoint, payload), 'ARGUMENTS')
    }
  }
  code(await f.invoke('unknown'), 'ARGUMENTS')
  assert.equal(f.calls.length, 0)
})

test('readonly settings, missing authority, throwing/denying policy fail closed', async t => {
  const f = await fixture(t)
  const policy = f.ctx.remoteAccess
  for (const action of ['pick', 'open']) {
    f.ctx.settings.writable = false
    code(await f.invoke(action), 'DENIED')
    f.ctx.settings.writable = true
    f.ctx.remoteAccess = undefined
    code(await f.invoke(action), 'DENIED')
    f.ctx.remoteAccess = { decide: () => { throw new Error('PRIVATE_POLICY') } }
    code(await f.invoke(action), 'DENIED')
    f.ctx.remoteAccess = { decide: () => ({ kind: 'deny', reason: 'no-allow' }) }
    code(await f.invoke(action), 'DENIED')
    f.ctx.remoteAccess = { decide: () => undefined }
    code(await f.invoke(action), 'DENIED')
    f.ctx.remoteAccess = policy
  }
  assert.equal(f.calls.length, 0)
})

test('non-owner, separate owner API Peer and absent Peer cannot authorize desktop actions', async t => {
  const f = await fixture(t)
  const browser = f.ctx.connection.browserPeer
  for (const action of ['pick', 'open']) {
    code(await f.invoke(action, {}, { ...browser }), 'DENIED')
    browser.principal = { kind: 'readonly-viewer' }
    code(await f.invoke(action), 'DENIED')
    browser.principal = { kind: 'owner' }
    code(await f.invoke(action, {}, null), 'DENIED')
  }
  assert.equal(f.calls.length, 0)
})

test('unsupported hosts and malformed native selections never report success', async t => {
  const f = await fixture(t, { platform: 'linux' })
  code(await f.invoke(), 'UNAVAILABLE')
  code(await f.invoke('open'), 'UNAVAILABLE')
  assert.equal(f.calls.length, 0)
  for (const selected of [undefined, {}, 'relative', '/bad\0path', '/' + 'x'.repeat(4096)]) {
    const invalid = await fixture(t, { pickDirectory: async () => selected })
    code(await invalid.invoke(), 'INVALID_SELECTION')
  }
})

test('one plugin permits only one pending chooser and releases its busy state', async t => {
  const ready = deferred(), result = deferred()
  const f = await fixture(t, { pickDirectory: async () => { ready.resolve(); return result.promise } })
  const first = f.invoke()
  await ready.promise
  code(await f.invoke(), 'BUSY')
  result.resolve(null)
  assert.deepEqual(await first, { ok: true, value: null })
  assert.deepEqual(await f.invoke(), { ok: true, value: null })
})

test('request, Peer and disposal abort pending native work and suppress late success', async t => {
  for (const reason of ['request', 'peer', 'dispose']) {
    const ready = deferred(), finish = deferred()
    let nativeSignal
    const f = await fixture(t, { pickDirectory: async signal => {
      nativeSignal = signal; ready.resolve(); await finish.promise; return null
    } })
    const pending = f.invoke()
    await ready.promise
    if (reason === 'request') f.requestController.abort()
    if (reason === 'peer') f.peerController.abort()
    if (reason === 'dispose') await f.dispose()
    assert.equal(nativeSignal.aborted, true)
    finish.resolve()
    code(await pending, reason === 'dispose' ? 'DISPOSED' : 'CANCELLED')
    await f.dispose(); await f.dispose()
    assert.equal(f.removed, 1)
    code(await f.invoke(), 'DISPOSED')
  }
})

test('authorization revoked during the chooser suppresses a selected path', async t => {
  const ready = deferred(), finish = deferred()
  const f = await fixture(t, { pickDirectory: async () => { ready.resolve(); await finish.promise; return '/PRIVATE_SELECTED_PATH' } })
  const pending = f.invoke()
  await ready.promise
  f.ctx.settings.writable = false
  finish.resolve()
  const result = await pending
  code(result, 'DENIED')
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE/)
})

test('Finder opens only current configured physical root, including a directory ending html', async t => {
  const f = await fixture(t)
  const htmlDirectory = join(f.temp, 'fictional.html')
  await mkdir(htmlDirectory)
  f.config.root = htmlDirectory
  assert.deepEqual(await f.invoke('open'), { ok: true, value: { opened: true } })
  assert.equal(f.calls.length, 1)
  assert.equal(f.calls[0][0], 'open')
  assert.equal(f.calls[0][1], htmlDirectory)
})

test('Finder refuses missing, relative, file and symlink roots or symlink ancestors', async t => {
  const f = await fixture(t)
  const file = join(f.temp, 'fictional.txt'), link = join(f.temp, 'link'), parent = join(f.temp, 'parent-link')
  await writeFile(file, 'Fictional fixture')
  await symlink(f.root, link)
  await symlink(f.temp, parent)
  for (const root of ['', undefined, 'relative', '/bad\0path', join(f.temp, 'missing'), file, link, join(parent, 'fictional-library')]) {
    f.config.root = root
    assert.equal((await f.invoke('open')).ok, false)
  }
  assert.equal(f.calls.length, 0)
})

test('configuration changes across filesystem awaits prevent launching Finder', async t => {
  const f = await fixture(t)
  let reads = 0
  Object.defineProperty(f.config, 'root', { get() { return ++reads === 1 ? f.root : f.temp } })
  code(await f.invoke('open'), 'CONFIG_CHANGED')
  assert.equal(f.calls.length, 0)
})

test('opener errors, abort and late authority/config changes cannot produce success', async t => {
  const failing = await fixture(t, { openDirectory: async () => { throw new Error('PRIVATE_STDERR /private/path') } })
  const failure = await failing.invoke('open')
  code(failure, 'FAILED')
  assert.doesNotMatch(JSON.stringify(failure), /PRIVATE|private/)
  for (const change of ['authority', 'config', 'abort']) {
    const ready = deferred(), finish = deferred()
    const f = await fixture(t, { openDirectory: async () => { ready.resolve(); await finish.promise } })
    const pending = f.invoke('open')
    await ready.promise
    if (change === 'authority') f.ctx.remoteAccess.decide = () => ({ kind: 'deny' })
    if (change === 'config') f.config.root = f.temp
    if (change === 'abort') f.requestController.abort()
    finish.resolve()
    code(await pending, change === 'authority' ? 'DENIED' : change === 'config' ? 'CONFIG_CHANGED' : 'CANCELLED')
  }
})
