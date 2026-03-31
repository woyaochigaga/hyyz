import { respData, respErr, respJson } from "@/lib/resp";
import { getUserUuid } from "@/services/user";
import { findHomePostByUuid, toggleHomePostLike } from "@/models/home-post";

export async function POST(
  req: Request,
  { params }: { params: { uuid: string } }
) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respJson(-2, "no auth");
    }

    const post = await findHomePostByUuid(params.uuid, user_uuid);
    if (!post || post.status === "deleted") {
      return respErr("post not found");
    }

    const result = await toggleHomePostLike(params.uuid, user_uuid);
    return respData(result);
  } catch (error) {
    console.error("toggle home post like failed:", error);
    return respErr("toggle like failed");
  }
}
