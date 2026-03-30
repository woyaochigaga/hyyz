export function isGoogleAvatarUrl(src?: string): boolean {
  if (!src) return false;
  try {
    const url = new URL(src);
    const host = url.hostname.toLowerCase();
    return (
      host === "lh3.googleusercontent.com" ||
      host.endsWith(".googleusercontent.com")
    );
  } catch {
    return false;
  }
}

/** Set via next.config env from STORAGE_DOMAIN so client can match COS origins. */
function storagePublicOriginForClient(): string {
  const raw = (process.env.NEXT_PUBLIC_STORAGE_DOMAIN || "").trim();
  return raw.replace(/\/+$/, "");
}

function isOurStorageAvatarUrl(src: string): boolean {
  const base = storagePublicOriginForClient();
  if (!base) return false;
  try {
    const normalizedBase =
      base.startsWith("http://") || base.startsWith("https://")
        ? base
        : `https://${base}`;
    return new URL(src).origin === new URL(normalizedBase).origin;
  } catch {
    return false;
  }
}

/**
 * Use same-origin proxy where hotlink / Referer rules break direct <img src>.
 */
export function proxifyAvatarUrl(src?: string) {
  if (!src) return "";
  if (isGoogleAvatarUrl(src)) {
    return `/api/proxy-avatar?src=${encodeURIComponent(src)}`;
  }
  if (isOurStorageAvatarUrl(src)) {
    return `/api/proxy-storage?src=${encodeURIComponent(src)}`;
  }
  return src;
}

