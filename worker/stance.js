// The Stance API (/stance/api/*): one big question a day that everyone takes a side on, written three-round
// debates, Argue back (you against the strongest case for the other side), and Practice (talk for 1, 3 or 5
// minutes on an exam-style topic, get a transcript and a coach's note).
// Guests can read today's question, the archive, debates and profiles; everything else needs an account.
import { questions } from './stance-content.js'
import { questionsDe } from './stance-content-de.js'
import { topics as TOPICS } from './stance-topics.js'
import { notify, vapidPublicKey } from './push.js'
import { loginChallenge, registerPasskey, registrationOptions, verifyLogin } from './passkeys.js'
import { AiError, aiFor, coach, sparJudge, sparReply, speechStats, transcribe } from './stance-ai.js'
import { pushText, tr } from './stance-i18n.js'

const API = '/stance/api'
// Question No. 1 is this day; after the last question the list starts again
const LAUNCH = '2026-10-17'
const ROUNDS = 3
const ROUND_NAMES = ['Opening', 'Rebuttal', 'Closing']
const LIMITS = { opinion: [20, 1500], reply: [2, 800], motion: [10, 160], context: [0, 400], turn: [40, 1500], bio: [0, 160], topic: [2, 160], spar: [20, 1500] }
// Practice lengths in seconds; recordings are stored in pieces because one D1 value holds at most 2 MB
const LENGTHS = [60, 180, 300]
const MAX_AUDIO = 6_000_000
const CHUNK = 900_000
const MAX_TOPICS = 200
// Argue back: new sparring rounds per person per 24 hours. Every AI call is also capped per day for everyone together.
const SPARS_PER_DAY = 3
const AI_DAY_CAP = { minute: 3000, spar: 2000 }

class HttpError extends Error {
  constructor(status, message, data) { super(message); this.status = status; this.data = data }
}
const fail = (status, message, data) => { throw new HttpError(status, message, data) }
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })

export async function stance(request, env, ctx, url) {
  const lang = request.headers.get('x-lang') === 'de' ? 'de' : 'en'
  try {
    return await route(request, env, ctx, url, lang)
  } catch (e) {
    if (e instanceof HttpError) return json({ error: tr(lang, e.message), ...(e.data || {}) }, e.status)
    console.error(e)
    return json({ error: tr(lang, 'Something went wrong') }, 500)
  }
}

async function route(request, env, ctx, url, lang) {
  const db = env.STANCE_DB
  const path = url.pathname.slice(API.length)
  const method = request.method
  const m = pattern => path.match(new RegExp('^' + pattern + '$'))
  const later = promise => ctx.waitUntil(promise.catch(e => console.error(e)))
  // Notifications are written in the recipient's language
  const push = (userId, key, vars, extra) => later((async () => {
    const u = await db.prepare('SELECT lang FROM users WHERE id = ?').bind(userId).first()
    if (u) await notify(env, userId, { ...pushText(u.lang, key, vars), ...extra }, db)
  })())
  const rp = { rpId: url.hostname, origin: url.origin }
  const ai = () => aiFor(env, url, request)
  let p

  // ---------- accounts ----------

  if (method === 'POST' && path === '/signup') {
    const b = await body(request)
    const handle = String(b.handle || '').toLowerCase().trim().replace(/^@/, '')
    if (!/^[a-z0-9_]{3,20}$/.test(handle)) fail(400, 'Usernames are 3–20 letters, numbers or _')
    const ipHash = await sha('ip:' + (request.headers.get('cf-connecting-ip') || 'local'))
    const recent = await db.prepare('SELECT COUNT(*) n FROM users WHERE ip_hash = ? AND created > ?').bind(ipHash, Date.now() - 86400_000).first('n')
    if (recent >= 30) fail(429, 'Too many new accounts from here today')
    if (await db.prepare('SELECT 1 FROM users WHERE handle = ?').bind(handle).first()) fail(409, `@${handle} is taken`)
    const key = newKey()
    const user = { id: rid(), handle, name: clean(b.name || handle, 1, 40, 'Name'), bio: '' }
    await db.prepare('INSERT INTO users (id, handle, name, bio, token_hash, ip_hash, created, lang) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(user.id, handle, user.name, '', await sha(key), ipHash, Date.now(), lang).run()
    return json({ key, user: publicUser(user) })
  }
  if (method === 'GET' && (p = m('/handles/(\\w+)'))) {
    const handle = p[1].toLowerCase()
    const valid = /^[a-z0-9_]{3,20}$/.test(handle)
    const taken = valid && !!(await db.prepare('SELECT 1 FROM users WHERE handle = ?').bind(handle).first())
    return json({ handle, valid, available: valid && !taken })
  }
  if (method === 'POST' && path === '/login') {
    const user = await userByKey(db, String((await body(request)).key || '').trim())
    if (!user) fail(401, 'That key does not match any account')
    return json({ user: publicUser(user) })
  }
  // Passkeys: shared with Yap in passkeys.js (server-issued challenges, deleted on use)
  if (method === 'POST' && path === '/passkeys/challenge') return json(await loginChallenge(db, rp))
  if (method === 'POST' && path === '/passkeys/login') {
    let stored
    try { stored = await verifyLogin(db, rp, await body(request)) } catch (e) { fail(e.status || 401, e.message) }
    const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(stored.user_id).first()
    if (!user) fail(401, 'That account was deleted')
    const key = newKey()
    await db.prepare('INSERT INTO sessions (token_hash, user_id, created) VALUES (?, ?, ?)').bind(await sha(key), user.id, Date.now()).run()
    return json({ key, user: publicUser(user) })
  }

  // Reading is open to guests; writing needs an account
  const open = method === 'GET' && (path === '/today' || path === '/archive' || path === '/debates'
    || /^\/questions\/[\w-]+$/.test(path) || /^\/opinions\/[\w-]+\/replies$/.test(path) || /^\/debates\/[\w-]+$/.test(path) || /^\/users\/\w+$/.test(path))
  const me = await userByKey(db, (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, ''))
  if (!me && !open) fail(401, 'Please sign in')
  const meId = me?.id || ''

  if (path === '/me') {
    if (method === 'GET') {
      if (me.lang !== lang) later(db.prepare('UPDATE users SET lang = ? WHERE id = ?').bind(lang, me.id).run())
      const r = await db.prepare(`SELECT (SELECT COUNT(*) FROM passkeys WHERE user_id = ?1) passkeys,
        (SELECT COUNT(*) FROM debates WHERE (status = 'active' AND turn_user = ?1) OR (status = 'pending' AND against_user = ?1)) waiting`).bind(me.id).first()
      return json({ user: publicUser(me), passkeys: r.passkeys, debatesWaiting: r.waiting })
    }
    if (method === 'PATCH') {
      const b = await body(request)
      const name = b.name != null ? clean(b.name, 1, 40, 'Name') : me.name
      const bio = b.bio != null ? clean(b.bio, ...LIMITS.bio, 'Bio') : me.bio
      await db.prepare('UPDATE users SET name = ?, bio = ? WHERE id = ?').bind(name, bio, me.id).run()
      return json({ user: publicUser({ ...me, name, bio }) })
    }
    if (method === 'DELETE') {
      // Your own words go. Other people's debates stay: live ones end with you forfeiting, finished ones keep
      // their turns and votes and show you as "Deleted". Challenges nobody else wrote in are removed.
      const now = Date.now()
      await db.batch([
        db.prepare('DELETE FROM points WHERE user_id = ?1 OR opinion_id IN (SELECT id FROM opinions WHERE user_id = ?1)').bind(me.id),
        db.prepare('DELETE FROM replies WHERE user_id = ?1 OR opinion_id IN (SELECT id FROM opinions WHERE user_id = ?1)').bind(me.id),
        db.prepare('UPDATE opinions SET convinced_by = NULL WHERE convinced_by IN (SELECT id FROM opinions WHERE user_id = ?1)').bind(me.id),
        db.prepare('DELETE FROM convinced_log WHERE user_id = ?1 OR opinion_id IN (SELECT id FROM opinions WHERE user_id = ?1)').bind(me.id),
        db.prepare('DELETE FROM opinions WHERE user_id = ?1').bind(me.id),
        db.prepare('DELETE FROM verdicts WHERE user_id = ?1').bind(me.id),
        db.prepare(`DELETE FROM turns WHERE debate_id IN (SELECT id FROM debates WHERE for_user = ?1 AND status IN ('open', 'pending', 'declined'))`).bind(me.id),
        db.prepare(`DELETE FROM debates WHERE for_user = ?1 AND status IN ('open', 'pending', 'declined')`).bind(me.id),
        db.prepare(`UPDATE debates SET status = 'declined', updated = ?2 WHERE against_user = ?1 AND status = 'pending'`).bind(me.id, now),
        db.prepare(`UPDATE debates SET status = 'closed', forfeit = CASE WHEN for_user = ?1 THEN 0 ELSE 1 END, turn_user = NULL, ended = ?2, updated = ?2
          WHERE (for_user = ?1 OR against_user = ?1) AND status = 'active'`).bind(me.id, now),
        db.prepare('DELETE FROM minute_audio WHERE minute_id IN (SELECT id FROM minutes WHERE user_id = ?1)').bind(me.id),
        db.prepare('DELETE FROM minutes WHERE user_id = ?1').bind(me.id),
        db.prepare('DELETE FROM user_topics WHERE user_id = ?1').bind(me.id),
        db.prepare('DELETE FROM spar_turns WHERE spar_id IN (SELECT id FROM spars WHERE user_id = ?1)').bind(me.id),
        db.prepare('DELETE FROM spars WHERE user_id = ?1').bind(me.id),
        db.prepare('DELETE FROM ai_usage WHERE user_id = ?1').bind(me.id),
        db.prepare('DELETE FROM push_subs WHERE user_id = ?1').bind(me.id),
        db.prepare('DELETE FROM sessions WHERE user_id = ?1').bind(me.id),
        db.prepare('DELETE FROM passkeys WHERE user_id = ?1').bind(me.id),
        db.prepare('DELETE FROM users WHERE id = ?1').bind(me.id),
      ])
      return json({ ok: true })
    }
  }

  // ---------- the daily question ----------

  if (method === 'GET' && path === '/today') {
    const payload = await questionPayload(db, me, todayQuestion(lang), url)
    if (me) payload.streak = await answerStreak(db, me.id)
    return json(payload)
  }
  if (method === 'GET' && path === '/archive') {
    const n = dayNumber(today())
    const days = []
    for (let i = n; i >= Math.max(1, n - 89); i--) days.push(questionFor(i, lang))
    const ids = days.map(q => q.id)
    const marks = ids.map((_, i) => '?' + (i + 2)).join(',')
    const { results } = await db.prepare(`SELECT question_id, COUNT(*) total, SUM(side) side1, MAX(CASE WHEN user_id = ?1 THEN side + 1 END) mine
      FROM opinions WHERE question_id IN (${marks}) GROUP BY question_id`).bind(meId, ...ids).all()
    return json({
      questions: days.map(q => {
        const r = results.find(x => x.question_id === q.id)
        return { ...q, total: r?.total || 0, counts: [(r?.total || 0) - (r?.side1 || 0), r?.side1 || 0], mine: r?.mine ? r.mine - 1 : null }
      }),
    })
  }
  if ((p = m('/questions/([\\w-]+)'))) {
    if (method === 'GET') return json(await questionPayload(db, me, askedQuestion(p[1], lang), url))
  }
  if ((p = m('/questions/([\\w-]+)/opinion'))) {
    const q = askedQuestion(p[1], lang)
    const mine = await db.prepare('SELECT * FROM opinions WHERE question_id = ? AND user_id = ?').bind(q.id, me.id).first()
    if (method === 'POST') {
      const b = await body(request)
      const text = clean(b.text, ...LIMITS.opinion, 'Your argument')
      const side = Number(b.side)
      if (side !== 0 && side !== 1) fail(400, 'Pick a side')
      if (mine) {
        // Changing sides is for being convinced; a fresh post may still fix a mis-tap for 10 minutes
        if (side !== mine.side && Date.now() - mine.created > 10 * 60_000) fail(400, 'To change sides, mark the argument that convinced you')
        await db.prepare('UPDATE opinions SET text = ?, side = ?, edited = ? WHERE id = ?').bind(text, side, Date.now(), mine.id).run()
      } else {
        const recent = await db.prepare('SELECT COUNT(*) n FROM opinions WHERE user_id = ? AND created > ?').bind(me.id, Date.now() - 3600_000).first('n')
        if (recent >= 30) fail(429, 'Slow down a little')
        await db.prepare('INSERT INTO opinions (id, question_id, user_id, side, text, created) VALUES (?, ?, ?, ?, ?, ?)').bind(rid(), q.id, me.id, side, text, Date.now()).run()
      }
      const payload = await questionPayload(db, me, q, url)
      if (payload.isToday) payload.streak = await answerStreak(db, me.id)
      return json(payload)
    }
    if (method === 'DELETE') {
      if (mine) {
        await db.batch([
          db.prepare('DELETE FROM points WHERE opinion_id = ?').bind(mine.id),
          db.prepare('DELETE FROM replies WHERE opinion_id = ?').bind(mine.id),
          db.prepare('UPDATE opinions SET convinced_by = NULL WHERE convinced_by = ?').bind(mine.id),
          db.prepare('DELETE FROM opinions WHERE id = ?').bind(mine.id),
        ])
      }
      return json(await questionPayload(db, me, q, url))
    }
  }
  if (method === 'POST' && (p = m('/opinions/([\\w-]+)/point'))) {
    const op = await opinionById(db, p[1])
    if (op.user_id === me.id) fail(400, "You can't mark your own argument")
    if (!(await hasAnswered(db, me.id, op.question_id))) fail(403, 'Take a side on this question first')
    const recent = await db.prepare('SELECT COUNT(*) n FROM points WHERE user_id = ? AND created > ?').bind(me.id, Date.now() - 3600_000).first('n')
    const had = await db.prepare('DELETE FROM points WHERE opinion_id = ? AND user_id = ? RETURNING 1').bind(op.id, me.id).first()
    if (!had) {
      if (recent >= 200) fail(429, 'Slow down a little')
      await db.prepare('INSERT INTO points (opinion_id, user_id, created) VALUES (?, ?, ?)').bind(op.id, me.id, Date.now()).run()
    }
    const points = await db.prepare('SELECT COUNT(*) n FROM points WHERE opinion_id = ?').bind(op.id).first('n')
    return json({ points, pointed: !had })
  }
  if (method === 'POST' && (p = m('/opinions/([\\w-]+)/convinced'))) {
    const op = await opinionById(db, p[1])
    const mine = await db.prepare('SELECT * FROM opinions WHERE question_id = ? AND user_id = ?').bind(op.question_id, me.id).first()
    if (!mine) fail(400, 'Take a side first')
    if (mine.side === op.side) fail(400, "You're already on that side")
    if (mine.convinced_by && mine.edited && Date.now() - mine.edited < 60_000) fail(429, 'Give it a minute before you switch again')
    await db.prepare('UPDATE opinions SET side = ?, convinced_by = ?, edited = ? WHERE id = ?').bind(op.side, op.id, Date.now(), mine.id).run()
    const q = askedQuestion(op.question_id, lang)
    // The author hears about it once per person, however often someone flips back and forth
    const first = await db.prepare('INSERT OR IGNORE INTO convinced_log (user_id, opinion_id, created) VALUES (?, ?, ?)').bind(me.id, op.id, Date.now()).run()
    if (first.meta.changes) push(op.user_id, 'convinced', { name: me.name, qid: q.id, side: op.side }, { url: `#q/${q.id}/${op.id}`, tag: 'convinced-' + op.id })
    return json(await questionPayload(db, me, q, url))
  }
  if ((p = m('/opinions/([\\w-]+)/replies'))) {
    const op = await opinionById(db, p[1])
    if (method === 'GET') {
      // Same rule as the question: you read the arguments once you've made yours
      if (op.user_id !== meId && !(me && await hasAnswered(db, me.id, op.question_id))) return json({ locked: true, questionId: op.question_id })
      const { results } = await db.prepare(`SELECT r.*, u.handle, u.name, u.bio, o.side FROM replies r JOIN users u ON u.id = r.user_id
        LEFT JOIN opinions o ON o.question_id = ?2 AND o.user_id = r.user_id WHERE r.opinion_id = ?1 ORDER BY r.created LIMIT 300`).bind(op.id, op.question_id).all()
      const [full] = await decorateOpinions(db, me, [op])
      return json({ opinion: full, replies: results.map(r => reply(r, me)) })
    }
    if (method === 'POST') {
      const mine = await db.prepare('SELECT side FROM opinions WHERE question_id = ? AND user_id = ?').bind(op.question_id, me.id).first()
      if (!mine) fail(400, 'Take a side on the question before you argue')
      const text = clean((await body(request)).text, ...LIMITS.reply, 'Your reply')
      const recent = await db.prepare('SELECT COUNT(*) n FROM replies WHERE user_id = ? AND created > ?').bind(me.id, Date.now() - 3600_000).first('n')
      if (recent >= 60) fail(429, 'Slow down a little')
      const r = { id: rid(), opinion_id: op.id, user_id: me.id, text, created: Date.now() }
      await db.prepare('INSERT INTO replies (id, opinion_id, user_id, text, created) VALUES (?, ?, ?, ?, ?)').bind(r.id, op.id, me.id, text, r.created).run()
      if (op.user_id !== me.id) push(op.user_id, 'reply', { name: me.name, text: text.slice(0, 140) }, { url: `#q/${op.question_id}/${op.id}`, tag: 'replies-' + op.id })
      return json({ reply: reply({ ...r, handle: me.handle, name: me.name, bio: me.bio, side: mine.side }, me) })
    }
  }
  if (method === 'DELETE' && (p = m('/replies/([\\w-]+)'))) {
    await db.prepare('DELETE FROM replies WHERE id = ? AND user_id = ?').bind(p[1], me.id).run()
    return json({ ok: true })
  }

  // ---------- Argue back ----------

  if ((p = m('/questions/([\\w-]+)/spar'))) {
    const q = askedQuestion(p[1], lang)
    const latest = () => db.prepare('SELECT * FROM spars WHERE user_id = ? AND question_id = ? ORDER BY created DESC LIMIT 1').bind(me.id, q.id).first()
    if (method === 'GET') {
      const s = await latest()
      return json({ spar: s ? await sparPayload(db, s) : null, left: await sparsLeft(db, me.id) })
    }
    if (method === 'POST') {
      const mine = await db.prepare('SELECT * FROM opinions WHERE question_id = ? AND user_id = ?').bind(q.id, me.id).first()
      if (!mine) fail(400, 'Take a side first')
      const current = await latest()
      if (current && current.status !== 'judged' && current.side === mine.side) return json({ spar: await sparPayload(db, current), left: await sparsLeft(db, me.id) })
      if ((await sparsLeft(db, me.id)) <= 0) fail(429, 'That was today\'s last round of Argue back. More tomorrow')
      await aiBudget(db, 'spar')
      const now = Date.now(), id = rid()
      await db.batch([
        db.prepare('INSERT INTO spars (id, user_id, question_id, side, lang, status, created, updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(id, me.id, q.id, mine.side, lang, 'thinking', now, now),
        db.prepare('INSERT INTO spar_turns (id, spar_id, n, role, text, created) VALUES (?, ?, 1, ?, ?, ?)').bind(rid(), id, 'you', mine.text, now),
      ])
      const s = await db.prepare('SELECT * FROM spars WHERE id = ?').bind(id).first()
      return json({ spar: await sparStep(db, ai(), me, s, lang), left: await sparsLeft(db, me.id) })
    }
  }
  if ((p = m('/spars/([\\w-]+)(/turns|/continue)?'))) {
    const s = await db.prepare('SELECT * FROM spars WHERE id = ? AND user_id = ?').bind(p[1], me.id).first()
    if (!s) fail(404, 'Not found')
    if (method === 'GET' && !p[2]) return json({ spar: await sparPayload(db, s), left: await sparsLeft(db, me.id) })
    if (method === 'POST' && p[2] === '/turns') {
      const text = clean((await body(request)).text, ...LIMITS.spar, 'Your reply')
      const { results: turns } = await db.prepare('SELECT role FROM spar_turns WHERE spar_id = ? ORDER BY n').bind(s.id).all()
      if (s.status !== 'open' || turns[turns.length - 1]?.role !== 'them' || turns.filter(t => t.role === 'you').length >= ROUNDS) fail(400, "It's not your turn")
      // Claim the turn first so a double tap can't post twice
      const claimed = await db.prepare(`UPDATE spars SET status = 'thinking', updated = ? WHERE id = ? AND status = 'open'`).bind(Date.now(), s.id).run()
      if (!claimed.meta.changes) fail(409, "It's not your turn")
      await db.prepare('INSERT INTO spar_turns (id, spar_id, n, role, text, created) VALUES (?, ?, ?, ?, ?, ?)').bind(rid(), s.id, turns.length + 1, 'you', text, Date.now()).run()
      await aiBudget(db, 'spar').catch(e => { later(db.prepare(`UPDATE spars SET status = 'thinking' WHERE id = ?`).bind(s.id).run()); throw e })
      return json({ spar: await sparStep(db, ai(), me, { ...s, status: 'thinking' }, lang), left: await sparsLeft(db, me.id) })
    }
    if (method === 'POST' && p[2] === '/continue') {
      if (s.status !== 'thinking') return json({ spar: await sparPayload(db, s), left: await sparsLeft(db, me.id) })
      await aiBudget(db, 'spar')
      return json({ spar: await sparStep(db, ai(), me, s, lang), left: await sparsLeft(db, me.id) })
    }
  }

  // ---------- debates ----------

  if (method === 'GET' && path === '/debates') {
    const tab = url.searchParams.get('tab') || 'live'
    if (tab === 'mine' && !me) fail(401, 'Please sign in')
    const where = {
      mine: '(d.for_user = ?1 OR d.against_user = ?1)',
      open: "d.status = 'open'",
      live: "d.status = 'active'",
      closed: "d.status = 'closed'",
    }[tab]
    if (!where) fail(400, 'Unknown list')
    const q = db.prepare(`SELECT d.* FROM debates d WHERE ${where} ORDER BY d.updated DESC LIMIT 50`)
    const { results } = await (tab === 'mine' ? q.bind(me.id) : q).all()
    return json({ debates: await decorateDebates(db, me, results, lang) })
  }
  if (method === 'POST' && path === '/debates') {
    const b = await body(request)
    let motion, questionId = null, qSide = null
    let opponent = null
    if (b.opponent) {
      opponent = await userByHandle(db, b.opponent)
      if (opponent.id === me.id) fail(400, "You can't debate yourself")
    }
    if (b.questionId) {
      // A debate on a daily question: you argue the side you took, they argue the side they took
      const q = askedQuestion(String(b.questionId), lang)
      const mine = await db.prepare('SELECT side FROM opinions WHERE question_id = ? AND user_id = ?').bind(q.id, me.id).first()
      if (!mine) fail(400, 'Take a side first')
      if (opponent) {
        const theirs = await db.prepare('SELECT side FROM opinions WHERE question_id = ? AND user_id = ?').bind(q.id, opponent.id).first()
        if (theirs && theirs.side === mine.side) fail(400, 'You are both on the same side of this one')
      }
      questionId = q.id
      qSide = mine.side
      motion = questionInfo(q.id, 'en').question.slice(0, LIMITS.motion[1])
    } else motion = clean(b.motion, ...LIMITS.motion, 'The motion')
    const context = questionId ? '' : clean(b.context || '', ...LIMITS.context, 'The context')
    const opening = clean(b.opening, ...LIMITS.turn, 'Your opening')
    const recent = await db.prepare('SELECT COUNT(*) n FROM debates WHERE for_user = ? AND created > ?').bind(me.id, Date.now() - 86400_000).first('n')
    if (recent >= 10) fail(429, 'Ten new debates a day is the limit')
    const now = Date.now(), id = rid()
    await db.batch([
      db.prepare('INSERT INTO debates (id, motion, context, for_user, against_user, status, turn_user, created, updated, question_id, q_side) VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?)')
        .bind(id, motion, context, me.id, opponent?.id || null, opponent ? 'pending' : 'open', now, now, questionId, qSide),
      db.prepare('INSERT INTO turns (id, debate_id, user_id, round, text, created) VALUES (?, ?, ?, 1, ?, ?)').bind(rid(), id, me.id, opening, now),
    ])
    if (opponent) push(opponent.id, 'challenge', { name: me.name, motion: motionFor({ motion, question_id: questionId }, 'en'), qid: questionId, motionRaw: motion }, { url: `#debate/${id}`, tag: 'debate-' + id })
    return json(await debatePayload(db, me, id, lang))
  }
  if ((p = m('/debates/([\\w-]+)'))) {
    if (method === 'GET') return json(await debatePayload(db, me, p[1], lang))
    if (method === 'DELETE') {
      const d = await debateById(db, p[1])
      if (d.for_user !== me.id || !['open', 'pending', 'declined'].includes(d.status)) fail(400, 'Only a challenge nobody has accepted yet can be withdrawn')
      await db.batch([db.prepare('DELETE FROM turns WHERE debate_id = ?').bind(d.id), db.prepare('DELETE FROM debates WHERE id = ?').bind(d.id)])
      return json({ ok: true })
    }
  }
  if (method === 'POST' && (p = m('/debates/([\\w-]+)/(accept|decline|reopen)'))) {
    const d = await debateById(db, p[1])
    const now = Date.now()
    const vars = { name: me.name, motionRaw: d.motion, qid: d.question_id }
    if (p[2] === 'accept') {
      if (d.for_user === me.id) fail(400, "You can't accept your own challenge")
      if (d.status === 'pending' && d.against_user !== me.id) fail(403, 'This challenge is for someone else')
      if (d.status !== 'pending' && d.status !== 'open') fail(400, 'This debate has already started')
      const ok = await db.prepare(`UPDATE debates SET status = 'active', against_user = ?1, turn_user = ?1, started = ?2, updated = ?2 WHERE id = ?3 AND status IN ('open', 'pending')`)
        .bind(me.id, now, d.id).run()
      if (!ok.meta.changes) fail(409, 'Someone else just accepted it')
      push(d.for_user, 'accepted', vars, { url: `#debate/${d.id}`, tag: 'debate-' + d.id })
    } else if (p[2] === 'decline') {
      if (d.status !== 'pending' || d.against_user !== me.id) fail(400, 'Nothing to decline')
      await db.prepare(`UPDATE debates SET status = 'declined', updated = ? WHERE id = ?`).bind(now, d.id).run()
      push(d.for_user, 'declined', vars, { url: `#debate/${d.id}`, tag: 'debate-' + d.id })
    } else {
      // A declined challenge becomes an open one, opening and all
      if (d.for_user !== me.id || d.status !== 'declined') fail(400, 'Only a declined challenge can be posted as an open one')
      await db.prepare(`UPDATE debates SET status = 'open', against_user = NULL, updated = ? WHERE id = ?`).bind(now, d.id).run()
    }
    return json(await debatePayload(db, me, d.id, lang))
  }
  if (method === 'POST' && (p = m('/debates/([\\w-]+)/turns'))) {
    const d = await debateById(db, p[1])
    if (d.status !== 'active' || d.turn_user !== me.id) fail(400, "It's not your turn")
    const text = clean((await body(request)).text, ...LIMITS.turn, 'Your argument')
    const { results: turns } = await db.prepare('SELECT user_id FROM turns WHERE debate_id = ?').bind(d.id).all()
    const n = turns.length + 1
    const round = Math.ceil(n / 2), now = Date.now()
    const done = n >= ROUNDS * 2
    const other = me.id === d.for_user ? d.against_user : d.for_user
    const ok = await db.prepare(`UPDATE debates SET turn_user = ?, status = ?, ended = ?, updated = ? WHERE id = ? AND turn_user = ? AND status = 'active'`)
      .bind(done ? null : other, done ? 'closed' : 'active', done ? now : null, now, d.id, me.id).run()
    if (!ok.meta.changes) fail(409, "It's not your turn")
    await db.prepare('INSERT INTO turns (id, debate_id, user_id, round, text, created) VALUES (?, ?, ?, ?, ?, ?)').bind(rid(), d.id, me.id, round, text, now).run()
    const vars = { name: me.name, motionRaw: d.motion, qid: d.question_id, next: Math.ceil((n + 1) / 2) - 1, made: round - 1 }
    push(other, done ? 'finished' : 'yourTurn', vars, { url: `#debate/${d.id}`, tag: 'debate-' + d.id })
    return json(await debatePayload(db, me, d.id, lang))
  }
  if (method === 'POST' && (p = m('/debates/([\\w-]+)/verdict'))) {
    const d = await debateById(db, p[1])
    if (d.status !== 'closed') fail(400, 'Voting opens when the debate ends')
    if (d.forfeit != null) fail(400, 'This debate was decided by a forfeit')
    if (d.for_user === me.id || d.against_user === me.id) fail(400, "Debaters can't vote on their own debate")
    const side = Number((await body(request)).side)
    if (side !== 0 && side !== 1) fail(400, 'Pick a side')
    await db.prepare('INSERT OR REPLACE INTO verdicts (debate_id, user_id, side, created) VALUES (?, ?, ?, ?)').bind(d.id, me.id, side, Date.now()).run()
    return json(await debatePayload(db, me, d.id, lang))
  }

  // ---------- Practice (The Minute) ----------

  if (path === '/topics') {
    if (method === 'GET') return json({ topics: await myTopics(db, me.id) })
    if (method === 'POST') {
      // One topic per line, so a whole list from school can be pasted at once
      const lines = String((await body(request)).text || '').split(/\r?\n/).map(s => s.replace(/^\s*(?:[-*•–]|\d+[.)])\s*/, '').trim()).filter(Boolean)
      if (!lines.length) fail(400, 'Write a topic first')
      const have = await myTopics(db, me.id)
      const seen = new Set(have.map(t => t.text.toLowerCase()))
      const fresh = []
      for (const line of lines) {
        const text = clean(line, ...LIMITS.topic, 'A topic')
        if (seen.has(text.toLowerCase())) continue
        seen.add(text.toLowerCase())
        fresh.push(text)
      }
      if (have.length + fresh.length > MAX_TOPICS) fail(400, `Up to ${MAX_TOPICS} topics`)
      const now = Date.now()
      if (fresh.length) await db.batch(fresh.map((t, i) => db.prepare('INSERT INTO user_topics (id, user_id, text, created) VALUES (?, ?, ?, ?)').bind(rid(), me.id, t, now + i)))
      return json({ topics: await myTopics(db, me.id), added: fresh.length })
    }
  }
  if (method === 'DELETE' && (p = m('/topics/([\\w-]+)'))) {
    await db.prepare('DELETE FROM user_topics WHERE id = ? AND user_id = ?').bind(p[1], me.id).run()
    return json({ topics: await myTopics(db, me.id) })
  }
  if (method === 'GET' && path === '/minute/topic') {
    const tlang = url.searchParams.get('lang') === 'de' ? 'de' : 'en'
    const { results } = await db.prepare('SELECT topic FROM minutes WHERE user_id = ? ORDER BY created DESC LIMIT 60').bind(me.id).all()
    const used = new Set(results.map(r => r.topic))
    let pool
    if (url.searchParams.get('source') === 'mine') {
      pool = (await myTopics(db, me.id)).map(t => t.text)
      if (!pool.length) fail(400, 'Add some topics first')
    } else pool = TOPICS[tlang].map(t => t.text)
    const skip = String(url.searchParams.get('skip') || '')
    const fresh = pool.filter(t => !used.has(t) && t !== skip)
    const from = fresh.length ? fresh : pool.filter(t => t !== skip).length ? pool.filter(t => t !== skip) : pool
    return json({ topic: from[Math.floor(Math.random() * from.length)] })
  }
  if (path === '/minutes') {
    if (method === 'GET') {
      const { results } = await db.prepare('SELECT id, topic, mime, duration, transcript, words, fillers, feedback, day, created, lang, length, status FROM minutes WHERE user_id = ? ORDER BY created DESC LIMIT 200').bind(me.id).all()
      return json({ minutes: results.map(minute), streak: streak(results.filter(r => r.status === 'done').map(r => r.day)) })
    }
    if (method === 'POST') {
      const recent = await db.prepare('SELECT COUNT(*) n FROM minutes WHERE user_id = ? AND created > ?').bind(me.id, Date.now() - 3600_000).first('n')
      if (recent >= 20) fail(429, 'Twenty talks an hour is plenty. Take a break')
      const form = await request.formData()
      const file = form.get('audio')
      if (!file || typeof file === 'string') fail(400, 'No recording attached')
      if (file.size > MAX_AUDIO) fail(413, 'That recording is too long')
      if (file.size < 200) fail(400, 'That recording is empty')
      const mime = (file.type || 'audio/webm').split(';')[0]
      if (!/^audio\/(webm|mp4|ogg|mpeg|aac|x-m4a|wav)$/.test(mime)) fail(400, 'Unsupported audio format')
      const topic = clean(form.get('topic'), 1, 160, 'The topic')
      const length = LENGTHS.includes(Number(form.get('length'))) ? Number(form.get('length')) : 60
      const mlang = form.get('lang') === 'de' ? 'de' : 'en'
      const duration = Math.min(Math.max(Number(form.get('duration')) || 0, 1), length + 10)
      const audio = await file.arrayBuffer()
      // The recording is saved before anything is analysed, so a failed analysis never loses it
      const row = { id: rid(), user_id: me.id, topic, mime, duration, transcript: null, words: 0, fillers: 0, feedback: null, day: today(), created: Date.now(), lang: mlang, length, status: 'failed' }
      const bytes = new Uint8Array(audio)
      const parts = []
      for (let i = 0, seq = 0; i < bytes.length; i += CHUNK, seq++) parts.push(db.prepare('INSERT INTO minute_audio (minute_id, seq, data) VALUES (?, ?, ?)').bind(row.id, seq, bytes.subarray(i, i + CHUNK)))
      await db.batch([
        db.prepare('INSERT INTO minutes (id, user_id, topic, audio, mime, duration, transcript, words, fillers, feedback, day, created, lang, length, status) VALUES (?, ?, ?, NULL, ?, ?, NULL, 0, 0, NULL, ?, ?, ?, ?, ?)')
          .bind(row.id, me.id, topic, mime, duration, row.day, row.created, mlang, length, 'failed'),
        ...parts,
      ])
      return json({ minute: minute(await analyse(db, ai(), row, audio)) })
    }
  }
  if (method === 'POST' && (p = m('/minutes/([\\w-]+)/analyse'))) {
    const row = await db.prepare('SELECT * FROM minutes WHERE id = ? AND user_id = ?').bind(p[1], me.id).first()
    if (!row) fail(404, 'Not found')
    // Already analysed with a coach's note: nothing to redo. A missing note (the coach call failed) can be retried.
    if (row.status === 'done' && JSON.parse(row.feedback || 'null')?.scores) return json({ minute: minute(row) })
    const recent = await db.prepare(`SELECT COUNT(*) n FROM ai_usage WHERE user_id = ? AND kind = 'minute' AND created > ?`).bind(me.id, Date.now() - 3600_000).first('n')
    if (recent >= 40) fail(429, 'Slow down a little')
    const audio = await minuteAudio(db, row)
    if (!audio) fail(404, 'Not found')
    return json({ minute: minute(await analyse(db, ai(), row, audio)) })
  }
  if (method === 'DELETE' && (p = m('/minutes/([\\w-]+)'))) {
    await db.batch([
      db.prepare('DELETE FROM minute_audio WHERE minute_id = (SELECT id FROM minutes WHERE id = ?1 AND user_id = ?2)').bind(p[1], me.id),
      db.prepare('DELETE FROM minutes WHERE id = ? AND user_id = ?').bind(p[1], me.id),
    ])
    return json({ ok: true })
  }
  if (method === 'GET' && (p = m('/audio/minute/([\\w-]+)'))) {
    const row = await db.prepare('SELECT id, audio, mime FROM minutes WHERE id = ? AND user_id = ?').bind(p[1], me.id).first()
    const audio = row && await minuteAudio(db, row)
    if (!audio) fail(404, 'Not found')
    return new Response(audio, { headers: { 'content-type': row.mime, 'cache-control': 'private, max-age=31536000, immutable' } })
  }

  // ---------- people ----------

  if (method === 'GET' && path === '/users') {
    const q = (url.searchParams.get('q') || '').toLowerCase().replace(/^@/, '').replace(/[^\p{L}\p{N}_ ]/gu, '').trim()
    if (!q) return json({ users: [] })
    const { results } = await db.prepare('SELECT * FROM users WHERE (handle LIKE ?1 OR lower(name) LIKE ?2) AND id != ?3 ORDER BY length(handle) LIMIT 12').bind(q + '%', '%' + q + '%', me.id).all()
    return json({ users: results.map(publicUser) })
  }
  if (method === 'GET' && (p = m('/users/(\\w+)'))) {
    const user = await userByHandle(db, p[1])
    const [stats, ops, debates] = await db.batch([
      db.prepare(`SELECT
        (SELECT COUNT(*) FROM opinions WHERE user_id = ?1) opinions,
        (SELECT COUNT(*) FROM points pt JOIN opinions o ON o.id = pt.opinion_id WHERE o.user_id = ?1) points,
        (SELECT COUNT(*) FROM opinions c JOIN opinions o ON o.id = c.convinced_by WHERE o.user_id = ?1) convinced,
        (SELECT COUNT(*) FROM debates WHERE (for_user = ?1 OR against_user = ?1) AND status = 'closed') debates,
        (SELECT COUNT(*) FROM debates d WHERE d.status = 'closed' AND (d.for_user = ?1 OR d.against_user = ?1) AND (
          (d.forfeit IS NOT NULL AND d.forfeit = CASE WHEN d.for_user = ?1 THEN 1 ELSE 0 END)
          OR (d.forfeit IS NULL AND (SELECT SUM(CASE WHEN (v.side = 0) = (d.for_user = ?1) THEN 1 ELSE -1 END) FROM verdicts v WHERE v.debate_id = d.id) > 0))) wins`).bind(user.id),
      db.prepare('SELECT * FROM opinions WHERE user_id = ? ORDER BY created DESC LIMIT 30').bind(user.id),
      db.prepare(`SELECT * FROM debates WHERE (for_user = ?1 OR against_user = ?1) AND status IN ('active', 'closed') ORDER BY updated DESC LIMIT 20`).bind(user.id),
    ])
    // Only arguments on questions the viewer has answered are shown, so nobody is nudged before thinking
    const answered = new Set(me ? (await db.prepare('SELECT question_id FROM opinions WHERE user_id = ?').bind(me.id).all()).results.map(r => r.question_id) : [])
    const visible = ops.results.filter(o => user.id === meId || answered.has(o.question_id))
    return json({
      user: publicUser(user), me: user.id === meId,
      stats: stats.results[0],
      opinions: (await decorateOpinions(db, me, visible)).map(o => ({ ...o, question: questionInfo(o.questionId, lang) })),
      hidden: ops.results.length - visible.length,
      debates: await decorateDebates(db, me, debates.results, lang),
    })
  }

  // ---------- notifications and passkeys ----------

  if (method === 'GET' && path === '/push/key') return json({ key: vapidPublicKey(env) })
  if (path === '/push') {
    const b = await body(request)
    const endpoint = String(b.endpoint || '')
    if (!/^https:\/\/[^\s]{10,900}$/.test(endpoint)) fail(400, 'Bad subscription')
    if (method === 'POST') {
      const { p256dh, auth: secret } = b.keys || {}
      if (!/^[\w-]{80,100}$/.test(p256dh || '') || !/^[\w-]{16,30}$/.test(secret || '')) fail(400, 'Bad subscription')
      await db.batch([
        db.prepare('INSERT OR REPLACE INTO push_subs (endpoint, user_id, p256dh, auth, created) VALUES (?, ?, ?, ?, ?)').bind(endpoint, me.id, p256dh, secret, Date.now()),
        db.prepare('DELETE FROM push_subs WHERE user_id = ?1 AND endpoint NOT IN (SELECT endpoint FROM push_subs WHERE user_id = ?1 ORDER BY created DESC LIMIT 8)').bind(me.id),
      ])
      return json({ ok: true })
    }
    if (method === 'DELETE') {
      await db.prepare('DELETE FROM push_subs WHERE endpoint = ? AND user_id = ?').bind(endpoint, me.id).run()
      return json({ ok: true })
    }
  }
  if (method === 'POST' && path === '/push/test') {
    await notify(env, me.id, { ...pushText(lang, 'test', {}), url: '#today', tag: 'test' }, db)
    return json({ ok: true })
  }
  // Saving a passkey: the client asks for options first (a challenge bound to this account), and a passkey
  // that already belongs to someone else is refused instead of overwritten
  if (method === 'POST' && path === '/passkeys/options') return json(await registrationOptions(db, rp, me))
  if (method === 'POST' && path === '/passkeys') {
    let count
    try { count = await registerPasskey(db, rp, me.id, await body(request)) } catch (e) { fail(e.status || 400, e.message) }
    return json({ ok: true, passkeys: count })
  }
  // Sign out: this device's key stops working on the server (the sign-up key is replaced, a passkey session is deleted)
  if (method === 'DELETE' && path === '/session') {
    const kh = await sha((request.headers.get('authorization') || '').replace(/^Bearer\s+/i, ''))
    await db.batch([
      db.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(kh),
      db.prepare('UPDATE users SET token_hash = ? WHERE id = ? AND token_hash = ?').bind(await sha('signed-out:' + rid() + rid()), me.id, kh),
    ])
    return json({ ok: true })
  }

  fail(404, 'Not found')
}

// ---------- questions ----------

// The day in central Europe (YYYY-MM-DD); everyone gets the same question that day
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(new Date())
const berlinDay = t => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(new Date(t))
const prevDay = d => new Date(Date.parse(d) - 86400_000).toISOString().slice(0, 10)
const dayNumber = day => Math.round((Date.parse(day) - Date.parse(LAUNCH)) / 86400_000) + 1
const dayOf = n => new Date(Date.parse(LAUNCH) + (n - 1) * 86400_000).toISOString().slice(0, 10)
const localize = (q, lang) => {
  const de = lang === 'de' && questionsDe[q.id]
  return de ? { ...q, title: de.title, question: de.question, context: de.context, sides: de.sides } : q
}
const questionFor = (n, lang) => {
  const q = localize(questions[(((n - 1) % questions.length) + questions.length) % questions.length], lang)
  return { id: q.id, number: n, day: dayOf(n), title: q.title, question: q.question, context: q.context, sides: q.sides, thinkers: q.thinkers }
}
const todayQuestion = lang => questionFor(dayNumber(today()), lang)
// A question by id, as long as its day has come (the most recent time it was asked)
function askedQuestion(id, lang) {
  const i = questions.findIndex(q => q.id === id)
  if (i < 0) fail(404, 'No such question')
  const now = dayNumber(today())
  let n = i + 1
  while (n + questions.length <= now) n += questions.length
  if (n > now) fail(404, 'That question has not been asked yet')
  return questionFor(n, lang)
}
const questionInfo = (id, lang) => {
  const raw = questions.find(x => x.id === id)
  if (!raw) return null
  const q = localize(raw, lang)
  return { id: q.id, title: q.title, question: q.question, sides: q.sides }
}

const hasAnswered = async (db, userId, questionId) => !!(await db.prepare('SELECT 1 FROM opinions WHERE question_id = ? AND user_id = ?').bind(questionId, userId).first())

// Days in a row with at least one argument posted, ending today or yesterday (Berlin time)
async function answerStreak(db, userId) {
  const { results } = await db.prepare('SELECT created FROM opinions WHERE user_id = ? ORDER BY created DESC LIMIT 400').bind(userId).all()
  const days = new Set(results.map(r => berlinDay(r.created)))
  let n = 0, d = today()
  if (!days.has(d)) d = prevDay(d)
  while (days.has(d)) { n++; d = prevDay(d) }
  return { days: n, today: days.has(today()) }
}

// Everything the question screen needs. Other people's arguments only once you've given yours.
async function questionPayload(db, me, q, url) {
  const sort = url.searchParams.get('sort') === 'new' ? 'new' : 'top'
  const [counts, mineRow] = await db.batch([
    db.prepare('SELECT side, COUNT(*) n FROM opinions WHERE question_id = ? GROUP BY side').bind(q.id),
    db.prepare('SELECT * FROM opinions WHERE question_id = ? AND user_id = ?').bind(q.id, me?.id || ''),
  ])
  const c = [0, 0]
  for (const r of counts.results) c[r.side] = r.n
  const mine = mineRow.results[0]
  let opinions = []
  if (mine) {
    const order = sort === 'new' ? 'o.created DESC'
      : '(SELECT COUNT(*) FROM points WHERE opinion_id = o.id) + 2 * (SELECT COUNT(*) FROM opinions c WHERE c.convinced_by = o.id) DESC, o.created DESC'
    const { results } = await db.prepare(`SELECT o.* FROM opinions o WHERE o.question_id = ? AND o.user_id != ? ORDER BY ${order} LIMIT 200`).bind(q.id, me.id).all()
    opinions = await decorateOpinions(db, me, results)
  }
  const [mineFull] = mine ? await decorateOpinions(db, me, [mine]) : [null]
  return { question: q, counts: c, total: c[0] + c[1], mine: mineFull, opinions, sort, isToday: q.number === dayNumber(today()), guest: !me }
}

async function opinionById(db, id) {
  const op = await db.prepare('SELECT * FROM opinions WHERE id = ?').bind(id).first()
  if (!op) fail(404, 'That argument was deleted')
  return op
}

const DELETED = { handle: 'deleted', name: 'Deleted', bio: '' }

async function decorateOpinions(db, me, rows) {
  if (!rows.length) return []
  const meId = me?.id || ''
  const ids = rows.map(r => r.id), userIds = [...new Set(rows.map(r => r.user_id))]
  const marks = ids.map((_, i) => '?' + (i + 2)).join(',')
  const umarks = userIds.map((_, i) => '?' + (i + 1)).join(',')
  const [points, replies, convinced, users, convincers] = await db.batch([
    db.prepare(`SELECT opinion_id, COUNT(*) n, MAX(user_id = ?1) mine FROM points WHERE opinion_id IN (${marks}) GROUP BY opinion_id`).bind(meId, ...ids),
    db.prepare(`SELECT opinion_id, COUNT(*) n FROM replies WHERE opinion_id IN (${marks}) GROUP BY opinion_id`).bind(meId, ...ids),
    db.prepare(`SELECT convinced_by, COUNT(*) n FROM opinions WHERE convinced_by IN (${marks}) GROUP BY convinced_by`).bind(meId, ...ids),
    db.prepare(`SELECT * FROM users WHERE id IN (${umarks})`).bind(...userIds),
    db.prepare(`SELECT o.id, o.text, u.handle, u.name FROM opinions o JOIN users u ON u.id = o.user_id WHERE o.id IN (SELECT convinced_by FROM opinions WHERE id IN (${marks}))`).bind(meId, ...ids),
  ])
  return rows.map(r => {
    const by = r.convinced_by && convincers.results.find(x => x.id === r.convinced_by)
    return {
      id: r.id, questionId: r.question_id, side: r.side, text: r.text, created: r.created, edited: r.edited,
      user: publicUser(users.results.find(u => u.id === r.user_id) || DELETED),
      mine: r.user_id === meId,
      points: points.results.find(x => x.opinion_id === r.id)?.n || 0,
      pointed: !!points.results.find(x => x.opinion_id === r.id)?.mine,
      replies: replies.results.find(x => x.opinion_id === r.id)?.n || 0,
      convinced: convinced.results.find(x => x.convinced_by === r.id)?.n || 0,
      convincedBy: by ? { opinionId: by.id, handle: by.handle, name: by.name, text: by.text } : null,
    }
  })
}

const reply = (r, me) => ({ id: r.id, user: publicUser(r), side: r.side ?? null, text: r.text, created: r.created, mine: r.user_id === (me?.id || '') })

// ---------- Argue back ----------

async function sparsLeft(db, userId) {
  const n = await db.prepare('SELECT COUNT(*) n FROM spars WHERE user_id = ? AND created > ?').bind(userId, Date.now() - 86400_000).first('n')
  return Math.max(0, SPARS_PER_DAY - n)
}

async function sparPayload(db, s, extra = {}) {
  const { results } = await db.prepare('SELECT role, text, created FROM spar_turns WHERE spar_id = ? ORDER BY n').bind(s.id).all()
  return {
    id: s.id, questionId: s.question_id, side: s.side, status: s.status, created: s.created,
    turns: results, rounds: ROUNDS, yourTurns: results.filter(t => t.role === 'you').length,
    verdict: s.verdict ? JSON.parse(s.verdict) : null, ...extra,
  }
}

/** Runs whatever the sparring partner owes: a reply, or the judge after your third turn. On failure the spar stays 'thinking'. */
async function sparStep(db, ai, me, s, lang) {
  const q = askedQuestion(s.question_id, s.lang)
  const { results: turns } = await db.prepare('SELECT role, text FROM spar_turns WHERE spar_id = ? ORDER BY n').bind(s.id).all()
  const yours = turns.filter(t => t.role === 'you').length
  try {
    await logAi(db, me.id, 'spar')
    if (yours >= ROUNDS) {
      const verdict = await sparJudge(ai, { q, side: s.side, turns, lang })
      await db.prepare(`UPDATE spars SET status = 'judged', verdict = ?, updated = ? WHERE id = ?`).bind(JSON.stringify(verdict), Date.now(), s.id).run()
    } else {
      const text = await sparReply(ai, { q, side: s.side, turns, lang: s.lang })
      await db.batch([
        db.prepare('INSERT INTO spar_turns (id, spar_id, n, role, text, created) VALUES (?, ?, ?, ?, ?, ?)').bind(rid(), s.id, turns.length + 1, 'them', text, Date.now()),
        db.prepare(`UPDATE spars SET status = 'open', updated = ? WHERE id = ?`).bind(Date.now(), s.id),
      ])
    }
  } catch (e) {
    if (!(e instanceof AiError)) throw e
    await db.prepare(`UPDATE spars SET status = 'thinking', updated = ? WHERE id = ?`).bind(Date.now(), s.id).run()
    return sparPayload(db, { ...s, status: 'thinking' }, { failed: true })
  }
  return sparPayload(db, await db.prepare('SELECT * FROM spars WHERE id = ?').bind(s.id).first())
}

async function logAi(db, userId, kind) {
  await db.prepare('INSERT INTO ai_usage (user_id, kind, created) VALUES (?, ?, ?)').bind(userId, kind, Date.now()).run()
}
// Everyone together stays under a daily cap, so a runaway night can't run up Greta's bill
async function aiBudget(db, kind) {
  const n = await db.prepare('SELECT COUNT(*) n FROM ai_usage WHERE kind = ? AND created > ?').bind(kind, Date.now() - 86400_000).first('n')
  if (n >= AI_DAY_CAP[kind]) fail(429, 'Agora is very busy today. Try again tomorrow')
  if (Math.random() < 0.02) await db.prepare('DELETE FROM ai_usage WHERE created < ?').bind(Date.now() - 3 * 86400_000).run()
}

// ---------- debates ----------

async function debateById(db, id) {
  const d = await db.prepare('SELECT * FROM debates WHERE id = ?').bind(id).first()
  if (!d) fail(404, 'That debate is gone')
  return d
}

// A debate on a daily question reads in the viewer's language
const motionFor = (d, lang) => (d.question_id && questionInfo(d.question_id, lang)?.question) || d.motion
const labelsFor = (d, lang) => {
  if (!d.question_id || d.q_side == null) return null
  const sides = questionInfo(d.question_id, lang)?.sides
  return sides ? [sides[d.q_side], sides[1 - d.q_side]] : null
}

async function decorateDebates(db, me, rows, lang) {
  if (!rows.length) return []
  const meId = me?.id || ''
  const ids = rows.map(r => r.id)
  const userIds = [...new Set(rows.flatMap(r => [r.for_user, r.against_user]).filter(Boolean))]
  const marks = ids.map((_, i) => '?' + (i + 2)).join(',')
  const [turns, verdicts, users] = await db.batch([
    db.prepare(`SELECT debate_id, COUNT(*) n, MAX(created) last FROM turns WHERE debate_id IN (${marks}) GROUP BY debate_id`).bind(meId, ...ids),
    db.prepare(`SELECT debate_id, SUM(side = 0) f, SUM(side = 1) a, MAX(CASE WHEN user_id = ?1 THEN side + 1 END) mine FROM verdicts WHERE debate_id IN (${marks}) GROUP BY debate_id`).bind(meId, ...ids),
    db.prepare(`SELECT * FROM users WHERE id IN (${userIds.map((_, i) => '?' + (i + 1)).join(',')})`).bind(...userIds),
  ])
  const user = id => (id ? publicUser(users.results.find(u => u.id === id) || DELETED) : null)
  return rows.map(d => {
    const v = verdicts.results.find(x => x.debate_id === d.id)
    const votes = [v?.f || 0, v?.a || 0]
    const role = !meId ? null : d.for_user === meId ? 'for' : d.against_user === meId ? 'against' : null
    const t = turns.results.find(x => x.debate_id === d.id)
    const n = t?.n || 0
    const forfeit = d.forfeit ?? null
    // Readers decide before they see the score
    const hidden = d.status === 'closed' && forfeit === null && !role && !v?.mine
    return {
      id: d.id, motion: motionFor(d, lang), context: d.context, status: d.status,
      questionId: d.question_id || null, labels: labelsFor(d, lang),
      for: user(d.for_user), against: user(d.against_user),
      turns: n, round: Math.min(ROUNDS, Math.ceil((n + 1) / 2)), totalTurns: ROUNDS * 2, lastTurn: t?.last || d.created,
      turnUser: d.turn_user ? user(d.turn_user).handle : null,
      created: d.created, started: d.started, ended: d.ended, updated: d.updated,
      role, forfeit,
      needsMe: !!meId && ((d.status === 'active' && d.turn_user === meId) || (d.status === 'pending' && d.against_user === meId)),
      votes: hidden ? null : votes, myVerdict: v?.mine ? v.mine - 1 : null,
      winner: forfeit !== null ? 1 - forfeit : hidden || d.status !== 'closed' || votes[0] === votes[1] ? null : votes[0] > votes[1] ? 0 : 1,
    }
  })
}

async function debatePayload(db, me, id, lang) {
  const d = await debateById(db, id)
  const [full] = await decorateDebates(db, me, [d], lang)
  const { results } = await db.prepare('SELECT t.*, u.handle, u.name, u.bio FROM turns t LEFT JOIN users u ON u.id = t.user_id WHERE t.debate_id = ? ORDER BY t.created').bind(d.id).all()
  const meId = me?.id || ''
  return {
    debate: { ...full, canVote: !!me && d.status === 'closed' && d.forfeit == null && !full.role },
    turns: results.map(t => ({ id: t.id, user: publicUser(t.handle ? t : DELETED), side: t.user_id === d.for_user ? 0 : 1, round: t.round, roundName: ROUND_NAMES[t.round - 1], text: t.text, created: t.created, mine: t.user_id === meId })),
  }
}

// ---------- Practice ----------

const myTopics = async (db, userId) => (await db.prepare('SELECT id, text FROM user_topics WHERE user_id = ? ORDER BY created LIMIT ?').bind(userId, MAX_TOPICS).all()).results

async function minuteAudio(db, row) {
  const { results } = await db.prepare('SELECT data FROM minute_audio WHERE minute_id = ? ORDER BY seq').bind(row.id).all()
  if (!results.length) return row.audio ? new Uint8Array(row.audio).buffer : null
  const parts = results.map(r => new Uint8Array(r.data))
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let at = 0
  for (const part of parts) { out.set(part, at); at += part.length }
  return out.buffer
}

/** Transcribe and coach one recording, and store the outcome. A failed AI call leaves it 'failed' for a retry. */
async function analyse(db, ai, row, audio) {
  await logAi(db, row.user_id, 'minute')
  let transcript
  try {
    await aiBudget(db, 'minute')
    transcript = await transcribe(ai, audio, row.lang)
  } catch (e) {
    if (!(e instanceof AiError) && !(e instanceof HttpError)) throw e
    await db.prepare(`UPDATE minutes SET status = 'failed' WHERE id = ?`).bind(row.id).run()
    return { ...row, status: 'failed' }
  }
  if (!transcript) {
    await db.prepare(`UPDATE minutes SET status = 'silent', transcript = '', words = 0, fillers = 0, feedback = NULL WHERE id = ?`).bind(row.id).run()
    return { ...row, status: 'silent', transcript: '', words: 0, fillers: 0, feedback: null }
  }
  const stats = speechStats(transcript, row.lang)
  // Last time's "next time" note, so the coach can say whether it was acted on
  const prev = await db.prepare(`SELECT feedback FROM minutes WHERE user_id = ? AND status = 'done' AND lang = ? AND feedback IS NOT NULL AND id != ? ORDER BY created DESC LIMIT 1`).bind(row.user_id, row.lang, row.id).first()
  const previous = prev ? JSON.parse(prev.feedback)?.improve || '' : ''
  const fb = await coach(ai, { topic: row.topic, transcript, duration: row.duration, length: row.length || 60, stats, lang: row.lang, previous })
  const feedback = JSON.stringify(fb || { summary: '', strength: '', improve: '', followed: '', scores: null, fillerWords: stats.found })
  await db.prepare(`UPDATE minutes SET status = 'done', transcript = ?, words = ?, fillers = ?, feedback = ? WHERE id = ?`).bind(transcript, stats.words, stats.fillers, feedback, row.id).run()
  return { ...row, status: 'done', transcript, words: stats.words, fillers: stats.fillers, feedback }
}

const minute = r => {
  const feedback = r.feedback ? JSON.parse(r.feedback) : null
  const done = r.status === 'done'
  return {
    id: r.id, topic: r.topic, duration: r.duration, transcript: r.transcript || '', words: r.words || 0, fillers: r.fillers || 0,
    wpm: done && r.duration ? Math.round((r.words || 0) / (r.duration / 60)) : null, feedback, day: r.day, created: r.created,
    lang: r.lang || 'en', length: r.length || 60, status: r.status || 'done',
    audio: `${API}/audio/minute/${r.id}`,
  }
}

// Consecutive days with at least one analysed talk, ending today or yesterday
function streak(days) {
  const set = new Set(days)
  let n = 0, d = today()
  if (!set.has(d)) d = prevDay(d)
  while (set.has(d)) { n++; d = prevDay(d) }
  return n
}

// ---------- helpers ----------

async function userByKey(db, key) {
  if (!key) return null
  return db.prepare('SELECT * FROM users WHERE token_hash = ?1 OR id = (SELECT user_id FROM sessions WHERE token_hash = ?1)').bind(await sha(key)).first()
}
async function userByHandle(db, handle) {
  const user = await db.prepare('SELECT * FROM users WHERE handle = ?').bind(String(handle).toLowerCase().replace(/^@/, '')).first()
  if (!user) fail(404, 'No one here by that name')
  return user
}
const publicUser = u => ({ handle: u.handle, name: u.name, bio: u.bio || '' })
// Trims and checks length; `what` names the field in the error
function clean(s, min, max, what) {
  const t = String(s ?? '').replace(/[\u0000-\u0008\u000b-\u001f]/g, '').replace(/\n{3,}/g, '\n\n').trim()
  if (t.length < min) fail(400, min > 1 ? `${what} needs at least ${min} characters` : `${what} can't be empty`)
  if (t.length > max) fail(400, `${what} can be at most ${max} characters`)
  return t
}
const rid = () => b64url(crypto.getRandomValues(new Uint8Array(12)))
const newKey = () => 'stance_' + b64url(crypto.getRandomValues(new Uint8Array(24)))
const b64url = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
async function sha(s) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join('')
}
async function body(request) {
  try { return await request.json() } catch { return {} }
}
