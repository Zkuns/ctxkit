// DSH 0.2.2-rc.3: Commands.register handler receives the exact loaded Agent.
// Client: remote.commands.execute(sessionId, '/ctxkit-library '+JSON.stringify(args), []).
// RemoteResult.value.result.text contains the same JSON returned to agent tools.
export const BROWSER_COMMAND = 'ctxkit-library'

export function registerBrowser(ctx, { query }) {
  if (typeof query !== 'function') throw new TypeError('CtxKit query operation is required')
  if (!ctx.commands?.register) throw new TypeError('DSH commands service is required')
  const lifetime = new AbortController()
  const failure = code => ({ kind: 'error', text: JSON.stringify({ ok: false, state: 'error', error: code }) })
  const remove = ctx.commands.register({
    name: BROWSER_COMMAND,
    description: 'Browse scoped CtxKit topics, session summaries and processing state (read-only)',
    input: { hint: '[JSON query: action, query, offset, limit, path]', attachments: false },
    // Do not duplicate the user's search terms in command/run. DSH still records
    // command/done with the bounded response, outside model history.
    recordInput: false,
    async handler(invocation) {
      if (lifetime.signal.aborted) return failure('CTXKIT_DISPOSED')
      if (!invocation?.agent?.session) return failure('CTXKIT_SESSION_REQUIRED')
      if (invocation.attachments?.length) return failure('CTXKIT_QUERY_ARGUMENTS')
      const raw = invocation.rawInput
      if (typeof raw !== 'string' || Buffer.byteLength(raw) > 4096) return failure('CTXKIT_QUERY_ARGUMENTS')
      let args
      try { args = raw.trim() ? JSON.parse(raw) : { action: 'overview' } } catch { return failure('CTXKIT_QUERY_ARGUMENTS') }
      try {
        const signal = AbortSignal.any([lifetime.signal, invocation.signal].filter(Boolean))
        signal.throwIfAborted()
        const result = await query(args, { session: invocation.agent.session, signal })
        signal.throwIfAborted()
        return { kind: result.ok ? 'success' : 'error', text: JSON.stringify(result) }
      } catch {
        // Never return exception messages, client cwd, paths or raw source payloads.
        return failure(lifetime.signal.aborted ? 'CTXKIT_DISPOSED' : invocation.signal?.aborted ? 'CTXKIT_CANCELLED' : 'CTXKIT_QUERY_FAILED')
      }
    },
  })
  return () => {
    if (lifetime.signal.aborted) return
    lifetime.abort()
    if (typeof remove === 'function') remove()
  }
}
