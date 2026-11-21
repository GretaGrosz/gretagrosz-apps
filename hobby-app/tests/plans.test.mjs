// The step-by-step plans: every plan, in every language, has steps you can actually follow
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { GUIDES, planForName, stepsFor, resourcesFor } from '../src/guides.js'
import { TEMPLATE_KINDS, hobbyKind, templateSteps } from '../src/templates.js'
import HU from '../src/hu.js'

const LANGS = ['en', 'de', 'hu']

const checkSteps = (steps, where, name = '') => {
  assert.ok(steps.length >= 5 && steps.length <= 10, `${where}: ${steps.length} steps`)
  const seen = new Set()
  for (const s of steps) {
    assert.equal(typeof s.text, 'string', where)
    // A hobby's own name can be long; the rest of the step has to stay short
    const len = (name ? s.text.split(name).join('X') : s.text).length
    assert.ok(len >= 8 && len <= 90, `${where}: step length ${len}: ${s.text}`)
    assert.ok(s.how && s.how.length >= 15 && s.how.length <= 190, `${where}: how for "${s.text}" is ${s.how?.length}`)
    assert.match(s.how, /[.!?”“"]$/, `${where}: how ends with a full stop: ${s.how}`)
    assert.ok(!seen.has(s.text), `${where}: the step "${s.text}" twice`)
    seen.add(s.text)
  }
}

test('every hand-made plan has 5–10 steps with a how line, in English, German and Hungarian', () => {
  for (const [key, guide] of Object.entries(GUIDES)) {
    for (const lang of LANGS) checkSteps(stepsFor(guide, 'some', lang), `${key}/${lang}`)
  }
})

test('every Hungarian step and how line is really translated', () => {
  for (const [key, guide] of Object.entries(GUIDES)) {
    const en = stepsFor(guide, 'new', 'en')
    const hu = stepsFor(guide, 'new', 'hu')
    hu.forEach((s, i) => {
      assert.notEqual(s.text, en[i].text, `${key}: step ${i + 1} is still English in Hungarian`)
      assert.notEqual(s.how, en[i].how, `${key}: how ${i + 1} is still English in Hungarian`)
    })
    // and German has its own words too
    stepsFor(guide, 'new', 'de').forEach((s, i) => assert.notEqual(s.how, en[i].how, `${key}: German how ${i + 1}`))
  }
})

test('beginners get a 10-minute video step first; people with experience skip it', () => {
  for (const lang of LANGS) {
    const newbie = stepsFor(GUIDES.guitar, 'new', lang)
    const some = stepsFor(GUIDES.guitar, 'some', lang)
    assert.equal(newbie.length, some.length + 1)
    assert.ok(newbie[0].how.length > 20)
  }
})

test('every kind of hobby has a template that works in every language', () => {
  for (const kind of TEMPLATE_KINDS) {
    for (const lang of LANGS) {
      const steps = templateSteps(kind, 'Handstand', lang)
      checkSteps(steps, `template ${kind}/${lang}`)
      for (const s of steps) assert.ok(!/\{x\}/.test(s.text + s.how), `${kind}/${lang}: unfilled name`)
    }
  }
})

test('a hobby without a hand-made plan gets a plan for its kind, not one for something else', () => {
  // Before: handball fell back to the running plan, macramé to embroidery
  const cases = [
    ['Learn handball', 'sport', 'fitness'],
    ['Kézilabda', 'sport', 'fitness'],
    ['Handball spielen', 'sport', 'fitness'],
    ['Learn the violin', 'music', 'music'],
    ['Zongorázni tanulni', 'music', 'music'],
    ['Learn chess', null, 'learn'], // a hand-made plan now (starters.js)
    ['Learn to juggle', 'skill', 'other'],
    ['Make a macramé plant hanger', 'make', 'crafts'],
    ['Build a robot', 'tech', 'tech'],
    ['Bake banana bread', null, 'cooking'], // a hand-made plan (cinnamon/baking) may fit; it must be a cooking one
    ['Write poems', null, 'writing'],
    ['Learn to swim', 'sport', 'fitness'],
    ['Do 20 push-ups in a row', null, 'fitness'],
    ['Do 50 squats a day', 'train', 'fitness'],
    ['Try yoga every day', null, 'fitness'],
    ['Fold origami animals', null, 'crafts'],
    ['Make paper flowers', 'make', 'crafts'],
    ['Find what I love', 'skill', 'other'],
    ['Fix my bike', 'outdoors', 'outdoors'], // before: the electronics repair plan
    ['Make a short film', 'photo', 'photo'],
  ]
  for (const [name, kind, category] of cases) {
    const { guide, category: c } = planForName(name)
    assert.equal(c, category, `${name}: category ${c}`)
    if (kind) assert.equal(guide.kind || null, guide.key ? null : kind, `${name}: kind ${guide.kind}`)
    for (const lang of LANGS) checkSteps(stepsFor(guide, 'new', lang), `${name}/${lang}`, name)
  }
})

test('the template steps say the hobby’s name, and sports plans point to a club', () => {
  const { guide } = planForName('Kézilabda')
  const steps = stepsFor(guide, 'new', 'hu')
  assert.ok(steps.some((s) => s.text.includes('„Kézilabda”')))
  assert.ok(steps.some((s) => /edzés/i.test(s.text)))
  assert.ok(resourcesFor(guide, 'hu').some((r) => r.kind === 'map'))
})

test('a category the user picked wins over guessing from the name', () => {
  assert.equal(hobbyKind('Something new', 'garden'), 'grow')
  assert.equal(hobbyKind('Something new'), 'skill')
  assert.equal(planForName('Something new', 'music').category, 'music')
})

test('every English plan line has a Hungarian translation in hu.js', () => {
  for (const guide of Object.values(GUIDES)) {
    // Plans that carry their own Hungarian (starters.js) are checked below
    if (guide.steps.hu) {
      assert.equal(guide.steps.hu.length, guide.steps.en.length, `hu steps: ${guide.title.en}`)
      assert.ok(guide.steps.hu.every(([t, h]) => t && h) && guide.title.hu, `hu text: ${guide.title.en}`)
      continue
    }
    for (const [text, how] of guide.steps.en) {
      assert.ok(HU[text], `missing hu for: ${text}`)
      assert.ok(HU[how], `missing hu for: ${how}`)
    }
  }
})

test('every hand-made plan is found by its own title, in every language', () => {
  for (const [key, guide] of Object.entries(GUIDES)) {
    for (const lang of LANGS) {
      const title = lang === 'hu' ? HU[guide.title.en] || guide.title.en : guide.title[lang]
      assert.equal(planForName(title).guide.key, key, `${lang}: “${title}”`)
    }
  }
})

test('the video step is the one step you tick without a photo; the others need one', () => {
  for (const lang of LANGS) {
    const steps = stepsFor(GUIDES.knit, 'new', lang)
    assert.equal(steps[0].quick, true)
    assert.ok(steps.slice(1).every((s) => !s.quick))
    assert.ok(/photo|Foto|fotó/i.test(steps[0].how), `${lang}: the how line says no photo is needed`)
    const tmpl = stepsFor(planForName('Learn handball').guide, 'new', lang)
    assert.equal(tmpl[0].quick, true)
    // Cooking plans don't start with a video, so nothing is quick there
    assert.ok(stepsFor(planForName('Bake a lemon tart', 'cooking').guide, 'new', lang).every((s) => !s.quick || /video|videó/i.test(s.text)))
  }
  // People with experience skip the video, so no quick step
  assert.ok(stepsFor(GUIDES.knit, 'some', 'en').every((s) => !s.quick))
})

test('a shared plan leaves out the automatic "Choose your project" step', async () => {
  const { sparkBody } = await import('../src/sparks.js')
  const project = { title: 'Knit', category: 'crafts', guideKey: 'knit', milestones: [{ text: 'Choose your project', auto: true, done: true }, { text: 'Knit a swatch' }] }
  assert.deepEqual(sparkBody(project, 'Greta', 'en').steps, ['Knit a swatch'])
})

test('a friend’s sock monkey post gets the hand-made sock monkey plan, not an AI guess', () => {
  for (const title of ['Upcycled a sock into this cute monkey.', 'I sewed a monkey from old socks', 'Zokniból majmot varrtam', 'Mein Sockenaffe'])
    assert.equal(planForName(title).guide.key, 'sockmonkey', title)
  for (const title of ['Monkey bread for breakfast', 'Knit a pair of socks']) assert.notEqual(planForName(title).guide.key, 'sockmonkey', title)
})

test('guessLang tells which language someone’s steps are in', async () => {
  const { guessLang } = await import('../src/guides.js')
  assert.equal(guessLang(['Schneide den Nagel kurz und feile die Kanten glatt.']), 'de')
  assert.equal(guessLang(['Such dir zwei lange Socken aus und zeichne die Schnitte mit Kreide']), 'de')
  assert.equal(guessLang(['Vágj ki 10 kis négyzetet különböző színű anyagokból']), 'hu')
  assert.equal(guessLang(['Keress valamit, amit felújíthatsz (padot, széket vagy sámlit)']), 'hu')
  assert.equal(guessLang(['Draw 20 cubes, cylinders and spheres in 10 minutes']), 'en')
  assert.equal(guessLang(['Thread the machine, wind a bobbin and sew 10 cm']), 'en')
  assert.equal(guessLang([]), null)
})


test('journey: updates become a draft plan (steps in order, mistakes and tips with the next step, materials, time)', async () => {
  const { draftPlan } = await import('../src/journey.js')
  const d = 86_400_000
  const project = {
    createdAt: 0,
    finishedAt: 5 * d,
    materials: ['Needle'],
    milestones: [
      { id: 'm0', text: 'Choose your project', auto: true, done: true },
      { id: 'm1', text: 'Cut the sock', how: 'Below the heel.', done: true, doneAt: 1 * d },
      { id: 'm2', text: 'Sew the legs', done: true, doneAt: 3 * d },
    ],
    entries: [
      { at: 0.5 * d, tag: 'bought', text: 'Long socks, stuffing' },
      { at: 0.8 * d, tag: 'mistake', text: 'I cut too high the first time' },
      { at: 1 * d, text: 'Cut the sock', photo: 'idb:1' }, // ticked with a photo (StepPhoto.jsx)
      { at: 2 * d, tag: 'tip', text: 'Pins keep the legs straight' },
      { at: 3 * d, tag: 'step', step: 'm2', text: 'Finally!' },
      { at: 4 * d, text: 'just a note' },
    ],
  }
  const plan = draftPlan(project)
  assert.deepEqual(plan.steps, [
    { text: 'Cut the sock', how: 'Watch out: I cut too high the first time' },
    { text: 'Sew the legs', how: 'Finally! Tip: Pins keep the legs straight' },
  ])
  assert.deepEqual(plan.materials, ['Long socks', 'stuffing', 'Needle'])
  assert.equal(plan.time, 'days')
  // No tagged updates: the ticked steps in the order they were ticked
  const plain = draftPlan({ ...project, entries: [] })
  assert.deepEqual(plain.steps.map((s) => s.text), ['Cut the sock', 'Sew the legs'])
  assert.equal(plain.steps[0].how, 'Below the heel.')
})

test('journey: every "next plan" link points to a real plan, and the chain skips plans you already started', async () => {
  const { NEXT, nextPlan } = await import('../src/journey.js')
  for (const [from, to] of Object.entries(NEXT)) {
    assert.ok(GUIDES[from], `NEXT has an unknown plan: ${from}`)
    assert.ok(GUIDES[to], `NEXT points to an unknown plan: ${to}`)
  }
  const done = { guideKey: 'bracelet', category: 'crafts' }
  assert.equal(nextPlan(done, [], GUIDES).key, 'crochet')
  assert.equal(nextPlan(done, [{ guideKey: 'crochet' }], GUIDES).key, 'scarf')
  // Your own project: another plan from the same hobby
  assert.equal(nextPlan({ guideKey: null, category: 'music' }, [], GUIDES).category, 'music')
})
