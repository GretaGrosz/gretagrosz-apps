-- Emails of banned Blank accounts, only as SHA-256 hashes, so they can't sign up again (worker/blank-social.js ban(),
-- checked at signup in worker/blank-account.js). Kept even when the banned account is deleted.
CREATE TABLE IF NOT EXISTS blank_banned_emails (
  hash TEXT PRIMARY KEY,
  created INTEGER NOT NULL
);
