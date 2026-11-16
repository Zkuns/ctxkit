import Schema from '@deepseek-ai/schemastery'
import { lstatSync } from 'node:fs'
import { isAbsolute, resolve } from 'node:path'

/** Only these two fields are editable through the native Settings API. */
export const Config = Schema.object({
  root: Schema.string().default('').volatile(),
  enabled: Schema.boolean().default(false).volatile(),
  allowedWorkspaces: Schema.array(Schema.string()).default([]),
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

/** Resolve the two native Volatile references without retaining them in an adapter. */
export function snapshotConfig(config = {}) {
  const value = field => field && typeof field.get === 'function' ? field.get() : field
  return { ...config, root: value(config.root) ?? '', enabled: value(config.enabled) ?? false,
    ...(Array.isArray(config.allowedWorkspaces) ? { allowedWorkspaces: [...config.allowedWorkspaces] } : {}) }
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
