-- Blank: an optional email per account, only used to send a password-reset link (worker/blank-account.js).
ALTER TABLE blank_users ADD COLUMN email TEXT;
CREATE INDEX IF NOT EXISTS blank_users_email ON blank_users (email);

-- Reset links: only the SHA-256 of the token is kept; a link works once, for one hour.
CREATE TABLE IF NOT EXISTS blank_resets (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created INTEGER NOT NULL,
  used INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS blank_resets_user ON blank_resets (user_id, created);
