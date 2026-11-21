// Blank, doing a plan together: the reminder for a planned session (blank_chat_sessions, migration 0530). The cron
// (index.js, every 5 minutes) tells everyone in the project chat 30 minutes before, once. Web Push and cron triggers
// are free; this is one small query per run and one update per reminder sent.
import { notifyUser } from './blank-notify.js'

const BEFORE = 30 * 60_000

export async function sendSessionReminders(env, now = Date.now()) {
  if (!env.DB) return 0
  const db = env.DB
  const due =
    (await db
      .prepare(
        `SELECT s.id, s.chat_id, s.at, s.place, c.name FROM blank_chat_sessions s JOIN blank_chats c ON c.id = s.chat_id
         WHERE s.reminded = 0 AND s.at <= ? AND s.at > ? ORDER BY s.at LIMIT 50`,
      )
      .bind(now + BEFORE, now - BEFORE)
      .all()).results || []
  let sent = 0
  for (const x of due) {
    await db.prepare('UPDATE blank_chat_sessions SET reminded = 1 WHERE id = ?').bind(x.id).run()
    const members = (await db.prepare('SELECT user_id FROM blank_chat_members WHERE chat_id = ?').bind(x.chat_id).all()).results || []
    for (const m of members) {
      try {
        await notifyUser(env, db, m.user_id, 'session', { project: x.name, place: x.place }, { url: `#/chats/${x.chat_id}` })
        sent++
      } catch (e) {
        console.error('blank session reminder', e)
      }
    }
  }
  return sent
}
