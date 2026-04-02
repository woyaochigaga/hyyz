import { getUuid } from "@/lib/hash";
import { respData, respErr, respJson } from "@/lib/resp";
import { getUserUuid } from "@/services/user";
import {
  createHomePost,
  listHomePosts,
  validateHomePostPayload,
} from "@/models/home-post";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const currentUserUuid = await getUserUuid();
    const mine = searchParams.get("mine") === "1";
    const locale = String(searchParams.get("locale") || "").trim();

    if (mine && !currentUserUuid) {
      return respJson(-2, "no auth");
    }

    const posts = await listHomePosts({
      currentUserUuid,
      locale,
      user_uuid: mine ? currentUserUuid : undefined,
      includeDraft: mine,
      includeDeleted: false,
    });

    return respData(posts);
  } catch (error) {
    console.error("get home posts failed:", error);
    return respErr("get home posts failed");
  }
}

export async function POST(req: Request) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respJson(-2, "no auth");
    }

    const body = await req.json();
    const payload = validateHomePostPayload(body || {});
    const post = await createHomePost({
      uuid: getUuid(),
      user_uuid,
      locale: String(body?.locale || "").trim(),
      type: payload.type,
      title: payload.title,
      excerpt: payload.excerpt,
      content: payload.content,
      content_format: payload.content_format,
      editor_mode: payload.editor_mode,
      content_blocks: payload.content_blocks,
      attachments: payload.attachments,
      display_settings: payload.display_settings,
      cover_url: payload.cover_url,
      images: payload.images,
      video_url: payload.video_url,
      status: payload.status,
      tags: payload.tags,
    });

    return respData(post);
  } catch (error: any) {
    console.error("create home post failed:", error);
    return respErr(error?.message || "create home post failed");
  }
}
