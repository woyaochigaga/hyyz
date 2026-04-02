import { respData, respErr } from "@/lib/resp";
import { getForumPostDetail } from "@/models/forum";
import { getUserUuid } from "@/services/user";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUserUuid = await getUserUuid();
    const detail = await getForumPostDetail(params.id, currentUserUuid);
    if (!detail) {
      return respErr("post not found");
    }

    return respData(detail);
  } catch (error) {
    console.error("get forum post detail failed:", error);
    return respErr("get forum post detail failed");
  }
}
