-- gretagrosz.com: messages from the contact sheet and Weekend Ink requests (worker/site.js).
-- Lives in the yap database so the site needs no extra database; every table is prefixed site_.
-- Numbered 0100 so it never collides with the Yap app's own migrations.

CREATE TABLE IF NOT EXISTS site_messages (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,                 -- 'contact' or 'weekendink'
  topic TEXT NOT NULL,                -- internship, apps, weekendink, clothing, other
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  body TEXT NOT NULL,
  details TEXT,                       -- JSON: Weekend Ink occasion, design, date, people
  logo TEXT,                          -- data: URL of an attached logo (Weekend Ink), at most ~600 KB
  lang TEXT NOT NULL DEFAULT 'en',
  page TEXT,
  ip_hash TEXT NOT NULL,
  suspect INTEGER NOT NULL DEFAULT 0, -- sent faster than a person can type: kept, but marked
  done INTEGER NOT NULL DEFAULT 0,
  created INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS site_messages_created ON site_messages (created);
CREATE INDEX IF NOT EXISTS site_messages_ip ON site_messages (ip_hash, created);

-- Browsers where Greta turned on notifications in her inbox (/inbox/)
CREATE TABLE IF NOT EXISTS site_push (
  endpoint TEXT PRIMARY KEY,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created INTEGER NOT NULL
);
