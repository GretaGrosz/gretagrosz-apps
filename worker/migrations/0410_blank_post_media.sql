-- Posts with several photos, and the cost and time picks (worker/blank-social.js).
-- media: JSON list, one entry per photo in order, e.g. [{"ratio":1.33,"ok":1,"up":1}].
-- Photo 0 is in R2 under p/<post id> (where the single photo of older posts is), photo n under p/<post id>/<n>.
-- NULL for older posts: they have photo/ratio only.
ALTER TABLE blank_posts ADD COLUMN media TEXT;
ALTER TABLE blank_posts ADD COLUMN cost TEXT;   -- 'free' | 'cheap' | 'some', or NULL
ALTER TABLE blank_posts ADD COLUMN time TEXT;   -- 'hour' | 'hours' | 'days' | 'weeks', or NULL
