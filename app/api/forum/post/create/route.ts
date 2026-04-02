import { getUuid } from "@/lib/hash";
import { respData, respErr, respJson } from "@/lib/resp";
import { createForumPost } from "@/models/forum";
import { getUserUuid } from "@/services/user";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respJson(-2, "no auth");
    }

    const body = await req.json();
    const post = await createForumPost({
      id: getUuid(),
      title: String(body?.title || ""),
      content: String(body?.content || ""),
      author_id: user_uuid,
      bar_id: String(body?.bar_id || ""),
    });

    return respData(post);
  } catch (error: any) {
    console.error("create forum post failed:", error);
    return respErr(error?.message || "create forum post failed");
  }
}
