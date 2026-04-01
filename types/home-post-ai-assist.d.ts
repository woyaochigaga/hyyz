export type HomePostAiTargetField = "title" | "excerpt" | "content" | "tags";
export type HomePostAiMessageRole = "user" | "assistant";
export type HomePostAiDecision = "pending" | "applied" | "rejected";

export interface HomePostAiPatch {
  title?: string;
  excerpt?: string;
  content?: string;
  tags?: string[];
}

export interface HomePostAiAssistMessage {
  id: string;
  role: HomePostAiMessageRole;
  content: string;
  target_field?: HomePostAiTargetField;
  patch?: HomePostAiPatch;
  decision?: HomePostAiDecision;
  decision_at?: string;
  created_at?: string;
}

export interface HomePostAiAssistConversation {
  id?: number;
  uuid: string;
  user_uuid?: string;
  post_uuid?: string;
  locale?: string;
  title: string;
  messages: HomePostAiAssistMessage[];
  created_at?: string;
  updated_at?: string;
}
