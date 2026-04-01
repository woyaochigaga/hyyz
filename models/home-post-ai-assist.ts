import { getSupabaseClient } from "@/models/db";
import {
  HomePostAiAssistConversation,
  HomePostAiAssistMessage,
  HomePostAiPatch,
} from "@/types/home-post-ai-assist";

function normalizeTags(input: unknown) {
  if (!Array.isArray(input)) return [];

  return input
    .map((item) => String(item || "").trim().replace(/^#/, ""))
    .filter(Boolean)
    .slice(0, 10);
}

function normalizePatch(input: unknown): HomePostAiPatch | undefined {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return undefined;
  }

  const raw = input as Record<string, unknown>;
  const patch: HomePostAiPatch = {};

  if (typeof raw.title === "string" && raw.title.trim()) {
    patch.title = raw.title.trim();
  }

  if (typeof raw.excerpt === "string" && raw.excerpt.trim()) {
    patch.excerpt = raw.excerpt.trim();
  }

  if (typeof raw.content === "string" && raw.content.trim()) {
    patch.content = raw.content.trim();
  }

  const tags = normalizeTags(raw.tags);
  if (tags.length > 0) {
    patch.tags = tags;
  }

  return Object.keys(patch).length > 0 ? patch : undefined;
}

function normalizeMessages(messages: unknown): HomePostAiAssistMessage[] {
  if (!Array.isArray(messages)) return [];

  return messages
    .filter((item) => item && typeof item === "object")
    .map((item: any) => ({
      id: String(item.id || "").trim(),
      role: (item.role === "assistant" ? "assistant" : "user") as
        | "assistant"
        | "user",
      content: String(item.content || "").trim(),
      target_field:
        item.target_field === "title" ||
        item.target_field === "excerpt" ||
        item.target_field === "content" ||
        item.target_field === "tags"
          ? item.target_field
          : undefined,
      patch: normalizePatch(item.patch),
      decision:
        item.decision === "applied" ||
        item.decision === "rejected" ||
        item.decision === "pending"
          ? item.decision
          : undefined,
      decision_at: String(item.decision_at || "").trim() || undefined,
      created_at: String(item.created_at || "").trim() || undefined,
    }))
    .filter((item) => item.id && item.content);
}

function serializeConversation(conversation: HomePostAiAssistConversation) {
  return {
    uuid: conversation.uuid,
    user_uuid: conversation.user_uuid || "",
    post_uuid: conversation.post_uuid || "",
    locale: conversation.locale || "",
    title: conversation.title || "",
    messages: JSON.stringify(normalizeMessages(conversation.messages)),
    created_at: conversation.created_at || null,
    updated_at: conversation.updated_at || null,
  };
}

function deserializeConversation(row: any): HomePostAiAssistConversation {
  let parsedMessages: unknown = [];

  try {
    parsedMessages = JSON.parse(row.messages || "[]");
  } catch {
    parsedMessages = [];
  }

  return {
    id: row.id,
    uuid: row.uuid,
    user_uuid: row.user_uuid || "",
    post_uuid: row.post_uuid || "",
    locale: row.locale || "",
    title: row.title || "",
    messages: normalizeMessages(parsedMessages),
    created_at: row.created_at || "",
    updated_at: row.updated_at || "",
  };
}

export async function getHomePostAiAssistConversationByPostUuid(
  user_uuid: string,
  post_uuid: string
) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("home_post_ai_assist_conversations")
    .select("*")
    .eq("user_uuid", user_uuid)
    .eq("post_uuid", post_uuid)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return deserializeConversation(data);
}

export async function upsertHomePostAiAssistConversation(
  conversation: HomePostAiAssistConversation
) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("home_post_ai_assist_conversations")
    .upsert(serializeConversation(conversation), { onConflict: "uuid" })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return deserializeConversation(data);
}
