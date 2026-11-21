-- Yap: who heard which yap, blocking and reporting, sessions that can be signed out,
-- passkey challenges bound to the account, one-time sign-in codes, invite links,
-- word timings for live transcripts, transcript search, per-user language, rate limits.

-- One row per listener per yap ("Heard by 3"), instead of a counter anyone can inflate
CREATE TABLE plays (
  post_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  at INTEGER NOT NULL,
  PRIMARY KEY (post_id, user_id)
);
CREATE INDEX plays_user ON plays (user_id, at);

-- src blocked dst: neither sees the other's yaps, messages or profile any more
CREATE TABLE blocks (
  src TEXT NOT NULL,
  dst TEXT NOT NULL,
  created INTEGER NOT NULL,
  PRIMARY KEY (src, dst)
);
CREATE INDEX blocks_dst ON blocks (dst);

-- kind: post | message | user. status: open | removed | dismissed
CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  reporter TEXT NOT NULL,
  kind TEXT NOT NULL,
  target_id TEXT NOT NULL,
  target_user TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created INTEGER NOT NULL
);
CREATE UNIQUE INDEX reports_once ON reports (reporter, kind, target_id);
CREATE INDEX reports_target ON reports (kind, target_id);
CREATE INDEX reports_status ON reports (status, created);

-- hidden = 1: removed by a moderator, or reported by three different people
ALTER TABLE posts ADD COLUMN hidden INTEGER NOT NULL DEFAULT 0;
ALTER TABLE messages ADD COLUMN hidden INTEGER NOT NULL DEFAULT 0;
-- Word timings from the captions: [[start, end, "word"], ...] in seconds
ALTER TABLE posts ADD COLUMN words TEXT;
ALTER TABLE messages ADD COLUMN words TEXT;
-- The id the phone gave a recording, so a retried upload is stored once
ALTER TABLE posts ADD COLUMN cid TEXT;
ALTER TABLE messages ADD COLUMN cid TEXT;
CREATE INDEX posts_cid ON posts (user_id, cid);
CREATE INDEX messages_cid ON messages (src, cid);

ALTER TABLE users ADD COLUMN lang TEXT NOT NULL DEFAULT 'en';
-- The code in this person's invite link (/yap/#join/<code>); opening it makes you friends
ALTER TABLE users ADD COLUMN invite TEXT;
CREATE UNIQUE INDEX users_invite ON users (invite);

-- Every device signs in with its own session now. The key made at sign-up becomes that device's session,
-- so signing out ends it on the server, and sessions unused for 90 days expire.
ALTER TABLE sessions ADD COLUMN last_used INTEGER;
INSERT OR IGNORE INTO sessions (token_hash, user_id, created, last_used)
  SELECT token_hash, id, created, unixepoch() * 1000 FROM users WHERE bot = 0 AND token_hash != '';
UPDATE users SET token_hash = '' WHERE bot = 0;
UPDATE sessions SET last_used = unixepoch() * 1000 WHERE last_used IS NULL;
-- Which session turned notifications on, so signing out of that device stops them there
ALTER TABLE push_subs ADD COLUMN session TEXT;

-- kind: login (passkey challenges; registration ones are bound to the account by their id, see passkeys.js)
-- or code (a one-time sign-in code: challenge = its hash, user_id = whose)
ALTER TABLE challenges ADD COLUMN user_id TEXT;
ALTER TABLE challenges ADD COLUMN kind TEXT NOT NULL DEFAULT 'login';

-- Sliding-window rate limits (k = what and who, at = when)
CREATE TABLE hits (
  k TEXT NOT NULL,
  at INTEGER NOT NULL
);
CREATE INDEX hits_k ON hits (k, at);

-- The demo voices liked each other; those likes were never real
DELETE FROM reactions WHERE user_id IN (SELECT id FROM users WHERE bot = 1);

-- Search over everything that was said (kind p = post, m = message; ref = its id)
CREATE VIRTUAL TABLE voice_fts USING fts5(transcript, kind UNINDEXED, ref UNINDEXED, tokenize = 'unicode61 remove_diacritics 2');
INSERT INTO voice_fts (transcript, kind, ref) SELECT transcript, 'p', id FROM posts WHERE transcript IS NOT NULL;
INSERT INTO voice_fts (transcript, kind, ref) SELECT transcript, 'm', id FROM messages WHERE transcript IS NOT NULL;
