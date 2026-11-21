-- Blank journeys (worker/blank-social.js).
-- made_from: a "finished" post made by following someone else's post; it shows under that post, and its author sees
-- "X people made this because of you". comments_off: the author turned comments off for this post.
ALTER TABLE blank_posts ADD COLUMN made_from TEXT;
ALTER TABLE blank_posts ADD COLUMN comments_off INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS blank_posts_made_from ON blank_posts (made_from);

-- Comments under posts. Anyone with an account who can see the post can comment (unless it's turned off).
CREATE TABLE IF NOT EXISTS blank_comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ok', -- 'ok' or 'removed' (by the admin, or hidden after reports)
  created INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS blank_comments_post ON blank_comments (post_id, created);
CREATE INDEX IF NOT EXISTS blank_comments_user ON blank_comments (user_id);

CREATE TABLE IF NOT EXISTS blank_comment_reports (
  comment_id TEXT NOT NULL,
  reporter TEXT NOT NULL,
  reason TEXT NOT NULL,
  created INTEGER NOT NULL,
  resolved INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (comment_id, reporter)
);
