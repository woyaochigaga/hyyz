import { respData, respErr, respJson } from "@/lib/resp";
import { toggleForumBarFollow } from "@/models/forum";
import { getUserUuid } from "@/services/user";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respJson(-2, "no auth");
    }

    const body = await req.json();
    const bar_id = String(body?.bar_id || "").trim();
    if (!bar_id) {
      return respErr("bar_id is required");
    }

    const result = await toggleForumBarFollow(bar_id, user_uuid);
    return respData(result);
  } catch (error: any) {
    console.error("toggle forum bar follow failed:", error);
    return respErr(error?.message || "toggle forum bar follow failed");
  }
}
