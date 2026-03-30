import {
  deleteAiChatConversationsByUuids,
  deleteAllAiChatConversationsByUserUuid,
  getAiChatConversationsByUserUuid,
  upsertAiChatConversations,
} from "@/models/ai-chat";
import { respData, respErr, respJson } from "@/lib/resp";
import { getIsoTimestr } from "@/lib/time";
import { getUserUuid } from "@/services/user";
import { AiChatConversation } from "@/types/ai-chat";

function normalizeConversation(
  raw: any,
  user_uuid: string
): AiChatConversation | null {
  const uuid = String(raw?.uuid || "").trim();
  const title = String(raw?.title || "").trim();
  const locale = String(raw?.locale || "").trim();
  const updated_at = String(raw?.updated_at || "").trim() || getIsoTimestr();
  const created_at = String(raw?.created_at || "").trim() || updated_at;
  const messages = Array.isArray(raw?.messages)
    ? raw.messages
        .filter(
          (item: any) =>
            item &&
            (item.role === "user" || item.role === "assistant") &&
            typeof item.content === "string" &&
            item.content.trim()
        )
        .map((item: any) => ({
          id: String(item.id || ""),
          role: item.role === "assistant" ? "assistant" : "user",
          content: String(item.content || ""),
          error: Boolean(item.error),
        }))
        .filter((item: any) => item.id && item.content.trim())
    : [];

  if (!uuid || !title || messages.length === 0) {
    return null;
  }

  return {
    uuid,
    user_uuid,
    title,
    locale,
    messages,
    created_at,
    updated_at,
  };
}

export async function GET() {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respJson(-2, "no auth");
    }

    const conversations = await getAiChatConversationsByUserUuid(user_uuid);
    return respData(conversations);
  } catch (error) {
    console.error("get ai chat conversations failed:", error);
    return respErr("get conversations failed");
  }
}

export async function POST(req: Request) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respJson(-2, "no auth");
    }

    const { conversation, conversations } = await req.json();
    const source = Array.isArray(conversations)
      ? conversations
      : conversation
        ? [conversation]
        : [];

    const normalized = source
      .map((item) => normalizeConversation(item, user_uuid))
      .filter(Boolean) as AiChatConversation[];

    if (normalized.length === 0) {
      return respErr("invalid conversations");
    }

    await upsertAiChatConversations(normalized);
    return respData({ ok: true, count: normalized.length });
  } catch (error) {
    console.error("save ai chat conversations failed:", error);
    return respErr("save conversations failed");
  }
}

export async function DELETE(req: Request) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respJson(-2, "no auth");
    }

    const { ids, delete_all } = await req.json();
    if (delete_all === true) {
      await deleteAllAiChatConversationsByUserUuid(user_uuid);
      return respData({ ok: true, delete_all: true });
    }

    const normalizedIds = Array.isArray(ids)
      ? ids.map((item) => String(item || "").trim()).filter(Boolean)
      : [];

    if (normalizedIds.length === 0) {
      return respErr("invalid ids");
    }

    await deleteAiChatConversationsByUuids(user_uuid, normalizedIds);
    return respData({ ok: true, count: normalizedIds.length });
  } catch (error) {
    console.error("delete ai chat conversations failed:", error);
    return respErr("delete conversations failed");
  }
}
