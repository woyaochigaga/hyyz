import { getUuid } from "@/lib/hash";
import { respData, respErr, respJson } from "@/lib/resp";
import { sendHomePostCommentNotification } from "@/models/notification";
import { getUserUuid } from "@/services/user";
import {
  createHomePostComment,
  findHomePostByUuid,
  findHomePostCommentByUuid,
  listHomePostComments,
} from "@/models/home-post";
import { findUserByUuid } from "@/models/user";

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

    const commentUuid = getUuid();
    const comment = await createHomePostComment({
      uuid: commentUuid,
      post_uuid: params.uuid,
      user_uuid,
      parent_uuid,
      content,
    });

    try {
      const actor = await findUserByUuid(user_uuid);
      await sendHomePostCommentNotification({
        locale: post.locale,
        post_uuid: post.uuid,
        post_title: post.title,
        post_author_uuid: post.user_uuid,
        comment_uuid: commentUuid,
        comment_content: content,
        actor_uuid: user_uuid,
        actor_name: actor?.nickname,
        parent_comment_author_uuid: parent_uuid ? parent?.user_uuid : undefined,
        parent_uuid,
      });
    } catch (notificationError) {
      console.error("send home post comment notification failed:", notificationError);
    }

    return respData(comment);
  } catch (error) {
    console.error("create home post comment failed:", error);
    return respErr("create comment failed");
  }
}
