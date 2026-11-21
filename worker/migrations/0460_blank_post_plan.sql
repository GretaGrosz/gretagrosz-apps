-- The plan behind a post: the project's steps at the moment it was posted (JSON array of strings), or NULL.
-- Whoever opens the post sees it, and "Start this project" copies that real plan (hobby-app/src/components/Social.jsx).
ALTER TABLE blank_posts ADD COLUMN plan TEXT;
