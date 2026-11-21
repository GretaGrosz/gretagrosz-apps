-- Blank (/blank/): daily counters for "Ask", the axolotl's AI help (worker/blank-ai.js).
-- Lives in the yap database next to the buddy tables. Keys: d:<device hash>, i:<network hash>, all (site total).
-- Rows older than two days are deleted by the worker as it goes.

CREATE TABLE IF NOT EXISTS blank_ai_usage (
  day INTEGER NOT NULL,   -- days since 1970-01-01 (UTC)
  key TEXT NOT NULL,
  n INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, key)
);
