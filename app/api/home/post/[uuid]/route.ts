import { respData, respErr, respJson } from "@/lib/resp";
import { getUserUuid } from "@/services/user";
import {
  findHomePostByUuid,
  softDeleteHomePost,
  updateHomePost,
  validateHomePostPayload,
} from "@/models/home-post";

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

    if (post.status !== "published" && post.user_uuid !== currentUserUuid) {
      return respErr("post not found");
    }

    return respData(post);
  } catch (error) {
    console.error("get home post failed:", error);
    return respErr("get home post failed");
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { uuid: string } }
) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respJson(-2, "no auth");
    }

    const current = await findHomePostByUuid(params.uuid, user_uuid);
    if (!current || current.user_uuid !== user_uuid) {
      return respErr("no permission");
    }

    const body = await req.json();
    const payload = validateHomePostPayload({
      ...current,
      ...body,
    });
    const post = await updateHomePost(params.uuid, user_uuid, payload);

    return respData(post);
  } catch (error: any) {
    console.error("update home post failed:", error);
    return respErr(error?.message || "update home post failed");
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { uuid: string } }
) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respJson(-2, "no auth");
    }

    const current = await findHomePostByUuid(params.uuid, user_uuid);
    if (!current || current.user_uuid !== user_uuid) {
      return respErr("no permission");
    }

    await softDeleteHomePost(params.uuid, user_uuid);
    return respData({ ok: true });
  } catch (error) {
    console.error("delete home post failed:", error);
    return respErr("delete home post failed");
  }
}
