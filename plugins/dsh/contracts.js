import { createHash } from 'node:crypto'

export const SCHEMA = 1
export const LIMITS = Object.freeze({ body: 18000, files: 400, fileBytes: 128000, facts: 24, topics: 6, documents: 10, relations: 12 })
export const hash = value => createHash('sha256').update(value).digest('hex')
export const sessionKey = id => `session_${hash(id).slice(0, 24)}`
export const checkpointKey = input => `cp_${hash(JSON.stringify([input.sessionId, input.turn, input.fromSeq, input.toSeq])).slice(0, 24)}`
export class CtxError extends Error {
  constructor(code, message) { super(message); this.code = code }
}
export const fail = (code, message) => { throw new CtxError(code, message) }
export function text(value, name, max = LIMITS.body, allowEmpty = false) {
  if (typeof value !== 'string' || (!allowEmpty && !value.trim()) || value.length > max || value.includes('\0')) fail('INVALID', `${name}: invalid text or length`)
  return value.trim()
}
export function array(value, name, max) {
  if (!Array.isArray(value) || value.length > max) fail('INVALID', `${name}: expected array of at most ${max}`)
  return value
}
export function id(value) {
  if (typeof value !== 'string' || !/^topic_[a-z0-9][a-z0-9_-]{0,63}$/.test(value)) fail('INVALID', 'Topic IDs must be stable topic_<lowercase-id> identifiers')
  return value
}
export function relativePath(value) {
  if (typeof value !== 'string' || value.length > 240 || !value || value.includes('\\') || value.includes('\0') || value.startsWith('/') || value.includes(':') || value.split('/').some(p => !p || p === '.' || p === '..' || p.startsWith('.'))) fail('PATH', 'Expected a non-hidden vault-relative path without traversal')
  return value
}
export function documentPath(value) {
  relativePath(value)
  if (!/^(docs\/[a-z0-9][a-z0-9/_-]*\.md|skills\/[a-z0-9][a-z0-9_-]*\/SKILL\.md)$/.test(value)) fail('PATH', 'Document must be docs/<name>.md or skills/<name>/SKILL.md')
  return value
}
export function revision(value) {
  if (value !== null && (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value))) fail('INVALID', 'expectedRevision must be null or SHA-256')
  return value
}
export function parseJSON(value) {
  const source = text(value, 'model response', 64000)
  const stripped = source.replace(/^```(?:json)?\s*\n/i, '').replace(/\n```\s*$/, '')
  try { return JSON.parse(stripped) } catch { fail('MODEL_FORMAT', 'Model did not return valid JSON') }
}
function object(value, name, keys) {
  if (!value || Array.isArray(value) || typeof value !== 'object') fail('INVALID', `${name}: expected object`)
  for (const key of Object.keys(value)) if (!keys.includes(key)) fail('INVALID', `${name}: unsupported field ${key}`)
  return value
}
export function validateTurn(input) {
  text(input.sessionId, 'sessionId', 240)
  text(input.cwd, 'cwd', 4096)
  for (const key of ['turn', 'fromSeq', 'toSeq']) if (!Number.isSafeInteger(input[key]) || input[key] < 0) fail('INVALID', `${key}: expected nonnegative integer`)
  if (input.toSeq < input.fromSeq) fail('INVALID', 'Reversed source range')
  text(input.text, 'source text', 64000)
  if (input.sourceSeqs !== undefined) {
    array(input.sourceSeqs, 'sourceSeqs', 2000)
    if (input.sourceSeqs.some(n => !Number.isSafeInteger(n) || n < input.fromSeq || n > input.toSeq)) fail('SOURCE', 'Supplied event sequences must be inside the turn range')
  }
  return input
}
export function validateCapture(raw, input) {
  object(raw, 'capture', ['meaningful', 'title', 'summary', 'next', 'facts', 'topicHints'])
  if (typeof raw.meaningful !== 'boolean') fail('INVALID', 'meaningful must be boolean')
  if (!raw.meaningful) return { meaningful: false }
  const out = { meaningful: true, title: text(raw.title, 'title', 180), summary: text(raw.summary, 'summary', 6000), next: text(raw.next, 'next', 3000, true) }
  out.topicHints = array(raw.topicHints, 'topicHints', 8).map(v => text(v, 'topicHint', 120))
  out.facts = array(raw.facts, 'facts', LIMITS.facts).map(f => {
    object(f, 'fact', ['text', 'kind', 'evidence', 'sourceSeqs'])
    if (!['decision', 'result', 'failure', 'blocker', 'plan', 'correction'].includes(f.kind)) fail('INVALID', 'Unknown fact kind')
    if (!['observed', 'user_reported', 'inferred', 'planned'].includes(f.evidence)) fail('INVALID', 'Unknown evidence kind')
    const seqs = array(f.sourceSeqs, 'sourceSeqs', 12)
    if (!seqs.length || seqs.some(n => !Number.isSafeInteger(n) || n < input.fromSeq || n > input.toSeq)) fail('SOURCE', 'Fact source sequence is outside the captured range')
    // A sparse/capped source buffer cannot support citations to omitted events.
    if (input.sourceSeqs && seqs.some(n => !input.sourceSeqs.includes(n))) fail('SOURCE', 'Fact cites an event not supplied to the model')
    return { text: text(f.text, 'fact.text', 1600), kind: f.kind, evidence: f.evidence, sourceSeqs: [...new Set(seqs)] }
  })
  if (!out.facts.length) fail('INVALID', 'Meaningful captures require sourced facts')
  return out
}
export function validatePlan(raw) {
  object(raw, 'plan', ['topics', 'documents', 'relations', 'note'])
  const topics = array(raw.topics, 'topics', LIMITS.topics).map(t => {
    object(t, 'topic', ['id', 'title', 'aliases', 'scope', 'body', 'expectedRevision'])
    return { id: id(t.id), title: text(t.title, 'topic.title', 180), aliases: array(t.aliases, 'aliases', 12).map(a => text(a, 'alias', 120)), scope: text(t.scope, 'scope', 1200), body: text(t.body, 'topic.body'), expectedRevision: revision(t.expectedRevision) }
  })
  const documents = array(raw.documents, 'documents', LIMITS.documents).map(d => {
    object(d, 'document', ['topicId', 'path', 'title', 'body', 'expectedRevision'])
    return { topicId: id(d.topicId), path: documentPath(d.path), title: text(d.title, 'document.title', 180), body: text(d.body, 'document.body'), expectedRevision: revision(d.expectedRevision) }
  })
  const relations = array(raw.relations, 'relations', LIMITS.relations).map(r => {
    object(r, 'relation', ['from', 'to', 'type', 'reason'])
    if (!['part_of', 'depends_on', 'uses', 'related_to'].includes(r.type)) fail('INVALID', 'Unknown relationship type')
    if (r.from === r.to) fail('INVALID', 'A topic cannot relate to itself')
    return { from: id(r.from), to: id(r.to), type: r.type, reason: text(r.reason, 'relation.reason', 1200) }
  })
  if (new Set(topics.map(t => t.id)).size !== topics.length || new Set(documents.map(d => `${d.topicId}/${d.path}`)).size !== documents.length) fail('INVALID', 'Duplicate plan targets')
  return { topics, documents, relations, note: text(raw.note, 'note', 3000, true) }
}
export function encode(metadata, body) {
  return `<!-- ctxkit ${JSON.stringify({ ...metadata, schema: SCHEMA })} -->\n\n${body.trim()}\n`
}
export function decode(raw, path) {
  const match = raw.match(/^<!-- ctxkit (\{[^\n]*\}) -->\n/)
  if (!match) fail('UNMANAGED', `${path}: not a CtxKit-managed Markdown file`)
  let metadata
  try { metadata = JSON.parse(match[1]) } catch { fail('INVALID', `${path}: invalid metadata`) }
  if (metadata.schema !== SCHEMA) fail('SCHEMA', `${path}: unsupported schema`)
  return { path, revision: hash(raw), metadata, body: raw.slice(match[0].length).trim() }
}
export function redact(value) {
  return String(value)
    .replace(/-----BEGIN [^-\n]*PRIVATE KEY-----[\s\S]*?-----END [^-\n]*PRIVATE KEY-----/g, '[REDACTED PRIVATE KEY]')
    .replace(/\b(?:sk-|sk_|ghp_|github_pat_|xox[baprs]-)[A-Za-z0-9_-]{12,}/g, '[REDACTED TOKEN]')
    .replace(/(\b(?:api[_-]?key|access[_-]?token|authorization|password|secret|cookie)\b\s*[=:]\s*)(?:"[^"\n]*"|'[^'\n]*'|[^\s,;]+)/gi, '$1[REDACTED]')
    .replace(/\bBearer\s+[A-Za-z0-9._~+\/-]+=*/gi, 'Bearer [REDACTED]')
}
export function safeError(error) {
  return `${error?.code || 'ERROR'}: ${redact(error?.message || String(error)).slice(0, 400)}`
}
