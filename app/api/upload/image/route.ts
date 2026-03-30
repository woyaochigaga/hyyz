import { respData, respErr } from "@/lib/resp";
import { newStorage } from "@/lib/storage";
import { getUuid } from "@/lib/hash";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return respErr("No file provided");
    }

    // 验证文件类型
    if (!ALLOWED_TYPES.includes(file.type)) {
      return respErr("Invalid file type. Only images are allowed");
    }

    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      return respErr("File size exceeds 10MB limit");
    }

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 生成文件名
    const ext = file.name.split(".").pop() || "png";
    const filename = `${getUuid()}.${ext}`;
    const key = `posts/${filename}`;

    // 上传到云存储
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
    });
  } catch (err: any) {
    console.error("Upload image failed:", err);
    return respErr(err.message || "Upload failed");
  }
}
