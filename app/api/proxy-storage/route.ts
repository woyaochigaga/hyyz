import { NextRequest } from "next/server";
import { storagePublicOrigin } from "@/lib/storage-public";

function isAllowedStorageUrl(raw: string): boolean {
  const base = storagePublicOrigin();
  if (!base || !raw) return false;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    const allowed = new URL(
      base.startsWith("http://") || base.startsWith("https://")
        ? base
        : `https://${base}`
    );
    return u.origin === allowed.origin;
  } catch {
    return false;
  }
}

// GET /api/proxy-storage?src=https://your-bucket.cos.../avatars/...
// Bypasses browser Referer restrictions on COS hotlink protection.
export async function GET(req: NextRequest) {
  const src = req.nextUrl.searchParams.get("src") || "";
  if (!src || !isAllowedStorageUrl(src)) {
    return new Response("invalid src", { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  let upstream: Response;
  try {
    upstream = await fetch(src, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "User-Agent": "Mozilla/5.0 (compatible; HzzyStorageProxy/1.0)",
      },
    });
  } catch {
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
    "public, max-age=3600, s-maxage=86400";

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": cacheControl,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
