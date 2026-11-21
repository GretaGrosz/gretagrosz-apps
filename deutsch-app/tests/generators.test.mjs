import { test } from 'node:test'
import assert from 'node:assert/strict'
import { GENERATORS, rng } from '../src/generators/index.js'
import { nouns, verbs, datPl } from '../src/generators/lexicon.js'
import { nounPhrase, adjForm } from '../src/generators/grammar.js'
import { subClause, clauses } from '../src/generators/clauses.js'
import { normalize, isCorrect, bankTokens, joinTokens } from '../src/lib/check.js'

const N = (sg) => nouns.find((n) => n.sg === sg)

test('every generator produces 400 valid items', () => {
  const r = rng(42)
  for (const [name, g] of Object.entries(GENERATORS)) {
    for (let i = 0; i < 400; i++) {
      const it = g(r)
      const ctx = `${name}: ${JSON.stringify(it)}`
      assert.ok(it.id && it.t && it.r, ctx)
      const txt = JSON.stringify(it)
      assert.ok(!/undefined|null[a-z]|NaN|  /.test(txt.replace(/"y":\[[^\]]*\]/, '')), 'bad text ' + ctx)
      if (it.t === 'mc') {
        assert.ok(it.o.includes(it.a), 'answer in options ' + ctx)
        assert.equal(new Set(it.o).size, it.o.length, 'unique options ' + ctx)
      }
      if (it.t === 'order') assert.equal(normalize(it.chunks.join(' ')) + '.', normalize(it.a), 'chunks join ' + ctx)
      if (it.t === 'match') assert.ok(it.pairs.length >= 3 && new Set(it.pairs.map((p) => p[1])).size >= 2, ctx)
      if (it.t === 'gap') assert.ok([].concat(it.a).every(Boolean), ctx)
      if (it.t === 'komma') assert.ok(it.a.includes(','), ctx)
      if (it.y) assert.equal(new Set(it.y).size, it.y.length, 'unique reasons ' + ctx)
    }
  }
})

test('noun phrases (spot checks against a grammar book)', () => {
  assert.equal(nounPhrase({ det: 'der', noun: N('Staat'), kase: 'G' }).text, 'des Staates')
  assert.equal(nounPhrase({ det: 'ein', adj: 'neu', noun: N('Gesetz'), kase: 'N' }).text, 'ein neues Gesetz')
  assert.equal(nounPhrase({ det: 'kein', adj: 'groß', noun: N('Problem'), kase: 'A', plural: true }).text, 'keine großen Probleme')
  assert.equal(nounPhrase({ det: 'der', adj: 'verschieden', noun: N('Aspekt'), kase: 'N', plural: true }).text, 'die verschiedenen Aspekte')
  assert.equal(nounPhrase({ det: 'viele', noun: N('Mensch'), kase: 'D', plural: true }).text, 'vielen Menschen')
  assert.equal(nounPhrase({ det: 'der', noun: N('Kollege'), kase: 'D' }).text, 'dem Kollegen')
  assert.equal(nounPhrase({ det: 'der', noun: N('Herr'), kase: 'A' }).text, 'den Herrn')
  assert.equal(nounPhrase({ det: 'unser', adj: 'eigen', noun: N('Leben'), kase: 'A' }).text, 'unser eigenes Leben')
  assert.equal(nounPhrase({ det: 'mein', adj: 'gut', noun: N('Freundin'), kase: 'D' }).text, 'meiner guten Freundin')
  assert.equal(nounPhrase({ det: null, adj: 'gut', noun: N('Unterricht'), kase: 'N' }).text, 'guter Unterricht')
  assert.equal(nounPhrase({ det: null, adj: 'neu', noun: N('Regel'), kase: 'G', plural: true }).text, 'neuer Regeln')
  assert.equal(nounPhrase({ det: 'dieser', noun: N('Thema'), kase: 'G' }).text, 'dieses Themas')
  assert.equal(nounPhrase({ det: 'euer', noun: N('Klasse'), kase: 'D' }).text, 'eurer Klasse')
  assert.equal(adjForm('teuer', 'ein', 'N', 'n'), 'teures')
  assert.equal(datPl('Länder'), 'Ländern')
  assert.equal(datPl('Praktika'), 'Praktika')
  assert.equal(datPl('Handys'), 'Handys')
})

test('verbs and clauses', () => {
  const v = verbs.find((x) => x.inf === 'lesen')
  assert.deepEqual(v.forms, ['lese', 'liest', 'liest', 'lesen', 'lest', 'lesen'])
  assert.equal(subClause(clauses.find((c) => c.fin === 'lenkt')), 'das Handy viele Schüler vom Lernen ablenkt')
  assert.equal(subClause(clauses.find((c) => c.subj === 'man')), 'man im Internet fast alles lernen kann')
})

test('strict checking', () => {
  assert.ok(isCorrect('Meiner Meinung nach', 'Meiner Meinung nach'))
  assert.ok(!isCorrect('meiner Meinung nach', 'Meiner Meinung nach'))
  assert.ok(!isCorrect('Ich glaube dass es schwer ist.', 'Ich glaube, dass es schwer ist.'))
  assert.ok(isCorrect('Ich glaube,  dass es schwer ist', 'Ich glaube, dass es schwer ist.'))
  assert.ok(!isCorrect('Lander', 'Länder'))
  assert.ok(!isCorrect('Strasse', 'Straße'))
  assert.ok(isCorrect('eine „Goldmine“', 'eine "Goldmine"'))
  assert.equal(joinTokens(bankTokens('Ich finde, dass es stimmt.')), 'Ich finde, dass es stimmt')
})
