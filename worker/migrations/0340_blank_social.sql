-- Blank goes social (worker/blank-social.js): profiles, friends, posts with a feed, likes, blocking and reports.
-- Photos of posts and profile pictures are in R2 (bucket blank-photos) under p/<post id> and a/<user id>.

ALTER TABLE blank_users ADD COLUMN name TEXT NOT NULL DEFAULT '';
ALTER TABLE blank_users ADD COLUMN bio TEXT NOT NULL DEFAULT '';
ALTER TABLE blank_users ADD COLUMN avatar INTEGER NOT NULL DEFAULT 0;      -- 1 = has a profile picture in R2
ALTER TABLE blank_users ADD COLUMN rules_at INTEGER;                       -- when they agreed to the rules (needed to post)
ALTER TABLE blank_users ADD COLUMN admin INTEGER NOT NULL DEFAULT 0;       -- sees reports, can remove posts and ban
ALTER TABLE blank_users ADD COLUMN banned INTEGER NOT NULL DEFAULT 0;      -- can't post or add friends anymore

-- One row per pair. requester asked, addressee accepts (status 'accepted') or declines (row deleted).
CREATE TABLE IF NOT EXISTS blank_friends (
  requester TEXT NOT NULL,
  addressee TEXT NOT NULL,
  status TEXT NOT NULL,                -- 'pending' or 'accepted'
  created INTEGER NOT NULL,
  PRIMARY KEY (requester, addressee)
);
CREATE INDEX IF NOT EXISTS blank_friends_addressee ON blank_friends (addressee, status);

CREATE TABLE IF NOT EXISTS blank_posts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  kind TEXT NOT NULL,                  -- 'update' or 'finish'
  project TEXT NOT NULL DEFAULT '',    -- the project's title
  category TEXT NOT NULL DEFAULT 'other',
  text TEXT NOT NULL DEFAULT '',
  photo INTEGER NOT NULL DEFAULT 0,    -- 1 = has a photo in R2
  ratio REAL,                          -- photo height / width
  visibility TEXT NOT NULL,            -- 'friends' or 'public'
  status TEXT NOT NULL,                -- 'ok', 'review' (waiting for the admin) or 'removed'
  created INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS blank_posts_user ON blank_posts (user_id, created);
CREATE INDEX IF NOT EXISTS blank_posts_public ON blank_posts (visibility, status, created);

CREATE TABLE IF NOT EXISTS blank_likes (
  post_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created INTEGER NOT NULL,
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS blank_blocks (
  blocker TEXT NOT NULL,
  blocked TEXT NOT NULL,
  created INTEGER NOT NULL,
  PRIMARY KEY (blocker, blocked)
);
CREATE INDEX IF NOT EXISTS blank_blocks_blocked ON blank_blocks (blocked);

CREATE TABLE IF NOT EXISTS blank_reports (
  post_id TEXT NOT NULL,
  reporter TEXT NOT NULL,
  reason TEXT NOT NULL,
  created INTEGER NOT NULL,
  resolved INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (post_id, reporter)
);
CREATE INDEX IF NOT EXISTS blank_reports_open ON blank_reports (resolved, created);
