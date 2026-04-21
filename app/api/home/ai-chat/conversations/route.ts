import {
  deleteAiChatConversationsByUuids,
  deleteAllAiChatConversationsByUserUuid,
  getAiChatConversationsByUserUuid,
  upsertAiChatConversations,
} from "@/models/ai-chat";
import { respData, respErr, respJson } from "@/lib/resp";
import { getIsoTimestr } from "@/lib/time";
import { getUserUuid } from "@/services/user";
import {
  AiChatAttachment,
  AiChatConversation,
  AiChatMessage,
} from "@/types/ai-chat";

function normalizeAttachments(raw: unknown): AiChatAttachment[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((item) => item && typeof item === "object")
    .map((item: any): AiChatAttachment => ({
      type: item.type === "video" ? "video" : "image",
      url: String(item.url || "").trim(),
      key: String(item.key || "").trim(),
      filename: String(item.filename || "").trim(),
      contentType: String(item.contentType || item.content_type || "").trim(),
      size:
        typeof item.size === "number" && Number.isFinite(item.size)
          ? item.size
          : undefined,
    }))
    .filter((item) => item.url);
}

function normalizeMessages(raw: unknown): AiChatMessage[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((item) => item && typeof item === "object")
    .map((item: any): AiChatMessage => ({
      id: String(item.id || "").trim(),
      role: item.role === "assistant" ? "assistant" : "user",
      content: String(item.content || ""),
      reasoning: String(item.reasoning || ""),
      model: String(item.model || ""),
      attachments: normalizeAttachments(item.attachments),
      error: Boolean(item.error),
    }))
    .filter(
      (item) =>
        item.id && (item.content.trim() || (item.attachments?.length ?? 0) > 0)
    );
}

function normalizeConversation(
  raw: any,
  user_uuid: string
): AiChatConversation | null {
  const uuid = String(raw?.uuid || "").trim();
  const title = String(raw?.title || "").trim();
  const locale = String(raw?.locale || "").trim();
  const updated_at = String(raw?.updated_at || "").trim() || getIsoTimestr();
  const created_at = String(raw?.created_at || "").trim() || updated_at;
  const messages = normalizeMessages(raw?.messages);

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
