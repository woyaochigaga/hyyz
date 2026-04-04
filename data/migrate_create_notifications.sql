BEGIN;

CREATE TABLE IF NOT EXISTS notification_events (
    uuid VARCHAR(255) PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'system',
    title VARCHAR(255) NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    sender_uuid VARCHAR(255) NOT NULL DEFAULT '',
    source_type VARCHAR(50) NOT NULL DEFAULT '',
    source_uuid VARCHAR(255) NOT NULL DEFAULT '',
    action_url VARCHAR(500) NOT NULL DEFAULT '',
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    audience_type VARCHAR(30) NOT NULL DEFAULT 'direct',
    audience_value VARCHAR(255) NOT NULL DEFAULT '',
    priority VARCHAR(20) NOT NULL DEFAULT 'normal',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at timestamptz NOT NULL DEFAULT now(),
    published_at timestamptz,
    expires_at timestamptz,
    dedupe_key VARCHAR(255) NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS notification_receipts (
    id SERIAL PRIMARY KEY,
    notification_uuid VARCHAR(255) NOT NULL,
    user_uuid VARCHAR(255) NOT NULL,
    read_at timestamptz,
    seen_at timestamptz,
    archived_at timestamptz,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (notification_uuid, user_uuid)
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'notification_receipts_notification_uuid_fkey'
    ) THEN
        ALTER TABLE notification_receipts
        ADD CONSTRAINT notification_receipts_notification_uuid_fkey
        FOREIGN KEY (notification_uuid) REFERENCES notification_events(uuid) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS notification_events_created_idx
    ON notification_events(created_at DESC);
CREATE INDEX IF NOT EXISTS notification_events_type_idx
    ON notification_events(type);
CREATE INDEX IF NOT EXISTS notification_events_category_idx
    ON notification_events(category);
CREATE INDEX IF NOT EXISTS notification_receipts_user_created_idx
    ON notification_receipts(user_uuid, created_at DESC);
CREATE INDEX IF NOT EXISTS notification_receipts_user_unread_idx
    ON notification_receipts(user_uuid, read_at, created_at DESC);

COMMIT;
