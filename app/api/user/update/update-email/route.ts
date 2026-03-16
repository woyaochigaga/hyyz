import { respData, respErr, respJson } from "@/lib/resp";
import { getUserUuid } from "@/services/user";
import { findUserByEmail, updateUserProfile } from "@/models/user";

// 修改邮箱：POST /api/user/update/update-email
// body: { email: string }
export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const normalizedEmail = String(email || "").trim().toLowerCase();

    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respJson(-2, "no auth");
    }

    if (!normalizedEmail) {
      return respErr("邮箱不能为空");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return respErr("邮箱格式不正确");
    }

    const exist = await findUserByEmail(normalizedEmail);
    if (exist && exist.uuid !== user_uuid) {
      return respErr("邮箱已被其他账户绑定");
    }

    const updated = await updateUserProfile(user_uuid, {
      email: normalizedEmail,
    });

    return respData(updated?.[0] || { email: normalizedEmail });
  } catch (e) {
    console.error("update email failed:", e);
    return respErr("更新邮箱失败");
  }
}

