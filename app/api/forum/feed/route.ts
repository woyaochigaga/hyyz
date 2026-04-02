import { respData, respErr } from "@/lib/resp";
import { listForumBars, listForumFeed } from "@/models/forum";
import { getUserUuid } from "@/services/user";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const currentUserUuid = await getUserUuid();
    const [feed, bars] = await Promise.all([
      listForumFeed({
        currentUserUuid,
        limit: 20,
      }),
      listForumBars({
        currentUserUuid,
        limit: 12,
      }),
    ]);

    return respData({
      posts: feed.posts,
      bars,
      following_bar_ids: feed.following_bar_ids,
    });
  } catch (error) {
    console.error("get forum feed failed:", error);
    return respErr("get forum feed failed");
  }
}
