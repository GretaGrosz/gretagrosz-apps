-- BW Buddy (/bwbuddy/) accounts: a username and a password (or a passkey), so a student's progress follows them to
-- another phone or computer and survives Safari clearing its storage (worker/bwbuddy-account.js).
-- No email and no real name: only the username. Lives in the yap database (binding DB) next to the other apps' tables.
-- Nothing here can cost money: D1 on the Workers Free plan stops at its free daily limit instead of billing.

CREATE TABLE IF NOT EXISTS bwbuddy_users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,       -- lowercase, a-z 0-9 . _ -, 3 to 20 characters
  pass_hash TEXT NOT NULL,             -- PBKDF2-SHA256, hex (random and unusable for a passkey-only account)
  pass_salt TEXT NOT NULL,             -- hex
  pass_iter INTEGER NOT NULL,
  has_password INTEGER NOT NULL DEFAULT 1,
  recovery_hash TEXT,                  -- SHA-256 of the one-time recovery code shown at signup (resets the password)
  data TEXT,                           -- { progress, game } as JSON, NULL until the first save (at most 300 KB)
  data_hash TEXT,                      -- SHA-256 of data, so an unchanged save isn't written again
  rev INTEGER NOT NULL DEFAULT 0,      -- goes up by one on every save, so two devices can't overwrite each other blindly
  writes_day TEXT,                     -- YYYY-MM-DD (UTC) of writes_n
  writes_n INTEGER NOT NULL DEFAULT 0, -- saves that day (at most 300 a day per account)
  updated INTEGER NOT NULL,
  created INTEGER NOT NULL
);

-- One row per logged-in device. Only the SHA-256 of the token is kept.
CREATE TABLE IF NOT EXISTS bwbuddy_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created INTEGER NOT NULL,
  seen INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS bwbuddy_sessions_user ON bwbuddy_sessions (user_id);

-- Wrong passwords / recovery codes and new accounts, to slow down guessing (kept one day)
CREATE TABLE IF NOT EXISTS bwbuddy_auth_events (
  kind TEXT NOT NULL,                  -- 'fail' or 'signup'
  who TEXT NOT NULL,                   -- the username, or 'ip:<hash>'
  created INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS bwbuddy_auth_events_who ON bwbuddy_auth_events (kind, who, created);

-- Passkeys (Face ID, fingerprint, screen lock). Only the public key is stored.
CREATE TABLE IF NOT EXISTS bwbuddy_passkeys (
  id TEXT PRIMARY KEY,                 -- the credential id, base64url
  user_id TEXT NOT NULL,               -- bwbuddy_users.id
  public_key TEXT NOT NULL,            -- SPKI, base64url
  alg INTEGER NOT NULL,                -- -7 (ES256) or -257 (RS256)
  counter INTEGER NOT NULL DEFAULT 0,
  transports TEXT,
  created INTEGER NOT NULL,
  used INTEGER
);
CREATE INDEX IF NOT EXISTS bwbuddy_passkeys_user ON bwbuddy_passkeys (user_id);

-- Challenges for one passkey ceremony: five minutes, deleted when used.
-- kind: 'new' (a new account; username and the account id it will get), 'add' (a passkey for user_id) or 'login'
CREATE TABLE IF NOT EXISTS bwbuddy_passkey_challenges (
  id TEXT PRIMARY KEY,
  challenge TEXT NOT NULL,
  kind TEXT NOT NULL,
  username TEXT,
  user_id TEXT,
  ip TEXT NOT NULL,
  expires INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS bwbuddy_passkey_challenges_ip ON bwbuddy_passkey_challenges (ip, expires);
CREATE INDEX IF NOT EXISTS bwbuddy_passkey_challenges_expires ON bwbuddy_passkey_challenges (expires);
