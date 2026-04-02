CREATE TABLE IF NOT EXISTS offline_exhibitions (
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

CREATE INDEX IF NOT EXISTS idx_offline_exhibitions_user_uuid
    ON offline_exhibitions (user_uuid);

CREATE INDEX IF NOT EXISTS idx_offline_exhibitions_status
    ON offline_exhibitions (status);

CREATE INDEX IF NOT EXISTS idx_offline_exhibitions_city
    ON offline_exhibitions (city);

CREATE INDEX IF NOT EXISTS idx_offline_exhibitions_start_at
    ON offline_exhibitions (start_at);
