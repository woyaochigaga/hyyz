import type { User } from "@/types/user";

export const ARTISAN_SHOP_PLATFORM_TAOBAO = "taobao";

export const ARTISAN_SHOP_VERIFICATION_STATUSES = [
  "none",
  "pending",
  "approved",
  "rejected",
  "expired",
] as const;

export type ArtisanShopVerificationStatus =
  (typeof ARTISAN_SHOP_VERIFICATION_STATUSES)[number];

export function normalizeArtisanShopVerificationStatus(
  value: unknown
): ArtisanShopVerificationStatus {
  return ARTISAN_SHOP_VERIFICATION_STATUSES.includes(
    value as ArtisanShopVerificationStatus
  )
    ? (value as ArtisanShopVerificationStatus)
    : "none";
}

export function getArtisanShopVerificationStatusLabel(
  status: ArtisanShopVerificationStatus
) {
  switch (status) {
    case "pending":
      return "审核中";
    case "approved":
      return "已认证";
    case "rejected":
      return "未通过";
    case "expired":
      return "已过期";
    case "none":
    default:
      return "未提交";
  }
}

export function isArtisanShopVerificationEditable(status: unknown) {
  const normalized = normalizeArtisanShopVerificationStatus(status);
  return normalized !== "pending";
}

export function hasArtisanShopVerificationDraft(user?: Partial<User>) {
  if (!user) return false;

  return [
    user.artisan_shop_url,
    user.artisan_shop_owner_name,
    user.artisan_shop_contact_phone,
    user.artisan_shop_screenshot_url,
    user.artisan_shop_owner_proof_url,
    user.artisan_shop_supporting_proof_url,
  ].some((value) => String(value || "").trim().length > 0);
}
