ALTER TABLE forum_replies
ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS reply_to_reply_id VARCHAR(255) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS reply_to_author_id VARCHAR(255) NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS forum_replies_reply_to_reply_id_idx
ON forum_replies(reply_to_reply_id);
