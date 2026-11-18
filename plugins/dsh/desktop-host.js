import { lstat, realpath } from 'node:fs/promises'
import { isAbsolute, resolve } from 'node:path'

const PREFIX = 'CTXKIT_DESKTOP_'
class Refusal extends Error {
  constructor(code) { super(PREFIX + code); this.code = PREFIX + code }
}
const refuse = code => { throw new Refusal(code) }
const failure = code => ({ ok: false, error: { code, message: code, details: {} } })
const validPath = path => typeof path === 'string' && isAbsolute(path) && !path.includes('\0') && Buffer.byteLength(path) <= 4096

/**
 * Browser-owner-only desktop gestures, not commands or agent tools. Connection
 * authenticates the Peer; this API boundary explicitly performs the settings
 * authority check normally owned by Gateway. No global picker is replaced.
 * Native helpers are injected so isolated tests never load or launch OS UI.
 */
export function createDesktopActions(ctx, { getConfig, pickDirectory, openDirectory, platform = process.platform }) {
  if (!ctx.connection?.browserPeer || typeof getConfig !== 'function'
    || typeof pickDirectory !== 'function' || typeof openDirectory !== 'function') {
    throw new TypeError('CtxKit desktop dependencies are required')
  }
  const lifetime = new AbortController()
  let configuration = new AbortController()
  const stopUpdates = ctx.on?.('loader/volatile-update', () => {
    configuration.abort()
    configuration = new AbortController()
  })
  let picking = false, cleanup
  const authorize = peer => {
    if (!peer || peer !== ctx.connection.browserPeer || peer.principal?.kind !== 'owner') refuse('DENIED')
    if (ctx.settings?.writable !== true) refuse('DENIED')
    if (typeof ctx.remoteAccess?.decide !== 'function') refuse('DENIED')
    let decision
    try {
      decision = ctx.remoteAccess.decide({ principal: peer.principal, action: 'settings/update', resources: [{ kind: 'global' }] })
    } catch { refuse('DENIED') }
    if (decision?.kind !== 'allow') refuse('DENIED')
  }
  const physicalDirectory = async (root, check) => {
    if (!validPath(root)) refuse('ROOT_UNAVAILABLE')
    const normalized = resolve(root)
    const metadata = await lstat(normalized)
    check()
    if (!metadata.isDirectory() || metadata.isSymbolicLink()) refuse('ROOT_UNAVAILABLE')
    const physical = await realpath(normalized)
    check()
    // Reject symlink ancestors too; never silently open a different root.
    if (physical !== normalized) refuse('ROOT_UNAVAILABLE')
    return normalized
  }
  const dispatch = async (endpoint, payload, requestSignal, peer) => {
    let signal
    const check = () => {
      if (lifetime.signal.aborted) refuse('DISPOSED')
      if (signal?.aborted || peer?.signal?.aborted || requestSignal?.aborted) refuse('CANCELLED')
      authorize(peer)
    }
    try {
      check()
      if (platform !== 'darwin') refuse('UNAVAILABLE')
      if (!payload || typeof payload !== 'object' || Array.isArray(payload) || Object.keys(payload).length
        || (endpoint !== 'pick' && endpoint !== 'open')) refuse('ARGUMENTS')
      // Real Connection calls always provide both signals. Missing lifetimes fail closed.
      if (!requestSignal || !peer.signal) refuse('DENIED')
      signal = AbortSignal.any([lifetime.signal, configuration.signal, requestSignal, peer.signal])
      check()
      if (endpoint === 'pick') {
        if (picking) refuse('BUSY')
        picking = true
        try {
          const selected = await pickDirectory(signal, check)
          check()
          if (selected !== null && !validPath(selected)) refuse('INVALID_SELECTION')
          return { ok: true, value: selected }
        } finally { picking = false }
      }
      const root = getConfig()?.root
      const checkRoot = () => {
        check()
        if (getConfig()?.root !== root) refuse('CONFIG_CHANGED')
      }
      const directory = await physicalDirectory(root, checkRoot)
      // Configuration and authority are read again after all filesystem awaits,
      // immediately before launch; the client never supplies a path.
      checkRoot()
      await openDirectory(directory, signal, checkRoot)
      checkRoot()
      return { ok: true, value: { opened: true } }
    } catch (error) {
      // Never send exception messages, paths, stdout or stderr to the client.
      const code = lifetime.signal.aborted ? PREFIX + 'DISPOSED'
        : signal?.aborted || peer?.signal?.aborted || requestSignal?.aborted ? PREFIX + 'CANCELLED'
          : error instanceof Refusal ? error.code : PREFIX + 'FAILED'
      return failure(code)
    }
  }
  return { dispatch, dispose: () => {
    if (!cleanup) {
      lifetime.abort()
      stopUpdates?.()
      cleanup = Promise.resolve()
    }
    return cleanup
  } }
}

export function installDesktopActions(ctx, options) {
  if (typeof ctx.connection?.fetch?.register !== 'function') throw new TypeError('CtxKit authenticated Fetch routes are required')
  const actions = createDesktopActions(ctx, options)
  const removals = []
  // Exact /api routes use Connection's authenticated owner-only gate and work
  // behind deployments that forward the shared API prefix rather than new channels.
  for (const action of ['pick', 'open']) {
    removals.push(ctx.connection.fetch.register({
      path: '/api/ctxkit-desktop/' + action, methods: ['POST'], requestBody: 'streaming',
      fetch: async request => {
        if (request.headers.has('authorization')) return Response.json(failure(PREFIX + 'DENIED'), { status: 403 })
        let body = '', bytes = 0
        try {
          const reader = request.body?.getReader(), decoder = new TextDecoder()
          if (reader) for (;;) {
            const { value, done } = await reader.read()
            if (done) break
            bytes += value.byteLength
            if (bytes > 64) { await reader.cancel(); return Response.json(failure(PREFIX + 'ARGUMENTS'), { status: 400 }) }
            body += decoder.decode(value, { stream: true })
          }
          const payload = JSON.parse(body || '{}')
          return Response.json(await actions.dispatch(action, payload, request.signal, ctx.connection.browserPeer))
        } catch { return Response.json(failure(PREFIX + 'ARGUMENTS'), { status: 400 }) }
      },
    }))
  }
  let cleanup
  return () => {
    if (!cleanup) cleanup = Promise.all([actions.dispose(), ...removals.map(remove => Promise.resolve().then(() => remove?.()))])
    return cleanup
  }
}
