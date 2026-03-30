import { getSupabaseClient } from "@/models/db";
import { AiChatConversation, AiChatMessage } from "@/types/ai-chat";

function normalizeMessages(messages: unknown): AiChatMessage[] {
  if (!Array.isArray(messages)) return [];

  return messages
    .filter((item) => item && typeof item === "object")
    .map((item: any) => ({
      id: String(item.id || ""),
      role: (item.role === "assistant" ? "assistant" : "user") as
        | "assistant"
        | "user",
      content: String(item.content || ""),
      error: Boolean(item.error),
    }))
    .filter((item) => item.id && item.content.trim());
}

function serializeConversation(conversation: AiChatConversation) {
  return {
    uuid: conversation.uuid,
    user_uuid: conversation.user_uuid || "",
    title: conversation.title || "",
    locale: conversation.locale || "",
    messages: JSON.stringify(normalizeMessages(conversation.messages)),
    created_at: conversation.created_at || null,
    updated_at: conversation.updated_at || null,
  };
}

function deserializeConversation(row: any): AiChatConversation {
  let parsedMessages: unknown = [];

  try {
    parsedMessages = JSON.parse(row.messages || "[]");
  } catch {
    parsedMessages = [];
  }

  return {
    id: row.id,
    uuid: row.uuid,
    user_uuid: row.user_uuid,
    title: row.title || "",
    locale: row.locale || "",
    messages: normalizeMessages(parsedMessages),
    created_at: row.created_at || "",
    updated_at: row.updated_at || "",
  };
}

export async function getAiChatConversationsByUserUuid(
  user_uuid: string
): Promise<AiChatConversation[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("ai_chat_conversations")
    .select("*")
    .eq("user_uuid", user_uuid)
    .order("updated_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map(deserializeConversation);
}

export async function upsertAiChatConversations(
  conversations: AiChatConversation[]
) {
  const supabase = getSupabaseClient();
  const payload = conversations.map(serializeConversation);
  const { data, error } = await supabase
    .from("ai_chat_conversations")
    .upsert(payload, { onConflict: "uuid" });

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteAiChatConversationsByUuids(
  user_uuid: string,
  uuids: string[]
) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("ai_chat_conversations")
    .delete()
    .eq("user_uuid", user_uuid)
    .in("uuid", uuids);

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteAllAiChatConversationsByUserUuid(user_uuid: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("ai_chat_conversations")
    .delete()
    .eq("user_uuid", user_uuid);

  if (error) {
    throw error;
  }

  return data;
}
