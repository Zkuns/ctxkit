import { Engine } from './engine.js'
import { createAdapter } from './adapter.js'
import { registerBrowser } from './browser-host.js'
import { Config, snapshotConfig, validateStorageConfig } from './config.js'

export { Config }
export const name = 'ctxkit'
export const inject = ['llm', 'fs', 'sandboxPolicy', 'tools', 'skills', 'systemPrompt', 'sessions', 'agents']

/** Capture stays opt-in. Native Settings persists only the declared volatile fields. */
export function apply(ctx, config = {}) {
  validateStorageConfig(snapshotConfig(config))
  // The native config editor invokes this hook before writing its candidate.
  // Keep host filesystem validation out of the serialized form schema.
  ctx.on('internal/config', (fiber, next) => {
    const raw = next()
    if (fiber === ctx.fiber) validateStorageConfig(snapshotConfig(Config(raw)))
    return raw
  })
  const settings = ctx.inject(['settings'], child => {
    child.effect(() => child.settings.configure({ auto: false }, ctx.fiber))
  })
  ctx.effect(() => {
    let adapter, commandContext, closeBrowser = () => {}, stopped = false
    const replaceBrowser = () => {
      closeBrowser()
      closeBrowser = () => {}
      if (!stopped && adapter && commandContext) {
        closeBrowser = registerBrowser(commandContext, { query: adapter.query })
      }
    }
    const rebuild = () => {
      if (stopped) return
      // Cancel the old query before dropping references, tools, buffers and jobs.
      closeBrowser()
      closeBrowser = () => {}
      adapter?.dispose()
      adapter = undefined
      const snapshot = snapshotConfig(config)
      validateStorageConfig(snapshot)
      adapter = createAdapter(ctx, snapshot, Engine)
      replaceBrowser()
    }
    rebuild()
    const browser = ctx.inject(['commands'], child => {
      child.effect(() => {
        commandContext = child
        replaceBrowser()
        return () => {
          if (commandContext !== child) return
          commandContext = undefined
          replaceBrowser()
        }
      })
    })
    const stopUpdates = ctx.on('loader/volatile-update', rebuild)
    return () => {
      stopped = true
      stopUpdates()
      closeBrowser()
      adapter?.dispose()
      browser.dispose()
      settings.dispose()
    }
  })
}
