"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, MessageSquarePlus, Users } from "lucide-react";
import { ForumBar, ForumPost } from "@/types/forum";
import { ForumPostCard } from "@/components/forum/post-card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function ForumBarView({
  locale,
  initialBar,
  initialPosts,
}: {
  locale: string;
  initialBar: ForumBar;
  initialPosts: ForumPost[];
}) {
  const router = useRouter();
  const isZh = locale.startsWith("zh");
  const [bar, setBar] = React.useState(initialBar);
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [followLoading, setFollowLoading] = React.useState(false);
  const panelClass =
    "rounded-[28px] border border-white/65 bg-white/78 shadow-[0_18px_48px_rgba(54,84,74,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_48px_rgba(0,0,0,0.28)]";

  const handleCreatePost = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const resp = await fetch("/api/forum/post/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
          bar_id: bar.id,
        }),
      });
      const result = await resp.json();
      if (result.code !== 0 || !result.data?.id) {
        throw new Error(result.message || (isZh ? "发帖失败" : "Failed to publish"));
      }

      toast.success(isZh ? "帖子已发布" : "Post published");
      setTitle("");
      setContent("");
      router.push(`/${locale}/home/forum/post/${encodeURIComponent(result.data.id)}`);
    } catch (error: any) {
      toast.error(error?.message || (isZh ? "发帖失败" : "Failed to publish"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleFollow = async () => {
    setFollowLoading(true);
    try {
      const resp = await fetch("/api/forum/bar/follow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bar_id: bar.id,
        }),
      });
      const result = await resp.json();
      if (result.code !== 0) {
        throw new Error(result.message || (isZh ? "关注失败" : "Follow failed"));
      }

      setBar((current) => ({
        ...current,
        followed: Boolean(result.data?.followed),
        follow_count: Number(result.data?.follow_count || 0),
      }));
    } catch (error: any) {
      toast.error(error?.message || (isZh ? "关注失败" : "Follow failed"));
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <div className="relative min-h-full w-full overflow-hidden bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)_/_0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(125,158,148,0.14),transparent_24%),linear-gradient(180deg,#f2f8f5_0%,#f4f6f5_40%,#edf2f0_100%)] dark:bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)_/_0.2),transparent_26%),radial-gradient(circle_at_top_right,rgba(82,112,104,0.16),transparent_24%),linear-gradient(180deg,#121917_0%,#16201d_46%,#101715_100%)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10%] top-[-4rem] h-56 w-56 rounded-full bg-[hsl(var(--primary)/0.18)] blur-3xl dark:bg-[hsl(var(--primary)/0.18)]" />
        <div className="absolute right-[-5%] top-[8rem] h-64 w-64 rounded-full bg-[rgba(121,161,148,0.22)] blur-3xl dark:bg-[rgba(86,126,114,0.28)]" />
        <div className="absolute bottom-[-6rem] left-[28%] h-56 w-56 rounded-full bg-white/35 blur-3xl dark:bg-white/5" />
      </div>

      <div className="relative flex min-h-full w-full flex-col gap-4 px-2 pb-10 pt-3 sm:px-3 lg:px-4">
      <section className={cn(panelClass, "relative overflow-hidden px-5 py-6 sm:px-7")}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[linear-gradient(90deg,hsl(var(--primary)_/_0.16),rgba(255,255,255,0))] dark:bg-[linear-gradient(90deg,hsl(var(--primary)_/_0.18),rgba(255,255,255,0))]" />
        <div className="relative">
          <Link
            href={`/${locale}/home/forum`}
            className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-white dark:border-white/10 dark:bg-white/8 dark:text-zinc-200 dark:hover:bg-white/12"
          >
            <ArrowLeft className="h-4 w-4" />
            {isZh ? "返回论坛" : "Back"}
          </Link>

          <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center rounded-full bg-primary/[0.12] px-3 py-1 text-xs font-medium text-primary dark:bg-primary/[0.18] dark:text-primary">
                {isZh ? "吧内页" : "Bar page"}
              </div>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white sm:text-[1.75rem]">
                {bar.name}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 sm:text-base">
                {bar.description || (isZh ? "这个吧还没有简介，欢迎成为第一位补充内容的人。" : "This bar has no description yet.")}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-white/60 bg-white/60 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/6">
                <div className="font-semibold tabular-nums text-primary">{bar.post_count}</div>
                <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{isZh ? "帖子" : "Threads"}</div>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/60 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/6">
                <div className="font-semibold tabular-nums text-primary">{bar.follow_count}</div>
                <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{isZh ? "关注" : "Follows"}</div>
              </div>
              <button
                type="button"
                disabled={followLoading}
                onClick={() => void handleToggleFollow()}
                className={cn(
                  "inline-flex h-10 items-center justify-center rounded-lg px-5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
                  bar.followed
                    ? "border border-white/60 bg-white/70 text-zinc-700 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/14"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                {followLoading
                  ? isZh
                    ? "处理中..."
                    : "..."
                  : bar.followed
                    ? isZh
                      ? "已关注"
                      : "Following"
                    : isZh
                      ? "关注本吧"
                      : "Follow"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className={cn(panelClass, "p-5")}>
        <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
          <MessageSquarePlus className="h-4 w-4" />
          <h2 className="text-lg font-semibold">
            {isZh ? `在 ${bar.name} 发帖` : `Post in ${bar.name}`}
          </h2>
        </div>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {isZh ? "继续补充作品过程、课堂讨论、展陈记录或你现在遇到的技术问题。" : "Add work progress, studio notes, installation logs, or the making problem you are solving."}
        </p>
        <form className="mt-4 space-y-3" onSubmit={handleCreatePost}>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={isZh ? "标题可选，例如：木刻课程第一次试印记录" : "Optional title"}
            className="h-11 rounded-xl border border-white/65 bg-white/70 px-4 text-sm shadow-none focus-visible:ring-2 focus-visible:ring-primary/15 dark:border-white/10 dark:bg-white/8"
          />
          <Textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder={isZh ? "分享作品、讨论技法、记录布展，或者把你卡住的问题发出来。" : "Share your work, process notes, installation logs, or the question you are stuck on."}
            className="min-h-[132px] rounded-xl border border-white/65 bg-white/70 px-4 py-3 text-sm leading-6 shadow-none focus-visible:ring-2 focus-visible:ring-primary/15 dark:border-white/10 dark:bg-white/8"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (isZh ? "发布中..." : "Publishing...") : isZh ? "发布帖子" : "Publish"}
            </button>
          </div>
        </form>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2 text-zinc-900 dark:text-white">
          <Users className="h-4 w-4" />
          <h2 className="text-lg font-semibold">
            {isZh ? "吧内最新讨论" : "Latest discussions"}
          </h2>
        </div>
        <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
          {isZh ? "最近被回应的帖子会排在前面，方便持续追踪讨论走向。" : "Threads with recent replies stay at the top so ongoing discussions remain visible."}
        </p>

        {initialPosts.length === 0 ? (
          <div className={cn(panelClass, "px-6 py-12 text-center")}>
            <p className="text-base font-medium text-zinc-900 dark:text-white">
              {isZh ? "本吧还没有帖子，先来发第一条。" : "No threads in this bar yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {initialPosts.map((post, index) => (
              <ForumPostCard
                key={post.id}
                locale={locale}
                post={post}
                featured={index === 0}
              />
            ))}
          </div>
        )}
      </section>
      </div>
    </div>
  );
}
