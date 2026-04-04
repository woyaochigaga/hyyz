import { getUuid } from "@/lib/hash";
import { respData, respErr, respJson } from "@/lib/resp";
import { sendForumReplyNotification } from "@/models/notification";
import { createForumReply, findForumPostById, listForumReplies } from "@/models/forum";
import { findUserByUuid } from "@/models/user";
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
    const reply_to_reply_id = String(body?.reply_to_reply_id || "").trim();
    const image_url = String(body?.image_url || "").trim();
    let replyToAuthorId = String(body?.reply_to_author_id || "").trim();

    if (reply_to_reply_id && !replyToAuthorId) {
      const replies = await listForumReplies(post_id);
      const targetReply = replies.find((item) => item.id === reply_to_reply_id);
      if (!targetReply) {
        return respErr("reply target not found");
      }
      replyToAuthorId = String(targetReply.author_id || "").trim();
    }

    const reply = await createForumReply({
      id: getUuid(),
      content: String(body?.content || ""),
      image_url,
      author_id: user_uuid,
      post_id,
      reply_to_reply_id,
      reply_to_author_id: replyToAuthorId,
    });
    const post = await findForumPostById(post_id, user_uuid);

    try {
      const actor = await findUserByUuid(user_uuid);
      if (post) {
        await sendForumReplyNotification({
          locale: "zh",
          post_id,
          post_title: post.title,
          post_author_uuid: post.author_id,
          reply_id: reply.id,
          reply_content: reply.content,
          actor_uuid: user_uuid,
          actor_name: actor?.nickname,
          reply_to_author_uuid: replyToAuthorId,
          reply_to_reply_id: reply_to_reply_id || "",
        });
      }
    } catch (notificationError) {
      console.error("send forum reply notification failed:", notificationError);
    }

    return respData({
      reply,
      post,
    });
  } catch (error: any) {
    console.error("create forum reply failed:", error);
    return respErr(error?.message || "create forum reply failed");
  }
}
