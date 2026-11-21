-- Blank: find people by their name, not only their username (worker/blank-social.js /social/search).
-- name_key = the name in lowercase without accents ("Grósz Gréta" -> "grosz greta"), set when the name changes;
-- older accounts get theirs the first time a search runs.
ALTER TABLE blank_users ADD COLUMN name_key TEXT;
