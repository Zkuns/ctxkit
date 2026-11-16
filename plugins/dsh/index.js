import { Engine } from './engine.js'
import { createAdapter } from './adapter.js'

export const name = 'ctxkit'
export const inject = ['llm', 'fs', 'sandboxPolicy', 'tools', 'skills', 'systemPrompt', 'sessions', 'agents']

/** Host-only bundle. Configuration is fail-closed and validated by resolveConfig. */
export function apply(ctx, config = {}) {
  ctx.effect(() => {
    const adapter = createAdapter(ctx, config, Engine)
    return () => adapter.dispose()
  })
}
