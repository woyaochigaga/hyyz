import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";
import { respData, respErr } from "@/lib/resp";
import {
  AI_POST_ASSIST_SYSTEM_PROMPT_EN,
  AI_POST_ASSIST_SYSTEM_PROMPT_ZH,
} from "@/lib/ai/prompts";
import { HomePostAiPatch, HomePostAiTargetField } from "@/types/home-post-ai-assist";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AssistFieldSnapshot = {
  title?: string;
  excerpt?: string;
  content?: string;
  tags?: unknown;
};

type NormalizedAssistFields = {
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
};

type AssistHistoryItem = {
  role?: "user" | "assistant";
  content?: string;
  target_field?: HomePostAiTargetField;
};

const TARGET_FIELD_LABEL: Record<HomePostAiTargetField, string> = {
  title: "标题",
  excerpt: "导语/摘要",
  content: "正文内容",
  tags: "标签",
};

function getDashScopeConfig() {
  const apiKey =
    process.env.DASHSCOPE_API_KEY || process.env.BAILIAN_API_KEY || "";
  const baseURL =
    process.env.DASHSCOPE_BASE_URL ||
    process.env.BAILIAN_BASE_URL ||
    "https://dashscope.aliyuncs.com/compatible-mode/v1";

  return { apiKey, baseURL };
}

function getModel() {
  return (
    process.env.DASHSCOPE_CHAT_MODEL ||
    process.env.BAILIAN_CHAT_MODEL ||
    "qwen-plus"
  );
}

function buildSystemPrompt(locale?: string) {
  if ((locale || "").toLowerCase().startsWith("zh")) {
    return AI_POST_ASSIST_SYSTEM_PROMPT_ZH;
  }

  return AI_POST_ASSIST_SYSTEM_PROMPT_EN;
}

function cleanJsonText(value: string) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";

  const withoutFence = trimmed
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return withoutFence.slice(start, end + 1);
  }

  return withoutFence;
}

function normalizeTags(value: unknown) {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .map((item) => String(item || "").trim().replace(/^#/, ""))
          .filter(Boolean)
      )
    ).slice(0, 10);
  }

  if (typeof value === "string") {
    return Array.from(
      new Set(
        value
          .split(/[,，\n]/)
          .map((item) => item.trim().replace(/^#/, ""))
          .filter(Boolean)
      )
    ).slice(0, 10);
  }

  return [];
}

function normalizeTargetField(
  value: unknown,
  type: string
): HomePostAiTargetField {
  const field = String(value || "").trim();
  if (field === "title" || field === "excerpt" || field === "tags") {
    return field;
  }
  if (field === "content" && type !== "video") {
    return "content";
  }

  return type === "video" ? "excerpt" : "content";
}

function normalizePatch(
  target_field: HomePostAiTargetField,
  value: unknown
): HomePostAiPatch {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const raw = value as Record<string, unknown>;
  switch (target_field) {
    case "title":
      return typeof raw.title === "string" && raw.title.trim()
        ? { title: raw.title.trim() }
        : {};
    case "excerpt":
      return typeof raw.excerpt === "string" && raw.excerpt.trim()
        ? { excerpt: raw.excerpt.trim() }
        : {};
    case "content":
      return typeof raw.content === "string" && raw.content.trim()
        ? { content: raw.content.trim() }
        : {};
    case "tags": {
      const tags = normalizeTags(raw.tags);
      return tags.length > 0 ? { tags } : {};
    }
    default:
      return {};
  }
}

function getFallbackPatch(
  target_field: HomePostAiTargetField,
  fields: NormalizedAssistFields
): HomePostAiPatch {
  switch (target_field) {
    case "title":
      return fields.title ? { title: fields.title } : {};
    case "excerpt":
      return fields.excerpt ? { excerpt: fields.excerpt } : {};
    case "content":
      return fields.content ? { content: fields.content } : {};
    case "tags":
      return fields.tags.length > 0 ? { tags: fields.tags } : {};
    default:
      return {};
  }
}

function normalizeHistory(value: unknown, type: string): AssistHistoryItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item) => item && typeof item === "object")
    .map((item: any) => ({
      role: (item.role === "assistant" ? "assistant" : "user") as
        | "assistant"
        | "user",
      content: String(item.content || "").trim(),
      target_field: normalizeTargetField(item.target_field, type),
    }))
    .filter((item) => item.content)
    .slice(-6);
}

function buildPrompt(input: {
  type: string;
  target_field: HomePostAiTargetField;
  instruction: string;
  fields: NormalizedAssistFields;
  history: AssistHistoryItem[];
}) {
  const { type, target_field, instruction, fields, history } = input;
  const currentFieldValue =
    target_field === "title"
      ? fields.title
      : target_field === "excerpt"
        ? fields.excerpt
        : target_field === "content"
          ? fields.content
          : fields.tags.join("、");

  const historyText =
    history.length > 0
      ? history
          .map(
            (item) =>
              `${item.role === "assistant" ? "AI" : "用户"}（${TARGET_FIELD_LABEL[item.target_field || target_field]}）: ${String(
                item.content || ""
              )
                .replace(/\s+/g, " ")
                .slice(0, 240)}`
          )
          .join("\n")
      : "（无）";

  return `
你现在要像 Cursor / Trae 那样，针对单个字段返回“可直接应用”的修改结果。

作品类型：${type}
本次目标字段：${target_field}
目标字段中文名：${TARGET_FIELD_LABEL[target_field]}

当前字段内容：
${currentFieldValue || "（空）"}

当前草稿上下文：
- 标题：${fields.title || "（空）"}
- 导语/摘要：${fields.excerpt || "（空）"}
- 正文：
${fields.content || "（空）"}
- 标签：${fields.tags.length > 0 ? fields.tags.join("、") : "（空）"}

最近对话：
${historyText}

用户本次要求：
${instruction}

请只返回 JSON，结构如下：
{
  "reply": "给编辑器右侧面板展示的 Markdown 回复。可以用标题、列表、重点说明。",
  "target_field": "${target_field}",
  "patch": {
    "${target_field}": "或数组，根据目标字段返回"
  }
}

严格要求：
1. reply 必须是 Markdown 字符串，简洁说明你改了什么、为什么这样改。
2. patch 只能返回本次目标字段，不要顺带修改其它字段。
3. 如果目标字段是 content，patch.content 必须是可直接写回编辑器的完整 Markdown 正文，不能混入解释文字。
4. 如果目标字段是 title 或 excerpt，patch 对应字段必须是纯文本字符串。
5. 如果目标字段是 tags，patch.tags 必须是 3 到 8 个字符串数组，不带 #。
6. 不要编造事实。如果原文信息不足，只能基于已有内容重写、整理、提炼。
7. 最终输出必须是 JSON 对象，不要加代码块，不要输出额外说明。
`.trim();
}

function normalizeResult(
  rawText: string,
  target_field: HomePostAiTargetField,
  type: string,
  fields: NormalizedAssistFields
) {
  const cleaned = cleanJsonText(rawText);

  try {
    const parsed = JSON.parse(cleaned);
    const normalizedTarget = normalizeTargetField(parsed?.target_field, type);
    const reply =
      typeof parsed?.reply === "string" && parsed.reply.trim()
        ? parsed.reply.trim()
        : rawText.trim();
    const patch = normalizePatch(normalizedTarget, parsed?.patch);

    return {
      reply: reply || "已生成修改建议。",
      target_field: normalizedTarget,
      patch:
        Object.keys(patch).length > 0
          ? patch
          : getFallbackPatch(normalizedTarget, fields),
    };
  } catch {
    return {
      reply: rawText.trim() || "已生成修改建议。",
      target_field,
      patch: getFallbackPatch(target_field, fields),
    };
  }
}

export async function POST(req: Request) {
  try {
    const { locale, type, target_field, instruction, fields, history } =
      await req.json();

    const safeType = String(type || "text").trim() || "text";
    const safeTargetField = normalizeTargetField(target_field, safeType);
    const safeInstruction = String(instruction || "").trim();
    const safeFields = {
      title: String(fields?.title || "").trim(),
      excerpt: String(fields?.excerpt || "").trim(),
      content: String(fields?.content || "").trim(),
      tags: normalizeTags(fields?.tags),
    };
    const safeHistory = normalizeHistory(history, safeType);

    if (!safeInstruction) {
      return respErr("请先输入你想让 AI 修改的要求");
    }

    if (safeType === "video" && safeTargetField === "content") {
      return respErr("视频类型不支持正文 Markdown 改写");
    }

    const { apiKey, baseURL } = getDashScopeConfig();
    if (!apiKey) {
      return respErr("DASHSCOPE_API_KEY is not set");
    }

    const dashscope = createOpenAICompatible({
      name: "dashscope",
      apiKey,
      baseURL,
    });

    const modelName = getModel();
    const prompt = buildPrompt({
      type: safeType,
      target_field: safeTargetField,
      instruction: safeInstruction,
      fields: safeFields,
      history: safeHistory,
    });

    const { text } = await generateText({
      model: dashscope(modelName),
      temperature: 0.5,
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(locale),
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    return respData(
      normalizeResult(text, safeTargetField, safeType, safeFields)
    );
  } catch (error: any) {
    console.error("home post ai assist failed:", error);
    return respErr(error?.message || "ai assist failed");
  }
}
