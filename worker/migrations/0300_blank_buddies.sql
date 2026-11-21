-- Blank (/blank/): one real buddy per person, joined by an invite link (worker/blank.js).
-- Lives in the yap database so Blank needs no database of its own; every table is prefixed blank_.
-- No accounts: each phone holds a random key, the server only keeps its SHA-256.

CREATE TABLE IF NOT EXISTS blank_pairs (
  code TEXT PRIMARY KEY,               -- the invite code in the link (#/b/<code>)
  a_key TEXT NOT NULL,                 -- SHA-256 of the inviter's device key
  a_name TEXT NOT NULL,
  a_lang TEXT NOT NULL DEFAULT 'en',
  a_streak INTEGER NOT NULL DEFAULT 0,
  a_seen INTEGER NOT NULL,
  a_push TEXT,                         -- JSON push subscription { endpoint, p256dh, auth }
  a_pushed INTEGER NOT NULL DEFAULT 0, -- last push sent TO a (to batch quick check-ins)
  a_nudged INTEGER NOT NULL DEFAULT 0, -- last nudge sent BY a
  b_key TEXT,                          -- NULL until someone joins
  b_name TEXT,
  b_lang TEXT NOT NULL DEFAULT 'en',
  b_streak INTEGER NOT NULL DEFAULT 0,
  b_seen INTEGER,
  b_push TEXT,
  b_pushed INTEGER NOT NULL DEFAULT 0,
  b_nudged INTEGER NOT NULL DEFAULT 0,
  ip_hash TEXT NOT NULL,
  created INTEGER NOT NULL,
  joined INTEGER
);
CREATE INDEX IF NOT EXISTS blank_pairs_a ON blank_pairs (a_key);
CREATE INDEX IF NOT EXISTS blank_pairs_b ON blank_pairs (b_key);
CREATE INDEX IF NOT EXISTS blank_pairs_ip ON blank_pairs (ip_hash, created);

-- What each side did: shown to the other one (kept 30 days)
CREATE TABLE IF NOT EXISTS blank_checkins (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  side TEXT NOT NULL,                  -- 'a' or 'b'
  kind TEXT NOT NULL,                  -- step, photo, entry, session, finish, nudge
  project TEXT,
  detail TEXT,
  created INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS blank_checkins_code ON blank_checkins (code, created);
