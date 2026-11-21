-- Safety for messages (worker/blank-social.js). By default only friends (and so the people you do a plan with, who
-- are always friends) can write to you. Message requests from anyone else are off unless you turn them on, and
-- only people 16 or older can: the birth year is asked once, when turning them on.
ALTER TABLE blank_users ADD COLUMN msg_requests INTEGER NOT NULL DEFAULT 0;
ALTER TABLE blank_users ADD COLUMN birth_year INTEGER;
-- A one-to-one chat that is still a request: who asked. They can send one message (text only) until it's accepted;
-- the other person sees it in a separate Requests folder and accepts, declines or blocks. NULL = a normal chat.
ALTER TABLE blank_chats ADD COLUMN request_by TEXT;
