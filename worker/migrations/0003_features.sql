-- Captions, the daily question, voice bios, group chats, notifications and passkeys

ALTER TABLE posts ADD COLUMN transcript TEXT;
-- The day (YYYY-MM-DD) whose daily question this post answers
ALTER TABLE posts ADD COLUMN prompt TEXT;
CREATE INDEX posts_prompt ON posts (prompt, created);

ALTER TABLE messages ADD COLUMN transcript TEXT;
-- Set for messages in a group chat (dst is then the group id too)
ALTER TABLE messages ADD COLUMN group_id TEXT;
CREATE INDEX messages_group ON messages (group_id, created);

ALTER TABLE users ADD COLUMN bio_audio BLOB;
ALTER TABLE users ADD COLUMN bio_url TEXT;
ALTER TABLE users ADD COLUMN bio_mime TEXT;
ALTER TABLE users ADD COLUMN bio_duration REAL;
ALTER TABLE users ADD COLUMN bio_wave TEXT;
ALTER TABLE users ADD COLUMN bio_fx TEXT;
ALTER TABLE users ADD COLUMN bio_transcript TEXT;
ALTER TABLE users ADD COLUMN bio_at INTEGER;

CREATE TABLE chat_groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created INTEGER NOT NULL
);
-- last_heard: everything in the group up to this time counts as heard by this member
CREATE TABLE group_members (
  group_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  last_heard INTEGER NOT NULL DEFAULT 0,
  joined INTEGER NOT NULL,
  PRIMARY KEY (group_id, user_id)
);
CREATE INDEX group_members_user ON group_members (user_id);

-- Web Push subscriptions, one per browser
CREATE TABLE push_subs (
  endpoint TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created INTEGER NOT NULL
);
CREATE INDEX push_subs_user ON push_subs (user_id);

-- Extra login keys, one per signed-in device (a passkey sign-in makes a new one)
CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created INTEGER NOT NULL
);
CREATE INDEX sessions_user ON sessions (user_id);

CREATE TABLE passkeys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  public_key TEXT NOT NULL,
  alg INTEGER NOT NULL,
  created INTEGER NOT NULL
);
CREATE INDEX passkeys_user ON passkeys (user_id);

CREATE TABLE challenges (
  id TEXT PRIMARY KEY,
  challenge TEXT NOT NULL,
  expires INTEGER NOT NULL
);
