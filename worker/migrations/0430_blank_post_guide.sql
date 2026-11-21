-- Which Blank idea a post's project was started from (hobby-app/src/guides.js key), or NULL.
-- Ideas show the real posts of people who made them (hobby-app/src/pages/Ideas.jsx).
ALTER TABLE blank_posts ADD COLUMN guide TEXT;
CREATE INDEX IF NOT EXISTS blank_posts_guide ON blank_posts (guide, created);
