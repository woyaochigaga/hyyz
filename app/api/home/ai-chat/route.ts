import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { extractReasoningMiddleware, streamText, wrapLanguageModel } from "ai";
import { respData, respErr } from "@/lib/resp";
import {
  AI_CHAT_SYSTEM_PROMPT_EN,
  AI_CHAT_SYSTEM_PROMPT_ZH,
} from "@/lib/ai/prompts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatAttachment = {
  type?: "image" | "video";
  url?: string;
  filename?: string;
  contentType?: string;
  size?: number;
};

type ChatMessage = {
  role?: "user" | "assistant";
  content?: string;
  attachments?: ChatAttachment[];
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

function getModel(deepThinking?: boolean) {
  if (deepThinking) {
    return (
      process.env.DASHSCOPE_DEEP_MODEL ||
      process.env.BAILIAN_DEEP_MODEL ||
      "qwq-plus"
    );
  }

  return (
    process.env.DASHSCOPE_CHAT_MODEL ||
    process.env.BAILIAN_CHAT_MODEL ||
    "qwen-plus"
  );
}

function buildSystemPrompt(locale?: string) {
  if ((locale || "").toLowerCase().startsWith("zh")) {
    return AI_CHAT_SYSTEM_PROMPT_ZH;
  }

  return AI_CHAT_SYSTEM_PROMPT_EN;
}

function normalizeMessages(messages: ChatMessage[]) {
  return messages
    .filter(
      (item) =>
        (item.role === "user" || item.role === "assistant") &&
        ((typeof item.content === "string" && item.content.trim()) ||
          (Array.isArray(item.attachments) && item.attachments.length > 0))
    )
    .slice(-20)
    .map((item) => ({
      role: item.role as "user" | "assistant",
      content: [
        String(item.content || "").trim(),
        ...(Array.isArray(item.attachments)
          ? item.attachments
              .filter((attachment) => attachment && String(attachment.url || "").trim())
              .map((attachment, index) => {
                const attachmentType =
                  attachment.type === "video" ? "视频" : "图片";
                const name = String(attachment.filename || "").trim();
                const contentType = String(attachment.contentType || "").trim();
                const size =
                  typeof attachment.size === "number" && Number.isFinite(attachment.size)
                    ? `${attachment.size} bytes`
                    : "";

                return [
                  `[用户上传${attachmentType}${index + 1}]`,
                  name ? `文件名: ${name}` : "",
                  contentType ? `类型: ${contentType}` : "",
                  size ? `大小: ${size}` : "",
                  `链接: ${String(attachment.url || "").trim()}`,
                  `请结合这份${attachmentType}素材回答；如果你无法直接读取链接内容，要明确说明，并基于用户文字描述与素材元数据给出分析建议。`,
                ]
                  .filter(Boolean)
                  .join("\n");
              })
          : []),
      ]
        .filter(Boolean)
        .join("\n\n"),
    }));
}

export async function POST(req: Request) {
  try {
    const { messages, locale, deepThinking } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return respErr("invalid messages");
    }

    const normalizedMessages = normalizeMessages(messages);
    if (normalizedMessages.length === 0) {
      return respErr("invalid messages");
    }

    const { apiKey, baseURL } = getDashScopeConfig();
    if (!apiKey) {
      return respErr("DASHSCOPE_API_KEY is not set");
    }

    const modelName = getModel(Boolean(deepThinking));
    const dashscope = createOpenAICompatible({
      name: "dashscope",
      apiKey,
      baseURL,
    });

    const baseModel = dashscope(modelName);
    const model = deepThinking
      ? (wrapLanguageModel({
          model: baseModel as any,
          middleware: extractReasoningMiddleware({
            tagName: "think",
          }),
        }) as any)
      : baseModel;

    const result = await streamText({
      model,
      temperature: deepThinking ? 0.3 : 0.7,
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(locale),
        },
        ...normalizedMessages,
      ],
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (event: string, data: Record<string, unknown>) => {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        };

        try {
          send("start", { model: modelName });

          for await (const part of result.fullStream) {
            if (part.type === "reasoning" && part.textDelta) {
              send("reasoning", { text: part.textDelta });
              continue;
            }

            if (part.type === "text-delta" && part.textDelta) {
              send("delta", { text: part.textDelta });
            }
          }

          send("done", { model: modelName });
        } catch (error: any) {
          console.error("home ai chat stream failed:", error);
          send("error", {
            message: error?.message || "ai chat failed",
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err: any) {
    console.error("home ai chat failed:", err);
    return respErr(err?.message || "ai chat failed");
  }
}
