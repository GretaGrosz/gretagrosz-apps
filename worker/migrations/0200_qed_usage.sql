-- QED (regional-app): daily usage counters for hosted proof marking and the coach (worker/qed.js).
-- Lives in the yap database so the site needs no extra database; numbered 0200 to stay clear of Yap (0001…)
-- and the site tables (0100). Keys: d:<device hash>:mark|chat, i:<network hash>:mark|chat, all (site total).
-- Rows older than two days are deleted by the worker as it goes.

CREATE TABLE IF NOT EXISTS qed_usage (
  day INTEGER NOT NULL,   -- days since 1970-01-01 (UTC)
  key TEXT NOT NULL,
  n INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, key)
);
