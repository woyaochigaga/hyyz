import {
  normalizeArtisanShopVerificationStatus,
  type ArtisanShopVerificationStatus,
} from "@/lib/artisan-shop";
import { respData, respErr, respJson } from "@/lib/resp";
import { getIsoTimestr } from "@/lib/time";
import { sendArtisanVerificationReviewNotification } from "@/models/notification";
import { findUserByUuid, updateUserProfile } from "@/models/user";
import { getUserInfo } from "@/services/user";

async function requireAdmin() {
  const admin = await getUserInfo();
  if (!admin?.email) {
    return { error: respJson(-2, "no auth") };
  }

  const adminEmails = process.env.ADMIN_EMAILS?.split(",").map((s) => s.trim());
  if (!adminEmails?.includes(admin.email)) {
    return { error: respErr("No access") };
  }

  return { admin };
}

function isReviewStatus(
  value: unknown
): value is Exclude<ArtisanShopVerificationStatus, "none"> {
  return value === "pending" || value === "approved" || value === "rejected" || value === "expired";
}

export async function POST(req: Request) {
  try {
    const access = await requireAdmin();
    if (access.error) {
      return access.error;
    }

    const body = (await req.json()) as {
      uuid?: string;
      status?: string;
      note?: string;
    };

    const uuid = String(body.uuid || "").trim();
    const status = normalizeArtisanShopVerificationStatus(body.status);
    const note = String(body.note || "").trim();

    if (!uuid) {
      return respErr("缺少用户标识");
    }
    if (!isReviewStatus(status) || status === "pending") {
      return respErr("无效的审核状态");
    }
    if (status === "rejected" && !note) {
      return respErr("驳回时请填写原因");
    }
    if (note.length > 1000) {
      return respErr("审核备注不能超过 1000 个字符");
    }

    const target = await findUserByUuid(uuid);
    if (!target) {
      return respErr("用户不存在");
    }
    if (target.role !== "artisan" && target.role !== "admin") {
      return respErr("只有匠人账号可以被审核");
    }

    const currentStatus = normalizeArtisanShopVerificationStatus(
      target.artisan_shop_verification_status
    );
    if (currentStatus === "none") {
      return respErr("该用户尚未提交淘宝店铺认证");
    }

    const reviewedAt = getIsoTimestr();
    const updated = await updateUserProfile(uuid, {
      artisan_shop_verification_status: status,
      artisan_shop_verification_note: note,
      artisan_shop_verification_reviewed_at: reviewedAt,
      artisan_shop_verification_reviewer:
        access.admin.email || access.admin.uuid || "",
    });

    try {
      if (status === "approved" || status === "rejected") {
        await sendArtisanVerificationReviewNotification({
          locale: target.locale || "zh",
          user_uuid: uuid,
          status,
          note,
          reviewer_uuid: access.admin.uuid,
        });
      }
    } catch (notificationError) {
      console.error(
        "send artisan verification review notification failed:",
        notificationError
      );
    }

    return respData(
      updated?.[0] || {
        uuid,
        artisan_shop_verification_status: status,
        artisan_shop_verification_note: note,
        artisan_shop_verification_reviewed_at: reviewedAt,
      }
    );
  } catch (e) {
    console.error("review artisan shop verification failed:", e);
    return respErr("审核淘宝店铺认证失败");
  }
}
