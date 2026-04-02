import { getUuid } from "@/lib/hash";
import { respData, respErr, respJson } from "@/lib/resp";
import { createForumReply, findForumPostById } from "@/models/forum";
import { getUserUuid } from "@/services/user";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respJson(-2, "no auth");
    }

    const body = await req.json();
    const post_id = String(body?.post_id || "");
    const reply = await createForumReply({
      id: getUuid(),
      content: String(body?.content || ""),
      author_id: user_uuid,
      post_id,
    });
    const post = await findForumPostById(post_id, user_uuid);

    return respData({
      reply,
      post,
    });
  } catch (error: any) {
    console.error("create forum reply failed:", error);
    return respErr(error?.message || "create forum reply failed");
  }
}
