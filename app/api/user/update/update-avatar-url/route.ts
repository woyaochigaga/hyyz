import { respData, respErr, respJson } from "@/lib/resp";
import { getUserUuid } from "@/services/user";
import { updateUserProfile } from "@/models/user";

// 修改头像地址：POST /api/user/update/update-avatar-url
// body: { avatar_url: string }
export async function POST(req: Request) {
  try {
    const { avatar_url } = await req.json();
    const raw = typeof avatar_url === "string" ? avatar_url : "";
    const trimmed = raw.trim();

    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respJson(-2, "no auth");
    }

    if (trimmed.length > 500) {
      return respErr("头像地址过长");
    }

    const updated = await updateUserProfile(user_uuid, {
      avatar_url: trimmed,
    });

    return respData(updated?.[0] || { avatar_url: trimmed });
  } catch (e) {
    console.error("update avatar failed:", e);
    return respErr("更新头像失败");
  }
}

