// Blank's social side (/blank/api/social/*): profiles, friends, posts, a feed, likes, blocking, reports and an admin
// queue. Needs an account (worker/blank-account.js; the token is the same one), except the public feed and its photos.
//
//   GET    /social/me                                       → your profile (+ admin flag, rules accepted?)
//   PATCH  /social/me              { name?, bio? }
//   POST   /social/me/rules                                 you agreed to the rules (needed before posting)
//   PUT    /social/me/avatar       body = image             profile picture
//   GET    /social/avatar/:username                         → image
//   GET    /social/search?q=                                → users whose username or a word of whose name starts
//                                                           with q (accents optional), with mutual friends
//   GET    /social/sameplans?guides=a,b&titles=x|y      → { users }  people who posted publicly from the same plans
//   GET    /social/known                                     → { users }  people you may know: friends of your friends,
//                                                           most mutual friends first
//   GET    /social/suggestions?cats=a,b                     → { users }  people who posted publicly in these hobbies
//   GET    /social/users/:username                          → profile, friendship, their posts you may see
//   POST   /social/users/:username/report  { reason }       report a profile (name, bio or picture)
//   GET    /social/invite                                   → { code }  your invite code (made on first use)
//   GET    /social/invite/:username/:code   (no login)      → { user }  who invited you, for the invite page
//   GET    /social/friends                                  → { friends, incoming, outgoing }
//   POST   /social/friends/:username       { invite? }      ask (or accept if they asked you); with their invite
//                                                           code you're friends right away → { relation, invited }
//   DELETE /social/friends/:username                        cancel, decline or unfriend
//   POST   /social/blocks/:username   /  DELETE             block (also ends the friendship) / unblock
//   POST   /social/push   { endpoint, keys, lang }  /  DELETE { endpoint }   notifications for this account (blank-notify.js)
//   GET    /social/feed?scope=friends|public&before=        → { posts }  20 at a time, newest first; public works
//                                                           without an account too (cached a minute)
//   POST   /social/posts               { kind, project, category, text, visibility, photo?, ratio?, guide?, plan?, lang? } → { post }
//                                       photo = data: URL of the image. Photos are checked by Workers AI first.
//   POST   /social/posts               { ..., cost?, time?, media: [{ ratio }] } → { post }
//                                       several photos: the post waits ('uploading', only you see it) while they come
//   PUT    /social/posts/:id/media/:n  body = photo n           each checked by Workers AI as it comes
//   POST   /social/posts/:id/publish                            → { post }  all photos up: live, or 'review' if a check said no
//   GET    /social/posts/:id/media/:n                           → photo n
//   GET    /social/posts/:id                                → { post }  if you may see it
//   DELETE /social/posts/:id                                your own (or any, for the admin)
//   GET    /social/posts/:id/photo                          → image, if you may see the post
//   POST   /social/posts/:id/start      { device } (login optional) → { started }  someone started a project from it
//   POST   /social/posts/:id/like  /  DELETE
//   POST   /social/posts/:id/report    { reason }           3 reports from different people hide a post
//   GET    /social/chats                                    → { chats }  yours, newest first, with the last message and unread count
//   GET    /social/chats/unread                             → { n, requests }  chats with something new, friend requests waiting
//   POST   /social/chats               { with: [usernames], name?, hobby? } → { id }  one friend and no name: your
//                                                           one-to-one chat with them (made once); else a group chat
//   GET    /social/chats/:id?after=|before=                 → { chat, messages, more }  marks it read
//   PATCH  /social/chats/:id           { name, hobby? }     rename a group
//   POST   /social/chats/:id/messages  { kind: 'text'|'checkin', text, project?, category?, steps?, last?, lang?, guide? } → { message }
//                                                           a check-in's steps ({ text, done }) come back as message.progress;
//                                                           reply: the id of a message in this chat it answers
//   PUT    /social/chats/:id/photo?text=&reply=&ratio=  body = the photo → { message }  checked by Workers AI first;
//                                                           refused (not held back) when it isn't clearly fine
//   GET    /social/messages/:id/photo                       → the photo (members of the chat, and the admin)
//   POST   /social/messages/:id/react  { emoji | null }    one reaction per person; null takes yours back
//   DELETE /social/messages/:id                            unsend your own message (its photo goes too)
//   A chat's GET with ?after= also returns messages changed since then (reactions, unsends) and seen: the time the
//   other person last read a one-to-one chat.
//   POST   /social/chats/:id/typing                         you're typing (the others see "typing…" for 6 s, in GET's typing)
//   POST   /social/chats/:id/messages  { kind: 'share', text?, share: { type: 'post', id } | { type: 'plan', title, category, steps, lang, guide } }
//   POST   /social/projects         { with: username, plan: { title, category, guide, steps, lang, materials }, done? } → { id }
//                                    "Do this together": a project chat with a friend (at most 3 active per pair)
//   POST   /social/chats/:id/join | progress { done, total, step } | poke | items { text } | sessions { at, place }
//   PATCH  /social/chats/:id/items/:item  { claim?, bought? }   /  DELETE   ·   DELETE /social/chats/:id/sessions/:id
//   POST   /social/requests/:username  { text }   a message request to someone who isn't your friend (only if they
//                                    turned requests on, 16+) → { id };  POST /social/chats/:id/accept | decline
//   PATCH  /social/me  { requests: bool, birthYear? }   who can write to you (requests only 16+)
//   POST   /social/chats/:id/members   { add: [usernames] } add friends to a group
//   POST   /social/chats/:id/leave                          leave a group (the last one out deletes it)
//   POST   /social/messages/:id/report { reason }           the admin gets an email and sees it in the queue
//   POST   /social/posts  { ..., madeFrom: post id }       a result made by following that post: shows under it
//   GET    /social/posts/:id/made                          → { posts }  results people made from this post
//   GET    /social/posts/:id/comments                      → { comments }  oldest first
//   POST   /social/posts/:id/comments  { text }            → { comment }  anyone with an account who can see the post
//   PATCH  /social/posts/:id           { commentsOff }     the author turns comments off or on
//   DELETE /social/comments/:id                            yours, or any under your post (or any, for the admin)
//   POST   /social/comments/:id/report { reason }          3 reports hide it until the admin checks
//   POST   /social/admin/comments/:id  { action: 'dismiss' | 'remove' | 'ban' }
//   GET    /social/admin                                    → { posts, users, messages, stats, firstPosts }: firstPosts = new
//                                                           people's first posts this week you haven't liked yet; posts waiting for review or reported, reported profiles and
//                                                           chat messages; stats.days = the last 7 days' visits (by source), new accounts and projects
//   POST   /social/admin/messages/:id  { action: 'dismiss' | 'remove' | 'ban' }
//   POST   /social/admin/posts/:id     { action: 'approve' | 'remove' | 'ban' }
//   POST   /social/admin/users/:username { action: 'dismiss' | 'clear' | 'ban' }   clear = wipe name, bio and picture
//
// Who sees a post: 'friends' posts only your accepted friends; 'public' posts everyone, also without an account
// (guestRoute: the public feed and its photos, read-only).
// Blocking hides both people from each other everywhere. A post with a photo the AI check doesn't clear, or with text
// the word check (worker/blank-words.js) catches, waits in the admin queue ('review') and only its author sees it until
// then. Names and bios the word check catches are refused. Banned people keep their own projects but are gone from
// everyone else's view and can't change their profile, post, like, report or add friends.
// Tables: worker/migrations/0340_blank_social.sql, 0360_blank_user_reports.sql, 0420_blank_chats.sql.
// Chats are only between friends; the word check refuses a message outright.
//
// Alerts: ALERT_EMAIL (secret), or every admin with an email on their account, gets an email when the photo check holds a post back, when a post
// is reported for the first time, when reports hide it, and when a profile is reported for the first time. Sent through Resend (RESEND_KEY), like the reset emails.
import { auth, sendEmail, sha256 } from './blank-account.js'
import { alertRecipients } from './limits.js'
import { badWords } from './blank-words.js'
import { notifyUser, savePush } from './blank-notify.js'

const VISION = '@cf/moondream/moondream3.1-9B-A2B' // was llava-1.5-7b, which Cloudflare switches off on Nov 20, 2026
const PHOTO_MAX = 4_000_000
const MEDIA_MAX = 10
const COSTS = ['free', 'cheap', 'more', 'some']
const TIMES = ['hour', 'hours', 'days', 'weeks', 'months']
const PHOTO_TYPES = /^image\/(jpeg|png|webp|gif)$/
const POSTS_PER_DAY = 30
const REQUESTS_PER_DAY = 60
const REPORTS_PER_DAY = 30
const AVATARS_PER_DAY = 10 // each new picture runs the AI photo check, so changing it can't use up the day's AI
const STARTS_PER_DAY = 40 // "started because of you" counts per network and day
const HIDE_AFTER_REPORTS = 3
const PAGE = 20
const DAY = 86_400_000
const KINDS = ['update', 'finish']
const VIS = ['friends', 'public']
const REASONS = ['spam', 'mean', 'nudity', 'violence', 'notmine', 'other']
const CHATS_PER_DAY = 20
const MESSAGES_PER_DAY = 600
const GROUP_MAX = 20
const MESSAGE_PAGE = 60
const CHAT_PHOTOS_PER_DAY = 30 // each photo runs the AI photo check, like a post's
const REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🔥']
const COMMENTS_PER_DAY = 200
const COMMENT_PAGE = 100
const HOBBIES = ['art', 'music', 'crafts', 'cooking', 'tech', 'outdoors', 'fitness', 'writing', 'photo', 'garden', 'wood', 'learn', 'other']

class HttpError extends Error {
  constructor(status, error) {
    super(error)
    this.status = status
  }
}
const fail = (status, error) => {
  throw new HttpError(status, error)
}
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
const newId = () => hex(crypto.getRandomValues(new Uint8Array(10)))
// The Blank idea a post's project came from: a guides.js key, or null
// The plan behind a post: up to 20 step texts, as JSON, or null
// Stored as { lang, steps } so whoever starts it can tell if the steps are in their language (older posts: a plain array)
const LANGS = ['en', 'de', 'hu']
// A post's plan: its steps, and optionally each step's how line (same order) and what you need
const planOf = (b) => {
  const raw = (Array.isArray(b.plan) ? b.plan : []).slice(0, 20)
  const hows = Array.isArray(b.planHow) ? b.planHow : []
  const keep = raw.map((x, i) => ({ text: clean(x, 200), how: clean(hows[i], 300) })).filter((x) => x.text)
  if (!keep.length) return null
  const steps = keep.map((x) => x.text)
  const how = keep.some((x) => x.how) ? keep.map((x) => x.how) : null
  const materials = (Array.isArray(b.materials) ? b.materials : []).map((x) => clean(x, 80)).filter(Boolean).slice(0, 20)
  if (!LANGS.includes(b.lang) && !how && !materials.length) return JSON.stringify(steps)
  return JSON.stringify({ lang: LANGS.includes(b.lang) ? b.lang : null, steps, ...(how && { how }), ...(materials.length && { materials }) })
}
const readPlan = (p) => {
  try {
    const v = p.plan ? JSON.parse(p.plan) : []
    if (Array.isArray(v)) return { lang: null, steps: v, how: [], materials: [] }
    return {
      lang: LANGS.includes(v?.lang) ? v.lang : null,
      steps: Array.isArray(v?.steps) ? v.steps : [],
      how: Array.isArray(v?.how) ? v.how : [],
      materials: Array.isArray(v?.materials) ? v.materials : [],
    }
  } catch {
    return { lang: null, steps: [], how: [], materials: [] }
  }
}
const parsePlan = (p) => readPlan(p).steps
const guideOf = (b) => (/^[a-z0-9-]{1,60}$/.test(String(b.guide || '')) ? b.guide : null)
// A check-in's progress: the project's steps (ticked or not), the one ticked last, and the language they're in
const infoOf = (b) => {
  const steps = (Array.isArray(b.steps) ? b.steps : []).slice(0, 30).map((x) => ({ text: clean(x?.text, 200), done: x?.done === true })).filter((x) => x.text)
  if (!steps.length) return null
  return { done: steps.filter((x) => x.done).length, total: steps.length, last: clean(b.last, 200), steps, lang: LANGS.includes(b.lang) ? b.lang : null, guide: guideOf(b) }
}
const readInfo = (v) => {
  try {
    return v ? JSON.parse(v) : null
  } catch {
    return null
  }
}
const clean = (v, max) =>
  String(v ?? '')
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '')
    .trim()
    .slice(0, max)

async function readJson(request, max) {
  const text = await request.text()
  if (text.length > max) fail(413, 'too_big')
  try {
    const b = JSON.parse(text || '{}')
    return b && typeof b === 'object' ? b : {}
  } catch {
    fail(400, 'bad_json')
  }
}

async function count(db, kind, who) {
  const r = await db
    .prepare('SELECT COUNT(*) AS n FROM blank_auth_events WHERE kind = ? AND who = ? AND created > ?')
    .bind(kind, who, Date.now() - DAY)
    .first()
  return r?.n || 0
}
const note = (db, kind, who) => db.prepare('INSERT INTO blank_auth_events (kind, who, created) VALUES (?, ?, ?)').bind(kind, who, Date.now()).run()

function dataUrlImage(s) {
  const m = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(String(s || ''))
  if (!m) fail(400, 'bad_photo')
  const bin = atob(m[2])
  if (bin.length > PHOTO_MAX) fail(413, 'too_big')
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return { type: m[1], bytes }
}

// Workers AI looks at the photo (and the caption). 'ok' only when it clearly says nothing is wrong.
// Moondream wants the image as a base64 data URL; reasoning is off so it answers in a few tokens.
const toDataUrl = (bytes, type) => {
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000))
  return `data:${type};base64,${btoa(bin)}`
}
// failed: what to return when the check itself can't run (posts are held back; chats refuse with 'error')
// Moondream answers in result.answer, and only without streaming (with a stream the answer was never read, so every
// photo counted as "not sure": posts waited for review, chat photos and profile pictures were refused)
async function askPhoto(env, bytes, type, question) {
  const out = await env.AI.run(VISION, {
    task: 'query',
    image: toDataUrl(bytes, type),
    question,
    reasoning: false,
    temperature: 0,
    max_tokens: 5,
    stream: false,
  })
  const r = out?.result || out
  return String(r?.answer || r?.description || r?.response || '').trim().toUpperCase()
}

async function checkPhoto(env, bytes, text, type = 'image/jpeg', failed = 'review') {
  if (!env.AI) return failed
  try {
    const answer = await askPhoto(
      env,
      bytes,
      type,
      'You check photos for a hobby app used by teenagers. Answer with one word, YES or NO. ' +
        'Does this photo show nudity, sexual content, gore, violence, weapons, drugs, self-harm or hate symbols?' +
        (text ? ` The caption is: "${text.slice(0, 300)}"` : ''),
    )
    if (answer.startsWith('NO')) return 'ok'
    return 'review'
  } catch (e) {
    console.error('blank photo check', e)
    return failed
  }
}

// Blank is for things you make (the OTIO jury: "only creations, no trolls"): a public post's first photo must show
// something someone made or is working on, or it's shown to friends only. A separate question, so the safety check
// above stays exactly as it was (~20 neurons more per public photo post). Photography posts skip it: the photo is the
// thing they made. If the check can't run (AI limit reached), the post stays public: safety was already checked.
async function showsCreation(env, bytes, type, category) {
  if (!env.AI || category === 'photo') return true
  try {
    const answer = await askPhoto(
      env,
      bytes,
      type,
      'Answer YES or NO. Does this photo show something a person made or is working on, like art, a drawing, a craft, ' +
        'food they cooked, a plant they grew, or something they built or repaired? A selfie, a meme, a screenshot or a picture of text is NO.',
    )
    return answer.startsWith('YES')
  } catch (e) {
    console.error('blank creation check', e)
    return true
  }
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const ALERT = {
  held: { subject: 'Blank: a photo was held back', line: 'The photo check held back a new post by @{u}. Nobody else sees it until you approve it.' },
  words: { subject: 'Blank: a post was held back', line: 'The word check held back a new post by @{u}. Nobody else sees it until you approve it.' },
  profile: { subject: 'Blank: a profile was reported', line: 'The profile of @{u} was reported ({reason}). Check their name, bio and picture.' },
  reported: { subject: 'Blank: a post was reported', line: 'A post by @{u} was reported ({reason}). It is still visible.' },
  hidden: { subject: 'Blank: a post was hidden after reports', line: 'A post by @{u} got {n} reports and is now hidden until you check it.' },
  comment: { subject: 'Blank: a comment was reported', line: 'A comment by @{u} was reported ({reason}). Check it under Review posts.' },
  message: { subject: 'Blank: a chat message was reported', line: 'A chat message by @{u} was reported ({reason}). Check it under Review posts.' },
}
async function alertAdmins(env, db, origin, kind, vars) {
  if (!env.RESEND_KEY) return
  const to = await alertRecipients(env)
  if (!to.length) return
  const a = ALERT[kind]
  const line = a.line.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '')
  const link = `${origin}/blank/#/admin`
  const quote = vars.text ? `<p style="font-size:15px;line-height:1.5;color:#6b6b70;border-left:3px solid #e5e5ea;padding-left:12px">${esc(vars.text.slice(0, 280))}</p>` : ''
  await sendEmail(env, {
    to,
    subject: a.subject,
    html: `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1c1c1e">
<p style="font-size:22px;font-weight:700;margin:0 0 16px">Blank</p>
<p style="font-size:16px;line-height:1.5">${esc(line)}</p>${quote}
<p style="margin:24px 0"><a href="${esc(link)}" style="background:#b4614a;color:#fff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:600;font-size:16px;display:inline-block">Open Review posts</a></p>
</div>`,
    text: `${line}\n\n${vars.text ? `"${vars.text.slice(0, 280)}"\n\n` : ''}${link}`,
  })
}

export async function social(request, env, ctx, path) {
  try {
    return await route(request, env, ctx, path)
  } catch (e) {
    // Ours, or blank-account.js's (auth() throws a 401 with its own HttpError class)
    if (e instanceof HttpError || (Number.isInteger(e?.status) && e.status < 500)) return json({ error: e.message }, e.status)
    if (e?.name === 'LimitError') return json({ error: 'limit', limit: e.key }, 503) // a free-tier ceiling (limits.js)
    console.error(e)
    return json({ error: 'server' }, 500)
  }
}

// Where a post's photos are in R2 (photo 0 is where an older post's only photo is)
const mediaKey = (id, n) => (n === 0 ? `p/${id}` : `p/${id}/${n}`)
const mediaOf = (p) => {
  if (p.media) {
    try {
      return JSON.parse(p.media)
    } catch {}
  }
  return p.photo ? [{ ratio: p.ratio, ok: 1, up: 1 }] : []
}

const PROFILE = 'id, username, name, bio, avatar, founder, created'
// A name the way search compares it: lowercase, no accents, only letters and digits ("Grósz Gréta" -> "grosz greta")
export const nameKey = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
// A post as the app gets it. uid: who's asking (null without an account)
const shapePost = (p, uid) => ({
  id: p.id,
  author: { username: p.username, name: p.name || '', avatar: !!p.avatar, founder: !!p.founder },
  mine: p.user_id === uid,
  kind: p.kind,
  project: p.project,
  category: p.category,
  text: p.text,
  photo: !!p.photo,
  ratio: p.ratio,
  media: mediaOf(p).map((x) => ({ ratio: x.ratio ?? null })),
  cost: p.cost || null,
  time: p.time || null,
  guide: p.guide || null,
  plan: parsePlan(p),
  planLang: readPlan(p).lang, // null on older posts
  planHow: readPlan(p).how, // each step's how line, '' where there's none ([] on older posts)
  materials: readPlan(p).materials,
  visibility: p.visibility,
  status: p.status,
  created: p.created,
  // Only the author sees how many likes a post has: a like is encouragement from a friend, not a public score
  likes: p.user_id === uid ? p.likes || 0 : null,
  // How many people started a project from this post: public, it's the number Blank shows instead of likes
  started: p.started || 0,
  first: !!p.first,
  // How many people finished it and posted their result under it
  made: p.made || 0,
  madeFrom: p.made_from || null,
  comments: p.comments || 0,
  commentsOff: !!p.comments_off,
  liked: !!p.liked,
})

// A comment as the app gets it. canDelete: you wrote it, or it's under your post
const shapeComment = (c, post, uid = null) => ({
  id: c.id,
  author: { username: c.username, name: c.name || '', avatar: !!c.avatar, founder: !!c.founder },
  text: c.text,
  created: c.created,
  mine: c.user_id === uid,
  canDelete: c.user_id === uid || (post.user_id != null && post.user_id === uid),
})

const pub = (u) => ({ username: u.username, name: u.name || '', bio: u.bio || '', avatar: !!u.avatar, founder: !!u.founder })

// What someone without an account may see: 'public' posts that are live ('ok') by people who aren't banned, and their
// photos. No likes of their own, no profiles, no avatars. Answers sit in Cloudflare's cache (a minute for the feed,
// ten minutes for photos), so many visitors from one link don't each read D1 and R2.
// "Made because of you": different people whose finished, live post follows this one (not the author's own)
const MADE_COUNT = `(SELECT COUNT(DISTINCT r.user_id) FROM blank_posts r WHERE r.made_from = p.id AND r.status = 'ok' AND r.user_id != p.user_id)`
const COMMENT_COUNT = `(SELECT COUNT(*) FROM blank_comments c WHERE c.post_id = p.id AND c.status = 'ok')`
// Someone's first post on Blank, for its first week: the app shows "First post" to them and "New on Blank" to everyone
// else (one indexed row). Older first posts are just posts: the person isn't new any more.
const FIRST_POST = `p.created > (CAST(strftime('%s', 'now') AS INTEGER) * 1000 - 604800000) AND NOT EXISTS (SELECT 1 FROM blank_posts e WHERE e.user_id = p.user_id AND e.created < p.created AND e.status != 'uploading')`
const GUEST_POSTS = `SELECT p.*, u.username, u.name, 0 AS avatar, u.founder, 0 AS liked,
    (SELECT COUNT(*) FROM blank_likes l WHERE l.post_id = p.id) AS likes,
    (SELECT COUNT(*) FROM blank_post_starts s WHERE s.post_id = p.id) AS started,
    ${MADE_COUNT} AS made, ${COMMENT_COUNT} AS comments, ${FIRST_POST} AS first
  FROM blank_posts p JOIN blank_users u ON u.id = p.user_id
  WHERE p.visibility = 'public' AND p.status = 'ok' AND u.banned = 0`

async function guestRoute(request, ctx, db, env, path) {
  const url = new URL(request.url)
  let m
  if (path === '/social/feed' && url.searchParams.get('scope') === 'public') {
    return edgeCached(request, ctx, 60, async () => {
      const before = Number(url.searchParams.get('before')) || Date.now() + 60_000
      const r = await db.prepare(`${GUEST_POSTS} AND p.created < ? ORDER BY p.created DESC LIMIT ${PAGE}`).bind(before).all()
      return json({ posts: (r.results || []).map((p) => shapePost(p, null)) })
    })
  }
  if ((m = path.match(/^\/social\/posts\/([0-9a-f]{20})\/(?:media\/(\d)|photo)$/))) {
    return edgeCached(request, ctx, 600, async () => {
      const p = await db.prepare(`${GUEST_POSTS} AND p.id = ?`).bind(m[1]).first()
      const n = Number(m[2] || 0)
      if (!p || !mediaOf(p)[n] || !env.PHOTOS) fail(404, 'not_found')
      const obj = await env.PHOTOS.get(m[2] === undefined ? `p/${p.id}` : mediaKey(p.id, n))
      if (!obj) fail(404, 'not_found')
      return new Response(obj.body, { headers: { 'content-type': obj.httpMetadata?.contentType || 'image/jpeg', 'x-content-type-options': 'nosniff' } })
    })
  }
  return null
}

// "Started because of you": someone started a project from a live post they can see. Each account (or, without one,
// each phone's random device id) counts once per post, the author's own starts don't count, and a network can add at most
// STARTS_PER_DAY a day. Without an account only public posts count. → { started }
async function startFromPost(request, env, ctx, postId) {
  const db = env.DB
  const b = await readJson(request, 1000)
  const me = request.headers.get('authorization') ? await auth(request, db) : null
  const device = String(b.device || '')
  if (!me && !/^[0-9a-f]{36}$/.test(device)) fail(400, 'device')
  const p = await db.prepare("SELECT p.user_id, p.visibility, p.project FROM blank_posts p JOIN blank_users u ON u.id = p.user_id WHERE p.id = ? AND p.status = 'ok' AND u.banned = 0").bind(postId).first()
  if (!p || (!me && p.visibility !== 'public')) fail(404, 'not_found')
  const count = async () => (await db.prepare('SELECT COUNT(*) AS n FROM blank_post_starts WHERE post_id = ?').bind(postId).first())?.n || 0
  if (me && me.user_id === p.user_id) return json({ started: await count() })
  const ipHash = await sha256(`${request.headers.get('cf-connecting-ip') || 'local'}|blank`)
  const n = await db.prepare('SELECT COUNT(*) AS n FROM blank_post_starts WHERE ip_hash = ? AND created > ?').bind(ipHash, Date.now() - 864e5).first()
  if ((n?.n || 0) < STARTS_PER_DAY) {
    const starter = await sha256(`${me ? `u:${me.user_id}` : `d:${device}`}|${postId}`)
    const added = await db.prepare('INSERT OR IGNORE INTO blank_post_starts (post_id, starter, ip_hash, created) VALUES (?, ?, ?, ?)').bind(postId, starter, ipHash, Date.now()).run()
    // The best news a poster can get
    if (added?.meta?.changes)
      ctx.waitUntil(
        notifyUser(env, db, p.user_id, 'start', { name: me ? me.name || `@${me.username}` : '', project: p.project }, { url: '#/you', once: { key: `start:${postId}`, gap: 10 * 60_000 } }).catch((e) => console.error(e)),
      )
  }
  return json({ started: await count() })
}

// A GET answer kept in Cloudflare's cache for `seconds` (and the browser's). Only 200s are kept.
async function edgeCached(request, ctx, seconds, make) {
  const key = new Request(request.url)
  const hit = await caches.default.match(key)
  if (hit) return hit
  const made = await make()
  if (made.status !== 200) return made
  const res = new Response(made.body, made)
  res.headers.set('cache-control', `public, max-age=${seconds}`)
  ctx.waitUntil(caches.default.put(key, res.clone()))
  return res
}

async function route(request, env, ctx, path) {
  const db = env.DB
  const method = request.method
  let m
  // The invite page, before the person who opened it has an account
  if ((m = path.match(/^\/social\/invite\/([a-z0-9._]{3,24})\/([0-9a-f]{20})$/)) && method === 'GET') {
    const u = await db.prepare(`SELECT ${PROFILE}, invite FROM blank_users WHERE username = ? AND banned = 0`).bind(m[1]).first()
    if (!u || u.invite !== m[2]) fail(404, 'not_found')
    return json({ user: pub(u) })
  }
  // Someone started a project from a post: counts for its author, with or without an account
  if ((m = path.match(/^\/social\/posts\/([0-9a-f]{20})\/start$/)) && method === 'POST') return startFromPost(request, env, ctx, m[1])
  // Without an account: the public feed and its photos, read-only, so a link from Reddit or TikTok shows real posts
  if (!request.headers.get('authorization') && method === 'GET') {
    const r = await guestRoute(request, ctx, db, env, path)
    if (r) return r
  }
  const me = await auth(request, db)
  const uid = me.user_id
  const url = new URL(request.url)
  const alert = (kind, vars) => ctx.waitUntil(alertAdmins(env, db, url.origin, kind, vars).catch((e) => console.error('blank alert', e)))

  const userByName = async (name) => {
    const u = await db.prepare(`SELECT ${PROFILE}, banned FROM blank_users WHERE username = ?`).bind(String(name).toLowerCase()).first()
    if (!u || (u.banned && u.id !== uid && !me.admin)) fail(404, 'not_found')
    return u
  }
  const blockedEither = async (other) =>
    !!(await db.prepare('SELECT 1 FROM blank_blocks WHERE (blocker = ? AND blocked = ?) OR (blocker = ? AND blocked = ?)').bind(uid, other, other, uid).first())
  const friendship = async (other) =>
    db.prepare('SELECT requester, addressee, status FROM blank_friends WHERE (requester = ? AND addressee = ?) OR (requester = ? AND addressee = ?)').bind(uid, other, other, uid).first()
  const relation = (f) => (!f ? 'none' : f.status === 'accepted' ? 'friends' : f.requester === uid ? 'outgoing' : 'incoming')

  // Posts as the app shows them
  const POST_SELECT = `SELECT p.*, u.username, u.name, u.avatar, u.founder,
      (SELECT COUNT(*) FROM blank_likes l WHERE l.post_id = p.id) AS likes,
      (SELECT COUNT(*) FROM blank_post_starts s WHERE s.post_id = p.id) AS started,
      ${MADE_COUNT} AS made, ${COMMENT_COUNT} AS comments, ${FIRST_POST} AS first,
      EXISTS (SELECT 1 FROM blank_likes l WHERE l.post_id = p.id AND l.user_id = ?1) AS liked
    FROM blank_posts p JOIN blank_users u ON u.id = p.user_id`
  const NOT_BLOCKED = `NOT EXISTS (SELECT 1 FROM blank_blocks b WHERE (b.blocker = ?1 AND b.blocked = p.user_id) OR (b.blocker = p.user_id AND b.blocked = ?1))`
  const shape = (p) => shapePost(p, uid)
  // Can I see this post?
  const visible = async (p) => {
    if (p.user_id === uid || me.admin) return true
    if (p.status !== 'ok') return false
    if (await blockedEither(p.user_id)) return false
    if (p.visibility === 'public') return true
    return relation(await friendship(p.user_id)) === 'friends'
  }
  const notBanned = () => me.banned && fail(403, 'banned')
  const postById = async (id) => {
    const p = await db.prepare(`${POST_SELECT} WHERE p.id = ?2`).bind(uid, id).first()
    if (!p || !(await visible(p))) fail(404, 'not_found')
    return p
  }

  const myName = me.name || `@${me.username}`
  const tell = (userId, kind, vars, opts) => ctx.waitUntil(notifyUser(env, db, userId, kind, vars, opts).catch((e) => console.error('blank notify', e)))

  // ---------- notifications on this device ----------
  if (path === '/social/push') {
    const b = await readJson(request, 3000)
    if (method === 'POST') {
      if (!(await savePush(db, uid, b))) fail(400, 'bad_subscription')
      return json({ ok: true })
    }
    if (method === 'DELETE') {
      await db.prepare('DELETE FROM blank_user_push WHERE endpoint = ? AND user_id = ?').bind(String(b.endpoint || ''), uid).run()
      return json({ ok: true })
    }
  }

  // ---------- your profile ----------
  if (path === '/social/me') {
    // Who can write to you: friends (always), and message requests from others only if you turned them on (16+)
    const safety = await db.prepare('SELECT msg_requests, birth_year FROM blank_users WHERE id = ?').bind(uid).first()
    if (method === 'GET') return json({ ...pub(me), rules: !!me.rules_at, admin: !!me.admin, banned: !!me.banned, requests: !!safety?.msg_requests, birthYear: safety?.birth_year || null })
    if (method === 'PATCH') {
      notBanned()
      const b = await readJson(request, 4000)
      if (b.requests !== undefined) {
        const year = Number(b.birthYear) || safety?.birth_year || null
        const thisYear = new Date().getUTCFullYear()
        if (year && (year < thisYear - 110 || year > thisYear - 5)) fail(400, 'bad_year')
        // Under 16 (or unknown): message requests stay off. Born this many years ago, at the latest: 16 this year.
        if (b.requests === true && (!year || thisYear - year < 16)) fail(403, year ? 'too_young' : 'need_year')
        await db.prepare('UPDATE blank_users SET msg_requests = ?, birth_year = ? WHERE id = ?').bind(b.requests === true ? 1 : 0, year, uid).run()
        if (b.name === undefined && b.bio === undefined) return json({ ...pub(me), requests: b.requests === true, birthYear: year })
      }
      const name = b.name !== undefined ? clean(b.name, 40) : me.name
      const bio = b.bio !== undefined ? clean(b.bio, 160) : me.bio
      if (badWords(name) || badWords(bio)) fail(422, 'text_rejected')
      await db.prepare('UPDATE blank_users SET name = ?, bio = ?, name_key = ? WHERE id = ?').bind(name, bio, nameKey(name), uid).run()
      return json({ ...pub({ ...me, name, bio }) })
    }
  }
  if (path === '/social/me/rules' && method === 'POST') {
    await db.prepare('UPDATE blank_users SET rules_at = ? WHERE id = ?').bind(Date.now(), uid).run()
    return json({ ok: true })
  }
  if (path === '/social/me/avatar') {
    if (!env.PHOTOS) fail(503, 'no_storage')
    if (method === 'PUT') {
      notBanned()
      const type = (request.headers.get('content-type') || '').split(';')[0].trim()
      if (!/^image\/(jpeg|png|webp|gif)$/.test(type)) fail(415, 'bad_photo')
      const body = await request.arrayBuffer()
      if (!body.byteLength || body.byteLength > PHOTO_MAX) fail(413, 'too_big')
      if ((await count(db, 'avatar', uid)) >= AVATARS_PER_DAY) fail(429, 'too_many')
      await note(db, 'avatar', uid)
      if ((await checkPhoto(env, new Uint8Array(body), '', type)) !== 'ok') fail(422, 'photo_rejected')
      await env.PHOTOS.put(`a/${uid}`, body, { httpMetadata: { contentType: type } })
      await db.prepare('UPDATE blank_users SET avatar = 1 WHERE id = ?').bind(uid).run()
      return json({ ok: true })
    }
    if (method === 'DELETE') {
      await env.PHOTOS.delete(`a/${uid}`)
      await db.prepare('UPDATE blank_users SET avatar = 0 WHERE id = ?').bind(uid).run()
      return json({ ok: true })
    }
  }
  if ((m = path.match(/^\/social\/avatar\/([a-z0-9._]{3,24})$/)) && method === 'GET') {
    const u = await userByName(m[1])
    if (!u.avatar || !env.PHOTOS || (u.id !== uid && (await blockedEither(u.id)))) fail(404, 'not_found')
    const obj = await env.PHOTOS.get(`a/${u.id}`)
    if (!obj) fail(404, 'not_found')
    return new Response(obj.body, { headers: { 'content-type': obj.httpMetadata?.contentType || 'image/jpeg', 'cache-control': 'private, max-age=300' } })
  }

  // ---------- people ----------
  // People into the same things: who posted publicly in these hobbies, newest first, not you, your friends or anyone blocked
  if (path === '/social/suggestions' && method === 'GET') {
    const cats = String(url.searchParams.get('cats') || '').split(',').filter((c) => /^[a-z]{2,20}$/.test(c)).slice(0, 12)
    if (!cats.length) return json({ users: [] })
    const r = await db
      .prepare(
        `SELECT u.username, u.name, u.bio, u.avatar, u.founder, p.category FROM blank_users u
         JOIN (SELECT user_id, category, MAX(created) AS last FROM blank_posts WHERE visibility = 'public' AND status = 'ok' AND category IN (${cats.map(() => '?').join(',')}) GROUP BY user_id) p ON p.user_id = u.id
         WHERE u.id != ? AND u.banned = 0
           AND NOT EXISTS (SELECT 1 FROM blank_friends f WHERE (f.requester = u.id AND f.addressee = ?) OR (f.requester = ? AND f.addressee = u.id))
           AND NOT EXISTS (SELECT 1 FROM blank_blocks b WHERE (b.blocker = ? AND b.blocked = u.id) OR (b.blocker = u.id AND b.blocked = ?))
         ORDER BY p.last DESC LIMIT 10`,
      )
      .bind(...cats, uid, uid, uid, uid, uid)
      .all()
    return json({ users: (r.results || []).map((u) => ({ ...pub(u), category: u.category })) })
  }

  // People who did the same plans as you: they posted publicly from the same Blank plan (guide key) or a project with
  // the same title. Only public posts count, so nobody shows up who didn't share it with everyone.
  if (path === '/social/sameplans' && method === 'GET') {
    const guides = String(url.searchParams.get('guides') || '').split(',').filter((g) => /^[a-z0-9-]{1,60}$/.test(g)).slice(0, 10)
    const titles = String(url.searchParams.get('titles') || '').split('|').map((x) => clean(x, 80).toLowerCase()).filter(Boolean).slice(0, 10)
    if (!guides.length && !titles.length) return json({ users: [] })
    const inList = (n) => (n ? Array(n).fill('?').join(',') : "''")
    const r = await db
      .prepare(
        `SELECT u.username, u.name, u.bio, u.avatar, u.founder, p.project, p.last FROM blank_users u
         JOIN (SELECT user_id, project, MAX(created) AS last FROM blank_posts
               WHERE visibility = 'public' AND status = 'ok' AND project != ''
                 AND (guide IN (${inList(guides.length)}) OR LOWER(project) IN (${inList(titles.length)}))
               GROUP BY user_id) p ON p.user_id = u.id
         WHERE u.id != ? AND u.banned = 0
           AND NOT EXISTS (SELECT 1 FROM blank_friends f WHERE (f.requester = u.id AND f.addressee = ?) OR (f.requester = ? AND f.addressee = u.id))
           AND NOT EXISTS (SELECT 1 FROM blank_blocks b WHERE (b.blocker = ? AND b.blocked = u.id) OR (b.blocker = u.id AND b.blocked = ?))
         ORDER BY p.last DESC LIMIT 12`,
      )
      .bind(...guides, ...titles, uid, uid, uid, uid, uid)
      .all()
    return json({ users: (r.results || []).map((u) => ({ ...pub(u), plan: u.project })) })
  }

  // Your friends, as a subquery (bound as ?1 = you)
  const MY_FRIENDS = `SELECT addressee FROM blank_friends WHERE requester = ?1 AND status = 'accepted'
                      UNION SELECT requester FROM blank_friends WHERE addressee = ?1 AND status = 'accepted'`
  const NOT_BLOCKED_U = `NOT EXISTS (SELECT 1 FROM blank_blocks b WHERE (b.blocker = ?1 AND b.blocked = u.id) OR (b.blocker = u.id AND b.blocked = ?1))`
  // How many friends you share with each of these people
  const mutualOf = async (ids) => {
    if (!ids.length) return new Map()
    const r = await db
      .prepare(
        `SELECT x.id, COUNT(*) AS n FROM (
           SELECT requester AS id, addressee AS other FROM blank_friends WHERE status = 'accepted'
           UNION ALL SELECT addressee AS id, requester AS other FROM blank_friends WHERE status = 'accepted'
         ) x WHERE x.id IN (${ids.map((_, i) => `?${i + 2}`).join(',')}) AND x.other IN (${MY_FRIENDS}) GROUP BY x.id`,
      )
      .bind(uid, ...ids)
      .all()
    return new Map((r.results || []).map((x) => [x.id, x.n]))
  }

  if (path === '/social/search' && method === 'GET') {
    const raw = String(url.searchParams.get('q') || '').slice(0, 40)
    const uq = raw.toLowerCase().trim().replace(/^@/, '').replace(/[^a-z0-9._]/g, '').slice(0, 24)
    const nq = nameKey(raw)
    // From the first letter: "g" finds every username and name word starting with g
    if (!uq.length && !nq.length) return json({ users: [] })
    // Older accounts get their search name the first time someone searches (a few hundred at a time)
    const missing = await db.prepare("SELECT id, name FROM blank_users WHERE name_key IS NULL AND name != '' LIMIT 300").all()
    if (missing.results?.length) await db.batch(missing.results.map((u) => db.prepare('UPDATE blank_users SET name_key = ? WHERE id = ?').bind(nameKey(u.name), u.id)))
    const r = await db
      .prepare(
        `SELECT ${PROFILE} FROM blank_users u
         WHERE u.id != ?1 AND u.banned = 0 AND ${NOT_BLOCKED_U}
           AND ((?2 != '' AND username >= ?2 AND username < ?3) OR (?4 != '' AND (' ' || COALESCE(name_key, '')) LIKE ?5))
         ORDER BY username = ?2 DESC, (username >= ?2 AND username < ?3) DESC, username LIMIT 30`,
      )
      .bind(uid, uq, `${uq}~`, nq, `% ${nq}%`)
      .all()
    const users = r.results || []
    const mutual = await mutualOf(users.map((u) => u.id))
    // Exact username first, then people you share friends with
    const out = users
      .map((u, i) => ({ ...pub(u), mutual: mutual.get(u.id) || 0, i, exact: u.username === uq }))
      .sort((a, b) => b.exact - a.exact || b.mutual - a.mutual || a.i - b.i)
      .slice(0, 20)
      .map(({ i, exact, ...u }) => u)
    return json({ users: out })
  }

  // People you may know (like Facebook and Snapchat's Quick Add): friends of your friends, most mutual friends first
  if (path === '/social/known' && method === 'GET') {
    const r = await db
      .prepare(
        `WITH my(id) AS (${MY_FRIENDS}),
         fof(id) AS (
           SELECT f.addressee FROM blank_friends f WHERE f.status = 'accepted' AND f.requester IN (SELECT id FROM my)
           UNION ALL SELECT f.requester FROM blank_friends f WHERE f.status = 'accepted' AND f.addressee IN (SELECT id FROM my))
         SELECT u.username, u.name, u.bio, u.avatar, u.founder, COUNT(*) AS mutual FROM fof JOIN blank_users u ON u.id = fof.id
         WHERE u.id != ?1 AND u.id NOT IN (SELECT id FROM my) AND u.banned = 0 AND ${NOT_BLOCKED_U}
           AND NOT EXISTS (SELECT 1 FROM blank_friends f WHERE (f.requester = ?1 AND f.addressee = u.id) OR (f.requester = u.id AND f.addressee = ?1))
         GROUP BY u.id ORDER BY mutual DESC, u.created DESC LIMIT 15`,
      )
      .bind(uid)
      .all()
    return json({ users: (r.results || []).map((u) => ({ ...pub(u), mutual: u.mutual })) })
  }

  if ((m = path.match(/^\/social\/users\/([a-z0-9._]{3,24})$/)) && method === 'GET') {
    const u = await userByName(m[1])
    const self = u.id === uid
    if (!self && (await blockedEither(u.id))) {
      const iBlocked = !!(await db.prepare('SELECT 1 FROM blank_blocks WHERE blocker = ? AND blocked = ?').bind(uid, u.id).first())
      if (!iBlocked) fail(404, 'not_found')
      return json({ user: pub(u), relation: 'blocked', posts: [], friends: 0 })
    }
    const rel = self ? 'self' : relation(await friendship(u.id))
    const canSeeFriendsPosts = self || rel === 'friends' || me.admin
    const posts = await db
      .prepare(
        `${POST_SELECT} WHERE p.user_id = ?2 AND p.status != 'uploading' AND (?3 OR (p.status = 'ok' AND (p.visibility = 'public' OR ?4)))
         ORDER BY p.created DESC LIMIT 60`,
      )
      .bind(uid, u.id, self || me.admin ? 1 : 0, canSeeFriendsPosts ? 1 : 0)
      .all()
    const friends = await db
      .prepare("SELECT COUNT(*) AS n FROM blank_friends WHERE status = 'accepted' AND (requester = ? OR addressee = ?)")
      .bind(u.id, u.id)
      .first()
    const inspired = await db
      .prepare("SELECT COUNT(*) AS n FROM blank_post_starts s JOIN blank_posts p ON p.id = s.post_id WHERE p.user_id = ? AND p.status = 'ok'")
      .bind(u.id)
      .first()
    const open = !self && rel !== 'friends' && !!(await db.prepare('SELECT msg_requests FROM blank_users WHERE id = ?').bind(u.id).first())?.msg_requests
    return json({ user: pub(u), relation: rel, posts: (posts.results || []).map(shape), friends: friends?.n || 0, inspired: inspired?.n || 0, requestsOpen: open })
  }

  if ((m = path.match(/^\/social\/users\/([a-z0-9._]{3,24})\/report$/)) && method === 'POST') {
    const u = await userByName(m[1])
    if (u.id === uid) fail(400, 'self')
    notBanned()
    const b = await readJson(request, 2000)
    const reason = REASONS.includes(b.reason) ? b.reason : 'other'
    if ((await count(db, 'report', uid)) >= REPORTS_PER_DAY) fail(429, 'too_many')
    const added = await db.prepare('INSERT OR IGNORE INTO blank_user_reports (user_id, reporter, reason, created) VALUES (?, ?, ?, ?)').bind(u.id, uid, reason, Date.now()).run()
    await note(db, 'report', uid)
    const n = (await db.prepare('SELECT COUNT(*) AS n FROM blank_user_reports WHERE user_id = ? AND resolved = 0').bind(u.id).first())?.n || 0
    if (n === 1 && added?.meta?.changes !== 0) alert('profile', { u: u.username, reason, text: [u.name, u.bio].filter(Boolean).join(' · ') })
    return json({ ok: true })
  }

  if (path === '/social/invite' && method === 'GET') {
    const row = await db.prepare('SELECT invite FROM blank_users WHERE id = ?').bind(uid).first()
    if (row?.invite) return json({ code: row.invite })
    const code = newId()
    await db.prepare('UPDATE blank_users SET invite = ? WHERE id = ? AND invite IS NULL').bind(code, uid).run()
    return json({ code: (await db.prepare('SELECT invite FROM blank_users WHERE id = ?').bind(uid).first()).invite })
  }

  if (path === '/social/friends' && method === 'GET') {
    const r = await db
      .prepare(
        `SELECT f.requester, f.addressee, f.status, f.created, u.username, u.name, u.bio, u.avatar, u.founder FROM blank_friends f
         JOIN blank_users u ON u.id = CASE WHEN f.requester = ? THEN f.addressee ELSE f.requester END
         WHERE (f.requester = ? OR f.addressee = ?) AND u.banned = 0 ORDER BY f.created DESC`,
      )
      .bind(uid, uid, uid)
      .all()
    const out = { friends: [], incoming: [], outgoing: [] }
    for (const f of r.results || []) out[relation(f) === 'friends' ? 'friends' : relation(f)].push(pub(f))
    return json(out)
  }

  if ((m = path.match(/^\/social\/friends\/([a-z0-9._]{3,24})$/))) {
    const u = await userByName(m[1])
    if (u.id === uid) fail(400, 'self')
    const f = await friendship(u.id)
    if (method === 'POST') {
      notBanned()
      if (await blockedEither(u.id)) fail(404, 'not_found')
      if (f?.status === 'accepted') return json({ relation: 'friends' })
      // Their invite link: they already said yes by sending it
      const b = await readJson(request, 1000)
      if (b.invite && typeof b.invite === 'string') {
        const inv = await db.prepare('SELECT invite FROM blank_users WHERE id = ?').bind(u.id).first()
        if (inv?.invite && inv.invite === b.invite) {
          await db.batch([
            db.prepare('DELETE FROM blank_friends WHERE (requester = ? AND addressee = ?) OR (requester = ? AND addressee = ?)').bind(uid, u.id, u.id, uid),
            db.prepare("INSERT INTO blank_friends (requester, addressee, status, created) VALUES (?, ?, 'accepted', ?)").bind(u.id, uid, Date.now()),
          ])
          tell(u.id, 'friend_accept', { name: myName }, { url: `#/u/${me.username}` })
          return json({ relation: 'friends', invited: true })
        }
      }
      if (f && f.requester === u.id) {
        await db.prepare("UPDATE blank_friends SET status = 'accepted' WHERE requester = ? AND addressee = ?").bind(u.id, uid).run()
        tell(u.id, 'friend_accept', { name: myName }, { url: `#/u/${me.username}` })
        return json({ relation: 'friends' })
      }
      if (f) return json({ relation: 'outgoing' })
      if ((await count(db, 'friend', uid)) >= REQUESTS_PER_DAY) fail(429, 'too_many')
      await db.prepare("INSERT INTO blank_friends (requester, addressee, status, created) VALUES (?, ?, 'pending', ?)").bind(uid, u.id, Date.now()).run()
      tell(u.id, 'friend_request', { name: myName }, { url: '#/friends/people', once: { key: `friend:${uid}`, gap: 86400_000 } })
      await note(db, 'friend', uid)
      return json({ relation: 'outgoing' })
    }
    if (method === 'DELETE') {
      await db.prepare('DELETE FROM blank_friends WHERE (requester = ? AND addressee = ?) OR (requester = ? AND addressee = ?)').bind(uid, u.id, u.id, uid).run()
      return json({ relation: 'none' })
    }
  }

  if ((m = path.match(/^\/social\/blocks\/([a-z0-9._]{3,24})$/))) {
    const u = await userByName(m[1])
    if (u.id === uid) fail(400, 'self')
    if (method === 'POST') {
      await db.batch([
        db.prepare('INSERT OR IGNORE INTO blank_blocks (blocker, blocked, created) VALUES (?, ?, ?)').bind(uid, u.id, Date.now()),
        db.prepare('DELETE FROM blank_friends WHERE (requester = ? AND addressee = ?) OR (requester = ? AND addressee = ?)').bind(uid, u.id, u.id, uid),
      ])
      return json({ relation: 'blocked' })
    }
    if (method === 'DELETE') {
      await db.prepare('DELETE FROM blank_blocks WHERE blocker = ? AND blocked = ?').bind(uid, u.id).run()
      return json({ relation: 'none' })
    }
  }

  // ---------- posts ----------
  if (path === '/social/feed' && method === 'GET') {
    const scope = url.searchParams.get('scope') === 'public' ? 'public' : 'friends'
    const before = Number(url.searchParams.get('before')) || Date.now() + 60_000
    // Friends: start from your friends and read only their posts (blank_posts_user index). Checking every post in the
    // table for "is this a friend?" read all of them on every load, which would use up D1's free reads fast.
    const sql =
      scope === 'public'
        ? `${POST_SELECT} WHERE p.visibility = 'public' AND p.status = 'ok' AND ${NOT_BLOCKED}`
        : `WITH ids(id) AS (
             SELECT ?1 UNION SELECT addressee FROM blank_friends WHERE requester = ?1 AND status = 'accepted'
             UNION SELECT requester FROM blank_friends WHERE addressee = ?1 AND status = 'accepted')
           ${POST_SELECT} WHERE p.user_id IN (SELECT id FROM ids) AND ((p.user_id = ?1 AND p.status != 'uploading') OR (p.status = 'ok' AND ${NOT_BLOCKED}))`
    const r = await db.prepare(`${sql} AND p.created < ?2 ORDER BY p.created DESC LIMIT ${PAGE}`).bind(uid, before).all()
    return json({ posts: (r.results || []).map(shape) })
  }

  // A result made by following someone's post: only a post you can see, and not your own
  const madeFromOf = async (id) => {
    if (typeof id !== 'string' || !/^[0-9a-f]{20}$/.test(id)) return null
    const q = await db.prepare(`${POST_SELECT} WHERE p.id = ?2`).bind(uid, id).first()
    return q && q.user_id !== uid && q.status === 'ok' && (await visible(q)) ? q : null
  }
  // When a result goes live, the person it came from hears about it
  const tellMade = async (post) => {
    if (!post?.made_from || post.status !== 'ok') return
    const src = await db.prepare('SELECT user_id, project, text FROM blank_posts WHERE id = ?').bind(post.made_from).first()
    if (src && src.user_id !== uid) tell(src.user_id, 'made', { name: myName, project: src.project || String(src.text || '').slice(0, 60) }, { url: '#/you', once: { key: `made:${post.made_from}:${uid}`, gap: 86400_000 } })
  }

  if (path === '/social/posts' && method === 'POST') {
    notBanned()
    if (!me.rules_at) fail(403, 'rules')
    const b = await readJson(request, PHOTO_MAX * 1.4 + 10_000)
    const madeFrom = (await madeFromOf(b.madeFrom))?.id || null
    const kind = KINDS.includes(b.kind) ? b.kind : 'update'
    const visibility = VIS.includes(b.visibility) ? b.visibility : 'friends'
    const text = clean(b.text, 1000)
    if (Array.isArray(b.media) && b.media.length) {
      // Several photos: the post is made now and its photos come one by one (PUT .../media/:n)
      const media = b.media.slice(0, MEDIA_MAX).map((x) => ({
        ratio: Number(x?.ratio) > 0.2 && Number(x?.ratio) < 5 ? Number(x.ratio) : null,
        ok: 0,
        up: 0,
      }))
      if (b.media.length > MEDIA_MAX) fail(400, 'too_many_media')
      if (!env.PHOTOS) fail(503, 'no_storage')
      if ((await count(db, 'post', uid)) >= POSTS_PER_DAY) fail(429, 'too_many')
      // Posts whose photos never all arrived (the app was closed halfway) would keep their photos in R2 forever
      const stuck = await db.prepare("SELECT id, photo, ratio, media FROM blank_posts WHERE user_id = ? AND status = 'uploading' AND created < ?").bind(uid, Date.now() - DAY).all()
      for (const p of stuck.results || []) await removePost(db, env, p.id, p)
      const id = newId()
      await db
        .prepare(
          `INSERT INTO blank_posts (id, user_id, kind, project, category, text, photo, ratio, visibility, status, created, media, cost, time, guide, plan, made_from)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'uploading', ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          id, uid, kind, clean(b.project, 80), clean(b.category, 20) || 'other', text,
          1, media[0].ratio, visibility, Date.now(),
          JSON.stringify(media), COSTS.includes(b.cost) ? b.cost : null, TIMES.includes(b.time) ? b.time : null, guideOf(b), planOf(b), madeFrom,
        )
        .run()
      await note(db, 'post', uid)
      return json({ post: shape(await db.prepare(`${POST_SELECT} WHERE p.id = ?2`).bind(uid, id).first()) })
    }
    const photo = b.photo ? dataUrlImage(b.photo) : null
    if (!text && !photo) fail(400, 'empty')
    if (photo && !env.PHOTOS) fail(503, 'no_storage')
    if ((await count(db, 'post', uid)) >= POSTS_PER_DAY) fail(429, 'too_many')
    const id = newId()
    const project = clean(b.project, 80)
    const plan = readPlan({ plan: planOf(b) })
    const words = badWords(text, project, ...plan.steps, ...plan.how, ...plan.materials)
    const status = words ? 'review' : photo ? await checkPhoto(env, photo.bytes, text, photo.type) : 'ok'
    // Everyone sees only posts with a photo of something you made; a text-only post goes to your friends
    const category = clean(b.category, 20) || 'other'
    const shown = visibility === 'public' && (!photo || (status === 'ok' && !(await showsCreation(env, photo.bytes, photo.type, category)))) ? 'friends' : visibility
    if (photo) await env.PHOTOS.put(`p/${id}`, photo.bytes, { httpMetadata: { contentType: photo.type } })
    const ratio = Number(b.ratio) > 0.2 && Number(b.ratio) < 5 ? Number(b.ratio) : null
    await db
      .prepare(
        'INSERT INTO blank_posts (id, user_id, kind, project, category, text, photo, ratio, visibility, status, created, cost, time, guide, plan, made_from) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      )
      .bind(
        id, uid, kind, project, category, text, photo ? 1 : 0, ratio, shown, status, Date.now(),
        COSTS.includes(b.cost) ? b.cost : null, TIMES.includes(b.time) ? b.time : null, guideOf(b), planOf(b), madeFrom,
      )
      .run()
    await note(db, 'post', uid)
    await tellMade({ made_from: madeFrom, status })
    if (status === 'review') alert(words ? 'words' : 'held', { u: me.username, text })
    return json({ post: shape(await db.prepare(`${POST_SELECT} WHERE p.id = ?2`).bind(uid, id).first()) })
  }

  // ---------- a post's photos ----------
  if ((m = path.match(/^\/social\/posts\/([0-9a-f]{20})\/media\/(\d)$/))) {
    const id = m[1]
    const n = Number(m[2])
    if (method === 'PUT') {
      notBanned()
      if (!env.PHOTOS) fail(503, 'no_storage')
      const p = await db.prepare('SELECT * FROM blank_posts WHERE id = ? AND user_id = ?').bind(id, uid).first()
      if (!p || p.status !== 'uploading') fail(404, 'not_found')
      const media = mediaOf(p)
      const item = media[n]
      if (!item) fail(404, 'not_found')
      const type = (request.headers.get('content-type') || '').split(';')[0].trim()
      // Each photo goes up once (so a post can't be used to run the AI check over and over)
      if (item.up) fail(409, 'already_uploaded')
      if (!PHOTO_TYPES.test(type)) fail(415, 'bad_photo')
      if (Number(request.headers.get('content-length')) > PHOTO_MAX) fail(413, 'too_big')
      const body = await request.arrayBuffer()
      if (!body.byteLength) fail(400, 'empty')
      if (body.byteLength > PHOTO_MAX) fail(413, 'too_big')
      item.ok = (await checkPhoto(env, new Uint8Array(body), p.text, type)) === 'ok' ? 1 : 0
      // The first photo decides if everyone may see it (showsCreation); later ones are only safety-checked
      if (n === 0 && item.ok && p.visibility === 'public') item.made = (await showsCreation(env, new Uint8Array(body), type, p.category)) ? 1 : 0
      await env.PHOTOS.put(mediaKey(id, n), body, { httpMetadata: { contentType: type } })
      item.up = 1
      await db.prepare('UPDATE blank_posts SET media = ? WHERE id = ?').bind(JSON.stringify(media), id).run()
      return json({ ok: true })
    }
    if (method === 'GET') {
      const p = await postById(id)
      const item = mediaOf(p)[n]
      if (!item || !env.PHOTOS) fail(404, 'not_found')
      const obj = await env.PHOTOS.get(mediaKey(id, n))
      if (!obj) fail(404, 'not_found')
      return new Response(obj.body, {
        headers: {
          'content-type': obj.httpMetadata?.contentType || 'image/jpeg',
          'cache-control': 'private, max-age=3600',
          'x-content-type-options': 'nosniff',
        },
      })
    }
    fail(405, 'method')
  }

  if ((m = path.match(/^\/social\/posts\/([0-9a-f]{20})\/publish$/)) && method === 'POST') {
    const p = await db.prepare('SELECT * FROM blank_posts WHERE id = ? AND user_id = ?').bind(m[1], uid).first()
    if (!p || p.status !== 'uploading') fail(404, 'not_found')
    const media = mediaOf(p)
    if (media.some((x) => !x.up)) fail(400, 'not_uploaded')
    const words = badWords(p.text, p.project, ...readPlan(p).steps, ...readPlan(p).how, ...readPlan(p).materials)
    const status = !words && media.every((x) => x.ok) ? 'ok' : 'review'
    const shown = p.visibility === 'public' && media[0]?.made === 0 ? 'friends' : p.visibility
    await db.prepare('UPDATE blank_posts SET status = ?, created = ?, visibility = ? WHERE id = ?').bind(status, Date.now(), shown, m[1]).run()
    if (status === 'review') alert(words ? 'words' : 'held', { u: me.username, text: p.text })
    await tellMade({ ...p, status })
    return json({ post: shape(await db.prepare(`${POST_SELECT} WHERE p.id = ?2`).bind(uid, m[1]).first()) })
  }

  if ((m = path.match(/^\/social\/posts\/([0-9a-f]{20})(\/[a-z]+)?$/))) {
    const id = m[1]
    const sub = m[2] || ''

    // One post (a post sent into a chat, opened from there)
    if (!sub && method === 'GET') return json({ post: shape(await postById(id)) })
    if (!sub && method === 'DELETE') {
      const p = await db.prepare('SELECT user_id, photo, ratio, media FROM blank_posts WHERE id = ?').bind(id).first()
      if (!p || (p.user_id !== uid && !me.admin)) fail(404, 'not_found')
      await removePost(db, env, id, p)
      return json({ ok: true })
    }

    if (!sub && method === 'PATCH') {
      const p = await db.prepare('SELECT user_id FROM blank_posts WHERE id = ?').bind(id).first()
      if (!p || p.user_id !== uid) fail(404, 'not_found')
      const b = await readJson(request, 1000)
      await db.prepare('UPDATE blank_posts SET comments_off = ? WHERE id = ?').bind(b.commentsOff ? 1 : 0, id).run()
      return json({ post: shape(await db.prepare(`${POST_SELECT} WHERE p.id = ?2`).bind(uid, id).first()) })
    }

    const p = await postById(id)

    // Results people made by following this post (the ones you may see)
    if (sub === '/made' && method === 'GET') {
      const r = await db.prepare(`${POST_SELECT} WHERE p.made_from = ?2 AND p.status = 'ok' AND ${NOT_BLOCKED} ORDER BY p.created DESC LIMIT 30`).bind(uid, id).all()
      const out = []
      for (const x of r.results || []) if (await visible(x)) out.push(shape(x))
      return json({ posts: out })
    }

    if (sub === '/comments') {
      if (method === 'GET') {
        const r = await db
          .prepare(
            `SELECT c.*, u.username, u.name, u.avatar, u.founder FROM blank_comments c JOIN blank_users u ON u.id = c.user_id
             WHERE c.post_id = ?2 AND c.status = 'ok' AND u.banned = 0
               AND NOT EXISTS (SELECT 1 FROM blank_blocks b WHERE (b.blocker = ?1 AND b.blocked = c.user_id) OR (b.blocker = c.user_id AND b.blocked = ?1))
             ORDER BY c.created LIMIT ${COMMENT_PAGE}`,
          )
          .bind(uid, id)
          .all()
        return json({ comments: (r.results || []).map((c) => shapeComment(c, p, uid)), off: !!p.comments_off })
      }
      if (method === 'POST') {
        notBanned()
        if (!me.rules_at) fail(403, 'rules')
        if (p.comments_off && p.user_id !== uid) fail(403, 'comments_off')
        if (p.status !== 'ok' && p.user_id !== uid) fail(404, 'not_found')
        const b = await readJson(request, 3000)
        const text = clean(b.text, 500)
        if (!text) fail(400, 'empty')
        if (badWords(text)) fail(422, 'text_rejected')
        if ((await count(db, 'comment', uid)) >= COMMENTS_PER_DAY) fail(429, 'too_many')
        await note(db, 'comment', uid)
        const c = { id: newId(), post_id: id, user_id: uid, text, status: 'ok', created: Date.now() }
        await db.prepare('INSERT INTO blank_comments (id, post_id, user_id, text, status, created) VALUES (?, ?, ?, ?, ?, ?)').bind(c.id, id, uid, text, 'ok', c.created).run()
        if (p.user_id !== uid) tell(p.user_id, 'comment', { name: myName, text }, { url: '#/you', once: { key: `comment:${id}`, gap: 10 * 60_000 } })
        return json({ comment: shapeComment({ ...c, username: me.username, name: me.name, avatar: me.avatar, founder: me.founder }, p, uid) })
      }
    }

    if (sub === '/photo' && method === 'GET') {
      if (!p.photo || !env.PHOTOS) fail(404, 'not_found')
      const obj = await env.PHOTOS.get(`p/${id}`)
      if (!obj) fail(404, 'not_found')
      return new Response(obj.body, {
        headers: { 'content-type': obj.httpMetadata?.contentType || 'image/jpeg', 'cache-control': 'private, max-age=3600', 'x-content-type-options': 'nosniff' },
      })
    }
    if (sub === '/like') {
      notBanned()
      if (method === 'POST') {
        const added = await db.prepare('INSERT OR IGNORE INTO blank_likes (post_id, user_id, created) VALUES (?, ?, ?)').bind(id, uid, Date.now()).run()
        if (added?.meta?.changes && p.user_id !== uid) tell(p.user_id, 'like', { name: myName, project: p.project || p.text?.slice(0, 60) }, { url: '#/you', once: { key: `like:${id}`, gap: 3600_000 } })
      }
      else if (method === 'DELETE') await db.prepare('DELETE FROM blank_likes WHERE post_id = ? AND user_id = ?').bind(id, uid).run()
      else fail(405, 'method')
      return json({ post: shape(await db.prepare(`${POST_SELECT} WHERE p.id = ?2`).bind(uid, id).first()) })
    }
    if (sub === '/report' && method === 'POST') {
      if (p.user_id === uid) fail(400, 'self')
      notBanned()
      const b = await readJson(request, 2000)
      const reason = REASONS.includes(b.reason) ? b.reason : 'other'
      if ((await count(db, 'report', uid)) >= REPORTS_PER_DAY) fail(429, 'too_many')
      const added = await db.prepare('INSERT OR IGNORE INTO blank_reports (post_id, reporter, reason, created) VALUES (?, ?, ?, ?)').bind(id, uid, reason, Date.now()).run()
      await note(db, 'report', uid)
      const n = (await db.prepare('SELECT COUNT(*) AS n FROM blank_reports WHERE post_id = ? AND resolved = 0').bind(id).first())?.n || 0
      let hidden = null
      if (n >= HIDE_AFTER_REPORTS) hidden = await db.prepare("UPDATE blank_posts SET status = 'review' WHERE id = ? AND status = 'ok' RETURNING id").bind(id).first()
      // One email for the first report, one when the post gets hidden; nothing for the reports in between
      if (hidden) alert('hidden', { u: p.username, n, text: p.text })
      else if (n === 1 && added?.meta?.changes !== 0) alert('reported', { u: p.username, reason, text: p.text })
      return json({ ok: true })
    }
  }

  // ---------- comments ----------
  if ((m = path.match(/^\/social\/comments\/([0-9a-f]{20})(\/report)?$/))) {
    const c = await db.prepare('SELECT c.*, p.user_id AS post_owner, u.username FROM blank_comments c JOIN blank_posts p ON p.id = c.post_id JOIN blank_users u ON u.id = c.user_id WHERE c.id = ?').bind(m[1]).first()
    if (!c) fail(404, 'not_found')
    if (!m[2] && method === 'DELETE') {
      // The writer, the post's author (their post, their rules) or the admin
      if (c.user_id !== uid && c.post_owner !== uid && !me.admin) fail(404, 'not_found')
      await db.batch([db.prepare('DELETE FROM blank_comment_reports WHERE comment_id = ?').bind(c.id), db.prepare('DELETE FROM blank_comments WHERE id = ?').bind(c.id)])
      return json({ ok: true })
    }
    if (m[2] && method === 'POST') {
      notBanned()
      if (c.user_id === uid) fail(400, 'self')
      await postById(c.post_id)
      const b = await readJson(request, 1000)
      const reason = REASONS.includes(b.reason) ? b.reason : 'other'
      if ((await count(db, 'report', uid)) >= REPORTS_PER_DAY) fail(429, 'too_many')
      const added = await db.prepare('INSERT OR IGNORE INTO blank_comment_reports (comment_id, reporter, reason, created) VALUES (?, ?, ?, ?)').bind(c.id, uid, reason, Date.now()).run()
      await note(db, 'report', uid)
      const n = (await db.prepare('SELECT COUNT(*) AS n FROM blank_comment_reports WHERE comment_id = ? AND resolved = 0').bind(c.id).first())?.n || 0
      if (n >= HIDE_AFTER_REPORTS) await db.prepare("UPDATE blank_comments SET status = 'removed' WHERE id = ?").bind(c.id).run()
      if (n === 1 && added?.meta?.changes !== 0) alert('comment', { u: c.username, reason, text: c.text })
      return json({ ok: true })
    }
  }

  // ---------- chats: messages between friends, and group chats ----------
  // Only friends can start a chat or be added to one; blocking someone hides your one-to-one chat with them.
  const member = async (chatId) => {
    const c = await db
      .prepare('SELECT c.*, m.read_at FROM blank_chats c JOIN blank_chat_members m ON m.chat_id = c.id AND m.user_id = ? WHERE c.id = ?')
      .bind(uid, chatId)
      .first()
    if (!c) fail(404, 'not_found')
    return c
  }
  const chatMembers = async (chatId) =>
    (
      await db
        .prepare('SELECT u.id, u.username, u.name, u.bio, u.avatar, u.founder FROM blank_chat_members m JOIN blank_users u ON u.id = m.user_id WHERE m.chat_id = ? AND u.banned = 0 ORDER BY m.joined')
        .bind(chatId)
        .all()
    ).results || []
  const friendsOnly = async (names) => {
    const out = []
    for (const n of [...new Set(names.map((x) => String(x).toLowerCase()))]) {
      const u = await userByName(n)
      if (u.id === uid) continue
      if (relation(await friendship(u.id)) !== 'friends' || (await blockedEither(u.id))) fail(403, 'not_friends')
      out.push(u)
    }
    return out
  }
  const shapeMessage = (x) => {
    const ok = x.status === 'ok'
    return {
      id: x.id,
      from: x.username ? { username: x.username, name: x.name || '', avatar: !!x.avatar } : null,
      mine: x.user_id === uid,
      kind: x.kind,
      text: ok ? x.text : '',
      project: x.project,
      category: x.category,
      ...(x.kind === 'checkin' && ok && { progress: readInfo(x.info) }),
      ...(x.kind === 'share' && ok && { share: readInfo(x.info) }),
      ...((x.kind === 'progress' || x.kind === 'session' || x.kind === 'poke') && ok && { info: readInfo(x.info) }),
      ...(ok && x.photo && { photo: true, ratio: x.ratio || 1 }),
      ...(ok && x.reply_to && { replyTo: x.reply_to }),
      removed: !ok,
      ...(x.status === 'unsent' && { unsent: true }),
      created: x.created,
      updated: x.updated || 0,
    }
  }
  const MESSAGE_SELECT = 'SELECT x.*, u.username, u.name, u.avatar FROM blank_messages x JOIN blank_users u ON u.id = x.user_id'
  // Reactions and the message each one answers (a short quote of it), for a list of shaped messages
  const inGroups = (list) => {
    const out = []
    for (let i = 0; i < list.length; i += 90) out.push(list.slice(i, i + 90)) // D1: at most 100 values per statement
    return out
  }
  const marks = (n) => Array(n).fill('?').join(',')
  const enrich = async (list) => {
    if (!list.length) return list
    const reacts = []
    for (const ids of inGroups(list.map((x) => x.id)))
      reacts.push(...((await db.prepare(`SELECT message_id, user_id, emoji FROM blank_message_reactions WHERE message_id IN (${marks(ids.length)})`).bind(...ids).all()).results || []))
    const quoted = new Map()
    for (const ids of inGroups([...new Set(list.map((x) => x.replyTo).filter(Boolean))]))
      for (const r of (await db.prepare(`${MESSAGE_SELECT} WHERE x.id IN (${marks(ids.length)})`).bind(...ids).all()).results || []) quoted.set(r.id, r)
    return list.map((x) => {
      const out = { ...x }
      const mine = reacts.filter((r) => r.message_id === x.id)
      if (mine.length) {
        const n = new Map()
        for (const r of mine) n.set(r.emoji, (n.get(r.emoji) || 0) + 1)
        out.reactions = [...n].map(([emoji, k]) => ({ emoji, n: k, me: mine.some((r) => r.user_id === uid && r.emoji === emoji) }))
      }
      const q = x.replyTo && quoted.get(x.replyTo)
      if (q) {
        const ok = q.status === 'ok'
        out.reply = { id: q.id, mine: q.user_id === uid, name: q.name || `@${q.username}`, text: ok ? String(q.text || q.project || '').slice(0, 140) : '', photo: ok && !!q.photo, kind: q.kind, removed: !ok }
      }
      return out
    })
  }
  // A message id from this chat, to answer it (anything else: no reply)
  const replyIn = async (chatId, id) =>
    typeof id === 'string' && /^[0-9a-f]{20}$/.test(id) && (await db.prepare("SELECT 1 FROM blank_messages WHERE id = ? AND chat_id = ? AND kind != 'system'").bind(id, chatId).first()) ? id : null
  // One-to-one chats: not with someone who blocked you or whom you blocked
  const canWrite = async (c, { photo = false } = {}) => {
    if (c.kind !== 'dm' && c.kind !== 'project') return
    const other = (await chatMembers(c.id)).find((u) => u.id !== uid)
    if (!other || (await blockedEither(other.id))) fail(403, 'blocked')
    if (c.request_by) {
      // Became friends meanwhile: it's a normal chat now
      if (relation(await friendship(other.id)) === 'friends') return void (await db.prepare('UPDATE blank_chats SET request_by = NULL WHERE id = ?').bind(c.id).run())
      if (c.request_by === uid) fail(403, 'request_pending')
      if (photo) fail(403, 'request_pending')
      // The person who got the request writes back: that accepts it
      await db.prepare('UPDATE blank_chats SET request_by = NULL WHERE id = ?').bind(c.id).run()
    }
  }
  const tellChat = async (c, text) => {
    // Everyone else in the chat gets a notification (a quick burst of messages is one notification)
    for (const other of (await chatMembers(c.id)).filter((u) => u.id !== uid))
      tell(other.id, text ? 'message' : 'photo', { name: myName, chat: c.kind === 'group' ? c.name : '', text }, { url: `#/chats/${c.id}`, once: { key: `chat:${c.id}`, gap: 5 * 60_000 } })
  }
  const addMessage = async (chatId, kind, text, extra = {}) => {
    const x = {
      id: extra.id || newId(),
      chat_id: chatId,
      user_id: uid,
      kind,
      text,
      project: extra.project || '',
      category: extra.category || null,
      info: extra.info || null,
      photo: extra.photo ? 1 : 0,
      ratio: extra.ratio || null,
      reply_to: extra.replyTo || null,
      status: 'ok',
      created: Date.now(),
      updated: 0,
    }
    await db.batch([
      db
        .prepare('INSERT INTO blank_messages (id, chat_id, user_id, kind, text, project, category, info, photo, ratio, reply_to, status, created) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(x.id, chatId, uid, kind, text, x.project, x.category, x.info, x.photo, x.ratio, x.reply_to, 'ok', x.created),
      db.prepare('UPDATE blank_chats SET last_at = ? WHERE id = ?').bind(x.created, chatId),
      db.prepare('UPDATE blank_chat_members SET read_at = ? WHERE chat_id = ? AND user_id = ?').bind(x.created, chatId, uid),
    ])
    return { ...x, username: me.username, name: me.name, avatar: me.avatar }
  }

  // Project chats (doing a plan together): helpers used by the chat routes below
  const PROJECTS_PER_PAIR = 3
  const POKE_AFTER = 3 * DAY // no progress for 3 days: the other one gets a "You coming?" button
  const projectsWith = async (otherId) =>
    (
      (await db
        .prepare("SELECT id, name, hobby FROM blank_chats WHERE pair_key = ? AND kind = 'project' AND archived_at = 0 ORDER BY last_at DESC")
        .bind([uid, otherId].sort().join(':'))
        .all()).results || []
    ).map((c) => ({ id: c.id, name: c.name, category: c.hobby || 'other' }))
  const projectInfo = async (c) => {
    const now = Date.now()
    const rows =
      (await db
        .prepare(
          `SELECT u.id, u.username, u.name, u.avatar, m.joined, m.joined_plan, m.done_steps, m.total_steps, m.progress_at, m.poked_at, m.finished_at
           FROM blank_chat_members m JOIN blank_users u ON u.id = m.user_id WHERE m.chat_id = ? ORDER BY m.joined`,
        )
        .bind(c.id)
        .all()).results || []
    const mine = rows.find((r) => r.id === uid)
    const items =
      (await db
        .prepare('SELECT i.id, i.text, i.bought, i.claimed_by, u.username, u.name FROM blank_chat_items i LEFT JOIN blank_users u ON u.id = i.claimed_by WHERE i.chat_id = ? ORDER BY i.created, i.id')
        .bind(c.id)
        .all()).results || []
    const sessions =
      (await db.prepare('SELECT id, at, place, created_by FROM blank_chat_sessions WHERE chat_id = ? AND at > ? ORDER BY at LIMIT 5').bind(c.id, now - 2 * 3_600_000).all()).results || []
    return {
      plan: readInfo(c.plan),
      archived: c.archived_at || 0,
      people: rows.map((r) => ({
        username: r.username,
        name: r.name || '',
        avatar: !!r.avatar,
        me: r.id === uid,
        joined: !!r.joined_plan,
        done: r.done_steps,
        total: r.total_steps,
        progressAt: r.progress_at,
        finished: r.finished_at || 0,
        canPoke: r.id !== uid && !c.archived_at && !r.finished_at && now - Math.max(r.progress_at, r.joined) > POKE_AFTER && now - (mine?.poked_at || 0) > DAY,
      })),
      items: items.map((i) => ({ id: i.id, text: i.text, bought: !!i.bought, claimedBy: i.claimed_by ? { username: i.username, name: i.name || '', me: i.claimed_by === uid } : null })),
      sessions: sessions.map((x) => ({ id: x.id, at: x.at, place: x.place, mine: x.created_by === uid })),
    }
  }
  const projectChat = async (chatId) => {
    const c = await member(chatId)
    if (c.kind !== 'project') fail(400, 'not_project')
    await canWrite(c)
    return c
  }
  if (path === '/social/chats' && method === 'GET') {
    const r = await db
      .prepare(
        `SELECT c.*, m.read_at,
           (SELECT COUNT(*) FROM blank_messages x WHERE x.chat_id = c.id AND x.created > m.read_at AND x.user_id != ?1) AS unread
         FROM blank_chat_members m JOIN blank_chats c ON c.id = m.chat_id WHERE m.user_id = ?1 ORDER BY c.last_at DESC LIMIT 100`,
      )
      .bind(uid)
      .all()
    const chats = []
    for (const c of r.results || []) {
      const members = (await chatMembers(c.id)).filter((u) => u.id !== uid)
      // A one-to-one chat with someone you blocked (or who blocked you) is gone from the list
      if ((c.kind === 'dm' || c.kind === 'project') && (!members.length || (await blockedEither(members[0].id)))) continue
      const last = await db.prepare(`${MESSAGE_SELECT} WHERE x.chat_id = ? ORDER BY x.created DESC LIMIT 1`).bind(c.id).first()
      chats.push({ id: c.id, kind: c.kind, name: c.name, hobby: c.hobby, members: members.map(pub), last: last ? shapeMessage(last) : null, unread: c.unread, lastAt: c.last_at, archived: c.archived_at || 0, request: c.request_by ? (c.request_by === uid ? 'sent' : 'received') : null })
    }
    return json({ chats })
  }
  if (path === '/social/chats/unread' && method === 'GET') {
    const r = await db
      .prepare(
        `SELECT COUNT(DISTINCT m.chat_id) AS n FROM blank_chat_members m JOIN blank_messages x ON x.chat_id = m.chat_id
         JOIN blank_chats c ON c.id = m.chat_id
         WHERE m.user_id = ?1 AND x.created > m.read_at AND x.user_id != ?1 AND (c.request_by IS NULL OR c.request_by = ?1)`,
      )
      .bind(uid)
      .first()
    const asked = await db
      .prepare('SELECT COUNT(*) AS n FROM blank_chat_members m JOIN blank_chats c ON c.id = m.chat_id WHERE m.user_id = ?1 AND c.request_by IS NOT NULL AND c.request_by != ?1')
      .bind(uid)
      .first()
    const q = await db.prepare("SELECT COUNT(*) AS n FROM blank_friends WHERE addressee = ? AND status = 'pending'").bind(uid).first()
    return json({ n: r?.n || 0, requests: q?.n || 0, messageRequests: asked?.n || 0 })
  }
  if (path === '/social/chats' && method === 'POST') {
    notBanned()
    const b = await readJson(request, 5000)
    const others = await friendsOnly(Array.isArray(b.with) ? b.with.slice(0, GROUP_MAX) : [])
    if (!others.length) fail(400, 'empty')
    const group = others.length > 1 || !!b.name
    if (!group) {
      // One chat per pair
      const key = [uid, others[0].id].sort().join(':')
      const had = await db.prepare('SELECT id FROM blank_chats WHERE dm_key = ?').bind(key).first()
      if (had) return json({ id: had.id })
    }
    if ((await count(db, 'chat', uid)) >= CHATS_PER_DAY) fail(429, 'too_many')
    const name = group ? clean(b.name, 40) : ''
    if (group && !name) fail(400, 'name')
    if (badWords(name)) fail(422, 'text_rejected')
    const id = newId()
    const now = Date.now()
    await db.batch([
      db
        .prepare('INSERT INTO blank_chats (id, kind, name, hobby, dm_key, created_by, created, last_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(id, group ? 'group' : 'dm', name, group && HOBBIES.includes(b.hobby) ? b.hobby : null, group ? null : [uid, others[0].id].sort().join(':'), uid, now, now),
      ...[uid, ...others.map((u) => u.id)].map((u) => db.prepare('INSERT INTO blank_chat_members (chat_id, user_id, joined, read_at) VALUES (?, ?, ?, ?)').bind(id, u, now, now)),
    ])
    await note(db, 'chat', uid)
    return json({ id })
  }
  if ((m = path.match(/^\/social\/chats\/([0-9a-f]{20})$/))) {
    const c = await member(m[1])
    if (method === 'GET') {
      const members = await chatMembers(c.id)
      const other = c.kind === 'dm' || c.kind === 'project' ? members.find((u) => u.id !== uid) : null
      if ((c.kind === 'dm' || c.kind === 'project') && (!other || (await blockedEither(other.id)))) fail(404, 'not_found')
      const after = Number(url.searchParams.get('after')) || 0
      const before = Number(url.searchParams.get('before')) || 0
      const now = Date.now()
      // New messages, and older ones that changed since (a reaction, an unsend)
      const r = after
        ? await db.prepare(`${MESSAGE_SELECT} WHERE x.chat_id = ?1 AND (x.created > ?2 OR x.updated > ?2) ORDER BY x.created LIMIT 200`).bind(c.id, after).all()
        : await db.prepare(`${MESSAGE_SELECT} WHERE x.chat_id = ? AND (? = 0 OR x.created < ?) ORDER BY x.created DESC LIMIT ?`).bind(c.id, before, before, MESSAGE_PAGE).all()
      const messages = await enrich((r.results || []).map(shapeMessage))
      if (!after) messages.reverse()
      // Read up to now: saved when the chat opens or something new came in (not on every quiet check, which would be a
      // database write every few seconds per open chat)
      if (!before && (!after || messages.some((x) => !x.mine))) await db.prepare('UPDATE blank_chat_members SET read_at = ? WHERE chat_id = ? AND user_id = ?').bind(now, c.id, uid).run()
      // Who else is typing right now (they typed in the last 6 seconds)
      const typing = (
        (await db.prepare('SELECT u.username, u.name FROM blank_chat_members m JOIN blank_users u ON u.id = m.user_id WHERE m.chat_id = ? AND m.user_id != ? AND m.typing_at > ?').bind(c.id, uid, now - 6000).all())
          .results || []
      ).map((u) => u.name || `@${u.username}`)
      // One-to-one: when they last had the chat open ("Seen" under your newest message)
      // (Not for a message request you sent: they decide in peace, without you seeing they read it)
      const seen = other && c.request_by !== uid ? (await db.prepare('SELECT read_at FROM blank_chat_members WHERE chat_id = ? AND user_id = ?').bind(c.id, other.id).first())?.read_at || 0 : null
      return json({
        chat: { id: c.id, kind: c.kind, name: c.name, hobby: c.hobby, members: members.filter((u) => u.id !== uid).map(pub), mine: c.created_by === uid, request: c.request_by ? (c.request_by === uid ? 'sent' : 'received') : null },
        messages,
        more: !after && messages.length === MESSAGE_PAGE,
        seen,
        typing,
        ...(c.kind === 'project' && { project: await projectInfo(c) }),
        ...(c.kind === 'dm' && other && { projects: await projectsWith(other.id) }),
        now,
      })
    }
    if (method === 'PATCH') {
      notBanned()
      if (c.kind !== 'group') fail(400, 'dm')
      const b = await readJson(request, 2000)
      const name = clean(b.name, 40)
      if (!name) fail(400, 'name')
      if (badWords(name)) fail(422, 'text_rejected')
      await db.prepare('UPDATE blank_chats SET name = ?, hobby = ? WHERE id = ?').bind(name, HOBBIES.includes(b.hobby) ? b.hobby : c.hobby, c.id).run()
      return json({ ok: true })
    }
  }
  // ---------- doing a plan together: project chats (kind 'project', migration 0530) ----------
  // One chat per shared plan between two friends, at most 3 active per pair. Each person follows the plan in their
  // own Blank project (their own checklist); ticking a step there sends their progress here as a card.
  // "Do this together": a plan and a friend → the project chat (the friend joins it with one tap)
  if (path === '/social/projects' && method === 'POST') {
    notBanned()
    const b = await readJson(request, 16000)
    const [friend] = await friendsOnly([String(b.with || '')])
    if (!friend) fail(400, 'empty')
    const p = b.plan || {}
    const info = infoOf({ steps: (Array.isArray(p.steps) ? p.steps : []).map((x) => ({ text: typeof x === 'string' ? x : x?.text, done: false })), lang: p.lang, guide: p.guide })
    const title = clean(p.title, 80)
    if (!info || !title) fail(400, 'empty')
    const materials = (Array.isArray(p.materials) ? p.materials : []).map((x) => clean(typeof x === 'string' ? x : x?.text, 80)).filter(Boolean).slice(0, 20)
    if (badWords(title, ...info.steps.map((x) => x.text), ...materials)) fail(422, 'text_rejected')
    const pair = [uid, friend.id].sort().join(':')
    const active = await db.prepare("SELECT COUNT(*) AS n FROM blank_chats WHERE pair_key = ? AND kind = 'project' AND archived_at = 0").bind(pair).first()
    if ((active?.n || 0) >= PROJECTS_PER_PAIR) fail(409, 'too_many_projects')
    if ((await count(db, 'chat', uid)) >= CHATS_PER_DAY) fail(429, 'too_many')
    const id = newId()
    const now = Date.now()
    const plan = { title, category: HOBBIES.includes(p.category) ? p.category : 'other', guide: info.guide, steps: info.steps.map((x) => x.text), lang: info.lang }
    const done = Math.max(0, Math.min(info.total, Number(b.done) || 0))
    await db.batch([
      db
        .prepare('INSERT INTO blank_chats (id, kind, name, hobby, dm_key, created_by, created, last_at, plan, pair_key) VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, ?)')
        .bind(id, 'project', title, plan.category, uid, now, now, JSON.stringify(plan), pair),
      db
        .prepare('INSERT INTO blank_chat_members (chat_id, user_id, joined, read_at, joined_plan, done_steps, total_steps, progress_at) VALUES (?, ?, ?, ?, 1, ?, ?, ?)')
        .bind(id, uid, now, now, done, info.total, now),
      db.prepare('INSERT INTO blank_chat_members (chat_id, user_id, joined, read_at, total_steps) VALUES (?, ?, ?, 0, ?)').bind(id, friend.id, now + 1, info.total),
      ...materials.map((t, i) => db.prepare('INSERT INTO blank_chat_items (chat_id, id, text, created) VALUES (?, ?, ?, ?)').bind(id, newId(), t, now + i)),
    ])
    await note(db, 'chat', uid)
    await addMessage(id, 'system', 'together')
    tell(friend.id, 'together', { name: myName, project: title }, { url: `#/chats/${id}` })
    return json({ id })
  }
  if ((m = path.match(/^\/social\/chats\/([0-9a-f]{20})\/(join|progress|poke|items|sessions)$/)) && method === 'POST') {
    notBanned()
    const c = await projectChat(m[1])
    const what = m[2]
    const b = await readJson(request, 4000)
    const now = Date.now()
    if (what === 'join') {
      const plan = readInfo(c.plan)
      const r = await db.prepare('UPDATE blank_chat_members SET joined_plan = 1, progress_at = ? WHERE chat_id = ? AND user_id = ? AND joined_plan = 0').bind(now, c.id, uid).run()
      if (r.meta?.changes) {
        await addMessage(c.id, 'system', 'joined')
        await tellChat(c, plan?.title || '')
      }
      return json({ plan })
    }
    if (what === 'progress') {
      // Your own project's steps: a card for the others each time you tick one more ("Lilla finished step 3")
      const mine = await db.prepare('SELECT done_steps, finished_at, progress_at FROM blank_chat_members WHERE chat_id = ? AND user_id = ?').bind(c.id, uid).first()
      const total = Math.max(1, Math.min(60, Number(b.total) || 1))
      const done = Math.max(0, Math.min(total, Number(b.done) || 0))
      const step = clean(b.step, 200)
      if (badWords(step)) fail(422, 'text_rejected')
      const finished = done >= total ? mine.finished_at || now : 0
      await db
        .prepare('UPDATE blank_chat_members SET joined_plan = 1, done_steps = ?, total_steps = ?, progress_at = ?, finished_at = ? WHERE chat_id = ? AND user_id = ?')
        .bind(done, total, done > mine.done_steps ? now : mine.progress_at, finished, c.id, uid)
        .run()
      if (done > mine.done_steps) {
        if ((await count(db, 'msg', uid)) >= MESSAGES_PER_DAY) fail(429, 'too_many')
        await note(db, 'msg', uid)
        await addMessage(c.id, 'progress', '', { info: JSON.stringify({ done, total, step, finished: !!finished }) })
        await tellChat(c, finished ? `🎉 ${c.name}` : `✓ ${step || c.name}`)
      }
      // Both finished: the chat goes to the Archive, with everyone's final result
      const left = await db.prepare('SELECT COUNT(*) AS n FROM blank_chat_members WHERE chat_id = ? AND finished_at = 0').bind(c.id).first()
      if (finished && !left?.n && !c.archived_at) {
        await db.prepare('UPDATE blank_chats SET archived_at = ? WHERE id = ?').bind(now, c.id).run()
        await addMessage(c.id, 'system', 'finished')
      }
      return json({ project: await projectInfo({ ...c, archived_at: finished && !left?.n ? c.archived_at || now : c.archived_at }) })
    }
    if (what === 'poke') {
      const info = await projectInfo(c)
      const them = info.people.find((x) => x.canPoke)
      if (!them) fail(409, 'too_soon')
      await db.prepare('UPDATE blank_chat_members SET poked_at = ? WHERE chat_id = ? AND user_id = ?').bind(now, c.id, uid).run()
      const x = await addMessage(c.id, 'poke', '', { info: JSON.stringify({ to: them.username }) })
      const target = await userByName(them.username)
      tell(target.id, 'poke', { name: myName, project: c.name }, { url: `#/chats/${c.id}` })
      return json({ message: (await enrich([shapeMessage(x)]))[0] })
    }
    if (what === 'items') {
      const text = clean(b.text, 80)
      if (!text) fail(400, 'empty')
      if (badWords(text)) fail(422, 'text_rejected')
      const n = await db.prepare('SELECT COUNT(*) AS n FROM blank_chat_items WHERE chat_id = ?').bind(c.id).first()
      if ((n?.n || 0) >= 40) fail(429, 'too_many')
      await db.prepare('INSERT INTO blank_chat_items (chat_id, id, text, created) VALUES (?, ?, ?, ?)').bind(c.id, newId(), text, now).run()
      await db.prepare('UPDATE blank_chats SET last_at = last_at WHERE id = ?').bind(c.id).run()
      return json({ project: await projectInfo(c) })
    }
    if (what === 'sessions') {
      // A time (and a place) to work on it together; everyone gets a reminder 30 minutes before (blank-together.js)
      const at = Number(b.at)
      if (!(at > now - 60_000 && at < now + 60 * DAY)) fail(400, 'bad_time')
      const place = clean(b.place, 80)
      if (badWords(place)) fail(422, 'text_rejected')
      const n = await db.prepare('SELECT COUNT(*) AS n FROM blank_chat_sessions WHERE chat_id = ? AND at > ?').bind(c.id, now).first()
      if ((n?.n || 0) >= 5) fail(429, 'too_many')
      const id = newId()
      await db.prepare('INSERT INTO blank_chat_sessions (id, chat_id, at, place, created_by, created) VALUES (?, ?, ?, ?, ?, ?)').bind(id, c.id, at, place, uid, now).run()
      const x = await addMessage(c.id, 'session', '', { info: JSON.stringify({ id, at, place }) })
      await tellChat(c, place ? `📅 ${place}` : '📅')
      return json({ message: (await enrich([shapeMessage(x)]))[0], project: await projectInfo(c) })
    }
  }
  // Claim an item ("I'll buy the yarn"), tick it bought, or delete it; cancel a session you planned
  if ((m = path.match(/^\/social\/chats\/([0-9a-f]{20})\/items\/([0-9a-f]{20})$/)) && (method === 'PATCH' || method === 'DELETE')) {
    notBanned()
    const c = await projectChat(m[1])
    const item = await db.prepare('SELECT * FROM blank_chat_items WHERE chat_id = ? AND id = ?').bind(c.id, m[2]).first()
    if (!item) fail(404, 'not_found')
    if (method === 'DELETE') await db.prepare('DELETE FROM blank_chat_items WHERE chat_id = ? AND id = ?').bind(c.id, item.id).run()
    else {
      const b = await readJson(request, 1000)
      // Claiming takes it from nobody or yourself (not from your friend); unclaiming only your own
      const claimed = b.claim === true ? (item.claimed_by && item.claimed_by !== uid ? item.claimed_by : uid) : b.claim === false && item.claimed_by === uid ? null : item.claimed_by
      const bought = typeof b.bought === 'boolean' ? (b.bought ? 1 : 0) : item.bought
      await db.prepare('UPDATE blank_chat_items SET claimed_by = ?, bought = ? WHERE chat_id = ? AND id = ?').bind(claimed, bought, c.id, item.id).run()
    }
    return json({ project: await projectInfo(c) })
  }
  if ((m = path.match(/^\/social\/chats\/([0-9a-f]{20})\/sessions\/([0-9a-f]{20})$/)) && method === 'DELETE') {
    const c = await projectChat(m[1])
    await db.prepare('DELETE FROM blank_chat_sessions WHERE chat_id = ? AND id = ? AND created_by = ?').bind(c.id, m[2], uid).run()
    return json({ project: await projectInfo(c) })
  }

  // ---------- message requests (people who aren't your friends) ----------
  // Only to people who turned requests on (16+, /social/me). One text message, no photo; it waits in their Requests
  // folder until they accept (or answer), decline or block. One chat per pair, like friend chats.
  if ((m = path.match(/^\/social\/requests\/([a-z0-9._]{3,24})$/)) && method === 'POST') {
    notBanned()
    const u = await userByName(m[1])
    if (u.id === uid) fail(400, 'self')
    if (await blockedEither(u.id)) fail(404, 'not_found')
    if (relation(await friendship(u.id)) === 'friends') fail(409, 'friends')
    const open = await db.prepare('SELECT msg_requests FROM blank_users WHERE id = ?').bind(u.id).first()
    if (!open?.msg_requests) fail(403, 'requests_off')
    const key = [uid, u.id].sort().join(':')
    if (await db.prepare('SELECT 1 FROM blank_chats WHERE dm_key = ?').bind(key).first()) fail(409, 'exists')
    const b = await readJson(request, 3000)
    const text = clean(b.text, 500)
    if (!text) fail(400, 'empty')
    if (badWords(text)) fail(422, 'text_rejected')
    if ((await count(db, 'msgrequest', uid)) >= 10) fail(429, 'too_many')
    await note(db, 'msgrequest', uid)
    const id = newId()
    const now = Date.now()
    await db.batch([
      db.prepare('INSERT INTO blank_chats (id, kind, name, hobby, dm_key, created_by, created, last_at, request_by) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?)').bind(id, 'dm', '', key, uid, now, now, uid),
      db.prepare('INSERT INTO blank_chat_members (chat_id, user_id, joined, read_at) VALUES (?, ?, ?, ?)').bind(id, uid, now, now),
      db.prepare('INSERT INTO blank_chat_members (chat_id, user_id, joined, read_at) VALUES (?, ?, ?, 0)').bind(id, u.id, now + 1),
    ])
    await addMessage(id, 'text', text)
    tell(u.id, 'message_request', { name: myName }, { url: '#/friends' })
    return json({ id })
  }
  if ((m = path.match(/^\/social\/chats\/([0-9a-f]{20})\/(accept|decline)$/)) && method === 'POST') {
    const c = await member(m[1])
    if (!c.request_by || c.request_by === uid) fail(404, 'not_found')
    if (m[2] === 'accept') await db.prepare('UPDATE blank_chats SET request_by = NULL WHERE id = ?').bind(c.id).run()
    else
      await db.batch([
        db.prepare('DELETE FROM blank_messages WHERE chat_id = ?').bind(c.id),
        db.prepare('DELETE FROM blank_chat_members WHERE chat_id = ?').bind(c.id),
        db.prepare('DELETE FROM blank_chats WHERE id = ?').bind(c.id),
      ])
    return json({ ok: true })
  }

  // "typing…": the app sends this at most every 3 seconds while you type (one small database write)
  if ((m = path.match(/^\/social\/chats\/([0-9a-f]{20})\/typing$/)) && method === 'POST') {
    notBanned()
    const c = await member(m[1])
    await db.prepare('UPDATE blank_chat_members SET typing_at = ? WHERE chat_id = ? AND user_id = ? AND typing_at < ?').bind(Date.now(), c.id, uid, Date.now() - 2500).run()
    return json({ ok: true })
  }
  if ((m = path.match(/^\/social\/chats\/([0-9a-f]{20})\/messages$/)) && method === 'POST') {
    notBanned()
    const c = await member(m[1])
    await canWrite(c)
    const b = await readJson(request, 16000) // a check-in carries up to 30 steps
    const kind = b.kind === 'checkin' ? 'checkin' : b.kind === 'share' ? 'share' : 'text'
    const text = clean(b.text, 2000)
    if (kind === 'share') {
      // A post or a plan sent into the chat, as a card. A post only if you may see it yourself; the card keeps its
      // title and author, and opening it checks again whether the reader may see it.
      const sh = b.share || {}
      let share
      if (sh.type === 'post') {
        const p = await postById(String(sh.id || ''))
        share = { type: 'post', id: p.id, title: clean(p.project || String(p.text || '').split('\n')[0], 80), author: p.name || '', username: p.username || '', photo: !!(p.photo || p.media) }
      } else if (sh.type === 'plan') {
        const info = infoOf({ steps: (Array.isArray(sh.steps) ? sh.steps : []).map((x) => ({ text: typeof x === 'string' ? x : x?.text, done: false })), lang: sh.lang, guide: sh.guide })
        const title = clean(sh.title, 80)
        if (!info || !title) fail(400, 'empty')
        share = { type: 'plan', title, category: HOBBIES.includes(sh.category) ? sh.category : 'other', steps: info.steps, total: info.total, done: 0, lang: info.lang, guide: info.guide }
      } else fail(400, 'bad_share')
      if (badWords(text, share.title, ...(share.steps || []).map((x) => x.text))) fail(422, 'text_rejected')
      if ((await count(db, 'msg', uid)) >= MESSAGES_PER_DAY) fail(429, 'too_many')
      await note(db, 'msg', uid)
      const x = await addMessage(c.id, 'share', text, { project: share.title, category: share.category || null, info: JSON.stringify(share) })
      await tellChat(c, text || share.title)
      return json({ message: (await enrich([shapeMessage(x)]))[0] })
    }
    const project = kind === 'checkin' ? clean(b.project, 80) : ''
    if (!text && !project) fail(400, 'empty')
    const info = kind === 'checkin' ? infoOf(b) : null
    if (badWords(text, project, ...(info ? [info.last, ...info.steps.map((x) => x.text)] : []))) fail(422, 'text_rejected')
    if ((await count(db, 'msg', uid)) >= MESSAGES_PER_DAY) fail(429, 'too_many')
    await note(db, 'msg', uid)
    const replyTo = await replyIn(c.id, b.reply)
    const x = await addMessage(c.id, kind, text, { project, category: kind === 'checkin' && HOBBIES.includes(b.category) ? b.category : null, info: info && JSON.stringify(info), replyTo })
    await tellChat(c, text || project)
    return json({ message: (await enrich([shapeMessage(x)]))[0] })
  }
  // A photo, with an optional caption. Checked before anyone sees it; in a private chat a doubtful photo is refused
  // rather than held back, since nobody reviews chats before they're read.
  if ((m = path.match(/^\/social\/chats\/([0-9a-f]{20})\/photo$/)) && method === 'PUT') {
    notBanned()
    const c = await member(m[1])
    await canWrite(c, { photo: true })
    if (!env.PHOTOS) fail(503, 'no_storage')
    const type = (request.headers.get('content-type') || '').split(';')[0].trim()
    if (!PHOTO_TYPES.test(type)) fail(415, 'bad_photo')
    if (Number(request.headers.get('content-length')) > PHOTO_MAX) fail(413, 'too_big')
    const body = await request.arrayBuffer()
    if (!body.byteLength || body.byteLength > PHOTO_MAX) fail(413, 'too_big')
    const text = clean(url.searchParams.get('text') || '', 2000)
    if (badWords(text)) fail(422, 'text_rejected')
    if ((await count(db, 'chatphoto', uid)) >= CHAT_PHOTOS_PER_DAY || (await count(db, 'msg', uid)) >= MESSAGES_PER_DAY) fail(429, 'too_many')
    await note(db, 'chatphoto', uid)
    const check = await checkPhoto(env, new Uint8Array(body), text, type, 'error')
    if (check === 'error') fail(503, 'photo_check')
    if (check !== 'ok') fail(422, 'photo_rejected')
    await note(db, 'msg', uid)
    const id = newId()
    await env.PHOTOS.put(`m/${id}`, body, { httpMetadata: { contentType: type } })
    const r = Number(url.searchParams.get('ratio'))
    const x = await addMessage(c.id, 'text', text, { id, photo: true, ratio: r >= 0.2 && r <= 5 ? Math.round(r * 1000) / 1000 : 1, replyTo: await replyIn(c.id, url.searchParams.get('reply')) })
    await tellChat(c, text)
    return json({ message: (await enrich([shapeMessage(x)]))[0] })
  }
  if ((m = path.match(/^\/social\/messages\/([0-9a-f]{20})\/photo$/)) && method === 'GET') {
    const x = await db.prepare('SELECT id, chat_id, photo, status FROM blank_messages WHERE id = ?').bind(m[1]).first()
    if (!x || !x.photo || !env.PHOTOS) fail(404, 'not_found')
    // The admin sees reported photos (also removed ones); everyone else only in their own chats
    if (!me.admin) {
      await member(x.chat_id)
      if (x.status !== 'ok') fail(404, 'not_found')
    }
    const obj = await env.PHOTOS.get(`m/${x.id}`)
    if (!obj) fail(404, 'not_found')
    return new Response(obj.body, { headers: { 'content-type': obj.httpMetadata?.contentType || 'image/jpeg', 'cache-control': 'private, max-age=86400' } })
  }
  if ((m = path.match(/^\/social\/messages\/([0-9a-f]{20})\/react$/)) && method === 'POST') {
    notBanned()
    const x = await db.prepare(`${MESSAGE_SELECT} WHERE x.id = ?`).bind(m[1]).first()
    if (!x || x.status !== 'ok' || x.kind === 'system') fail(404, 'not_found')
    await member(x.chat_id)
    const b = await readJson(request, 500)
    const emoji = b.emoji == null ? null : String(b.emoji)
    if (emoji !== null && !REACTIONS.includes(emoji)) fail(400, 'bad_emoji')
    const now = Date.now()
    await db.batch([
      emoji === null
        ? db.prepare('DELETE FROM blank_message_reactions WHERE message_id = ? AND user_id = ?').bind(x.id, uid)
        : db
            .prepare('INSERT INTO blank_message_reactions (message_id, user_id, emoji, created) VALUES (?, ?, ?, ?) ON CONFLICT (message_id, user_id) DO UPDATE SET emoji = excluded.emoji, created = excluded.created')
            .bind(x.id, uid, emoji, now),
      db.prepare('UPDATE blank_messages SET updated = ? WHERE id = ?').bind(now, x.id),
    ])
    return json({ message: (await enrich([shapeMessage({ ...x, updated: now })]))[0] })
  }
  if ((m = path.match(/^\/social\/messages\/([0-9a-f]{20})$/)) && method === 'DELETE') {
    const x = await db.prepare(`${MESSAGE_SELECT} WHERE x.id = ?`).bind(m[1]).first()
    if (!x || x.user_id !== uid || x.kind === 'system') fail(404, 'not_found')
    const now = Date.now()
    await db.batch([
      db.prepare("UPDATE blank_messages SET status = 'unsent', text = '', info = NULL, updated = ? WHERE id = ?").bind(now, x.id),
      db.prepare('DELETE FROM blank_message_reactions WHERE message_id = ?').bind(x.id),
    ])
    if (x.photo && env.PHOTOS) await env.PHOTOS.delete(`m/${x.id}`)
    return json({ message: shapeMessage({ ...x, status: 'unsent', text: '', updated: now }) })
  }
  if ((m = path.match(/^\/social\/chats\/([0-9a-f]{20})\/members$/)) && method === 'POST') {
    notBanned()
    const c = await member(m[1])
    if (c.kind !== 'group') fail(400, 'dm')
    const b = await readJson(request, 5000)
    const add = await friendsOnly(Array.isArray(b.add) ? b.add : [])
    const have = new Set((await chatMembers(c.id)).map((u) => u.id))
    const fresh = add.filter((u) => !have.has(u.id))
    if (have.size + fresh.length > GROUP_MAX) fail(400, 'too_many_members')
    const now = Date.now()
    if (fresh.length) {
      await db.batch(fresh.map((u) => db.prepare('INSERT OR IGNORE INTO blank_chat_members (chat_id, user_id, joined, read_at) VALUES (?, ?, ?, ?)').bind(c.id, u.id, now, 0)))
      await addMessage(c.id, 'system', `added:${fresh.map((u) => u.username).join(',')}`)
    }
    return json({ ok: true })
  }
  if ((m = path.match(/^\/social\/chats\/([0-9a-f]{20})\/leave$/)) && method === 'POST') {
    const c = await member(m[1])
    if (c.kind !== 'group') fail(400, 'dm')
    await addMessage(c.id, 'system', 'left')
    await db.prepare('DELETE FROM blank_chat_members WHERE chat_id = ? AND user_id = ?').bind(c.id, uid).run()
    // The last one out: the group and its messages go
    const left = await db.prepare('SELECT COUNT(*) AS n FROM blank_chat_members WHERE chat_id = ?').bind(c.id).first()
    if (!left?.n) {
      const photos = (await db.prepare('SELECT id FROM blank_messages WHERE chat_id = ? AND photo = 1').bind(c.id).all()).results || []
      if (photos.length && env.PHOTOS) ctx.waitUntil(env.PHOTOS.delete(photos.map((x) => `m/${x.id}`)).catch((e) => console.error(e)))
      await db.batch([
        db.prepare('DELETE FROM blank_message_reactions WHERE message_id IN (SELECT id FROM blank_messages WHERE chat_id = ?)').bind(c.id),
        db.prepare('DELETE FROM blank_message_reports WHERE message_id IN (SELECT id FROM blank_messages WHERE chat_id = ?)').bind(c.id),
        db.prepare('DELETE FROM blank_messages WHERE chat_id = ?').bind(c.id),
        db.prepare('DELETE FROM blank_chats WHERE id = ?').bind(c.id),
      ])
    }
    return json({ ok: true })
  }
  if ((m = path.match(/^\/social\/messages\/([0-9a-f]{20})\/report$/)) && method === 'POST') {
    notBanned()
    const x = await db.prepare(`${MESSAGE_SELECT} WHERE x.id = ?`).bind(m[1]).first()
    if (!x) fail(404, 'not_found')
    await member(x.chat_id)
    if (x.user_id === uid) fail(400, 'self')
    const b = await readJson(request, 1000)
    const reason = REASONS.includes(b.reason) ? b.reason : 'other'
    if ((await count(db, 'report', uid)) >= REPORTS_PER_DAY) fail(429, 'too_many')
    const added = await db.prepare('INSERT OR IGNORE INTO blank_message_reports (message_id, reporter, reason, created) VALUES (?, ?, ?, ?)').bind(x.id, uid, reason, Date.now()).run()
    await note(db, 'report', uid)
    if (added?.meta?.changes) {
      const n = await db.prepare('SELECT COUNT(*) AS n FROM blank_message_reports WHERE message_id = ?').bind(x.id).first()
      if (n?.n === 1) alert('message', { u: x.username, reason, text: x.text })
    }
    return json({ ok: true })
  }

  // ---------- admin ----------
  if (path === '/social/admin' && method === 'GET') {
    if (!me.admin) fail(403, 'admin')
    const r = await db
      .prepare(
        `${POST_SELECT} WHERE p.status = 'review' OR EXISTS (SELECT 1 FROM blank_reports r WHERE r.post_id = p.id AND r.resolved = 0)
         ORDER BY p.created DESC LIMIT 100`,
      )
      .bind(uid)
      .all()
    const posts = []
    for (const p of r.results || []) {
      const reasons = await db.prepare('SELECT reason, COUNT(*) AS n FROM blank_reports WHERE post_id = ? AND resolved = 0 GROUP BY reason').bind(p.id).all()
      posts.push({ ...shape(p), reports: Object.fromEntries((reasons.results || []).map((x) => [x.reason, x.n])) })
    }
    const ur = await db
      .prepare(
        `SELECT u.id, u.username, u.name, u.bio, u.avatar, u.founder, r.reason, COUNT(*) AS n FROM blank_user_reports r JOIN blank_users u ON u.id = r.user_id
         WHERE r.resolved = 0 AND u.banned = 0 GROUP BY u.id, r.reason ORDER BY MAX(r.created) DESC LIMIT 300`,
      )
      .all()
    const users = new Map()
    for (const x of ur.results || []) {
      if (!users.has(x.id)) users.set(x.id, { ...pub(x), reports: {} })
      users.get(x.id).reports[x.reason] = x.n
    }
    // Numbers for the admin's stats box. Reads every account once, so it only runs on this page.
    const now = Date.now()
    const stats = await db
      .prepare(
        `SELECT
           (SELECT COUNT(*) FROM blank_users) AS accounts,
           (SELECT COUNT(*) FROM blank_users WHERE created > ?1) AS accountsToday,
           (SELECT COUNT(*) FROM blank_users WHERE created > ?2) AS accountsWeek,
           (SELECT COUNT(*) FROM blank_users WHERE updated > ?2) AS activeWeek,
           (SELECT COUNT(*) FROM blank_posts WHERE status = 'ok') AS posts,
           (SELECT COUNT(*) FROM blank_posts WHERE status = 'ok' AND created > ?2) AS postsWeek,
           (SELECT COALESCE(SUM(json_array_length(data, '$.projects')), 0) FROM blank_users WHERE json_valid(data)) AS projects,
           (SELECT COUNT(*) FROM (SELECT data FROM blank_users WHERE json_valid(data)) u, json_each(u.data, '$.projects') p
              WHERE json_extract(p.value, '$.status') = 'done') AS finished,
           (SELECT COUNT(*) FROM blank_spark_starts) AS sparkStarts`,
      )
      .bind(now - 864e5, now - 7 * 864e5)
      .first()
    // The last 7 days, one row each: how many opened Blank (and where from), made an account, started a project
    const since = new Date(now - 6 * 864e5).toISOString().slice(0, 10)
    const sinceMs = Date.parse(since)
    const [visits, signups, starts] = await db.batch([
      db.prepare('SELECT day, source, visitors, new_visitors FROM blank_visits WHERE day >= ?').bind(since),
      db.prepare("SELECT strftime('%Y-%m-%d', created / 1000, 'unixepoch') AS day, COUNT(*) AS n FROM blank_users WHERE created >= ? GROUP BY day").bind(sinceMs),
      db
        .prepare(
          `SELECT strftime('%Y-%m-%d', json_extract(p.value, '$.createdAt') / 1000, 'unixepoch') AS day, COUNT(*) AS n
           FROM (SELECT data FROM blank_users WHERE json_valid(data)) u, json_each(u.data, '$.projects') p
           WHERE json_extract(p.value, '$.createdAt') >= ? GROUP BY day`,
        )
        .bind(sinceMs),
    ])
    const days = Array.from({ length: 7 }, (_, i) => ({ day: new Date(now - (6 - i) * 864e5).toISOString().slice(0, 10), visitors: 0, newVisitors: 0, accounts: 0, projects: 0, sources: {} }))
    const dayOf = (d) => days.find((x) => x.day === d)
    for (const v of visits.results || []) {
      const d = dayOf(v.day)
      if (!d) continue
      d.visitors += v.visitors
      d.newVisitors += v.new_visitors
      if (v.new_visitors) d.sources[v.source] = v.new_visitors
    }
    for (const r of signups.results || []) if (dayOf(r.day)) dayOf(r.day).accounts = r.n
    for (const r of starts.results || []) if (dayOf(r.day)) dayOf(r.day).projects = r.n
    stats.days = days
    const mr = await db
      .prepare(
        `SELECT x.*, u.username, u.name, u.avatar, GROUP_CONCAT(DISTINCT r.reason) AS reasons, COUNT(*) AS n FROM blank_message_reports r
         JOIN blank_messages x ON x.id = r.message_id JOIN blank_users u ON u.id = x.user_id
         WHERE r.resolved = 0 GROUP BY x.id ORDER BY MAX(r.created) DESC LIMIT 100`,
      )
      .all()
    const messages = (mr.results || []).map((x) => ({ ...shapeMessage(x), text: x.text, photo: !!x.photo, reasons: (x.reasons || '').split(','), reports: x.n }))
    // First posts of the last week that you haven't cheered yet: nobody's first post should go unanswered
    const fp = await db
      .prepare(
        `${POST_SELECT} WHERE p.status = 'ok' AND p.created > ?2 AND p.user_id != ?1 AND u.banned = 0
           AND NOT EXISTS (SELECT 1 FROM blank_posts q WHERE q.user_id = p.user_id AND q.status = 'ok' AND (q.created < p.created OR (q.created = p.created AND q.rowid < p.rowid)))
           AND NOT EXISTS (SELECT 1 FROM blank_likes l WHERE l.post_id = p.id AND l.user_id = ?1)
         ORDER BY p.created DESC LIMIT 30`,
      )
      .bind(uid, now - 7 * 864e5)
      .all()
    const cr = await db
      .prepare(
        `SELECT c.*, u.username, u.name, u.avatar, u.founder, GROUP_CONCAT(DISTINCT r.reason) AS reasons, COUNT(*) AS n FROM blank_comment_reports r
         JOIN blank_comments c ON c.id = r.comment_id JOIN blank_users u ON u.id = c.user_id
         WHERE r.resolved = 0 GROUP BY c.id ORDER BY MAX(r.created) DESC LIMIT 100`,
      )
      .all()
    const comments = (cr.results || []).map((c) => ({ ...shapeComment(c, {}, uid), status: c.status, reasons: (c.reasons || '').split(','), reports: c.n }))
    return json({ posts, users: [...users.values()], messages, comments, stats, firstPosts: (fp.results || []).map(shape) })
  }
  if ((m = path.match(/^\/social\/admin\/users\/([a-z0-9._]{3,24})$/)) && method === 'POST') {
    if (!me.admin) fail(403, 'admin')
    const b = await readJson(request, 1000)
    const u = await userByName(m[1])
    const resolve = db.prepare('UPDATE blank_user_reports SET resolved = 1 WHERE user_id = ?').bind(u.id)
    if (b.action === 'dismiss') await resolve.run()
    else if (b.action === 'clear') {
      await db.batch([db.prepare("UPDATE blank_users SET name = '', bio = '', avatar = 0, name_key = '' WHERE id = ?").bind(u.id), resolve])
      if (env.PHOTOS) await env.PHOTOS.delete(`a/${u.id}`)
    } else if (b.action === 'ban') await ban(db, u.id)
    else fail(400, 'action')
    return json({ ok: true })
  }
  if ((m = path.match(/^\/social\/admin\/comments\/([0-9a-f]{20})$/)) && method === 'POST') {
    if (!me.admin) fail(403, 'admin')
    const b = await readJson(request, 1000)
    const c = await db.prepare('SELECT * FROM blank_comments WHERE id = ?').bind(m[1]).first()
    if (!c) fail(404, 'not_found')
    const resolve = db.prepare('UPDATE blank_comment_reports SET resolved = 1 WHERE comment_id = ?').bind(c.id)
    if (b.action === 'dismiss') await db.batch([db.prepare("UPDATE blank_comments SET status = 'ok' WHERE id = ?").bind(c.id), resolve])
    else if (b.action === 'remove') await db.batch([db.prepare("UPDATE blank_comments SET status = 'removed' WHERE id = ?").bind(c.id), resolve])
    else if (b.action === 'ban') {
      await db.batch([db.prepare("UPDATE blank_comments SET status = 'removed' WHERE id = ?").bind(c.id), resolve])
      await ban(db, c.user_id)
    } else fail(400, 'action')
    return json({ ok: true })
  }
  if ((m = path.match(/^\/social\/admin\/messages\/([0-9a-f]{20})$/)) && method === 'POST') {
    if (!me.admin) fail(403, 'admin')
    const b = await readJson(request, 1000)
    const x = await db.prepare('SELECT * FROM blank_messages WHERE id = ?').bind(m[1]).first()
    if (!x) fail(404, 'not_found')
    const resolve = db.prepare('UPDATE blank_message_reports SET resolved = 1 WHERE message_id = ?').bind(x.id)
    if (b.action === 'dismiss') await resolve.run()
    else if (b.action === 'remove') await db.batch([db.prepare("UPDATE blank_messages SET status = 'removed' WHERE id = ?").bind(x.id), resolve])
    else if (b.action === 'ban') {
      await db.batch([db.prepare("UPDATE blank_messages SET status = 'removed' WHERE id = ?").bind(x.id), resolve])
      await ban(db, x.user_id)
    } else fail(400, 'action')
    return json({ ok: true })
  }
  if ((m = path.match(/^\/social\/admin\/posts\/([0-9a-f]{20})$/)) && method === 'POST') {
    if (!me.admin) fail(403, 'admin')
    const b = await readJson(request, 1000)
    const p = await db.prepare('SELECT user_id, photo, ratio, media FROM blank_posts WHERE id = ?').bind(m[1]).first()
    if (!p) fail(404, 'not_found')
    if (b.action === 'approve') {
      await db.batch([
        db.prepare("UPDATE blank_posts SET status = 'ok' WHERE id = ?").bind(m[1]),
        db.prepare('UPDATE blank_reports SET resolved = 1 WHERE post_id = ?').bind(m[1]),
      ])
    } else if (b.action === 'remove' || b.action === 'ban') {
      await removePost(db, env, m[1], p)
      if (b.action === 'ban') await ban(db, p.user_id)
    } else fail(400, 'action')
    return json({ ok: true })
  }

  fail(404, 'not_found')
}

// Gone for everyone else: their posts are hidden and open reports about them are closed. Only a hash of their email
// is kept (blank_banned_emails), so the same email can't sign up again even if they delete the account.
async function ban(db, userId) {
  const u = await db.prepare('SELECT email FROM blank_users WHERE id = ?').bind(userId).first()
  if (u?.email) await db.prepare('INSERT OR IGNORE INTO blank_banned_emails (hash, created) VALUES (?, ?)').bind(await sha256(`banned|${u.email}`), Date.now()).run()
  await db.batch([
    db.prepare('UPDATE blank_users SET banned = 1 WHERE id = ?').bind(userId),
    db.prepare("UPDATE blank_posts SET status = 'removed' WHERE user_id = ?").bind(userId),
    db.prepare('UPDATE blank_user_reports SET resolved = 1 WHERE user_id = ?').bind(userId),
  ])
}

async function removePost(db, env, id, p) {
  await db.batch([
    db.prepare('DELETE FROM blank_likes WHERE post_id = ?').bind(id),
    db.prepare('DELETE FROM blank_post_starts WHERE post_id = ?').bind(id),
    db.prepare('DELETE FROM blank_reports WHERE post_id = ?').bind(id),
    db.prepare('DELETE FROM blank_comment_reports WHERE comment_id IN (SELECT id FROM blank_comments WHERE post_id = ?)').bind(id),
    db.prepare('DELETE FROM blank_comments WHERE post_id = ?').bind(id),
    db.prepare('DELETE FROM blank_posts WHERE id = ?').bind(id),
  ])
  if (!env.PHOTOS) return
  const keys = mediaOf(p).map((_, n) => mediaKey(id, n))
  if (keys.length) await env.PHOTOS.delete(keys)
}
