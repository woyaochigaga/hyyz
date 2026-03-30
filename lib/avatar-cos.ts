import type { User } from "@/types/user";
import { isGoogleAvatarUrl } from "@/lib/avatar";
import { newStorage } from "@/lib/storage";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

function extFromContentType(ct: string | null): string {
  const t = (ct || "").split(";")[0].trim().toLowerCase();
  if (t === "image/png") return ".png";
  if (t === "image/webp") return ".webp";
  if (t === "image/gif") return ".gif";
  if (t === "image/jpeg" || t === "image/jpg") return ".jpg";
  return ".jpg";
}

/** Fetch Google profile image and store on COS (S3-compatible). */
export async function mirrorGoogleProfilePictureToCos(
  googleImageUrl: string,
  userUuid: string
): Promise<string | null> {
  if (!isGoogleAvatarUrl(googleImageUrl) || !userUuid) return null;
  if (!process.env.STORAGE_BUCKET || !process.env.STORAGE_ENDPOINT) {
    console.warn("mirrorGoogleProfilePictureToCos: storage env not configured");
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(googleImageUrl, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "User-Agent": "Mozilla/5.0 (compatible; HzzyOAuthAvatar/1.0)",
      },
    });
    if (!res.ok) return null;
    const len = res.headers.get("content-length");
    if (len && Number(len) > MAX_AVATAR_BYTES) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_AVATAR_BYTES) return null;

    const rawCt = res.headers.get("content-type");
    const ext = extFromContentType(rawCt);
    const contentType =
      rawCt?.split(";")[0].trim() ||
      (ext === ".png"
        ? "image/png"
        : ext === ".webp"
          ? "image/webp"
          : ext === ".gif"
            ? "image/gif"
            : "image/jpeg");

    const storage = newStorage();
    const key = `avatars/${userUuid}${ext}`;
    const out = await storage.uploadFile({
      body: buf,
      key,
      contentType,
      disposition: "inline",
    });
    return out.url ?? null;
  } catch (e) {
    console.error("mirrorGoogleProfilePictureToCos:", e);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * For OAuth sign-in: replace googleusercontent URLs with COS URLs.
 * If the user already has a non-Google avatar in DB, keep it.
 */
export async function resolveOAuthAvatarForDb(
  oauthImage: string | null | undefined,
  existUser: User | undefined,
  userUuid: string
): Promise<string> {
  if (existUser?.avatar_url && !isGoogleAvatarUrl(existUser.avatar_url)) {
    return existUser.avatar_url;
  }

  const googleSrc =
    (oauthImage && isGoogleAvatarUrl(oauthImage) ? oauthImage : null) ||
    (existUser?.avatar_url && isGoogleAvatarUrl(existUser.avatar_url)
      ? existUser.avatar_url
      : null);

  if (googleSrc) {
    const cos = await mirrorGoogleProfilePictureToCos(googleSrc, userUuid);
    if (cos) return cos;
    return googleSrc;
  }

  return oauthImage || existUser?.avatar_url || "";
}
