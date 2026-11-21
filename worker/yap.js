// Yap API (/yap/api/*) on the D1 database `DB`. Everything in Yap is a voice note: posts, replies, 1:1 chats and groups.
// Accounts: a handle and a per-device session key (no passwords); passkeys and one-time codes sign in other devices.
// Safety: friends-only by default, blocking, reporting with auto-hide, and a moderator queue (YAP_ADMINS).
import { notify, vapidPublicKey } from './push.js'
import { loginChallenge, registerPasskey, registrationOptions, verifyLogin } from './passkeys.js'
import { PROMPTS } from './yap-prompts.js'
import { devAI } from './yap-dev-ai.js'

const API = '/yap/api'
const MAX_AUDIO = 1_500_000
const FX = ['', 'chipmunk', 'deep']
const EMOJIS = ['❤️', '🔥', '😂', '😍', '😮', '👏']
const MAX_GROUP = 16
const PAGE = 50
const SESSION_IDLE = 90 * 86400_000
const CODE_TTL = 15 * 60_000
const REASONS = ['mean', 'inappropriate', 'spam', 'harm', 'other']
const RESERVED = ['yap', 'yapteam', 'yapsupport', 'support', 'admin', 'moderator', 'mod', 'official']
const WELCOME = 'seed_welcome'
const WELCOME_DE = {
  audio: '/yap/seed/welcome-de.m4a', duration: 11.23,
  transcript: 'Hey, willkommen bei Yap! Hier wird nicht getippt. Nie. Tipp auf den großen Knopf, sag etwas, und tipp nochmal. Das war’s. Deine Freunde hören dich, und du hörst sie.',
}

// People ?1 has added who added ?1 back
const FRIENDS = 'SELECT a.dst FROM follows a JOIN follows b ON b.src = a.dst AND b.dst = a.src WHERE a.src = ?1'
const BLOCKED = (who, col) => `EXISTS (SELECT 1 FROM blocks bl WHERE (bl.src = ${who} AND bl.dst = ${col}) OR (bl.src = ${col} AND bl.dst = ${who}))`
// A post (p, author u) is visible to ?1 if it is theirs, a friend's, or a reply to their own post, and nobody blocked anybody.
// The @yap welcome is there until you have a friend. Removed posts stay visible to their author only.
const VISIBLE = `((p.hidden = 0 OR p.user_id = ?1) AND NOT ${BLOCKED('?1', 'p.user_id')}
  AND NOT EXISTS (SELECT 1 FROM reports rp WHERE rp.reporter = ?1 AND rp.kind = 'post' AND rp.target_id = p.id)
  AND (p.user_id = ?1 OR p.user_id IN (${FRIENDS})
    OR (p.reply_to IS NOT NULL AND (SELECT user_id FROM posts WHERE id = p.reply_to) = ?1)
    OR (p.id = '${WELCOME}' AND NOT EXISTS (${FRIENDS}))))`
// Today's answers stay hidden until you answered yourself (?3 = today)
const PROMPT_GATE = `(p.prompt IS NULL OR p.prompt != ?3 OR p.user_id = ?1
  OR EXISTS (SELECT 1 FROM posts mine WHERE mine.user_id = ?1 AND mine.prompt = ?3 AND mine.reply_to IS NULL))`
const POST_COLS = 'p.id, p.user_id, p.reply_to, p.audio_url, p.mime, p.duration, p.wave, p.fx, p.created, p.transcript, p.words, p.prompt, p.hidden, u.handle, u.name, u.emoji, u.hue, u.bot'
const MSG_COLS = 'm.id, m.src, m.dst, m.group_id, m.audio_url, m.mime, m.duration, m.wave, m.fx, m.heard, m.transcript, m.words, m.created'

// ---------- words the server says, in English and German ----------

const ERR = {
  generic: ['Something went wrong', 'Etwas ist schiefgelaufen'],
  notFound: ['Not found', 'Nicht gefunden'],
  signIn: ['Please sign in', 'Bitte melde dich an'],
  badKey: ["That code doesn't work. Codes work once, for 15 minutes", 'Dieser Code funktioniert nicht. Codes gelten einmal, 15 Minuten lang'],
  expired: ['That took too long, try again', 'Das hat zu lange gedauert, versuch es nochmal'],
  passkeyUnknown: ["That passkey isn't linked to a Yap account anymore", 'Dieser Passkey gehört zu keinem Yap-Konto mehr'],
  passkeyFailed: ["Couldn't check that passkey", 'Der Passkey konnte nicht geprüft werden'],
  passkeyMany: ['You already have plenty of passkeys', 'Du hast schon genug Passkeys'],
  passkeyTaken: ['That passkey belongs to another account', 'Dieser Passkey gehört zu einem anderen Konto'],
  deleted: ['That account was deleted', 'Dieses Konto wurde gelöscht'],
  handleRule: ['Usernames are 3–20 letters, numbers or _', 'Benutzernamen haben 3–20 Buchstaben, Ziffern oder _'],
  handleTaken: ['@{handle} is taken', '@{handle} ist schon vergeben'],
  nameReserved: ['That name is reserved', 'Dieser Name ist reserviert'],
  tooManyAccounts: ['Too many new accounts from here today', 'Heute wurden von hier zu viele Konten erstellt'],
  slowDown: ['Slow down a little and try again in a moment', 'Mach kurz langsamer und versuch es gleich nochmal'],
  tooManyPosts: ['Too many yaps this hour', 'Zu viele Yaps in dieser Stunde'],
  tooManyMessages: ['Too many voice messages this hour', 'Zu viele Sprachnachrichten in dieser Stunde'],
  gone: ['That yap is gone', 'Dieser Yap ist weg'],
  notYours: ['You can only delete your own yaps', 'Du kannst nur deine eigenen Yaps löschen'],
  noRecording: ['No recording attached', 'Keine Aufnahme dabei'],
  tooLong: ['That recording is too long', 'Diese Aufnahme ist zu lang'],
  empty: ['That recording is empty', 'Diese Aufnahme ist leer'],
  badAudio: ["That doesn't look like a voice recording", 'Das sieht nicht nach einer Sprachaufnahme aus'],
  noUser: ['No one here by that name', 'Hier gibt es niemanden mit diesem Namen'],
  thatsYou: ["That's you", 'Das bist du'],
  manyFriends: ['That is a lot of friends', 'Das sind sehr viele Freunde'],
  cantAdd: ["You can't add @{handle}", 'Du kannst @{handle} nicht hinzufügen'],
  friendsOnly: ['You can only send voice messages to friends', 'Sprachnachrichten gehen nur an Freunde'],
  pickTwo: ['Pick at least two friends', 'Wähle mindestens zwei Freunde'],
  groupMax: ['Groups can have up to {n} people', 'Gruppen haben höchstens {n} Leute'],
  manyGroups: ['That is a lot of groups for one day', 'Das sind viele Gruppen für einen Tag'],
  groupGone: ["That group is gone, or you're not in it", 'Diese Gruppe gibt es nicht mehr, oder du bist nicht drin'],
  groupFriends: ['You can only add friends to a group', 'Du kannst nur Freunde zu einer Gruppe hinzufügen'],
  badSub: ['Bad subscription', 'Ungültiges Abo'],
  badReport: ['Pick a reason', 'Wähle einen Grund'],
  inviteGone: ['That invite link no longer works', 'Dieser Einladungslink funktioniert nicht mehr'],
  adminOnly: ['Only moderators can do that', 'Das dürfen nur Moderatoren'],
  unknownReaction: ['Unknown reaction', 'Unbekannte Reaktion'],
}
const PUSH = {
  reply: ['Replied to your yap · {d}', 'Hat auf deinen Yap geantwortet · {d}'],
  friendBack: ["Added you back. You're friends now", 'Hat dich zurück hinzugefügt. Ihr seid jetzt befreundet'],
  request: ['@{handle} wants to be friends', '@{handle} möchte mit dir befreundet sein'],
  dm: ['Voice message · {d}', 'Sprachnachricht · {d}'],
  groupMsg: ['{name}: voice message · {d}', '{name}: Sprachnachricht · {d}'],
  groupAdded: ['{name} added you to the group', '{name} hat dich zur Gruppe hinzugefügt'],
  joined: ["Joined Yap with your invite. You're friends now", 'Ist mit deiner Einladung zu Yap gekommen. Ihr seid jetzt befreundet'],
  test: ['Notifications are on', 'Mitteilungen sind an'],
}
const say = (table, key, lang, vars = {}) => (table[key] || table.generic)[lang === 'de' ? 1 : 0].replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '')

class HttpError extends Error {
  constructor(status, code, vars) { super(code); this.status = status; this.code = code; this.vars = vars }
}
const fail = (status, code, vars) => { throw new HttpError(status, code, vars) }
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })
const langOf = request => {
  const h = (request.headers.get('x-yap-lang') || request.headers.get('accept-language') || '').toLowerCase()
  return h.startsWith('de') ? 'de' : 'en'
}

export async function yap(request, env, ctx, url) {
  try {
    return await route(request, env, url, ctx)
  } catch (e) {
    const lang = langOf(request)
    if (e instanceof HttpError) return json({ error: say(ERR, e.code, lang, e.vars), code: e.code }, e.status)
    if (e?.status && e?.code) return json({ error: say(ERR, e.code, lang), code: e.code }, e.status)
    console.error(e)
    return json({ error: say(ERR, 'generic', lang), code: 'generic' }, 500)
  }
}

async function route(request, env, url, ctx) {
  const db = env.DB
  const path = url.pathname.slice(API.length)
  const method = request.method
  const m = pattern => path.match(new RegExp('^' + pattern + '$'))
  const later = promise => ctx.waitUntil(promise.catch(e => console.error(e)))
  const rp = { rpId: url.hostname, origin: url.origin }
  const ai = devAI(env, url) || env.AI
  const lang = langOf(request)
  let ipHash
  const ip = async () => (ipHash ??= await sha('ip:' + (request.headers.get('cf-connecting-ip') || 'local')))
  let p

  // ---------- without an account ----------

  if (method === 'POST' && path === '/signup') return signup(request, env, db, await ip(), later, lang)
  if (method === 'GET' && (p = m('/handles/(\\w+)'))) {
    await limit(db, 'handle:' + (await ip()), 240, 3600_000)
    const handle = p[1].toLowerCase()
    if (!/^[a-z0-9_]{3,20}$/.test(handle)) return json({ available: false, valid: false })
    if (!(await handleTaken(db, handle))) return json({ available: true, valid: true })
    return json({ available: false, valid: true, suggestion: await freeHandle(db, handle) })
  }
  // A one-time code from another device (Me → Sign in on another device), or an old login key
  if (method === 'POST' && path === '/login') {
    const b = await body(request)
    const k = 'login:' + (await ip())
    await peek(db, k, 30, 3600_000)
    const code = String(b.code || '').toUpperCase().replace(/[^0-9A-Z]/g, '')
    let user = null
    if (code.length === 8) {
      const row = await db.prepare("DELETE FROM challenges WHERE kind = 'code' AND challenge = ? AND expires > ? RETURNING user_id").bind(await sha('code:' + code), Date.now()).first()
      if (row) user = await db.prepare('SELECT * FROM users WHERE id = ? AND bot = 0').bind(row.user_id).first()
    } else if (b.key) {
      const found = await userByKey(db, String(b.key).trim())
      if (found) return json({ key: String(b.key).trim(), user: publicUser(found) })
    }
    if (!user) { await hit(db, k); fail(401, 'badKey') }
    return json({ key: await newSession(db, user.id), user: publicUser(user) })
  }
  if (method === 'POST' && path === '/passkeys/challenge') {
    await limit(db, 'pkc:' + (await ip()), 120, 3600_000)
    return json(await loginChallenge(db, rp))
  }
  if (method === 'POST' && path === '/passkeys/login') {
    const stored = await verifyLogin(db, rp, await body(request))
    const user = await db.prepare('SELECT * FROM users WHERE id = ? AND bot = 0').bind(stored.user_id).first()
    if (!user) fail(401, 'deleted')
    return json({ key: await newSession(db, user.id), user: publicUser(user) })
  }
  // What a visitor can hear before making an account: the welcome from @yap and today's question
  if (method === 'GET' && path === '/guest') {
    await limit(db, 'guest:' + (await ip()), 600, 3600_000)
    const row = await db.prepare(`SELECT ${POST_COLS} FROM posts p JOIN users u ON u.id = p.user_id WHERE p.id = ?`).bind(WELCOME).first()
    const day = today()
    return json({ welcome: row ? postOut(row, null, lang) : null, prompt: { day, text: promptFor(day, lang) } })
  }
  // An invite link (/yap/#join/<code>): who invited you, and their voice bio
  if (method === 'GET' && (p = m('/invite/(\\w{10})'))) {
    await limit(db, 'guest:' + (await ip()), 600, 3600_000)
    const u = await db.prepare('SELECT * FROM users WHERE invite = ? AND bot = 0').bind(p[1]).first()
    if (!u) fail(404, 'inviteGone')
    return json({ user: { ...publicUser(u), bio: bioOf(u, `${API}/invite/${p[1]}/bio?v=${u.bio_at}`) } })
  }
  if (method === 'GET' && (p = m('/invite/(\\w{10})/bio'))) {
    const u = await db.prepare('SELECT bio_audio, bio_mime FROM users WHERE invite = ? AND bot = 0').bind(p[1]).first()
    if (!u?.bio_audio) fail(404, 'notFound')
    return new Response(new Uint8Array(u.bio_audio), { headers: { 'content-type': u.bio_mime, 'cache-control': 'private, max-age=3600' } })
  }

  const me = await auth(request, db, later)
  const ulang = request.headers.get('x-yap-lang') ? lang : me.lang || lang

  // ---------- account ----------

  if (path === '/me') {
    if (method === 'GET') return json(await mePayload(env, db, me))
    if (method === 'PATCH') {
      const b = await body(request)
      const name = b.name != null ? cleanName(b.name) : me.name
      if (b.name != null) checkName(name)
      const emoji = cleanEmoji(b.emoji ?? me.emoji), hue = cleanHue(b.hue ?? me.hue)
      const l = b.lang === 'de' || b.lang === 'en' ? b.lang : me.lang
      await db.prepare('UPDATE users SET name = ?, emoji = ?, hue = ?, lang = ? WHERE id = ?').bind(name, emoji, hue, l, me.id).run()
      return json({ user: { ...publicUser({ ...me, name, emoji, hue }), bio: bioOf(me), lang: l } })
    }
    if (method === 'DELETE') {
      await db.batch([
        db.prepare("DELETE FROM voice_fts WHERE (kind = 'p' AND ref IN (SELECT id FROM posts WHERE user_id = ?1 OR reply_to IN (SELECT id FROM posts WHERE user_id = ?1))) OR (kind = 'm' AND ref IN (SELECT id FROM messages WHERE src = ?1 OR (dst = ?1 AND group_id IS NULL)))").bind(me.id),
        db.prepare('DELETE FROM reactions WHERE user_id = ?1 OR post_id IN (SELECT id FROM posts WHERE user_id = ?1)').bind(me.id),
        db.prepare('DELETE FROM plays WHERE user_id = ?1 OR post_id IN (SELECT id FROM posts WHERE user_id = ?1)').bind(me.id),
        db.prepare('DELETE FROM posts WHERE user_id = ?1 OR reply_to IN (SELECT id FROM posts WHERE user_id = ?1)').bind(me.id),
        db.prepare('DELETE FROM follows WHERE src = ?1 OR dst = ?1').bind(me.id),
        db.prepare('DELETE FROM blocks WHERE src = ?1 OR dst = ?1').bind(me.id),
        db.prepare('DELETE FROM messages WHERE src = ?1 OR (dst = ?1 AND group_id IS NULL)').bind(me.id),
        db.prepare('DELETE FROM group_members WHERE user_id = ?1').bind(me.id),
        db.prepare('DELETE FROM chat_groups WHERE id NOT IN (SELECT group_id FROM group_members)'),
        db.prepare('DELETE FROM messages WHERE group_id IS NOT NULL AND group_id NOT IN (SELECT id FROM chat_groups)'),
        db.prepare('DELETE FROM push_subs WHERE user_id = ?1').bind(me.id),
        db.prepare('DELETE FROM sessions WHERE user_id = ?1').bind(me.id),
        db.prepare('DELETE FROM passkeys WHERE user_id = ?1').bind(me.id),
        db.prepare("DELETE FROM challenges WHERE user_id = ?1 OR id LIKE 'r.' || ?1 || '.%'").bind(me.id),
        db.prepare('DELETE FROM users WHERE id = ?1').bind(me.id),
      ])
      return json({ ok: true })
    }
  }
  // Sign out: this device's session ends on the server, and it stops getting notifications
  if (method === 'DELETE' && path === '/session') {
    await db.batch([
      db.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(me.sid),
      db.prepare('DELETE FROM push_subs WHERE session = ?').bind(me.sid),
    ])
    return json({ ok: true })
  }
  // Sign out everywhere else (a lost phone, a shared computer)
  if (method === 'POST' && path === '/sessions/revoke') {
    const [gone] = await db.batch([
      db.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash != ?').bind(me.id, me.sid),
      db.prepare('DELETE FROM push_subs WHERE user_id = ? AND (session IS NULL OR session != ?)').bind(me.id, me.sid),
      db.prepare("DELETE FROM challenges WHERE kind = 'code' AND user_id = ?").bind(me.id),
    ])
    return json({ ok: true, signedOut: gone.meta.changes })
  }
  // A one-time code that signs in one more device (typed in there, or carried into the Home Screen app)
  if (method === 'POST' && path === '/link-code') {
    await limit(db, 'code:' + me.id, 20, 3600_000)
    const code = randomCode(8)
    await db.batch([
      db.prepare("DELETE FROM challenges WHERE (kind = 'code' AND user_id = ?) OR expires < ?").bind(me.id, Date.now()),
      db.prepare("INSERT INTO challenges (id, challenge, expires, user_id, kind) VALUES (?, ?, ?, ?, 'code')").bind(rid(), await sha('code:' + code), Date.now() + CODE_TTL, me.id),
    ])
    return json({ code, expires: Date.now() + CODE_TTL })
  }
  if (path === '/me/bio') {
    if (method === 'POST') {
      const clip = await readClip(request)
      const now = Date.now()
      await db.prepare('UPDATE users SET bio_audio = ?, bio_url = NULL, bio_mime = ?, bio_duration = ?, bio_wave = ?, bio_fx = ?, bio_transcript = NULL, bio_at = ? WHERE id = ?')
        .bind(clip.audio, clip.mime, clip.duration, clip.wave, clip.fx, now, me.id).run()
      later(transcribe(env, ai, clip, { bio: me.id, at: now }))
      return json({ bio: bioOf({ ...me, bio_mime: clip.mime, bio_duration: clip.duration, bio_wave: clip.wave, bio_fx: clip.fx, bio_at: now }) })
    }
    if (method === 'DELETE') {
      await db.prepare('UPDATE users SET bio_audio = NULL, bio_url = NULL, bio_mime = NULL, bio_duration = NULL, bio_wave = NULL, bio_fx = NULL, bio_transcript = NULL, bio_at = NULL WHERE id = ?').bind(me.id).run()
      return json({ bio: null })
    }
  }

  // ---------- feed and posts ----------

  if (method === 'GET' && path === '/feed') {
    const before = Number(url.searchParams.get('before')) || Date.now() + 1
    const { results } = await db.prepare(`SELECT ${POST_COLS} FROM posts p JOIN users u ON u.id = p.user_id
      WHERE p.reply_to IS NULL AND p.created < ?2 AND ${VISIBLE} AND ${PROMPT_GATE} ORDER BY p.created DESC LIMIT 20`).bind(me.id, before, today()).all()
    return json({ posts: await decorate(db, me, results, ulang) })
  }

  // Today's question. Friends' answers unlock once you have answered (one answer a day; a new one replaces it)
  if (method === 'GET' && path === '/prompt') {
    const day = today()
    const [own, all] = await db.batch([
      db.prepare(`SELECT ${POST_COLS} FROM posts p JOIN users u ON u.id = p.user_id WHERE p.user_id = ?1 AND p.prompt = ?2 AND p.reply_to IS NULL ORDER BY p.created DESC LIMIT 1`).bind(me.id, day),
      db.prepare(`SELECT ${POST_COLS} FROM posts p JOIN users u ON u.id = p.user_id
        WHERE p.prompt = ?2 AND p.reply_to IS NULL AND p.user_id != ?1 AND ${VISIBLE} ORDER BY p.created DESC LIMIT 60`).bind(me.id, day),
    ])
    const mine = own.results[0]
    const others = all.results
    return json({
      day, text: promptFor(day, ulang), answered: !!mine, count: others.length,
      faces: others.slice(0, 3).map(r => publicUser({ ...r, id: r.user_id })),
      mine: mine ? (await decorate(db, me, [mine], ulang))[0] : null,
      answers: mine ? await decorate(db, me, others, ulang) : [],
    })
  }

  if (method === 'POST' && path === '/posts') {
    const recent = await db.prepare('SELECT COUNT(*) n FROM posts WHERE user_id = ? AND created > ?').bind(me.id, Date.now() - 3600_000).first('n')
    if (recent >= 40) fail(429, 'tooManyPosts')
    const clip = await readClip(request)
    if (clip.cid) {
      const dup = await db.prepare(`SELECT ${POST_COLS} FROM posts p JOIN users u ON u.id = p.user_id WHERE p.user_id = ? AND p.cid = ?`).bind(me.id, clip.cid).first()
      if (dup) return json({ post: (await decorate(db, me, [dup], ulang))[0] })
    }
    const replyTo = clip.form.get('reply_to') || null
    let parent = null
    if (replyTo) {
      parent = await visiblePost(db, me, replyTo)
      if (!parent || parent.reply_to) fail(404, 'gone')
    }
    const prompt = !replyTo && clip.form.get('prompt') ? today() : null
    const id = rid(), stmts = []
    if (prompt) {
      // One answer a day: a new answer replaces the earlier one
      const old = await db.prepare('SELECT id FROM posts WHERE user_id = ? AND prompt = ? AND reply_to IS NULL').bind(me.id, prompt).all()
      for (const o of old.results) stmts.push(...deletePost(db, o.id))
    }
    stmts.push(db.prepare('INSERT INTO posts (id, user_id, reply_to, audio, mime, duration, wave, fx, prompt, cid, created) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(id, me.id, replyTo, clip.audio, clip.mime, clip.duration, clip.wave, clip.fx, prompt, clip.cid, Date.now()))
    await db.batch(stmts)
    later(transcribe(env, ai, clip, { post: id }))
    if (parent && parent.user_id !== me.id && !parent.bot) {
      later(push(env, db, parent.user_id, { title: me.name, key: 'reply', vars: { d: fmt(clip.duration) }, url: `#post/${parent.id}`, tag: 'post-' + parent.id }))
    }
    const [post] = await decorate(db, me, [await visiblePost(db, me, id)], ulang)
    return json({ post })
  }

  if ((p = m('/posts/([\\w-]+)'))) {
    const post = await visiblePost(db, me, p[1])
    if (!post) fail(404, 'gone')
    if (method === 'GET') {
      const { results } = await db.prepare(`SELECT ${POST_COLS} FROM posts p JOIN users u ON u.id = p.user_id
        WHERE p.reply_to = ?2 AND ${VISIBLE} ORDER BY p.created ASC LIMIT 100`).bind(me.id, post.id).all()
      const [full] = await decorate(db, me, [post], ulang)
      return json({ post: full, replies: await decorate(db, me, results, ulang) })
    }
    if (method === 'DELETE') {
      if (post.user_id !== me.id) fail(403, 'notYours')
      await db.batch(deletePost(db, post.id))
      return json({ ok: true })
    }
  }
  if (method === 'POST' && (p = m('/posts/([\\w-]+)/react'))) {
    const post = await visiblePost(db, me, p[1])
    if (!post) fail(404, 'gone')
    const { emoji } = await body(request)
    const current = await db.prepare('SELECT emoji FROM reactions WHERE post_id = ? AND user_id = ?').bind(post.id, me.id).first('emoji')
    if (!emoji || emoji === current) await db.prepare('DELETE FROM reactions WHERE post_id = ? AND user_id = ?').bind(post.id, me.id).run()
    else if (EMOJIS.includes(emoji)) await db.prepare('INSERT OR REPLACE INTO reactions (post_id, user_id, emoji, created) VALUES (?, ?, ?, ?)').bind(post.id, me.id, emoji, Date.now()).run()
    else fail(400, 'unknownReaction')
    const [full] = await decorate(db, me, [post], ulang)
    return json({ post: full })
  }
  // Heard: one row per listener, however often they replay it
  if (method === 'POST' && (p = m('/posts/([\\w-]+)/play'))) {
    const post = await visiblePost(db, me, p[1])
    if (post && post.user_id !== me.id) await db.prepare('INSERT OR IGNORE INTO plays (post_id, user_id, at) VALUES (?, ?, ?)').bind(post.id, me.id, Date.now()).run()
    return json({ ok: true })
  }
  if (method === 'GET' && (p = m('/posts/([\\w-]+)/listeners'))) {
    const post = await visiblePost(db, me, p[1])
    if (!post || post.user_id !== me.id) fail(404, 'gone')
    const { results } = await db.prepare(`SELECT u.*, pl.at FROM plays pl JOIN users u ON u.id = pl.user_id
      WHERE pl.post_id = ?2 AND NOT ${BLOCKED('?1', 'u.id')} ORDER BY pl.at DESC LIMIT 200`).bind(me.id, post.id).all()
    return json({ listeners: results.map(u => ({ user: publicUser(u), at: u.at })) })
  }

  // ---------- catch up, search, captions ----------

  // Everything this person hasn't heard yet, as one queue: 1:1 chats, then groups, then friends' yaps
  if (method === 'GET' && path === '/unheard') {
    const now = Date.now()
    const [dms, groups, posts] = await db.batch([
      db.prepare(`SELECT ${MSG_COLS}, u.handle, u.name, u.emoji, u.hue, u.bot FROM messages m JOIN users u ON u.id = m.src
        WHERE m.dst = ?1 AND m.group_id IS NULL AND m.heard = 0 AND m.hidden = 0 AND m.created <= ?2 AND m.src IN (${FRIENDS})
        ORDER BY m.created ASC LIMIT 150`).bind(me.id, now),
      db.prepare(`SELECT ${MSG_COLS}, u.handle, u.name, u.emoji, u.hue, u.bot, g.name gname, g.emoji gemoji FROM messages m
        JOIN group_members gm ON gm.group_id = m.group_id AND gm.user_id = ?1 JOIN chat_groups g ON g.id = m.group_id JOIN users u ON u.id = m.src
        WHERE m.src != ?1 AND m.created > gm.last_heard AND m.created <= ?2 AND m.hidden = 0 AND NOT ${BLOCKED('?1', 'm.src')}
        ORDER BY m.created ASC LIMIT 150`).bind(me.id, now),
      db.prepare(`SELECT ${POST_COLS} FROM posts p JOIN users u ON u.id = p.user_id
        WHERE p.user_id != ?1 AND u.bot = 0 AND p.created > ?2 AND ${VISIBLE} AND ${PROMPT_GATE}
        AND NOT EXISTS (SELECT 1 FROM plays WHERE post_id = p.id AND user_id = ?1)
        ORDER BY p.created ASC LIMIT 60`).bind(me.id, now - 7 * 86400_000, today()),
    ])
    // Conversations stay together, the one waiting longest first
    const grouped = (rows, keyOf) => {
      const by = new Map()
      for (const r of rows) { const k = keyOf(r); if (!by.has(k)) by.set(k, []); by.get(k).push(r) }
      return [...by.values()].flat()
    }
    const items = [
      ...grouped(dms.results, r => r.src).map(r => ({ kind: 'dm', ...message(r, me), user: publicUser({ ...r, id: r.src }), ctx: { handle: r.handle } })),
      ...grouped(groups.results, r => r.group_id).map(r => ({ kind: 'group', ...message(r, me), user: publicUser({ ...r, id: r.src }), ctx: { groupId: r.group_id, name: r.gname, emoji: r.gemoji } })),
      ...posts.results.map(r => ({ kind: 'post', ...postOut(r, me, ulang), ctx: { postId: r.reply_to || r.id, reply: !!r.reply_to, prompt: r.prompt ? promptFor(r.prompt, ulang) : null } })),
    ]
    return json({ items })
  }

  // Search everything said in what you can hear (captions), newest matches first
  if (method === 'GET' && path === '/search') {
    await limit(db, 'search:' + me.id, 600, 3600_000)
    const words = (url.searchParams.get('q') || '').normalize('NFC').toLowerCase().match(/[\p{L}\p{N}']+/gu) || []
    if (!words.length || words.join('').length < 2) return json({ results: [] })
    const q = words.slice(0, 8).map(w => `"${w.replace(/"/g, '')}"*`).join(' ')
    const snip = "snippet(voice_fts, 0, '\u0002', '\u0003', '…', 14)"
    const [posts, msgs] = await db.batch([
      db.prepare(`SELECT ${POST_COLS}, ${snip} snip FROM voice_fts JOIN posts p ON p.id = voice_fts.ref JOIN users u ON u.id = p.user_id
        WHERE voice_fts MATCH ?2 AND voice_fts.kind = 'p' AND ${VISIBLE} ORDER BY p.created DESC LIMIT 25`).bind(me.id, q),
      db.prepare(`SELECT ${MSG_COLS}, u.handle, u.name, u.emoji, u.hue, u.bot, d.handle dhandle, d.name dname, d.emoji demoji, d.hue dhue, g.name gname, g.emoji gemoji, ${snip} snip
        FROM voice_fts JOIN messages m ON m.id = voice_fts.ref JOIN users u ON u.id = m.src
        LEFT JOIN users d ON d.id = m.dst AND m.group_id IS NULL LEFT JOIN chat_groups g ON g.id = m.group_id
        WHERE voice_fts MATCH ?2 AND voice_fts.kind = 'm' AND m.hidden = 0 AND NOT ${BLOCKED('?1', 'm.src')}
        AND ((m.group_id IS NULL AND (m.src = ?1 OR m.dst = ?1)) OR m.group_id IN (SELECT group_id FROM group_members WHERE user_id = ?1))
        ORDER BY m.created DESC LIMIT 40`).bind(me.id, q),
    ])
    const results = [
      ...posts.results.map(r => ({ kind: 'post', snippet: r.snip, ...postOut(r, me, ulang), ctx: { postId: r.reply_to || r.id } })),
      ...msgs.results.map(r => {
        const other = r.group_id ? null : r.src === me.id ? { handle: r.dhandle, name: r.dname, emoji: r.demoji, hue: r.dhue } : { handle: r.handle, name: r.name, emoji: r.emoji, hue: r.hue }
        return {
          kind: r.group_id ? 'group' : 'dm', snippet: r.snip, ...message(r, me), user: publicUser({ ...r, id: r.src }),
          ctx: r.group_id ? { groupId: r.group_id, name: r.gname, emoji: r.gemoji } : { handle: other.handle, with: publicUser(other) },
        }
      }),
    ].sort((a, b) => b.created - a.created)
    return json({ results })
  }

  // Captions that arrived after a message was shown (the chat asks for just these instead of reloading)
  if (method === 'GET' && path === '/captions') {
    const ids = (url.searchParams.get('m') || '').split(',').filter(x => /^[\w-]{6,40}$/.test(x)).slice(0, 40)
    const pids = (url.searchParams.get('p') || '').split(',').filter(x => /^[\w-]{6,40}$/.test(x)).slice(0, 40)
    const out = {}
    if (ids.length) {
      const marks = ids.map((_, i) => '?' + (i + 2)).join(',')
      const { results } = await db.prepare(`SELECT id, transcript, words FROM messages WHERE id IN (${marks}) AND transcript IS NOT NULL
        AND ((group_id IS NULL AND (src = ?1 OR dst = ?1)) OR group_id IN (SELECT group_id FROM group_members WHERE user_id = ?1))`).bind(me.id, ...ids).all()
      for (const r of results) out[r.id] = { transcript: r.transcript, words: parseWords(r.words) }
    }
    if (pids.length) {
      const marks = pids.map((_, i) => '?' + (i + 2)).join(',')
      const { results } = await db.prepare(`SELECT p.id, p.transcript, p.words FROM posts p JOIN users u ON u.id = p.user_id
        WHERE p.id IN (${marks}) AND p.transcript IS NOT NULL AND ${VISIBLE}`).bind(me.id, ...pids).all()
      for (const r of results) out[r.id] = { transcript: r.transcript, words: parseWords(r.words) }
    }
    return json({ captions: out })
  }

  // ---------- people ----------

  if (method === 'GET' && path === '/users') {
    const q = (url.searchParams.get('q') || '').toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_]/g, '')
    if (!q) return json({ users: [] })
    const { results } = await db.prepare(`SELECT * FROM users u WHERE u.handle LIKE ?2 AND u.id != ?1 AND u.bot = 0
      AND NOT EXISTS (SELECT 1 FROM blocks WHERE src = u.id AND dst = ?1) ORDER BY length(u.handle) LIMIT 12`).bind(me.id, q + '%').all()
    return json({ users: await withRelations(db, me, results) })
  }
  if (method === 'GET' && (p = m('/users/(\\w+)'))) {
    const user = await userByHandle(db, p[1])
    if (await db.prepare('SELECT 1 FROM blocks WHERE src = ? AND dst = ?').bind(user.id, me.id).first()) fail(404, 'noUser')
    const [withRel] = await withRelations(db, me, [user])
    let posts = []
    if (['friend', 'me', 'bot'].includes(withRel.relation)) {
      const { results } = await db.prepare(`SELECT ${POST_COLS} FROM posts p JOIN users u ON u.id = p.user_id
        WHERE p.user_id = ?2 AND p.reply_to IS NULL AND ${VISIBLE} AND ${PROMPT_GATE} ORDER BY p.created DESC LIMIT 30`).bind(me.id, user.id, today()).all()
      posts = await decorate(db, me, results, ulang)
    }
    return json({ user: { ...withRel, bio: withRel.relation === 'blocked' ? null : bioOf(user) }, posts })
  }
  if ((p = m('/users/(\\w+)/block'))) {
    const user = await userByHandle(db, p[1])
    if (user.id === me.id) fail(400, 'thatsYou')
    if (method === 'POST') {
      await db.batch([
        db.prepare('INSERT OR IGNORE INTO blocks (src, dst, created) VALUES (?, ?, ?)').bind(me.id, user.id, Date.now()),
        db.prepare('DELETE FROM follows WHERE (src = ?1 AND dst = ?2) OR (src = ?2 AND dst = ?1)').bind(me.id, user.id),
      ])
    } else if (method === 'DELETE') {
      await db.prepare('DELETE FROM blocks WHERE src = ? AND dst = ?').bind(me.id, user.id).run()
    }
    const [withRel] = await withRelations(db, me, [user])
    return json({ user: withRel })
  }
  if (method === 'GET' && path === '/blocks') {
    const { results } = await db.prepare('SELECT u.* FROM blocks b JOIN users u ON u.id = b.dst WHERE b.src = ? ORDER BY b.created DESC').bind(me.id).all()
    return json({ users: results.map(u => ({ ...publicUser(u), relation: 'blocked' })) })
  }
  // Reports go to the moderators; three different people reporting a yap hides it until someone looks
  if (method === 'POST' && path === '/reports') {
    await limit(db, 'report:' + me.id, 40, 86400_000)
    const b = await body(request)
    const reason = REASONS.includes(b.reason) ? b.reason : fail(400, 'badReport')
    let targetId, targetUser
    if (b.kind === 'post') {
      const post = await visiblePost(db, me, String(b.id || ''))
      if (!post || post.user_id === me.id) fail(404, 'gone')
      targetId = post.id; targetUser = post.user_id
    } else if (b.kind === 'message') {
      const msg = await db.prepare(`SELECT id, src FROM messages WHERE id = ?2 AND src != ?1 AND ((group_id IS NULL AND dst = ?1)
        OR group_id IN (SELECT group_id FROM group_members WHERE user_id = ?1))`).bind(me.id, String(b.id || '')).first()
      if (!msg) fail(404, 'notFound')
      targetId = msg.id; targetUser = msg.src
    } else if (b.kind === 'user') {
      const user = await userByHandle(db, b.handle)
      if (user.id === me.id) fail(400, 'thatsYou')
      targetId = user.id; targetUser = user.id
    } else fail(400, 'badReport')
    await db.prepare('INSERT OR IGNORE INTO reports (id, reporter, kind, target_id, target_user, reason, created) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(rid(), me.id, b.kind, targetId, targetUser, reason, Date.now()).run()
    if (b.kind === 'post') {
      await db.prepare(`UPDATE posts SET hidden = 1 WHERE id = ?1 AND (SELECT COUNT(DISTINCT reporter) FROM reports WHERE kind = 'post' AND target_id = ?1 AND status = 'open') >= 3`).bind(targetId).run()
    }
    if (b.block) {
      await db.batch([
        db.prepare('INSERT OR IGNORE INTO blocks (src, dst, created) VALUES (?, ?, ?)').bind(me.id, targetUser, Date.now()),
        db.prepare('DELETE FROM follows WHERE (src = ?1 AND dst = ?2) OR (src = ?2 AND dst = ?1)').bind(me.id, targetUser),
      ])
    }
    return json({ ok: true })
  }

  if (method === 'GET' && path === '/friends') {
    const [all, fof] = await db.batch([
      db.prepare(`SELECT u.*,
        EXISTS (SELECT 1 FROM follows WHERE src = ?1 AND dst = u.id) i_added,
        EXISTS (SELECT 1 FROM follows WHERE src = u.id AND dst = ?1) added_me
        FROM users u WHERE u.id IN (SELECT dst FROM follows WHERE src = ?1 UNION SELECT src FROM follows WHERE dst = ?1)
        AND NOT ${BLOCKED('?1', 'u.id')} ORDER BY u.name COLLATE NOCASE`).bind(me.id),
      // Friends of your friends you haven't added, most friends in common first
      db.prepare(`SELECT u.*, COUNT(DISTINCT f.id) mutual, MIN(f.name) via FROM (${FRIENDS}) mf
        JOIN users f ON f.id = mf.dst
        JOIN follows c ON c.src = f.id JOIN follows d ON d.src = c.dst AND d.dst = c.src
        JOIN users u ON u.id = c.dst
        WHERE u.id != ?1 AND u.bot = 0 AND NOT EXISTS (SELECT 1 FROM follows WHERE src = ?1 AND dst = u.id)
        AND NOT EXISTS (SELECT 1 FROM follows WHERE src = u.id AND dst = ?1) AND NOT ${BLOCKED('?1', 'u.id')}
        GROUP BY u.id ORDER BY mutual DESC, u.name COLLATE NOCASE LIMIT 12`).bind(me.id),
    ])
    const out = { friends: [], requests: [], pending: [] }
    for (const u of all.results) out[u.i_added && u.added_me ? 'friends' : u.added_me ? 'requests' : 'pending'].push(publicUser(u))
    out.suggested = fof.results.map(u => ({ ...publicUser(u), relation: 'none', mutual: u.mutual, via: u.via }))
    return json(out)
  }
  if ((p = m('/friends/(\\w+)'))) {
    const user = await userByHandle(db, p[1])
    if (user.id === me.id) fail(400, 'thatsYou')
    if (method === 'POST') {
      if (user.bot || (await db.prepare(`SELECT 1 WHERE ${BLOCKED('?1', '?2')}`).bind(me.id, user.id).first())) fail(403, 'cantAdd', { handle: user.handle })
      const count = await db.prepare('SELECT COUNT(*) n FROM follows WHERE src = ?').bind(me.id).first('n')
      if (count >= 500) fail(429, 'manyFriends')
      const added = await db.prepare('INSERT OR IGNORE INTO follows (src, dst, created) VALUES (?, ?, ?)').bind(me.id, user.id, Date.now()).run()
      if (added.meta.changes) {
        const back = await db.prepare('SELECT 1 FROM follows WHERE src = ? AND dst = ?').bind(user.id, me.id).first()
        later(push(env, db, user.id, back
          ? { title: me.name, key: 'friendBack', url: `#chat/${me.handle}`, tag: 'friend-' + me.handle }
          : { title: me.name, key: 'request', vars: { handle: me.handle }, url: `#user/${me.handle}`, tag: 'friend-' + me.handle }))
      }
    } else if (method === 'DELETE') {
      await db.prepare('DELETE FROM follows WHERE (src = ?1 AND dst = ?2) OR (src = ?2 AND dst = ?1)').bind(me.id, user.id).run()
    }
    const [withRel] = await withRelations(db, me, [user])
    return json({ user: withRel })
  }

  // Your invite link: whoever opens it and joins becomes your friend straight away (you agreed by sharing it)
  if (method === 'GET' && path === '/invite') return json({ code: me.invite || (await setInvite(db, me.id)) })
  if (method === 'POST' && path === '/invite/reset') return json({ code: await setInvite(db, me.id) })
  if (method === 'POST' && (p = m('/invite/(\\w{10})/accept'))) {
    const inviter = await db.prepare('SELECT * FROM users WHERE invite = ? AND bot = 0').bind(p[1]).first()
    if (!inviter) fail(404, 'inviteGone')
    if (inviter.id === me.id) return json({ user: { ...publicUser(me), relation: 'me' } })
    await limit(db, 'invite:' + inviter.id, 60, 86400_000)
    if (await befriend(db, me.id, inviter.id)) later(push(env, db, inviter.id, { title: me.name, key: 'joined', url: `#chat/${me.handle}`, tag: 'friend-' + me.handle }))
    const [withRel] = await withRelations(db, me, [inviter])
    return json({ user: withRel })
  }

  // ---------- chats ----------

  if (method === 'GET' && path === '/chats') {
    const now = Date.now()
    const [people, groups] = await db.batch([
      db.prepare(`SELECT u.*,
        (SELECT MAX(created) FROM messages WHERE group_id IS NULL AND hidden = 0 AND ((src = ?1 AND dst = u.id) OR (src = u.id AND dst = ?1)) AND created <= ?2) last_at,
        (SELECT src FROM messages WHERE group_id IS NULL AND hidden = 0 AND ((src = ?1 AND dst = u.id) OR (src = u.id AND dst = ?1)) AND created <= ?2 ORDER BY created DESC LIMIT 1) last_src,
        (SELECT duration FROM messages WHERE group_id IS NULL AND hidden = 0 AND ((src = ?1 AND dst = u.id) OR (src = u.id AND dst = ?1)) AND created <= ?2 ORDER BY created DESC LIMIT 1) last_duration,
        (SELECT COUNT(*) FROM messages WHERE src = u.id AND dst = ?1 AND group_id IS NULL AND hidden = 0 AND heard = 0 AND created <= ?2) unread
        FROM users u WHERE u.id IN (${FRIENDS})`).bind(me.id, now),
      db.prepare(`SELECT g.*,
        (SELECT MAX(created) FROM messages WHERE group_id = g.id AND hidden = 0) last_at,
        (SELECT src FROM messages WHERE group_id = g.id AND hidden = 0 ORDER BY created DESC LIMIT 1) last_src,
        (SELECT u.name FROM messages mm JOIN users u ON u.id = mm.src WHERE mm.group_id = g.id AND mm.hidden = 0 ORDER BY mm.created DESC LIMIT 1) last_name,
        (SELECT duration FROM messages WHERE group_id = g.id AND hidden = 0 ORDER BY created DESC LIMIT 1) last_duration,
        (SELECT COUNT(*) FROM messages mm WHERE mm.group_id = g.id AND mm.src != ?1 AND mm.hidden = 0 AND mm.created > gm.last_heard AND NOT ${BLOCKED('?1', 'mm.src')}) unread,
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) members
        FROM chat_groups g JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = ?1`).bind(me.id),
    ])
    const chats = [
      ...people.results.map(u => ({ user: publicUser(u), lastAt: u.last_at, lastMine: u.last_src === me.id, lastDuration: u.last_duration, unread: u.unread })),
      ...groups.results.map(g => ({
        group: { id: g.id, name: g.name, emoji: g.emoji, members: g.members },
        lastAt: g.last_at || g.created, lastMine: g.last_src === me.id, lastName: g.last_name, lastDuration: g.last_duration, unread: g.unread,
      })),
    ].sort((a, b) => (b.lastAt || 0) - (a.lastAt || 0) || (a.user || a.group).name.localeCompare((b.user || b.group).name))
    return json({ chats })
  }
  if ((p = m('/chats/(\\w+)'))) {
    const other = await chatPartner(db, me, p[1])
    if (method === 'GET') {
      const { after, before } = pageOf(url)
      const where = '((m.src = ?1 AND m.dst = ?2) OR (m.src = ?2 AND m.dst = ?1)) AND m.group_id IS NULL AND m.hidden = 0'
      const { results } = await db.prepare(`SELECT ${MSG_COLS} FROM messages m WHERE ${where} AND m.created > ?3 AND m.created < ?4
        ORDER BY m.created ${after ? 'ASC' : 'DESC'} LIMIT ${PAGE}`).bind(me.id, other.id, after, before).all()
      const rows = after ? results : results.reverse()
      const out = { user: publicUser(other), messages: rows.map(r => message(r, me)), more: !after && results.length === PAGE }
      if (after) {
        const { results: mine } = await db.prepare('SELECT id, heard FROM messages WHERE src = ?1 AND dst = ?2 AND group_id IS NULL ORDER BY created DESC LIMIT 30').bind(me.id, other.id).all()
        out.status = Object.fromEntries(mine.map(r => [r.id, { heard: !!r.heard }]))
      }
      return json(out)
    }
    if (method === 'POST') {
      await messageLimit(db, me)
      const clip = await readClip(request)
      const dup = clip.cid && await db.prepare(`SELECT ${MSG_COLS} FROM messages m WHERE m.src = ? AND m.cid = ?`).bind(me.id, clip.cid).first()
      if (dup) return json({ message: message(dup, me) })
      const now = Date.now(), id = rid()
      await db.prepare('INSERT INTO messages (id, src, dst, audio, mime, duration, wave, fx, cid, created) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(id, me.id, other.id, clip.audio, clip.mime, clip.duration, clip.wave, clip.fx, clip.cid, now).run()
      later(push(env, db, other.id, { title: me.name, key: 'dm', vars: { d: fmt(clip.duration) }, url: `#chat/${me.handle}`, tag: 'chat-' + me.handle }))
      later(transcribe(env, ai, clip, { message: id }))
      return json({ message: message({ id, src: me.id, mime: clip.mime, duration: clip.duration, wave: clip.wave, fx: clip.fx, heard: 0, created: now }, me) })
    }
  }
  if (method === 'POST' && (p = m('/messages/([\\w-]+)/heard'))) {
    await db.prepare('UPDATE messages SET heard = 1 WHERE id = ? AND dst = ? AND group_id IS NULL').bind(p[1], me.id).run()
    return json({ ok: true })
  }

  // Group chats: voice messages to everyone in the group
  if (method === 'POST' && path === '/groups') {
    const b = await body(request)
    const members = await friendsByHandle(db, me, b.members)
    if (members.length < 2) fail(400, 'pickTwo')
    if (members.length > MAX_GROUP - 1) fail(400, 'groupMax', { n: MAX_GROUP })
    const made = await db.prepare('SELECT COUNT(*) n FROM chat_groups WHERE created_by = ? AND created > ?').bind(me.id, Date.now() - 86400_000).first('n')
    if (made >= 20) fail(429, 'manyGroups')
    const id = rid(), now = Date.now()
    const name = cleanName(b.name || '', 30, '') || [me, ...members].map(u => u.name.split(' ')[0]).join(', ').slice(0, 30)
    const emoji = b.emoji ? cleanEmoji(b.emoji) : '💬'
    await db.batch([
      db.prepare('INSERT INTO chat_groups (id, name, emoji, created_by, created) VALUES (?, ?, ?, ?, ?)').bind(id, name, emoji, me.id, now),
      ...[me, ...members].map(u => db.prepare('INSERT INTO group_members (group_id, user_id, last_heard, joined) VALUES (?, ?, ?, ?)').bind(id, u.id, now, now)),
    ])
    for (const u of members) later(push(env, db, u.id, { title: name, key: 'groupAdded', vars: { name: me.name }, url: `#group/${id}`, tag: 'group-' + id }))
    return json({ group: { id, name, emoji } })
  }
  if ((p = m('/groups/([\\w-]+)'))) {
    const group = await groupFor(db, me, p[1])
    if (method === 'GET') {
      const { after, before } = pageOf(url)
      const [msgs, members] = await db.batch([
        db.prepare(`SELECT ${MSG_COLS}, u.handle, u.name, u.emoji, u.hue, u.bot,
          (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = m.group_id AND gm.user_id != m.src AND gm.last_heard >= m.created) heard_by
          FROM messages m JOIN users u ON u.id = m.src WHERE m.group_id = ?1 AND m.hidden = 0 AND m.created > ?2 AND m.created < ?3
          AND NOT ${BLOCKED('?4', 'm.src')} ORDER BY m.created ${after ? 'ASC' : 'DESC'} LIMIT ${PAGE}`).bind(group.id, after, before, me.id),
        db.prepare('SELECT u.* FROM group_members gm JOIN users u ON u.id = gm.user_id WHERE gm.group_id = ? ORDER BY gm.joined, u.name').bind(group.id),
      ])
      const rows = after ? msgs.results : msgs.results.reverse()
      const out = {
        group: { id: group.id, name: group.name, emoji: group.emoji, members: members.results.map(publicUser) },
        messages: rows.map(r => ({ ...message({ ...r, heard: r.src === me.id ? r.heard_by > 0 : r.created <= group.last_heard }, me), user: publicUser({ ...r, id: r.src }), heardBy: r.heard_by })),
        more: !after && msgs.results.length === PAGE,
      }
      if (after) {
        const { results: mine } = await db.prepare(`SELECT m.id, (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = m.group_id AND gm.user_id != m.src AND gm.last_heard >= m.created) heard_by
          FROM messages m WHERE m.group_id = ? AND m.src = ? ORDER BY m.created DESC LIMIT 30`).bind(group.id, me.id).all()
        out.status = Object.fromEntries(mine.map(r => [r.id, { heard: r.heard_by > 0, heardBy: r.heard_by }]))
      }
      return json(out)
    }
    if (method === 'POST') {
      await messageLimit(db, me)
      const clip = await readClip(request)
      const dup = clip.cid && await db.prepare(`SELECT ${MSG_COLS} FROM messages m WHERE m.src = ? AND m.cid = ?`).bind(me.id, clip.cid).first()
      if (dup) return json({ message: { ...message(dup, me), user: publicUser(me), heardBy: 0 } })
      const now = Date.now(), id = rid()
      await db.batch([
        db.prepare('INSERT INTO messages (id, src, dst, group_id, audio, mime, duration, wave, fx, cid, created) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
          .bind(id, me.id, group.id, group.id, clip.audio, clip.mime, clip.duration, clip.wave, clip.fx, clip.cid, now),
        db.prepare('UPDATE group_members SET last_heard = MAX(last_heard, ?) WHERE group_id = ? AND user_id = ?').bind(now, group.id, me.id),
      ])
      later(transcribe(env, ai, clip, { message: id }))
      const { results: others } = await db.prepare('SELECT user_id FROM group_members WHERE group_id = ? AND user_id != ?').bind(group.id, me.id).all()
      for (const o of others) later(push(env, db, o.user_id, { title: group.name, key: 'groupMsg', vars: { name: me.name, d: fmt(clip.duration) }, url: `#group/${group.id}`, tag: 'group-' + group.id }))
      return json({ message: { ...message({ id, src: me.id, mime: clip.mime, duration: clip.duration, wave: clip.wave, fx: clip.fx, heard: 0, created: now }, me), user: publicUser(me), heardBy: 0 } })
    }
    if (method === 'DELETE') {
      await db.batch([
        db.prepare('DELETE FROM group_members WHERE group_id = ? AND user_id = ?').bind(group.id, me.id),
        db.prepare('DELETE FROM chat_groups WHERE id = ?1 AND NOT EXISTS (SELECT 1 FROM group_members WHERE group_id = ?1)').bind(group.id),
        db.prepare("DELETE FROM voice_fts WHERE kind = 'm' AND ref IN (SELECT id FROM messages WHERE group_id = ?1) AND NOT EXISTS (SELECT 1 FROM chat_groups WHERE id = ?1)").bind(group.id),
        db.prepare('DELETE FROM messages WHERE group_id = ?1 AND NOT EXISTS (SELECT 1 FROM chat_groups WHERE id = ?1)').bind(group.id),
      ])
      return json({ ok: true })
    }
  }
  if (method === 'POST' && (p = m('/groups/([\\w-]+)/heard'))) {
    const group = await groupFor(db, me, p[1])
    const at = Math.min(Number((await body(request)).at) || 0, Date.now())
    await db.prepare('UPDATE group_members SET last_heard = MAX(last_heard, ?) WHERE group_id = ? AND user_id = ?').bind(at, group.id, me.id).run()
    return json({ ok: true })
  }
  if (method === 'POST' && (p = m('/groups/([\\w-]+)/members'))) {
    const group = await groupFor(db, me, p[1])
    const adding = await friendsByHandle(db, me, (await body(request)).members)
    const count = await db.prepare('SELECT COUNT(*) n FROM group_members WHERE group_id = ?').bind(group.id).first('n')
    if (count + adding.length > MAX_GROUP) fail(400, 'groupMax', { n: MAX_GROUP })
    const now = Date.now()
    if (adding.length) await db.batch(adding.map(u => db.prepare('INSERT OR IGNORE INTO group_members (group_id, user_id, last_heard, joined) VALUES (?, ?, ?, ?)').bind(group.id, u.id, now, now)))
    for (const u of adding) later(push(env, db, u.id, { title: group.name, key: 'groupAdded', vars: { name: me.name }, url: `#group/${group.id}`, tag: 'group-' + group.id }))
    return json({ ok: true })
  }

  // ---------- notifications and passkeys ----------

  if (method === 'GET' && path === '/push/key') return json({ key: vapidPublicKey(env) })
  if (path === '/push') {
    const b = await body(request)
    const endpoint = String(b.endpoint || '')
    if (!/^https:\/\/[^\s]{10,900}$/.test(endpoint)) fail(400, 'badSub')
    if (method === 'POST') {
      const { p256dh, auth: secret } = b.keys || {}
      if (!/^[\w-]{80,100}$/.test(p256dh || '') || !/^[\w-]{16,30}$/.test(secret || '')) fail(400, 'badSub')
      await db.batch([
        db.prepare('INSERT OR REPLACE INTO push_subs (endpoint, user_id, p256dh, auth, created, session) VALUES (?, ?, ?, ?, ?, ?)').bind(endpoint, me.id, p256dh, secret, Date.now(), me.sid),
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
    await push(env, db, me.id, { title: 'Yap', key: 'test', url: '#chats', tag: 'test' })
    return json({ ok: true })
  }
  if (method === 'POST' && path === '/passkeys/options') return json(await registrationOptions(db, rp, me))
  if (method === 'POST' && path === '/passkeys') return json({ ok: true, passkeys: await registerPasskey(db, rp, me.id, await body(request)) })

  // ---------- audio ----------

  if (method === 'GET' && (p = m('/audio/(p|m|b)/([\\w-]+)'))) {
    const row = p[1] === 'p'
      ? await db.prepare(`SELECT p.audio, p.mime FROM posts p JOIN users u ON u.id = p.user_id WHERE p.id = ?2 AND ${VISIBLE}`).bind(me.id, p[2]).first()
      : p[1] === 'b'
        ? await db.prepare(`SELECT bio_audio audio, bio_mime mime FROM users u WHERE handle = ?2 AND NOT ${BLOCKED('?1', 'u.id')}`).bind(me.id, p[2]).first()
        : await db.prepare(`SELECT audio, mime FROM messages WHERE id = ?2 AND hidden = 0 AND ((group_id IS NULL AND (src = ?1 OR dst = ?1))
            OR group_id IN (SELECT group_id FROM group_members WHERE user_id = ?1))`).bind(me.id, p[2]).first()
    if (!row || !row.audio) fail(404, 'notFound')
    return new Response(new Uint8Array(row.audio), { headers: { 'content-type': row.mime, 'cache-control': 'private, max-age=31536000, immutable' } })
  }

  // ---------- moderation (handles listed in the YAP_ADMINS variable) ----------

  if (path.startsWith('/admin/')) {
    if (!isAdmin(env, me)) fail(403, 'adminOnly')
    if (method === 'GET' && path === '/admin/reports') {
      const { results } = await db.prepare(`SELECT r.kind, r.target_id, r.target_user, MIN(r.created) first, COUNT(*) n, GROUP_CONCAT(r.reason) reasons,
        u.handle, u.name, u.emoji, u.hue, u.bot, u.bio_duration, u.bio_at
        FROM reports r JOIN users u ON u.id = r.target_user WHERE r.status = 'open'
        GROUP BY r.kind, r.target_id ORDER BY n DESC, first ASC LIMIT 100`).all()
      const reports = []
      for (const r of results) {
        const item = { kind: r.kind, id: r.target_id, user: publicUser(r), count: r.n, reasons: [...new Set(r.reasons.split(','))], first: r.first }
        if (r.kind === 'post') {
          const post = await db.prepare('SELECT duration, wave, transcript, hidden, created FROM posts WHERE id = ?').bind(r.target_id).first()
          if (post) Object.assign(item, { audio: `${API}/admin/audio/p/${r.target_id}`, duration: post.duration, wave: JSON.parse(post.wave), transcript: post.transcript, hidden: !!post.hidden, created: post.created })
        } else if (r.kind === 'message') {
          const msg = await db.prepare('SELECT duration, wave, transcript, hidden, created FROM messages WHERE id = ?').bind(r.target_id).first()
          if (msg) Object.assign(item, { audio: `${API}/admin/audio/m/${r.target_id}`, duration: msg.duration, wave: JSON.parse(msg.wave), transcript: msg.transcript, hidden: !!msg.hidden, created: msg.created })
        } else if (r.bio_duration) {
          Object.assign(item, { audio: `${API}/admin/audio/b/${r.target_id}?v=${r.bio_at}`, duration: r.bio_duration })
        }
        reports.push(item)
      }
      return json({ reports })
    }
    if (method === 'POST' && path === '/admin/reports') {
      const b = await body(request)
      const kind = String(b.kind), id = String(b.id)
      const stmts = [db.prepare("UPDATE reports SET status = ? WHERE kind = ? AND target_id = ? AND status = 'open'").bind(b.action === 'remove' ? 'removed' : 'dismissed', kind, id)]
      if (b.action === 'remove') {
        if (kind === 'post') stmts.push(db.prepare('UPDATE posts SET hidden = 1 WHERE id = ?1 OR reply_to = ?1').bind(id))
        else if (kind === 'message') stmts.push(db.prepare('UPDATE messages SET hidden = 1 WHERE id = ?').bind(id))
        else if (kind === 'user') {
          // The profile goes back to its handle with no voice bio, and every session ends
          stmts.push(db.prepare('UPDATE users SET name = handle, emoji = ?, bio_audio = NULL, bio_url = NULL, bio_mime = NULL, bio_duration = NULL, bio_wave = NULL, bio_fx = NULL, bio_transcript = NULL, bio_at = NULL WHERE id = ? AND bot = 0').bind('🙂', id))
          stmts.push(db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id))
        }
      } else if (kind === 'post') {
        stmts.push(db.prepare('UPDATE posts SET hidden = 0 WHERE id = ?').bind(id))
      }
      await db.batch(stmts)
      return json({ ok: true })
    }
    if (method === 'GET' && (p = m('/admin/audio/(p|m|b)/([\\w-]+)'))) {
      const kind = { p: 'post', m: 'message', b: 'user' }[p[1]]
      if (!(await db.prepare('SELECT 1 FROM reports WHERE kind = ? AND target_id = ?').bind(kind, p[2]).first())) fail(404, 'notFound')
      const row = p[1] === 'p' ? await db.prepare('SELECT audio, mime FROM posts WHERE id = ?').bind(p[2]).first()
        : p[1] === 'm' ? await db.prepare('SELECT audio, mime FROM messages WHERE id = ?').bind(p[2]).first()
          : await db.prepare('SELECT bio_audio audio, bio_mime mime FROM users WHERE id = ?').bind(p[2]).first()
      if (!row?.audio) fail(404, 'notFound')
      return new Response(new Uint8Array(row.audio), { headers: { 'content-type': row.mime, 'cache-control': 'private, no-store' } })
    }
  }

  fail(404, 'notFound')
}

// ---------- accounts and sessions ----------

async function signup(request, env, db, ipHash, later, lang) {
  const b = await body(request)
  const handle = String(b.handle || '').toLowerCase().trim().replace(/^@/, '')
  if (!/^[a-z0-9_]{3,20}$/.test(handle)) fail(400, 'handleRule')
  const recent = await db.prepare('SELECT COUNT(*) n FROM users WHERE ip_hash = ? AND created > ?').bind(ipHash, Date.now() - 86400_000).first('n')
  if (recent >= 30) fail(429, 'tooManyAccounts')
  if (await handleTaken(db, handle)) fail(409, 'handleTaken', { handle })
  const name = cleanName(b.name || handle)
  checkName(name)
  const user = { id: rid(), handle, name, emoji: cleanEmoji(b.emoji), hue: cleanHue(b.hue), bot: 0, lang: b.lang === 'de' ? 'de' : b.lang === 'en' ? 'en' : lang }
  await db.prepare("INSERT INTO users (id, handle, name, emoji, hue, bot, token_hash, ip_hash, lang, created) VALUES (?, ?, ?, ?, ?, 0, '', ?, ?, ?)")
    .bind(user.id, handle, user.name, user.emoji, user.hue, ipHash, user.lang, Date.now()).run()
  const key = await newSession(db, user.id)
  let inviter = null
  if (/^\w{10}$/.test(String(b.invite || ''))) {
    inviter = await db.prepare('SELECT * FROM users WHERE invite = ? AND bot = 0').bind(b.invite).first()
    if (inviter && await befriend(db, user.id, inviter.id)) {
      later(push(env, db, inviter.id, { title: user.name, key: 'joined', url: `#chat/${handle}`, tag: 'friend-' + handle }))
    }
  }
  return json({ key, user: publicUser(user), inviter: inviter ? publicUser(inviter) : null })
}

async function newSession(db, userId) {
  const key = 'yap_' + b64url(crypto.getRandomValues(new Uint8Array(24)))
  const now = Date.now()
  await db.batch([
    db.prepare('INSERT INTO sessions (token_hash, user_id, created, last_used) VALUES (?, ?, ?, ?)').bind(await sha(key), userId, now, now),
    db.prepare('DELETE FROM sessions WHERE user_id = ? AND last_used < ?').bind(userId, now - SESSION_IDLE),
  ])
  return key
}

async function userByKey(db, key) {
  if (!key || key.length > 100) return null
  const row = await db.prepare('SELECT u.*, s.token_hash sid, s.last_used FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND u.bot = 0').bind(await sha(key)).first()
  if (!row) return null
  if ((row.last_used || 0) < Date.now() - SESSION_IDLE) {
    await db.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(row.sid).run()
    return null
  }
  return row
}

async function auth(request, db, later) {
  const user = await userByKey(db, (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, ''))
  if (!user) fail(401, 'signIn')
  if (user.last_used < Date.now() - 3600_000) later(db.prepare('UPDATE sessions SET last_used = ? WHERE token_hash = ?').bind(Date.now(), user.sid).run())
  return user
}

const isAdmin = (env, me) => String(env.YAP_ADMINS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean).includes(me.handle)

async function mePayload(env, db, me) {
  const admin = isAdmin(env, me)
  const r = await db.prepare(`SELECT
    (SELECT COUNT(*) FROM messages WHERE dst = ?1 AND group_id IS NULL AND heard = 0 AND hidden = 0 AND created <= ?2 AND src IN (${FRIENDS})) unread,
    (SELECT COUNT(*) FROM messages m JOIN group_members gm ON gm.group_id = m.group_id AND gm.user_id = ?1
      WHERE m.src != ?1 AND m.hidden = 0 AND m.created > gm.last_heard AND NOT ${BLOCKED('?1', 'm.src')}) group_unread,
    (SELECT COUNT(*) FROM follows f WHERE f.dst = ?1 AND NOT EXISTS (SELECT 1 FROM follows WHERE src = ?1 AND dst = f.src)
      AND NOT ${BLOCKED('?1', 'f.src')}) requests,
    (SELECT COUNT(*) FROM passkeys WHERE user_id = ?1) passkeys,
    (SELECT COUNT(*) FROM sessions WHERE user_id = ?1) sessions,
    (SELECT COUNT(DISTINCT kind || target_id) FROM reports WHERE status = 'open' AND ?3) reports`).bind(me.id, Date.now(), admin ? 1 : 0).first()
  return {
    user: { ...publicUser(me), bio: bioOf(me), lang: me.lang },
    unread: r.unread + r.group_unread, requests: r.requests, passkeys: r.passkeys, sessions: r.sessions,
    admin, reports: admin ? r.reports : 0,
  }
}

async function handleTaken(db, handle) {
  return RESERVED.includes(handle) || !!(await db.prepare('SELECT 1 FROM users WHERE handle = ?').bind(handle).first())
}
/** A free username close to `handle` (greta → greta_2 …) */
async function freeHandle(db, handle) {
  const base = handle.slice(0, 17)
  const options = [2, 3, 4, 5, 6, 7, 8, 9].map(n => `${base}_${n}`)
  const marks = options.map(() => '?').join(',')
  const { results } = await db.prepare(`SELECT handle FROM users WHERE handle IN (${marks})`).bind(...options).all()
  const taken = new Set(results.map(r => r.handle))
  return options.find(h => !taken.has(h)) || `${base}_${10 + Math.floor(Math.random() * 89)}`
}

async function setInvite(db, userId) {
  for (let i = 0; i < 4; i++) {
    const code = randomCode(10).toLowerCase()
    const r = await db.prepare('UPDATE users SET invite = ? WHERE id = ? AND NOT EXISTS (SELECT 1 FROM users WHERE invite = ?)').bind(code, userId, code).run()
    if (r.meta.changes) return code
  }
  fail(500, 'generic')
}

/** Makes a and b friends both ways, unless one blocked the other. True if anything changed. */
async function befriend(db, a, b) {
  if (await db.prepare(`SELECT 1 WHERE ${BLOCKED('?1', '?2')}`).bind(a, b).first()) return false
  const now = Date.now()
  const [x, y] = await db.batch([
    db.prepare('INSERT OR IGNORE INTO follows (src, dst, created) VALUES (?, ?, ?)').bind(a, b, now),
    db.prepare('INSERT OR IGNORE INTO follows (src, dst, created) VALUES (?, ?, ?)').bind(b, a, now),
  ])
  return x.meta.changes + y.meta.changes > 0
}

// ---------- limits ----------

/** Counts one hit for `k` and refuses once there were `max` in the last `windowMs` */
async function limit(db, k, max, windowMs) {
  await peek(db, k, max, windowMs)
  await hit(db, k)
}
async function peek(db, k, max, windowMs) {
  const n = await db.prepare('SELECT COUNT(*) n FROM hits WHERE k = ? AND at > ?').bind(k, Date.now() - windowMs).first('n')
  if (n >= max) fail(429, 'slowDown')
}
async function hit(db, k) {
  const stmts = [db.prepare('INSERT INTO hits (k, at) VALUES (?, ?)').bind(k, Date.now())]
  if (Math.random() < 0.02) stmts.push(db.prepare('DELETE FROM hits WHERE at < ?').bind(Date.now() - 86400_000 * 2))
  await db.batch(stmts)
}
async function messageLimit(db, me) {
  const recent = await db.prepare('SELECT COUNT(*) n FROM messages WHERE src = ? AND created > ?').bind(me.id, Date.now() - 3600_000).first('n')
  if (recent >= 200) fail(429, 'tooManyMessages')
}

// ---------- recordings ----------

/** What the bytes are, whatever the upload claims: WebM, MP4/M4A, Ogg, MP3, AAC or WAV */
function sniff(b) {
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return 'audio/webm'
  if (b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) return 'audio/mp4'
  if (b[0] === 0x4f && b[1] === 0x67 && b[2] === 0x67 && b[3] === 0x53) return 'audio/ogg'
  if ((b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33) || (b[0] === 0xff && (b[1] & 0xe6) === 0xe2)) return 'audio/mpeg'
  if (b[0] === 0xff && (b[1] & 0xf6) === 0xf0) return 'audio/aac'
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x41) return 'audio/wav'
  return null
}

async function readClip(request) {
  const form = await request.formData()
  const file = form.get('audio')
  if (!file || typeof file === 'string') fail(400, 'noRecording')
  if (file.size > MAX_AUDIO) fail(413, 'tooLong')
  if (file.size < 200) fail(400, 'empty')
  const audio = await file.arrayBuffer()
  const mime = sniff(new Uint8Array(audio, 0, 12))
  if (!mime) fail(400, 'badAudio')
  // The phone says how long it is; it can't be longer than the bytes allow (even very quiet Opus needs ~1 KB/s)
  const duration = +Math.min(Math.max(Number(form.get('duration')) || 0, 0.3), 65, file.size / 800 + 1).toFixed(2)
  let wave
  try { wave = JSON.parse(form.get('wave') || '[]') } catch { wave = [] }
  if (!Array.isArray(wave)) wave = []
  wave = wave.slice(0, 64).map(v => Math.max(0, Math.min(99, Math.round(Number(v) || 0))))
  const fx = FX.includes(form.get('fx')) ? form.get('fx') : ''
  const cid = /^[\w-]{8,40}$/.test(form.get('cid') || '') ? form.get('cid') : null
  return { form, audio, mime, duration, wave: JSON.stringify(wave), fx, cid }
}

// Captions: Whisper on Workers AI writes what was said, with word timings for the live transcript, and indexes it for search
async function transcribe(env, ai, clip, target) {
  if (!ai) return
  const bytes = new Uint8Array(clip.audio)
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  const input = { audio: btoa(bin), ...(ai.fake ? { duration: clip.duration } : {}) }
  const run = () => ai.run('@cf/openai/whisper-large-v3-turbo', input)
  // The model is sometimes briefly busy; one retry is enough
  const out = await run().catch(() => new Promise(r => setTimeout(r, 2000)).then(run))
  const text = String(out?.text || '').replace(/\s+/g, ' ').trim().slice(0, 2000)
  if (!text) return
  const words = wordsOf(out)
  const db = env.DB
  if (target.bio) {
    await db.prepare('UPDATE users SET bio_transcript = ? WHERE id = ? AND bio_at = ?').bind(text, target.bio, target.at).run()
  } else {
    const [table, kind, id] = target.post ? ['posts', 'p', target.post] : ['messages', 'm', target.message]
    const done = await db.prepare(`UPDATE ${table} SET transcript = ?, words = ? WHERE id = ?`).bind(text, words.length ? JSON.stringify(words) : null, id).run()
    if (done.meta.changes) await db.prepare('INSERT INTO voice_fts (transcript, kind, ref) VALUES (?, ?, ?)').bind(text, kind, id).run()
  }
}
function wordsOf(out) {
  const list = Array.isArray(out?.words) ? out.words : (Array.isArray(out?.segments) ? out.segments : []).flatMap(s => (Array.isArray(s.words) ? s.words : []))
  return list.slice(0, 900)
    .map(w => [Math.round(Number(w.start) * 100) / 100, Math.round(Number(w.end) * 100) / 100, String(w.word || '').trim()])
    .filter(w => w[2] && Number.isFinite(w[0]) && Number.isFinite(w[1]))
}
const parseWords = s => { try { return s ? JSON.parse(s) : null } catch { return null } }

function deletePost(db, id) {
  return [
    db.prepare("DELETE FROM voice_fts WHERE kind = 'p' AND ref IN (SELECT id FROM posts WHERE id = ?1 OR reply_to = ?1)").bind(id),
    db.prepare('DELETE FROM reactions WHERE post_id = ?1 OR post_id IN (SELECT id FROM posts WHERE reply_to = ?1)').bind(id),
    db.prepare('DELETE FROM plays WHERE post_id = ?1 OR post_id IN (SELECT id FROM posts WHERE reply_to = ?1)').bind(id),
    db.prepare('DELETE FROM posts WHERE id = ?1 OR reply_to = ?1').bind(id),
  ]
}

// ---------- rows to JSON ----------

async function visiblePost(db, me, id) {
  return db.prepare(`SELECT ${POST_COLS} FROM posts p JOIN users u ON u.id = p.user_id WHERE p.id = ?2 AND ${VISIBLE}`).bind(me.id, id).first()
}

function postOut(r, me, lang) {
  const de = lang === 'de' && r.id === WELCOME
  return {
    id: r.id,
    user: publicUser({ id: r.user_id, handle: r.handle, name: r.name, emoji: r.emoji, hue: r.hue, bot: r.bot }),
    audio: de ? WELCOME_DE.audio : r.audio_url || `${API}/audio/p/${r.id}`,
    mime: r.mime, duration: de ? WELCOME_DE.duration : r.duration, wave: JSON.parse(r.wave), fx: r.fx, created: r.created,
    replyTo: r.reply_to, mineAuthor: !!me && r.user_id === me.id,
    transcript: de ? WELCOME_DE.transcript : r.transcript || null, words: de ? null : parseWords(r.words),
    prompt: r.prompt ? promptFor(r.prompt, lang) : null, removed: !!r.hidden,
  }
}

// Adds likes, the viewer's like, visible reply counts and who heard it to post rows
async function decorate(db, me, rows, lang) {
  if (!rows.length) return []
  const ids = rows.map(r => r.id)
  const marks = ids.map((_, i) => '?' + (i + 2)).join(',')
  const [reacts, replies, plays] = await db.batch([
    db.prepare(`SELECT post_id, emoji, COUNT(*) n, MAX(user_id = ?1) mine FROM reactions WHERE post_id IN (${marks}) GROUP BY post_id, emoji`).bind(me.id, ...ids),
    db.prepare(`SELECT p.reply_to, COUNT(*) n FROM posts p JOIN users u ON u.id = p.user_id WHERE p.reply_to IN (${marks}) AND ${VISIBLE} GROUP BY p.reply_to`).bind(me.id, ...ids),
    db.prepare(`SELECT post_id, COUNT(*) n, MAX(user_id = ?1) mine FROM plays WHERE post_id IN (${marks}) GROUP BY post_id`).bind(me.id, ...ids),
  ])
  return rows.map(r => {
    const reactions = {}
    let mine = null
    for (const x of reacts.results) if (x.post_id === r.id) { reactions[x.emoji] = x.n; if (x.mine) mine = x.emoji }
    const pl = plays.results.find(x => x.post_id === r.id)
    const own = r.user_id === me.id
    return {
      ...postOut(r, me, lang), reactions, mine,
      replies: replies.results.find(x => x.reply_to === r.id)?.n || 0,
      heard: own || !!pl?.mine || !!r.bot, heardBy: own ? pl?.n || 0 : undefined,
    }
  })
}

async function withRelations(db, me, users) {
  if (!users.length) return []
  const ids = users.map(u => u.id)
  const marks = ids.map((_, i) => '?' + (i + 2)).join(',')
  const [follows, blocks] = await db.batch([
    db.prepare(`SELECT src, dst FROM follows WHERE (src = ?1 AND dst IN (${marks})) OR (dst = ?1 AND src IN (${marks}))`).bind(me.id, ...ids),
    db.prepare(`SELECT dst FROM blocks WHERE src = ?1 AND dst IN (${marks})`).bind(me.id, ...ids),
  ])
  return users.map(u => {
    const iAdded = follows.results.some(f => f.src === me.id && f.dst === u.id)
    const addedMe = follows.results.some(f => f.src === u.id && f.dst === me.id)
    const relation = u.id === me.id ? 'me' : u.bot ? 'bot' : blocks.results.some(b => b.dst === u.id) ? 'blocked'
      : iAdded && addedMe ? 'friend' : iAdded ? 'pending' : addedMe ? 'request' : 'none'
    return { ...publicUser(u), relation }
  })
}

async function userByHandle(db, handle) {
  const user = await db.prepare('SELECT * FROM users WHERE handle = ?').bind(String(handle || '').toLowerCase()).first()
  if (!user) fail(404, 'noUser')
  return user
}

async function chatPartner(db, me, handle) {
  const other = await userByHandle(db, handle)
  const friend = other.id !== me.id && !other.bot && await db.prepare(`SELECT 1 FROM (${FRIENDS}) f WHERE f.dst = ?2`).bind(me.id, other.id).first()
  if (!friend) fail(403, 'friendsOnly')
  return other
}

// The users behind `handles`, all of whom must be friends of `me`
async function friendsByHandle(db, me, handles) {
  const list = [...new Set((Array.isArray(handles) ? handles : []).map(h => String(h).toLowerCase()))].slice(0, MAX_GROUP)
  if (!list.length) return []
  const marks = list.map((_, i) => '?' + (i + 2)).join(',')
  const { results } = await db.prepare(`SELECT * FROM users WHERE handle IN (${marks}) AND id IN (${FRIENDS})`).bind(me.id, ...list).all()
  if (results.length !== list.length) fail(400, 'groupFriends')
  return results
}

async function groupFor(db, me, id) {
  const group = await db.prepare('SELECT g.*, gm.last_heard FROM chat_groups g JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = ? WHERE g.id = ?').bind(me.id, id).first()
  if (!group) fail(404, 'groupGone')
  return group
}

/** Sends a notification in the recipient's language */
async function push(env, db, userId, { title, key, vars, url, tag }) {
  if (!env.VAPID_PRIVATE) return
  const lang = await db.prepare('SELECT lang FROM users WHERE id = ?').bind(userId).first('lang')
  await notify(env, userId, { title, body: say(PUSH, key, lang, vars), url, tag })
}

const pageOf = url => {
  const after = Number(url.searchParams.get('after')) || 0
  const before = Number(url.searchParams.get('before')) || Date.now() + 1
  return { after, before: Math.min(before, Date.now() + 1) }
}
const message = (r, me) => ({
  id: r.id, mine: r.src === me.id, audio: r.audio_url || `${API}/audio/m/${r.id}`, mime: r.mime,
  duration: r.duration, wave: typeof r.wave === 'string' ? JSON.parse(r.wave) : r.wave, fx: r.fx, heard: !!r.heard,
  transcript: r.transcript || null, words: parseWords(r.words), created: r.created,
})
const bioOf = (u, src) => (u.bio_duration ? {
  audio: u.bio_url || src || `${API}/audio/b/${u.handle}?v=${u.bio_at}`, duration: u.bio_duration,
  wave: JSON.parse(u.bio_wave || '[]'), fx: u.bio_fx || '', transcript: u.bio_transcript || null,
} : null)
const publicUser = u => ({ handle: u.handle, name: u.name, emoji: u.emoji, hue: u.hue, bot: !!u.bot })
// Names: no control, zero-width or direction-flipping characters, at most 40 characters
const cleanName = (s, max = 40, fallback = 'Someone') => [...String(s ?? '').normalize('NFC')
  .replace(/[\u0000-\u001f\u007f-\u009f­؜ᅟᅠ᠎​-‏‪-‮⁠-⁯ㅤ︀-︎﻿]/g, '')
  .replace(/\s+/g, ' ').trim()].slice(0, max).join('').trim() || fallback
// Nobody else can be called "Yap" (or look like the team)
const checkName = name => { if (RESERVED.includes(name.toLowerCase().normalize('NFD').replace(/[^a-z]/g, ''))) fail(400, 'nameReserved') }
const cleanEmoji = s => (s && [...String(s)].length <= 8 && !/[\w<>\s]/.test(s) ? String(s) : '🙂')
const cleanHue = h => ((Math.round(Number(h)) % 360) + 360) % 360 || 0
const fmt = s => Math.floor(Math.round(s) / 60) + ':' + String(Math.round(s) % 60).padStart(2, '0')
// The day in Vienna (YYYY-MM-DD); everyone gets the same question that day
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Vienna' }).format(new Date())
const promptFor = (day, lang) => PROMPTS[Math.floor(Date.parse(day + 'T00:00:00Z') / 86400_000) % PROMPTS.length][lang === 'de' ? 1 : 0]
const rid = () => b64url(crypto.getRandomValues(new Uint8Array(12)))
// Codes people type: no 0/O or 1/I/L to confuse
const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'
function randomCode(n) {
  let out = ''
  while (out.length < n) {
    // 248 = 8 × 31: dropping the bytes above it keeps every character equally likely
    for (const b of crypto.getRandomValues(new Uint8Array(n * 2))) if (b < 248 && out.length < n) out += CODE_ALPHABET[b % 31]
  }
  return out
}
const b64url = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
async function sha(s) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join('')
}
async function body(request) {
  try { return await request.json() } catch { return {} }
}
