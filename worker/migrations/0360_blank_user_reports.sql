-- Reports about a profile (name, bio or picture), not a post (worker/blank-social.js). Same shape as blank_reports.
CREATE TABLE IF NOT EXISTS blank_user_reports (
  user_id TEXT NOT NULL,               -- the profile that was reported
  reporter TEXT NOT NULL,
  reason TEXT NOT NULL,
  created INTEGER NOT NULL,
  resolved INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, reporter)
);
CREATE INDEX IF NOT EXISTS blank_user_reports_open ON blank_user_reports (resolved, created);

