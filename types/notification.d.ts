export type NotificationCategory = "system" | "interaction" | "review";

export type NotificationType =
  | "announcement_published"
  | "home_post_commented"
  | "home_post_replied"
  | "forum_post_replied"
  | "offline_exhibition_approved"
  | "offline_exhibition_rejected"
  | "artisan_verification_approved"
  | "artisan_verification_rejected"
  | "system_message";

export type NotificationAudienceType = "all" | "role" | "direct";

export type NotificationPriority = "low" | "normal" | "high";

export interface NotificationEvent {
  uuid: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  content: string;
  sender_uuid?: string;
  source_type?: string;
  source_uuid?: string;
  action_url?: string;
  payload?: Record<string, unknown>;
  audience_type: NotificationAudienceType;
  audience_value?: string;
  priority?: NotificationPriority;
  status?: "active" | "revoked";
  created_at?: string;
  published_at?: string | null;
  expires_at?: string | null;
  dedupe_key?: string;
}

export interface NotificationReceipt {
  id?: number;
  notification_uuid: string;
  user_uuid: string;
  read_at?: string | null;
  seen_at?: string | null;
  archived_at?: string | null;
  deleted_at?: string | null;
  created_at?: string;
}

export interface NotificationListItem extends NotificationEvent {
  receipt_id: number;
  read_at?: string | null;
  seen_at?: string | null;
  receipt_created_at?: string;
}

export interface NotificationSummary {
  unread_count: number;
  items: NotificationListItem[];
}
