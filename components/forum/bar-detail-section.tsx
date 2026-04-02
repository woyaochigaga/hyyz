"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, MessageSquarePlus, Users } from "lucide-react";
import { ForumBar, ForumPost } from "@/types/forum";
import { ForumPostCard } from "@/components/forum/post-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function ForumBarDetailSection({
  locale,
  initialBar,
  initialPosts,
  onBack,
  onOpenPost,
  onPostChange,
  onPostCreated,
}: {
  locale: string;
  initialBar: ForumBar;
  initialPosts: ForumPost[];
  onBack?: () => void;
  onOpenPost?: (post: ForumPost) => void;
  onPostChange?: (post: ForumPost) => void;
  onPostCreated?: (post: ForumPost) => void;
}) {
  const isZh = locale.startsWith("zh");
  const [bar, setBar] = React.useState(initialBar);
  const [posts, setPosts] = React.useState(initialPosts);
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [followLoading, setFollowLoading] = React.useState(false);
  const [postDialogOpen, setPostDialogOpen] = React.useState(false);
  const panelClass =
    "rounded-[28px] border border-white/75 bg-white/88 shadow-[0_18px_48px_rgba(54,84,74,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-[#18211e]/88 dark:shadow-[0_18px_48px_rgba(0,0,0,0.28)]";
  const softPanelClass =
    "rounded-2xl border border-white/70 bg-white/84 shadow-[0_14px_36px_rgba(54,84,74,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-[#1b2522]/82 dark:shadow-[0_14px_36px_rgba(0,0,0,0.2)]";

  React.useEffect(() => {
    setBar(initialBar);
  }, [initialBar]);

  React.useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

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

      const createdPost = result.data as ForumPost;
      setPosts((current) => {
        const next = current.filter((item) => item.id !== createdPost.id);
        return [createdPost, ...next];
      });
      setBar((current) => ({
        ...current,
        post_count: current.post_count + 1,
      }));
      onPostCreated?.(createdPost);
      toast.success(isZh ? "帖子已发布" : "Post published");
      setTitle("");
      setContent("");
      setPostDialogOpen(false);
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
    <div className="min-w-0 space-y-4">
      <section className={cn(panelClass, "relative overflow-hidden px-5 py-6 sm:px-7")}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[linear-gradient(90deg,hsl(var(--primary)_/_0.16),rgba(255,255,255,0))] dark:bg-[linear-gradient(90deg,hsl(var(--primary)_/_0.18),rgba(255,255,255,0))]" />
        <div className="relative">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.12] px-3 py-1.5 text-sm font-medium text-primary transition hover:bg-primary/[0.18] dark:border-primary/25 dark:bg-primary/[0.16] dark:text-primary dark:hover:bg-primary/[0.22]"
            >
              <ArrowLeft className="h-4 w-4" />
              {isZh ? "返回论坛" : "Back"}
            </button>
          ) : (
            <Link
              href={`/${locale}/home/forum`}
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.12] px-3 py-1.5 text-sm font-medium text-primary transition hover:bg-primary/[0.18] dark:border-primary/25 dark:bg-primary/[0.16] dark:text-primary dark:hover:bg-primary/[0.22]"
            >
              <ArrowLeft className="h-4 w-4" />
              {isZh ? "返回论坛" : "Back"}
            </Link>
          )}

          <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center rounded-full bg-primary/[0.12] px-3 py-1 text-xs font-medium text-primary dark:bg-primary/[0.18] dark:text-primary">
                {isZh ? "吧详情" : "Bar detail"}
              </div>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-[1.85rem]">
                {bar.name}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-300 sm:text-base">
                {bar.description || (isZh ? "这个吧还没有简介，欢迎成为第一位补充内容的人。" : "This bar has no description yet.")}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className={cn(softPanelClass, "px-4 py-3 text-sm")}>
                <div className="font-semibold tabular-nums text-primary">{bar.post_count}</div>
                <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{isZh ? "帖子" : "Threads"}</div>
              </div>
              <div className={cn(softPanelClass, "px-4 py-3 text-sm")}>
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
                    ? "border border-white/70 bg-white/80 text-zinc-700 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/14"
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-zinc-950 dark:text-white">
              <MessageSquarePlus className="h-4 w-4" />
              <h2 className="text-lg font-semibold">
                {isZh ? `在 ${bar.name} 发帖` : `Post in ${bar.name}`}
              </h2>
            </div>
            <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              {isZh ? "这里直接承接这个吧里的作品进度、课堂讨论、展陈记录和技术求助。" : "Use this space for work progress, studio conversations, installation logs, and technical questions in this bar."}
            </p>
          </div>

          <Dialog open={postDialogOpen} onOpenChange={setPostDialogOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
              >
                <MessageSquarePlus className="h-4 w-4" />
                {isZh ? "发布帖子" : "Publish"}
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-[680px] rounded-2xl border-border bg-background p-0 shadow-2xl">
              <div className="rounded-2xl border border-border bg-card p-6">
                <DialogHeader>
                  <DialogTitle>{isZh ? `在 ${bar.name} 发帖` : `Post in ${bar.name}`}</DialogTitle>
                  <DialogDescription>
                    {isZh
                      ? "分享作品、讨论技法、记录布展，或者把你卡住的问题发出来。"
                      : "Share your work, process notes, installation logs, or the question you are stuck on."}
                  </DialogDescription>
                </DialogHeader>

                <form className="mt-5 space-y-3" onSubmit={handleCreatePost}>
                  <Input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder={isZh ? "标题可选，例如：木刻课程第一次试印记录" : "Optional title"}
                    className="h-11"
                  />
                  <Textarea
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    placeholder={isZh ? "分享作品、讨论技法、记录布展，或者把你卡住的问题发出来。" : "Share your work, process notes, installation logs, or the question you are stuck on."}
                    className="min-h-[180px]"
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
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2 text-zinc-950 dark:text-white">
          <Users className="h-4 w-4" />
          <h2 className="text-lg font-semibold">
            {isZh ? "吧内最新讨论" : "Latest discussions"}
          </h2>
        </div>
 

        {posts.length === 0 ? (
          <div className={cn(panelClass, "px-6 py-12 text-center")}>
            <p className="text-base font-medium text-zinc-950 dark:text-white">
              {isZh ? "本吧还没有帖子，先来发第一条。" : "No threads in this bar yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post, index) => (
              <ForumPostCard
                key={post.id}
                locale={locale}
                post={post}
                featured={index === 0}
                onOpenPost={onOpenPost}
                onPostChange={onPostChange}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
