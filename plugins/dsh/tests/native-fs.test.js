import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import * as fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { Engine } from '../engine.js'
import { createPublisher, createScope, resolveConfig } from '../adapter.js'

// Optional integration against the actual installed DSH fs backend. No profile,
// real session, credential, network, or model is used; source events are fictional.
test('publisher propagates session cancellation into the final filesystem mutation', async t => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'ctxkit-cancel-'))
  const root = await fs.realpath(dir)
  t.after(() => fs.rm(root, { recursive: true, force: true }))
  const session = { id: 'cancel-fixture', header: { cwd: root } }
  const controller = new AbortController()
  let entered, release, published = false
  const ready = new Promise(resolve => { entered = resolve })
  const barrier = new Promise(resolve => { release = resolve })
  const ctx = { sandboxPolicy: { resolve: () => ({ mode: 'workspace-write', workspaceRoot: root }) }, fs: {
    sandboxMode: 'workspace-write', resolve: async p => p, stat: async () => undefined, readText: async () => '',
    writeText: async (_target, _text, _guard, signal) => { entered(); await barrier; signal.throwIfAborted(); published = true },
  } }
  const config = resolveConfig({ root, allowedWorkspaces: [root], provider: 'synthetic', model: 'synthetic' })
  const publish = createPublisher(ctx, createScope(ctx, config))
  const result = publish({ relativePath: 'INDEX.md', text: 'not published', expectedRevision: null, context: { session, signal: controller.signal } })
  const rejected = assert.rejects(result, /paused/)
  await ready
  controller.abort(new Error('paused'))
  release()
  await rejected
  assert.equal(published, false)
})

const anchor = process.env.DSH_INSTALL_DIR
const load = async name => {
  const require = createRequire(path.join(anchor, 'package.json'))
  return import(pathToFileURL(require.resolve(name)).href)
}
test('real installed DSH sandbox filesystem publishes the full core pipeline with native CAS', { skip: !anchor }, async t => {
  const { Context } = await load('@deepseek-ai/cordis')
  const { SandboxedFileSystem } = await load('@deepseek-ai/dsh-fs-sandbox')
  const base = await fs.mkdtemp(path.join(os.tmpdir(), 'ctxkit-native-'))
  const root = await fs.realpath(base)
  t.after(() => fs.rm(root, { recursive: true, force: true }))
  let mode = 'workspace-write'
  const policy = { defaultMode: 'workspace-write', resolve: () => ({ mode, workspaceRoot: root }) }
  const ctx = new Context()
  ctx.provide('sandboxPolicy', policy)
  const fiber = ctx.plugin(SandboxedFileSystem, { cwd: root, diffBasisMaxBytes: 1024 * 1024 })
  await fiber.await()
  t.after(() => ctx.fiber.dispose())
  assert.ok(ctx.fs?.writeText)
  const session = { id: 'synthetic-native-session', header: { cwd: root, origin: 'user' } }
  const config = resolveConfig({ enabled: true, root, allowedWorkspaces: [root], provider: 'synthetic', model: 'synthetic' })
  const scope = createScope(ctx, config)
  const publisher = createPublisher(ctx, scope)
  const engine = new Engine({ root, authorize: scope.authorize, publishText: publisher, generate: async ({ purpose }) => JSON.stringify(purpose === 'ctxkit.capture' ? {
    meaningful: true, title: 'Synthetic verification', summary: 'Local synthetic checks passed; deployment did not occur.', next: 'Review prerequisites.', topicHints: ['Atlas'],
    preferences: [{ id: 'pref_response_format', action: 'set', text: 'Prefer concise bullets.', sourceSeq: 1, quote: 'Prefer concise bullets in future tasks.' }],
    facts: [{ text: 'Synthetic local checks passed.', kind: 'result', evidence: 'observed', sourceSeqs: [2] }],
  } : { topics: [{ id: 'topic_atlas', title: 'Atlas', aliases: [], scope: 'Fictional example', body: '# Atlas\n\nLocal checks passed; no deployment.', expectedRevision: null }], documents: [], relations: [], note: '' }) })
  t.after(async () => { engine.dispose(); await engine.queue })
  const result = await engine.enqueueTurn({ sessionId: session.id, cwd: root, turn: 1, fromSeq: 1, toSeq: 3, sourceSeqs: [1, 2], userSources: [{ seq: 1, text: 'Prefer concise bullets in future tasks.' }], text: '[seq:1 user]\nPrefer concise bullets in future tasks.\n[seq:2 tool result]\nSynthetic checks passed.', context: { session } })
  assert.equal(result.status, 'done', result.error)
  const preferences = await engine.vault.read('USER.md')
  assert.equal(preferences.metadata.kind, 'user-preferences')
  assert.match(preferences.body, /Prefer concise bullets/)
  const doc = await engine.vault.read('topics/topic_atlas/OVERVIEW.md')
  assert.equal(doc.metadata.id, 'topic_atlas')
  await assert.rejects(publisher({ relativePath: doc.path, text: 'stale overwrite', context: { session }, expectedRevision: null }), /REVISION_CONFLICT/)
  mode = 'read-only'
  const next = { sessionId: session.id, cwd: root, turn: 2, fromSeq: 4, toSeq: 6, text: '[seq:5 user]\nDo not write.', sourceSeqs: [5], context: { session } }
  await assert.rejects(engine.enqueueTurn(next), /READ_ONLY/)
  assert.equal((await engine.vault.read(doc.path)).revision, doc.revision)
  assert.equal((await engine.vault.read('USER.md')).revision, preferences.revision)
  mode = 'workspace-write'
})
