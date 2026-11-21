-- Blank (/blank/): "started because of you". Sharing a project makes a spark: a link (#/s/<code>) with its title and steps.
-- Whoever opens it can start the same project; each phone that does counts once (worker/blank.js).
-- No accounts: the sharer's phone holds a random key for its spark, the server only keeps its SHA-256.

CREATE TABLE IF NOT EXISTS blank_sparks (
  code TEXT PRIMARY KEY,               -- the code in the link (#/s/<code>)
  key_hash TEXT NOT NULL,              -- SHA-256 of the sharer's key: needed to change or delete it
  name TEXT NOT NULL,                  -- the sharer's first name, shown on the link
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  guide_key TEXT,
  steps TEXT NOT NULL,                 -- JSON array of step texts
  lang TEXT NOT NULL DEFAULT 'en',
  ip_hash TEXT NOT NULL,
  created INTEGER NOT NULL,
  updated INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS blank_sparks_ip ON blank_sparks (ip_hash, created);

-- One row per phone that started a spark's project
CREATE TABLE IF NOT EXISTS blank_spark_starts (
  code TEXT NOT NULL,
  device_hash TEXT NOT NULL,           -- SHA-256 of the starter's random device id and the code
  ip_hash TEXT NOT NULL,               -- to cap starts per network and day
  created INTEGER NOT NULL,
  PRIMARY KEY (code, device_hash)
);
CREATE INDEX IF NOT EXISTS blank_spark_starts_ip ON blank_spark_starts (ip_hash, created);
