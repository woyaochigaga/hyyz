"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { proxifyAvatarUrl } from "@/lib/avatar";
import { getForumExcerpt } from "@/models/forum";
import { ForumPost } from "@/types/forum";
import { Clock3, MessageSquare, Share2, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { shareForumPost } from "@/lib/share";

function formatDate(date?: string, locale = "zh") {
  if (!date) return "";
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "";

  return new Intl.DateTimeFormat(locale.startsWith("zh") ? "zh-CN" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function initials(name?: string) {
  return String(name || "").trim().slice(0, 1).toUpperCase() || "U";
}

export function ForumPostCard({
  locale,
  post,
  featured = false,
  className,
  onOpenPost,
  onPostChange,
}: {
  locale: string;
  post: ForumPost;
  featured?: boolean;
  className?: string;
  onOpenPost?: (post: ForumPost) => void;
  onPostChange?: (post: ForumPost) => void;
}) {
  const router = useRouter();
  const isZh = locale.startsWith("zh");
  const [currentPost, setCurrentPost] = React.useState(post);
  const [liking, setLiking] = React.useState(false);
  const [sharing, setSharing] = React.useState(false);

  React.useEffect(() => {
    setCurrentPost(post);
  }, [post]);

  const isBarOwner = currentPost.bar?.creator_id === currentPost.author_id;
  const barCover = currentPost.bar?.cover_image
    ? proxifyAvatarUrl(currentPost.bar.cover_image) || currentPost.bar.cover_image
    : "";

  const cardClass = cn(
    "group block cursor-pointer overflow-hidden rounded-xl bg-white text-left shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition hover:shadow-[0_4px_14px_rgba(0,0,0,0.08)] dark:bg-zinc-900/90 dark:shadow-none dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.35)]",
    featured ? "p-5 sm:p-6" : "p-4 sm:p-5",
    className
  );

  const openPost = React.useCallback(() => {
    if (onOpenPost) {
      onOpenPost(currentPost);
      return;
    }

    router.push(`/${locale}/home/forum?post=${currentPost.id}`);
  }, [currentPost, locale, onOpenPost, router]);

  const handleToggleLike = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (liking) return;

    setLiking(true);
    try {
      const resp = await fetch(`/api/forum/post/${currentPost.id}/like`, {
        method: "POST",
      });
      const result = await resp.json();
      if (result.code !== 0) {
        throw new Error(result.message || (isZh ? "点赞失败" : "Like failed"));
      }

      const nextPost = {
        ...currentPost,
        liked: Boolean(result.data?.liked),
        like_count: Number(result.data?.like_count || 0),
      };
      setCurrentPost(nextPost);
      onPostChange?.(nextPost);
    } catch (error: any) {
      toast.error(error?.message || (isZh ? "点赞失败" : "Like failed"));
    } finally {
      setLiking(false);
    }
  };

  const handleShare = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (sharing) return;

    setSharing(true);
    try {
      const action = await shareForumPost({
        locale,
        postId: currentPost.id,
        title: currentPost.title || (isZh ? "论坛帖子" : "Forum post"),
        text: getForumExcerpt(currentPost.content, 48),
      });
      toast.success(action === "shared" ? (isZh ? "已调起分享" : "Share opened") : isZh ? "链接已复制" : "Link copied");
    } catch (error: any) {
      if (error?.name !== "AbortError") {
        toast.error(isZh ? "分享失败" : "Share failed");
      }
    } finally {
      setSharing(false);
    }
  };

  const content = (
    <>
      {currentPost.bar ? (
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[#f7f8fa] dark:bg-zinc-800">
              {barCover ? (
                <img
                  src={barCover}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-[#2f5fd0]">
                  {initials(currentPost.bar.name)}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
                {currentPost.bar.name}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                {isZh
                  ? `帖子 ${currentPost.bar.post_count} · 关注 ${currentPost.bar.follow_count}`
                  : `${currentPost.bar.post_count} posts · ${currentPost.bar.follow_count} follows`}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className={cn("min-w-0", currentPost.bar ? "mt-4" : "mt-0")}>
        <h3
          className={cn(
            "line-clamp-2 font-semibold tracking-tight text-zinc-900 transition-colors group-hover:text-[#2f5fd0] dark:text-white dark:group-hover:text-[#8ab4ff]",
            featured ? "text-[1.25rem] leading-snug sm:text-[1.35rem]" : "text-base leading-snug sm:text-lg"
          )}
        >
          {currentPost.title || getForumExcerpt(currentPost.content, featured ? 34 : 28)}
        </h3>
        <p
          className={cn(
            "mt-2 whitespace-pre-wrap text-zinc-600 dark:text-zinc-300",
            featured ? "line-clamp-4 text-[15px] leading-7" : "line-clamp-3 text-sm leading-6"
          )}
        >
          {getForumExcerpt(currentPost.content, featured ? 180 : 120)}
        </p>
      </div>

      <div className={cn("flex items-center gap-3", featured ? "mt-5" : "mt-4")}>
        <Avatar className={cn("shrink-0", featured ? "h-9 w-9" : "h-8 w-8")}>
          <AvatarImage
            src={proxifyAvatarUrl(currentPost.author?.avatar_url) || undefined}
            alt={currentPost.author?.nickname || "User"}
          />
          <AvatarFallback className="text-xs">{initials(currentPost.author?.nickname)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">
              {currentPost.author?.nickname || (isZh ? "未命名用户" : "Unknown user")}
            </span>
            {isBarOwner ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                {isZh ? "吧主" : "Owner"}
              </span>
            ) : null}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <Clock3 className="h-3.5 w-3.5 shrink-0" />
            <span>{formatDate(currentPost.last_reply_at || currentPost.created_at, locale)}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-5 pt-1 text-sm text-zinc-500 dark:text-zinc-400">
        <button
          type="button"
          disabled={sharing}
          onClick={handleShare}
          onKeyDown={(event) => {
            event.stopPropagation();
          }}
          className="inline-flex items-center gap-1.5 transition hover:text-primary disabled:opacity-60"
        >
          <Share2 className="h-4 w-4 opacity-70" />
          {isZh ? "分享" : "Share"}
        </button>
        <span className="inline-flex items-center gap-1.5">
          <MessageSquare className="h-4 w-4 opacity-70" />
          {currentPost.reply_count}
        </span>
        <button
          type="button"
          disabled={liking}
          onClick={handleToggleLike}
          onKeyDown={(event) => {
            event.stopPropagation();
          }}
          className={cn(
            "inline-flex items-center gap-1.5 transition hover:text-primary disabled:opacity-60",
            currentPost.liked && "text-primary"
          )}
        >
          <ThumbsUp className={cn("h-4 w-4 opacity-70", currentPost.liked && "fill-current opacity-100")} />
          {currentPost.like_count}
        </button>
      </div>
    </>
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openPost}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) {
          return;
        }
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openPost();
        }
      }}
      className={cardClass}
    >
      {content}
    </div>
  );
}
