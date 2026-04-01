"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { proxifyAvatarUrl } from "@/lib/avatar";
import { getHomePostExcerpt } from "@/lib/home-post-content";
import {
  FileImage,
  FileText,
  Heart,
  MessageCircle,
  Sparkles,
  Video,
} from "lucide-react";
import { HomePost } from "@/types/home-post";
import { PostMediaGallery } from "@/components/home/post-media-gallery";

type TypeFilter = "all" | "text" | "image" | "video";

function formatDate(date?: string, locale = "zh") {
  if (!date) return "";
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "";
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function initials(name?: string) {
  return String(name || "").trim().slice(0, 1).toUpperCase() || "U";
}

function uniqueTags(posts: HomePost[]) {
  const counter = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.tags || []) {
      counter.set(tag, (counter.get(tag) || 0) + 1);
    }
  }

  return Array.from(counter.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag]) => tag);
}

function getTypeLabel(post: HomePost, t: ReturnType<typeof useTranslations>) {
  if (post.type === "image") return t("feed.type_image");
  if (post.type === "video") return t("feed.type_video");
  return t("feed.type_text");
}

function getWorldCardMediaAspect(post: HomePost, index: number) {
  if (post.type === "video") {
    return index % 2 === 0 ? "aspect-[4/6]" : "aspect-[5/8]";
  }

  if (post.type === "image") {
    return index % 3 === 0 ? "aspect-[4/5]" : "aspect-[5/6]";
  }

  return "aspect-[13/6]";
}

function getWorldCardShell(post: HomePost) {
  if (post.type === "video") {
    return "border-[#cfd9d5] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(240,245,243,0.96))] dark:bg-[linear-gradient(180deg,rgba(27,31,35,0.98),rgba(22,25,29,0.96))]";
  }

  if (post.type === "image") {
    return "border-[#d5dfdc] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,249,248,0.96))] dark:bg-[linear-gradient(180deg,rgba(30,33,39,0.96),rgba(24,27,32,0.94))]";
  }

  return "border-[#d8e1de] bg-[linear-gradient(135deg,rgba(248,250,249,0.98),rgba(238,244,242,0.95))] dark:bg-[linear-gradient(180deg,rgba(30,34,36,0.96),rgba(26,29,31,0.94))]";
}

function getPostHref(locale: string, uuid: string) {
  return `/${locale}/home/post/${uuid}`;
}

/** 文本帖内层「本文」预览：与社区主色统一，轮换轻微色相变化 */
function getTextCardTone(index: number) {
  const tones = [
    "border-[#b8cfc8]/55 bg-[linear-gradient(165deg,rgba(255,255,255,0.97)_0%,rgba(241,248,245,0.92)_48%,rgba(232,241,237,0.88)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] dark:border-[#4a635c]/50 dark:bg-[linear-gradient(165deg,rgba(32,38,36,0.98)_0%,rgba(26,32,30,0.96)_100%)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
    "border-[#aec9c2]/50 bg-[linear-gradient(165deg,rgba(255,255,255,0.97)_0%,rgba(238,246,243,0.93)_52%,rgba(228,238,233,0.9)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] dark:border-[#3f5a54]/45 dark:bg-[linear-gradient(165deg,rgba(30,36,35,0.98)_0%,rgba(24,30,28,0.95)_100%)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
    "border-[#c5d4cf]/55 bg-[linear-gradient(165deg,rgba(255,255,255,0.98)_0%,rgba(244,249,247,0.94)_50%,rgba(234,242,239,0.9)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:border-[#4f6b63]/48 dark:bg-[linear-gradient(165deg,rgba(28,34,32,0.98)_0%,rgba(22,28,26,0.96)_100%)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
  ];

  return tones[index % tones.length];
}

export function HomePostFeedView({ locale }: { locale: string }) {
  const t = useTranslations("home");
  const [posts, setPosts] = React.useState<HomePost[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentType, setCurrentType] = React.useState<TypeFilter>("all");
  const [currentTag, setCurrentTag] = React.useState("all");

  const loadFeed = React.useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch(`/api/home/post?locale=${locale}`);
      const result = await resp.json();
      if (result.code === 0) {
        setPosts(Array.isArray(result.data) ? result.data : []);
      } else {
        toast.error(result.message || t("feed.load_failed"));
      }
    } catch {
      toast.error(t("feed.load_failed"));
    } finally {
      setLoading(false);
    }
  }, [locale, t]);

  React.useEffect(() => {
    void loadFeed();
  }, [loadFeed]);

  const tags = React.useMemo(() => uniqueTags(posts), [posts]);

  const filteredPosts = React.useMemo(
    () =>
      posts.filter((post) => {
        const matchesType = currentType === "all" ? true : post.type === currentType;
        const matchesTag = currentTag === "all" ? true : Boolean(post.tags?.includes(currentTag));
        return matchesType && matchesTag;
      }),
    [currentTag, currentType, posts]
  );

  const typeTabs: Array<{
    value: TypeFilter;
    title: string;
    icon: React.ReactNode;
  }> = [
    { value: "all", title: t("feed.all"), icon: <Sparkles className="h-4 w-4" /> },
    { value: "text", title: t("feed.type_text"), icon: <FileText className="h-4 w-4" /> },
    { value: "image", title: t("feed.type_image"), icon: <FileImage className="h-4 w-4" /> },
    { value: "video", title: t("feed.type_video"), icon: <Video className="h-4 w-4" /> },
  ];

  return (
    <>
      <div className="flex w-full min-w-0 max-w-none flex-col gap-4 pb-6 pt-2">
        <section className="relative overflow-hidden rounded-[24px] border border-[#8ea8a1]/14 bg-[radial-gradient(circle_at_14%_18%,rgba(112,150,140,0.14),transparent_22%),radial-gradient(circle_at_86%_12%,rgba(237,242,241,0.88),transparent_24%),linear-gradient(135deg,rgba(248,250,249,0.98),rgba(237,242,240,0.97)_56%,rgba(231,236,235,0.96))] px-4 py-4 shadow-[0_18px_44px_rgba(31,48,44,0.06)] dark:border-[#617b73]/16 dark:bg-[radial-gradient(circle_at_14%_18%,rgba(86,124,114,0.14),transparent_22%),radial-gradient(circle_at_86%_12%,rgba(62,80,76,0.14),transparent_24%),linear-gradient(135deg,rgba(22,28,29,0.98),rgba(27,34,35,0.98)_56%,rgba(20,24,25,0.97))]">
          <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(95,126,117,0.24),rgba(185,201,197,0.18),transparent)] dark:bg-[linear-gradient(90deg,transparent,rgba(112,145,136,0.22),rgba(83,102,98,0.14),transparent)]" />

          <div className="relative flex flex-col gap-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="max-w-2xl">
                <div className="inline-flex items-center rounded-full border border-[#90aaa3]/18 bg-white/55 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#58726b] backdrop-blur dark:border-white/10 dark:bg-white/[0.04] dark:text-[#9eb8b1]">
                  {t("feed.hero_label")}
                </div>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[#1f302c] dark:text-[#e8f0ee]">
                  {t("feed.hero_title")}
                </h1>

              </div>

              <div className="flex flex-col items-end gap-2">
                {typeTabs
                  .filter((item) => item.value === "all")
                  .map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setCurrentType(item.value)}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm transition",
                        currentType === item.value
                          ? "bg-[#223733] text-white shadow-[0_10px_24px_rgba(34,55,51,0.16)] dark:bg-[#6f9188] dark:text-[#13221f]"
                          : "bg-[#f3f6f5] text-[#647772] hover:bg-white hover:text-[#223733] dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:bg-white/[0.08] dark:hover:text-white"
                      )}
                    >
                      {item.icon}
                      {item.title}
                    </button>
                  ))}

                <div className="flex items-center gap-2">
                  {typeTabs
                    .filter((item) => item.value !== "all")
                    .map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setCurrentType(item.value)}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm transition",
                          currentType === item.value
                            ? "bg-[#223733] text-white shadow-[0_10px_24px_rgba(34,55,51,0.16)] dark:bg-[#6f9188] dark:text-[#13221f]"
                            : "bg-[#f3f6f5] text-[#647772] hover:bg-white hover:text-[#223733] dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:bg-white/[0.08] dark:hover:text-white"
                        )}
                      >
                        {item.icon}
                        {item.title}
                      </button>
                    ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentTag("all")}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs transition",
                  currentTag === "all"
                    ? "bg-[#223733] text-white dark:bg-[#6f9188] dark:text-[#13221f]"
                    : "bg-white/70 text-[#62756f] hover:bg-white hover:text-[#223733] dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:bg-white/[0.08]"
                )}
              >
                {t("feed.all_tags")}
              </button>
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setCurrentTag(tag)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs transition",
                    currentTag === tag
                      ? "bg-[#223733] text-white dark:bg-[#6f9188] dark:text-[#13221f]"
                      : "bg-white/70 text-[#62756f] hover:bg-white hover:text-[#223733] dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:bg-white/[0.08]"
                  )}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        </section>

        {loading ? (
          <div className="columns-1 gap-3 sm:columns-2 xl:columns-3 2xl:columns-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  "mb-3 animate-pulse break-inside-avoid rounded-[22px] bg-zinc-100/80 dark:bg-white/[0.04]",
                  index % 3 === 0 ? "h-[180px]" : index % 3 === 1 ? "h-[280px]" : "h-[340px]"
                )}
              />
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[30px] border border-dashed border-[#cfd9d6] bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(244,248,247,0.82))] text-center dark:border-white/10 dark:bg-white/[0.03]">
            <Video className="mb-4 h-10 w-10 text-zinc-400" />
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              {t("feed.empty_title")}
            </h2>
            <p className="mt-2 max-w-md text-sm text-zinc-500">
              {t("feed.empty_desc")}
            </p>
          </div>
        ) : (
          <div className="columns-1 gap-3 sm:columns-2 xl:columns-3 2xl:columns-4">
            {filteredPosts.map((post, index) => {
              const cardContent = (
                <>
                  {post.type === "text" ? (
                    <div
                      className={cn(
                        "relative overflow-hidden rounded-[20px] border px-5 pb-5 pt-4",
                        getTextCardTone(index)
                      )}
                    >
                      <div
                        className="pointer-events-none absolute inset-y-3 left-0 w-[3px] rounded-full bg-[linear-gradient(180deg,#5d8a7e,#3d5c54)] opacity-90 dark:opacity-80"
                        aria-hidden
                      />
                      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#6b9083]/[0.07] blur-2xl dark:bg-[#8fb5a8]/[0.06]" />
                      <div className="mb-3.5 flex items-center gap-2 pl-1">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#8ea8a1]/22 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-[#3d524c] shadow-[0_1px_2px_rgba(15,23,42,0.04)] backdrop-blur-sm dark:border-white/10 dark:bg-[rgba(40,52,48,0.65)] dark:text-[#c8ddd6]">
                          <FileText className="h-3.5 w-3.5 shrink-0 opacity-80" />
                          {t("feed.text_card_badge")}
                        </span>
                      </div>
                      <p className="line-clamp-5 pl-1 text-[15px] font-normal leading-[1.72] tracking-[-0.01em] text-[#24302c] dark:text-[#e8f1ed]">
                        {post.excerpt || getHomePostExcerpt(post.content, 140)}
                      </p>
                    </div>
                  ) : (
                    <PostMediaGallery
                      post={post}
                      className="rounded-[16px]"
                      aspectClassName={getWorldCardMediaAspect(post, index)}
                      showBadge={false}
                      preferVideoPlayback={false}
                    />
                  )}

                  <article className="space-y-2.5 px-1 pb-1 pt-2.5">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-8 w-8 shrink-0 border border-black/5 dark:border-white/10">
                      <AvatarImage
                        src={proxifyAvatarUrl(post.author?.avatar_url) || undefined}
                        alt={post.author?.nickname || "User"}
                      />
                      <AvatarFallback>{initials(post.author?.nickname)}</AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                      <div className="truncate text-[13px] font-medium text-zinc-900 dark:text-white">
                        {post.author?.nickname || t("feed.unknown_author")}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400">
                        <span className="inline-flex items-center gap-1.5">
                          <Heart className="h-3.5 w-3.5" />
                          {post.like_count || 0}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <MessageCircle className="h-3.5 w-3.5" />
                          {post.comment_count || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {post.type === "text" || post.type === "image" ? (
                    <div>
                      <h3
                        className={cn(
                          "font-semibold tracking-[-0.01em] text-[#182724] transition-colors group-hover:text-[#25463e] dark:text-[#f5fbf8] dark:group-hover:text-[#dff1eb]",
                          post.type === "text"
                            ? "line-clamp-1 text-[15px] leading-5"
                            : "line-clamp-2 text-[15px] leading-5"
                        )}
                      >
                        {post.title || t("feed.untitled")}
                      </h3>
                    </div>
                  ) : null}

                  {post.type === "text" && (post.tags || []).length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {(post.tags || []).slice(0, 3).map((tag) => (
                        <span
                          key={`${post.uuid}-${tag}`}
                          className="rounded-full bg-[#eef4f2] px-2.5 py-1 text-[10px] text-[#617671] dark:border dark:border-white/10 dark:bg-[#334640] dark:text-[#eef7f3]"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  </article>
                </>
              );

              return (
                <Link
                  key={post.uuid}
                  href={getPostHref(locale, post.uuid)}
                  aria-label={post.title || t("feed.view_detail")}
                  className={cn(
                    "group mb-3 block break-inside-avoid rounded-[22px] border p-2.5 shadow-[0_10px_28px_rgba(15,23,42,0.045)] transition hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(15,23,42,0.07)]",
                    getWorldCardShell(post)
                  )}
                >
                  {cardContent}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
