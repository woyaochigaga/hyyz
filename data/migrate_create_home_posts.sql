CREATE TABLE IF NOT EXISTS home_posts (
    id SERIAL PRIMARY KEY,
    uuid VARCHAR(255) UNIQUE NOT NULL,
    user_uuid VARCHAR(255) NOT NULL,
    locale VARCHAR(50) NOT NULL DEFAULT '',
    type VARCHAR(20) NOT NULL DEFAULT 'text',
    title VARCHAR(255) NOT NULL DEFAULT '',
    excerpt TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    content_format VARCHAR(20) NOT NULL DEFAULT 'markdown',
    editor_mode VARCHAR(20) NOT NULL DEFAULT 'hybrid',
    content_blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
    attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
    display_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    cover_url VARCHAR(500) NOT NULL DEFAULT '',
    images TEXT NOT NULL DEFAULT '[]',
    video_url VARCHAR(500) NOT NULL DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'published',
    like_count INT NOT NULL DEFAULT 0,
    comment_count INT NOT NULL DEFAULT 0,
    created_at timestamptz,
    updated_at timestamptz,
    published_at timestamptz
);

CREATE TABLE IF NOT EXISTS home_post_tags (
    id SERIAL PRIMARY KEY,
    post_uuid VARCHAR(255) NOT NULL,
    tag VARCHAR(100) NOT NULL,
    created_at timestamptz,
    UNIQUE (post_uuid, tag)
);

CREATE TABLE IF NOT EXISTS home_post_likes (
    id SERIAL PRIMARY KEY,
    post_uuid VARCHAR(255) NOT NULL,
    user_uuid VARCHAR(255) NOT NULL,
    created_at timestamptz,
    UNIQUE (post_uuid, user_uuid)
);

CREATE TABLE IF NOT EXISTS home_post_comments (
    id SERIAL PRIMARY KEY,
    uuid VARCHAR(255) UNIQUE NOT NULL,
    post_uuid VARCHAR(255) NOT NULL,
    user_uuid VARCHAR(255) NOT NULL,
    parent_uuid VARCHAR(255) NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at timestamptz,
    updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS home_post_ai_assist_conversations (
    id SERIAL PRIMARY KEY,
    uuid VARCHAR(255) UNIQUE NOT NULL,
    user_uuid VARCHAR(255) NOT NULL,
    post_uuid VARCHAR(255) NOT NULL DEFAULT '',
    locale VARCHAR(50) NOT NULL DEFAULT '',
    title VARCHAR(255) NOT NULL DEFAULT '',
    messages TEXT NOT NULL DEFAULT '[]',
    created_at timestamptz,
    updated_at timestamptz
);
