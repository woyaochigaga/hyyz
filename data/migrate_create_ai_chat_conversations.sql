CREATE TABLE IF NOT EXISTS ai_chat_conversations (
    id SERIAL PRIMARY KEY,
    uuid VARCHAR(255) UNIQUE NOT NULL,
    user_uuid VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL DEFAULT '',
    locale VARCHAR(50) NOT NULL DEFAULT '',
    messages TEXT NOT NULL DEFAULT '[]',
    created_at timestamptz,
    updated_at timestamptz
);
