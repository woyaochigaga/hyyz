import { respData, respErr } from "@/lib/resp";
import { newStorage } from "@/lib/storage";
import { getUuid } from "@/lib/hash";
import { getUserUuid } from "@/services/user";
import {
  isServerTimeoutError,
  withServerTimeout,
} from "@/lib/server-timeout";

const MAX_FILE_SIZE = 40 * 1024 * 1024; // 40MB
const VIDEO_UPLOAD_TIMEOUT_MS = 45_000;
const ALLOWED_TYPES = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/x-m4v",
  "video/x-msvideo",
];

const EXT_BY_TYPE: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/ogg": "ogv",
  "video/quicktime": "mov",
  "video/x-m4v": "m4v",
  "video/x-msvideo": "avi",
};

export async function POST(req: Request) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("请先登录后再上传视频");
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return respErr("No file provided");
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return respErr("Invalid file type. Only videos are allowed");
    }

    if (file.size > MAX_FILE_SIZE) {
      return respErr("视频文件不能超过 40MB，当前上传链路超过该大小容易在 Vercel 超时");
    }

    const arrayBuffer = await withServerTimeout(
      file.arrayBuffer(),
      VIDEO_UPLOAD_TIMEOUT_MS,
      "视频读取超时，请压缩后重试"
    );
    const buffer = Buffer.from(arrayBuffer);

    const extFromName = file.name.split(".").pop()?.toLowerCase();
    const ext = extFromName || EXT_BY_TYPE[file.type] || "mp4";
    const filename = `${getUuid()}.${ext}`;
    const key = `ai-chat/${user_uuid}/videos/${filename}`;

    const storage = newStorage();
    const result = await withServerTimeout(
      storage.uploadFile({
        body: buffer,
        key,
        contentType: file.type,
        disposition: "inline",
      }),
      VIDEO_UPLOAD_TIMEOUT_MS,
      "视频上传超时，请压缩后重试"
    );

    return respData({
      url: result.url,
      filename: result.filename,
      key: result.key,
      size: file.size,
      contentType: file.type,
    });
  } catch (err: any) {
    console.error("Upload video failed:", err);
    return respErr(
      isServerTimeoutError(err)
        ? err.message
        : err?.message || "Upload failed"
    );
  }
}
