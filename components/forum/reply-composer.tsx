"use client";

import * as React from "react";
import { ImageUpload } from "@/components/ui/image-upload";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function ReplyComposer({
  locale,
  value,
  imageUrl,
  replying,
  submitDisabled = false,
  placeholder,
  submitLabel,
  cancelLabel,
  targetLabel,
  onValueChange,
  onImageChange,
  onSubmit,
  onCancel,
  className,
}: {
  locale: string;
  value: string;
  imageUrl: string;
  replying: boolean;
  submitDisabled?: boolean;
  placeholder: string;
  submitLabel: string;
  cancelLabel: string;
  targetLabel?: string;
  onValueChange: (value: string) => void;
  onImageChange: (url: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel?: () => void;
  className?: string;
}) {
  const isZh = locale.startsWith("zh");

  return (
    <form
      className={cn(
        "space-y-3 rounded-2xl border border-zinc-200/90 bg-white px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-zinc-800 dark:bg-zinc-950/85 dark:shadow-[0_12px_30px_rgba(0,0,0,0.22)]",
        className
      )}
      onSubmit={onSubmit}
    >
      {targetLabel ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-200">
          <span className="text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            {isZh ? "回复目标" : "Reply target"}
          </span>
          <div className="mt-1 font-medium text-zinc-900 dark:text-white">
            {targetLabel}
          </div>
        </div>
      ) : null}

      <Textarea
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-[120px] rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm leading-6 text-zinc-900 shadow-none placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-primary/20 dark:border-zinc-800 dark:bg-zinc-950/90 dark:text-zinc-100 dark:placeholder:text-zinc-500"
      />

      <div className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 dark:border-zinc-800 dark:bg-zinc-900/70">
        <div className="text-xs text-zinc-600 dark:text-zinc-300">
          {isZh ? "支持上传一张图片，可只发图片或图片加文字。" : "Attach one image, with or without text."}
        </div>
        <ImageUpload value={imageUrl} onChange={onImageChange} disabled={replying} />
      </div>

      <div className="flex justify-end gap-2">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={replying}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-white/60 bg-white/70 px-5 text-sm font-medium text-zinc-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/8 dark:text-zinc-200 dark:hover:bg-white/12"
          >
            {cancelLabel}
          </button>
        ) : null}
        <button
          type="submit"
          disabled={replying || submitDisabled}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {replying ? (isZh ? "发送中..." : "Sending...") : submitLabel}
        </button>
      </div>
    </form>
  );
}

export function getReplyTargetLabel(
  locale: string,
  target: { nickname?: string; floor?: number } | null | undefined
) {
  if (!target) {
    return locale.startsWith("zh") ? "回复主贴" : "Reply to thread";
  }

  const name = String(target.nickname || "").trim() || (locale.startsWith("zh") ? "未命名用户" : "Unknown user");
  const floorText = target.floor
    ? locale.startsWith("zh")
      ? ` · ${target.floor}楼`
      : ` · #${target.floor}`
    : "";

  return locale.startsWith("zh")
    ? `回复 ${name}${floorText}`
    : `Reply to ${name}${floorText}`;
}
