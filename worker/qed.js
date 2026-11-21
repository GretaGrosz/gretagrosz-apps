// The QED API (/qed/api/*): proof marking and the coach for QED (regional-app), with Greta's Anthropic key
// kept on the server. Every visitor gets a daily allowance per device and per network, and the whole site has a
// daily ceiling, so a leaked device id or a busy classroom can't run up the bill.
//
// Secrets / vars (wrangler secret put …):
//   QED_ANTHROPIC_KEY   required. Without it /status says hosted:false and the app falls back to self-marking.
//   QED_MARKS_PER_DAY   optional, default 6    marks per device per day
//   QED_CHATS_PER_DAY   optional, default 40   coach messages per device per day
//   QED_DAILY_CAP       optional, default 400  marks for the whole site per day (coach messages count 1/5)
//   QED_ANTHROPIC_BASE  dev only: point the API at a local mock (never set this in production)
//
// Usage lives in the yap D1 database (binding DB) in the qed_usage table (migration 0200_qed_usage.sql).

import { GRADER, GRADE_SCHEMA, coachPrompt, gradePrompt, normaliseGrade } from './qed-prompts.js'

const API = '/qed/api'
const MODEL = 'claude-sonnet-5-5'
const MAX_POINTS = 8
const LIMITS = {
  body: 7_000_000, // bytes of JSON
  photos: 6,
  photo: 1_600_000, // base64 characters per photo (~1.2 MB JPEG)
  text: 20_000, // typed proof or one coach message
  problem: 12_000, // problem statement + scheme + solution, as sent by the app
  messages: 40,
  chatChars: 60_000,
}
const MEDIA = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const PER_IP = 4 // a network (school, family) gets four devices' worth

class HttpError extends Error {
  constructor(status, message, code) { super(message); this.status = status; this.code = code }
}
const fail = (status, message, code) => { throw new HttpError(status, message, code) }
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })

export async function qed(request, env, ctx, url) {
  try {
    return await route(request, env, url)
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message, code: e.code || 'error' }, e.status)
    console.error(e)
    return json({ error: 'Something went wrong', code: 'error' }, 500)
  }
}

const limits = (env) => ({
  marks: posInt(env.QED_MARKS_PER_DAY, 6),
  chats: posInt(env.QED_CHATS_PER_DAY, 40),
  cap: posInt(env.QED_DAILY_CAP, 400),
})
function posInt(v, fallback) {
  const n = Number.parseInt(v, 10)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

async function route(request, env, url) {
  const path = url.pathname.slice(API.length)
  const method = request.method
  const hosted = !!env.QED_ANTHROPIC_KEY && !!env.DB

  if (method === 'GET' && path === '/status') {
    const device = deviceId(url.searchParams.get('device'))
    const lim = limits(env)
    if (!hosted) return json({ hosted: false })
    await ensureTable(env.DB)
    const day = utcDay()
    const used = device ? await usage(env.DB, day, [`d:${await sha(device)}:mark`, `d:${await sha(device)}:chat`]) : [0, 0]
    return json({ hosted: true, marks: { limit: lim.marks, left: Math.max(0, lim.marks - used[0]) }, chats: { limit: lim.chats, left: Math.max(0, lim.chats - used[1]) } })
  }

  if (method !== 'POST' || (path !== '/grade' && path !== '/coach')) fail(404, 'Not found')
  if (!hosted) fail(503, 'Marking is not switched on here.', 'not_configured')

  const len = Number(request.headers.get('content-length') || 0)
  if (len > LIMITS.body) fail(413, 'That is too much at once. Send fewer or smaller photos.', 'too_large')
  let b
  try {
    const raw = await request.text()
    if (raw.length > LIMITS.body) fail(413, 'That is too much at once. Send fewer or smaller photos.', 'too_large')
    b = JSON.parse(raw)
  } catch (e) {
    if (e instanceof HttpError) throw e
    fail(400, 'Bad request')
  }
  if (!b || typeof b !== 'object') fail(400, 'Bad request')
  const device = deviceId(b.device)
  if (!device) fail(400, 'Missing device id')

  const kind = path === '/grade' ? 'mark' : 'chat'
  const problem = cleanProblem(b.problem)
  let messages
  if (kind === 'mark') {
    const photos = cleanPhotos(b.photos)
    const text = cleanText(b.text, LIMITS.text)
    if (!photos.length && text.trim().length < 3) fail(400, 'Add a photo or type your proof first.', 'empty')
    const pages = Array.isArray(b.pages) ? b.pages.slice(0, photos.length).map((p) => ({ w: posInt(p?.w, 0), h: posInt(p?.h, 0) })) : []
    messages = [{ role: 'user', content: [...photoBlocks(photos), { type: 'text', text: gradePrompt(problem, photos, pages, text) }] }]
  } else {
    messages = cleanChat(b.messages)
  }

  const db = env.DB
  await ensureTable(db)
  const lim = limits(env)
  const day = utcDay()
  const devKey = `d:${await sha(device)}:${kind}`
  const ipKey = `i:${await sha('ip:' + (request.headers.get('cf-connecting-ip') || 'local'))}:${kind}`
  const allKey = 'all'
  const perDevice = kind === 'mark' ? lim.marks : lim.chats
  const siteCost = kind === 'mark' ? 5 : 1 // the site cap is counted in fifths of a mark

  // Reserve first so parallel requests can't slip past the limit, refund if the model call fails
  const [dev, ip, all] = await bump(db, day, [[devKey, 1], [ipKey, 1], [allKey, siteCost]])
  const refund = () => bump(db, day, [[devKey, -1], [ipKey, -1], [allKey, -siteCost]]).catch((e) => console.error(e))
  if (dev > perDevice || ip > perDevice * PER_IP || all > lim.cap * 5) {
    await refund()
    if (all > lim.cap * 5) fail(429, 'Marking is busy today. Try again tomorrow or mark it yourself.', 'site_cap')
    fail(429, kind === 'mark' ? 'No marks left today. More tomorrow.' : 'No coach messages left today. More tomorrow.', 'quota')
  }

  try {
    if (kind === 'mark') {
      const out = await callClaude(env, {
        system: GRADER,
        messages,
        max_tokens: 12000,
        output_config: { effort: 'high', format: { type: 'json_schema', schema: GRADE_SCHEMA } },
      })
      const grade = normaliseGrade(parseJSON(out))
      return json({ grade, left: Math.max(0, perDevice - dev) })
    }
    const reply = await callClaude(env, {
      system: coachPrompt(problem, b.topic === true, cleanGrade(b.graded)),
      messages,
      max_tokens: 4000,
      output_config: { effort: 'medium' },
    })
    if (!reply.trim()) fail(502, 'The coach had nothing to say. Try again.', 'upstream')
    return json({ reply, left: Math.max(0, perDevice - dev) })
  } catch (e) {
    await refund()
    throw e
  }
}

/* ---------- Anthropic ---------- */

async function callClaude(env, params) {
  const base = (env.QED_ANTHROPIC_BASE || 'https://api.anthropic.com').replace(/\/$/, '')
  let res
  try {
    res = await fetch(`${base}/v1/messages`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.QED_ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'server-side-fallback-2026-07-01',
      },
      body: JSON.stringify({ model: MODEL, fallbacks: 'default', ...params }),
    })
  } catch (e) {
    console.error('anthropic fetch', e)
    fail(502, 'Couldn’t reach the marker. Try again in a minute.', 'upstream')
  }
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error('anthropic', res.status, body?.error?.type, body?.error?.message)
    if (res.status === 429 || res.status === 529) fail(503, 'The marker is busy right now. Try again in a minute.', 'busy')
    if (res.status === 400 && /image/i.test(body?.error?.message || '')) fail(400, 'One of the photos couldn’t be read. Take it again.', 'bad_image')
    fail(502, 'The marker had a problem. Try again in a minute.', 'upstream')
  }
  if (body.stop_reason === 'refusal') fail(422, 'The marker couldn’t mark this one. Mark it yourself with the scheme.', 'refusal')
  if (body.stop_reason === 'max_tokens') fail(502, 'The marker’s answer was cut off. Try again.', 'upstream')
  return (body.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('\n')
}

const photoBlocks = (photos) => photos.map((p) => ({ type: 'image', source: { type: 'base64', media_type: p.mediaType, data: p.data } }))

/* ---------- input checks ---------- */

function cleanText(v, max) {
  if (v == null) return ''
  if (typeof v !== 'string') fail(400, 'Bad request')
  if (v.length > max) fail(413, 'That text is too long.', 'too_large')
  return v
}
const strList = (v, maxItems) => (Array.isArray(v) ? v.slice(0, maxItems).filter((s) => typeof s === 'string') : [])

function cleanProblem(p) {
  if (!p || typeof p !== 'object' || typeof p.q !== 'string' || !p.q.trim()) fail(400, 'Missing problem')
  const out = {
    q: p.q,
    answers: strList(p.answers, 4),
    keySteps: strList(p.keySteps, 12),
    rubric: (Array.isArray(p.rubric) ? p.rubric : []).slice(0, 12).filter((r) => Array.isArray(r) && typeof r[0] === 'string').map((r) => [r[0], Math.max(0, Math.min(8, Number(r[1]) || 0))]),
    solution: typeof p.solution === 'string' ? p.solution : '',
    pitfalls: strList(p.pitfalls, 8),
  }
  const size = JSON.stringify(out).length
  if (size > LIMITS.problem) fail(413, 'That problem is too long.', 'too_large')
  return out
}

function cleanPhotos(v) {
  if (v == null) return []
  if (!Array.isArray(v)) fail(400, 'Bad request')
  if (v.length > LIMITS.photos) fail(413, `At most ${LIMITS.photos} photos at once.`, 'too_large')
  return v.map((p) => {
    if (!p || typeof p.data !== 'string' || !MEDIA.includes(p.mediaType)) fail(400, 'One of the photos couldn’t be read. Take it again.', 'bad_image')
    if (p.data.length > LIMITS.photo) fail(413, 'One of the photos is too big.', 'too_large')
    if (!/^[A-Za-z0-9+/]+=*$/.test(p.data)) fail(400, 'One of the photos couldn’t be read. Take it again.', 'bad_image')
    return { data: p.data, mediaType: p.mediaType }
  })
}

function cleanChat(v) {
  if (!Array.isArray(v) || !v.length) fail(400, 'Bad request')
  const list = v.slice(-LIMITS.messages)
  let chars = 0
  let photoCount = 0
  const out = list.map((m) => {
    const role = m?.role === 'assistant' ? 'assistant' : m?.role === 'user' ? 'user' : fail(400, 'Bad request')
    const text = cleanText(m.text, LIMITS.text)
    chars += text.length
    const photos = role === 'user' ? cleanPhotos(m.photos) : []
    photoCount += photos.length
    return { role, content: photos.length ? [...photoBlocks(photos), { type: 'text', text: text || 'Here is my work.' }] : text || '…' }
  })
  if (chars > LIMITS.chatChars || photoCount > LIMITS.photos * 2) fail(413, 'This chat is too long. Start a new one.', 'too_large')
  if (out[0].role !== 'user' || out[out.length - 1].role !== 'user') fail(400, 'Bad request')
  return out
}

function cleanGrade(g) {
  if (!g || typeof g !== 'object') return null
  return { score: Math.max(0, Math.min(MAX_POINTS, Math.round(Number(g.score) || 0))), summary: typeof g.summary === 'string' ? g.summary.slice(0, 600) : '' }
}

const deviceId = (v) => (typeof v === 'string' && /^[A-Za-z0-9-]{16,64}$/.test(v) ? v : null)

function parseJSON(text) {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end < start) fail(502, 'The marker’s answer could not be read. Try again.', 'upstream')
  try {
    return JSON.parse(text.slice(start, end + 1))
  } catch {
    fail(502, 'The marker’s answer could not be read. Try again.', 'upstream')
  }
}

/* ---------- usage ---------- */

let tableReady = false
async function ensureTable(db) {
  if (tableReady) return
  // The migration creates this too; doing it here means a forgotten migration can't break marking
  await db.prepare('CREATE TABLE IF NOT EXISTS qed_usage (day INTEGER NOT NULL, key TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, key))').run()
  tableReady = true
}

const utcDay = () => Math.floor(Date.now() / 864e5)

async function bump(db, day, entries) {
  const stmts = entries.map(([key, by]) =>
    db.prepare('INSERT INTO qed_usage (day, key, n) VALUES (?1, ?2, ?3) ON CONFLICT (day, key) DO UPDATE SET n = n + ?3 RETURNING n').bind(day, key, by),
  )
  const res = await db.batch([...stmts, db.prepare('DELETE FROM qed_usage WHERE day < ?').bind(day - 2)])
  return res.slice(0, entries.length).map((r) => r.results?.[0]?.n ?? 0)
}

async function usage(db, day, keys) {
  const rows = await db.prepare(`SELECT key, n FROM qed_usage WHERE day = ? AND key IN (${keys.map(() => '?').join(',')})`).bind(day, ...keys).all()
  const map = Object.fromEntries((rows.results || []).map((r) => [r.key, r.n]))
  return keys.map((k) => map[k] || 0)
}

async function sha(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return [...new Uint8Array(buf)].slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('')
}
