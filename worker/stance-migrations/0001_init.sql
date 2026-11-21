-- Stance: a daily philosophical question, written debates, and one-minute talks

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  handle TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  bio TEXT NOT NULL DEFAULT '',
  token_hash TEXT NOT NULL,
  ip_hash TEXT,
  created INTEGER NOT NULL
);
CREATE INDEX users_token ON users (token_hash);
CREATE INDEX users_ip ON users (ip_hash, created);

-- Extra login keys, one per device signed in with a passkey
CREATE TABLE sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, created INTEGER NOT NULL);
CREATE INDEX sessions_user ON sessions (user_id);
CREATE TABLE passkeys (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, public_key TEXT NOT NULL, alg INTEGER NOT NULL, created INTEGER NOT NULL);
CREATE INDEX passkeys_user ON passkeys (user_id);
CREATE TABLE challenges (id TEXT PRIMARY KEY, challenge TEXT NOT NULL, expires INTEGER NOT NULL);
CREATE TABLE push_subs (endpoint TEXT PRIMARY KEY, user_id TEXT NOT NULL, p256dh TEXT NOT NULL, auth TEXT NOT NULL, created INTEGER NOT NULL);
CREATE INDEX push_subs_user ON push_subs (user_id);

-- One opinion per person per question. side is 0 or 1 (the question's two sides).
-- switched_from: the opinion that convinced its author to change side, if any
CREATE TABLE opinions (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  side INTEGER NOT NULL,
  text TEXT NOT NULL,
  convinced_by TEXT,
  created INTEGER NOT NULL,
  edited INTEGER,
  UNIQUE (question_id, user_id)
);
CREATE INDEX opinions_question ON opinions (question_id, created);
CREATE INDEX opinions_user ON opinions (user_id, created);

CREATE TABLE replies (
  id TEXT PRIMARY KEY,
  opinion_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  text TEXT NOT NULL,
  created INTEGER NOT NULL
);
CREATE INDEX replies_opinion ON replies (opinion_id, created);

-- "Good point" marks on opinions
CREATE TABLE points (
  opinion_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created INTEGER NOT NULL,
  PRIMARY KEY (opinion_id, user_id)
);

-- A debate: challenger (side 'for') against opponent ('against'); opponent NULL means an open challenge.
-- status: open (waiting for anyone), pending (waiting for the named opponent), active, closed, declined
CREATE TABLE debates (
  id TEXT PRIMARY KEY,
  motion TEXT NOT NULL,
  context TEXT NOT NULL DEFAULT '',
  for_user TEXT NOT NULL,
  against_user TEXT,
  status TEXT NOT NULL,
  turn_user TEXT,
  created INTEGER NOT NULL,
  started INTEGER,
  ended INTEGER,
  updated INTEGER NOT NULL
);
CREATE INDEX debates_status ON debates (status, updated);
CREATE INDEX debates_for ON debates (for_user, updated);
CREATE INDEX debates_against ON debates (against_user, updated);

-- round 1 opening, 2 rebuttal, 3 closing; the 'for' side speaks first each round
CREATE TABLE turns (
  id TEXT PRIMARY KEY,
  debate_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  round INTEGER NOT NULL,
  text TEXT NOT NULL,
  created INTEGER NOT NULL
);
CREATE INDEX turns_debate ON turns (debate_id, created);

-- Readers' verdicts once a debate has closed; side 0 = for, 1 = against
CREATE TABLE verdicts (
  debate_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  side INTEGER NOT NULL,
  created INTEGER NOT NULL,
  PRIMARY KEY (debate_id, user_id)
);

-- The Minute: private one-minute talks with their analysis
CREATE TABLE minutes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  topic TEXT NOT NULL,
  audio BLOB,
  mime TEXT NOT NULL,
  duration REAL NOT NULL,
  transcript TEXT,
  words INTEGER,
  fillers INTEGER,
  feedback TEXT,
  day TEXT NOT NULL,
  created INTEGER NOT NULL
);
CREATE INDEX minutes_user ON minutes (user_id, created);
