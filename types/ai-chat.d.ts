export interface AiChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
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
