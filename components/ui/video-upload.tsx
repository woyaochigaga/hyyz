"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader, X } from "lucide-react";
import { toast } from "sonner";
import { uploadAsset } from "@/lib/client-upload";

interface VideoUploadProps {
  value?: string;
  onChange?: (url: string) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 40 * 1024 * 1024;

export function VideoUpload({
  value,
  onChange,
  disabled,
}: VideoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value || "");

  useEffect(() => {
    setPreview(value || "");
  }, [value]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("请选择视频文件");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("视频大小不能超过 40MB");
      return;
    }

    setUploading(true);

    try {
      const result = await uploadAsset(file, "video");
      setPreview(result.url);
      onChange?.(result.url);
      toast.success("视频上传成功");
    } catch (error: any) {
      toast.error(error.message || "视频上传失败");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleRemove = () => {
    setPreview("");
    onChange?.("");
  };

  return (
    <div className="space-y-2">
      {preview ? (
        <div className="relative w-full max-w-xl">
          <video
            src={preview}
            controls
            className="max-h-72 w-full rounded-lg border bg-black"
          />
          {!disabled && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute right-2 top-2"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-m4v,video/x-msvideo"
            onChange={handleFileChange}
            disabled={disabled || uploading}
            className="cursor-pointer"
          />
          {uploading && <Loader className="h-4 w-4 animate-spin" />}
        </div>
      )}
    </div>
  );
}
