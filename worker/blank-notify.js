// Blank: telling people when something happened to them (the feedback that makes people post again: being answered).
// Someone liked your post, started a project because of it, asked to be your friend, accepted, or wrote in your chat.
// Sent with Web Push to every device the account turned notifications on for (table blank_user_push, migration 0490).
// Free: Web Push costs nothing. Repeats are bundled: one "likes" notification per post an hour, one per chat in 5 minutes.
import { encrypt, pushEndpointOk, vapidAuth } from './push.js'

const TEXT = {
  like: {
    en: (v) => [`${v.name} likes your post`, v.project],
    de: (v) => [`${v.name} gefällt dein Post`, v.project],
    hu: (v) => [`${v.name} kedveli a bejegyzésedet`, v.project],
  },
  start: {
    en: (v) => [v.name ? `${v.name} started a project because of you` : 'Someone started a project because of you', v.project],
    de: (v) => [v.name ? `${v.name} hat wegen dir ein Projekt angefangen` : 'Jemand hat wegen dir ein Projekt angefangen', v.project],
    hu: (v) => [v.name ? `${v.name} miattad kezdett bele egy projektbe` : 'Valaki miattad kezdett bele egy projektbe', v.project],
  },
  friend_request: {
    en: (v) => [`${v.name} wants to be friends`, 'Open Blank to accept.'],
    de: (v) => [`${v.name} möchte mit dir befreundet sein`, 'Öffne Blank, um anzunehmen.'],
    hu: (v) => [`${v.name} jelölt ismerősnek`, 'Nyisd meg a Blanket az elfogadáshoz.'],
  },
  friend_accept: {
    en: (v) => [`${v.name} is your friend now`, 'You can see each other’s posts.'],
    de: (v) => [`${v.name} ist jetzt dein Freund`, 'Ihr seht jetzt eure Posts.'],
    hu: (v) => [`${v.name} mostantól a barátod`, 'Látjátok egymás bejegyzéseit.'],
  },
  made: {
    en: (v) => [v.name ? `${v.name} made it because of you` : 'Someone made it because of you', v.project],
    de: (v) => [v.name ? `${v.name} hat es wegen dir gemacht` : 'Jemand hat es wegen dir gemacht', v.project],
    hu: (v) => [v.name ? `${v.name} miattad elkészítette` : 'Valaki miattad elkészítette', v.project],
  },
  comment: {
    en: (v) => [`${v.name} commented on your post`, v.text],
    de: (v) => [`${v.name} hat deinen Post kommentiert`, v.text],
    hu: (v) => [`${v.name} hozzászólt a bejegyzésedhez`, v.text],
  },
  message_request: {
    en: (v) => [`${v.name} sent you a message request`, 'Open Blank to read it. You decide if they can write to you.'],
    de: (v) => [`${v.name} hat dir eine Nachrichtenanfrage geschickt`, 'Öffne Blank, um sie zu lesen. Du entscheidest, ob sie dir schreiben dürfen.'],
    hu: (v) => [`${v.name} üzenetkérést küldött`, 'Nyisd meg a Blanket az olvasáshoz. Te döntöd el, írhat-e neked.'],
  },
  // Doing a plan together (project chats)
  together: {
    en: (v) => [`${v.name} wants to do this with you`, v.project],
    de: (v) => [`${v.name} will das mit dir machen`, v.project],
    hu: (v) => [`${v.name} veled akarja csinálni`, v.project],
  },
  poke: {
    en: (v) => [`${v.name}: you coming? 👉`, v.project],
    de: (v) => [`${v.name}: kommst du? 👉`, v.project],
    hu: (v) => [`${v.name}: jössz? 👉`, v.project],
  },
  session: {
    en: (v) => [`${v.project} in 30 minutes`, v.place || 'Your planned session together'],
    de: (v) => [`${v.project} in 30 Minuten`, v.place || 'Eure geplante gemeinsame Zeit'],
    hu: (v) => [`${v.project} 30 perc múlva`, v.place || 'A közösen megbeszélt időpont'],
  },
  photo: {
    en: (v) => [v.chat ? `${v.name} in ${v.chat}` : v.name, 'Sent a photo'],
    de: (v) => [v.chat ? `${v.name} in ${v.chat}` : v.name, 'Hat ein Foto geschickt'],
    hu: (v) => [v.chat ? `${v.name} itt: ${v.chat}` : v.name, 'Fotót küldött'],
  },
  message: {
    en: (v) => [v.chat ? `${v.name} in ${v.chat}` : v.name, v.text],
    de: (v) => [v.chat ? `${v.name} in ${v.chat}` : v.name, v.text],
    hu: (v) => [v.chat ? `${v.name} itt: ${v.chat}` : v.name, v.text],
  },
}

// Saves this device for the logged-in user (one device can only belong to one account at a time)
export async function savePush(db, userId, b) {
  const k = b.keys || {}
  if (!pushEndpointOk(b.endpoint) || typeof k.p256dh !== 'string' || typeof k.auth !== 'string' || k.p256dh.length > 200 || k.auth.length > 100) return false
  const lang = b.lang === 'de' || b.lang === 'hu' ? b.lang : 'en'
  await db.batch([
    db
      .prepare(
        `INSERT INTO blank_user_push (endpoint, user_id, p256dh, auth, lang, created) VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT (endpoint) DO UPDATE SET user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth, lang = excluded.lang, created = excluded.created`,
      )
      .bind(b.endpoint, userId, k.p256dh, k.auth, lang, Date.now()),
    // At most 6 devices per account: the oldest go
    db.prepare('DELETE FROM blank_user_push WHERE user_id = ?1 AND endpoint NOT IN (SELECT endpoint FROM blank_user_push WHERE user_id = ?1 ORDER BY created DESC LIMIT 6)').bind(userId),
  ])
  return true
}

// kind: a key of TEXT. vars: { name, project, text, chat }. once: a key and a gap in ms, so repeats are bundled.
export async function notifyUser(env, db, userId, kind, vars, { url = '', once = null } = {}) {
  if (!env.VAPID_PRIVATE || !userId) return 0
  if (once) {
    const who = `${userId}|${once.key}`
    const seen = await db.prepare("SELECT 1 FROM blank_auth_events WHERE kind = 'notify' AND who = ? AND created > ?").bind(who, Date.now() - once.gap).first()
    if (seen) return 0
    await db.prepare("INSERT INTO blank_auth_events (kind, who, created) VALUES ('notify', ?, ?)").bind(who, Date.now()).run()
  }
  const { results } = await db.prepare('SELECT endpoint, p256dh, auth, lang FROM blank_user_push WHERE user_id = ?').bind(userId).all()
  let sent = 0
  for (const s of results || []) {
    try {
      const [title, body] = (TEXT[kind][s.lang] || TEXT[kind].en)(vars)
      const res = await fetch(s.endpoint, {
        method: 'POST',
        headers: { authorization: await vapidAuth(env, s.endpoint), 'content-encoding': 'aes128gcm', 'content-type': 'application/octet-stream', ttl: '86400', urgency: 'normal' },
        body: await encrypt(s, JSON.stringify({ title, body: String(body || '').slice(0, 140), tag: `blank-${kind}-${once?.key || ''}`, url })),
      })
      if (res.status === 404 || res.status === 410) await db.prepare('DELETE FROM blank_user_push WHERE endpoint = ?').bind(s.endpoint).run()
      else if (res.ok) sent++
    } catch (e) {
      console.error('blank notify', e)
    }
  }
  return sent
}
