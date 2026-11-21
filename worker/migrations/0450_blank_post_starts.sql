-- "Started because of you", in public: someone started a project from a post ("Start this project" on the post,
-- hobby-app/src/components/Social.jsx). Everyone sees the count on the post and the author's total on their profile
-- (worker/blank-social.js). Each person (account) or phone counts once per post; the author's own starts don't count.
CREATE TABLE IF NOT EXISTS blank_post_starts (
  post_id TEXT NOT NULL,
  starter TEXT NOT NULL,               -- SHA-256 of the starter's account id or random device id, with the post id
  ip_hash TEXT NOT NULL,               -- to cap starts per network and day
  created INTEGER NOT NULL,
  PRIMARY KEY (post_id, starter)
);
CREATE INDEX IF NOT EXISTS blank_post_starts_ip ON blank_post_starts (ip_hash, created);
