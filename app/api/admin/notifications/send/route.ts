import { respData, respErr, respJson } from "@/lib/resp";
import { sendSystemMessage } from "@/models/notification";
import { getUserInfo } from "@/services/user";

async function requireAdmin() {
  const admin = await getUserInfo();
  if (!admin?.email) {
    return { error: respJson(-2, "no auth") };
  }

  const adminEmails = process.env.ADMIN_EMAILS?.split(",").map((item) => item.trim());
  if (!adminEmails?.includes(admin.email)) {
    return { error: respErr("No access") };
  }

  return { admin };
}

export async function POST(req: Request) {
  const access = await requireAdmin();
  if (access.error) {
    return access.error;
  }

  const body = (await req.json()) as {
    title?: string;
    content?: string;
    category?: string;
    audience_type?: string;
    audience_value?: string;
    action_url?: string;
    priority?: string;
    expires_at?: string;
  };

  const title = String(body?.title || "").trim();
  if (!title) {
    return respErr("标题不能为空");
  }

  const audience_type = String(body?.audience_type || "").trim();
  if (!["all", "role", "direct"].includes(audience_type)) {
    return respErr("无效的发送范围");
  }

  if (audience_type !== "all" && !String(body?.audience_value || "").trim()) {
    return respErr("请填写发送对象");
  }

  const notification = await sendSystemMessage({
    title,
    content: String(body?.content || "").trim(),
    category:
      body?.category === "interaction" || body?.category === "review"
        ? body.category
        : "system",
    sender_uuid: access.admin.uuid,
    action_url: String(body?.action_url || "").trim(),
    audience_type: audience_type as "all" | "role" | "direct",
    audience_value: String(body?.audience_value || "").trim(),
    priority:
      body?.priority === "low" || body?.priority === "high"
        ? body.priority
        : "normal",
    expires_at: String(body?.expires_at || "").trim() || null,
  });

  return respData(notification);
}
