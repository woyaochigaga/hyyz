import { respData, respJson } from "@/lib/resp";
import { listUserNotifications } from "@/models/notification";
import { getUserUuid } from "@/services/user";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user_uuid = await getUserUuid();
  if (!user_uuid) {
    return respJson(-2, "no auth");
  }

  const { searchParams } = new URL(req.url);
  const tab = String(searchParams.get("tab") || "all").trim();
  const limit = Number.parseInt(String(searchParams.get("limit") || "30"), 10);

  const items = await listUserNotifications({
    user_uuid,
    tab:
      tab === "unread" ||
      tab === "system" ||
      tab === "interaction" ||
      tab === "review"
        ? tab
        : "all",
    limit: Number.isFinite(limit) && limit > 0 ? limit : 30,
  });

  return respData(items);
}
