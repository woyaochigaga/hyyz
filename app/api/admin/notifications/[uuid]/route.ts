import { respData, respErr, respJson, respOk } from "@/lib/resp";
import {
  deleteNotificationEvent,
  extendNotificationExpiry,
  findNotificationEventByUuid,
  revokeNotificationEvent,
  updateNotificationEvent,
} from "@/models/notification";
import { getAdminUserInfo } from "@/services/user";

async function requireAdmin() {
  const admin = await getAdminUserInfo();
  if (!admin?.uuid) {
    return { error: respJson(-2, "no auth") };
  }

  return { admin };
}

export async function GET(
  _req: Request,
  { params }: { params: { uuid: string } }
) {
  const access = await requireAdmin();
  if (access.error) return access.error;

  const item = await findNotificationEventByUuid(params.uuid);
  if (!item) return respErr("消息不存在");
  return respData(item);
}

export async function PATCH(
  req: Request,
  { params }: { params: { uuid: string } }
) {
  const access = await requireAdmin();
  if (access.error) return access.error;

  const body = (await req.json()) as {
    action?: string;
    title?: string;
    content?: string;
    category?: string;
    audience_type?: string;
    audience_value?: string;
    action_url?: string;
    priority?: string;
    status?: string;
    expires_at?: string | null;
    extend_hours?: number;
  };

  const action = String(body.action || "update").trim();

  if (action === "extend") {
    const result = await extendNotificationExpiry(
      params.uuid,
      Number(body.extend_hours || 24)
    );
    return respData(result);
  }

  if (action === "promote") {
    const result = await updateNotificationEvent(params.uuid, {
      priority: "high",
      status: "active",
    });
    return respData(result);
  }

  if (action === "revoke") {
    const result = await revokeNotificationEvent(params.uuid);
    return respData(result);
  }

  const title = String(body.title || "").trim();
  if (!title) {
    return respErr("标题不能为空");
  }

  const audience_type = String(body.audience_type || "").trim();
  if (!["all", "role", "direct"].includes(audience_type)) {
    return respErr("无效的发送范围");
  }

  if (audience_type !== "all" && !String(body.audience_value || "").trim()) {
    return respErr("请填写发送对象");
  }

  const result = await updateNotificationEvent(params.uuid, {
    title,
    content: String(body.content || "").trim(),
    category:
      body.category === "interaction" || body.category === "review"
        ? body.category
        : "system",
    action_url: String(body.action_url || "").trim(),
    audience_type: audience_type as "all" | "role" | "direct",
    audience_value: String(body.audience_value || "").trim(),
    priority:
      body.priority === "low" || body.priority === "high" ? body.priority : "normal",
    status: body.status === "revoked" ? "revoked" : "active",
    expires_at: String(body.expires_at || "").trim() || null,
  });

  return respData(result);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { uuid: string } }
) {
  const access = await requireAdmin();
  if (access.error) return access.error;

  await deleteNotificationEvent(params.uuid);
  return respOk();
}
