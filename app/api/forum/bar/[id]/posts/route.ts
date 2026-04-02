import { respData, respErr } from "@/lib/resp";
import { findForumBarById, listForumPostsByBarId } from "@/models/forum";
import { getUserUuid } from "@/services/user";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUserUuid = await getUserUuid();
    const [bar, posts] = await Promise.all([
      findForumBarById(params.id, currentUserUuid),
      listForumPostsByBarId(params.id, currentUserUuid, 50),
    ]);

    if (!bar) {
      return respErr("bar not found");
    }

    return respData({
      bar,
      posts,
    });
  } catch (error) {
    console.error("get forum bar posts failed:", error);
    return respErr("get forum bar posts failed");
  }
}
