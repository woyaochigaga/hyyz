"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarDays, Clapperboard, FileText, PlayCircle, RotateCcw, Trash2 } from "lucide-react";
import { proxifyAvatarUrl } from "@/lib/avatar";
import { HomePost } from "@/types/home-post";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type MyPostsViewProps = {
  locale: string;
  user: {
    nickname?: string;
    avatar_url?: string;
    created_at?: string;
  };
};

function formatDate(date?: string, locale = "zh") {
  if (!date) return "-";
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "-";

  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

function getStatusText(status: string | undefined, t: ReturnType<typeof useTranslations>) {
  if (status === "published") return t("status_online");
  if (status === "deleted") return t("status_deleted");
  return t("status_created");
}

function getPostUrl(locale: string, uuid?: string) {
  if (!uuid) return "#";
  return `/${locale}/home/post/${uuid}`;
}

export function MyPostsView({ locale, user }: MyPostsViewProps) {
  const t = useTranslations("my_invites");
  const [posts, setPosts] = React.useState<HomePost[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentView, setCurrentView] = React.useState<"list" | "trash">("list");
  const [restoringUuid, setRestoringUuid] = React.useState<string>("");

  const loadPosts = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/home/post/mine?includeDeleted=1", {
        cache: "no-store",
      });
      const result = await response.json();

      if (result?.code === 0) {
        setPosts(Array.isArray(result.data) ? result.data : []);
      } else if (result?.code !== -2) {
        toast.error(result?.message || "加载作品失败");
      }
    } catch {
      toast.error("加载作品失败");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const activePosts = React.useMemo(
    () => posts.filter((item) => item.status !== "deleted"),
    [posts]
  );
  const deletedPosts = React.useMemo(
    () => posts.filter((item) => item.status === "deleted"),
    [posts]
  );
  const visiblePosts = currentView === "trash" ? deletedPosts : activePosts;
  const videoCount = activePosts.filter((item) => item.type === "video" || item.video_url).length;
  const latestUpdatedAt = activePosts.reduce((latest, post) => {
    const current = post.updated_at || post.created_at || "";
    if (!current) return latest;
    if (!latest) return current;

    return new Date(current).getTime() > new Date(latest).getTime() ? current : latest;
  }, user.created_at || "");

  const restorePost = async (uuid: string) => {
    setRestoringUuid(uuid);
    try {
      const response = await fetch(`/api/home/post/${uuid}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "draft",
        }),
      });
      const result = await response.json();

      if (result?.code !== 0) {
        throw new Error(result?.message || t("restore_failed"));
      }

      toast.success(t("restored"));
      await loadPosts();
      setCurrentView("list");
    } catch (error: any) {
      toast.error(error?.message || t("restore_failed"));
    } finally {
      setRestoringUuid("");
    }
  };

  return (
    <div className="grid min-h-[calc(100svh-8rem)] grid-rows-[auto_minmax(0,1fr)] gap-4 sm:gap-6">
      <section className="relative overflow-hidden rounded-[24px] border border-black/5 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_32%),linear-gradient(135deg,#ffffff,#f4f6fb)] p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:rounded-[28px] sm:p-6 dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.16),transparent_30%),linear-gradient(135deg,rgba(24,24,27,1),rgba(39,39,42,0.96))]">
        <div className="flex h-full flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-5">
            <Avatar className="h-20 w-20 border-4 border-white/80 shadow-2xl sm:h-24 sm:w-24 dark:border-white/10">
              <AvatarImage
                src={proxifyAvatarUrl(user.avatar_url) || undefined}
                alt={user.nickname || "User"}
              />
              <AvatarFallback className="bg-zinc-200 text-2xl font-semibold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100">
                {user.nickname?.slice(0, 2) || "用户"}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">
                {t("hero_tip")}
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
                {user.nickname || "未命名用户"}
              </h1>
              <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-300">
                {t("description")}
              </p>
              <div className="pt-2">
                <Link
                  href={`/${locale}/home/post`}
                  className="inline-flex items-center rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  {t("create_work")}
                </Link>
              </div>
            </div>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-3 lg:max-w-2xl">
            <div className="rounded-2xl border border-black/5 bg-white/75 p-4 backdrop-blur dark:border-white/10 dark:bg-white/5">
              <div className="mb-3 flex items-center gap-2 text-zinc-500">
                <FileText className="h-4 w-4" />
                <span className="text-sm">{t("works_count")}</span>
              </div>
              <div className="text-3xl font-semibold text-zinc-900 dark:text-white">
                {loading ? <Skeleton className="h-9 w-16" /> : activePosts.length}
              </div>
            </div>
            <div className="rounded-2xl border border-black/5 bg-white/75 p-4 backdrop-blur dark:border-white/10 dark:bg-white/5">
              <div className="mb-3 flex items-center gap-2 text-zinc-500">
                <PlayCircle className="h-4 w-4" />
                <span className="text-sm">{t("video_count")}</span>
              </div>
              <div className="text-3xl font-semibold text-zinc-900 dark:text-white">
                {loading ? <Skeleton className="h-9 w-16" /> : videoCount}
              </div>
            </div>
            <div className="rounded-2xl border border-black/5 bg-white/75 p-4 backdrop-blur dark:border-white/10 dark:bg-white/5">
              <div className="mb-3 flex items-center gap-2 text-zinc-500">
                <CalendarDays className="h-4 w-4" />
                <span className="text-sm">{t("updated_at")}</span>
              </div>
              <div className="text-lg font-semibold text-zinc-900 dark:text-white">
                {loading ? <Skeleton className="h-7 w-28" /> : formatDate(latestUpdatedAt, locale)}
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                {t("joined_at")} {formatDate(user.created_at, locale)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="min-h-0 overflow-hidden rounded-[24px] border border-black/5 bg-white/80 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur sm:rounded-[28px] sm:p-6 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="mb-5 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 sm:text-2xl dark:text-white">
              {currentView === "trash" ? t("trash_title") : t("title")}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {currentView === "trash"
                ? t("trash_description")
                : t("description")}
            </p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <button
              type="button"
              onClick={() => setCurrentView("list")}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm transition",
                currentView === "list"
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:bg-white/[0.08]"
              )}
            >
              <FileText className="h-4 w-4" />
              {t("list_tab")}
              {!loading ? <span className="text-xs opacity-80">{activePosts.length}</span> : null}
            </button>
            <button
              type="button"
              onClick={() => setCurrentView("trash")}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm transition",
                currentView === "trash"
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:bg-white/[0.08]"
              )}
            >
              <Trash2 className="h-4 w-4" />
              {t("trash_tab")}
              {!loading ? <span className="text-xs opacity-80">{deletedPosts.length}</span> : null}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-[24px] border border-black/5 bg-white p-5 shadow-[0_12px_34px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-zinc-950/40"
              >
                <Skeleton className="aspect-[16/10] w-full rounded-[18px]" />
                <div className="space-y-3 pt-4">
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-9 w-24 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : visiblePosts.length === 0 ? (
          <div className="flex h-[280px] flex-col items-center justify-center rounded-[24px] border border-dashed border-zinc-200 bg-zinc-50/80 px-4 text-center sm:h-[320px] dark:border-white/10 dark:bg-white/[0.02]">
            <Clapperboard className="mb-4 h-10 w-10 text-zinc-400" />
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
              {currentView === "trash" ? t("trash_empty_title") : t("empty_title")}
            </h3>
            <p className="mt-2 max-w-md text-sm text-zinc-500">
              {currentView === "trash"
                ? t("trash_empty_description")
                : t("empty_description")}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visiblePosts.map((post) => {
              const statusText = getStatusText(post.status, t);
              const postUrl = getPostUrl(locale, post.uuid);
              const coverUrl = post.cover_url || post.images?.[0] || "";
              const isDeleted = post.status === "deleted";

              return (
                <article
                  key={post.uuid}
                  className="group overflow-hidden rounded-[24px] border border-black/5 bg-white shadow-[0_12px_34px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(15,23,42,0.1)] dark:border-white/10 dark:bg-zinc-950/40"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={post.title || ""}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#dbeafe,#eff6ff)] text-zinc-500 dark:bg-[linear-gradient(135deg,#1f2937,#111827)]">
                        <Clapperboard className="h-10 w-10 opacity-70" />
                      </div>
                    )}
                    <div className="absolute left-3 top-3 rounded-full bg-black/65 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                      {statusText}
                    </div>
                    {post.type === "video" || post.video_url ? (
                      <div className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-zinc-900">
                        视频
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-4 p-5">
                    <div>
                      <h3 className="line-clamp-2 text-lg font-semibold text-zinc-900 dark:text-white">
                        {post.title || "未命名作品"}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-500">
                        {post.content || "暂无作品简介"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>
                        {t("updated_at")} {formatDate(post.updated_at || post.created_at, locale)}
                      </span>
                      <span>{post.locale || locale}</span>
                    </div>

                    {isDeleted ? (
                      <button
                        type="button"
                        onClick={() => void restorePost(post.uuid)}
                        disabled={restoringUuid === post.uuid}
                        className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                      >
                        <RotateCcw className="h-4 w-4" />
                        {restoringUuid === post.uuid ? t("restoring") : t("restore_draft")}
                      </button>
                    ) : (
                      <Link
                        href={postUrl}
                        className="inline-flex items-center rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                      >
                        {t("view_detail")}
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
