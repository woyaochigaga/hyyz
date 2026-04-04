import { PublicUserProfile, User } from "@/types/user";
import { getIsoTimestr } from "@/lib/time";
import { getSupabaseClient } from "./db";

export const PUBLIC_USER_PROFILE_SELECT = "uuid,nickname,avatar_url,role";
export const PUBLIC_USER_PROFILE_CARD_SELECT = [
  "uuid",
  "nickname",
  "avatar_url",
  "role",
  "locale",
  "created_at",
  "gender",
  "signature",
  "address",
  "artisan_category",
  "artisan_specialties",
  "artisan_years_experience",
  "artisan_shop_name",
  "artisan_shop_address",
  "artisan_service_area",
  "artisan_bio",
  "artisan_shop_platform",
  "artisan_shop_url",
  "artisan_shop_verification_status",
].join(",");

function toPublicUserProfile(user?: Partial<User>): PublicUserProfile | undefined {
  const uuid = String(user?.uuid || "").trim();
  if (!uuid) return undefined;

  return {
    uuid,
    nickname: String(user?.nickname || "").trim() || "未命名用户",
    avatar_url: String(user?.avatar_url || "").trim(),
    role: user?.role,
    locale: String(user?.locale || "").trim(),
    created_at: user?.created_at || "",
    gender: user?.gender,
    signature: String(user?.signature || "").trim(),
    address: String(user?.address || "").trim(),
    artisan_category: String(user?.artisan_category || "").trim(),
    artisan_specialties: String(user?.artisan_specialties || "").trim(),
    artisan_years_experience:
      typeof user?.artisan_years_experience === "number"
        ? user.artisan_years_experience
        : 0,
    artisan_shop_name: String(user?.artisan_shop_name || "").trim(),
    artisan_shop_address: String(user?.artisan_shop_address || "").trim(),
    artisan_service_area: String(user?.artisan_service_area || "").trim(),
    artisan_bio: String(user?.artisan_bio || "").trim(),
    artisan_shop_platform: String(user?.artisan_shop_platform || "").trim(),
    artisan_shop_url: String(user?.artisan_shop_url || "").trim(),
    artisan_shop_verification_status: user?.artisan_shop_verification_status,
  };
}

export async function insertUser(user: User) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("users").insert(user);

  if (error) {
    throw error;
  }

  return data;
}

export async function findUserByEmail(
  email: string
): Promise<User | undefined> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .limit(1)
    .single();

  if (error) {
    return undefined;
  }

  return data;
}

export async function findUserByUuid(uuid: string): Promise<User | undefined> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("uuid", uuid)
    .single();

  if (error) {
    return undefined;
  }

  return data;
}

export async function findPublicUserProfileByUuid(
  uuid: string
): Promise<PublicUserProfile | undefined> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select(PUBLIC_USER_PROFILE_CARD_SELECT)
    .eq("uuid", uuid)
    .single();

  if (error || !data) {
    return undefined;
  }

  return toPublicUserProfile(data as Partial<User>);
}

export async function getUsers(
  page: number = 1,
  limit: number = 50
): Promise<User[] | undefined> {
  if (page < 1) page = 1;
  if (limit <= 0) limit = 50;

  const offset = (page - 1) * limit;
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return undefined;
  }

  return data;
}

/** 分页拉取 users 表全部记录（每批最多 pageSize 条） */
export async function getAllUsers(pageSize: number = 500): Promise<User[]> {
  const all: User[] = [];
  let page = 1;

  for (;;) {
    const batch = await getUsers(page, pageSize);
    if (!batch?.length) break;
    all.push(...batch);
    if (batch.length < pageSize) break;
    page += 1;
  }

  return all;
}

export async function updateUserInviteCode(
  user_uuid: string,
  invite_code: string
) {
  const supabase = getSupabaseClient();
  const updated_at = getIsoTimestr();
  const { data, error } = await supabase
    .from("users")
    .update({ invite_code, updated_at })
    .eq("uuid", user_uuid);

  if (error) {
    throw error;
  }

  return data;
}

export async function updateUserInvitedBy(
  user_uuid: string,
  invited_by: string
) {
  const supabase = getSupabaseClient();
  const updated_at = getIsoTimestr();
  const { data, error } = await supabase
    .from("users")
    .update({ invited_by, updated_at })
    .eq("uuid", user_uuid);

  if (error) {
    throw error;
  }

  return data;
}

export async function getUsersByUuids(
  user_uuids: string[],
  columns: string = "*"
): Promise<User[]> {
  if (user_uuids.length === 0) {
    return [];
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select(columns)
    .in("uuid", user_uuids);
  if (error) {
    return [];
  }

  return data as unknown as User[];
}

export async function updateUserNickname(
  user_uuid: string,
  nickname: string
) {
  const supabase = getSupabaseClient();
  const updated_at = getIsoTimestr();
  const { data, error } = await supabase
    .from("users")
    .update({ nickname, updated_at })
    .eq("uuid", user_uuid);

  if (error) {
    throw error;
  }

  return data;
}

export async function updateUserProfile(
  user_uuid: string,
  patch: Partial<
    Pick<
      User,
      | "email"
      | "nickname"
      | "avatar_url"
      | "role"
      | "phone_number"
      | "gender"
      | "signature"
      | "address"
      | "artisan_category"
      | "artisan_specialties"
      | "artisan_years_experience"
      | "artisan_shop_name"
      | "artisan_shop_address"
      | "artisan_service_area"
      | "artisan_contact_wechat"
      | "artisan_bio"
      | "artisan_shop_platform"
      | "artisan_shop_url"
      | "artisan_shop_owner_name"
      | "artisan_shop_contact_phone"
      | "artisan_shop_verification_status"
      | "artisan_shop_verification_note"
      | "artisan_shop_verification_submitted_at"
      | "artisan_shop_verification_reviewed_at"
      | "artisan_shop_verification_reviewer"
      | "artisan_shop_screenshot_url"
      | "artisan_shop_owner_proof_url"
      | "artisan_shop_supporting_proof_url"
    >
  >
) {
  const supabase = getSupabaseClient();
  const updated_at = getIsoTimestr();

  const { data, error } = await supabase
    .from("users")
    .update({ ...patch, updated_at })
    .eq("uuid", user_uuid);

  if (error) {
    throw error;
  }

  return data;
}

export async function updateUserPasswordHash(
  user_uuid: string,
  password_hash: string
) {
  const supabase = getSupabaseClient();
  const updated_at = getIsoTimestr();
  const { data, error } = await supabase
    .from("users")
    .update({ password_hash, updated_at })
    .eq("uuid", user_uuid);

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteUserByUuid(user_uuid: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("users").delete().eq("uuid", user_uuid);

  if (error) {
    throw error;
  }

  return data;
}

export async function findUserByInviteCode(invite_code: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("invite_code", invite_code)
    .single();

  if (error) {
    return undefined;
  }

  return data;
}

export async function getUserUuidsByEmail(email: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("uuid")
    .eq("email", email);
  if (error) {
    return [];
  }

  return data.map((user) => user.uuid);
}
