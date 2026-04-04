"use client";

import { ReactNode } from "react";
import moment from "moment";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { HomePost } from "@/types/home-post";

function statusLabel(status: HomePost["status"]) {
  if (status === "published") return "已发布";
  if (status === "draft") return "草稿";
  if (status === "deleted") return "已删除";
  return "其他";
}

function typeLabel(type: HomePost["type"]) {
  if (type === "text") return "文本";
  if (type === "image") return "图文";
  if (type === "video") return "视频";
  return type || "—";
}

function formatTime(value?: string) {
  if (!value) return "—";
  return moment(value).format("YYYY-MM-DD HH:mm:ss");
}

function MetaItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 break-all text-sm text-foreground">{value || "—"}</div>
    </div>
  );
}

export function HomePostDetailDialog({
  post,
  trigger,
}: {
  post: HomePost;
  trigger: ReactNode;
}) {
  const previewImages = Array.from(new Set([post.cover_url, ...(post.images || [])].filter(Boolean)));

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{post.title || "未命名帖子"}</DialogTitle>
          <DialogDescription>{post.uuid}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <MetaItem label="类型" value={typeLabel(post.type)} />
            <MetaItem label="状态" value={statusLabel(post.status)} />
            <MetaItem label="作者" value={post.author?.nickname || post.user_uuid || "—"} />
            <MetaItem label="语言" value={post.locale || "—"} />
            <MetaItem label="点赞" value={String(post.like_count || 0)} />
            <MetaItem label="评论" value={String(post.comment_count || 0)} />
            <MetaItem label="创建时间" value={formatTime(post.created_at)} />
            <MetaItem label="更新时间" value={formatTime(post.updated_at)} />
            <MetaItem label="发布时间" value={formatTime(post.published_at)} />
          </div>

          {post.tags && post.tags.length > 0 ? (
            <div className="space-y-2">
              <div className="text-sm font-medium">标签</div>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}

          {post.excerpt ? (
            <div className="space-y-2">
              <div className="text-sm font-medium">摘要</div>
              <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-sm leading-6 text-foreground">
                {post.excerpt}
              </div>
            </div>
          ) : null}

          {previewImages.length > 0 ? (
            <div className="space-y-2">
              <div className="text-sm font-medium">图片</div>
              <div className="grid gap-3 sm:grid-cols-2">
                {previewImages.map((url) => (
                  <img
                    key={url}
                    src={url}
                    alt={post.title || "post image"}
                    className="h-52 w-full rounded-lg border border-border/60 object-cover"
                  />
                ))}
              </div>
            </div>
          ) : null}

          {post.video_url ? (
            <div className="space-y-2">
              <div className="text-sm font-medium">视频</div>
              <video
                src={post.video_url}
                controls
                className="w-full rounded-lg border border-border/60 bg-black"
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <div className="text-sm font-medium">正文</div>
            <div className="min-h-32 whitespace-pre-wrap break-words rounded-lg border border-border/60 bg-muted/20 p-3 text-sm leading-6 text-foreground">
              {post.content || "暂无内容"}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
