import { respData, respErr, respJson } from "@/lib/resp";
import { getUserUuid } from "@/services/user";
import { listHomePosts } from "@/models/home-post";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const currentUserUuid = await getUserUuid();
    const includeDeleted = searchParams.get("includeDeleted") === "1";

    if (!currentUserUuid) {
      return respJson(-2, "no auth");
    }

    const posts = await listHomePosts({
      currentUserUuid,
      user_uuid: currentUserUuid,
      includeDraft: true,
      includeDeleted,
    });

    return respData(posts);
  } catch (error) {
    console.error("get mine home posts failed:", error);
    return respErr("get mine home posts failed");
  }
}
