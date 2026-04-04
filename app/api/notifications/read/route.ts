import { respData, respErr, respJson } from "@/lib/resp";
import { markNotificationsRead } from "@/models/notification";
import { getUserUuid } from "@/services/user";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user_uuid = await getUserUuid();
  if (!user_uuid) {
    return respJson(-2, "no auth");
  }

  const body = (await req.json()) as {
    notification_uuids?: string[];
  };
  const notification_uuids = Array.isArray(body?.notification_uuids)
    ? body.notification_uuids.map((item) => String(item || "").trim()).filter(Boolean)
    : [];

  if (notification_uuids.length === 0) {
    return respErr("notification_uuids is required");
  }

  await markNotificationsRead(user_uuid, notification_uuids);
  return respData({ ok: true });
}
