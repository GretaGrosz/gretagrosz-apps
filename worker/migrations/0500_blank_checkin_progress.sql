-- Blank: a check-in in a chat carries the project's progress and steps, so a friend can see how far you are and
-- start the same project (worker/blank-social.js). JSON: { done, total, last, steps: [{ text, done }], lang, guide }
ALTER TABLE blank_messages ADD COLUMN info TEXT;
