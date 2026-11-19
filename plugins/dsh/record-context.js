import { constants, openSync, closeSync, fstatSync, readSync } from 'node:fs'
import { decode, fail, LIMITS } from './contracts.js'

// Native PromptContext providers are synchronous. Each reads one bounded,
// authorized root record; no directory/history scan, cache or background loop.
export function readContextDocument(scope, session, signal, relativePath) {
  if (!['USER.md', 'GLOBAL.md'].includes(relativePath)) fail('PATH', 'Unsupported context record')
  const check = () => { signal?.throwIfAborted(); scope.sessionScope(session); return scope.target(relativePath) }
  const path = check()
  let fd
  try { fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK) }
  catch (error) { if (error.code === 'ENOENT') return null; throw error }
  let raw
  try {
    const stat = fstatSync(fd)
    if (!stat.isFile() || stat.size > LIMITS.fileBytes) fail('TOO_LARGE', 'Context record exceeds the read limit')
    const buffer = Buffer.alloc(LIMITS.fileBytes + 1)
    let length = 0, read
    while (length < buffer.length && (read = readSync(fd, buffer, length, buffer.length - length, length)) > 0) length += read
    if (length > LIMITS.fileBytes) fail('TOO_LARGE', 'Context record exceeds the read limit')
    raw = buffer.subarray(0, length).toString('utf8')
  } finally { closeSync(fd) }
  check()
  return decode(raw, relativePath)
}

export const serializeContext = value => JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('>', '\\u003e')
