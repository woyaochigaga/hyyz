import { respData, respErr } from "@/lib/resp";
import { getClientIp } from "@/lib/ip";
import { checkSimpleRateLimit } from "@/lib/simple-rate-limit";
import { createFeedback } from "@/models/feedback";
import { getUserInfo } from "@/services/user";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    source?: string;
    locale?: string;
    contact?: string;
    content?: string;
    context?: Record<string, unknown>;
  };

  const content = String(body?.content || "").trim();
  if (!content) {
    return respErr("反馈内容不能为空");
  }
  if (content.length < 6) {
    return respErr("反馈内容过短");
  }
  if (content.length > 2000) {
    return respErr("反馈内容过长");
  }

  const user = await getUserInfo().catch(() => undefined);
  const ip = await getClientIp().catch(() => "");
  const limiter = checkSimpleRateLimit({
    key: `feedback:${String(user?.uuid || ip || "anonymous")}`,
    windowMs: 10 * 60 * 1000,
    max: 6,
  });
  if (!limiter.allowed) {
    return respErr("提交过于频繁，请稍后再试");
  }

  const item = await createFeedback({
    user_uuid: String(user?.uuid || "").trim(),
    user_email: String(user?.email || "").trim(),
    user_nickname: String(user?.nickname || "").trim(),
    source: body?.source === "home_general" ? "home_general" : "home_ai_chat",
    locale: String(body?.locale || "").trim(),
    contact: String(body?.contact || "").trim(),
    content,
    context:
      body?.context && typeof body.context === "object" && !Array.isArray(body.context)
        ? body.context
        : {},
  });

  return respData(item);
}
