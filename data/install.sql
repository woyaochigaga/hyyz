CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    uuid VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    created_at timestamptz,
    nickname VARCHAR(255),
    avatar_url VARCHAR(255),
    locale VARCHAR(50),
    signin_type VARCHAR(50),
    signin_ip VARCHAR(255),
    signin_provider VARCHAR(50),
    signin_openid VARCHAR(255),
    invite_code VARCHAR(255) NOT NULL default '',
    updated_at timestamptz,
    invited_by VARCHAR(255) NOT NULL default '',
    is_affiliate BOOLEAN NOT NULL default false,
    phone_number VARCHAR(30) NOT NULL default '',
    gender VARCHAR(20) NOT NULL default '',
    signature VARCHAR(200) NOT NULL default '',
    address VARCHAR(255) NOT NULL default '',
    artisan_category VARCHAR(100) NOT NULL default '',
    artisan_specialties VARCHAR(255) NOT NULL default '',
    artisan_years_experience INT NOT NULL default 0,
    artisan_shop_name VARCHAR(120) NOT NULL default '',
    artisan_shop_address VARCHAR(255) NOT NULL default '',
    artisan_service_area VARCHAR(120) NOT NULL default '',
    artisan_contact_wechat VARCHAR(100) NOT NULL default '',
    artisan_bio TEXT NOT NULL default '',
    UNIQUE (email, signin_provider)
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_no VARCHAR(255) UNIQUE NOT NULL,
    created_at timestamptz,
    user_uuid VARCHAR(255) NOT NULL DEFAULT '',
    user_email VARCHAR(255) NOT NULL DEFAULT '',
    amount INT NOT NULL,
    interval VARCHAR(50),
    expired_at timestamptz,
    status VARCHAR(50) NOT NULL,
    stripe_session_id VARCHAR(255),
    credits INT NOT NULL,
    currency VARCHAR(50),
    sub_id VARCHAR(255),
    sub_interval_count int,
    sub_cycle_anchor int,
    sub_period_end int,
    sub_period_start int,
    sub_times int,
    product_id VARCHAR(255),
    product_name VARCHAR(255),
    valid_months int,
    order_detail TEXT,
    paid_at timestamptz,
    paid_email VARCHAR(255),
    paid_detail TEXT
);


CREATE TABLE apikeys (
    id SERIAL PRIMARY KEY,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(100),
    user_uuid VARCHAR(255) NOT NULL,
    created_at timestamptz,
    status VARCHAR(50)
);

CREATE TABLE credits (
    id SERIAL PRIMARY KEY,
    trans_no VARCHAR(255) UNIQUE NOT NULL,
    created_at timestamptz,
    user_uuid VARCHAR(255) NOT NULL,
    trans_type VARCHAR(50) NOT NULL,
    credits INT NOT NULL,
    order_no VARCHAR(255),
    expired_at timestamptz
);

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    uuid VARCHAR(255) UNIQUE NOT NULL,
    user_uuid VARCHAR(255),
    slug VARCHAR(255),
    title VARCHAR(255),
    description TEXT,
    content TEXT,
    created_at timestamptz,
    updated_at timestamptz,
    status VARCHAR(50),
    cover_url VARCHAR(255),
    video_url VARCHAR(255),
    author_name VARCHAR(255),
    author_avatar_url VARCHAR(255),
    locale VARCHAR(50)
);

CREATE TABLE ai_chat_conversations (
    id SERIAL PRIMARY KEY,
    uuid VARCHAR(255) UNIQUE NOT NULL,
    user_uuid VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL DEFAULT '',
    locale VARCHAR(50) NOT NULL DEFAULT '',
    messages TEXT NOT NULL DEFAULT '[]',
    created_at timestamptz,
    updated_at timestamptz
);

CREATE TABLE home_posts (
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

CREATE TABLE home_post_tags (
    id SERIAL PRIMARY KEY,
    post_uuid VARCHAR(255) NOT NULL,
    tag VARCHAR(100) NOT NULL,
    created_at timestamptz,
    UNIQUE (post_uuid, tag)
);

CREATE TABLE home_post_likes (
    id SERIAL PRIMARY KEY,
    post_uuid VARCHAR(255) NOT NULL,
    user_uuid VARCHAR(255) NOT NULL,
    created_at timestamptz,
    UNIQUE (post_uuid, user_uuid)
);

CREATE TABLE home_post_comments (
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

CREATE TABLE home_post_ai_assist_conversations (
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

CREATE TABLE offline_exhibitions (
    id SERIAL PRIMARY KEY,
    uuid VARCHAR(255) UNIQUE NOT NULL,
    user_uuid VARCHAR(255) NOT NULL,
    locale VARCHAR(50) NOT NULL DEFAULT '',
    applicant_role VARCHAR(20) NOT NULL DEFAULT 'user',
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    title VARCHAR(255) NOT NULL DEFAULT '',
    subtitle VARCHAR(255) NOT NULL DEFAULT '',
    summary TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    curator_name VARCHAR(255) NOT NULL DEFAULT '',
    curator_title VARCHAR(255) NOT NULL DEFAULT '',
    organizer_name VARCHAR(255) NOT NULL DEFAULT '',
    co_organizers JSONB NOT NULL DEFAULT '[]'::jsonb,
    sponsor_name VARCHAR(255) NOT NULL DEFAULT '',
    supporting_organizations JSONB NOT NULL DEFAULT '[]'::jsonb,
    contact_name VARCHAR(100) NOT NULL DEFAULT '',
    contact_phone VARCHAR(50) NOT NULL DEFAULT '',
    contact_wechat VARCHAR(100) NOT NULL DEFAULT '',
    contact_email VARCHAR(255) NOT NULL DEFAULT '',
    venue_name VARCHAR(255) NOT NULL DEFAULT '',
    province VARCHAR(100) NOT NULL DEFAULT '',
    city VARCHAR(100) NOT NULL DEFAULT '',
    district VARCHAR(100) NOT NULL DEFAULT '',
    street VARCHAR(255) NOT NULL DEFAULT '',
    address_detail VARCHAR(255) NOT NULL DEFAULT '',
    formatted_address VARCHAR(500) NOT NULL DEFAULT '',
    map_note VARCHAR(255) NOT NULL DEFAULT '',
    start_at timestamptz,
    end_at timestamptz,
    apply_deadline timestamptz,
    opening_hours VARCHAR(255) NOT NULL DEFAULT '',
    admission_type VARCHAR(20) NOT NULL DEFAULT 'free',
    admission_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
    capacity INT NOT NULL DEFAULT 0,
    booth_count INT NOT NULL DEFAULT 0,
    cover_url VARCHAR(500) NOT NULL DEFAULT '',
    poster_url VARCHAR(500) NOT NULL DEFAULT '',
    gallery_images JSONB NOT NULL DEFAULT '[]'::jsonb,
    tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    art_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
    highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
    transportation JSONB NOT NULL DEFAULT '[]'::jsonb,
    facilities JSONB NOT NULL DEFAULT '[]'::jsonb,
    application_requirements TEXT NOT NULL DEFAULT '',
    submission_materials JSONB NOT NULL DEFAULT '[]'::jsonb,
    schedule_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    external_links JSONB NOT NULL DEFAULT '[]'::jsonb,
    review_note TEXT NOT NULL DEFAULT '',
    created_at timestamptz,
    updated_at timestamptz,
    published_at timestamptz,
    approved_at timestamptz,
    rejected_at timestamptz
);

CREATE TABLE bars (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    cover_image TEXT NOT NULL DEFAULT '',
    creator_id VARCHAR(255) NOT NULL,
    post_count INT NOT NULL DEFAULT 0,
    follow_count INT NOT NULL DEFAULT 0,
    created_at timestamptz
);

CREATE TABLE bar_follows (
    user_id VARCHAR(255) NOT NULL,
    bar_id VARCHAR(255) NOT NULL,
    followed_at timestamptz,
    PRIMARY KEY (user_id, bar_id)
);

CREATE TABLE forum_posts (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(200) NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    author_id VARCHAR(255) NOT NULL,
    bar_id VARCHAR(255) NOT NULL,
    reply_count INT NOT NULL DEFAULT 0,
    like_count INT NOT NULL DEFAULT 0,
    last_reply_at timestamptz,
    created_at timestamptz
);

CREATE TABLE forum_replies (
    id VARCHAR(255) PRIMARY KEY,
    content TEXT NOT NULL DEFAULT '',
    author_id VARCHAR(255) NOT NULL,
    post_id VARCHAR(255) NOT NULL,
    like_count INT NOT NULL DEFAULT 0,
    created_at timestamptz
);

CREATE INDEX bars_creator_id_idx ON bars(creator_id);
CREATE INDEX bar_follows_user_id_idx ON bar_follows(user_id);
CREATE INDEX bar_follows_bar_id_idx ON bar_follows(bar_id);
CREATE INDEX forum_posts_bar_id_idx ON forum_posts(bar_id);
CREATE INDEX forum_posts_author_id_idx ON forum_posts(author_id);
CREATE INDEX forum_posts_last_reply_at_idx ON forum_posts(last_reply_at DESC);
CREATE INDEX forum_posts_bar_last_reply_at_idx ON forum_posts(bar_id, last_reply_at DESC);
CREATE INDEX forum_replies_post_id_idx ON forum_replies(post_id);
CREATE INDEX forum_replies_post_created_at_idx ON forum_replies(post_id, created_at ASC);

create table affiliates (
    id SERIAL PRIMARY KEY,
    user_uuid VARCHAR(255) NOT NULL,
    created_at timestamptz,
    status VARCHAR(50) NOT NULL default '',
    invited_by VARCHAR(255) NOT NULL,
    paid_order_no VARCHAR(255) NOT NULL default '',
    paid_amount INT NOT NULL default 0,
    reward_percent INT NOT NULL default 0,
    reward_amount INT NOT NULL default 0
);
