-- How many people opened Blank each day, and where they came from (worker/blank.js POST /visit). Only counts:
-- no account, device, address or anything else about the visitor is kept. The admin's stats show it (pages/Admin.jsx).
CREATE TABLE IF NOT EXISTS blank_visits (
  day TEXT NOT NULL,                     -- 'YYYY-MM-DD' (UTC)
  source TEXT NOT NULL,                  -- reddit, tiktok, instagram, search, friend, direct or other
  visitors INTEGER NOT NULL DEFAULT 0,   -- devices that opened Blank that day (each counts once a day)
  new_visitors INTEGER NOT NULL DEFAULT 0, -- of them, opening Blank for the first time on that device
  PRIMARY KEY (day, source)
);
