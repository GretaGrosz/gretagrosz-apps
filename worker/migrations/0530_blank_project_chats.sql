-- Doing a plan together (worker/blank-social.js, chats of kind 'project'): one chat per shared plan, with the plan
-- pinned on top, each person's own progress, a shared shopping list and planned sessions. Friend chats ('dm') stay
-- as they are. All of it is plain D1 rows, inside the free tier; nothing real-time.

-- The plan ({ title, category, guide, steps, lang }), the two friends (sorted ids: at most 3 active per pair),
-- and when both finished (then it moves to the Archive)
ALTER TABLE blank_chats ADD COLUMN plan TEXT;
ALTER TABLE blank_chats ADD COLUMN pair_key TEXT;
ALTER TABLE blank_chats ADD COLUMN archived_at INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS blank_chats_pair ON blank_chats (pair_key, archived_at);

-- Each person in a project chat: joined the plan yet, steps done of total, last progress, last poke sent, finished
ALTER TABLE blank_chat_members ADD COLUMN joined_plan INTEGER NOT NULL DEFAULT 0;
ALTER TABLE blank_chat_members ADD COLUMN done_steps INTEGER NOT NULL DEFAULT 0;
ALTER TABLE blank_chat_members ADD COLUMN total_steps INTEGER NOT NULL DEFAULT 0;
ALTER TABLE blank_chat_members ADD COLUMN progress_at INTEGER NOT NULL DEFAULT 0;
ALTER TABLE blank_chat_members ADD COLUMN poked_at INTEGER NOT NULL DEFAULT 0;
ALTER TABLE blank_chat_members ADD COLUMN finished_at INTEGER NOT NULL DEFAULT 0;

-- The shopping list: the plan's materials (and anything added), each claimable ("I'll buy the yarn") and tickable
CREATE TABLE IF NOT EXISTS blank_chat_items (
  chat_id TEXT NOT NULL,
  id TEXT NOT NULL,
  text TEXT NOT NULL,
  claimed_by TEXT,                     -- a user id, or null
  bought INTEGER NOT NULL DEFAULT 0,
  created INTEGER NOT NULL,
  PRIMARY KEY (chat_id, id)
);

-- Planned sessions: when and where; everyone in the chat gets a reminder 30 minutes before (cron, blank-together.js)
CREATE TABLE IF NOT EXISTS blank_chat_sessions (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL,
  at INTEGER NOT NULL,
  place TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL,
  created INTEGER NOT NULL,
  reminded INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS blank_chat_sessions_chat ON blank_chat_sessions (chat_id, at);
CREATE INDEX IF NOT EXISTS blank_chat_sessions_due ON blank_chat_sessions (reminded, at);
