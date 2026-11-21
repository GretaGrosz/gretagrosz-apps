-- Blank: sign in with a passkey (Face ID, fingerprint or the phone's screen lock) instead of a password
-- (worker/blank-account.js, checked with WebCrypto in worker/passkeys.js). Nothing here can cost money.

-- One row per passkey. Only the public key is stored; the private key never leaves the phone.
CREATE TABLE IF NOT EXISTS blank_passkeys (
  id TEXT PRIMARY KEY,                 -- the credential id, base64url
  user_id TEXT NOT NULL,               -- blank_users.id
  public_key TEXT NOT NULL,            -- SPKI, base64url
  alg INTEGER NOT NULL,                -- -7 (ES256) or -257 (RS256)
  counter INTEGER NOT NULL DEFAULT 0,  -- the authenticator's signature counter (0 for most passkeys that sync)
  transports TEXT,                     -- JSON list the browser reported, e.g. ["internal","hybrid"]
  created INTEGER NOT NULL,
  used INTEGER                         -- last sign-in
);
CREATE INDEX IF NOT EXISTS blank_passkeys_user ON blank_passkeys (user_id);

-- Challenges for one passkey ceremony: five minutes, deleted when used.
-- kind: 'new' (a new account; username and the account id it will get), 'add' (a passkey for user_id) or 'login'
CREATE TABLE IF NOT EXISTS blank_passkey_challenges (
  id TEXT PRIMARY KEY,
  challenge TEXT NOT NULL,             -- base64url
  kind TEXT NOT NULL,
  username TEXT,
  user_id TEXT,
  ip TEXT NOT NULL,                    -- 'ip:<hash>', to limit how many one network can have open
  expires INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS blank_passkey_challenges_ip ON blank_passkey_challenges (ip, expires);
CREATE INDEX IF NOT EXISTS blank_passkey_challenges_expires ON blank_passkey_challenges (expires);

-- 0 for accounts made with a passkey only: their pass_hash is random and can't be logged into.
-- They can set a password later (POST /account/password without the current one).
ALTER TABLE blank_users ADD COLUMN has_password INTEGER NOT NULL DEFAULT 1;
