import Schema from '@deepseek-ai/schemastery'
import { lstatSync } from 'node:fs'
import { isAbsolute, resolve } from 'node:path'
import { resolveLibraryConfig } from './adapter.js'

/** User-confirmed storage, exact workspace scope and model policy are one native Settings write. */
export const Config = Schema.object({
  root: Schema.string().default('').volatile(),
  enabled: Schema.boolean().default(false).volatile(),
  allowedWorkspaces: Schema.array(Schema.string()).default([]).volatile(),
  useSessionModel: Schema.boolean().default(false).volatile(),
  exactWorkspaces: Schema.boolean().default(false).volatile(),
  provider: Schema.string().default(''),
  model: Schema.string().default(''),
  maxInputChars: Schema.number().default(24000),
  maxEventChars: Schema.number().default(4000),
  maxOutputChars: Schema.number().default(24000),
  maxTokens: Schema.number().default(4000),
  timeoutMs: Schema.number().default(60000),
  maxBufferedSessions: Schema.number().default(128),
  maxPendingTurns: Schema.number().default(16),
  maxRecoveryEvents: Schema.number().default(2000),
  includeSubagents: Schema.boolean().default(false),
})

/** Resolve native Volatile references without retaining them in an adapter. */
export function snapshotConfig(config = {}) {
  const value = field => field && typeof field.get === 'function' ? field.get() : field
  const workspaces = value(config.allowedWorkspaces) ?? []
  return { ...config, root: value(config.root) ?? '', enabled: value(config.enabled) ?? false,
    useSessionModel: value(config.useSessionModel) ?? false, exactWorkspaces: value(config.exactWorkspaces) ?? false,
    allowedWorkspaces: Array.isArray(workspaces) ? [...workspaces] : workspaces }
}

/** Validate the complete candidate before the native editor persists any field. */
export function validateStorageConfig(config) {
  validateStorageRoot(config.root)
  if (!Array.isArray(config.allowedWorkspaces) || config.allowedWorkspaces.length > 128) throw Object.assign(new Error('CTXKIT_CONFIG_WORKSPACES'), { code: 'CTXKIT_CONFIG_WORKSPACES' })
  for (const workspace of config.allowedWorkspaces) {
    if (!workspace) throw Object.assign(new Error('CTXKIT_CONFIG_WORKSPACES'), { code: 'CTXKIT_CONFIG_WORKSPACES' })
    validateStorageRoot(workspace)
  }
  // Use the same full runtime checks before persistence, not only after rebuild.
  resolveLibraryConfig(config)
}

/** Read metadata only. Never create a directory or probe it with a test write. */
export function validateStorageRoot(root) {
  if (root === '') return
  const fail = code => { throw Object.assign(new Error(code), { code }) }
  if (typeof root !== 'string' || !isAbsolute(root) || root.includes('\0')) fail('CTXKIT_CONFIG_PATH')
  try {
    const stat = lstatSync(resolve(root))
    if (!stat.isDirectory() || stat.isSymbolicLink()) fail('CTXKIT_CONFIG_DIRECTORY')
  } catch {
    fail('CTXKIT_CONFIG_DIRECTORY')
  }
}
