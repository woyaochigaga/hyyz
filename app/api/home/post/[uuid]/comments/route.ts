import { getUuid } from "@/lib/hash";
import { respData, respErr, respJson } from "@/lib/resp";
import { getUserUuid } from "@/services/user";
import {
  createHomePostComment,
  findHomePostByUuid,
  findHomePostCommentByUuid,
  listHomePostComments,
} from "@/models/home-post";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { uuid: string } }
) {
  try {
    const currentUserUuid = await getUserUuid();
    const post = await findHomePostByUuid(params.uuid, currentUserUuid);
    if (!post || post.status === "deleted") {
      return respErr("post not found");
    }

    const { searchParams } = new URL(req.url);
    const manage = searchParams.get("manage") === "1";
    const comments = await listHomePostComments(params.uuid, {
      includeHidden: manage && post.user_uuid === currentUserUuid,
    });

    return respData(comments);
  } catch (error) {
    console.error("get home post comments failed:", error);
    return respErr("get comments failed");
  }
}

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

    const body = await req.json();
    const content = String(body?.content || "").trim();
    const parent_uuid = String(body?.parent_uuid || "").trim();
    if (!content) {
      return respErr("comment content is required");
    }

    if (parent_uuid) {
      const parent = await findHomePostCommentByUuid(parent_uuid);
      if (!parent || parent.post_uuid !== params.uuid) {
        return respErr("parent comment not found");
      }
    }

    const comment = await createHomePostComment({
      uuid: getUuid(),
      post_uuid: params.uuid,
      user_uuid,
      parent_uuid,
      content,
    });

    return respData(comment);
  } catch (error) {
    console.error("create home post comment failed:", error);
    return respErr("create comment failed");
  }
}
