import { getIsoTimestr } from "@/lib/time";
import { getUuid } from "@/lib/hash";
import { getSupabaseClient } from "@/models/db";
import { getAllUsers } from "@/models/user";
import type { Post } from "@/types/post";
import type {
  NotificationAudienceType,
  NotificationCategory,
  NotificationEvent,
  NotificationListItem,
  NotificationPriority,
  NotificationSummary,
  NotificationType,
} from "@/types/notification";

type NotificationEventRow = {
  uuid: string;
  type?: NotificationType;
  category?: NotificationCategory;
  title?: string;
  content?: string;
  sender_uuid?: string;
  source_type?: string;
  source_uuid?: string;
  action_url?: string;
  payload?: Record<string, unknown> | string | null;
  audience_type?: NotificationAudienceType;
  audience_value?: string;
  priority?: NotificationPriority;
  status?: "active" | "revoked";
  created_at?: string;
  published_at?: string | null;
  expires_at?: string | null;
  dedupe_key?: string;
};

type NotificationReceiptRow = {
  id?: number;
  user_uuid: string;
  notification_uuid: string;
  read_at?: string | null;
  seen_at?: string | null;
  archived_at?: string | null;
  deleted_at?: string | null;
  created_at?: string;
  notification_events?: NotificationEventRow | NotificationEventRow[] | null;
};

type CreateNotificationInput = {
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  content?: string;
  sender_uuid?: string;
  source_type?: string;
  source_uuid?: string;
  action_url?: string;
  payload?: Record<string, unknown>;
  audience_type: NotificationAudienceType;
  audience_value?: string;
  priority?: NotificationPriority;
  status?: "active" | "revoked";
  expires_at?: string | null;
  dedupe_key?: string;
  recipientUuids?: string[];
};

function normalizePayload(input: unknown): Record<string, unknown> {
  if (!input) return {};
  if (typeof input === "object" && !Array.isArray(input)) {
    return input as Record<string, unknown>;
  }
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
  }
  return {};
}

function toNotificationEvent(row: NotificationEventRow): NotificationEvent {
  const expiresAt = row.expires_at || null;
  const expiresTimestamp = expiresAt ? new Date(expiresAt).getTime() : 0;
  const isExpired =
    Boolean(expiresAt) &&
    !Number.isNaN(expiresTimestamp) &&
    expiresTimestamp <= Date.now();

  return {
    uuid: row.uuid,
    type: row.type || "system_message",
    category: row.category || "system",
    title: String(row.title || "").trim(),
    content: String(row.content || ""),
    sender_uuid: String(row.sender_uuid || "").trim(),
    source_type: String(row.source_type || "").trim(),
    source_uuid: String(row.source_uuid || "").trim(),
    action_url: String(row.action_url || "").trim(),
    payload: normalizePayload(row.payload),
    audience_type: row.audience_type || "direct",
    audience_value: String(row.audience_value || "").trim(),
    priority: row.priority || "normal",
    status: row.status || "active",
    created_at: row.created_at || "",
    published_at: row.published_at || null,
    expires_at: expiresAt,
    dedupe_key: String(row.dedupe_key || "").trim(),
    is_expired: isExpired,
  };
}

function toNotificationListItem(row: NotificationReceiptRow): NotificationListItem | null {
  const eventRow = Array.isArray(row.notification_events)
    ? row.notification_events[0]
    : row.notification_events;
  if (!eventRow?.uuid) return null;

  return {
    ...toNotificationEvent(eventRow),
    receipt_id: Number(row.id || 0),
    read_at: row.read_at || null,
    seen_at: row.seen_at || null,
    receipt_created_at: row.created_at || "",
  };
}

function normalizeAudienceType(value: unknown): NotificationAudienceType {
  if (value === "all" || value === "role" || value === "direct") {
    return value;
  }
  return "direct";
}

function normalizeCategory(value: unknown): NotificationCategory {
  if (value === "system" || value === "interaction" || value === "review") {
    return value;
  }
  return "system";
}

function normalizePriority(value: unknown): NotificationPriority {
  if (value === "low" || value === "high" || value === "normal") {
    return value;
  }
  return "normal";
}

function buildSnippet(input: string, limit: number = 120) {
  const value = String(input || "").trim().replace(/\s+/g, " ");
  if (!value) return "";
  if (value.length <= limit) return value;
  return `${value.slice(0, limit).trim()}...`;
}

async function resolveAudienceRecipients(
  audienceType: NotificationAudienceType,
  audienceValue?: string
) {
  if (audienceType === "direct") {
    return Array.from(
      new Set(
        String(audienceValue || "")
          .split(/[\s,]+/)
          .map((item) => item.trim())
          .filter(Boolean)
      )
    );
  }

  const users = await getAllUsers();
  if (audienceType === "role") {
    const role = String(audienceValue || "").trim();
    return users
      .filter((user) => user.uuid && user.role === role)
      .map((user) => String(user.uuid));
  }

  return users
    .filter((user) => user.uuid)
    .map((user) => String(user.uuid));
}

async function insertNotificationReceipts(notificationUuid: string, userUuids: string[]) {
  const uniqueUserUuids = Array.from(new Set(userUuids.filter(Boolean)));
  if (uniqueUserUuids.length === 0) return;

  const supabase = getSupabaseClient();
  const now = getIsoTimestr();
  const chunkSize = 500;

  for (let index = 0; index < uniqueUserUuids.length; index += chunkSize) {
    const chunk = uniqueUserUuids.slice(index, index + chunkSize);
    const { error } = await supabase.from("notification_receipts").insert(
      chunk.map((user_uuid) => ({
        notification_uuid: notificationUuid,
        user_uuid,
        created_at: now,
      }))
    );

    if (error) throw error;
  }
}

export async function createAndDeliverNotification(input: CreateNotificationInput) {
  const supabase = getSupabaseClient();
  const now = getIsoTimestr();
  const audience_type = normalizeAudienceType(input.audience_type);
  const audience_value = String(input.audience_value || "").trim();
  const uuid = getUuid();

  const { error } = await supabase.from("notification_events").insert({
    uuid,
    type: input.type,
    category: normalizeCategory(input.category),
    title: String(input.title || "").trim(),
    content: String(input.content || "").trim(),
    sender_uuid: String(input.sender_uuid || "").trim(),
    source_type: String(input.source_type || "").trim(),
    source_uuid: String(input.source_uuid || "").trim(),
    action_url: String(input.action_url || "").trim(),
    payload: input.payload || {},
    audience_type,
    audience_value,
    priority: normalizePriority(input.priority),
    status: input.status || "active",
    created_at: now,
    published_at: now,
    expires_at: input.expires_at || null,
    dedupe_key: String(input.dedupe_key || "").trim(),
  });

  if (error) throw error;

  const recipientUuids =
    input.recipientUuids && input.recipientUuids.length > 0
      ? input.recipientUuids
      : await resolveAudienceRecipients(audience_type, audience_value);

  await insertNotificationReceipts(uuid, recipientUuids);

  return findNotificationEventByUuid(uuid);
}

export async function findNotificationEventByUuid(uuid: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("notification_events")
    .select("*")
    .eq("uuid", uuid)
    .limit(1)
    .single();

  if (error || !data) return undefined;
  return toNotificationEvent(data as NotificationEventRow);
}

export async function listUserNotifications(params: {
  user_uuid: string;
  limit?: number;
  tab?: "all" | "unread" | "system" | "interaction" | "review";
}) {
  const supabase = getSupabaseClient();
  const select =
    "id,user_uuid,notification_uuid,read_at,seen_at,archived_at,deleted_at,created_at," +
    "notification_events!inner(" +
    "uuid,type,category,title,content,sender_uuid,source_type,source_uuid,action_url,payload,audience_type,audience_value,priority,status,created_at,published_at,expires_at,dedupe_key" +
    ")";

  let query = supabase
    .from("notification_receipts")
    .select(select)
    .eq("user_uuid", params.user_uuid)
    .is("deleted_at", null)
    .eq("notification_events.status", "active")
    .or("expires_at.is.null,expires_at.gt." + getIsoTimestr(), {
      foreignTable: "notification_events",
    } as { foreignTable: string })
    .order("created_at", { ascending: false })
    .limit(params.limit && params.limit > 0 ? params.limit : 20);

  if (params.tab === "unread") {
    query = query.is("read_at", null);
  } else if (
    params.tab === "system" ||
    params.tab === "interaction" ||
    params.tab === "review"
  ) {
    query = query.eq("notification_events.category", params.tab);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return (data as unknown as NotificationReceiptRow[])
    .map(toNotificationListItem)
    .filter((item): item is NotificationListItem => item !== null);
}

export async function getNotificationSummary(user_uuid: string): Promise<NotificationSummary> {
  const supabase = getSupabaseClient();
  const [{ count }, items] = await Promise.all([
    supabase
      .from("notification_receipts")
      .select("id,notification_events!inner(uuid)", { count: "exact", head: true })
      .eq("user_uuid", user_uuid)
      .is("deleted_at", null)
      .is("read_at", null)
      .eq("notification_events.status", "active")
      .or("expires_at.is.null,expires_at.gt." + getIsoTimestr(), {
        foreignTable: "notification_events",
      } as { foreignTable: string }),
    listUserNotifications({
      user_uuid,
      limit: 6,
      tab: "all",
    }),
  ]);

  return {
    unread_count: Number(count || 0),
    items,
  };
}

export async function markNotificationsRead(user_uuid: string, notificationUuids: string[]) {
  const uuids = Array.from(new Set(notificationUuids.filter(Boolean)));
  if (uuids.length === 0) return;

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("notification_receipts")
    .update({
      read_at: getIsoTimestr(),
    })
    .eq("user_uuid", user_uuid)
    .in("notification_uuid", uuids)
    .is("read_at", null);

  if (error) throw error;
}

export async function markAllNotificationsRead(user_uuid: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("notification_receipts")
    .update({
      read_at: getIsoTimestr(),
    })
    .eq("user_uuid", user_uuid)
    .is("read_at", null)
    .is("deleted_at", null);

  if (error) throw error;
}

export async function markNotificationsDeleted(user_uuid: string, notificationUuids: string[]) {
  const uuids = Array.from(new Set(notificationUuids.filter(Boolean)));
  if (uuids.length === 0) return;

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("notification_receipts")
    .update({
      deleted_at: getIsoTimestr(),
    })
    .eq("user_uuid", user_uuid)
    .in("notification_uuid", uuids)
    .is("deleted_at", null);

  if (error) throw error;
}

export async function listNotificationEventsForAdmin(limit: number = 50) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("notification_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as NotificationEventRow[]).map(toNotificationEvent);
}

export async function updateNotificationEvent(
  uuid: string,
  patch: Partial<
    Pick<
      NotificationEvent,
      | "title"
      | "content"
      | "category"
      | "action_url"
      | "audience_type"
      | "audience_value"
      | "priority"
      | "status"
      | "expires_at"
    >
  >
) {
  const supabase = getSupabaseClient();
  const normalizedPatch: Record<string, unknown> = {};

  if (typeof patch.title === "string") {
    normalizedPatch.title = patch.title.trim();
  }
  if (typeof patch.content === "string") {
    normalizedPatch.content = patch.content.trim();
  }
  if (typeof patch.category !== "undefined") {
    normalizedPatch.category = normalizeCategory(patch.category);
  }
  if (typeof patch.action_url === "string") {
    normalizedPatch.action_url = patch.action_url.trim();
  }
  if (typeof patch.audience_type !== "undefined") {
    normalizedPatch.audience_type = normalizeAudienceType(patch.audience_type);
  }
  if (typeof patch.audience_value === "string") {
    normalizedPatch.audience_value = patch.audience_value.trim();
  }
  if (typeof patch.priority !== "undefined") {
    normalizedPatch.priority = normalizePriority(patch.priority);
  }
  if (typeof patch.status !== "undefined") {
    normalizedPatch.status = patch.status === "revoked" ? "revoked" : "active";
  }
  if (typeof patch.expires_at !== "undefined") {
    normalizedPatch.expires_at = patch.expires_at || null;
  }

  const { error } = await supabase
    .from("notification_events")
    .update(normalizedPatch)
    .eq("uuid", uuid);

  if (error) throw error;

  return findNotificationEventByUuid(uuid);
}

export async function revokeNotificationEvent(uuid: string) {
  return updateNotificationEvent(uuid, {
    status: "revoked",
  });
}

export async function deleteNotificationEvent(uuid: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("notification_events").delete().eq("uuid", uuid);
  if (error) throw error;
}

export async function extendNotificationExpiry(uuid: string, hours: number) {
  const event = await findNotificationEventByUuid(uuid);
  if (!event) {
    throw new Error("消息不存在");
  }

  const base = event.expires_at ? new Date(event.expires_at) : new Date();
  const timestamp = Number.isNaN(base.getTime()) ? Date.now() : base.getTime();
  const next = new Date(timestamp + Math.max(1, hours) * 60 * 60 * 1000).toISOString();

  return updateNotificationEvent(uuid, {
    expires_at: next,
    status: "active",
  });
}

export async function sendAnnouncementPublishedNotification(post: Post) {
  const slug = String(post.slug || "").trim();
  const locale = String(post.locale || "zh").trim() || "zh";
  const title = String(post.title || "").trim() || "平台公告";

  return createAndDeliverNotification({
    type: "announcement_published",
    category: "system",
    title: `平台公告：${title}`,
    content: buildSnippet(String(post.description || post.content || "").trim(), 140),
    sender_uuid: String(post.user_uuid || "").trim(),
    source_type: "announcement",
    source_uuid: String(post.uuid || "").trim(),
    action_url: slug ? `/${locale}/posts/${encodeURIComponent(slug)}` : `/${locale}/posts`,
    payload: {
      announcement_uuid: post.uuid || "",
      slug,
      locale,
    },
    audience_type: "all",
  });
}

export async function sendHomePostCommentNotification(params: {
  locale?: string;
  post_uuid: string;
  post_title?: string;
  post_author_uuid: string;
  comment_uuid: string;
  comment_content: string;
  actor_uuid: string;
  actor_name?: string;
  parent_comment_author_uuid?: string;
  parent_uuid?: string;
}) {
  const recipients = new Set<string>();
  if (params.post_author_uuid && params.post_author_uuid !== params.actor_uuid) {
    recipients.add(params.post_author_uuid);
  }
  if (
    params.parent_comment_author_uuid &&
    params.parent_comment_author_uuid !== params.actor_uuid
  ) {
    recipients.add(params.parent_comment_author_uuid);
  }

  if (recipients.size === 0) return;

  const hasReplyTarget = Boolean(params.parent_uuid);
  const actorName = String(params.actor_name || "").trim() || "有人";
  const postTitle = String(params.post_title || "").trim() || "你的帖子";
  const locale = String(params.locale || "zh").trim() || "zh";

  return createAndDeliverNotification({
    type: hasReplyTarget ? "home_post_replied" : "home_post_commented",
    category: "interaction",
    title: hasReplyTarget
      ? `${actorName}回复了你的讨论`
      : `${actorName}评论了你的帖子`,
    content: `${postTitle} · ${buildSnippet(params.comment_content, 100)}`,
    sender_uuid: params.actor_uuid,
    source_type: "home_post_comment",
    source_uuid: params.comment_uuid,
    action_url: `/${locale}/home/post/${params.post_uuid}`,
    payload: {
      post_uuid: params.post_uuid,
      comment_uuid: params.comment_uuid,
      parent_uuid: params.parent_uuid || "",
    },
    audience_type: "direct",
    recipientUuids: Array.from(recipients),
  });
}

export async function sendForumReplyNotification(params: {
  locale?: string;
  post_id: string;
  post_title?: string;
  post_author_uuid: string;
  reply_id: string;
  reply_content: string;
  actor_uuid: string;
  actor_name?: string;
  reply_to_author_uuid?: string;
  reply_to_reply_id?: string;
}) {
  const recipients = new Set<string>();
  if (params.post_author_uuid && params.post_author_uuid !== params.actor_uuid) {
    recipients.add(params.post_author_uuid);
  }
  if (
    params.reply_to_author_uuid &&
    params.reply_to_author_uuid !== params.actor_uuid
  ) {
    recipients.add(params.reply_to_author_uuid);
  }

  if (recipients.size === 0) {
    return;
  }

  const hasReplyTarget = Boolean(params.reply_to_reply_id);
  const actorName = String(params.actor_name || "").trim() || "有人";
  const postTitle = String(params.post_title || "").trim() || "你的论坛帖子";
  const locale = String(params.locale || "zh").trim() || "zh";

  return createAndDeliverNotification({
    type: "forum_post_replied",
    category: "interaction",
    title: hasReplyTarget
      ? `${actorName}回复了你的论坛留言`
      : `${actorName}回复了你的论坛帖子`,
    content: `${postTitle} · ${buildSnippet(params.reply_content, 100)}`,
    sender_uuid: params.actor_uuid,
    source_type: "forum_reply",
    source_uuid: params.reply_id,
    action_url: `/${locale}/home/forum/post/${params.post_id}`,
    payload: {
      post_id: params.post_id,
      reply_id: params.reply_id,
      reply_to_reply_id: params.reply_to_reply_id || "",
    },
    audience_type: "direct",
    recipientUuids: Array.from(recipients),
  });
}

export async function sendArtisanVerificationReviewNotification(params: {
  locale?: string;
  user_uuid: string;
  status: "approved" | "rejected";
  note?: string;
  reviewer_uuid?: string;
}) {
  const locale = String(params.locale || "zh").trim() || "zh";
  const approved = params.status === "approved";

  return createAndDeliverNotification({
    type: approved
      ? "artisan_verification_approved"
      : "artisan_verification_rejected",
    category: "review",
    title: approved ? "淘宝店铺认证已通过" : "淘宝店铺认证未通过",
    content: approved
      ? "管理员已通过你的淘宝店铺认证申请。"
      : `驳回原因：${buildSnippet(String(params.note || "").trim() || "请前往个人中心查看详情", 140)}`,
    sender_uuid: String(params.reviewer_uuid || "").trim(),
    source_type: "artisan_verification",
    source_uuid: params.user_uuid,
    action_url: `/${locale}/personal_center`,
    payload: {
      status: params.status,
      note: String(params.note || "").trim(),
    },
    audience_type: "direct",
    recipientUuids: [params.user_uuid],
  });
}

export async function sendOfflineExhibitionReviewNotification(params: {
  locale?: string;
  exhibition_uuid: string;
  exhibition_title?: string;
  user_uuid: string;
  status: "published" | "rejected";
  review_note?: string;
  reviewer_uuid?: string;
}) {
  const locale = String(params.locale || "zh").trim() || "zh";
  const approved = params.status === "published";

  return createAndDeliverNotification({
    type: approved
      ? "offline_exhibition_approved"
      : "offline_exhibition_rejected",
    category: "review",
    title: approved ? "你的展览已通过审核" : "你的展览未通过审核",
    content: approved
      ? `${String(params.exhibition_title || "").trim() || "展览"} 已发布到线下展览频道。`
      : `驳回原因：${buildSnippet(String(params.review_note || "").trim() || "请返回我的展览查看详情", 140)}`,
    sender_uuid: String(params.reviewer_uuid || "").trim(),
    source_type: "offline_exhibition",
    source_uuid: params.exhibition_uuid,
    action_url: `/${locale}/my-exhibitions`,
    payload: {
      exhibition_uuid: params.exhibition_uuid,
      status: params.status,
      review_note: String(params.review_note || "").trim(),
    },
    audience_type: "direct",
    recipientUuids: [params.user_uuid],
  });
}

export async function sendSystemMessage(params: {
  title: string;
  content?: string;
  category?: NotificationCategory;
  sender_uuid?: string;
  action_url?: string;
  audience_type: NotificationAudienceType;
  audience_value?: string;
  priority?: NotificationPriority;
  expires_at?: string | null;
}) {
  return createAndDeliverNotification({
    type: "system_message",
    category: params.category || "system",
    title: params.title,
    content: params.content || "",
    sender_uuid: params.sender_uuid,
    action_url: params.action_url,
    audience_type: params.audience_type,
    audience_value: params.audience_value,
    priority: params.priority,
    expires_at: params.expires_at || null,
  });
}

export function describeNotificationAudience(
  audienceType: NotificationAudienceType,
  audienceValue?: string
) {
  if (audienceType === "all") return "全部用户";
  if (audienceType === "role") {
    const role = String(audienceValue || "").trim();
    if (role === "artisan") return "匠人";
    if (role === "admin") return "管理员";
    if (role === "user") return "普通用户";
    return `角色：${role || "未指定"}`;
  }
  return `指定用户：${String(audienceValue || "").trim() || "未指定"}`;
}

export function describeNotificationType(type: NotificationType) {
  switch (type) {
    case "announcement_published":
      return "公告发布";
    case "home_post_commented":
      return "帖子评论";
    case "home_post_replied":
      return "评论回复";
    case "forum_post_replied":
      return "论坛回复";
    case "offline_exhibition_approved":
      return "展览通过";
    case "offline_exhibition_rejected":
      return "展览驳回";
    case "artisan_verification_approved":
      return "认证通过";
    case "artisan_verification_rejected":
      return "认证驳回";
    case "system_message":
    default:
      return "系统消息";
  }
}

export function describeNotificationCategory(category: NotificationCategory) {
  if (category === "interaction") return "互动";
  if (category === "review") return "审核";
  return "系统";
}
