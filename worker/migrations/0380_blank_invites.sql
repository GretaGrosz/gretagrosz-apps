-- Blank invite links (#/u/<username>?i=<code>, worker/blank-social.js): whoever opens your link and joins becomes your
-- friend right away, because you sent it. One code per account, made the first time you share your link.
ALTER TABLE blank_users ADD COLUMN invite TEXT;
