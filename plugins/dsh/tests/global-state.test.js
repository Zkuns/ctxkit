import test from 'node:test'
import assert from 'node:assert/strict'
import * as fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { decode, encode, hash, validateCapture } from '../contracts.js'
import { GLOBAL_STATE_PATH, globalStateChange, readGlobalState, validateGlobalChanges } from '../global-state.js'
import { PREFERENCES_PATH } from '../preferences.js'
import { Vault } from '../vault.js'

// Fictional in-memory fixtures; the CAS test uses only a newly created temporary vault.
const source = 'sessions/session_fictional/checkpoints/cp_first.md'
const laterSource = 'sessions/session_fictional/checkpoints/cp_second.md'
const at = number => `2026-01-01T00:00:${String(number).padStart(2, '0')}.000Z`
const options = (number = 1, extra = {}) => ({ source, observedAt: at(number), updatedAt: at(number), ...extra })
const fact = (extra = {}) => ({ text: 'The fictional Atlas service uses a staging queue.', kind: 'result', evidence: 'observed', sourceSeqs: [4], ...extra })
const facts = [fact()]
const raw = (extra = {}) => ({ id: 'global_atlas_queue', action: 'set', text: 'Atlas uses a staging queue.', category: 'fact', factIndexes: [0], ...extra })
const op = (extra = {}) => ({ id: 'global_atlas_queue', action: 'set', text: 'Atlas uses a staging queue.', category: 'fact', sourceSeqs: [4], evidence: ['observed'], ...extra })
const remove = (extra = {}) => ({ id: op().id, action: 'remove', sourceSeqs: [4], evidence: ['observed'], ...extra })
const validate = (value = raw(), supporting = facts) => validateGlobalChanges([value], supporting)
const saved = change => decode(encode(change.metadata, change.body), change.path)
const initial = () => saved(globalStateChange(null, validate(), options()))
const invalid = callback => assert.throws(callback, error => ['INVALID', 'SOURCE', 'PATH', 'SCHEMA', 'TOO_LARGE'].includes(error.code))

test('operations derive source union and every evidence label from validated current facts', () => {
  const capture = validateCapture({ meaningful: true, title: 'Atlas queue', summary: 'Queue evidence.', next: '', topicHints: [], facts: [
    fact({ sourceSeqs: [4, 5], evidence: 'observed' }),
    fact({ sourceSeqs: [5, 6], evidence: 'inferred' }),
    fact({ kind: 'plan', sourceSeqs: [7], evidence: 'planned' }),
    fact({ sourceSeqs: [8], evidence: 'user_reported' }),
    fact({ sourceSeqs: [4], evidence: 'observed' }),
  ] }, { fromSeq: 4, toSeq: 8, sourceSeqs: [4, 5, 6, 7, 8] })
  const before = structuredClone(capture.facts)
  const changes = validate(raw({ factIndexes: [0, 1, 2, 3, 4] }), capture.facts)
  assert.deepEqual(changes, [op({ sourceSeqs: [4, 5, 6, 7, 8], evidence: ['observed', 'inferred', 'planned', 'user_reported'] })])
  assert.equal(Object.hasOwn(changes[0], 'factIndexes'), false)
  assert.deepEqual(capture.facts, before)
  assert.deepEqual(validateGlobalChanges(), [])
  assert.deepEqual(validate(), [op()])
})

test('missing, duplicate, out-of-range or noninteger references and unsupported evidence fail closed', () => {
  for (const factIndexes of [undefined, null, [], [0, 0], [-1], [1], [0.5], ['0'], [Number.MAX_SAFE_INTEGER + 1], Array(9).fill(0)]) invalid(() => validate(raw({ factIndexes })))
  invalid(() => validate(raw(), []))
  invalid(() => validate(raw(), [null]))
  invalid(() => validate(raw(), [fact({ evidence: 'verified' })]))
  invalid(() => validate(raw(), [fact({ evidence: undefined })]))
  invalid(() => validate(raw(), [fact({ evidence: ['observed'] })]))
  invalid(() => validate(raw(), [fact({ sourceSeqs: [] })]))
  invalid(() => validate(raw(), [fact({ sourceSeqs: [4, 4] })]))
  invalid(() => validate(raw(), [fact({ sourceSeqs: [-1] })]))
  invalid(() => validate(raw(), [fact({ sourceSeqs: [4.5] })]))
  invalid(() => validate(raw(), [fact({ sourceSeqs: ['4'] })]))
  invalid(() => validate(raw(), [fact({ sourceSeqs: [Number.MAX_SAFE_INTEGER + 1] })]))
  invalid(() => validate(raw(), [fact({ sourceSeqs: undefined })]))
  invalid(() => validate(raw(), [fact({ unsupported: true })]))
  invalid(() => validateGlobalChanges([], Array.from({ length: 25 }, () => fact())))
})

test('eight referenced facts and source union are bounded without silent truncation', () => {
  const supporting = Array.from({ length: 8 }, (_, i) => fact({ sourceSeqs: Array.from({ length: 8 }, (_, j) => 8 * i + j) }))
  const value = raw({ factIndexes: supporting.map((_, i) => i) })
  assert.equal(validate(value, supporting)[0].sourceSeqs.length, 64)
  supporting[7].sourceSeqs.push(64)
  invalid(() => validate(value, supporting))
  invalid(() => validate(raw(), [fact({ sourceSeqs: Array.from({ length: 13 }, (_, i) => i) })]))
})

test('strict operation fields, set/remove shapes, categories and six unique IDs', () => {
  for (const value of [raw({ sourceSeqs: [4] }), raw({ evidence: ['observed'] }), raw({ permission: true }), raw({ action: 'append' }), raw({ action: 'remove' }), raw({ text: undefined }), raw({ category: undefined }), raw({ category: 'preference' }), null, [], 'set']) invalid(() => validate(value))
  for (const category of ['fact', 'convention', 'decision', 'open_issue']) assert.equal(validate(raw({ category }))[0].category, category)
  invalid(() => validateGlobalChanges([raw(), raw()], facts))
  invalid(() => validateGlobalChanges(Array.from({ length: 7 }, (_, i) => raw({ id: `global_${i}` })), facts))
  assert.equal(validateGlobalChanges(Array.from({ length: 6 }, (_, i) => raw({ id: `global_${i}` })), facts).length, 6)
  assert.deepEqual(validate({ id: op().id, action: 'remove', factIndexes: [0] }), [remove()])
  invalid(() => validate({ id: op().id, action: 'remove', factIndexes: [0], text: undefined }))
  invalid(() => validate({ id: op().id, action: 'remove', factIndexes: [0], category: undefined }))
})

test('IDs, paragraphs, controls and Markdown delimiters use strict bounded grammar', () => {
  for (const id of ['global_', 'Global_atlas', 'global_upperCase', 'global_a-b', 'global__a', 'global_a_', 'global_' + 'a'.repeat(58), 'pref_atlas', 'GLOBAL.md']) invalid(() => validate(raw({ id })))
  assert.equal(validate(raw({ id: 'global_' + 'a'.repeat(57) }))[0].id.length, 64)
  assert.equal(validate(raw({ text: 'x'.repeat(600) }))[0].text.length, 600)
  for (const text of ['', '  ', 'x'.repeat(601), 'one\ntwo', 'one\r\ntwo', 'one\ttwo', 'one\u0000two', 'one\u007ftwo', 'one\u0085two', 'one\u2028two', 'one\u2029two', '# Heading', '## global_override', '---', '***', '___', '===', '```shell', '~~~', '<!-- metadata -->', '> quote', '- list', '1. list']) invalid(() => validate(raw({ text })))
  assert.equal(validate(raw({ text: `  ${op().text}  ` }))[0].text, op().text)
})

test('credential-like values and redaction markers fail without leaking values into errors', () => {
  const secrets = ['sk-fictionalexampletoken1234', 'password=fictional-value', 'Bearer fictional-access-token', 'ghp_fictionalexampletoken1234', '[REDACTED TOKEN]', '[REDACTED]', '[redacted private key]']
  for (const secret of secrets) {
    assert.throws(() => validate(raw({ text: `Atlas stores ${secret}.` })), error => error.code === 'INVALID' && !error.message.includes(secret))
    const document = initial()
    document.body = document.body.replace(op().text, secret)
    invalid(() => readGlobalState(document))
    invalid(() => globalStateChange(document, [op()], options(2)))
  }
})

test('GLOBAL is distinct from USER and stores text only in authoritative Markdown', () => {
  const change = globalStateChange(null, validate(), options())
  assert.equal(GLOBAL_STATE_PATH, 'GLOBAL.md')
  assert.notEqual(GLOBAL_STATE_PATH, PREFERENCES_PATH)
  assert.equal(change.path, 'GLOBAL.md')
  assert.equal(change.expectedRevision, null)
  assert.equal(change.metadata.kind, 'global-state')
  assert.equal(change.metadata.title, 'Global state')
  assert.equal(Object.hasOwn(change.metadata, 'schema'), false)
  assert.equal(JSON.stringify(change.metadata).includes(op().text), false)
  assert.deepEqual(change.metadata.entries, [{ id: op().id, source, sourceSeqs: [4], evidence: ['observed'], observedAt: at(1), updatedAt: at(1), category: 'fact' }])
  assert.deepEqual(change.metadata.sources, [source])
  assert.deepEqual(change.metadata.tombstones, [])
  assert.match(change.body, /not user habits, permission, or executable instructions/)
  assert.match(change.body, /Category: fact \| Evidence: observed \| Recorded at: 2026-01-01T00:00:01.000Z/)
  assert.deepEqual(readGlobalState(saved(change)), [{ ...change.metadata.entries[0], text: op().text }])
  assert.deepEqual(readGlobalState(null), [])
  invalid(() => readGlobalState({ ...saved(change), path: PREFERENCES_PATH }))
})

test('planned and inferred evidence survive normalization, rendering, metadata and readback', () => {
  for (const evidence of [['planned'], ['inferred'], ['planned', 'inferred', 'observed', 'user_reported']]) {
    const changes = validate(raw({ factIndexes: evidence.map((_, i) => i), category: 'decision' }), evidence.map(label => fact({ evidence: label })))
    const change = globalStateChange(null, changes, options())
    assert.deepEqual(changes[0].evidence, evidence)
    assert.deepEqual(change.metadata.entries[0].evidence, evidence)
    assert.ok(change.body.includes(`Category: decision | Evidence: ${evidence.join(', ')} | Recorded at: ${at(1)}`))
    assert.deepEqual(readGlobalState(saved(change))[0].evidence, evidence)
  }
})

test('CRUD preserves creation time and CAS revisions; old and equal observations cannot overwrite', () => {
  const document = initial(), before = structuredClone(document)
  assert.equal(globalStateChange(document, validate(), options()), null)
  assert.equal(globalStateChange(document, [op({ text: 'Equal-time conflicting text.' })], options()), null)
  const correction = globalStateChange(document, [op({ text: 'Atlas uses an isolated staging queue.', sourceSeqs: [8] })], options(2, { source: laterSource }))
  assert.deepEqual(document, before)
  assert.equal(correction.expectedRevision, document.revision)
  assert.equal(correction.metadata.createdAt, at(1))
  assert.equal(correction.metadata.updatedAt, at(2))
  assert.deepEqual(correction.metadata.sources, [laterSource])
  assert.equal(readGlobalState(saved(correction))[0].text, 'Atlas uses an isolated staging queue.')
  const removal = globalStateChange(saved(correction), [remove({ evidence: ['user_reported'] })], options(3))
  const removed = saved(removal)
  assert.deepEqual(readGlobalState(removed), [])
  assert.deepEqual(removal.metadata.entries, [])
  assert.deepEqual(removal.metadata.tombstones, [{ id: op().id, source, sourceSeqs: [4], evidence: ['user_reported'], observedAt: at(3), updatedAt: at(3) }])
  assert.equal(removal.body.includes(op().id), false)
  assert.equal(JSON.stringify(removal.metadata.tombstones).includes('category'), false)
  assert.equal(JSON.stringify(removal.metadata.tombstones).includes('text'), false)
  assert.equal(globalStateChange(removed, [remove()], options(3)), null)
  assert.equal(globalStateChange(removed, [op()], options(2)), null)
  assert.equal(globalStateChange(removed, [op()], options(3)), null)
  const restored = saved(globalStateChange(removed, [op()], options(4)))
  assert.equal(restored.metadata.tombstones.length, 0)
  assert.equal(readGlobalState(restored).length, 1)
  assert.equal(globalStateChange(restored, [remove()], options(3)), null)
})

test('unknown-ID removals create provenance-only tombstones blocking delayed resurrection', () => {
  const removal = globalStateChange(null, [remove({ id: 'global_absent', evidence: ['inferred', 'planned'] })], options(3))
  assert.deepEqual(readGlobalState(saved(removal)), [])
  assert.equal(removal.metadata.tombstones[0].id, 'global_absent')
  assert.deepEqual(removal.metadata.tombstones[0].evidence, ['inferred', 'planned'])
  assert.equal(Object.hasOwn(removal.metadata.tombstones[0], 'text'), false)
  assert.equal(Object.hasOwn(removal.metadata.tombstones[0], 'category'), false)
  assert.equal(globalStateChange(saved(removal), [op({ id: 'global_absent' })], options(2)), null)
})

test('same-content confirmations advance provenance and visible recording time, not content time', () => {
  const document = saved(globalStateChange(null, [op({ evidence: ['planned', 'inferred'] })], options()))
  const confirmation = globalStateChange(document, [op({ sourceSeqs: [8, 9], evidence: ['inferred', 'planned'] })], options(3, { source: laterSource, updatedAt: at(5) }))
  assert.notEqual(confirmation.body, document.body)
  assert.ok(confirmation.body.includes(`Evidence: inferred, planned | Recorded at: ${at(3)}`))
  const entry = readGlobalState(saved(confirmation))[0]
  assert.equal(entry.updatedAt, at(1))
  assert.equal(entry.observedAt, at(3))
  assert.equal(entry.source, laterSource)
  assert.deepEqual(entry.sourceSeqs, [8, 9])
  assert.deepEqual(entry.evidence, ['inferred', 'planned'])
  assert.equal(confirmation.metadata.createdAt, at(1))
  assert.equal(confirmation.metadata.updatedAt, at(5))
  const confirmed = saved(confirmation)
  assert.equal(globalStateChange(confirmed, [op({ text: 'Intervening stale correction.' })], options(2)), null)
  assert.equal(globalStateChange(confirmed, [remove()], options(2)), null)
  assert.equal(globalStateChange(confirmed, [op()], options(3)), null)
  const recategorized = saved(globalStateChange(confirmed, [op({ category: 'convention' })], options(4)))
  assert.equal(readGlobalState(recategorized)[0].updatedAt, at(4))
})

test('evidence changes update content time even when text and category stay identical', () => {
  const planned = saved(globalStateChange(null, [op({ evidence: ['planned'] })], options()))
  const observed = saved(globalStateChange(planned, [op()], options(2, { updatedAt: at(3) })))
  const entry = readGlobalState(observed)[0]
  assert.equal(entry.text, op().text)
  assert.equal(entry.category, op().category)
  assert.deepEqual(entry.evidence, ['observed'])
  assert.equal(entry.updatedAt, at(3))
  assert.equal(entry.observedAt, at(2))
  assert.ok(observed.body.includes(`Evidence: observed | Recorded at: ${at(2)}`))
  const mixed = saved(globalStateChange(observed, [op({ evidence: ['observed', 'user_reported'] })], options(4)))
  assert.equal(readGlobalState(mixed)[0].updatedAt, at(4))
  const narrowed = saved(globalStateChange(mixed, [op({ evidence: ['user_reported'] })], options(5)))
  assert.equal(readGlobalState(narrowed)[0].updatedAt, at(5))
})

test('safe manual text and section order survive unrelated updates and determine CAS revision', () => {
  const original = initial()
  const manual = saved({ ...original, body: original.body.replace(op().text, 'Atlas uses a manually reviewed staging queue.') })
  assert.notEqual(manual.revision, original.revision)
  assert.equal(readGlobalState(manual)[0].text, 'Atlas uses a manually reviewed staging queue.')
  const second = globalStateChange(manual, [op({ id: 'global_next', text: 'Atlas plans queue monitoring.', evidence: ['planned'] })], options(3, { source: laterSource }))
  assert.equal(second.expectedRevision, manual.revision)
  assert.deepEqual(second.metadata.entries[0], original.metadata.entries[0])
  assert.equal(second.metadata.createdAt, at(1))
  assert.equal(readGlobalState(saved(second))[0].text, 'Atlas uses a manually reviewed staging queue.')
  assert.deepEqual(second.metadata.sources, [source, laterSource].sort())
  const [intro, first, last] = second.body.split('\n\n## ')
  const reordered = saved({ ...second, body: `${intro}\n\n## ${last}\n\n## ${first}` })
  assert.deepEqual(readGlobalState(reordered).map(entry => entry.id), ['global_next', op().id])
  const third = saved(globalStateChange(reordered, [op({ id: 'global_other', text: 'Atlas uses fictional fixtures.' })], options(4)))
  assert.deepEqual(readGlobalState(third).map(entry => entry.id), ['global_next', op().id, 'global_other'])
  assert.equal(readGlobalState(third)[1].text, 'Atlas uses a manually reviewed staging queue.')
  const bytes = encode(manual.metadata, manual.body)
  assert.equal(globalStateChange(manual, [op()], options()), null)
  assert.equal(encode(manual.metadata, manual.body), bytes)
  assert.equal(manual.revision, hash(bytes))
})

test('ordering uses each ID and durable observation time, never retry updatedAt', () => {
  const document = saved(globalStateChange(initial(), [op({ id: 'global_other', text: 'Atlas next state.' })], options(5)))
  const change = globalStateChange(document, [op({ text: 'Atlas earlier state.' }), op({ id: 'global_other', text: 'Stale next state.' })], options(3, { updatedAt: at(9) }))
  const entries = readGlobalState(saved(change))
  assert.equal(entries[0].text, 'Atlas earlier state.')
  assert.equal(entries[1].text, 'Atlas next state.')
  assert.equal(entries[1].observedAt, at(5))
  assert.equal(entries[1].updatedAt, at(5))
  assert.equal(globalStateChange(document, [op({ id: 'global_other', text: 'Stale retry.' })], options(4, { updatedAt: at(59) })), null)
})

test('malformed managed files and contradictory visible annotations fail closed', () => {
  const mutations = [
    d => { d.path = 'AGENTS.md' }, d => { d.path = 'topics/topic_one/GLOBAL.md' },
    d => { d.revision = null }, d => { d.revision = 'forged' }, d => { d.metadata.schema = 2 },
    d => { delete d.metadata.schema }, d => { d.metadata.kind = 'user-preferences' }, d => { d.metadata.title = 'Wrong title' },
    d => { d.metadata.body = d.body }, d => { d.metadata.entries[0].text = 'Duplicate content' },
    d => { d.metadata.entries.push({ ...d.metadata.entries[0] }) },
    d => { d.metadata.tombstones.push({ ...d.metadata.entries[0] }) },
    d => { delete d.metadata.entries[0].sourceSeqs }, d => { d.metadata.entries[0].source = 'AGENTS.md' },
    d => { d.metadata.entries[0].evidence = ['observed', 'observed'] },
    d => { d.metadata.entries[0].evidence = ['verified'] }, d => { d.metadata.entries[0].evidence = [] },
    d => { d.metadata.entries[0].category = 'habit' },
    d => { d.metadata.sources = [] }, d => { d.metadata.sources.push(source) },
    d => { d.metadata.sources.push(laterSource) }, d => { d.metadata.createdAt = 'yesterday' },
    d => { d.metadata.updatedAt = '2026-02-30T00:00:00.000Z' },
    d => { d.body = '# My own notes\n\nKeep these.' }, d => { d.body += '\n\nManual appendix' },
    d => { d.body += d.body.slice(d.body.indexOf('\n\n## ')) },
    d => { d.body = d.body.replace('## global_atlas_queue', '## global_unknown') },
    d => { d.body = d.body.replace(op().text, 'x'.repeat(601)) },
    d => { d.body = d.body.replace(op().text, 'First paragraph.\n\nSecond paragraph.') },
    d => { d.body = d.body.replace(op().text, 'Leading/trailing whitespace. ') },
    d => { d.body = d.body.replace('Category: fact', 'Category: decision') },
    d => { d.body = d.body.replace('Evidence: observed', 'Evidence: planned') },
    d => { d.body = d.body.replace(`Recorded at: ${at(1)}`, `Recorded at: ${at(2)}`) },
    d => { d.metadata.entries[0].evidence = ['planned'] },
    d => { d.body = d.body.replace('Category: fact | Evidence: observed | Recorded at: ' + at(1) + '\n\n', '') },
    d => { d.body += 'x'.repeat(32001) },
  ]
  for (const mutate of mutations) {
    const document = initial(); mutate(document)
    const before = structuredClone(document)
    invalid(() => readGlobalState(document))
    invalid(() => globalStateChange(document, [op({ text: 'New Atlas state.' })], options(2)))
    assert.deepEqual(document, before)
  }
  const removed = saved(globalStateChange(initial(), [remove()], options(2)))
  for (const field of ['text', 'category']) {
    const corrupted = structuredClone(removed)
    corrupted.metadata.tombstones[0][field] = 'forbidden'
    invalid(() => readGlobalState(corrupted))
  }
})

test('bounds never evict active entries, tombstones or provenance; final-state replacements work', () => {
  let document = null
  for (let i = 0; i < 32; i++) document = saved(globalStateChange(document, [op({ id: `global_${i}`, text: 'x'.repeat(600) })], options(1, { source: `sessions/session_fictional/checkpoints/cp_${i}.md` })))
  assert.equal(readGlobalState(document).length, 32)
  assert.equal(document.metadata.sources.length, 32)
  invalid(() => globalStateChange(document, [op({ id: 'global_overflow' })], options(2)))
  const before = structuredClone(document)
  document = saved(globalStateChange(document, [op({ id: 'global_replacement' }), remove({ id: 'global_0' })], options(2)))
  assert.equal(readGlobalState(document).length, 32)
  assert.equal(before.metadata.entries.length, 32)
  for (let i = 1; i < 64; i++) document = saved(globalStateChange(document, [remove({ id: `global_absent_${i}` })], options(3, { source: `sessions/session_fictional/checkpoints/cp_absent_${i}.md` })))
  assert.equal(document.metadata.tombstones.length, 64)
  assert.equal(document.metadata.sources.length, 95)
  document = saved(globalStateChange(document, [remove({ id: 'global_0' })], options(4, { source: 'sessions/session_fictional/checkpoints/cp_remove_zero.md' })))
  assert.equal(document.metadata.sources.length, 96)
  invalid(() => globalStateChange(document, [remove({ id: 'global_absent_overflow' })], options(4)))
  assert.equal(globalStateChange(document, [op({ id: 'global_0' })], options(1)), null)
  const tooMany = structuredClone(document)
  tooMany.metadata.tombstones.push({ ...tooMany.metadata.tombstones[0], id: 'global_more' })
  invalid(() => readGlobalState(tooMany))
  const tooManyActive = structuredClone(document)
  tooManyActive.metadata.entries.push({ ...tooManyActive.metadata.entries[0], id: 'global_more' })
  invalid(() => readGlobalState(tooManyActive))
})

test('builder revalidates normalized operations, sources and UTC timestamps', () => {
  for (const source of ['AGENTS.md', '../checkpoint.md', '/sessions/session_one/checkpoints/cp_one.md', 'sessions/session_one/SESSION.md', 'sessions/session_one/checkpoints/../cp_one.md', 'sessions/session_one/checkpoints/cp_one.md#section']) invalid(() => globalStateChange(null, [op()], options(1, { source })))
  for (const timestamp of ['invalid', '2026-02-30T00:00:00.000Z', '2026-01-01', '2026-01-01T00:00:00', 123]) {
    invalid(() => globalStateChange(null, [op()], options(1, { observedAt: timestamp })))
    invalid(() => globalStateChange(null, [op()], options(1, { updatedAt: timestamp })))
  }
  for (const value of [raw(), op({ text: 'password=fictional-value' }), op({ sourceSeqs: undefined }), op({ sourceSeqs: [] }), op({ sourceSeqs: [4, 4] }), op({ evidence: [] }), op({ evidence: ['verified'] }), op({ evidence: ['inferred', 'inferred'] }), op({ sourceSeqs: Array.from({ length: 65 }, (_, i) => i) })]) invalid(() => globalStateChange(null, [value], options()))
  invalid(() => globalStateChange(null, [op(), op()], options()))
  invalid(() => globalStateChange(null, Array.from({ length: 7 }, (_, i) => op({ id: `global_${i}` })), options()))
  assert.equal(globalStateChange(null, [], options()), null)
  assert.equal(globalStateChange(initial(), [], options(2)), null)
})

test('canonical encode/decode and no-op writes remain byte stable', () => {
  const change = globalStateChange(null, [op({ evidence: ['planned', 'inferred'], category: 'open_issue' })], options())
  const bytes = encode(change.metadata, change.body)
  const decoded = decode(bytes, GLOBAL_STATE_PATH)
  assert.equal(encode(decoded.metadata, decoded.body), bytes)
  assert.equal(globalStateChange(decoded, [op()], options()), null)
  const next = globalStateChange(decoded, [op({ id: 'global_other', evidence: ['user_reported'] })], options(2))
  const nextBytes = encode(next.metadata, next.body)
  const nextDecoded = decode(nextBytes, GLOBAL_STATE_PATH)
  assert.equal(encode(nextDecoded.metadata, nextDecoded.body), nextBytes)
  assert.equal(readGlobalState(nextDecoded).length, 2)
})

test('standard vault CAS rejects stale global changes without overwriting manual content or USER', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ctxkit-fictional-global-'))
  t.after(() => fs.rm(root, { recursive: true, force: true }))
  const vault = new Vault({ root, authorize: async () => {} })
  await vault.commit([globalStateChange(null, [op()], options())], {})
  const original = await vault.read(GLOBAL_STATE_PATH)
  const stale = globalStateChange(original, [op({ text: 'Stale Atlas correction.' })], options(3))
  const manualText = encode(original.metadata, original.body.replace(op().text, 'Atlas uses a manually reviewed queue.'))
  await fs.writeFile(path.join(root, GLOBAL_STATE_PATH), manualText)
  await fs.writeFile(path.join(root, PREFERENCES_PATH), 'Fictional independent user habits.\n')
  await assert.rejects(() => vault.commit([stale], {}), error => error.code === 'CONFLICT')
  assert.equal(await fs.readFile(path.join(root, GLOBAL_STATE_PATH), 'utf8'), manualText)
  assert.equal(await fs.readFile(path.join(root, PREFERENCES_PATH), 'utf8'), 'Fictional independent user habits.\n')
  const current = await vault.read(GLOBAL_STATE_PATH)
  const fresh = globalStateChange(current, [op({ id: 'global_new', text: 'Atlas plans a migration.', evidence: ['planned'] })], options(4))
  await vault.commit([fresh], {})
  const entries = readGlobalState(await vault.read(GLOBAL_STATE_PATH))
  assert.equal(entries[0].text, 'Atlas uses a manually reviewed queue.')
  assert.equal(entries[1].evidence[0], 'planned')
})
