export type FeedbackSource = "home_ai_chat" | "home_general";

export type FeedbackStatus = "new" | "in_progress" | "resolved" | "closed";

export type FeedbackPriority = "normal" | "high" | "urgent";

export interface FeedbackItem {
  uuid: string;
  user_uuid?: string;
  user_email?: string;
  user_nickname?: string;
  source: FeedbackSource;
  locale?: string;
  contact?: string;
  content: string;
  context?: Record<string, unknown>;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  admin_note?: string;
  created_at?: string;
  updated_at?: string;
  resolved_at?: string | null;
}
