import { getUuid } from "@/lib/hash";
import { respData, respErr, respJson } from "@/lib/resp";
import { createForumBar } from "@/models/forum";
import { getUserUuid } from "@/services/user";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respJson(-2, "no auth");
    }

    const body = await req.json();
    const bar = await createForumBar({
      id: getUuid(),
      name: String(body?.name || ""),
      description: String(body?.description || ""),
      cover_image: String(body?.cover_image || ""),
      creator_id: user_uuid,
    });

    return respData(bar);
  } catch (error: any) {
    console.error("create forum bar failed:", error);
    return respErr(error?.message || "create forum bar failed");
  }
}
