BEGIN;

CREATE TABLE IF NOT EXISTS bars (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    cover_image TEXT NOT NULL DEFAULT '',
    creator_id VARCHAR(255) NOT NULL,
    post_count INT NOT NULL DEFAULT 0,
    follow_count INT NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bar_follows (
    user_id VARCHAR(255) NOT NULL,
    bar_id VARCHAR(255) NOT NULL,
    followed_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, bar_id)
);

CREATE TABLE IF NOT EXISTS forum_posts (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(200) NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    author_id VARCHAR(255) NOT NULL,
    bar_id VARCHAR(255) NOT NULL,
    reply_count INT NOT NULL DEFAULT 0,
    like_count INT NOT NULL DEFAULT 0,
    last_reply_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS forum_replies (
    id VARCHAR(255) PRIMARY KEY,
    content TEXT NOT NULL DEFAULT '',
    author_id VARCHAR(255) NOT NULL,
    post_id VARCHAR(255) NOT NULL,
    like_count INT NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS forum_post_likes (
    user_id VARCHAR(255) NOT NULL,
    post_id VARCHAR(255) NOT NULL,
    liked_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, post_id)
);

UPDATE bars
SET
    description = COALESCE(description, ''),
    cover_image = COALESCE(cover_image, ''),
    post_count = COALESCE(post_count, 0),
    follow_count = COALESCE(follow_count, 0),
    created_at = COALESCE(created_at, now());

UPDATE bar_follows
SET followed_at = COALESCE(followed_at, now());

UPDATE forum_posts
SET
    title = COALESCE(title, ''),
    content = COALESCE(content, ''),
    reply_count = COALESCE(reply_count, 0),
    like_count = COALESCE(like_count, 0),
    created_at = COALESCE(created_at, now()),
    last_reply_at = COALESCE(last_reply_at, created_at, now());

UPDATE forum_replies
SET
    content = COALESCE(content, ''),
    like_count = COALESCE(like_count, 0),
    created_at = COALESCE(created_at, now());

UPDATE forum_post_likes
SET liked_at = COALESCE(liked_at, now());

DELETE FROM forum_replies fr
WHERE NOT EXISTS (
    SELECT 1
    FROM forum_posts fp
    WHERE fp.id = fr.post_id
);

DELETE FROM bar_follows bf
WHERE NOT EXISTS (
    SELECT 1
    FROM bars b
    WHERE b.id = bf.bar_id
);

DELETE FROM forum_posts fp
WHERE NOT EXISTS (
    SELECT 1
    FROM bars b
    WHERE b.id = fp.bar_id
);

DELETE FROM forum_post_likes fpl
WHERE NOT EXISTS (
    SELECT 1
    FROM forum_posts fp
    WHERE fp.id = fpl.post_id
);

ALTER TABLE bars
    ALTER COLUMN description SET DEFAULT '',
    ALTER COLUMN description SET NOT NULL,
    ALTER COLUMN cover_image SET DEFAULT '',
    ALTER COLUMN cover_image SET NOT NULL,
    ALTER COLUMN post_count SET DEFAULT 0,
    ALTER COLUMN post_count SET NOT NULL,
    ALTER COLUMN follow_count SET DEFAULT 0,
    ALTER COLUMN follow_count SET NOT NULL,
    ALTER COLUMN created_at SET DEFAULT now(),
    ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE bar_follows
    ALTER COLUMN followed_at SET DEFAULT now(),
    ALTER COLUMN followed_at SET NOT NULL;

ALTER TABLE forum_posts
    ALTER COLUMN title SET DEFAULT '',
    ALTER COLUMN title SET NOT NULL,
    ALTER COLUMN content SET DEFAULT '',
    ALTER COLUMN content SET NOT NULL,
    ALTER COLUMN reply_count SET DEFAULT 0,
    ALTER COLUMN reply_count SET NOT NULL,
    ALTER COLUMN like_count SET DEFAULT 0,
    ALTER COLUMN like_count SET NOT NULL,
    ALTER COLUMN last_reply_at SET DEFAULT now(),
    ALTER COLUMN last_reply_at SET NOT NULL,
    ALTER COLUMN created_at SET DEFAULT now(),
    ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE forum_replies
    ALTER COLUMN content SET DEFAULT '',
    ALTER COLUMN content SET NOT NULL,
    ALTER COLUMN like_count SET DEFAULT 0,
    ALTER COLUMN like_count SET NOT NULL,
    ALTER COLUMN created_at SET DEFAULT now(),
    ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE forum_post_likes
    ALTER COLUMN liked_at SET DEFAULT now(),
    ALTER COLUMN liked_at SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'bars_post_count_nonnegative'
    ) THEN
        ALTER TABLE bars
        ADD CONSTRAINT bars_post_count_nonnegative CHECK (post_count >= 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'bars_follow_count_nonnegative'
    ) THEN
        ALTER TABLE bars
        ADD CONSTRAINT bars_follow_count_nonnegative CHECK (follow_count >= 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'forum_posts_reply_count_nonnegative'
    ) THEN
        ALTER TABLE forum_posts
        ADD CONSTRAINT forum_posts_reply_count_nonnegative CHECK (reply_count >= 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'forum_posts_like_count_nonnegative'
    ) THEN
        ALTER TABLE forum_posts
        ADD CONSTRAINT forum_posts_like_count_nonnegative CHECK (like_count >= 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'forum_replies_like_count_nonnegative'
    ) THEN
        ALTER TABLE forum_replies
        ADD CONSTRAINT forum_replies_like_count_nonnegative CHECK (like_count >= 0);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'bar_follows_bar_id_fkey'
    ) THEN
        ALTER TABLE bar_follows
        ADD CONSTRAINT bar_follows_bar_id_fkey
        FOREIGN KEY (bar_id) REFERENCES bars(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'forum_posts_bar_id_fkey'
    ) THEN
        ALTER TABLE forum_posts
        ADD CONSTRAINT forum_posts_bar_id_fkey
        FOREIGN KEY (bar_id) REFERENCES bars(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'forum_replies_post_id_fkey'
    ) THEN
        ALTER TABLE forum_replies
        ADD CONSTRAINT forum_replies_post_id_fkey
        FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'forum_post_likes_post_id_fkey'
    ) THEN
        ALTER TABLE forum_post_likes
        ADD CONSTRAINT forum_post_likes_post_id_fkey
        FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS bars_creator_id_idx ON bars(creator_id);
CREATE INDEX IF NOT EXISTS bar_follows_user_id_idx ON bar_follows(user_id);
CREATE INDEX IF NOT EXISTS bar_follows_bar_id_idx ON bar_follows(bar_id);
CREATE INDEX IF NOT EXISTS forum_posts_bar_id_idx ON forum_posts(bar_id);
CREATE INDEX IF NOT EXISTS forum_posts_author_id_idx ON forum_posts(author_id);
CREATE INDEX IF NOT EXISTS forum_posts_last_reply_at_idx ON forum_posts(last_reply_at DESC);
CREATE INDEX IF NOT EXISTS forum_posts_bar_last_reply_at_idx ON forum_posts(bar_id, last_reply_at DESC);
CREATE INDEX IF NOT EXISTS forum_replies_post_id_idx ON forum_replies(post_id);
CREATE INDEX IF NOT EXISTS forum_replies_post_created_at_idx ON forum_replies(post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS forum_post_likes_post_id_idx ON forum_post_likes(post_id);
CREATE INDEX IF NOT EXISTS forum_post_likes_user_id_idx ON forum_post_likes(user_id);

CREATE OR REPLACE FUNCTION sync_forum_bar_stats(target_bar_id VARCHAR)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE bars
    SET
        post_count = (
            SELECT COUNT(*)
            FROM forum_posts
            WHERE bar_id = target_bar_id
        ),
        follow_count = (
            SELECT COUNT(*)
            FROM bar_follows
            WHERE bar_id = target_bar_id
        )
    WHERE id = target_bar_id;
END;
$$;

CREATE OR REPLACE FUNCTION sync_forum_post_stats(target_post_id VARCHAR)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    latest_reply_at_value timestamptz;
    post_created_at_value timestamptz;
BEGIN
    SELECT created_at
    INTO post_created_at_value
    FROM forum_posts
    WHERE id = target_post_id;

    IF post_created_at_value IS NULL THEN
        RETURN;
    END IF;

    SELECT created_at
    INTO latest_reply_at_value
    FROM forum_replies
    WHERE post_id = target_post_id
    ORDER BY created_at DESC NULLS LAST
    LIMIT 1;

    UPDATE forum_posts
    SET
        reply_count = (
            SELECT COUNT(*)
            FROM forum_replies
            WHERE post_id = target_post_id
        ),
        like_count = (
            SELECT COUNT(*)
            FROM forum_post_likes
            WHERE post_id = target_post_id
        ),
        last_reply_at = COALESCE(latest_reply_at_value, post_created_at_value)
    WHERE id = target_post_id;
END;
$$;

CREATE OR REPLACE FUNCTION forum_posts_stats_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM sync_forum_bar_stats(OLD.bar_id);
        RETURN OLD;
    END IF;

    PERFORM sync_forum_bar_stats(NEW.bar_id);

    IF TG_OP = 'UPDATE' AND OLD.bar_id IS DISTINCT FROM NEW.bar_id THEN
        PERFORM sync_forum_bar_stats(OLD.bar_id);
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION bar_follows_stats_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM sync_forum_bar_stats(OLD.bar_id);
        RETURN OLD;
    END IF;

    PERFORM sync_forum_bar_stats(NEW.bar_id);

    IF TG_OP = 'UPDATE' AND OLD.bar_id IS DISTINCT FROM NEW.bar_id THEN
        PERFORM sync_forum_bar_stats(OLD.bar_id);
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION forum_replies_stats_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM sync_forum_post_stats(OLD.post_id);
        RETURN OLD;
    END IF;

    PERFORM sync_forum_post_stats(NEW.post_id);

    IF TG_OP = 'UPDATE' AND OLD.post_id IS DISTINCT FROM NEW.post_id THEN
        PERFORM sync_forum_post_stats(OLD.post_id);
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION forum_post_likes_stats_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM sync_forum_post_stats(OLD.post_id);
        RETURN OLD;
    END IF;

    PERFORM sync_forum_post_stats(NEW.post_id);

    IF TG_OP = 'UPDATE' AND OLD.post_id IS DISTINCT FROM NEW.post_id THEN
        PERFORM sync_forum_post_stats(OLD.post_id);
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_forum_posts_stats ON forum_posts;
CREATE TRIGGER trg_forum_posts_stats
AFTER INSERT OR UPDATE OR DELETE ON forum_posts
FOR EACH ROW EXECUTE FUNCTION forum_posts_stats_trigger();

DROP TRIGGER IF EXISTS trg_bar_follows_stats ON bar_follows;
CREATE TRIGGER trg_bar_follows_stats
AFTER INSERT OR UPDATE OR DELETE ON bar_follows
FOR EACH ROW EXECUTE FUNCTION bar_follows_stats_trigger();

DROP TRIGGER IF EXISTS trg_forum_replies_stats ON forum_replies;
CREATE TRIGGER trg_forum_replies_stats
AFTER INSERT OR UPDATE OR DELETE ON forum_replies
FOR EACH ROW EXECUTE FUNCTION forum_replies_stats_trigger();

DROP TRIGGER IF EXISTS trg_forum_post_likes_stats ON forum_post_likes;
CREATE TRIGGER trg_forum_post_likes_stats
AFTER INSERT OR UPDATE OR DELETE ON forum_post_likes
FOR EACH ROW EXECUTE FUNCTION forum_post_likes_stats_trigger();

UPDATE forum_posts
SET last_reply_at = COALESCE(last_reply_at, created_at, now());

UPDATE bars b
SET
    post_count = COALESCE(p.post_count, 0),
    follow_count = COALESCE(f.follow_count, 0)
FROM (
    SELECT bar_id, COUNT(*)::INT AS post_count
    FROM forum_posts
    GROUP BY bar_id
) p
FULL JOIN (
    SELECT bar_id, COUNT(*)::INT AS follow_count
    FROM bar_follows
    GROUP BY bar_id
) f
ON p.bar_id = f.bar_id
WHERE b.id = COALESCE(p.bar_id, f.bar_id);

UPDATE bars
SET
    post_count = 0,
    follow_count = 0
WHERE id NOT IN (
    SELECT DISTINCT bar_id FROM forum_posts
    UNION
    SELECT DISTINCT bar_id FROM bar_follows
);

UPDATE forum_posts fp
SET
    reply_count = COALESCE(r.reply_count, 0),
    like_count = COALESCE(l.like_count, 0),
    last_reply_at = COALESCE(r.last_reply_at, fp.created_at)
FROM (
    SELECT
        post_id,
        COUNT(*)::INT AS reply_count,
        MAX(created_at) AS last_reply_at
    FROM forum_replies
    GROUP BY post_id
) r
LEFT JOIN (
    SELECT
        post_id,
        COUNT(*)::INT AS like_count
    FROM forum_post_likes
    GROUP BY post_id
) l
ON r.post_id = l.post_id
WHERE fp.id = r.post_id;

UPDATE forum_posts
SET
    reply_count = 0,
    like_count = COALESCE((
        SELECT COUNT(*)::INT
        FROM forum_post_likes fpl
        WHERE fpl.post_id = forum_posts.id
    ), 0),
    last_reply_at = created_at
WHERE id NOT IN (
    SELECT DISTINCT post_id FROM forum_replies
);

COMMIT;
