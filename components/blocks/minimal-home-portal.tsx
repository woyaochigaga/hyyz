"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BotMessageSquare,
  MapPinned,
  Megaphone,
  MessageSquare,
  PenSquare,
} from "lucide-react";

type PortalItem = {
  key: string;
  title: string;
  desc: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

export default function MinimalHomePortal({ locale }: { locale: string }) {
  const isZh = locale.startsWith("zh");
  const [activeNotice, setActiveNotice] = React.useState(0);

  const notices = isZh
    ? [
        "网站公告：平台本周已完成首页与公告样式升级，访问体验持续优化中。",
        "网站公告：论坛精选与线下展览入口已整合到统一功能门户。",
        "网站公告：作品发布、AI 助手与展览浏览现已支持更快访问。",
      ]
    : [
        "Notice: The homepage and notice system have been refined for a cleaner experience.",
        "Notice: Forum highlights and exhibition access are now grouped in one portal.",
        "Notice: Publishing, AI assistance, and exhibition browsing are now easier to reach.",
      ];

  const portalItems: PortalItem[] = [
    {
      key: "create",
      title: isZh ? "发布作品" : "Publish",
      desc: isZh ? "进入创作与发布空间" : "Open the creation workspace",
      href: `/${locale}/home/post`,
      icon: PenSquare,
    },
    {
      key: "ai",
      title: isZh ? "小云 AI" : "AI Assistant",
      desc: isZh ? "获取灵感与策展辅助" : "Get prompts and curation help",
      href: `/${locale}/home/ai-chat`,
      icon: BotMessageSquare,
    },
    {
      key: "exhibition",
      title: isZh ? "线下展览" : "Exhibitions",
      desc: isZh ? "查看最新展讯与场地" : "Browse upcoming physical shows",
      href: `/${locale}/home/exhibition`,
      icon: MapPinned,
    },
    {
      key: "forum",
      title: isZh ? "杭艺论坛" : "Forum",
      desc: isZh ? "进入交流与讨论板块" : "Join the discussion space",
      href: `/${locale}/home/forum`,
      icon: MessageSquare,
    },
  ];

  React.useEffect(() => {
    if (notices.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveNotice((current) => (current + 1) % notices.length);
    }, 4800);
    return () => window.clearInterval(timer);
  }, [notices.length]);

  return (
    <main className="relative min-h-[calc(100svh-3.5rem)] overflow-hidden bg-[#f5f1e8] text-zinc-950 dark:bg-[#0d0d0f] dark:text-zinc-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[8%] top-[-8%] h-72 w-72 rounded-full bg-[rgba(184,152,108,0.14)] blur-3xl dark:bg-[rgba(184,152,108,0.1)]" />
        <div className="absolute bottom-[-10%] right-[10%] h-80 w-80 rounded-full bg-[rgba(51,77,109,0.12)] blur-3xl dark:bg-[rgba(83,109,142,0.12)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.28),rgba(255,255,255,0))] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0))]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 pb-10 pt-8 md:px-8 md:pt-12 lg:gap-10 lg:px-10">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
          <div className="rounded-[2rem] border border-black/8 bg-white/72 p-7 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_24px_80px_rgba(0,0,0,0.35)] md:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-black/[0.03] px-3 py-1 text-[11px] tracking-[0.24em] text-zinc-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300">
              HANGYI CLOUD EXPO
            </div>
            <div className="mt-8 max-w-3xl">
              <p className="text-sm tracking-[0.28em] text-zinc-500 dark:text-zinc-400">
                {isZh ? "极简入口" : "MINIMAL PORTAL"}
              </p>
              <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight tracking-[-0.04em] md:text-6xl">
                {isZh ? "以更克制的方式，进入杭州工艺的数字现场" : "A restrained way into the digital stage of Hangzhou craft"}
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-300 md:text-base">
                {isZh
                  ? "首页只保留必要信息：网站公告、核心入口与清晰路径。让浏览更轻，质感更强，内容本身成为视觉重心。"
                  : "The homepage keeps only what matters: site notices, core portals, and clear routes. Lighter browsing, stronger presence, and more focus on the content itself."}
              </p>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              <Link
                href={`/${locale}/home/post`}
                className="group flex min-h-[124px] flex-col justify-between rounded-[1.5rem] border border-black/8 bg-[#161616] px-5 py-5 text-white transition hover:-translate-y-0.5 hover:bg-black dark:border-white/10 dark:bg-white/[0.06] dark:hover:bg-white/[0.1]"
              >
                <span className="text-xs tracking-[0.22em] text-white/55">
                  {isZh ? "PRIMARY" : "PRIMARY"}
                </span>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-medium">{isZh ? "开始创作" : "Start Creating"}</h2>
                    <p className="mt-1 text-sm text-white/65">
                      {isZh ? "发布图文、文本或视频作品" : "Publish text, image, or video works"}
                    </p>
                  </div>
                  <ArrowUpRight className="h-5 w-5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </Link>

              <div className="rounded-[1.5rem] border border-black/8 bg-black/[0.03] px-5 py-5 dark:border-white/10 dark:bg-white/[0.03]">
                <p className="text-xs tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
                  {isZh ? "ACCESS" : "ACCESS"}
                </p>
                <p className="mt-5 text-3xl font-semibold tracking-[-0.04em]">04</p>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                  {isZh ? "核心功能入口经过重新整理，保持低干扰和高辨识。" : "Four core portals, refined for low noise and quick recognition."}
                </p>
              </div>
            </div>
          </div>

          <section className="rounded-[2rem] border border-black/8 bg-white/60 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_24px_80px_rgba(0,0,0,0.28)] md:p-7">
            <div className="flex items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2 text-sm font-medium">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black">
                  <Megaphone className="h-4 w-4" />
                </span>
                {isZh ? "网站公告" : "Site Notice"}
              </div>
              <div className="flex items-center gap-2">
                {notices.map((_, index) => (
                  <button
                    key={`notice-${index}`}
                    type="button"
                    onClick={() => setActiveNotice(index)}
                    className={`h-2 rounded-full transition-all ${
                      activeNotice === index
                        ? "w-10 bg-zinc-950 dark:bg-white"
                        : "w-5 bg-zinc-300 dark:bg-white/20"
                    }`}
                    aria-label={`notice-${index + 1}`}
                  />
                ))}
              </div>
            </div>

            <div className="mt-8 rounded-[1.5rem] border border-black/6 bg-white/70 p-5 dark:border-white/10 dark:bg-black/20">
              <p className="text-xs tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
                {isZh ? "CURRENT" : "CURRENT"}
              </p>
              <p className="mt-4 text-base leading-8 text-zinc-800 dark:text-zinc-100 md:text-lg">
                {notices[activeNotice]}
              </p>
            </div>

            <div className="mt-6 grid gap-3 text-sm text-zinc-600 dark:text-zinc-300">
              <div className="flex items-center justify-between rounded-2xl border border-black/6 px-4 py-3 dark:border-white/10">
                <span>{isZh ? "访问状态" : "Status"}</span>
                <span>{isZh ? "正常" : "Stable"}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-black/6 px-4 py-3 dark:border-white/10">
                <span>{isZh ? "首页风格" : "Style"}</span>
                <span>{isZh ? "极简模式" : "Minimal mode"}</span>
              </div>
            </div>
          </section>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {portalItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                href={item.href}
                className="group rounded-[1.75rem] border border-black/8 bg-white/62 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.05)] backdrop-blur-xl transition hover:-translate-y-1 hover:border-black/15 hover:bg-white/78 dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_18px_60px_rgba(0,0,0,0.22)] dark:hover:border-white/20 dark:hover:bg-white/[0.07]"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-black/[0.05] text-zinc-900 transition group-hover:bg-black group-hover:text-white dark:bg-white/[0.06] dark:text-white dark:group-hover:bg-white dark:group-hover:text-black">
                    <Icon className="h-5 w-5" />
                  </span>
                  <ArrowUpRight className="h-4.5 w-4.5 text-zinc-400 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-zinc-900 dark:group-hover:text-white" />
                </div>
                <div className="mt-10">
                  <p className="text-lg font-medium tracking-[-0.02em]">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                    {item.desc}
                  </p>
                </div>
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}
