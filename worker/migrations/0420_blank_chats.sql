-- Blank chats (worker/blank-social.js): one-to-one messages between friends, and group chats ("hobby crews")
-- of friends who keep each other going. A message is text, or a check-in: "I worked on <project> today".

CREATE TABLE IF NOT EXISTS blank_chats (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,                  -- 'dm' or 'group'
  name TEXT NOT NULL DEFAULT '',       -- groups only
  hobby TEXT,                          -- groups only: a category from hobby-app/src/data.js, or null
  dm_key TEXT UNIQUE,                  -- dms only: the two user ids, sorted, so a pair has one chat
  created_by TEXT NOT NULL,
  created INTEGER NOT NULL,
  last_at INTEGER NOT NULL             -- the newest message (or created), for sorting the list
);

CREATE TABLE IF NOT EXISTS blank_chat_members (
  chat_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  joined INTEGER NOT NULL,
  read_at INTEGER NOT NULL DEFAULT 0,  -- messages after this are unread
  PRIMARY KEY (chat_id, user_id)
);
CREATE INDEX IF NOT EXISTS blank_chat_members_user ON blank_chat_members (user_id);

CREATE TABLE IF NOT EXISTS blank_messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'text',   -- 'text', 'checkin' or 'system' (someone joined or left)
  text TEXT NOT NULL DEFAULT '',
  project TEXT NOT NULL DEFAULT '',    -- check-ins: the project's title
  category TEXT,                       -- check-ins: the project's category
  status TEXT NOT NULL DEFAULT 'ok',   -- 'ok' or 'removed'
  created INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS blank_messages_chat ON blank_messages (chat_id, created);

CREATE TABLE IF NOT EXISTS blank_message_reports (
  message_id TEXT NOT NULL,
  reporter TEXT NOT NULL,
  reason TEXT NOT NULL,
  created INTEGER NOT NULL,
  resolved INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (message_id, reporter)
);
