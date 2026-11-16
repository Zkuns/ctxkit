import { Engine } from './engine.js'
import { createAdapter } from './adapter.js'
import { registerBrowser } from './browser-host.js'

export const name = 'ctxkit'
export const inject = ['llm', 'fs', 'sandboxPolicy', 'tools', 'skills', 'systemPrompt', 'sessions', 'agents']

/** Capture stays opt-in; the read-only browser can explain an unconfigured library. */
export function apply(ctx, config = {}) {
  ctx.effect(() => {
    const adapter = createAdapter(ctx, config, Engine)
    const browser = ctx.inject(['commands'], child => {
      child.effect(() => registerBrowser(child, { query: adapter.query }))
    })
    return () => { browser.dispose(); adapter.dispose() }
  })
}
