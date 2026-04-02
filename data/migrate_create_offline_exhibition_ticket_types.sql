CREATE TABLE IF NOT EXISTS offline_exhibition_ticket_types (
    id SERIAL PRIMARY KEY,
    uuid VARCHAR(255) UNIQUE NOT NULL,
    exhibition_uuid VARCHAR(255) NOT NULL REFERENCES offline_exhibitions (uuid) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL DEFAULT '',
    description VARCHAR(255) NOT NULL DEFAULT '',
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    quantity INT NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    created_at timestamptz,
    updated_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_offline_exhibition_ticket_types_exhibition_uuid
    ON offline_exhibition_ticket_types (exhibition_uuid);

CREATE INDEX IF NOT EXISTS idx_offline_exhibition_ticket_types_sort_order
    ON offline_exhibition_ticket_types (sort_order);

INSERT INTO offline_exhibition_ticket_types (
    uuid,
    exhibition_uuid,
    name,
    description,
    price,
    quantity,
    sort_order,
    created_at,
    updated_at
)
SELECT
    offline_exhibitions.uuid || '-default-ticket',
    offline_exhibitions.uuid,
    CASE
        WHEN offline_exhibitions.admission_type = 'free' THEN '免费票'
        WHEN offline_exhibitions.admission_type = 'reservation' THEN '预约票'
        WHEN offline_exhibitions.admission_type = 'invite_only' THEN '邀约票'
        ELSE '标准票'
    END,
    CASE
        WHEN offline_exhibitions.admission_type = 'reservation' THEN '需提前预约'
        WHEN offline_exhibitions.admission_type = 'invite_only' THEN '仅限邀约'
        ELSE ''
    END,
    COALESCE(offline_exhibitions.admission_fee, 0),
    COALESCE(offline_exhibitions.capacity, 0),
    0,
    COALESCE(offline_exhibitions.created_at, NOW()),
    COALESCE(offline_exhibitions.updated_at, NOW())
FROM offline_exhibitions
WHERE NOT EXISTS (
    SELECT 1
    FROM offline_exhibition_ticket_types
    WHERE offline_exhibition_ticket_types.exhibition_uuid = offline_exhibitions.uuid
);
