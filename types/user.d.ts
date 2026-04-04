import type { ArtisanShopVerificationStatus } from "@/lib/artisan-shop";

export type UserGender = "" | "male" | "female" | "other";

export interface User {
  id?: number;
  uuid?: string;
  email: string;
  created_at?: string;
  updated_at?: string;
  nickname: string;
  avatar_url: string;
  // 账号密码登录：数据库中存的是 hash（salt:hash），不要在代码里存明文密码
  password_hash?: string;
  locale?: string;
  signin_type?: string;
  signin_ip?: string;
  signin_provider?: string;
  signin_openid?: string;
  credits?: UserCredits;
  invite_code?: string;
  invited_by?: string;
  is_affiliate?: boolean;
  role?: "user" | "artisan" | "admin";
  phone_number?: string;
  gender?: UserGender;
  signature?: string;
  address?: string;
  artisan_category?: string;
  artisan_specialties?: string;
  artisan_years_experience?: number;
  artisan_shop_name?: string;
  artisan_shop_address?: string;
  artisan_service_area?: string;
  artisan_contact_wechat?: string;
  artisan_bio?: string;
  artisan_shop_platform?: string;
  artisan_shop_url?: string;
  artisan_shop_owner_name?: string;
  artisan_shop_contact_phone?: string;
  artisan_shop_verification_status?: ArtisanShopVerificationStatus;
  artisan_shop_verification_note?: string;
  artisan_shop_verification_submitted_at?: string | null;
  artisan_shop_verification_reviewed_at?: string | null;
  artisan_shop_verification_reviewer?: string;
  artisan_shop_screenshot_url?: string;
  artisan_shop_owner_proof_url?: string;
  artisan_shop_supporting_proof_url?: string;
}

export interface PublicUserProfile {
  uuid: string;
  nickname: string;
  avatar_url: string;
  role?: User["role"];
  locale?: string;
  created_at?: string;
  gender?: UserGender;
  signature?: string;
  address?: string;
  artisan_category?: string;
  artisan_specialties?: string;
  artisan_years_experience?: number;
  artisan_shop_name?: string;
  artisan_shop_address?: string;
  artisan_service_area?: string;
  artisan_bio?: string;
  artisan_shop_platform?: string;
  artisan_shop_url?: string;
  artisan_shop_verification_status?: ArtisanShopVerificationStatus;
}

export interface UserCredits {
  one_time_credits?: number;
  monthly_credits?: number;
  total_credits?: number;
  used_credits?: number;
  left_credits: number;
  free_credits?: number;
  is_recharged?: boolean;
  is_pro?: boolean;
}
