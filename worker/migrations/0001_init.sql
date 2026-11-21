-- Yap: a social network made only of voice recordings
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  handle TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  hue INTEGER NOT NULL,
  bot INTEGER NOT NULL DEFAULT 0,
  token_hash TEXT NOT NULL,
  ip_hash TEXT,
  created INTEGER NOT NULL
);
CREATE INDEX users_token ON users (token_hash);
CREATE INDEX users_ip ON users (ip_hash, created);

-- Posts in the feed; a post with reply_to is a voice reply to another post
CREATE TABLE posts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  reply_to TEXT,
  audio BLOB,
  audio_url TEXT,
  mime TEXT NOT NULL,
  duration REAL NOT NULL,
  wave TEXT NOT NULL,
  fx TEXT NOT NULL DEFAULT '',
  plays INTEGER NOT NULL DEFAULT 0,
  created INTEGER NOT NULL
);
CREATE INDEX posts_feed ON posts (reply_to, created);
CREATE INDEX posts_user ON posts (user_id, created);

-- src added dst as a friend; two rows either way round make them friends
CREATE TABLE follows (
  src TEXT NOT NULL,
  dst TEXT NOT NULL,
  created INTEGER NOT NULL,
  PRIMARY KEY (src, dst)
);
CREATE INDEX follows_dst ON follows (dst);

CREATE TABLE reactions (
  post_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  emoji TEXT NOT NULL,
  created INTEGER NOT NULL,
  PRIMARY KEY (post_id, user_id)
);

-- Voice messages between two friends
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  src TEXT NOT NULL,
  dst TEXT NOT NULL,
  audio BLOB,
  audio_url TEXT,
  mime TEXT NOT NULL,
  duration REAL NOT NULL,
  wave TEXT NOT NULL,
  fx TEXT NOT NULL DEFAULT '',
  heard INTEGER NOT NULL DEFAULT 0,
  created INTEGER NOT NULL
);
CREATE INDEX messages_pair ON messages (src, dst, created);
CREATE INDEX messages_dst ON messages (dst, heard);
