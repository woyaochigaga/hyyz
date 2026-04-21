export interface AiChatAttachment {
  type: "image" | "video";
  url: string;
  key?: string;
  filename?: string;
  contentType?: string;
  size?: number;
}

export interface AiChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
  model?: string;
  attachments?: AiChatAttachment[];
  error?: boolean;
}

export interface AiChatConversation {
  id?: number;
  uuid: string;
  user_uuid?: string;
  title: string;
  locale?: string;
  messages: AiChatMessage[];
  created_at?: string;
  updated_at?: string;
}
