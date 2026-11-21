-- Blank: "when will you do the next step?" The axolotl sends a notification at that time (worker/blank-reminders.js).
-- One reminder per device and project (a new time replaces the old one); sent and deleted by the Worker's cron.
-- device = SHA-256 of the app's random device id; sub = the browser's push subscription (JSON).
CREATE TABLE IF NOT EXISTS blank_reminders (
  device TEXT NOT NULL,
  project TEXT NOT NULL,
  at INTEGER NOT NULL,
  sub TEXT NOT NULL,
  step TEXT NOT NULL,
  lang TEXT NOT NULL,
  created INTEGER NOT NULL,
  PRIMARY KEY (device, project)
);
CREATE INDEX IF NOT EXISTS blank_reminders_at ON blank_reminders (at);
