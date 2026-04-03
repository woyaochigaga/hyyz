import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { proxifyAvatarUrl } from "@/lib/avatar";
import { getForumExcerpt } from "@/models/forum";
import { ForumPost } from "@/types/forum";
import { Clock3, MessageSquare, Share2, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const isZh = locale.startsWith("zh");
  const isBarOwner = post.bar?.creator_id === post.author_id;
  const barCover = post.bar?.cover_image
    ? proxifyAvatarUrl(post.bar.cover_image) || post.bar.cover_image
    : "";

  return (
    <Link
      href={`/${locale}/home/forum/post/${post.id}`}
      onClick={() => {
        onOpenPost?.(post);
        onPostChange?.(post);
      }}
      className={cn(
        "group block overflow-hidden rounded-xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition hover:shadow-[0_4px_14px_rgba(0,0,0,0.08)] dark:bg-zinc-900/90 dark:shadow-none dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.35)]",
        featured ? "p-5 sm:p-6" : "p-4 sm:p-5",
        className
      )}
    >
      {post.bar ? (
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
                  {initials(post.bar.name)}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
                {post.bar.name}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                {isZh
                  ? `帖子 ${post.bar.post_count} · 关注 ${post.bar.follow_count}`
                  : `${post.bar.post_count} posts · ${post.bar.follow_count} follows`}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className={cn("min-w-0", post.bar ? "mt-4" : "mt-0")}>
        <h3
          className={cn(
            "line-clamp-2 font-semibold tracking-tight text-zinc-900 transition-colors group-hover:text-[#2f5fd0] dark:text-white dark:group-hover:text-[#8ab4ff]",
            featured ? "text-[1.25rem] leading-snug sm:text-[1.35rem]" : "text-base leading-snug sm:text-lg"
          )}
        >
          {post.title || getForumExcerpt(post.content, featured ? 34 : 28)}
        </h3>
        <p
          className={cn(
            "mt-2 whitespace-pre-wrap text-zinc-600 dark:text-zinc-300",
            featured ? "line-clamp-4 text-[15px] leading-7" : "line-clamp-3 text-sm leading-6"
          )}
        >
          {getForumExcerpt(post.content, featured ? 180 : 120)}
        </p>
      </div>

      <div className={cn("flex items-center gap-3", featured ? "mt-5" : "mt-4")}>
        <Avatar className={cn("shrink-0", featured ? "h-9 w-9" : "h-8 w-8")}>
          <AvatarImage
            src={proxifyAvatarUrl(post.author?.avatar_url) || undefined}
            alt={post.author?.nickname || "User"}
          />
          <AvatarFallback className="text-xs">{initials(post.author?.nickname)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">
              {post.author?.nickname || (isZh ? "未命名用户" : "Unknown user")}
            </span>
            {isBarOwner ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                {isZh ? "吧主" : "Owner"}
              </span>
            ) : null}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <Clock3 className="h-3.5 w-3.5 shrink-0" />
            <span>{formatDate(post.last_reply_at || post.created_at, locale)}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-5 pt-1 text-sm text-zinc-500 dark:text-zinc-400">
        <span className="inline-flex items-center gap-1.5">
          <Share2 className="h-4 w-4 opacity-70" />
          {isZh ? "分享" : "Share"}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MessageSquare className="h-4 w-4 opacity-70" />
          {post.reply_count}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ThumbsUp className="h-4 w-4 opacity-70" />
          {post.like_count}
        </span>
      </div>
    </Link>
  );
}
