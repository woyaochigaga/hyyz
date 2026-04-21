ALTER TABLE ai_chat_conversations
    ALTER COLUMN messages SET DEFAULT '[]';

COMMENT ON COLUMN ai_chat_conversations.messages IS 'JSON string array of messages with content, reasoning, model, and attachments';
