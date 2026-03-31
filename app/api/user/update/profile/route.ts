import { respData, respErr, respJson } from "@/lib/resp";
import { getUserUuid } from "@/services/user";
import { findUserByEmail, updateUserProfile } from "@/models/user";

// 更新当前登录用户的基础资料
// POST /api/user/update/profile
// body: {
//   nickname?: string;
//   avatar_url?: string;
//   email?: string;
//   role?: "user" | "artisan";
//   phone_number?: string;
//   gender?: "" | "male" | "female" | "other";
//   signature?: string;
//   address?: string;
// }
export async function POST(req: Request) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respJson(-2, "no auth");
    }

    const body = await req.json();
    let {
      nickname,
      avatar_url,
      email,
      role,
      phone_number,
      gender,
      signature,
      address,
    } = body as {
      nickname?: string;
      avatar_url?: string;
      email?: string;
      role?: string;
      phone_number?: string;
      gender?: string;
      signature?: string;
      address?: string;
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

    if (typeof phone_number === "string") {
      const trimmed = phone_number.trim();
      if (trimmed.length > 30) {
        return respErr("手机号长度不能超过 30 个字符");
      }
      if (trimmed && !/^[0-9+\-\s()]+$/.test(trimmed)) {
        return respErr("手机号格式不正确");
      }
      patch.phone_number = trimmed;
    }

    if (typeof gender === "string") {
      const normalizedGender = gender.trim();
      if (
        normalizedGender !== "" &&
        normalizedGender !== "male" &&
        normalizedGender !== "female" &&
        normalizedGender !== "other"
      ) {
        return respErr("无效的性别选项");
      }
      patch.gender = normalizedGender;
    }

    if (typeof signature === "string") {
      const trimmed = signature.trim();
      if (trimmed.length > 200) {
        return respErr("个性签名不能超过 200 个字符");
      }
      patch.signature = trimmed;
    }

    if (typeof address === "string") {
      const trimmed = address.trim();
      if (trimmed.length > 255) {
        return respErr("详细地址不能超过 255 个字符");
      }
      patch.address = trimmed;
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
