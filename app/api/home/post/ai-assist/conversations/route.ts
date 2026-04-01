import {
  getHomePostAiAssistConversationByPostUuid,
  upsertHomePostAiAssistConversation,
} from "@/models/home-post-ai-assist";
import { respData, respErr, respJson } from "@/lib/resp";
import { getIsoTimestr } from "@/lib/time";
import { getUserUuid } from "@/services/user";
import {
  HomePostAiAssistConversation,
  HomePostAiAssistMessage,
  HomePostAiDecision,
  HomePostAiPatch,
  HomePostAiTargetField,
} from "@/types/home-post-ai-assist";

function normalizeTags(input: unknown) {
  if (!Array.isArray(input)) return [];

  return Array.from(
    new Set(
      input
        .map((item) => String(item || "").trim().replace(/^#/, ""))
        .filter(Boolean)
    )
  ).slice(0, 10);
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

function normalizeTargetField(input: unknown): HomePostAiTargetField | undefined {
  const value = String(input || "").trim();
  if (
    value === "title" ||
    value === "excerpt" ||
    value === "content" ||
    value === "tags"
  ) {
    return value;
  }

  return undefined;
}

function normalizeDecision(input: unknown): HomePostAiDecision | undefined {
  const value = String(input || "").trim();
  if (value === "pending" || value === "applied" || value === "rejected") {
    return value;
  }

  return undefined;
}

function normalizeMessages(input: unknown): HomePostAiAssistMessage[] {
  if (!Array.isArray(input)) return [];

  return input
    .filter((item) => item && typeof item === "object")
    .map((item: any) => ({
      id: String(item.id || "").trim(),
      role: (item.role === "assistant" ? "assistant" : "user") as
        | "assistant"
        | "user",
      content: String(item.content || "").trim(),
      target_field: normalizeTargetField(item.target_field),
      patch: normalizePatch(item.patch),
      decision: normalizeDecision(item.decision),
      decision_at: String(item.decision_at || "").trim() || undefined,
      created_at: String(item.created_at || "").trim() || undefined,
    }))
    .filter((item) => item.id && item.content);
}

function normalizeConversation(
  raw: any,
  user_uuid: string
): HomePostAiAssistConversation | null {
  const uuid = String(raw?.uuid || "").trim();
  const post_uuid = String(raw?.post_uuid || "").trim();
  const locale = String(raw?.locale || "").trim();
  const title = String(raw?.title || "").trim() || "AI助理";
  const updated_at = String(raw?.updated_at || "").trim() || getIsoTimestr();
  const created_at = String(raw?.created_at || "").trim() || updated_at;
  const messages = normalizeMessages(raw?.messages);

  if (!uuid || !post_uuid || messages.length === 0) {
    return null;
  }

  return {
    uuid,
    user_uuid,
    post_uuid,
    locale,
    title,
    messages,
    created_at,
    updated_at,
  };
}

export async function GET(req: Request) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respJson(-2, "no auth");
    }

    const { searchParams } = new URL(req.url);
    const post_uuid = String(searchParams.get("post_uuid") || "").trim();
    if (!post_uuid) {
      return respErr("post_uuid is required");
    }

    const conversation = await getHomePostAiAssistConversationByPostUuid(
      user_uuid,
      post_uuid
    );

    return respData({
      conversation: conversation || null,
    });
  } catch (error) {
    console.error("get home post ai assist conversation failed:", error);
    return respErr("get ai assist conversation failed");
  }
}

export async function POST(req: Request) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respJson(-2, "no auth");
    }

    const { conversation } = await req.json();
    const normalized = normalizeConversation(conversation, user_uuid);
    if (!normalized) {
      return respErr("invalid conversation");
    }

    const saved = await upsertHomePostAiAssistConversation(normalized);
    return respData(saved);
  } catch (error) {
    console.error("save home post ai assist conversation failed:", error);
    return respErr("save ai assist conversation failed");
  }
}
