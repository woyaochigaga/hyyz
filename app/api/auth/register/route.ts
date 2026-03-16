import { respData, respErr } from "@/lib/resp";
import { findUserByEmail, insertUser } from "@/models/user";
import { User } from "@/types/user";
import { hashPassword } from "@/lib/password";
import { getIsoTimestr } from "@/lib/time";
import { getUuid } from "@/lib/hash";

// 账号密码注册：POST /api/auth/register
// body: { email, password, nickname, role }
export async function POST(req: Request) {
  try {
    const { email, password, nickname, role } = await req.json();

    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedNickname = String(nickname || "").trim();
    const normalizedPassword = String(password || "");

    if (!normalizedEmail || !normalizedPassword || !normalizedNickname) {
      return respErr("invalid params");
    }

    const exist = await findUserByEmail(normalizedEmail);
    if (exist) {
      return respErr("email already exists");
    }

    const now = getIsoTimestr();
    const user: User = {
      uuid: getUuid(),
      email: normalizedEmail,
      nickname: normalizedNickname,
      avatar_url: "",
      created_at: now,
      signin_type: "credentials",
      signin_provider: "credentials",
      password_hash: hashPassword(normalizedPassword),
      role: role === "artisan" ? "artisan" : "user",
    };

    await insertUser(user);

    return respData({
      email: user.email,
      nickname: user.nickname,
    });
  } catch (e: any) {
    console.error("register failed:", e);
    return respErr("register failed");
  }
}

