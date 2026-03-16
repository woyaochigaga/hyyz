import { respData, respErr, respJson } from "@/lib/resp";
import { getUserUuid } from "@/services/user";
import { updateUserPasswordHash } from "@/models/user";
import { hashPassword } from "@/lib/password";

// 密码找回：直接为当前登录用户重置密码（不做额外安全校验）
// POST /api/user/update/reset-password
// body: { password: string }
export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    const raw = String(password || "");

    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respJson(-2, "no auth");
    }

    if (!raw.trim()) {
      return respErr("密码不能为空");
    }

    const password_hash = hashPassword(raw);
    await updateUserPasswordHash(user_uuid, password_hash);

    return respData({ ok: true });
  } catch (e) {
    console.error("reset password failed:", e);
    return respErr("重置密码失败");
  }
}

