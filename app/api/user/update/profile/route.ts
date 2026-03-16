import { respData, respErr, respJson } from "@/lib/resp";
import { getUserUuid } from "@/services/user";
import { findUserByEmail, updateUserProfile } from "@/models/user";

// 更新当前登录用户的基础资料：昵称、头像、邮箱、角色
// POST /api/user/update/profile
// body: { nickname?: string; avatar_url?: string; email?: string; role?: "user" | "artisan" }
export async function POST(req: Request) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respJson(-2, "no auth");
    }

    const body = await req.json();
    let { nickname, avatar_url, email, role } = body as {
      nickname?: string;
      avatar_url?: string;
      email?: string;
      role?: string;
    };

    const patch: any = {};

    if (typeof nickname === "string") {
      const trimmed = nickname.trim();
      if (!trimmed) {
        return respErr("昵称不能为空");
      }
      if (trimmed.length > 50) {
        return respErr("昵称长度不能超过 50 个字符");
      }
      patch.nickname = trimmed;
    }

    if (typeof avatar_url === "string") {
      const trimmed = avatar_url.trim();
      if (trimmed.length > 500) {
        return respErr("头像地址过长");
      }
      patch.avatar_url = trimmed;
    }

    if (typeof email === "string") {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail) {
        return respErr("邮箱不能为空");
      }
      // 简单格式检查
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return respErr("邮箱格式不正确");
      }

      const exist = await findUserByEmail(normalizedEmail);
      if (exist && exist.uuid !== user_uuid) {
        return respErr("邮箱已被其他账户绑定");
      }

      patch.email = normalizedEmail;
    }

    if (typeof role === "string") {
      if (role !== "user" && role !== "artisan") {
        return respErr("无效的账户类型");
      }
      // 这里不允许用户自行切换为 admin
      patch.role = role;
    }

    if (Object.keys(patch).length === 0) {
      return respErr("没有可更新的字段");
    }

    const updated = await updateUserProfile(user_uuid, patch);

    return respData(updated?.[0] || patch);
  } catch (e) {
    console.error("update profile failed:", e);
    return respErr("更新个人信息失败");
  }
}

