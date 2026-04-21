"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { proxifyAvatarUrl } from "@/lib/avatar";
import { getHomePostExcerpt } from "@/lib/home-post-content";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  FileImage,
  FileText,
  Heart,
  Loader2,
  MessageCircle,
  Sparkles,
  Video,
} from "lucide-react";
import { HomePost } from "@/types/home-post";
import { PostMediaGallery } from "@/components/home/post-media-gallery";
import { UserPublicProfileTrigger } from "@/components/user/public-profile-dialog";

type TypeFilter = "all" | "text" | "image" | "video";
type FeedResponse = {
  items?: HomePost[];
  has_more?: boolean;
  next_offset?: number;
};

const PAGE_SIZE = 18;
const VIRTUAL_ROW_HEIGHT = 332;
const VIRTUAL_OVERSCAN_ROWS = 2;

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

function splitIntoRows(posts: HomePost[], columns: number) {
  const rows: HomePost[][] = [];

  for (let index = 0; index < posts.length; index += columns) {
    rows.push(posts.slice(index, index + columns));
  }

  return rows;
}

function parseFeedPayload(payload: unknown): FeedResponse {
  if (Array.isArray(payload)) {
    return {
      items: payload,
      has_more: payload.length >= PAGE_SIZE,
      next_offset: payload.length,
    };
  }

  if (!payload || typeof payload !== "object") {
    return {
      items: [],
      has_more: false,
      next_offset: 0,
    };
  }

  const data = payload as FeedResponse;
  const items = Array.isArray(data.items) ? data.items : [];

  return {
    items,
    has_more: Boolean(data.has_more),
    next_offset:
      typeof data.next_offset === "number" && data.next_offset >= 0
        ? data.next_offset
        : items.length,
  };
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
  const isDesktop = useMediaQuery("(min-width: 1280px)");
  const isTablet = useMediaQuery("(min-width: 640px)");
  const [posts, setPosts] = React.useState<HomePost[]>(initialPosts);
  const [loading, setLoading] = React.useState(initialPosts.length === 0);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(initialPosts.length >= PAGE_SIZE);
  const [nextOffset, setNextOffset] = React.useState(initialPosts.length);
  const [currentType, setCurrentType] = React.useState<TypeFilter>("all");
  const [currentTag, setCurrentTag] = React.useState("all");
  const [visibleRange, setVisibleRange] = React.useState({ start: 0, end: 8 });
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);
  const listRef = React.useRef<HTMLDivElement | null>(null);

  const loadFeed = React.useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch(`/api/home/post?locale=${locale}&limit=${PAGE_SIZE}`);
      const result = await resp.json();
      if (result.code === 0) {
        const payload = parseFeedPayload(result.data);
        setPosts(payload.items || []);
        setHasMore(Boolean(payload.has_more));
        setNextOffset(payload.next_offset || 0);
      } else {
        toast.error(result.message || t("feed.load_failed"));
      }
    } catch {
      toast.error(t("feed.load_failed"));
    } finally {
      setLoading(false);
    }
  }, [locale, t]);

  const loadMore = React.useCallback(async () => {
    if (loading || loadingMore || !hasMore) {
      return;
    }

    setLoadingMore(true);
    try {
      const resp = await fetch(
        `/api/home/post?locale=${locale}&limit=${PAGE_SIZE}&offset=${nextOffset}`
      );
      const result = await resp.json();
      if (result.code !== 0) {
        toast.error(result.message || t("feed.load_failed"));
        return;
      }

      const payload = parseFeedPayload(result.data);
      const nextItems = payload.items || [];
      setPosts((current) => {
        const seen = new Set(current.map((item) => item.uuid));
        const merged = [...current];
        for (const item of nextItems) {
          if (seen.has(item.uuid)) {
            continue;
          }
          seen.add(item.uuid);
          merged.push(item);
        }
        return merged;
      });
      setHasMore(Boolean(payload.has_more));
      setNextOffset(payload.next_offset || nextOffset + nextItems.length);
    } catch {
      toast.error(t("feed.load_failed"));
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loading, loadingMore, locale, nextOffset, t]);

  React.useEffect(() => {
    setPosts(initialPosts);
    setLoading(initialPosts.length === 0);
    setLoadingMore(false);
    setHasMore(initialPosts.length >= PAGE_SIZE);
    setNextOffset(initialPosts.length);
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
  const columnCount = isDesktop ? 3 : isTablet ? 2 : 1;
  const visibleRestRows = React.useMemo(
    () => splitIntoRows(restPosts, columnCount),
    [columnCount, restPosts]
  );

  React.useEffect(() => {
    setVisibleRange({ start: 0, end: 8 });
  }, [columnCount, currentTag, currentType, featuredIndex, filteredPosts.length]);

  React.useEffect(() => {
    const node = listRef.current;
    if (!node || !restPosts.length) {
      return;
    }

    const measure = () => {
      const rect = node.getBoundingClientRect();
      const viewportTop = window.scrollY;
      const sectionTop = rect.top + viewportTop;
      const scrollTop = window.scrollY;
      const viewportBottom = scrollTop + window.innerHeight;
      const relativeTop = Math.max(0, scrollTop - sectionTop);
      const relativeBottom = Math.max(0, viewportBottom - sectionTop);
      const start = Math.max(
        0,
        Math.floor(relativeTop / VIRTUAL_ROW_HEIGHT) - VIRTUAL_OVERSCAN_ROWS
      );
      const end = Math.min(
        visibleRestRows.length,
        Math.ceil(relativeBottom / VIRTUAL_ROW_HEIGHT) + VIRTUAL_OVERSCAN_ROWS
      );

      setVisibleRange((current) =>
        current.start === start && current.end === end ? current : { start, end }
      );
    };

    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);

    return () => {
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [restPosts.length, visibleRestRows.length]);

  React.useEffect(() => {
    const observerTarget = loadMoreRef.current;
    if (!observerTarget || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMore();
        }
      },
      {
        rootMargin: "900px 0px",
      }
    );

    observer.observe(observerTarget);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  const visiblePosts = React.useMemo(() => {
    const items = new Map<string, HomePost>();
    if (featuredPost) {
      items.set(featuredPost.uuid, featuredPost);
    }

    for (const row of visibleRestRows.slice(visibleRange.start, visibleRange.end)) {
      for (const post of row) {
        items.set(post.uuid, post);
      }
    }

    return Array.from(items.values());
  }, [featuredPost, visibleRange.end, visibleRange.start, visibleRestRows]);

  React.useEffect(() => {
    visiblePosts.forEach((post) => {
      router.prefetch(getPostHref(locale, post.uuid));
    });
  }, [locale, router, visiblePosts]);

  const topSpacerHeight = visibleRange.start * VIRTUAL_ROW_HEIGHT;
  const bottomSpacerHeight = Math.max(
    0,
    (visibleRestRows.length - visibleRange.end) * VIRTUAL_ROW_HEIGHT
  );
  const visibleRows = visibleRestRows.slice(visibleRange.start, visibleRange.end);

  return (
    <>
      <div className="flex w-full min-w-0 max-w-none flex-col gap-4 pb-6 pt-2">
        <section className="flex flex-col gap-3">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold text-zinc-900 sm:text-lg dark:text-zinc-50">
                {t("feed.hero_title")}
              </h1>
            </div>
            <div className="-mx-1 flex shrink-0 items-center gap-1.5 overflow-x-auto px-1 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:gap-2 sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden">
              {typeTabs.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setCurrentType(item.value)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] transition sm:gap-2 sm:px-3 sm:text-xs md:text-sm",
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
          <div className="space-y-4">
            {useFeaturedLayout && featuredPost ? (
              <article
                key={`featured-${featuredPost.uuid}`}
                aria-label={featuredPost.title || t("feed.view_detail")}
                role="link"
                tabIndex={0}
                onClick={() => router.push(getPostHref(locale, featuredPost.uuid))}
                onMouseEnter={() => router.prefetch(getPostHref(locale, featuredPost.uuid))}
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
            <div ref={listRef}>
              {topSpacerHeight > 0 ? (
                <div style={{ height: topSpacerHeight }} aria-hidden />
              ) : null}

              {visibleRows.map((row, rowIndex) => (
                <div
                  key={`row-${visibleRange.start + rowIndex}`}
                  className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                >
                  {row.map((post, columnIndex) => {
                    const shellIndex =
                      (visibleRange.start + rowIndex) * columnCount + columnIndex + 1;
                    const cardContent = (
                      <>
                        {post.type === "text" ? (
                          <div
                            className={cn(
                              "relative flex aspect-[2/1] flex-col overflow-hidden rounded-[18px] px-3 pb-3 pt-2.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)] sm:aspect-[16/10] sm:px-4 sm:pb-4 sm:pt-3 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]",
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
                            aspectClassName="aspect-video sm:aspect-[16/10]"
                            showBadge={false}
                            preferVideoPlayback={false}
                            imageFit="contain"
                          />
                        )}

                        <article className="flex flex-1 flex-col justify-between px-1 pb-1 pt-2">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2.5">
                              <UserPublicProfileTrigger
                                userUuid={post.author?.uuid || post.user_uuid}
                              >
                                <Avatar className="h-8 w-8 shrink-0 border border-black/5 dark:border-white/10">
                                  <AvatarImage
                                    src={proxifyAvatarUrl(post.author?.avatar_url) || undefined}
                                    alt={post.author?.nickname || "User"}
                                  />
                                  <AvatarFallback>
                                    {initials(post.author?.nickname)}
                                  </AvatarFallback>
                                </Avatar>
                              </UserPublicProfileTrigger>
                              <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                                <UserPublicProfileTrigger
                                  userUuid={post.author?.uuid || post.user_uuid}
                                >
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
                        onMouseEnter={() => router.prefetch(getPostHref(locale, post.uuid))}
                        onKeyDown={(event) => {
                          if (event.key !== "Enter" && event.key !== " ") {
                            return;
                          }
                          event.preventDefault();
                          router.push(getPostHref(locale, post.uuid));
                        }}
                        className={cn(
                          "group mb-4 flex min-h-0 flex-col rounded-[20px] p-2 shadow-[0_10px_28px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(15,23,42,0.075)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 max-sm:min-h-[220px] sm:min-h-[260px] xl:min-h-[300px]",
                          getWorldCardShell(post)
                        )}
                      >
                        {cardContent}
                      </article>
                    );
                  })}
                </div>
              ))}

              {bottomSpacerHeight > 0 ? (
                <div style={{ height: bottomSpacerHeight }} aria-hidden />
              ) : null}
            </div>

            <div ref={loadMoreRef} className="flex min-h-10 items-center justify-center">
              {loadingMore ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs text-zinc-500 shadow-[0_6px_18px_rgba(15,23,42,0.06)] dark:bg-white/[0.05] dark:text-zinc-300">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  正在加载更多内容
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
