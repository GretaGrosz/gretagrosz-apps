-- Blank's founding testers: the first 50 accounts get a badge on their profile and posts (worker/blank-social.js).
-- New accounts get it at signup while there are fewer than 50 (worker/blank-account.js, FOUNDERS).
ALTER TABLE blank_users ADD COLUMN founder INTEGER NOT NULL DEFAULT 0;
UPDATE blank_users SET founder = 1 WHERE id IN (SELECT id FROM blank_users ORDER BY created LIMIT 50);
