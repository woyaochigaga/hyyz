/**
 * Public download origin for COS/S3 objects (custom domain or default bucket domain).
 * Trimmed, no trailing slash.
 */
export function storagePublicOrigin(): string {
  return (process.env.STORAGE_DOMAIN || "").trim().replace(/\/+$/, "");
}

/** Full HTTPS URL for an object key as stored in DB (avatars/...). */
export function buildPublicObjectUrl(objectKey: string): string {
  const base = storagePublicOrigin();
  if (!base) return "";
  const k = String(objectKey || "").replace(/^\/+/, "");
  if (!k) return "";
  return `${base}/${k}`;
}
