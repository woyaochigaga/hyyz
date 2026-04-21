import { createHash, createHmac } from "crypto";
import { buildPublicObjectUrl } from "@/lib/storage-public";

type PresignPutObjectInput = {
  key: string;
  expiresIn?: number;
};

function getRequiredEnv(name: string) {
  const value = String(process.env[name] || "").trim();
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function getStorageConfig() {
  const endpointRaw = getRequiredEnv("STORAGE_ENDPOINT");
  const endpoint = new URL(
    endpointRaw.startsWith("http://") || endpointRaw.startsWith("https://")
      ? endpointRaw
      : `https://${endpointRaw}`
  );

  return {
    endpoint,
    region: getRequiredEnv("STORAGE_REGION"),
    accessKeyId: getRequiredEnv("STORAGE_ACCESS_KEY"),
    secretAccessKey: getRequiredEnv("STORAGE_SECRET_KEY"),
    bucket: getRequiredEnv("STORAGE_BUCKET"),
  };
}

function encodeRfc3986(value: string) {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

function encodeObjectKey(key: string) {
  return key
    .split("/")
    .map((part) => encodeRfc3986(part))
    .join("/");
}

function sha256Hex(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function hmac(key: Buffer | string, value: string) {
  return createHmac("sha256", key).update(value, "utf8").digest();
}

function formatAmzDate(date: Date) {
  const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return {
    amzDate: iso,
    dateStamp: iso.slice(0, 8),
  };
}

function resolveUploadHost(endpoint: URL, bucket: string) {
  if (endpoint.hostname.startsWith(`${bucket}.`)) {
    return endpoint.hostname;
  }

  return `${bucket}.${endpoint.hostname}`;
}

export function createPresignedPutObjectUrl({
  key,
  expiresIn = 600,
}: PresignPutObjectInput) {
  const { endpoint, region, accessKeyId, secretAccessKey, bucket } =
    getStorageConfig();
  const now = new Date();
  const { amzDate, dateStamp } = formatAmzDate(now);
  const host = resolveUploadHost(endpoint, bucket);
  const canonicalUri = `/${encodeObjectKey(String(key || "").replace(/^\/+/, ""))}`;
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;

  const query = new URLSearchParams({
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${accessKeyId}/${credentialScope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expiresIn),
    "X-Amz-SignedHeaders": "host",
  });

  const canonicalQueryString = query
    .toString()
    .split("&")
    .sort()
    .join("&");

  const canonicalRequest = [
    "PUT",
    canonicalUri,
    canonicalQueryString,
    `host:${host}\n`,
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const signingKey = hmac(
    hmac(
      hmac(hmac(`AWS4${secretAccessKey}`, dateStamp), region),
      "s3"
    ),
    "aws4_request"
  );
  const signature = createHmac("sha256", signingKey)
    .update(stringToSign, "utf8")
    .digest("hex");

  const uploadUrl = new URL(`${endpoint.protocol}//${host}${canonicalUri}`);
  uploadUrl.search = `${canonicalQueryString}&X-Amz-Signature=${signature}`;

  return {
    uploadUrl: uploadUrl.toString(),
    key,
    url: buildPublicObjectUrl(key),
  };
}
