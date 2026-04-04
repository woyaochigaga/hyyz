import { respData, respErr, respJson } from "@/lib/resp";
import { getUserUuid } from "@/services/user";
import { findUserByEmail, findUserByUuid, updateUserProfile } from "@/models/user";

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
//   artisan_category?: string;
//   artisan_specialties?: string;
//   artisan_years_experience?: number;
//   artisan_shop_name?: string;
//   artisan_shop_address?: string;
//   artisan_service_area?: string;
//   artisan_contact_wechat?: string;
//   artisan_bio?: string;
// }
export async function POST(req: Request) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respJson(-2, "no auth");
    }

    const currentUser = await findUserByUuid(user_uuid);
    if (!currentUser) {
      return respErr("用户不存在");
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
      artisan_category,
      artisan_specialties,
      artisan_years_experience,
      artisan_shop_name,
      artisan_shop_address,
      artisan_service_area,
      artisan_contact_wechat,
      artisan_bio,
    } = body as {
      nickname?: string;
      avatar_url?: string;
      email?: string;
      role?: string;
      phone_number?: string;
      gender?: string;
      signature?: string;
      address?: string;
      artisan_category?: string;
      artisan_specialties?: string;
      artisan_years_experience?: number | string;
      artisan_shop_name?: string;
      artisan_shop_address?: string;
      artisan_service_area?: string;
      artisan_contact_wechat?: string;
      artisan_bio?: string;
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

    if (typeof artisan_category === "string") {
      const trimmed = artisan_category.trim();
      if (trimmed.length > 100) {
        return respErr("工匠类型不能超过 100 个字符");
      }
      patch.artisan_category = trimmed;
    }

    if (typeof artisan_specialties === "string") {
      const trimmed = artisan_specialties.trim();
      if (trimmed.length > 255) {
        return respErr("擅长工艺不能超过 255 个字符");
      }
      patch.artisan_specialties = trimmed;
    }

    if (
      typeof artisan_years_experience === "number" ||
      typeof artisan_years_experience === "string"
    ) {
      const raw = String(artisan_years_experience).trim();
      const parsed = raw ? Number.parseInt(raw, 10) : 0;
      if (!Number.isFinite(parsed) || parsed < 0 || parsed > 80) {
        return respErr("从业年限需在 0 到 80 之间");
      }
      patch.artisan_years_experience = parsed;
    }

    if (typeof artisan_shop_name === "string") {
      const trimmed = artisan_shop_name.trim();
      if (trimmed.length > 120) {
        return respErr("店铺或工作室名称不能超过 120 个字符");
      }
      patch.artisan_shop_name = trimmed;
    }

    if (typeof artisan_shop_address === "string") {
      const trimmed = artisan_shop_address.trim();
      if (trimmed.length > 255) {
        return respErr("店铺地址不能超过 255 个字符");
      }
      patch.artisan_shop_address = trimmed;
    }

    if (typeof artisan_service_area === "string") {
      const trimmed = artisan_service_area.trim();
      if (trimmed.length > 120) {
        return respErr("服务区域不能超过 120 个字符");
      }
      patch.artisan_service_area = trimmed;
    }

    if (typeof artisan_contact_wechat === "string") {
      const trimmed = artisan_contact_wechat.trim();
      if (trimmed.length > 100) {
        return respErr("联系微信不能超过 100 个字符");
      }
      patch.artisan_contact_wechat = trimmed;
    }

    if (typeof artisan_bio === "string") {
      const trimmed = artisan_bio.trim();
      if (trimmed.length > 1000) {
        return respErr("匠人简介不能超过 1000 个字符");
      }
      patch.artisan_bio = trimmed;
    }

    const nextRole = String(patch.role || currentUser.role || "user");
    const requireArtisanProfile =
      currentUser.role !== "artisan" && nextRole === "artisan";

    if (requireArtisanProfile) {
      const nextCategory = String(
        patch.artisan_category || currentUser.artisan_category || ""
      ).trim();
      const nextShopName = String(
        patch.artisan_shop_name || currentUser.artisan_shop_name || ""
      ).trim();
      const nextShopAddress = String(
        patch.artisan_shop_address || currentUser.artisan_shop_address || ""
      ).trim();
      const nextBio = String(
        patch.artisan_bio || currentUser.artisan_bio || ""
      ).trim();

      if (!nextCategory) {
        return respErr("请填写你是什么工匠");
      }
      if (!nextShopName) {
        return respErr("请填写店铺或工作室名称");
      }
      if (!nextShopAddress) {
        return respErr("请填写店铺地址");
      }
      if (!nextBio) {
        return respErr("请填写匠人简介");
      }
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
