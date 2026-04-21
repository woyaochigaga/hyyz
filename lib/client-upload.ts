"use client";

type UploadKind = "image" | "video";

type UploadedAsset = {
  url: string;
  key: string;
  filename: string;
  contentType: string;
  size: number;
};

type SignResult = {
  uploadUrl: string;
  url: string;
  key: string;
  filename: string;
  contentType: string;
  size: number;
  method: "PUT";
};

async function uploadViaLegacyApi(file: File, kind: UploadKind): Promise<UploadedAsset> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(kind === "image" ? "/api/upload/image" : "/api/upload/video", {
    method: "POST",
    body: formData,
  });
  const result = await response.json();

  if (result.code !== 0 || !result.data?.url) {
    throw new Error(result.message || "上传失败");
  }

  return {
    url: String(result.data.url || ""),
    key: String(result.data.key || ""),
    filename: String(result.data.filename || file.name || ""),
    contentType: String(result.data.contentType || file.type || ""),
    size:
      typeof result.data.size === "number" && Number.isFinite(result.data.size)
        ? result.data.size
        : file.size,
  };
}

export async function uploadAsset(file: File, kind: UploadKind): Promise<UploadedAsset> {
  try {
    const signResponse = await fetch("/api/upload/sign", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        kind,
        fileName: file.name,
        contentType: file.type,
        size: file.size,
      }),
    });

    const signResult = await signResponse.json();
    if (signResult.code !== 0 || !signResult.data?.uploadUrl || !signResult.data?.url) {
      throw new Error(signResult.message || "获取上传签名失败");
    }

    const signed = signResult.data as SignResult;
    const uploadResponse = await fetch(signed.uploadUrl, {
      method: signed.method || "PUT",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error(`上传失败 (${uploadResponse.status})`);
    }

    return {
      url: String(signed.url || ""),
      key: String(signed.key || ""),
      filename: String(signed.filename || file.name || ""),
      contentType: String(signed.contentType || file.type || ""),
      size:
        typeof signed.size === "number" && Number.isFinite(signed.size)
          ? signed.size
          : file.size,
    };
  } catch (error) {
    console.warn("direct upload failed, fallback to api upload:", error);
    return uploadViaLegacyApi(file, kind);
  }
}
