import { respData, respErr, respJson } from "@/lib/resp";
import { getUserUuid } from "@/services/user";
import {
  findHomePostByUuid,
  findHomePostCommentByUuid,
  updateHomePostComment,
} from "@/models/home-post";

export async function PATCH(
  req: Request,
  {
    params,
  }: {
    params: { uuid: string; comment_uuid: string };
  }
) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respJson(-2, "no auth");
    }

    const [post, comment] = await Promise.all([
      findHomePostByUuid(params.uuid, user_uuid),
      findHomePostCommentByUuid(params.comment_uuid),
    ]);

    if (!post || !comment || comment.post_uuid !== params.uuid) {
      return respErr("comment not found");
    }

    const body = await req.json();
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    const status = String(body?.status || "").trim();

    if (content) {
      if (comment.user_uuid !== user_uuid) {
        return respErr("no permission");
      }

      const updated = await updateHomePostComment(params.comment_uuid, {
        content,
      });
      return respData(updated);
    }

    if (status) {
      if (post.user_uuid !== user_uuid) {
        return respErr("no permission");
      }

      if (!["active", "hidden", "deleted"].includes(status)) {
        return respErr("invalid status");
      }

      const updated = await updateHomePostComment(params.comment_uuid, {
        status: status as "active" | "hidden" | "deleted",
      });
      return respData(updated);
    }

    return respErr("invalid patch");
  } catch (error) {
    console.error("update home post comment failed:", error);
    return respErr("update comment failed");
  }
}

export async function DELETE(
  req: Request,
  {
    params,
  }: {
    params: { uuid: string; comment_uuid: string };
  }
) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respJson(-2, "no auth");
    }

    const [post, comment] = await Promise.all([
      findHomePostByUuid(params.uuid, user_uuid),
      findHomePostCommentByUuid(params.comment_uuid),
    ]);

    if (!post || !comment || comment.post_uuid !== params.uuid) {
      return respErr("comment not found");
    }

    if (post.user_uuid !== user_uuid && comment.user_uuid !== user_uuid) {
      return respErr("no permission");
    }

    const updated = await updateHomePostComment(params.comment_uuid, {
      status: "deleted",
    });
    return respData(updated);
  } catch (error) {
    console.error("delete home post comment failed:", error);
    return respErr("delete comment failed");
  }
}
