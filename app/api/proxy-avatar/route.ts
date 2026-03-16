import { NextRequest } from "next/server";

const ALLOWED_HOSTS = new Set([
  "lh3.googleusercontent.com",
  "googleusercontent.com",
]);

function isAllowedAvatarUrl(raw: string) {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return false;
    const host = url.hostname.toLowerCase();
    if (ALLOWED_HOSTS.has(host)) return true;
    // allow subdomains of googleusercontent.com
    if (host.endsWith(".googleusercontent.com")) return true;
    return false;
  } catch {
    return false;
  }
}

// GET /api/proxy-avatar?src=https://...
export async function GET(req: NextRequest) {
  const src = req.nextUrl.searchParams.get("src") || "";
  if (!src || !isAllowedAvatarUrl(src)) {
    return new Response("invalid src", { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  let upstream: Response;
  try {
    upstream = await fetch(src, {
      // no credentials/cookies forwarded
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        // Some upstreams rate-limit aggressively without UA
        "User-Agent":
          "Mozilla/5.0 (compatible; HzzyAvatarProxy/1.0; +http://localhost)",
      },
    });
  } catch (e) {
    return new Response("upstream fetch failed", { status: 504 });
  } finally {
    clearTimeout(timeout);
  }

  if (!upstream.ok) {
    return new Response(`upstream error: ${upstream.status}`, {
      status: 502,
    });
  }

  const contentType =
    upstream.headers.get("content-type") || "application/octet-stream";
  const cacheControl =
    upstream.headers.get("cache-control") ||
    // cache on CDN/browser; tune later if needed
    "public, max-age=3600, s-maxage=86400";

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": cacheControl,
      // Avoid MIME sniffing issues
      "X-Content-Type-Options": "nosniff",
    },
  });
}

