-- Chats, step 2: "typing…". The last time each person typed in a chat; the others see it for a few seconds
-- through the chat's normal check for new messages (no real-time connection, nothing that costs money).
ALTER TABLE blank_chat_members ADD COLUMN typing_at INTEGER NOT NULL DEFAULT 0;
