import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { installDesktopActions } from '../desktop-host.js'

const anchor = process.env.DSH_INSTALL_DIR

test('full plugin mounts desktop API without a webServer dependency', { skip: !anchor }, async t => {
  const require = createRequire(join(anchor, 'package.json'))
  const { Context } = await import(require.resolve('@deepseek-ai/cordis'))
  const { HostConnectionService } = await import(require.resolve('@deepseek-ai/dsh-client-connection'))
  const plugin = await import('../index.js')
  const ctx = new Context()
  for (const name of plugin.inject) ctx.provide(name, {})
  ctx.provide('settings', { writable: true, configure: () => () => {} })
  ctx.provide('remoteAccess', { decide: () => ({ kind: 'allow' }) })
  const connection = ctx.plugin(child => { new HostConnectionService(child, [], {}) })
  await connection.await()
  const mounted = ctx.plugin(plugin, { enabled: false })
  t.after(async () => { await mounted.dispose(); await connection.dispose() })
  await mounted.await()
  const response = await ctx.connection.createSharedFetchHandler('/api').fetch(
    new Request('https://fictional.invalid/api/ctxkit-desktop/pick', { method: 'POST', body: '{"probe":true}' }),
    ctx.connection.browserPeer,
  )
  assert.equal(response.status, 200)
  assert.equal((await response.json()).error.code, 'CTXKIT_DESKTOP_ARGUMENTS')
  assert.equal(ctx.get('webServer'), undefined)
})
test('installed Connection serves desktop actions beneath its authenticated owner-only API prefix', { skip: !anchor }, async t => {
  const require = createRequire(join(anchor, 'package.json'))
  const { Context } = await import(require.resolve('@deepseek-ai/cordis'))
  const { HostConnectionService } = await import(require.resolve('@deepseek-ai/dsh-client-connection'))
  const ctx = new Context()
  // A real consumer must not need Connection's independent RPC/webServer path.
  // Production rejected that registration even while the main plugin was active.
  assert.equal(ctx.get('webServer'), undefined)
  ctx.provide('settings', { writable: true })
  ctx.provide('remoteAccess', { decide: () => ({ kind: 'allow' }) })
  const fiber = ctx.plugin(child => { new HostConnectionService(child, [], {}) })
  await fiber.await()
  let picks = 0
  const stop = installDesktopActions(ctx, { platform: 'darwin', getConfig: () => ({}),
    pickDirectory: async () => { picks++; return null }, openDirectory: async () => assert.fail('No configured root') })
  t.after(async () => { await stop(); await fiber.dispose() })
  const api = ctx.connection.createSharedFetchHandler('/api')
  const request = (body = '{}', headers = {}) => new Request('https://fictional.invalid/api/ctxkit-desktop/pick', { method: 'POST', headers, body })
  const owner = ctx.connection.browserPeer
  let response = await api.fetch(request(), owner)
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { ok: true, value: null })
  assert.equal(picks, 1)
  response = await api.fetch(request(), { principal: { kind: 'api-key' } })
  assert.equal(response.status, 403); assert.equal(picks, 1)
  response = await api.fetch(request('{}', { authorization: 'Bearer fictional' }), owner)
  assert.equal(response.status, 403); assert.equal(picks, 1)
  response = await api.fetch(request('{"path":"/untrusted"}'), owner)
  assert.equal((await response.json()).error.code, 'CTXKIT_DESKTOP_ARGUMENTS'); assert.equal(picks, 1)
  response = await api.fetch(request('x'.repeat(65)), owner)
  assert.equal(response.status, 400); assert.equal(picks, 1)
  await stop()
  response = await api.fetch(request(), owner)
  assert.equal(response.status, 404)
})
