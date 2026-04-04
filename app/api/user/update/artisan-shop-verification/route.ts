import {
  ARTISAN_SHOP_PLATFORM_TAOBAO,
  normalizeArtisanShopVerificationStatus,
} from "@/lib/artisan-shop";
import { getIsoTimestr } from "@/lib/time";
import { respData, respErr, respJson } from "@/lib/resp";
import { findUserByUuid, updateUserProfile } from "@/models/user";
import { getUserUuid } from "@/services/user";

function validateImageUrl(label: string, value: unknown) {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return { error: `${label}不能为空` };
  }
  if (trimmed.length > 500) {
    return { error: `${label}过长` };
  }
  return { value: trimmed };
}

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
    if (currentUser.role !== "artisan" && currentUser.role !== "admin") {
      return respErr("请先成为匠人再提交店铺认证");
    }

    const body = (await req.json()) as {
      artisan_shop_url?: string;
      artisan_shop_owner_name?: string;
      artisan_shop_contact_phone?: string;
      artisan_shop_screenshot_url?: string;
      artisan_shop_owner_proof_url?: string;
      artisan_shop_supporting_proof_url?: string;
    };

    const artisan_shop_url = String(body.artisan_shop_url || "").trim();
    const artisan_shop_owner_name = String(
      body.artisan_shop_owner_name || ""
    ).trim();
    const artisan_shop_contact_phone = String(
      body.artisan_shop_contact_phone || ""
    ).trim();

    if (!artisan_shop_url) {
      return respErr("请填写淘宝店铺链接");
    }
    if (artisan_shop_url.length > 500) {
      return respErr("淘宝店铺链接过长");
    }
    if (!/^https?:\/\//i.test(artisan_shop_url)) {
      return respErr("淘宝店铺链接需以 http:// 或 https:// 开头");
    }
    if (
      !/taobao\.com|tmall\.com/i.test(artisan_shop_url)
    ) {
      return respErr("请填写有效的淘宝或天猫店铺链接");
    }

    if (!artisan_shop_owner_name) {
      return respErr("请填写店主或经营者姓名");
    }
    if (artisan_shop_owner_name.length > 120) {
      return respErr("店主或经营者姓名不能超过 120 个字符");
    }

    if (artisan_shop_contact_phone.length > 30) {
      return respErr("审核联系手机号不能超过 30 个字符");
    }
    if (
      artisan_shop_contact_phone &&
      !/^[0-9+\-\s()]+$/.test(artisan_shop_contact_phone)
    ) {
      return respErr("审核联系手机号格式不正确");
    }

    const screenshot = validateImageUrl(
      "店铺首页截图",
      body.artisan_shop_screenshot_url
    );
    if (screenshot.error) return respErr(screenshot.error);

    const ownerProof = validateImageUrl(
      "店铺归属证明截图",
      body.artisan_shop_owner_proof_url
    );
    if (ownerProof.error) return respErr(ownerProof.error);

    const supportingProof = validateImageUrl(
      "补充证明材料",
      body.artisan_shop_supporting_proof_url
    );
    if (supportingProof.error) return respErr(supportingProof.error);

    const currentStatus = normalizeArtisanShopVerificationStatus(
      currentUser.artisan_shop_verification_status
    );
    if (currentStatus === "pending") {
      return respErr("店铺认证正在审核中，请勿重复提交");
    }

    const submitted_at = getIsoTimestr();
    const updated = await updateUserProfile(user_uuid, {
      artisan_shop_platform: ARTISAN_SHOP_PLATFORM_TAOBAO,
      artisan_shop_url,
      artisan_shop_owner_name,
      artisan_shop_contact_phone,
      artisan_shop_screenshot_url: screenshot.value,
      artisan_shop_owner_proof_url: ownerProof.value,
      artisan_shop_supporting_proof_url: supportingProof.value,
      artisan_shop_verification_status: "pending",
      artisan_shop_verification_note: "",
      artisan_shop_verification_submitted_at: submitted_at,
      artisan_shop_verification_reviewed_at: null,
      artisan_shop_verification_reviewer: "",
    });

    return respData(
      updated?.[0] || {
        artisan_shop_verification_status: "pending",
        artisan_shop_verification_submitted_at: submitted_at,
      }
    );
  } catch (e) {
    console.error("submit artisan shop verification failed:", e);
    return respErr("提交淘宝店铺认证失败");
  }
}
