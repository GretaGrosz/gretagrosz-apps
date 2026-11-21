-- Blank chats like other messaging apps (worker/blank-social.js): photos, replies, reactions, unsending.
-- photo: 1 when the message is a photo (in R2 at m/<message id>), with text as its caption.
-- reply_to: the message this one answers. updated: the last time a reaction or an unsend changed it, so the
-- open chat (which only fetches what's new) picks those changes up too.
ALTER TABLE blank_messages ADD COLUMN photo INTEGER NOT NULL DEFAULT 0;
ALTER TABLE blank_messages ADD COLUMN ratio REAL;
ALTER TABLE blank_messages ADD COLUMN reply_to TEXT;
ALTER TABLE blank_messages ADD COLUMN updated INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS blank_messages_updated ON blank_messages (chat_id, updated);

CREATE TABLE IF NOT EXISTS blank_message_reactions (
  message_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  emoji TEXT NOT NULL,
  created INTEGER NOT NULL,
  PRIMARY KEY (message_id, user_id)
);
