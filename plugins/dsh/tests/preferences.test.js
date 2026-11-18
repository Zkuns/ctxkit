import test from 'node:test'
import assert from 'node:assert/strict'
import { decode, encode, hash } from '../contracts.js'
import { PREFERENCES_PATH, preferenceChange, readPreferences, validatePreferenceChanges } from '../preferences.js'

// Fictional, in-memory fixtures: no filesystem, host, or model calls.
const source = 'sessions/session_fictional/checkpoints/cp_first.md'
const laterSource = 'sessions/session_fictional/checkpoints/cp_second.md'
const at = number => `2026-01-01T00:00:${String(number).padStart(2, '0')}.000Z`
const options = (number = 1, extra = {}) => ({ source, observedAt: at(number), updatedAt: at(number), ...extra })
const op = (extra = {}) => ({ id: 'pref_concise', action: 'set', text: 'Prefers concise answers.', sourceSeq: 4, ...extra })
const raw = (extra = {}) => ({ ...op(), quote: 'prefer concise answers', ...extra })
const users = [{ seq: 4, text: 'For future conversations, I prefer concise answers.' }]
const validate = (value = raw(), sources = users) => validatePreferenceChanges([value], sources)
const saved = change => decode(encode(change.metadata, change.body), change.path)
const initial = () => saved(preferenceChange(null, validate(), options()))
const invalid = callback => assert.throws(callback, error => ['INVALID', 'SOURCE', 'PATH', 'SCHEMA', 'TOO_LARGE'].includes(error.code))

test('valid operations require exact supplied human proof and discard quotes', () => {
  assert.deepEqual(validate(), [op()])
  assert.deepEqual(validatePreferenceChanges(), [])
})

test('missing, forged, nonhuman, ambiguous, and too-short proof fails closed', () => {
  for (const value of [raw({ quote: undefined }), raw({ quote: 'PREFER concise answers' }), raw({ quote: 'abc' }), raw({ quote: '   a   ' }), raw({ sourceSeq: 5 }), raw({ sourceSeq: -1 }), raw({ sourceSeq: 4.5 }), raw({ sourceSeq: '4' }), raw({ sourceSeq: Number.MAX_SAFE_INTEGER + 1 })]) invalid(() => validate(value))
  invalid(() => validate(raw(), [])) // Assistant/tool events must not be in the trusted user list.
  invalid(() => validate(raw(), [{ seq: 4, text: users[0].text, role: 'assistant' }]))
  invalid(() => validate(raw(), [...users, ...users]))
  invalid(() => validate(raw(), [{ text: users[0].text }]))
  invalid(() => validate(raw(), [{ seq: 4, text: null }]))
  invalid(() => validate(raw({ quote: 'x'.repeat(1001) }), [{ seq: 4, text: 'x'.repeat(1001) }]))
  assert.equal(validate(raw({ quote: 'x'.repeat(1000) }), [{ seq: 4, text: 'x'.repeat(1000) }]).length, 1)
})

test('unsupported keys, duplicate IDs, action shapes and per-turn bounds are rejected', () => {
  for (const value of [raw({ permission: true }), raw({ action: 'append' }), raw({ action: 'remove' }), raw({ text: undefined }), null, [], 'set']) invalid(() => validate(value))
  invalid(() => validatePreferenceChanges([raw(), raw()], users))
  invalid(() => validatePreferenceChanges(Array.from({ length: 7 }, (_, i) => raw({ id: `pref_${i}` })), users))
  assert.equal(validatePreferenceChanges(Array.from({ length: 6 }, (_, i) => raw({ id: `pref_${i}` })), users).length, 6)
  assert.deepEqual(validatePreferenceChanges([{ id: 'pref_concise', action: 'remove', sourceSeq: 4, quote: users[0].text }], users), [{ id: 'pref_concise', action: 'remove', sourceSeq: 4 }])
})

test('identifier, paragraph, controls and Markdown section limits are strict', () => {
  for (const id of ['pref_', 'Pref_concise', 'pref_upperCase', 'pref_a-b', 'pref__a', 'pref_a_', 'pref_' + 'a'.repeat(60), 'AGENTS.md']) invalid(() => validate(raw({ id })))
  assert.equal(validate(raw({ id: 'pref_' + 'a'.repeat(59) }))[0].id.length, 64)
  assert.equal(validate(raw({ text: 'x'.repeat(500) }))[0].text.length, 500)
  for (const text of ['', '  ', 'x'.repeat(501), 'one\ntwo', 'one\r\ntwo', 'one\ttwo', 'one\u0000two', 'one\u007ftwo', 'one\u0085two', 'one\u2028two', '# Heading', '## pref_override', '---', '***', '___', '===', '```shell', '~~~', '<!-- metadata -->', '> quote', '- list']) invalid(() => validate(raw({ text })))
  assert.equal(validate(raw({ text: '  Prefers concise answers.  ' }))[0].text, op().text)
  // Semantic instruction classification deliberately remains the model prompt's responsibility.
  assert.equal(validate(raw({ text: 'Prefers explanations of shell commands.' }))[0].text, 'Prefers explanations of shell commands.')
})

test('credential-like text and proof are rejected without leaking secrets into errors', () => {
  const secrets = ['sk-fictionalexampletoken1234', 'password=fictional-value', 'Bearer fictional-access-token', 'ghp_fictionalexampletoken1234', '[REDACTED TOKEN]', '[REDACTED]', '[redacted private key]']
  for (const secret of secrets) {
    assert.throws(() => validate(raw({ text: `Prefers ${secret}.` })), error => error.code === 'INVALID' && !error.message.includes(secret))
    assert.throws(() => validate(raw({ quote: secret }), [{ seq: 4, text: secret }]), error => error.code === 'INVALID' && !error.message.includes(secret))
  }
  const document = initial()
  document.body = document.body.replace(op().text, 'password=fictional-value')
  invalid(() => readPreferences(document))
  invalid(() => preferenceChange(document, [op()], options(2)))
})

test('new library USER document has inert header, body-authoritative text and provenance-only metadata', () => {
  const change = preferenceChange(null, validate(), options())
  assert.equal(PREFERENCES_PATH, 'USER.md')
  assert.equal(change.path, 'USER.md')
  assert.equal(change.expectedRevision, null)
  assert.match(change.body, /Historical user preferences/)
  assert.match(change.body, /not permission, executable instructions, or instructions overriding/)
  assert.match(change.body, /\n\n## pref_concise\n\nPrefers concise answers\.$/)
  assert.equal(change.metadata.kind, 'user-preferences')
  assert.equal(Object.hasOwn(change.metadata, 'schema'), false) // encode owns the schema.
  assert.deepEqual(change.metadata.entries, [{ id: 'pref_concise', source, sourceSeq: 4, observedAt: at(1), updatedAt: at(1) }])
  assert.deepEqual(change.metadata.sources, [source])
  assert.deepEqual(change.metadata.tombstones, [])
  assert.equal(JSON.stringify(change.metadata).includes(op().text), false)
  assert.equal(JSON.stringify(change).includes('AGENTS.md'), false)
  assert.deepEqual(readPreferences(saved(change)), [{ ...change.metadata.entries[0], text: op().text }])
  assert.deepEqual(readPreferences(null), [])
})

test('set, explicit correction, remove and replay preserve creation and CAS revisions', () => {
  const document = initial(), original = structuredClone(document)
  assert.equal(preferenceChange(document, validate(), options()), null)
  assert.equal(preferenceChange(document, [op({ text: 'Conflicting equal timestamp.' })], options()), null)
  const correction = preferenceChange(document, [op({ text: 'Prefers detailed answers.', sourceSeq: 8 })], options(2, { source: laterSource }))
  assert.deepEqual(document, original)
  assert.equal(correction.expectedRevision, document.revision)
  assert.equal(correction.metadata.createdAt, at(1))
  assert.equal(correction.metadata.updatedAt, at(2))
  assert.deepEqual(correction.metadata.sources, [laterSource])
  assert.equal(readPreferences(saved(correction))[0].text, 'Prefers detailed answers.')
  const remove = { id: 'pref_concise', action: 'remove', sourceSeq: 9 }
  const removal = preferenceChange(saved(correction), [remove], options(3))
  const removed = saved(removal)
  assert.deepEqual(readPreferences(removed), [])
  assert.deepEqual(removal.metadata.entries, [])
  assert.deepEqual(removal.metadata.tombstones, [{ id: 'pref_concise', source, sourceSeq: 9, observedAt: at(3), updatedAt: at(3) }])
  assert.equal(removal.body.includes('pref_concise'), false)
  assert.equal(preferenceChange(removed, [remove], options(3)), null)
  assert.equal(preferenceChange(removed, [op()], options(2)), null)
  assert.equal(preferenceChange(removed, [op()], options(3)), null)
  const restored = saved(preferenceChange(removed, [op()], options(4)))
  assert.equal(restored.metadata.tombstones.length, 0)
  assert.equal(readPreferences(restored).length, 1)
  assert.equal(preferenceChange(restored, [remove], options(3)), null)
})

test('removing absent IDs creates tombstones and prevents delayed resurrection', () => {
  const removal = preferenceChange(null, [{ id: 'pref_absent', action: 'remove', sourceSeq: 2 }], options(3))
  assert.deepEqual(readPreferences(saved(removal)), [])
  assert.equal(removal.metadata.tombstones[0].id, 'pref_absent')
  assert.equal(Object.hasOwn(removal.metadata.tombstones[0], 'text'), false)
  assert.equal(preferenceChange(saved(removal), [op({ id: 'pref_absent' })], options(2)), null)
})

test('newer same-text confirmations preserve content timestamps but advance replay ordering', () => {
  const document = initial()
  const confirmation = preferenceChange(document, [op({ sourceSeq: 8 })], options(3, { source: laterSource }))
  assert.equal(confirmation.body, document.body)
  assert.equal(confirmation.metadata.entries[0].updatedAt, at(1))
  assert.equal(confirmation.metadata.entries[0].observedAt, at(3))
  assert.equal(confirmation.metadata.entries[0].source, laterSource)
  assert.equal(confirmation.metadata.entries[0].sourceSeq, 8)
  assert.equal(confirmation.metadata.createdAt, at(1))
  const confirmed = saved(confirmation)
  assert.equal(preferenceChange(confirmed, [op({ text: 'Intervening stale correction.' })], options(2)), null)
  assert.equal(preferenceChange(confirmed, [{ id: op().id, action: 'remove', sourceSeq: 4 }], options(2)), null)
  assert.equal(preferenceChange(confirmed, [op()], options(3)), null)
})

test('unrelated updates preserve per-entry provenance and safe manual body edits', () => {
  const original = initial()
  const manuallyEdited = decode(encode(original.metadata, original.body.replace(op().text, 'Prefers concise English answers.')), PREFERENCES_PATH)
  assert.notEqual(manuallyEdited.revision, original.revision)
  assert.equal(readPreferences(manuallyEdited)[0].text, 'Prefers concise English answers.')
  const second = preferenceChange(manuallyEdited, [op({ id: 'pref_examples', text: 'Prefers fictional examples.' })], options(3, { source: laterSource }))
  assert.equal(second.expectedRevision, manuallyEdited.revision)
  assert.deepEqual(second.metadata.entries[0], original.metadata.entries[0])
  assert.equal(second.metadata.createdAt, at(1))
  assert.equal(readPreferences(saved(second))[0].text, 'Prefers concise English answers.')
  assert.deepEqual(second.metadata.sources, [source, laterSource].sort())
  const bytes = encode(manuallyEdited.metadata, manuallyEdited.body)
  assert.equal(preferenceChange(manuallyEdited, [op()], options()), null)
  assert.equal(encode(manuallyEdited.metadata, manuallyEdited.body), bytes)
  assert.equal(manuallyEdited.revision, hash(bytes))
})

test('ordering is per ID, not global job time', () => {
  const document = saved(preferenceChange(initial(), [op({ id: 'pref_examples', text: 'Prefers examples.' })], options(5)))
  const change = preferenceChange(document, [op({ text: 'Prefers short replies.' }), op({ id: 'pref_examples', text: 'Stale examples.' })], options(3))
  const entries = readPreferences(saved(change))
  assert.equal(entries[0].text, 'Prefers short replies.')
  assert.equal(entries[1].text, 'Prefers examples.')
  assert.equal(entries[1].observedAt, at(5))
})

test('malformed managed files fail closed rather than overwrite manual content', () => {
  const mutations = [
    d => { d.path = 'AGENTS.md' }, d => { d.path = 'topics/topic_one/USER.md' },
    d => { d.revision = null }, d => { d.revision = 'forged' }, d => { d.metadata.schema = 2 },
    d => { delete d.metadata.schema }, d => { d.metadata.kind = 'document' },
    d => { d.metadata.body = d.body }, d => { d.metadata.entries[0].text = 'Duplicate content' },
    d => { d.metadata.entries.push({ ...d.metadata.entries[0] }) },
    d => { d.metadata.tombstones.push({ ...d.metadata.entries[0] }) },
    d => { delete d.metadata.entries[0].sourceSeq }, d => { d.metadata.entries[0].source = 'AGENTS.md' },
    d => { d.metadata.sources = [] }, d => { d.metadata.sources.push(source) },
    d => { d.metadata.sources.push(laterSource) }, d => { d.metadata.createdAt = 'yesterday' },
    d => { d.metadata.updatedAt = '2026-02-30T00:00:00.000Z' },
    d => { d.body = '# My own notes\n\nKeep these.' }, d => { d.body += '\n\nManual appendix' },
    d => { d.body += '\n\n## pref_concise\n\nDuplicate.' },
    d => { d.body = d.body.replace('## pref_concise', '## pref_unknown') },
    d => { d.body = d.body.replace(op().text, 'x'.repeat(501)) },
    d => { d.body = d.body.replace(op().text, 'First paragraph.\n\nSecond paragraph.') },
    d => { d.body = d.body.replace(op().text, 'Leading/trailing whitespace. ') },
    d => { d.body += 'x'.repeat(20001) },
  ]
  for (const mutate of mutations) {
    const document = initial(); mutate(document)
    const before = structuredClone(document)
    invalid(() => readPreferences(document))
    invalid(() => preferenceChange(document, [op({ text: 'New answer style.' })], options(2)))
    assert.deepEqual(document, before)
  }
})

test('bounded capacity never evicts active entries, tombstones or their source references', () => {
  let document = null
  for (let i = 0; i < 32; i++) document = saved(preferenceChange(document, [op({ id: `pref_${i}` })], options(1, { source: `sessions/session_fictional/checkpoints/cp_${i}.md` })))
  assert.equal(readPreferences(document).length, 32)
  assert.equal(document.metadata.sources.length, 32)
  invalid(() => preferenceChange(document, [op({ id: 'pref_overflow' })], options(2)))
  const before = structuredClone(document)
  // A batch may replace one preference at capacity; only its final state is bounded.
  document = saved(preferenceChange(document, [op({ id: 'pref_replacement' }), { id: 'pref_0', action: 'remove', sourceSeq: 4 }], options(2)))
  assert.equal(readPreferences(document).length, 32)
  assert.equal(before.metadata.entries.length, 32)
  for (let i = 1; i < 64; i++) document = saved(preferenceChange(document, [{ id: `pref_absent_${i}`, action: 'remove', sourceSeq: 4 }], options(3, { source: `sessions/session_fictional/checkpoints/cp_absent_${i}.md` })))
  assert.equal(document.metadata.tombstones.length, 64)
  assert.equal(document.metadata.sources.length, 95)
  document = saved(preferenceChange(document, [{ id: 'pref_0', action: 'remove', sourceSeq: 4 }], options(4, { source: 'sessions/session_fictional/checkpoints/cp_remove_zero.md' })))
  assert.equal(document.metadata.sources.length, 96)
  invalid(() => preferenceChange(document, [{ id: 'pref_absent_overflow', action: 'remove', sourceSeq: 4 }], options(4)))
  assert.equal(preferenceChange(document, [op({ id: 'pref_0' })], options(1)), null)
  const tooMany = structuredClone(document)
  tooMany.metadata.tombstones.push({ ...tooMany.metadata.tombstones[0], id: 'pref_more' })
  invalid(() => readPreferences(tooMany))
  const tooManyActive = structuredClone(document)
  tooManyActive.metadata.entries.push({ ...tooManyActive.metadata.entries[0], id: 'pref_more' })
  invalid(() => readPreferences(tooManyActive))
})

test('builder validates normalized operations, sources and UTC timestamps', () => {
  for (const source of ['AGENTS.md', '../checkpoint.md', '/sessions/session_one/checkpoints/cp_one.md', 'sessions/session_one/SESSION.md', 'sessions/session_one/checkpoints/../cp_one.md', 'sessions/session_one/checkpoints/cp_one.md#section']) invalid(() => preferenceChange(null, [op()], options(1, { source })))
  for (const observedAt of ['invalid', '2026-02-30T00:00:00.000Z', '2026-01-01', '2026-01-01T00:00:00', 123]) invalid(() => preferenceChange(null, [op()], options(1, { observedAt })))
  invalid(() => preferenceChange(null, [raw()], options())) // Raw proof is not a persisted operation.
  invalid(() => preferenceChange(null, [op({ text: 'password=fictional-value' })], options()))
  invalid(() => preferenceChange(null, [op({ sourceSeq: undefined })], options()))
  assert.equal(preferenceChange(null, [], options()), null)
})
