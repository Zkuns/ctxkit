import * as fs from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { CtxError, LIMITS, decode, encode, fail, hash, relativePath } from './contracts.js'

const INTERNAL = /^\.ctxkit\/(?:jobs\/[a-z0-9_-]+\.json|transactions\/[a-z0-9_-]+\.json|pause\/[a-z0-9_-]+\.json|writer\.lock)$/
const exists = async p => { try { return await fs.lstat(p) } catch (e) { if (e.code === 'ENOENT') return null; throw e } }
const escapeLabel = s => String(s).replace(/[\[\]\r\n]/g, ' ')
export class Vault {
  constructor({ root, authorize, publishText, signal, checkActive }) {
    if (!root || !path.isAbsolute(root)) fail('ROOT', 'Configure an absolute existing vault directory')
    this.root = path.resolve(root)
    this.authorize = authorize || (async () => fail('PERMISSION', 'A write authorizer is required'))
    this.publisher = publishText
    this.signal = signal
    this.checkActive = checkActive
  }
  async target(relative, internal = false) {
    if (internal) { if (!INTERNAL.test(relative)) fail('PATH', 'Invalid internal path') }
    else relativePath(relative)
    const rootStat = await exists(this.root)
    if (!rootStat?.isDirectory() || rootStat.isSymbolicLink()) fail('ROOT', 'Vault root must be an existing real directory, not a symlink')
    const canonical = await fs.realpath(this.root)
    let current = this.root
    for (const part of relative.split('/')) {
      current = path.join(current, part)
      const stat = await exists(current)
      if (stat?.isSymbolicLink()) fail('SYMLINK', 'Symlinks inside the vault are not supported')
      if (stat && current !== path.join(this.root, relative) && !stat.isDirectory()) fail('PATH', 'Non-directory ancestor')
      if (stat) {
        const physical = await fs.realpath(current)
        if (physical !== canonical && !physical.startsWith(canonical + path.sep)) fail('PATH', 'Path escapes the vault')
      }
    }
    return current
  }
  async raw(relative, internal = false) {
    const target = await this.target(relative, internal)
    const stat = await exists(target)
    if (!stat) return null
    if (!stat.isFile()) fail('PATH', 'Expected a regular file')
    if (stat.size > (internal ? 1024 * 1024 : LIMITS.fileBytes)) fail('TOO_LARGE', `${relative}: file exceeds read limit`)
    return fs.readFile(target, 'utf8')
  }
  async read(relative) {
    if (!relative.endsWith('.md')) fail('PATH', 'Only managed Markdown is readable through this API')
    const raw = await this.raw(relative)
    if (raw === null) fail('NOT_FOUND', `${relative}: not found`)
    return decode(raw, relative)
  }
  async maybeRead(relative) {
    const raw = await this.raw(relative)
    return raw === null ? null : decode(raw, relative)
  }
  async control(relative) {
    const raw = await this.raw(relative, true)
    if (raw === null) return null
    try { return JSON.parse(raw) } catch { fail('CORRUPT', `${relative}: invalid control JSON`) }
  }
  async guard(paths, context) {
    this.signal?.throwIfAborted()
    await this.authorize(paths, context)
    await this.checkActive?.(paths, context)
    this.signal?.throwIfAborted()
  }
  async publish(relative, content, expectedRevision, context, internal = false) {
    await this.guard([relative], context)
    const target = await this.target(relative, internal)
    const previous = await this.raw(relative, internal)
    if ((previous === null ? null : hash(previous)) !== expectedRevision) fail('CONFLICT', `${relative}: changed since read`)
    if (previous === content) return
    if (this.publisher) {
      await this.publisher({ relativePath: relative, text: content, context, signal: this.signal, expectedRevision })
      return
    }
    // Standalone/local test backend; DSH uses the injected native filesystem writer.
    await fs.mkdir(path.dirname(target), { recursive: true })
    await this.target(relative, internal)
    const temporary = path.join(path.dirname(target), `.ctxkit-${randomUUID()}.tmp`)
    await this.guard([relative, path.relative(this.root, temporary)], context)
    const handle = await fs.open(temporary, 'wx', 0o600)
    try {
      await handle.writeFile(content, 'utf8')
      await handle.sync()
      await handle.close()
      await this.guard([relative], context)
      await this.target(relative, internal)
      const latest = await this.raw(relative, internal)
      if ((latest === null ? null : hash(latest)) !== expectedRevision) fail('CONFLICT', `${relative}: changed during publication`)
      await fs.rename(temporary, target)
    } finally {
      await handle.close().catch(() => {})
      if (await exists(temporary)) {
        await this.guard([path.relative(this.root, temporary)], context)
        await fs.unlink(temporary)
      }
    }
  }
  async locked(context, fn) {
    const lock = '.ctxkit/writer.lock'
    await this.guard([lock], context)
    const target = await this.target(lock, true)
    await fs.mkdir(path.dirname(target), { recursive: true })
    await this.target(lock, true)
    let handle
    try { handle = await fs.open(target, 'wx', 0o600) } catch (e) {
      if (e.code === 'EEXIST') fail('BUSY', 'Vault writer lock exists; do not remove it while a writer may be active')
      throw e
    }
    const token = randomUUID()
    try {
      await handle.writeFile(JSON.stringify({ token, pid: process.pid, startedAt: new Date().toISOString() }))
      await handle.close()
      return await fn()
    } finally {
      await handle.close().catch(() => {})
      // Cleanup remains permission checked, but an abort must not strand our own lock.
      await this.authorize([lock], { ...context, cleanup: true })
      await this.target(lock, true)
      const current = await fs.readFile(target, 'utf8')
      if (JSON.parse(current).token !== token) fail('LOCK', 'Writer lock ownership changed')
      await fs.unlink(target)
    }
  }
  async putControl(relative, value, context) {
    return this.locked(context, async () => {
      const old = await this.raw(relative, true)
      await this.publish(relative, JSON.stringify(value, null, 2) + '\n', old === null ? null : hash(old), context, true)
    })
  }
  async controls(kind) {
    if (!['jobs', 'transactions', 'pause'].includes(kind)) fail('PATH', 'Unknown control collection')
    await this.target(`.ctxkit/${kind}/probe.json`, true)
    const dir = path.join(this.root, '.ctxkit', kind)
    if (!await exists(dir)) return []
    const entries = await fs.readdir(dir, { withFileTypes: true })
    if (entries.length > 10000) fail('TOO_LARGE', 'Control collection needs maintenance')
    const out = []
    for (const item of entries) {
      if (item.name.endsWith('.json')) out.push({ path: `.ctxkit/${kind}/${item.name}`, value: await this.control(`.ctxkit/${kind}/${item.name}`) })
    }
    return out
  }
  async commit(changes, context, { sessionId = null } = {}) {
    if (!changes.length) return []
    if (changes.length > 32 || new Set(changes.map(c => c.path)).size !== changes.length) fail('INVALID', 'Invalid batch size or duplicate targets')
    return this.locked(context, async () => {
      const pending = (await this.controls('transactions')).find(t => t.value.status === 'prepared')
      if (pending) fail('RECOVERY_REQUIRED', 'An unfinished transaction must be recovered before further document updates')
      const writes = []
      for (const change of changes) {
        const old = await this.raw(change.path)
        if (old !== null) decode(old, change.path) // Never overwrite unrelated files.
        if ((old === null ? null : hash(old)) !== change.expectedRevision) fail('CONFLICT', `${change.path}: stale revision`)
        const content = encode(change.metadata, change.body)
        if (Buffer.byteLength(content) > LIMITS.fileBytes) fail('TOO_LARGE', `${change.path}: generated document too large`)
        if (old !== content) writes.push({ path: change.path, expectedRevision: change.expectedRevision, content })
      }
      if (!writes.length) return []
      await this.guard(writes.map(w => w.path), context)
      const relative = `.ctxkit/transactions/tx_${randomUUID().replaceAll('-', '')}.json`
      const transaction = { schema: 1, sessionId, status: 'prepared', writes }
      await this.publish(relative, JSON.stringify(transaction), null, context, true)
      for (const write of writes) await this.publish(write.path, write.content, write.expectedRevision, context)
      const journal = await this.raw(relative, true)
      await this.publish(relative, JSON.stringify({ schema: 1, sessionId, status: 'applied', paths: writes.map(w => w.path) }), hash(journal), context, true)
      return writes.map(w => w.path)
    })
  }
  async recoverTransactions(context, sessionId) {
    return this.locked(context, async () => {
      const recovered = []
      for (const journal of await this.controls('transactions')) {
        const tx = journal.value
        if (tx.status !== 'prepared' || tx.sessionId !== sessionId) continue
        if (!Array.isArray(tx.writes) || tx.writes.length > 32) fail('CORRUPT', 'Invalid transaction writes')
        // Validate every target before resuming any of this transaction's changes.
        for (const w of tx.writes) {
          decode(w.content, w.path)
          const old = await this.raw(w.path)
          const actual = old === null ? null : hash(old)
          if (actual !== w.expectedRevision && actual !== hash(w.content)) fail('CONFLICT', `${w.path}: external changes prevent recovery`)
        }
        for (const w of tx.writes) {
          const old = await this.raw(w.path)
          if (old !== w.content) await this.publish(w.path, w.content, w.expectedRevision, context)
        }
        const raw = await this.raw(journal.path, true)
        await this.publish(journal.path, JSON.stringify({ schema: 1, sessionId, status: 'applied', paths: tx.writes.map(w => w.path) }), hash(raw), context, true)
        recovered.push(journal.path)
      }
      return recovered
    })
  }
  async list() {
    await this.target('INDEX.md')
    const files = []
    const walk = async (dir, depth) => {
      if (depth > 8) fail('TOO_LARGE', 'Vault nesting exceeds supported depth')
      for (const entry of await fs.readdir(path.join(this.root, dir), { withFileTypes: true })) {
        if (entry.name.startsWith('.')) continue
        const relative = dir ? `${dir}/${entry.name}` : entry.name
        if (entry.isSymbolicLink()) fail('SYMLINK', 'Vault contains a symlink; remove it from the managed scope')
        if (entry.isDirectory()) { if (dir || ['topics', 'sessions'].includes(entry.name)) await walk(relative, depth + 1) }
        else if (entry.name.endsWith('.md')) {
          if (files.length >= LIMITS.files) fail('TOO_LARGE', `MVP supports at most ${LIMITS.files} Markdown files per vault`)
          try { files.push(await this.read(relative)) } catch (e) { if (e.code !== 'UNMANAGED') throw e }
        }
      }
    }
    await walk('', 0)
    return files
  }
  async search(query, { limit = 10 } = {}) {
    if (typeof query !== 'string' || query.length > 500 || !Number.isSafeInteger(limit) || limit < 1 || limit > 30) fail('INVALID', 'Query/limit exceeds bounds')
    const q = query.trim().toLowerCase()
    const terms = [...new Set(q.match(/[a-z0-9_-]+|[\p{Script=Han}]/gu) || [])]
    return (await this.list()).filter(d => d.metadata.kind !== 'index').map(d => {
      const title = `${d.metadata.title || ''} ${(d.metadata.aliases || []).join(' ')} ${d.metadata.scope || ''}`.toLowerCase()
      const content = d.body.toLowerCase()
      let score = q ? (title.includes(q) ? 20 : 0) + (content.includes(q) ? 5 : 0) : 1
      for (const term of terms) score += (title.includes(term) ? 3 : 0) + (content.includes(term) ? 1 : 0)
      const index = q ? content.indexOf(q) : 0
      return { path: d.path, title: d.metadata.title || d.path, excerpt: d.body.slice(Math.max(0, index - 80), Math.max(0, index - 80) + 500), score, metadata: d.metadata }
    }).filter(d => d.score > 0).sort((a, b) => b.score - a.score || a.path.localeCompare(b.path)).slice(0, limit)
  }
  async related(topicId) {
    const topics = (await this.list()).filter(d => d.metadata.kind === 'topic')
    return topics.flatMap(t => (t.metadata.relations || []).filter(r => t.metadata.id === topicId || r.to === topicId).map(r => ({ from: t.metadata.id, ...r })))
  }
  indexChange(documents) {
    const old = documents.find(d => d.path === 'INDEX.md')
    const topics = documents.filter(d => d.metadata.kind === 'topic').sort((a, b) => a.metadata.title.localeCompare(b.metadata.title))
    return { path: 'INDEX.md', expectedRevision: old?.revision ?? null, metadata: { kind: 'index', title: 'Context index' }, body: '# Context index\n\n' + topics.map(d => `- [${escapeLabel(d.metadata.title)}](${d.path}) — ${escapeLabel(d.metadata.scope || '')}`).join('\n') }
  }
}
