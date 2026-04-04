import { respData, respJson } from "@/lib/resp";
import { markAllNotificationsRead } from "@/models/notification";
import { getUserUuid } from "@/services/user";

export const dynamic = "force-dynamic";

export async function POST() {
  const user_uuid = await getUserUuid();
  if (!user_uuid) {
    return respJson(-2, "no auth");
  }

  await markAllNotificationsRead(user_uuid);
  return respData({ ok: true });
}
