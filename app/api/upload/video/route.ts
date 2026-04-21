import { respData, respErr } from "@/lib/resp";
import { newStorage } from "@/lib/storage";
import { getUuid } from "@/lib/hash";
import { getUserUuid } from "@/services/user";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
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
      return respErr("File size exceeds 100MB limit");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const extFromName = file.name.split(".").pop()?.toLowerCase();
    const ext = extFromName || EXT_BY_TYPE[file.type] || "mp4";
    const filename = `${getUuid()}.${ext}`;
    const key = `ai-chat/${user_uuid}/videos/${filename}`;

    const storage = newStorage();
    const result = await storage.uploadFile({
      body: buffer,
      key,
      contentType: file.type,
      disposition: "inline",
    });

    return respData({
      url: result.url,
      filename: result.filename,
      key: result.key,
      size: file.size,
      contentType: file.type,
    });
  } catch (err: any) {
    console.error("Upload video failed:", err);
    return respErr(err?.message || "Upload failed");
  }
}
