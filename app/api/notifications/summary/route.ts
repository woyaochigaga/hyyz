import { respData, respJson } from "@/lib/resp";
import { getNotificationSummary } from "@/models/notification";
import { getUserUuid } from "@/services/user";

export const dynamic = "force-dynamic";

export async function GET() {
  const user_uuid = await getUserUuid();
  if (!user_uuid) {
    return respJson(-2, "no auth");
  }

  const summary = await getNotificationSummary(user_uuid);
  return respData(summary);
}
