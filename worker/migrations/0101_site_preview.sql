-- gretagrosz.com: the picture of a Weekend Ink design on the arm, as the visitor placed it (worker/site.js).
-- data: URL of a JPEG, at most ~250 KB. Details JSON may now also carry size (cm), text (a name) and qr (its target).
ALTER TABLE site_messages ADD COLUMN preview TEXT;
