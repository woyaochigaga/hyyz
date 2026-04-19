BEGIN;

CREATE TABLE IF NOT EXISTS feedback_items (
    uuid VARCHAR(255) PRIMARY KEY,
    user_uuid VARCHAR(255) NOT NULL DEFAULT '',
    user_email VARCHAR(255) NOT NULL DEFAULT '',
    user_nickname VARCHAR(255) NOT NULL DEFAULT '',
    source VARCHAR(50) NOT NULL DEFAULT 'home_ai_chat',
    locale VARCHAR(20) NOT NULL DEFAULT '',
    contact VARCHAR(255) NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    context JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(30) NOT NULL DEFAULT 'new',
    priority VARCHAR(20) NOT NULL DEFAULT 'normal',
    admin_note TEXT NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS feedback_items_created_idx
    ON feedback_items(created_at DESC);
CREATE INDEX IF NOT EXISTS feedback_items_status_idx
    ON feedback_items(status);
CREATE INDEX IF NOT EXISTS feedback_items_priority_idx
    ON feedback_items(priority);
CREATE INDEX IF NOT EXISTS feedback_items_user_uuid_idx
    ON feedback_items(user_uuid);

COMMIT;
