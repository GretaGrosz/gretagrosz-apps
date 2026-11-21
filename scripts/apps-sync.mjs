// Writes every app list on gretagrosz.com from website/js/apps-data.js, the one place apps are listed.
// Each list lives in a page between <!-- apps:NAME --> and <!-- /apps:NAME -->; this script replaces what is
// between the markers, so the static HTML is complete without JavaScript (search engines, the CV PDF, slow phones).
//
//   node scripts/apps-sync.mjs           rewrite the pages
//   node scripts/apps-sync.mjs --check   exit 1 if any page is out of date (writes nothing)
//
// sync-site.sh runs it before copying the site to deploy/site.
import { readFile, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const site = join(root, 'website')
const check = process.argv.includes('--check')

const sandbox = {}
sandbox.globalThis = sandbox
vm.runInNewContext(await readFile(join(site, 'js/apps-data.js'), 'utf8'), sandbox)
const { list: APPS, phrases: P } = sandbox.APPS
if (!Array.isArray(APPS) || !APPS.length) throw new Error('apps-data.js: no apps')
for (const a of APPS) for (const k of ['id', 'name', 'url', 'icon']) if (!a[k]) throw new Error(`apps-data.js: ${a.id || '?'} has no ${k}`)

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const icon = (a, lazy = true) => `<span class="app-icon"><img src="${a.icon}" alt="" width="240" height="240"${lazy ? ' loading="lazy"' : ''} decoding="async" /></span>`
const icons = (lazy = true) => APPS.map((a) => icon(a, lazy)).join('')

const BLOCKS = {
  // Homepage hero: every app one tap away
  home: () => `<div class="hp-head"><h2 class="hp-title" id="hp-apps-h">Apps</h2><a class="link" href="/apps/">${esc(P.all[0])}</a></div>
      <ul class="hp-grid">
${APPS.map((a, i) => `        <li style="--i:${i}"><a href="${a.url}">${icon(a, false)}<span class="nm">${esc(a.name)}</span><span class="kd">${esc(a.kind[0])}</span></a></li>`).join('\n')}
      </ul>`,
  // Homepage "What I do": the apps card
  'home-card': () => `<a class="wcard card rv" href="/apps/" style="--d:1">
        <span class="eyebrow">Apps</span>
        <span class="wproof wicons" aria-hidden="true">${icons()}</span>
        <span class="wfact">${esc(P.live[0])}</span>
        <span class="link">See my apps</span>
      </a>`,
  // Apps page hero shelf: tapping an icon opens the app, like a Home Screen
  shelf: () => `<nav class="shelf" aria-label="${esc(P.shelf[0])}">
${APPS.map((a, i) => `      <a href="${a.url}" style="--i:${i}">${icon(a, false)}<span class="nm">${esc(a.name)}</span></a>`).join('\n')}
    </nav>`,
  // Apps page dock: jumps between the cards
  dock: () => APPS.map((a) => `  <a href="#${a.id}" aria-label="${esc(a.name)}">${icon(a)}</a>`).join('\n'),
  'finance-door': () => `<a class="door rv" style="--d:1" href="/apps/">
        <span class="icons" aria-hidden="true">${icons()}</span>
        <span class="door-t"><b>See my apps</b><small>${esc(P.live[0])}</small></span>
        <span class="door-go" aria-hidden="true">›</span>
      </a>`,
  'business-card': () => `<a class="end-card apps rv" style="--d:2" href="/apps/">
        <span class="eyebrow">Apps</span>
        <h3>${esc(P.built[0])}</h3>
        <span class="icons" aria-hidden="true">${icons()}</span>
        <span class="link">See my apps</span>
      </a>`,
  'cv-profile': () => `<p class="profile">${esc(P.cvProfile[0])}</p>`,
  'cv-projects': () => `<li><span class="when">Live</span><div><h3>${esc(P.cvTitle[0])}</h3>
                <ul class="sub">
${APPS.map((a) => `                  <li><b>${esc(a.name)}</b> <span>${esc(a.cv[0])}</span></li>`).join('\n')}
                </ul>
                <p class="url"><a href="https://gretagrosz.com/apps/" target="_blank" rel="noopener">gretagrosz.com/apps</a></p></div></li>`,
  '404': () => `<ul class="nf-apps">
${APPS.map((a) => `      <li><a href="${a.url}">${icon(a, false)}<span>${esc(a.name)}</span></a></li>`).join('\n')}
    </ul>`,
}

const PAGES = ['index.html', 'apps/index.html', 'finance/index.html', 'business/index.html', 'cv/index.html', '404.html']
const used = new Set()
let stale = 0
for (const page of PAGES) {
  const file = join(site, page)
  const html = await readFile(file, 'utf8')
  const out = html.replace(/(<!-- apps:([\w-]+) -->)([\s\S]*?)(\s*<!-- \/apps:\2 -->)/g, (all, open, name, _body, close) => {
    if (!BLOCKS[name]) throw new Error(`${page}: unknown block "${name}"`)
    used.add(name)
    const indent = (all.match(/\n([ \t]*)<!-- \/apps:/) || [, ''])[1]
    return `${open}\n${indent}${BLOCKS[name]()}${close}`
  })
  // The apps page cards are hand-written; they must follow the same order as the list
  if (page === 'apps/index.html') {
    const order = [...out.matchAll(/<section data-app="([\w-]+)"/g)].map((m) => m[1])
    const want = APPS.map((a) => a.id)
    if (order.join() !== want.join()) throw new Error(`apps/index.html: cards are in the order ${order.join(', ')}, apps-data.js says ${want.join(', ')}`)
  }
  if (out !== html) {
    stale++
    if (check) console.log(`out of date: website/${page}`)
    else { await writeFile(file, out); console.log(`wrote website/${page}`) }
  }
}
// The homepage is Greta's own design and carries no app-list markers, so its blocks are optional.
const OPTIONAL = new Set(['home', 'home-card'])
const missing = Object.keys(BLOCKS).filter((b) => !used.has(b) && !OPTIONAL.has(b))
if (missing.length) throw new Error(`no page has a marker for: ${missing.join(', ')}`)
if (check && stale) process.exit(1)
if (!stale) console.log('app lists are up to date')
