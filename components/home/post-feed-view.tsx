"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
import { UserPublicProfileTrigger } from "@/components/user/public-profile-dialog";

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
    return "aspect-video";
  }

  if (post.type === "image") {
    return index % 3 === 0 ? "aspect-[4/3]" : "aspect-square";
  }

  return "aspect-[13/6]";
}

function getWorldCardShell(post: HomePost) {
  if (post.type === "video") {
    return "bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(239,245,242,0.98))] shadow-[0_12px_28px_rgba(110,134,126,0.08)] dark:bg-[linear-gradient(180deg,rgba(27,31,35,0.98),rgba(22,25,29,0.96))]";
  }

  if (post.type === "image") {
    return "bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(245,249,247,0.98))] shadow-[0_12px_28px_rgba(110,134,126,0.08)] dark:bg-[linear-gradient(180deg,rgba(30,33,39,0.96),rgba(24,27,32,0.94))]";
  }

  return "bg-[linear-gradient(135deg,rgba(249,251,250,0.99),rgba(238,244,241,0.98))] shadow-[0_12px_28px_rgba(110,134,126,0.08)] dark:bg-[linear-gradient(180deg,rgba(30,34,36,0.96),rgba(26,29,31,0.94))]";
}

function getPostHref(locale: string, uuid: string) {
  return `/${locale}/home/post/${uuid}`;
}

/** 文本帖内层「本文」预览：与社区主色统一，轮换轻微色相变化 */
function getTextCardTone(index: number) {
  const tones = [
    "bg-[linear-gradient(165deg,rgba(255,255,255,1)_0%,rgba(241,248,245,0.97)_48%,rgba(232,241,237,0.93)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.78),0_8px_18px_rgba(96,119,111,0.07)] dark:bg-[linear-gradient(165deg,rgba(32,38,36,0.98)_0%,rgba(26,32,30,0.96)_100%)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
    "bg-[linear-gradient(165deg,rgba(255,255,255,1)_0%,rgba(238,246,243,0.97)_52%,rgba(228,238,233,0.94)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.76),0_8px_18px_rgba(96,119,111,0.07)] dark:bg-[linear-gradient(165deg,rgba(30,36,35,0.98)_0%,rgba(24,30,28,0.95)_100%)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
    "bg-[linear-gradient(165deg,rgba(255,255,255,1)_0%,rgba(244,249,247,0.97)_50%,rgba(234,242,239,0.94)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_8px_18px_rgba(96,119,111,0.07)] dark:bg-[linear-gradient(165deg,rgba(28,34,32,0.98)_0%,rgba(22,28,26,0.96)_100%)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
  ];

  return tones[index % tones.length];
}

export function HomePostFeedView({
  locale,
  initialPosts = [],
}: {
  locale: string;
  initialPosts?: HomePost[];
}) {
  const router = useRouter();
  const t = useTranslations("home");
  const [posts, setPosts] = React.useState<HomePost[]>(initialPosts);
  const [loading, setLoading] = React.useState(initialPosts.length === 0);
  const [currentType, setCurrentType] = React.useState<TypeFilter>("all");
  const [currentTag, setCurrentTag] = React.useState("all");

  const loadFeed = React.useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch(`/api/home/post?locale=${locale}&limit=18`);
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
    setPosts(initialPosts);
    setLoading(initialPosts.length === 0);
  }, [initialPosts]);

  React.useEffect(() => {
    if (initialPosts.length > 0) {
      return;
    }

    void loadFeed();
  }, [initialPosts.length, loadFeed]);

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

  const useFeaturedLayout = currentTag === "all" && filteredPosts.length > 0;
  const featuredIndex = React.useMemo(() => {
    if (!useFeaturedLayout) return -1;
    const idx = filteredPosts.findIndex((post) => post.type === "video" && Boolean(post.video_url));
    return idx >= 0 ? idx : 0;
  }, [filteredPosts, useFeaturedLayout]);

  const featuredPost = featuredIndex >= 0 ? filteredPosts[featuredIndex] : undefined;
  const restPosts = React.useMemo(
    () =>
      featuredIndex >= 0
        ? filteredPosts.filter((_, idx) => idx !== featuredIndex)
        : filteredPosts,
    [featuredIndex, filteredPosts]
  );

  return (
    <>
      <div className="flex w-full min-w-0 max-w-none flex-col gap-4 pb-6 pt-2">
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {t("feed.hero_title")}
              </h1>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {typeTabs.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setCurrentType(item.value)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs transition sm:text-sm",
                    currentType === item.value
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "bg-zinc-100 text-zinc-600 hover:bg-white hover:text-zinc-900 dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:bg-white/[0.08] dark:hover:text-white"
                  )}
                >
                  {item.icon}
                  {item.title}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => setCurrentTag("all")}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs transition",
                currentTag === "all"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-white/92 text-zinc-700 shadow-[0_3px_10px_rgba(15,23,42,0.06)] hover:bg-white hover:text-zinc-900 dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:bg-white/[0.08]"
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
                  "shrink-0 rounded-full px-3 py-1.5 text-xs transition",
                  currentTag === tag
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-white/92 text-zinc-700 shadow-[0_3px_10px_rgba(15,23,42,0.06)] hover:bg-white hover:text-zinc-900 dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:bg-white/[0.08]"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </section>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:auto-rows-[320px] xl:grid-cols-3">
            <div className="h-[360px] animate-pulse rounded-[26px] bg-zinc-100/80 dark:bg-white/[0.04] xl:col-span-2 xl:row-span-2" />
            <div className="h-[180px] animate-pulse rounded-[26px] bg-zinc-100/80 dark:bg-white/[0.04]" />
            <div className="h-[180px] animate-pulse rounded-[26px] bg-zinc-100/80 dark:bg-white/[0.04]" />
            <div className="h-[180px] animate-pulse rounded-[26px] bg-zinc-100/80 dark:bg-white/[0.04]" />
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
          <div
            className={cn(
              "grid gap-4 sm:grid-cols-2 xl:grid-cols-3",
              useFeaturedLayout ? "xl:auto-rows-[310px]" : "[grid-auto-rows:1fr]"
            )}
          >
            {useFeaturedLayout && featuredPost ? (
              <article
                key={`featured-${featuredPost.uuid}`}
                aria-label={featuredPost.title || t("feed.view_detail")}
                role="link"
                tabIndex={0}
                onClick={() => router.push(getPostHref(locale, featuredPost.uuid))}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") {
                    return;
                  }
                  event.preventDefault();
                  router.push(getPostHref(locale, featuredPost.uuid));
                }}
                className={cn(
                  "group relative overflow-hidden rounded-[26px] shadow-[0_18px_46px_rgba(15,23,42,0.10)] transition hover:-translate-y-0.5 hover:shadow-[0_26px_64px_rgba(15,23,42,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                  getWorldCardShell(featuredPost),
                  "sm:col-span-2 xl:col-span-2 xl:row-span-2"
                )}
              >
                <PostMediaGallery
                  post={featuredPost}
                  className="rounded-none"
                  aspectClassName="aspect-video"
                  showBadge={false}
                  preferVideoPlayback={true}
                />
                <div className="absolute inset-x-0 bottom-0 space-y-2 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-5 text-white">
                  <div className="flex items-center gap-2 text-xs opacity-90">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1">
                      {getTypeLabel(featuredPost, t)}
                    </span>
                    <UserPublicProfileTrigger
                      userUuid={featuredPost.author?.uuid || featuredPost.user_uuid}
                    >
                      <span className="truncate opacity-90">
                        {featuredPost.author?.nickname || t("feed.unknown_author")}
                      </span>
                    </UserPublicProfileTrigger>
                    <span className="opacity-70">{formatDate(featuredPost.created_at, locale)}</span>
                  </div>
                  <div className="line-clamp-2 text-xl font-semibold tracking-tight">
                    {featuredPost.title || t("feed.untitled")}
                  </div>
                  <div className="line-clamp-2 text-sm text-white/85">
                    {featuredPost.excerpt || getHomePostExcerpt(featuredPost.content, 120)}
                  </div>
                </div>
              </article>
            ) : null}

            {restPosts.map((post, index) => {
              const shellIndex = index + 1;
              const cardContent = (
                <>
                  {post.type === "text" ? (
                    <div
                      className={cn(
                        "relative flex aspect-[16/10] flex-col overflow-hidden rounded-[18px] px-4 pb-4 pt-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]",
                        getTextCardTone(shellIndex)
                      )}
                    >
                      <div
                        className="pointer-events-none absolute inset-y-3 left-0 w-[3px] rounded-full bg-[linear-gradient(180deg,#78716c,#57534e)] opacity-90 dark:opacity-80"
                        aria-hidden
                      />
                      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-stone-400/[0.08] blur-2xl dark:bg-zinc-500/[0.06]" />
                      <div className="mb-3 flex items-center gap-2 pl-1">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/96 px-2.5 py-1 text-[11px] font-medium text-stone-800 shadow-[0_2px_6px_rgba(15,23,42,0.08)] backdrop-blur-sm dark:bg-zinc-800/70 dark:text-zinc-200">
                          <FileText className="h-3.5 w-3.5 shrink-0 opacity-80" />
                          {t("feed.text_card_badge")}
                        </span>
                      </div>
                      <p className="line-clamp-4 pl-1 text-[14px] font-normal leading-[1.7] tracking-[-0.01em] text-stone-800 dark:text-stone-100">
                        {post.excerpt || post.title || ""}
                      </p>
                    </div>
                  ) : (
                    <PostMediaGallery
                      post={post}
                      className="overflow-hidden rounded-[18px]"
                      aspectClassName="aspect-[16/10]"
                      showBadge={false}
                      preferVideoPlayback={false}
                      imageFit="contain"
                    />
                  )}

                  <article className="flex flex-1 flex-col justify-between px-1 pb-1 pt-2">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5">
                        <UserPublicProfileTrigger userUuid={post.author?.uuid || post.user_uuid}>
                          <Avatar className="h-8 w-8 shrink-0 border border-black/5 dark:border-white/10">
                            <AvatarImage
                              src={proxifyAvatarUrl(post.author?.avatar_url) || undefined}
                              alt={post.author?.nickname || "User"}
                            />
                            <AvatarFallback>{initials(post.author?.nickname)}</AvatarFallback>
                          </Avatar>
                        </UserPublicProfileTrigger>
                        <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                          <UserPublicProfileTrigger userUuid={post.author?.uuid || post.user_uuid}>
                            <div className="truncate text-[13px] font-semibold text-zinc-900 dark:text-white">
                              {post.author?.nickname || t("feed.unknown_author")}
                            </div>
                          </UserPublicProfileTrigger>
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
                            className="line-clamp-1 text-[14px] font-semibold leading-5 tracking-[-0.01em] text-stone-900 transition-colors group-hover:text-stone-950 dark:text-stone-50 dark:group-hover:text-white"
                          >
                            {post.title || t("feed.untitled")}
                          </h3>
                        </div>
                      ) : null}
                    </div>

                    {post.type === "text" && (post.tags || []).length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {(post.tags || []).slice(0, 3).map((tag) => (
                          <span
                            key={`${post.uuid}-${tag}`}
                            className="rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-stone-700 shadow-[0_2px_6px_rgba(15,23,42,0.06)] dark:bg-zinc-800 dark:text-zinc-100"
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
                <article
                  key={post.uuid}
                  aria-label={post.title || t("feed.view_detail")}
                  role="link"
                  tabIndex={0}
                  onClick={() => router.push(getPostHref(locale, post.uuid))}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") {
                      return;
                    }
                    event.preventDefault();
                    router.push(getPostHref(locale, post.uuid));
                  }}
                  className={cn(
                    "group flex min-h-[320px] flex-col rounded-[20px] p-2 shadow-[0_10px_28px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(15,23,42,0.075)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                    useFeaturedLayout && "xl:h-full xl:min-h-0",
                    getWorldCardShell(post)
                  )}
                >
                  {cardContent}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
