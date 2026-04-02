import { respData, respErr, respJson } from "@/lib/resp";
import { findForumPostById, toggleForumPostLike } from "@/models/forum";
import { getUserUuid } from "@/services/user";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respJson(-2, "no auth");
    }

    const post = await findForumPostById(params.id, user_uuid);
    if (!post) {
      return respErr("post not found");
    }

    const result = await toggleForumPostLike(params.id, user_uuid);
    return respData(result);
  } catch (error) {
    console.error("toggle forum post like failed:", error);
    return respErr("toggle like failed");
  }
}
