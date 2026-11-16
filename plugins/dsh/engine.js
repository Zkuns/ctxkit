import { Vault } from './vault.js'
import { CAPTURE_SYSTEM, ORGANIZE_SYSTEM } from './prompts.js'
import { checkpointKey, sessionKey, validateTurn, validateCapture, validatePlan, parseJSON, redact, safeError, fail, hash, encode } from './contracts.js'

const jobPath = id => `.ctxkit/jobs/${id}.json`
const stagePath = j => `sessions/${sessionKey(j.sessionId)}/checkpoints/${j.id}.md`
const overviewPath = topicId => `topics/${topicId}/OVERVIEW.md`
const label = value => String(value).replace(/[\[\]\r\n]/g, ' ')
const terminal = new Set(['done', 'skipped'])
export class Engine {
  constructor(options) {
    this.abort = new AbortController()
    this.vault = new Vault({ ...options, signal: this.abort.signal, checkActive: async (paths, context) => {
      const sessionId = context?.session?.id || context?.sessionId
      const stateOnly = paths.every(p => p.startsWith('.ctxkit/pause/') || p === '.ctxkit/writer.lock' || p.includes('/.ctxkit-'))
      if (!stateOnly && sessionId && await this.isPaused(sessionId)) fail('PAUSED', 'This session is paused')
    } })
    this.generate = options.generate
    this.logger = options.logger || { warn() {} }
    this.now = options.now || (() => new Date().toISOString())
    this.queue = Promise.resolve()
    this.pending = 0
    this.disposed = false
    this.paused = new Map()
    if (options.signal) {
      if (options.signal.aborted) this.dispose()
      else options.signal.addEventListener('abort', () => this.dispose(), { once: true })
    }
  }
  schedule(fn) {
    if (this.disposed) return Promise.reject(new Error('CtxKit disposed'))
    if (this.pending >= 16) return Promise.reject(new Error('CtxKit queue is full; turn was not accepted'))
    this.pending++
    const next = this.queue.then(() => { this.abort.signal.throwIfAborted(); return fn() })
    this.queue = next.catch(error => this.logger.warn?.(`CtxKit: ${safeError(error)}`)).finally(() => { this.pending-- })
    return next
  }
  async isPaused(sessionId) {
    if (this.paused.has(sessionId)) return this.paused.get(sessionId)
    const saved = await this.vault.control(`.ctxkit/pause/${sessionKey(sessionId)}.json`)
    return saved?.paused === true
  }
  async assertActive(job, context) {
    this.abort.signal.throwIfAborted()
    if (await this.isPaused(job.sessionId)) fail('PAUSED', 'This session is paused')
    await this.vault.guard([jobPath(job.id)], context)
  }
  async setPaused(sessionId, paused, context) {
    if (typeof sessionId !== 'string' || typeof paused !== 'boolean') fail('INVALID', 'Invalid pause request')
    this.paused.set(sessionId, paused)
    try {
      await this.vault.putControl(`.ctxkit/pause/${sessionKey(sessionId)}.json`, { sessionId, paused }, context)
      return { paused, persisted: true }
    } catch (error) { return { paused, persisted: false, error: safeError(error) } }
  }
  enqueueTurn(input) {
    validateTurn(input)
    // Copy and redact promptly; don't persist the raw transcript or the live session object.
    const safe = { ...input, text: redact(input.text), context: { ...input.context, sessionId: input.sessionId } }
    return this.schedule(async () => {
      const id = checkpointKey(safe)
      if (await this.isPaused(safe.sessionId)) return { id, status: 'paused' }
      await this.vault.guard([jobPath(id)], safe.context)
      let job = await this.vault.control(jobPath(id))
      if (job && terminal.has(job.status)) return { id, status: job.status, duplicate: true }
      if (!job) {
        job = { schema: 1, id, sessionId: safe.sessionId, cwd: safe.cwd, turn: safe.turn, fromSeq: safe.fromSeq, toSeq: safe.toSeq, sourceSeqs: safe.sourceSeqs, status: 'queued', attempts: 0, createdAt: this.now() }
        await this.saveJob(job, safe.context)
      }
      return this.process(job, safe, safe.context)
    })
  }
  async saveJob(job, context) {
    await this.vault.putControl(jobPath(job.id), { ...job, updatedAt: this.now() }, context)
  }
  async invoke(purpose, system, payload, context) {
    if (typeof this.generate !== 'function') fail('MODEL', 'No explicit summarization provider configured')
    this.abort.signal.throwIfAborted()
    const answer = await this.generate({ purpose, system, user: JSON.stringify(payload), signal: this.abort.signal, context })
    this.abort.signal.throwIfAborted()
    return parseJSON(redact(answer))
  }
  async process(job, input, context) {
    try {
      await this.assertActive(job, context)
      await this.vault.recoverTransactions(context, job.sessionId)
      let checkpoint = await this.vault.maybeRead(stagePath(job))
      if (checkpoint?.metadata.organized) {
        job.status = 'done'; delete job.error
        await this.saveJob(job, context)
        return { id: job.id, status: 'done', recovered: true }
      }
      if (!checkpoint) {
        if (!input?.text) {
          job.status = 'waiting_source'
          await this.saveJob(job, context)
          return { id: job.id, status: job.status }
        }
        job.status = 'capturing'; job.attempts++; delete job.error
        await this.saveJob(job, context)
        const existing = await this.vault.maybeRead(`sessions/${sessionKey(job.sessionId)}/SESSION.md`)
        const previous = existing?.body.slice(0, 6000) || ''
        const capture = validateCapture(await this.invoke('ctxkit.capture', CAPTURE_SYSTEM, {
          source: { sessionId: job.sessionId, turn: job.turn, fromSeq: job.fromSeq, toSeq: job.toSeq },
          allowedSourceSeqs: input.sourceSeqs || job.sourceSeqs || [], previousSessionOverview: previous, text: input.text,
        }, context), { ...job, sourceSeqs: input.sourceSeqs || job.sourceSeqs })
        await this.assertActive(job, context)
        if (!capture.meaningful) {
          job.status = 'skipped'
          await this.saveJob(job, context)
          return { id: job.id, status: job.status }
        }
        await this.capture(job, capture, context)
        job.status = 'captured'; job.checkpointPath = stagePath(job)
        await this.saveJob(job, context)
        checkpoint = await this.vault.read(stagePath(job))
      }
      await this.assertActive(job, context)
      job.status = 'organizing'
      await this.saveJob(job, context)
      const snapshot = await this.snapshot(checkpoint)
      const plan = validatePlan(await this.invoke('ctxkit.organize', ORGANIZE_SYSTEM, { checkpoint, ...snapshot }, context))
      await this.assertActive(job, context)
      const paths = await this.applyPlan(job, checkpoint, plan, snapshot, context)
      job.status = 'done'; job.paths = paths; job.note = plan.note; delete job.error
      await this.saveJob(job, context)
      return { id: job.id, status: 'done', paths, note: plan.note }
    } catch (error) {
      job.status = error.code === 'PAUSED' ? 'paused' : 'error'
      job.error = safeError(error)
      // If permission was revoked or shutdown occurred, do not bypass it to record the error.
      try { await this.saveJob(job, context) } catch { /* durable prior stage remains retryable */ }
      this.logger.warn?.(`CtxKit ${job.id}: ${job.error}`)
      return { id: job.id, status: job.status, error: job.error }
    }
  }
  async capture(job, capture, context) {
    const body = `# ${capture.title}\n\n${capture.summary}\n\n## Evidence\n\n` + capture.facts.map(f => `- **${f.kind} / ${f.evidence}** — ${f.text}\n  Source events: ${f.sourceSeqs.join(', ')}`).join('\n\n')
    const metadata = { kind: 'checkpoint', id: job.id, title: capture.title, sessionId: job.sessionId, source: { platform: 'dsh', sessionId: job.sessionId, turn: job.turn, fromSeq: job.fromSeq, toSeq: job.toSeq, sourceSeqs: job.sourceSeqs }, createdAt: this.now(), topicHints: capture.topicHints, next: capture.next, organized: false, topics: [] }
    const checkpoint = { path: stagePath(job), metadata, body, expectedRevision: null }
    const session = await this.sessionChange(job, { path: checkpoint.path, metadata, body }, [])
    await this.vault.commit([checkpoint, session], context, { sessionId: job.sessionId })
  }
  async sessionChange(job, newest, assignedTopics) {
    const path = `sessions/${sessionKey(job.sessionId)}/SESSION.md`
    const existing = await this.vault.maybeRead(path)
    const checkpoints = (await this.vault.list()).filter(d => d.metadata.kind === 'checkpoint' && d.metadata.sessionId === job.sessionId && d.path !== newest.path)
    checkpoints.push(newest)
    checkpoints.sort((a, b) => a.metadata.source.toSeq - b.metadata.source.toSeq)
    const latest = checkpoints.at(-1)
    const topics = [...new Set(checkpoints.flatMap(c => c.path === newest.path ? assignedTopics : c.metadata.topics || []))]
    const body = `# ${latest.metadata.title}\n\n## Work stages\n\n` + checkpoints.map(c => `- [${label(c.metadata.title)}](checkpoints/${c.metadata.id}.md) — turn ${c.metadata.source.turn}`).join('\n') + `\n\n## Current stopping point\n\n${latest.metadata.next || 'No explicit next step recorded.'}\n\n## Topics\n\n` + (topics.map(id => `- [${id}](../../topics/${id}/OVERVIEW.md)`).join('\n') || 'Not assigned yet. Stage records remain available.')
    return { path, expectedRevision: existing?.revision ?? null, metadata: { kind: 'session', id: sessionKey(job.sessionId), title: latest.metadata.title, sessionId: job.sessionId, cwd: job.cwd, topics, updatedAt: this.now() }, body }
  }
  async snapshot(checkpoint) {
    const files = await this.vault.list()
    const topics = files.filter(d => d.metadata.kind === 'topic')
    const query = (checkpoint.metadata.topicHints || []).join(' ') || checkpoint.metadata.title
    const hits = await this.vault.search(query, { limit: 18 })
    const paths = new Set(hits.map(h => h.path))
    for (const hit of hits) if (hit.metadata.topicId) paths.add(overviewPath(hit.metadata.topicId))
    const readableDocuments = []
    let remaining = 36000
    const candidates = files.filter(d => (d.metadata.kind === 'topic' || ['document', 'skill-draft'].includes(d.metadata.kind)) && paths.has(d.path))
    candidates.sort((a, b) => Number(b.metadata.kind === 'topic') - Number(a.metadata.kind === 'topic'))
    for (const file of candidates) {
      const size = JSON.stringify(file).length
      if (size <= remaining) { readableDocuments.push(file); remaining -= size }
    }
    return { catalog: topics.slice(0, 100).map(d => ({ id: d.metadata.id, title: d.metadata.title, aliases: d.metadata.aliases || [], scope: d.metadata.scope, path: d.path })), catalogTruncated: topics.length > 100, readableDocuments }
  }
  async applyPlan(job, checkpoint, plan, snapshot, context) {
    const files = await this.vault.list()
    const existingByPath = new Map(files.map(d => [d.path, d]))
    const readByPath = new Map(snapshot.readableDocuments.map(d => [d.path, d]))
    const topicsById = new Map(files.filter(d => d.metadata.kind === 'topic').map(d => [d.metadata.id, d]))
    const proposedTopics = new Map(plan.topics.map(t => [t.id, t]))
    const changes = new Map()
    const source = checkpoint.path
    const stamp = this.now()
    const checkRevision = (path, expected) => {
      const old = existingByPath.get(path)
      if (old) {
        const read = readByPath.get(path)
        if (!read || read.revision !== expected || old.revision !== expected) fail('CONFLICT', `${path}: not fully read or changed since planning`)
      } else if (expected !== null) fail('CONFLICT', `${path}: expected an existing document`)
      return old
    }
    const sources = old => [...new Set([...(old?.metadata.sources || []), source])]
    for (const topic of plan.topics) {
      const path = overviewPath(topic.id)
      const old = checkRevision(path, topic.expectedRevision)
      changes.set(path, { path, expectedRevision: topic.expectedRevision, metadata: { ...old?.metadata, kind: 'topic', id: topic.id, title: topic.title, aliases: topic.aliases, scope: topic.scope, sources: sources(old), relations: old?.metadata.relations || [], updatedAt: stamp }, body: topic.body })
    }
    for (const doc of plan.documents) {
      if (!proposedTopics.has(doc.topicId)) fail('NAVIGATION', 'Document updates must include its topic OVERVIEW in the same plan')
      if (!proposedTopics.get(doc.topicId).body.includes(doc.path)) fail('NAVIGATION', 'Topic overview must link to each changed document')
      const path = `topics/${doc.topicId}/${doc.path}`
      const old = checkRevision(path, doc.expectedRevision)
      const skill = doc.path.startsWith('skills/')
      changes.set(path, { path, expectedRevision: doc.expectedRevision, metadata: { ...old?.metadata, kind: skill ? 'skill-draft' : 'document', topicId: doc.topicId, title: doc.title, ...(skill ? { status: 'draft', executable: false } : {}), sources: sources(old), updatedAt: stamp }, body: skill ? `> CtxKit draft — not installed or authorized for execution. Review prerequisites and validation limits.\n\n${doc.body.replace(/^> CtxKit draft[^\n]*\n\s*/, '')}` : doc.body })
    }
    for (const relation of plan.relations) {
      if (!proposedTopics.has(relation.from)) fail('RELATION', 'Relation source must be a read/updated topic in this plan')
      if (!topicsById.has(relation.to) && !proposedTopics.has(relation.to)) fail('RELATION', 'Relation target is unknown')
      const topic = changes.get(overviewPath(relation.from))
      const prior = topic.metadata.relations.find(r => r.to === relation.to && r.type === relation.type)
      const relationData = { to: relation.to, type: relation.type, reason: relation.reason, sources: [...new Set([...(prior?.sources || []), source])] }
      topic.metadata.relations = topic.metadata.relations.filter(r => !(r.to === relation.to && r.type === relation.type)).concat(relationData)
    }
    const assignedTopics = [...new Set([...plan.topics.map(t => t.id), ...plan.documents.map(d => d.topicId)])]
    const updatedStage = { ...checkpoint, metadata: { ...checkpoint.metadata, organized: true, topics: assignedTopics, organizationNote: plan.note, outputs: [...changes.keys()] } }
    changes.set(checkpoint.path, { path: checkpoint.path, expectedRevision: checkpoint.revision, metadata: updatedStage.metadata, body: checkpoint.body })
    const session = await this.sessionChange(job, updatedStage, assignedTopics)
    changes.set(session.path, session)
    const virtual = files.filter(d => !changes.has(d.path)).concat([...changes.values()].map(c => ({ ...c, revision: hash(encode(c.metadata, c.body)) })))
    const index = this.vault.indexChange(virtual)
    // Preserve the revision from the actual existing index, not a virtual change.
    index.expectedRevision = existingByPath.get('INDEX.md')?.revision ?? null
    changes.set(index.path, index)
    return this.vault.commit([...changes.values()], context, { sessionId: job.sessionId })
  }
  recover({ context, resolveTurn } = {}) {
    return this.schedule(async () => {
      const sessionId = context?.session?.id || context?.sessionId
      if (!sessionId) fail('SCOPE', 'Recovery requires a current session identity')
      const results = []
      const jobs = (await this.vault.controls('jobs')).map(x => x.value).filter(j => j.sessionId === sessionId && !terminal.has(j.status)).sort((a, b) => a.fromSeq - b.fromSeq)
      for (const job of jobs.slice(0, 16)) {
        if (await this.isPaused(sessionId)) break
        let input = null
        if (!await this.vault.maybeRead(stagePath(job)) && resolveTurn) {
          const resolved = await resolveTurn(job)
          if (resolved) input = { ...job, ...resolved, text: redact(resolved.text) }
        }
        results.push(await this.process(job, input, context))
      }
      return results
    })
  }
  async status(sessionId) {
    const jobs = (await this.vault.controls('jobs')).map(x => x.value).filter(j => !sessionId || j.sessionId === sessionId)
    return { paused: sessionId ? await this.isPaused(sessionId) : false, disposed: this.disposed, pending: this.pending, totalJobs: jobs.length, jobs: jobs.slice(-30).map(({ id, sessionId, status, error, note, checkpointPath }) => ({ id, sessionId, status, error, note, checkpointPath })) }
  }
  dispose() { this.disposed = true; this.abort.abort(new Error('CtxKit unloaded')) }
}
