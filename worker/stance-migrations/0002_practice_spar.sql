-- Stance, second pass: language, forfeits, oral-exam practice (lengths, languages, own topics, retryable
-- analysis, chunked audio), Argue back (AI sparring), debates started from a daily question, and rate-limit logs.

-- The language the person uses Stance in (notifications are written in it)
ALTER TABLE users ADD COLUMN lang TEXT NOT NULL DEFAULT 'en';

-- A debate whose side deleted their account: that side forfeits (0 = for, 1 = against)
ALTER TABLE debates ADD COLUMN forfeit INTEGER;
-- A debate started from a daily question: the question, and which of its two sides (0/1) the 'for' debater argues
ALTER TABLE debates ADD COLUMN question_id TEXT;
ALTER TABLE debates ADD COLUMN q_side INTEGER;

-- The Minute: language, target length in seconds, and whether it was analysed
-- status: done (analysed), failed (the analysis did not run; the recording is kept for a retry), silent (no speech found)
ALTER TABLE minutes ADD COLUMN lang TEXT NOT NULL DEFAULT 'en';
ALTER TABLE minutes ADD COLUMN length INTEGER NOT NULL DEFAULT 60;
ALTER TABLE minutes ADD COLUMN status TEXT NOT NULL DEFAULT 'done';
-- Before this, a failed transcription was saved as an empty "result"; those can now be analysed again
UPDATE minutes SET status = 'failed' WHERE transcript IS NULL OR transcript = '';

-- Recordings longer than one D1 value allows are stored in pieces
CREATE TABLE minute_audio (minute_id TEXT NOT NULL, seq INTEGER NOT NULL, data BLOB NOT NULL, PRIMARY KEY (minute_id, seq));

-- Your own speaking topics (e.g. the school's Matura topic areas)
CREATE TABLE user_topics (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, text TEXT NOT NULL, created INTEGER NOT NULL);
CREATE INDEX user_topics_user ON user_topics (user_id, created);

-- Argue back: you against the strongest case for the other side of a question
-- status: open (your turn), thinking (the reply is owed, e.g. after a failed AI call), judged
CREATE TABLE spars (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  side INTEGER NOT NULL,
  lang TEXT NOT NULL,
  status TEXT NOT NULL,
  verdict TEXT,
  created INTEGER NOT NULL,
  updated INTEGER NOT NULL
);
CREATE INDEX spars_user ON spars (user_id, question_id, created);
-- role: you | them
CREATE TABLE spar_turns (id TEXT PRIMARY KEY, spar_id TEXT NOT NULL, n INTEGER NOT NULL, role TEXT NOT NULL, text TEXT NOT NULL, created INTEGER NOT NULL);
CREATE INDEX spar_turns_spar ON spar_turns (spar_id, n);

-- "Convinced me" tells the author once per person, however often they switch back and forth
CREATE TABLE convinced_log (user_id TEXT NOT NULL, opinion_id TEXT NOT NULL, created INTEGER NOT NULL, PRIMARY KEY (user_id, opinion_id));

-- Every Workers AI call, for per-person and daily limits. kind: minute | spar
CREATE TABLE ai_usage (user_id TEXT NOT NULL, kind TEXT NOT NULL, created INTEGER NOT NULL);
CREATE INDEX ai_usage_user ON ai_usage (user_id, kind, created);
CREATE INDEX ai_usage_kind ON ai_usage (kind, created);
