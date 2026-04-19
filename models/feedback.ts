import { getUuid } from "@/lib/hash";
import { getIsoTimestr } from "@/lib/time";
import { getSupabaseClient } from "@/models/db";
import type {
  FeedbackItem,
  FeedbackPriority,
  FeedbackSource,
  FeedbackStatus,
} from "@/types/feedback";

type FeedbackItemRow = {
  uuid: string;
  user_uuid?: string;
  user_email?: string;
  user_nickname?: string;
  source?: FeedbackSource;
  locale?: string;
  contact?: string;
  content?: string;
  context?: Record<string, unknown> | string | null;
  status?: FeedbackStatus;
  priority?: FeedbackPriority;
  admin_note?: string;
  created_at?: string;
  updated_at?: string;
  resolved_at?: string | null;
};

type CreateFeedbackInput = {
  user_uuid?: string;
  user_email?: string;
  user_nickname?: string;
  source?: FeedbackSource;
  locale?: string;
  contact?: string;
  content: string;
  context?: Record<string, unknown>;
};

function normalizeContext(input: unknown): Record<string, unknown> {
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

function normalizeSource(value: unknown): FeedbackSource {
  return value === "home_general" ? "home_general" : "home_ai_chat";
}

function normalizeStatus(value: unknown): FeedbackStatus {
  if (
    value === "new" ||
    value === "in_progress" ||
    value === "resolved" ||
    value === "closed"
  ) {
    return value;
  }
  return "new";
}

function normalizePriority(value: unknown): FeedbackPriority {
  if (value === "high" || value === "urgent" || value === "normal") {
    return value;
  }
  return "normal";
}

function toFeedbackItem(row: FeedbackItemRow): FeedbackItem {
  return {
    uuid: String(row.uuid || "").trim(),
    user_uuid: String(row.user_uuid || "").trim(),
    user_email: String(row.user_email || "").trim(),
    user_nickname: String(row.user_nickname || "").trim(),
    source: normalizeSource(row.source),
    locale: String(row.locale || "").trim(),
    contact: String(row.contact || "").trim(),
    content: String(row.content || "").trim(),
    context: normalizeContext(row.context),
    status: normalizeStatus(row.status),
    priority: normalizePriority(row.priority),
    admin_note: String(row.admin_note || "").trim(),
    created_at: row.created_at || "",
    updated_at: row.updated_at || "",
    resolved_at: row.resolved_at || null,
  };
}

export async function createFeedback(input: CreateFeedbackInput) {
  const supabase = getSupabaseClient();
  const now = getIsoTimestr();
  const uuid = getUuid();

  const { error } = await supabase.from("feedback_items").insert({
    uuid,
    user_uuid: String(input.user_uuid || "").trim(),
    user_email: String(input.user_email || "").trim(),
    user_nickname: String(input.user_nickname || "").trim(),
    source: normalizeSource(input.source),
    locale: String(input.locale || "").trim(),
    contact: String(input.contact || "").trim(),
    content: String(input.content || "").trim(),
    context: input.context || {},
    status: "new",
    priority: "normal",
    admin_note: "",
    created_at: now,
    updated_at: now,
    resolved_at: null,
  });

  if (error) throw error;

  return findFeedbackItemByUuid(uuid);
}

export async function findFeedbackItemByUuid(uuid: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("feedback_items")
    .select("*")
    .eq("uuid", uuid)
    .limit(1)
    .single();

  if (error || !data) return undefined;
  return toFeedbackItem(data as FeedbackItemRow);
}

export async function listFeedbackItemsForAdmin(limit: number = 100) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("feedback_items")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as FeedbackItemRow[]).map(toFeedbackItem);
}

export async function updateFeedbackItem(
  uuid: string,
  patch: Partial<
    Pick<
      FeedbackItem,
      "content" | "contact" | "status" | "priority" | "admin_note"
    >
  >
) {
  const supabase = getSupabaseClient();
  const current = await findFeedbackItemByUuid(uuid);
  if (!current) {
    throw new Error("反馈不存在");
  }

  const normalizedPatch: Record<string, unknown> = {
    updated_at: getIsoTimestr(),
  };

  if (typeof patch.content === "string") {
    normalizedPatch.content = patch.content.trim();
  }
  if (typeof patch.contact === "string") {
    normalizedPatch.contact = patch.contact.trim();
  }
  if (typeof patch.priority !== "undefined") {
    normalizedPatch.priority = normalizePriority(patch.priority);
  }
  if (typeof patch.admin_note === "string") {
    normalizedPatch.admin_note = patch.admin_note.trim();
  }
  if (typeof patch.status !== "undefined") {
    const nextStatus = normalizeStatus(patch.status);
    normalizedPatch.status = nextStatus;
    if (nextStatus === "resolved" || nextStatus === "closed") {
      normalizedPatch.resolved_at = current.resolved_at || getIsoTimestr();
    } else {
      normalizedPatch.resolved_at = null;
    }
  }

  const { error } = await supabase
    .from("feedback_items")
    .update(normalizedPatch)
    .eq("uuid", uuid);

  if (error) throw error;

  return findFeedbackItemByUuid(uuid);
}

export async function deleteFeedbackItem(uuid: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("feedback_items").delete().eq("uuid", uuid);
  if (error) throw error;
}
