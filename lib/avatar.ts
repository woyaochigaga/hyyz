export function proxifyAvatarUrl(src?: string) {
  if (!src) return "";
  try {
    const url = new URL(src);
    const host = url.hostname.toLowerCase();
    if (host === "lh3.googleusercontent.com" || host.endsWith(".googleusercontent.com")) {
      return `/api/proxy-avatar?src=${encodeURIComponent(src)}`;
    }
    return src;
  } catch {
    return src;
  }
}

