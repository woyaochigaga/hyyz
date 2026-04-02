"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { proxifyAvatarUrl } from "@/lib/avatar";
import { HomePost } from "@/types/home-post";
import { PostCommentsPanel } from "@/components/home/post-comments-panel";
import { PostMediaGallery } from "@/components/home/post-media-gallery";
import Markdown from "@/components/markdown";
import { ArrowLeft, Heart, MessageCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type UserInfoResponse = {
  code?: number;
  data?: {
    uuid?: string;
  };
};

function formatDate(date?: string, locale = "zh") {
  if (!date) return "";
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "";
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function initials(name?: string) {
  return String(name || "").trim().slice(0, 1).toUpperCase() || "U";
}

export function PostDetailView({
  locale,
  uuid,
}: {
  locale: string;
  uuid: string;
}) {
  const t = useTranslations("home");
  const router = useRouter();
  const [post, setPost] = React.useState<HomePost | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [currentUserUuid, setCurrentUserUuid] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const loadPost = React.useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch(`/api/home/post/${uuid}`);
      const result = await resp.json();
      if (result.code === 0) {
        setPost(result.data || null);
      } else {
        setPost(null);
        toast.error(result.message || t("detail.load_failed"));
      }
    } catch {
      setPost(null);
      toast.error(t("detail.load_failed"));
    } finally {
      setLoading(false);
    }
  }, [t, uuid]);

  React.useEffect(() => {
    void loadPost();
  }, [loadPost]);

  React.useEffect(() => {
    let cancelled = false;
    const loadUser = async () => {
      try {
        const resp = await fetch("/api/get-user-info", { method: "POST" });
        const result = (await resp.json()) as UserInfoResponse;
        if (!cancelled) {
          setCurrentUserUuid(String(result?.data?.uuid || "").trim() || null);
        }
      } catch {
        if (!cancelled) setCurrentUserUuid(null);
      }
    };
    void loadUser();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggleLike = async () => {
    if (!post) return;
    if (!currentUserUuid) {
      toast.error(t("feed.login_required"));
      return;
    }
    try {
      const resp = await fetch(`/api/home/post/${post.uuid}/like`, {
        method: "POST",
      });
      const result = await resp.json();
      if (result.code !== 0) {
        throw new Error(result.message || t("feed.like_failed"));
      }
      setPost((prev) =>
        prev
          ? {
              ...prev,
              liked: Boolean(result.data?.liked),
              like_count: Number(result.data?.like_count || 0),
            }
          : prev
      );
    } catch (error: any) {
      toast.error(error?.message || t("feed.like_failed"));
    }
  };

  const handleDelete = async () => {
    if (!post) return;
    setDeleting(true);
    try {
      const resp = await fetch(`/api/home/post/${post.uuid}`, {
        method: "DELETE",
      });
      const result = await resp.json();
      if (result.code !== 0) {
        throw new Error(result.message || t("detail.delete_failed"));
      }
      toast.success(t("detail.deleted"));
      router.push(`/${locale}/home`);
      router.refresh();
    } catch (error: any) {
      toast.error(error?.message || t("detail.delete_failed"));
    } finally {
      setDeleting(false);
    }
  };

  const handleBack = React.useCallback(() => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(`/${locale}/home`);
  }, [locale, router]);

  const handleScrollToComments = React.useCallback(() => {
    document
      .getElementById("post-comments-panel")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  if (loading) {
    return (
      <div className="h-[480px] animate-pulse rounded-[32px] bg-zinc-100 dark:bg-white/[0.04]" />
    );
  }

  if (!post) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-[28px] border border-dashed border-zinc-200 bg-white/70 dark:border-white/10 dark:bg-white/[0.03]">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
          {t("detail.not_found")}
        </h1>
        <Link
          href={`/${locale}/home`}
          className="mt-4 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
        >
          {t("detail.back_home")}
        </Link>
      </div>
    );
  }

  const isOwner = Boolean(currentUserUuid && currentUserUuid === post.user_uuid);
  const isVideoPost = post.type === "video" && Boolean(post.video_url);
  const videoBody =
    isVideoPost && post.content.trim() !== post.excerpt?.trim() ? post.content.trim() : "";
  const detailBody = isVideoPost ? (videoBody || "") : post.content;

  return (
    <div className="flex min-h-full w-full min-w-0 max-w-none flex-col gap-6">
      <section className="relative overflow-hidden rounded-[32px] border border-black/5 bg-white shadow-[0_24px_64px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[rgba(34,36,46,0.88)]">
        <button
          type="button"
          onClick={handleBack}
          className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-zinc-200/90 bg-white/95 px-3.5 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 dark:border-white/15 dark:bg-[rgba(24,24,27,0.8)] dark:text-zinc-200 dark:hover:bg-[rgba(39,39,42,0.92)] dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("detail.back")}
        </button>

        <>
          <div className="w-full border-b border-black/5 bg-[#f5f7f6] px-4 py-4 dark:border-white/10 dark:bg-zinc-900/40 sm:px-6">
            <PostMediaGallery
              post={post}
              aspectClassName="aspect-[16/9.2]"
              className="mx-auto w-full max-w-[96rem] overflow-hidden rounded-2xl"
              showBadge={false}
              preferVideoPlayback={isVideoPost}
              autoPlay={isVideoPost}
            />
          </div>

          <div className="mx-auto flex w-full max-w-[96rem] flex-col gap-6 p-4 sm:p-6">
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border border-black/5 dark:border-white/10">
                    <AvatarImage
                      src={proxifyAvatarUrl(post.author?.avatar_url) || undefined}
                      alt={post.author?.nickname || "User"}
                    />
                    <AvatarFallback>{initials(post.author?.nickname)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium text-zinc-900 dark:text-white">
                        {post.author?.nickname || t("feed.unknown_author")}
                      </div>
                      <span className="rounded-full bg-[#e8f0ed] px-2 py-0.5 text-[10px] font-medium text-[#4d665f] dark:bg-white/[0.08] dark:text-[#d7e6e0]">
                        {t("feed.author_badge")}
                      </span>
                    </div>
                    <div className="text-sm text-zinc-500">
                      {formatDate(post.created_at, locale)}
                    </div>
                  </div>
                </div>

                {isOwner ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void handleDelete()}
                    disabled={deleting}
                    className="rounded-full"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {deleting ? t("detail.deleting") : t("detail.delete_work")}
                  </Button>
                ) : null}
              </div>

              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                  {post.title || t("feed.untitled")}
                </h1>
                {post.excerpt ? (
                  <p className="mt-4 text-base leading-7 text-zinc-500 dark:text-zinc-300">
                    {post.excerpt}
                  </p>
                ) : null}

                {detailBody ? (
                  <Markdown
                    content={detailBody}
                    className="mt-4 text-[15px] leading-8 text-zinc-700 dark:text-zinc-200"
                  />
                ) : null}
              </div>

              <div className="flex flex-col gap-4 border-t border-black/5 pt-4 dark:border-white/10 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  {(post.tags || []).map((tag) => (
                    <span
                      key={`${post.uuid}-${tag}`}
                      className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600 dark:border dark:border-white/10 dark:bg-[#334640] dark:text-[#eef7f3]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 self-end">
                  <button
                    type="button"
                    onClick={() => void handleToggleLike()}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition",
                      post.liked
                        ? "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-300"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
                    )}
                  >
                    <Heart className={cn("h-4 w-4", post.liked && "fill-current")} />
                    {post.like_count || 0}
                  </button>
                  <button
                    type="button"
                    onClick={handleScrollToComments}
                    className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-2 text-sm text-zinc-600 transition hover:bg-zinc-200 hover:text-zinc-900 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {post.comment_count || 0}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      </section>

      <section
        id="post-comments-panel"
        className="overflow-hidden rounded-[32px] border border-black/5 bg-white shadow-[0_24px_64px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[rgba(34,36,46,0.88)]"
      >
        <PostCommentsPanel
          locale={locale}
          currentUserUuid={currentUserUuid}
          post={post}
          onCommentCountChange={(count) =>
            setPost((prev) => (prev ? { ...prev, comment_count: count } : prev))
          }
          className="w-full"
        />
      </section>
    </div>
  );
}
