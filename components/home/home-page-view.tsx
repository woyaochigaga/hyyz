"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BotMessageSquare,
  Clock3,
  MapPinned,
  MessageSquare,
  PenSquare,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { getHomePostExcerpt } from "@/lib/home-post-content";
import type { HomePost } from "@/types/home-post";
import type { OfflineExhibition } from "@/types/offline-exhibition";

function formatDate(date?: string, locale = "zh") {
  if (!date) return "";
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "";
  return new Intl.DateTimeFormat(locale.startsWith("zh") ? "zh-CN" : "en-US", {
    month: "short",
    day: "numeric",
  }).format(value);
}

export function HomePageView({
  locale,
  featuredPosts,
  upcomingExhibitions,
}: {
  locale: string;
  featuredPosts: HomePost[];
  upcomingExhibitions: OfflineExhibition[];
}) {
  const isZh = locale.startsWith("zh");
  const [postType, setPostType] = React.useState<"all" | "text" | "image" | "video">("all");
  const [activePrompt, setActivePrompt] = React.useState(0);
  const [activeNotice, setActiveNotice] = React.useState(0);
  const [noticePaused, setNoticePaused] = React.useState(false);

  const quickActions = [
    {
      key: "create",
      title: isZh ? "杭艺云创" : "Create",
      desc: isZh ? "发布作品" : "Publish works",
      href: `/${locale}/home/post`,
      icon: PenSquare,
    },
    {
      key: "ai",
      title: isZh ? "小云AI" : "Xiaoyun AI",
      desc: isZh ? "智能助手" : "Creative assistant",
      href: `/${locale}/home/ai-chat`,
      icon: BotMessageSquare,
    },
    {
      key: "exhibition",
      title: isZh ? "线下展览" : "Exhibitions",
      desc: isZh ? "探索展览" : "Explore shows",
      href: `/${locale}/home/exhibition`,
      icon: MapPinned,
    },
    {
      key: "forum",
      title: isZh ? "杭艺论坛" : "Forum",
      desc: isZh ? "参与讨论" : "Join discussions",
      href: `/${locale}/home/forum`,
      icon: MessageSquare,
    },
  ];

  const aiPrompts = isZh
    ? [
        "杭州最值得看的五大手工艺是什么？",
        "如何入门陶瓷制作？",
        "推荐杭州的非遗体验路线",
      ]
    : [
        "What are five must-see crafts in Hangzhou?",
        "How can I start with ceramics?",
        "Recommend a Hangzhou intangible heritage route",
      ];

  const typeTabs = [
    { key: "all", label: isZh ? "全部" : "All" },
    { key: "text", label: isZh ? "文本" : "Text" },
    { key: "image", label: isZh ? "图文" : "Image" },
    { key: "video", label: isZh ? "视频" : "Video" },
  ] as const;

  const filteredPosts = React.useMemo(() => {
    if (postType === "all") return featuredPosts;
    return featuredPosts.filter((post) => post.type === postType);
  }, [featuredPosts, postType]);

  const notices = isZh
    ? [
        "公告：平台将于本周五 23:30 进行短时维护，预计 20 分钟。",
        "公告：杭艺论坛新增吧内置顶与精选推荐位，欢迎体验。",
        "公告：线下展览板块已支持活动时间与场地信息更新。",
      ]
    : [
        "Notice: Scheduled maintenance this Friday 23:30, about 20 minutes.",
        "Notice: Forum now supports pinned posts and featured slots.",
        "Notice: Exhibition section now supports schedule and venue updates.",
      ];

  React.useEffect(() => {
    if (noticePaused || notices.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveNotice((current) => (current + 1) % notices.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [noticePaused, notices.length]);

  return (
    <div className="flex w-full flex-col gap-6 pb-10 pt-2">
      <section
        className="rounded-2xl bg-card/70 p-4 shadow-sm backdrop-blur"
        onMouseEnter={() => setNoticePaused(true)}
        onMouseLeave={() => setNoticePaused(false)}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Sparkles className="h-4 w-4" />
            </span>
            {isZh ? "网站公告" : "Site Notices"}
          </div>
          <div className="flex gap-2">
            {notices.map((_, idx) => (
              <button
                key={`notice-${idx}`}
                type="button"
                onClick={() => {
                  setActiveNotice(idx);
                  setNoticePaused(false);
                }}
                className={`h-2.5 w-8 rounded-full transition ${
                  activeNotice === idx ? "bg-primary" : "bg-muted"
                }`}
                aria-label={`notice-${idx + 1}`}
              />
            ))}
          </div>
        </div>
        <p className="mt-3 rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground transition-all">
          {notices[activeNotice]}
        </p>
      </section>

      <section className="group relative overflow-hidden rounded-2xl bg-card p-7 text-card-foreground shadow-sm">
        <div className="pointer-events-none absolute -left-8 -top-8 h-28 w-28 rounded-full bg-primary/10 blur-2xl transition group-hover:bg-primary/20" />
        <div className="pointer-events-none absolute -bottom-10 right-0 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          {isZh ? "杭艺云展" : "Hangyi Cloud Expo"}
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
          {isZh ? "探索杭州手工艺的无限可能" : "Explore the endless possibilities of Hangzhou crafts"}
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground md:text-base">
          {isZh
            ? "从作品创作到展览发布，从社区交流到论坛讨论，把灵感、作品与展讯连接在同一个创作空间。"
            : "From creation to exhibitions, from social feed to forum discussions, connect ideas and works in one creative space."}
        </p>
        <div className="relative mt-5 flex flex-wrap gap-2">
          <Link
            href={`/${locale}/home/post`}
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:-translate-y-0.5 hover:bg-primary/90"
          >
            {isZh ? "开始创作" : "Start Creating"}
          </Link>
          <Link
            href={`/${locale}/home/ai-chat`}
            className="inline-flex h-10 items-center justify-center rounded-md bg-background px-4 text-sm font-medium text-foreground transition hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground"
          >
            {isZh ? "问小云AI" : "Ask AI"}
          </Link>
          <Link
            href={`/${locale}/home/exhibition`}
            className="inline-flex h-10 items-center justify-center rounded-md bg-background px-4 text-sm font-medium text-foreground transition hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground"
          >
            {isZh ? "看展览" : "View Exhibitions"}
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.key}
              href={action.href}
              className="group rounded-xl bg-card p-4 text-card-foreground shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-4.5 w-4.5 transition group-hover:scale-110" />
              </div>
              <h3 className="mt-3 text-sm font-semibold md:text-base">{action.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground md:text-sm">{action.desc}</p>
            </Link>
          );
        })}
      </section>

      <section className="rounded-2xl bg-card p-6 text-card-foreground shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{isZh ? "精选作品" : "Featured Works"}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {isZh ? "按类型筛选，快速找到你想看的内容" : "Filter by type to discover faster"}
            </p>
          </div>
          <Link
            href={`/${locale}/home/community`}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            {isZh ? "查看全部" : "View all"}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          {typeTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setPostType(tab.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                postType === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filteredPosts.length === 0 ? (
          <div className="rounded-lg bg-muted/50 px-4 py-12 text-center text-sm text-muted-foreground">
            {isZh ? "暂时还没有公开作品，先去发布第一条吧。" : "No public works yet. Publish your first one."}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filteredPosts.map((post, index) => (
              <Link
                key={post.uuid}
                href={`/${locale}/home/post/${post.uuid}`}
                className={`group rounded-xl bg-background p-4 transition hover:-translate-y-0.5 hover:shadow-sm ${
                  index === 0 ? "md:col-span-2" : ""
                }`}
              >
                <p className="line-clamp-1 text-sm font-semibold group-hover:text-primary">
                  {post.title || (isZh ? "未命名作品" : "Untitled")}
                </p>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                  {getHomePostExcerpt(post.content, index === 0 ? 140 : 88)}
                </p>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{post.author?.nickname || (isZh ? "匿名作者" : "Unknown author")}</span>
                  <span>{formatDate(post.created_at, locale)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl bg-card p-5 text-card-foreground shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">{isZh ? "近期展览" : "Upcoming Exhibitions"}</h2>
            <Link
              href={`/${locale}/home/exhibition`}
              className="text-sm font-medium text-primary hover:underline"
            >
              {isZh ? "查看全部" : "View all"}
            </Link>
          </div>

          {upcomingExhibitions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {isZh ? "暂无近期展览，稍后再来看看。" : "No upcoming exhibitions for now."}
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingExhibitions.map((item) => (
                <Link
                  key={item.uuid}
                  href={`/${locale}/home/exhibition/${item.uuid}`}
                  className="block rounded-lg bg-background p-3 transition hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <p className="line-clamp-1 text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(item.start_at || "", locale)} · {item.venue_name || (isZh ? "场地待定" : "Venue TBA")}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl bg-card p-5 text-card-foreground shadow-sm">
          <h2 className="text-base font-semibold">{isZh ? "小云AI 推荐" : "AI Suggestions"}</h2>
          <div className="mt-4 space-y-2">
            {aiPrompts.map((prompt, idx) => (
              <Link
                key={prompt}
                href={`/${locale}/home/ai-chat?q=${encodeURIComponent(prompt)}`}
                onMouseEnter={() => setActivePrompt(idx)}
                className={`block rounded-lg border px-3 py-2 text-sm transition ${
                  activePrompt === idx
                    ? "bg-primary/10 text-foreground"
                    : "bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {prompt}
              </Link>
            ))}
          </div>
          <div className="mt-4 rounded-lg bg-background px-3 py-2">
            <p className="text-xs text-muted-foreground">{isZh ? "当前推荐" : "Current suggestion"}</p>
            <p className="mt-1 text-sm">{aiPrompts[activePrompt]}</p>
          </div>
          <Link href={`/${locale}/home/ai-chat?q=${encodeURIComponent(aiPrompts[activePrompt])}`} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            <WandSparkles className="h-3.5 w-3.5" />
            {isZh ? "用这个问题开始" : "Start with this"}
          </Link>
        </div>
      </section>

      <section className="grid gap-3 rounded-xl bg-muted/30 p-5 md:grid-cols-3">
        <div>
          <p className="text-2xl font-semibold text-primary">{featuredPosts.length > 0 ? "1,200+" : "0"}</p>
          <p className="mt-1 text-sm text-muted-foreground">{isZh ? "手工艺作品" : "Craft Works"}</p>
        </div>
        <div>
          <p className="text-2xl font-semibold text-primary">350+</p>
          <p className="mt-1 text-sm text-muted-foreground">{isZh ? "注册手艺人" : "Registered Creators"}</p>
        </div>
        <div>
          <p className="text-2xl font-semibold text-primary">{upcomingExhibitions.length > 0 ? "80+" : "0"}</p>
          <p className="mt-1 text-sm text-muted-foreground">{isZh ? "线下展览" : "Offline Exhibitions"}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock3 className="h-3.5 w-3.5" />
            {isZh ? "持续更新中" : "Updated continuously"}
          </p>
        </div>
      </section>
    </div>
  );
}
