import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import * as fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import * as plugin from '../index.js'

const anchor = process.env.DSH_INSTALL_DIR
const load = async name => {
  const require = createRequire(path.join(anchor, 'package.json'))
  return import(pathToFileURL(require.resolve(name)).href)
}
test('real installed Cordis, tools, skill and prompt registries mount and unload the plugin', { skip: !anchor }, async t => {
  const [{ Context }, { SandboxedFileSystem }, { default: Tools }, { default: Skills }, { default: SystemPrompt }, { CommandRuntime }] = await Promise.all([
    load('@deepseek-ai/cordis'), load('@deepseek-ai/dsh-fs-sandbox'), load('@deepseek-ai/dsh-tools'), load('@deepseek-ai/dsh-skill'), load('@deepseek-ai/dsh-system-prompt'), load('@deepseek-ai/dsh-commands'),
  ])
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'ctxkit-host-'))
  const root = await fs.realpath(directory)
  t.after(() => fs.rm(root, { recursive: true, force: true }))
  const ctx = new Context()
  t.after(() => ctx.fiber.dispose())
  ctx.provide('sandboxPolicy', { defaultMode: 'workspace-write', resolve: () => ({ mode: 'workspace-write', workspaceRoot: root }) })
  let calls = 0
  ctx.provide('llm', { async *stream(request) {
    calls++
    assert.equal(request.provider, 'synthetic')
    assert.deepEqual(request.tools, [])
    yield { type: 'text-delta', text: '{"meaningful":false}' }
    yield { type: 'finish', reason: { kind: 'stop' } }
  } })
  ctx.provide('sessions', {})
  ctx.provide('agents', {})
  for (const [implementation, config] of [[SandboxedFileSystem, { cwd: root }], [SystemPrompt, { includeRuntimeContext: false }], [Tools, {}], [Skills, {}], [CommandRuntime, {}]]) {
    await ctx.plugin(implementation, config).await()
  }
  const fiber = ctx.plugin(plugin, { enabled: true, root, allowedWorkspaces: [root], provider: 'synthetic', model: 'synthetic' })
  await fiber.await()
  const definitions = ctx.tools.definitions()
  assert.deepEqual(definitions.map(d => d.name).sort(), ['ctxkit_browse', 'ctxkit_pause', 'ctxkit_read', 'ctxkit_retry', 'ctxkit_search', 'ctxkit_status', 'recall_context'])
  const skills = await ctx.skills.list({ cwd: root })
  assert.equal(skills.length, 1)
  assert.equal(skills[0].name, 'ctxkit-recall')
  assert.match((await ctx.skills.get('ctxkit-recall', { cwd: root })).content, /recall_context/)
  assert.equal((await ctx.skills.list({ cwd: path.dirname(root) })).length, 0)
  const audit = []
  const session = { id: 'synthetic-host', header: { cwd: root, origin: 'user' }, inheritedEventCount: 0,
    append(type, data) { audit.push({ type, data }); return { seq: audit.length - 1 } } }
  const exec = { agent: { session }, signal: new AbortController().signal }
  ctx.emit('session/event', session, { seq: 0, type: 'turn/start', data: { turn: 1 } })
  ctx.emit('session/event', session, { seq: 1, type: 'user/message', data: { source: { kind: 'user' }, content: [{ type: 'text', text: 'Hello, no project work today.' }] } })
  ctx.emit('session/event', session, { seq: 2, type: 'assistant/message', data: { message: { content: [{ type: 'text', text: 'Hello.' }] } } })
  ctx.emit('session/event', session, { seq: 3, type: 'turn/end', data: { turn: 1 } })
  // The explicit retry joins the serial queue; no sleeps or polling are used.
  await definitions.find(d => d.name === 'ctxkit_retry').execute({}, exec)
  const status = await definitions.find(d => d.name === 'ctxkit_status').execute({}, exec)
  assert.equal(status.captureEligible, true)
  assert.equal(status.jobs[0].status, 'skipped')
  const recalled = await definitions.find(d => d.name === 'recall_context').execute({ query: 'Atlas progress' }, exec)
  assert.equal(recalled.ok, true)
  assert.equal(recalled.total, 0)
  assert.equal(recalled.untrusted, true)
  assert.equal(calls, 1, 'recall reads managed records without another model request')
  const browser = await ctx.commands.execute(exec.agent, '/ctxkit-library {"action":"topics"}', [], exec.signal)
  assert.deepEqual(JSON.parse(browser.result.text), await definitions.find(d => d.name === 'ctxkit_browse').execute({ action: 'topics' }, exec))
  assert.deepEqual(audit.map(event => event.type), ['command/run', 'command/done'])
  await fiber.dispose()
  assert.equal(ctx.tools.definitions().length, 0)
  assert.equal((await ctx.skills.list({ cwd: root })).length, 0)
  assert.equal(await ctx.commands.execute(exec.agent, '/ctxkit-library {}', [], exec.signal), undefined)
  const inactive = ctx.plugin(plugin, { enabled: false })
  await inactive.await()
  const noSetup = await ctx.commands.execute(exec.agent, '/ctxkit-library {}', [], exec.signal)
  assert.equal(JSON.parse(noSetup.result.text).state, 'unconfigured')
  assert.equal(ctx.tools.definitions().length, 0)
  assert.equal(calls, 1)
  await inactive.dispose()
})
