-- Blank (/blank/) accounts: log in with a username and password, and your projects follow you to any device
-- (worker/blank-account.js). Photos are in R2 (bucket blank-photos), not here.
-- Lives in the yap database like the other blank_ tables.

CREATE TABLE IF NOT EXISTS blank_users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,       -- lowercase, a-z 0-9 . _
  pass_hash TEXT NOT NULL,             -- PBKDF2-SHA256, hex
  pass_salt TEXT NOT NULL,             -- hex
  pass_iter INTEGER NOT NULL,
  data TEXT,                           -- the app's data (store.jsx) as JSON, NULL until the first save
  rev INTEGER NOT NULL DEFAULT 0,      -- goes up by one on every save, so two devices can't overwrite each other blindly
  updated INTEGER NOT NULL,
  created INTEGER NOT NULL
);

-- One row per logged-in device. Only the SHA-256 of the token is kept.
CREATE TABLE IF NOT EXISTS blank_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created INTEGER NOT NULL,
  seen INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS blank_sessions_user ON blank_sessions (user_id);

-- Wrong passwords and new accounts, to slow down guessing (kept one day)
CREATE TABLE IF NOT EXISTS blank_auth_events (
  kind TEXT NOT NULL,                  -- 'fail', 'signup' or 'photo'
  who TEXT NOT NULL,                   -- the username, or 'ip:<hash>'
  created INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS blank_auth_events_who ON blank_auth_events (kind, who, created);
