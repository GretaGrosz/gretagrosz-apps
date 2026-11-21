// The app in a real browser at phone and computer sizes: nothing wider than the screen, nothing cut off at the edge,
// the header lined up with the page, and the idea row usable without a touch screen.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
let chromium
try {
  ;({ chromium } = require('playwright'))
} catch {}
const root = fileURLToPath(new URL('..', import.meta.url))
const skip = !chromium && 'Playwright is not installed'

const now = Date.now()
const DATA = {
  version: 6,
  onboarded: true,
  me: { name: 'Greta', prefs: { categories: ['art'], level: 'beginner', time: 'some' }, outfit: {}, tips: false },
  projects: [
    {
      id: 'pr_1', title: 'Learn to sketch portraits', category: 'art', guideKey: null, description: '', createdAt: now - 5 * 864e5, status: 'active', finishedAt: null,
      milestones: [1, 2, 3, 4].map((i) => ({ id: `m${i}`, text: `Step ${i}`, done: i < 2, doneAt: null })),
      entries: [], sessions: [], resources: [],
    },
  ],
  activity: [], freezes: { available: 0, used: [], earned: [] }, challenges: {}, challengeWins: [], unlockedNotified: null, picks: {}, session: null, buddy: null, focusId: null,
}

let vite, browser, base
before(async () => {
  if (skip) return
  const { createServer } = await import('vite')
  vite = await createServer({ root, configFile: `${root}vite.config.js`, base: '/blank/', logLevel: 'silent', server: { port: 0, proxy: {} } })
  await vite.listen()
  base = `http://localhost:${vite.httpServer.address().port}/blank/`
  browser = await chromium.launch()
})
after(async () => {
  await browser?.close()
  await vite?.close()
})

async function open(width, height, route) {
  const ctx = await browser.newContext({ viewport: { width, height } })
  await ctx.route('**/blank/api/**', (r) => r.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"offline"}' }))
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await ctx.addInitScript((d) => {
    if (sessionStorage.getItem('seeded')) return
    sessionStorage.setItem('seeded', '1')
    localStorage.setItem('blank-data-v2', JSON.stringify(d))
    localStorage.setItem('blank-install', 'done')
    localStorage.setItem('blank-visit', new Date().toISOString().slice(0, 10))
  }, DATA)
  await page.goto(`${base}#${route}`)
  await page.waitForSelector('main h1, main h2', { timeout: 15000 })
  await page.waitForTimeout(300)
  return { page, errors, close: () => ctx.close() }
}

const SIZES = [
  ['phone', 390, 844],
  ['laptop', 1280, 720],
  ['desktop', 1920, 1080],
]
const ROUTES = ['/', '/ideas', '/project/pr_1', '/you', '/friends', '/streak', '/challenges']

for (const [name, w, h] of SIZES) {
  test(`${name}: every main page fits the screen width`, { skip }, async () => {
    for (const route of ROUTES) {
      const { page, errors, close } = await open(w, h, route)
      const [scroll, inner] = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth])
      assert.ok(scroll <= inner, `${route} is ${scroll}px wide on a ${inner}px screen`)
      assert.deepEqual(errors, [], `${route} threw`)
      await close()
    }
  })
}

for (const [name, w, h] of SIZES) {
  test(`${name}: the first idea card is not cut off at the edge`, { skip }, async () => {
    const { page, close } = await open(w, h, '/ideas')
    const left = await page.evaluate(() => document.querySelector('main section .snap-start').getBoundingClientRect().left)
    assert.ok(left >= 8, `the first card starts at ${left}px`)
    await close()
  })
}

test('computer: the header lines up with the page and the idea row has arrows', { skip }, async () => {
  const { page, close } = await open(1920, 1080, '/ideas')
  const [logo, title] = await page.evaluate(() => [
    document.querySelector('header a').getBoundingClientRect().left,
    document.querySelector('main h1').getBoundingClientRect().left,
  ])
  assert.ok(Math.abs(logo - title) < 24, `logo at ${logo}px, page title at ${title}px`)
  const next = page.getByRole('button', { name: 'More' }).first()
  await next.click()
  await page.waitForTimeout(700)
  const scrolled = await page.evaluate(() => document.querySelector('main section .snap-start').parentElement.scrollLeft)
  assert.ok(scrolled > 100, 'the arrow scrolled the row')
  assert.ok(await page.getByRole('button', { name: 'What do you want to make?' }).isVisible(), 'the quick + button is in the header')
  await close()
})
