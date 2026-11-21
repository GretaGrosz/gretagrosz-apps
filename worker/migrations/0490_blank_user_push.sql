-- Blank: notifications for your account (worker/blank-notify.js): someone liked your post, started a project because
-- of it, wants to be your friend, accepted, or wrote in a chat. One row per phone or computer that turned them on.
CREATE TABLE IF NOT EXISTS blank_user_push (
  endpoint TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  lang TEXT NOT NULL DEFAULT 'en',
  created INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS blank_user_push_user ON blank_user_push (user_id);
