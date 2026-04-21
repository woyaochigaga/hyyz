import { respData, respErr } from "@/lib/resp";
import { getUuid } from "@/lib/hash";
import { createPresignedPutObjectUrl } from "@/lib/storage-presign";
import { getUserUuid } from "@/services/user";

const IMAGE_MAX_FILE_SIZE = 10 * 1024 * 1024;
const VIDEO_MAX_FILE_SIZE = 40 * 1024 * 1024;

const IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
const VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/x-m4v",
  "video/x-msvideo",
];

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/ogg": "ogv",
  "video/quicktime": "mov",
  "video/x-m4v": "m4v",
  "video/x-msvideo": "avi",
};

function normalizeKind(value: unknown): "image" | "video" | null {
  const kind = String(value || "").trim().toLowerCase();
  if (kind === "image" || kind === "video") {
    return kind;
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("请先登录后再上传文件");
    }

    const { kind, fileName, contentType, size } = await req.json();
    const normalizedKind = normalizeKind(kind);
    const normalizedContentType = String(contentType || "").trim().toLowerCase();
    const normalizedSize =
      typeof size === "number" && Number.isFinite(size) ? size : Number(size || 0);

    if (!normalizedKind || !normalizedContentType || !normalizedSize) {
      return respErr("invalid params");
    }

    const allowedTypes = normalizedKind === "image" ? IMAGE_TYPES : VIDEO_TYPES;
    if (!allowedTypes.includes(normalizedContentType)) {
      return respErr(
        normalizedKind === "image"
          ? "Invalid file type. Only images are allowed"
          : "Invalid file type. Only videos are allowed"
      );
    }

    const maxSize =
      normalizedKind === "image" ? IMAGE_MAX_FILE_SIZE : VIDEO_MAX_FILE_SIZE;
    if (normalizedSize > maxSize) {
      return respErr(
        normalizedKind === "image"
          ? "File size exceeds 10MB limit"
          : "视频文件不能超过 40MB，当前上传链路超过该大小容易在 Vercel 超时"
      );
    }

    const extFromName = String(fileName || "")
      .split(".")
      .pop()
      ?.toLowerCase();
    const ext = extFromName || EXT_BY_TYPE[normalizedContentType] || "bin";
    const filename = `${getUuid()}.${ext}`;
    const key = `ai-chat/${user_uuid}/${normalizedKind}s/${filename}`;
    const signed = createPresignedPutObjectUrl({ key });

    return respData({
      uploadUrl: signed.uploadUrl,
      url: signed.url,
      key,
      filename,
      contentType: normalizedContentType,
      size: normalizedSize,
      method: "PUT",
    });
  } catch (error: any) {
    console.error("create upload sign failed:", error);
    return respErr(error?.message || "create upload sign failed");
  }
}
