import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { streamText } from "ai";
import { respData, respErr } from "@/lib/resp";
import {
  AI_CHAT_SYSTEM_PROMPT_EN,
  AI_CHAT_SYSTEM_PROMPT_ZH,
} from "@/lib/ai/prompts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatMessage = {
  role?: "user" | "assistant";
  content?: string;
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
        typeof item.content === "string" &&
        item.content.trim()
    )
    .slice(-20)
    .map((item) => ({
      role: item.role as "user" | "assistant",
      content: item.content!.trim(),
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

    const result = await streamText({
      model: dashscope(modelName),
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

          for await (const chunk of result.textStream) {
            if (!chunk) continue;
            send("delta", { text: chunk });
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
