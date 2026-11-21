// Renders the link-preview cards (og:image, 1200x630) for every page of gretagrosz.com, plus the
// 180x180 Home Screen icon, into website/img/. Re-run after changing a page title, the apps or the icons.
//
//   node scripts/make-og.mjs
//
// Uses Playwright's Chromium (from this repo, PLAYWRIGHT_DIR or ~/.claude/scratch/ggtools) and the site's own fonts, icons and mascot.
import { createRequire } from 'node:module'
import { mkdir, readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { homedir } from 'node:os'
import vm from 'node:vm'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const site = join(root, 'website')
// Pages are rendered with setContent, so every asset is inlined as a data: URL
const MIME = { woff2: 'font/woff2', webp: 'image/webp', png: 'image/png', svg: 'image/svg+xml' }
const inline = {}
const file = (p) => inline[p]
async function preload(paths) {
  for (const p of paths) inline[p] = `data:${MIME[p.split('.').pop()]};base64,${(await readFile(join(site, p))).toString('base64')}`
}

function loadPlaywright() {
  const tries = [process.env.PLAYWRIGHT_DIR, root, homedir(), join(homedir(), '.claude/scratch/ggtools')].filter(Boolean)
  for (const dir of tries) {
    try { return createRequire(join(dir, 'noop.js'))('playwright') } catch {}
  }
  throw new Error(`Playwright not found (looked in ${tries.join(', ')}). Install it or set PLAYWRIGHT_DIR.`)
}

const sandbox = {}
sandbox.globalThis = sandbox
vm.runInNewContext(await readFile(join(site, 'js/apps-data.js'), 'utf8'), sandbox)
const { list: APPS, phrases: P } = sandbox.APPS
await preload(['fonts/nunito-latin.woff2', 'img/mascot.webp', 'img/weekendink-large.webp', ...APPS.map((a) => a.icon.replace(/^\//, ''))])

const LOGO = `<svg viewBox="0 0 100 100"><rect width="100" height="100" rx="30" fill="#232B3D"/><g transform="translate(16 16) scale(.68)" fill="none" stroke="#D9E0EA" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"><path d="M36.48 21 A32 32 0 0 1 81.88 52.79 Q81 61 72 61 L46 61"/><path d="M63.52 79 A32 32 0 0 1 18.12 47.21 Q19 39 28 39 L54 39"/></g></svg>`
const icons = (list, s) => list.map((src) => `<img src="${file(src.replace(/^\//, ''))}" style="width:${s}px;height:${s}px;border-radius:23%;box-shadow:0 0 0 1px rgba(35,43,61,.06),0 14px 28px -14px rgba(35,43,61,.45)">`).join('')

const CSS = `
@font-face { font-family: Nunito; font-weight: 400 900; src: url(${file('fonts/nunito-latin.woff2')}) format('woff2'); }
* { box-sizing: border-box; margin: 0; }
html, body { width: 1200px; height: 630px; }
body { position: relative; overflow: hidden; padding: 72px 80px; background: #fff; color: #232B3D; font-family: Nunito, sans-serif; -webkit-font-smoothing: antialiased; }
h1 { font-size: 72px; line-height: 1.0; font-weight: 900; letter-spacing: -0.045em; max-width: 900px; }
h1 .b { color: #3D5E9C; }
p { margin-top: 26px; font-size: 30px; line-height: 1.3; font-weight: 700; color: #5B6782; max-width: 760px; letter-spacing: -0.015em; }
.foot { position: absolute; left: 80px; bottom: 60px; display: flex; align-items: center; gap: 16px; font-size: 28px; font-weight: 900; letter-spacing: -0.03em; }
.foot svg { width: 48px; height: 48px; }
.foot span { color: #5B6782; font-weight: 800; }
.row { display: flex; gap: 22px; margin-top: 48px; }
.snow { position: absolute; inset: auto 0 0 0; height: 150px; background: #F4F6FA; z-index: -1; }
.mascot { position: absolute; right: 80px; bottom: 141px; width: 280px; }
`
const page = (body) => `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${body}<div class="foot">${LOGO}Greta Grosz <span>· gretagrosz.com</span></div></body></html>`
const appIcons = APPS.map((a) => a.icon)

const CARDS = {
  home: page(`<h1>Banks are competing for my generation. <span class="b">I researched how.</span></h1>
    <p>Greta Grosz, 17. Business and finance student in Austria. Market research, ${APPS.length} apps and a small business.</p>
    <div class="snow"></div><img class="mascot" src="${file('img/mascot.webp')}">`),
  apps: page(`<h1>${P.built[0]}.</h1><div class="row">${icons(appIcons, 132)}</div><div class="snow"></div>`),
  finance: page(`<h1>How Austria’s banks win Gen Z, <span class="b">and a tool that picks your account.</span></h1>
    <p>Market research and a live calculator for 12 youth accounts.</p><div class="snow"></div>`),
  business: page(`<div style="display:flex;gap:56px;align-items:center"><div><h1 style="max-width:640px">Tattoos for the weekend. <span class="b">Gone by Monday.</span></h1>
    <p style="max-width:600px">Custom temporary tattoos for festivals, events and teams, and clothes sewn and sold online.</p></div>
    ${icons(['/img/weekendink-large.webp'], 300)}</div><div class="snow"></div>`),
  cv: page(`<h1>Greta Grosz</h1><p style="font-size:38px;color:#232B3D;font-weight:800">Business &amp; finance student (BHAK), Austria</p>
    <p>Looking for a banking internship. English and Hungarian native, German B2.</p><div class="snow"></div>`),
  contact: page(`<h1>Write to me.</h1><p>Internships, my apps, Weekend Ink tattoos, clothing.</p><div class="snow"></div><img class="mascot" src="${file('img/mascot.webp')}">`),
}

const { chromium } = loadPlaywright()
const browser = await chromium.launch({ args: ['--use-mock-keychain', '--password-store=basic', '--allow-file-access-from-files'] })
try {
  await mkdir(join(site, 'img/og'), { recursive: true })
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
  const p = await ctx.newPage()
  for (const [name, html] of Object.entries(CARDS)) {
    await p.setContent(html, { waitUntil: 'load' })
    await p.evaluate(() => document.fonts.ready)
    await p.screenshot({ path: join(site, `img/og/${name}.png`) })
    console.log(`img/og/${name}.png`)
  }
  // Home Screen icon: full-bleed square (iOS rounds the corners itself)
  const ic = await browser.newContext({ viewport: { width: 180, height: 180 }, deviceScaleFactor: 1 })
  const q = await ic.newPage()
  await q.setContent(`<html><body style="margin:0;width:180px;height:180px;background:#232B3D">${LOGO.replace('rx="30"', 'rx="0"').replace('<svg ', '<svg width="180" height="180" ')}</body></html>`)
  await q.screenshot({ path: join(site, 'img/apple-touch-icon.png') })
  console.log('img/apple-touch-icon.png')
} finally {
  await browser.close()
}
