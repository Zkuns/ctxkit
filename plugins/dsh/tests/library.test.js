import test from 'node:test'
import assert from 'node:assert/strict'
import * as fs from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { createScope, resolveConfig } from '../adapter.js'
import { encode, LIMITS } from '../contracts.js'
import { Vault } from '../vault.js'
import { createLibrary, LIBRARY_MAX_BYTES } from '../library.js'

// Isolated real Vault reads and the existing Session scope; no user profile,
// raw DSH transcripts, model calls, browser emulation or write authorization.
async function fixture(t, options = {}) {
  const temp = await fs.realpath(await fs.mkdtemp(join(tmpdir(), 'ctxkit-tree-')))
  const root = join(temp, 'vault'), workspace = join(temp, 'workspace'), outside = join(temp, 'outside')
  await Promise.all([root, workspace, outside].map(path => fs.mkdir(path)))
  t.after(() => fs.rm(temp, { recursive: true, force: true }))
  const session = { id: 'fictional-tree-session', header: { cwd: workspace, origin: 'user' } }
  const scope = createScope({ sandboxPolicy: { resolve: () => ({ mode: 'read-only' }) } },
    resolveConfig({ root, allowedWorkspaces: [workspace], provider: 'fictional', model: 'fictional' }))
  const vault = new Vault({ root, authorize: async () => assert.fail('Tree reads must never authorize writes') })
  const adapter = { active: true, scope, engine: { vault, disposed: false },
    status: async () => ({ paused: false, pending: 0, captureEligible: false, reason: 'CTXKIT_READ_ONLY' }), ...options }
  const library = createLibrary(adapter)
  async function raw(path, body) {
    await fs.mkdir(dirname(join(root, path)), { recursive: true })
    await fs.writeFile(join(root, path), body)
  }
  const put = (path, metadata, body = '# Fictional record\n\nObserved fixture, not user data.') => raw(path, encode(metadata, body))
  return { temp, root, workspace, outside, session, scope, vault, adapter, library, raw, put,
    query: (args = {}, context = { session }) => library.query({ action: 'tree', ...args }, context) }
}

const overview = 'topics/topic_atlas/OVERVIEW.md'

test('tree exposes every real managed Markdown kind including nested files and the derived index', async t => {
  const f = await fixture(t)
  const rows = [
    [overview, 'topic'],
    ['topics/topic_atlas/docs/auth/keys.md', 'document'],
    ['topics/topic_atlas/skills/deploy/SKILL.md', 'skill-draft'],
    ['sessions/session_fictional/SESSION.md', 'session'],
    ['sessions/session_fictional/checkpoints/cp_fictional.md', 'checkpoint'],
  ]
  for (const [path, kind] of rows) await f.put(path, { kind, title: `Fictional ${kind}`, sessionId: 'DO_NOT_RETURN_SESSION', privateExtra: 'DO_NOT_RETURN_METADATA' }, 'DO_NOT_RETURN_BODY')
  const index = f.vault.indexChange(await f.vault.list())
  await f.put(index.path, index.metadata, index.body)
  const result = await f.query({ limit: 50 })
  assert.equal(result.ok, true); assert.equal(result.action, 'tree')
  assert.equal(result.readOnly, true); assert.equal(result.untrusted, true)
  assert.equal(result.total, 6); assert.equal(result.nextOffset, null); assert.equal(result.truncated, false)
  assert.deepEqual(result.results.map(row => row.path), ['INDEX.md', ...rows.map(([path]) => path)].sort((a, b) => a.localeCompare(b)))
  assert.doesNotMatch(JSON.stringify(result), /DO_NOT_RETURN|excerpt|metadata|sources/)
  for (const row of result.results) {
    assert.deepEqual(Object.keys(row).sort(), ['kind', 'path', 'revision', 'title'])
    assert.match(row.revision, /^[a-f0-9]{64}$/)
    const read = await f.library.query({ action: 'read', path: row.path }, { session: f.session })
    assert.equal(read.ok, true, `listed file is readable: ${row.path}`)
    assert.equal(read.revision, row.revision)
  }
  assert.equal(await fs.stat(join(f.root, '.ctxkit')).catch(() => null), null)
})

test('empty tree is explicit and invents no folders or session records', async t => {
  const f = await fixture(t)
  assert.deepEqual(await f.query(), { ok: true, configured: true, state: 'ready', action: 'tree', results: [],
    offset: 0, limit: 20, total: 0, nextOffset: null, truncated: false,
    processing: { paused: false, pending: 0, captureEligible: false, reason: 'CTXKIT_READ_ONLY', adapterNotice: null }, readOnly: true, untrusted: true })
})

test('tree excludes unmanaged, hidden, internal and out-of-layout records without scanning unrelated directories', async t => {
  const f = await fixture(t)
  await f.put(overview, { kind: 'topic', title: 'Safe fixture' })
  await f.raw('INDEX.md', 'PRIVATE_UNMANAGED_INDEX')
  await f.raw('topics/topic_atlas/docs/private.md', 'PRIVATE_UNMANAGED_DOCUMENT')
  await f.put('topics/topic_atlas/docs/unknown.md', { kind: 'not-a-managed-kind', title: 'PRIVATE_KIND' })
  await f.put('topics/topic_atlas/unsupported.md', { kind: 'document', title: 'PRIVATE_LAYOUT' })
  await f.put('private.md', { kind: 'document', title: 'PRIVATE_ROOT_DOCUMENT' })
  await f.put('unrelated/record.md', { kind: 'document', title: 'PRIVATE_UNRELATED_DIRECTORY' })
  await f.raw('.ctxkit/jobs/secret.json', '{"secret":"PRIVATE_JOB"}')
  await f.put('.hidden/secret.md', { kind: 'document', title: 'PRIVATE_HIDDEN_DIRECTORY' })
  await f.put('topics/topic_atlas/.secret.md', { kind: 'document', title: 'PRIVATE_HIDDEN_FILE' })
  const pathsRead = [], read = f.vault.read.bind(f.vault)
  f.vault.read = async path => { pathsRead.push(path); return read(path) }
  const result = await f.query()
  assert.equal(result.ok, true); assert.equal(result.total, 1)
  assert.equal(result.results[0].path, overview)
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE_|private\.md|unknown\.md|unsupported\.md/)
  assert.ok(pathsRead.every(path => !path.startsWith('unrelated/') && !path.includes('/.') && !path.startsWith('.')))
  assert.equal((await f.library.query({ action: 'read', path: 'INDEX.md' }, { session: f.session })).error, 'UNMANAGED')
})

test('tree pagination is path-stable, complete beyond top30 and reports total and truncation', async t => {
  const f = await fixture(t)
  const expected = []
  for (let i = 0; i < 61; i++) {
    const path = `topics/topic_atlas/docs/part_${i}.md`
    expected.push(path)
    await f.put(path, { kind: 'document', title: `Reverse title ${61 - i}`, updatedAt: String(i) })
  }
  const seen = []; let offset = 0
  do {
    const result = await f.query({ offset, limit: 7 })
    assert.equal(result.ok, true); assert.equal(result.total, 61); assert.equal(result.truncated, true)
    assert.equal(result.offset, offset)
    seen.push(...result.results.map(row => row.path))
    if (result.nextOffset !== null) assert.equal(result.nextOffset, offset + result.results.length)
    offset = result.nextOffset
  } while (offset !== null)
  assert.deepEqual(seen, expected.sort((a, b) => a.localeCompare(b)))
  const after = await f.query({ offset: 100, limit: 7 })
  assert.equal(after.total, 61); assert.equal(after.results.length, 0); assert.equal(after.nextOffset, null)
})

test('tree byte budgeting trims whole entries and nextOffset never skips omitted paths', async t => {
  const f = await fixture(t, { maxOutputChars: 1500 })
  for (let i = 0; i < 8; i++) await f.put(`topics/topic_atlas/docs/part_${i}.md`, { kind: 'document', title: '界'.repeat(180) })
  const seen = []; let offset = 0
  do {
    const result = await f.query({ offset, limit: 50 })
    assert.equal(result.ok, true); assert.equal(result.total, 8); assert.equal(result.truncated, true)
    assert.ok(Buffer.byteLength(JSON.stringify(result)) <= 1500)
    assert.ok(result.results.length > 0)
    assert.ok(result.results.length < 8)
    seen.push(...result.results.map(row => row.path))
    if (result.nextOffset !== null) assert.equal(result.nextOffset, offset + result.results.length)
    offset = result.nextOffset
  } while (offset !== null)
  assert.equal(seen.length, 8); assert.equal(new Set(seen).size, 8)
  assert.ok(Buffer.byteLength(JSON.stringify(await f.query())) <= LIBRARY_MAX_BYTES)
  const tiny = createLibrary({ ...f.adapter, maxOutputChars: 128 })
  const result = await tiny.query({ action: 'tree' }, { session: f.session })
  assert.equal(result.ok, false); assert.equal(result.error, 'CTXKIT_OUTPUT_BUDGET_TOO_SMALL')
})

test('tree query filters only path and bounded display title, not document bodies', async t => {
  const f = await fixture(t)
  await f.put('topics/topic_atlas/docs/auth.md', { kind: 'document', title: 'Offline design\u0001' }, 'BODY_ONLY_NEEDLE')
  assert.equal((await f.query({ query: 'AUTH.MD' })).total, 1)
  const result = await f.query({ query: 'offline' })
  assert.equal(result.total, 1); assert.equal(result.results[0].title, 'Offline design')
  assert.equal((await f.query({ query: 'BODY_ONLY_NEEDLE' })).total, 0)
})

test('tree requires a real allowed Session and rejects forged scope, traversal and invalid pagination before listing', async t => {
  const f = await fixture(t); let scans = 0
  f.vault.list = async () => { scans++; return [] }
  assert.equal((await f.query({}, {})).error, 'CTXKIT_SESSION_REQUIRED')
  assert.equal((await f.query({}, { session: { id: 'other', header: { cwd: f.outside } } })).error, 'CTXKIT_SCOPE_DENIED')
  assert.equal((await f.query({}, { session: { id: 'child', header: { cwd: f.workspace, origin: 'subagent' } } })).error, 'CTXKIT_SUBAGENT_EXCLUDED')
  for (const args of [{ root: f.root }, { cwd: f.workspace }, { sessionId: f.session.id }, { path: '../secret.md' }, { path: '.ctxkit/jobs/secret.json' }, { path: '/outside.md' }, { limit: 51 }, { offset: -1 }, { query: 'x'.repeat(501) }]) {
    assert.equal((await f.query(args)).error, 'CTXKIT_QUERY_ARGUMENTS')
  }
  assert.equal(scans, 0)
})

test('tree rejects file and directory symlinks without reading their target', async t => {
  for (const directory of [false, true]) {
    const f = await fixture(t)
    await f.put(overview, { kind: 'topic', title: 'Safe' })
    const target = join(f.outside, 'secret.md')
    await fs.writeFile(target, encode({ kind: 'document', title: 'PRIVATE_OUTSIDE' }, 'PRIVATE_OUTSIDE_BODY'))
    await fs.symlink(directory ? f.outside : target, join(f.root, directory ? 'topics/topic_link' : 'topics/topic_atlas/linked.md'))
    const result = await f.query()
    assert.equal(result.ok, false); assert.equal(result.state, 'denied')
    assert.doesNotMatch(JSON.stringify(result), /PRIVATE_OUTSIDE|secret\.md/)
  }
})

test('tree rechecks Session scope, root, disposal and cancellation after the awaited scan', async t => {
  for (const change of ['workspace', 'root', 'disposed', 'abort']) {
    const f = await fixture(t), controller = new AbortController()
    await f.put(overview, { kind: 'topic', title: 'NEVER_RETURN_STALE_RECORD' })
    const list = f.vault.list.bind(f.vault)
    f.vault.list = async () => {
      const result = await list()
      if (change === 'workspace') f.session.header.cwd = f.outside
      if (change === 'root') { await fs.rename(f.root, `${f.root}-saved`); await fs.symlink(f.outside, f.root) }
      if (change === 'disposed') f.adapter.engine.disposed = true
      if (change === 'abort') controller.abort()
      return result
    }
    const result = await f.query({}, { session: f.session, signal: controller.signal })
    assert.equal(result.ok, false)
    assert.doesNotMatch(JSON.stringify(result), /NEVER_RETURN_STALE_RECORD/)
    if (change === 'workspace') assert.equal(result.error, 'CTXKIT_SCOPE_DENIED')
    if (change === 'disposed') assert.equal(result.error, 'CTXKIT_DISPOSED')
    if (change === 'abort') assert.equal(result.error, 'CTXKIT_CANCELLED')
  }
})

test('tree keeps the existing file-count scan bound and reports overflow instead of a successful partial tree', async t => {
  const f = await fixture(t)
  for (let i = 0; i <= LIMITS.files; i++) await f.put(`topics/topic_atlas/docs/part_${i}.md`, { kind: 'document', title: `Part ${i}` })
  const result = await f.query({ limit: 50 })
  assert.equal(result.ok, false); assert.equal(result.error, 'TOO_LARGE')
  assert.equal(result.results, undefined); assert.equal(result.total, undefined)
})

test('tree keeps the scanner depth and file-size bounds', async t => {
  for (const oversized of [false, true]) {
    const f = await fixture(t)
    if (oversized) await f.put(overview, { kind: 'topic', title: 'PRIVATE_OVERSIZED' }, 'x'.repeat(LIMITS.fileBytes))
    else await f.put('topics/topic_atlas/docs/a/b/c/d/e/f/record.md', { kind: 'document', title: 'PRIVATE_DEEP_RECORD' })
    const result = await f.query()
    assert.equal(result.ok, false); assert.equal(result.error, 'TOO_LARGE')
    assert.doesNotMatch(JSON.stringify(result), /PRIVATE_|record\.md/)
  }
})

test('tree exposes capture blockers without treating the readable library as unconfigured', async t => {
  const f = await fixture(t, { status: async () => ({ paused: false, pending: 0, captureEligible: false, reason: 'CTXKIT_MODEL_UNAVAILABLE' }) })
  const result = await f.query()
  assert.equal(result.ok, true)
  assert.equal(result.configured, true)
  assert.equal(result.total, 0)
  assert.equal(result.processing.reason, 'CTXKIT_MODEL_UNAVAILABLE')
  assert.equal(result.processing.captureEligible, false)
})

test('tree does not alter the global inactive-library gate', async () => {
  const bomb = () => assert.fail('Inactive library must stay inert')
  const library = createLibrary({ active: false, get scope() { bomb() }, get engine() { bomb() } })
  assert.deepEqual(await library.query({ action: 'tree' }, {}), { ok: true, configured: false, state: 'setup_required' })
})
