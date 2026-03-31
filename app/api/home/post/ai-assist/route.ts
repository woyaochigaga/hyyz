import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";
import { respData, respErr } from "@/lib/resp";
import {
  AI_POST_ASSIST_SYSTEM_PROMPT_EN,
  AI_POST_ASSIST_SYSTEM_PROMPT_ZH,
} from "@/lib/ai/prompts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    return value
      .map((item) => String(item || "").trim().replace(/^#/, ""))
      .filter(Boolean)
      .slice(0, 6);
  }

  if (typeof value === "string") {
    return value
      .split(/[,，\n]/)
      .map((item) => item.trim().replace(/^#/, ""))
      .filter(Boolean)
      .slice(0, 6);
  }

  return [];
}

function normalizeResult(rawText: string, fallback: { title: string; content: string; tags: string[] }) {
  const cleaned = cleanJsonText(rawText);

  try {
    const parsed = JSON.parse(cleaned);
    return {
      title:
        typeof parsed?.title === "string" && parsed.title.trim()
          ? parsed.title.trim()
          : fallback.title,
      content:
        typeof parsed?.content === "string" && parsed.content.trim()
          ? parsed.content.trim()
          : fallback.content,
      tags: normalizeTags(parsed?.tags).length > 0 ? normalizeTags(parsed?.tags) : fallback.tags,
      notes: typeof parsed?.notes === "string" ? parsed.notes.trim() : "",
    };
  } catch {
    return {
      title: fallback.title,
      content: fallback.content,
      tags: fallback.tags,
      notes: rawText.trim(),
    };
  }
}

export async function POST(req: Request) {
  try {
    const {
      locale,
      type,
      title,
      content,
      tags,
      instruction,
    } = await req.json();

    const safeTitle = String(title || "").trim();
    const safeContent = String(content || "").trim();
    const safeInstruction = String(instruction || "").trim();
    const safeType = String(type || "text").trim() || "text";
    const safeTags = normalizeTags(tags);

    if (!safeTitle && !safeContent && safeTags.length === 0) {
      return respErr("缺少可优化的草稿内容");
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
    const prompt = `
请根据以下作品草稿，输出一个更适合发布的版本。

作品类型：${safeType}
当前标题：${safeTitle || "（空）"}
当前正文：
${safeContent || "（空）"}

当前标签：${safeTags.length > 0 ? safeTags.join("、") : "（空）"}
用户要求：${safeInstruction || "请在不改变原意的前提下，优化表达、标题和标签，让它更适合作品发布。"}

请只返回 JSON，结构如下：
{
  "title": "优化后的标题",
  "content": "优化后的正文",
  "tags": ["标签1", "标签2", "标签3"],
  "notes": "一句简短说明，解释优化方向"
}

要求：
1. 保留原始事实，不要虚构。
2. 标题更凝练、更适合展示。
3. 正文可适度润色、重组，但不要脱离原意。
4. 标签 3 到 6 个，不带 #。
5. 如果原文很短，也要尽量给出可发布版本。
`.trim();

    const { text } = await generateText({
      model: dashscope(modelName),
      temperature: 0.6,
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
      normalizeResult(text, {
        title: safeTitle,
        content: safeContent,
        tags: safeTags,
      })
    );
  } catch (error: any) {
    console.error("home post ai assist failed:", error);
    return respErr(error?.message || "ai assist failed");
  }
}
