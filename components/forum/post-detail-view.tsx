"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, MessageSquare, RefreshCcw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { proxifyAvatarUrl } from "@/lib/avatar";
import { cn } from "@/lib/utils";
import { ForumPostDetail, ForumReply } from "@/types/forum";
import { UserPublicProfileTrigger } from "@/components/user/public-profile-dialog";
import {
  ReplyComposer,
  getReplyTargetLabel,
} from "@/components/forum/reply-composer";

type ActiveReplyTarget =
  | { type: "post" }
  | { type: "reply"; reply: ForumReply };

function formatDate(date?: string, locale = "zh") {
  if (!date) return "";
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "";

  return new Intl.DateTimeFormat(locale.startsWith("zh") ? "zh-CN" : "en-US", {
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

function isSameReplyTarget(
  current: ActiveReplyTarget | null,
  next: ActiveReplyTarget
) {
  if (!current || current.type !== next.type) return false;
  if (current.type === "post" && next.type === "post") {
    return true;
  }
  if (current.type === "reply" && next.type === "reply") {
    return current.reply.id === next.reply.id;
  }
  return false;
}

export function ForumPostDetailView({
  locale,
  postId,
  initialDetail,
}: {
  locale: string;
  postId: string;
  initialDetail: ForumPostDetail;
}) {
  const isZh = locale.startsWith("zh");
  const [detail, setDetail] = React.useState(initialDetail);
  const [activeReplyTarget, setActiveReplyTarget] =
    React.useState<ActiveReplyTarget | null>(null);
  const [replyContent, setReplyContent] = React.useState("");
  const [replyImageUrl, setReplyImageUrl] = React.useState("");
  const [replying, setReplying] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const panelClass =
    "rounded-[28px] border border-white/65 bg-white/78 shadow-[0_18px_48px_rgba(54,84,74,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_48px_rgba(0,0,0,0.28)]";
  const softPanelClass =
    "rounded-2xl border border-white/60 bg-white/72 shadow-[0_14px_36px_rgba(54,84,74,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/6 dark:shadow-[0_14px_36px_rgba(0,0,0,0.2)]";

  const resetReplyDraft = React.useCallback(() => {
    setActiveReplyTarget(null);
    setReplyContent("");
    setReplyImageUrl("");
  }, []);

  const openReplyTarget = React.useCallback((next: ActiveReplyTarget) => {
    setReplyContent("");
    setReplyImageUrl("");
    setActiveReplyTarget((current) => (isSameReplyTarget(current, next) ? null : next));
  }, []);

  const loadDetail = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const resp = await fetch(`/api/forum/post/${postId}`);
      const result = await resp.json();
      if (result.code === 0 && result.data?.post) {
        setDetail(result.data);
      }
    } catch {
      // Keep the page interactive even if refresh fails.
    } finally {
      setRefreshing(false);
    }
  }, [postId]);

  React.useEffect(() => {
    setDetail(initialDetail);
  }, [initialDetail]);

  React.useEffect(() => {
    resetReplyDraft();
  }, [postId, resetReplyDraft]);

  const handleReply = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeReplyTarget || replying) return;

    setReplying(true);

    try {
      const targetReply =
        activeReplyTarget.type === "reply" ? activeReplyTarget.reply : null;
      const resp = await fetch("/api/forum/reply/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          post_id: postId,
          content: replyContent,
          image_url: replyImageUrl,
          reply_to_reply_id: targetReply?.id || "",
          reply_to_author_id: targetReply?.author_id || "",
        }),
      });
      const result = await resp.json();
      if (result.code !== 0 || !result.data?.reply) {
        throw new Error(result.message || (isZh ? "回复失败" : "Reply failed"));
      }

      const reply = result.data.reply as ForumReply;
      resetReplyDraft();
      setDetail((current) => ({
        post: result.data?.post || current.post,
        replies: [...current.replies, reply],
      }));
      toast.success(isZh ? "回复成功，帖子已顶起" : "Reply published");
    } catch (error: any) {
      toast.error(error?.message || (isZh ? "回复失败" : "Reply failed"));
    } finally {
      setReplying(false);
    }
  };

  const { post, replies } = detail;
  const isBarOwner = post.bar?.creator_id === post.author_id;
  const replyFloorMap = new Map(
    replies.map((item) => [item.id, Number(item.floor || 0)])
  );
  const replySubmitDisabled = !replyContent.trim() && !replyImageUrl.trim();

  return (
    <div className="relative min-h-full w-full overflow-hidden bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)_/_0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(125,158,148,0.14),transparent_24%),linear-gradient(180deg,#f2f8f5_0%,#f4f6f5_40%,#edf2f0_100%)] dark:bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)_/_0.2),transparent_26%),radial-gradient(circle_at_top_right,rgba(82,112,104,0.16),transparent_24%),linear-gradient(180deg,#121917_0%,#16201d_46%,#101715_100%)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10%] top-[-4rem] h-56 w-56 rounded-full bg-[hsl(var(--primary)/0.18)] blur-3xl dark:bg-[hsl(var(--primary)/0.18)]" />
        <div className="absolute right-[-5%] top-[8rem] h-64 w-64 rounded-full bg-[rgba(121,161,148,0.22)] blur-3xl dark:bg-[rgba(86,126,114,0.28)]" />
        <div className="absolute bottom-[-6rem] left-[28%] h-56 w-56 rounded-full bg-white/35 blur-3xl dark:bg-white/5" />
      </div>

      <div className="relative flex min-h-full w-full flex-col gap-4 px-2 pb-10 pt-3 sm:px-3 lg:px-4">
        <div className="flex items-center justify-between gap-3">
          <Link
            href={
              post.bar
                ? `/${locale}/home/forum/bar/${encodeURIComponent(post.bar.id)}`
                : `/${locale}/home/forum`
            }
            className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-3.5 py-2 text-sm font-medium text-zinc-700 transition hover:bg-white dark:border-white/10 dark:bg-white/8 dark:text-zinc-200 dark:hover:bg-white/12"
          >
            <ArrowLeft className="h-4 w-4" />
            {isZh ? "返回上一级" : "Back"}
          </Link>

          <button
            type="button"
            onClick={() => void loadDetail()}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            <RefreshCcw className="h-4 w-4" />
            {refreshing ? (isZh ? "刷新中..." : "Refreshing...") : isZh ? "刷新" : "Refresh"}
          </button>
        </div>

        <section className={cn(panelClass, "overflow-hidden p-6 sm:p-7")}>
          <div className="flex flex-wrap items-center gap-2">
            {post.bar ? (
              <Link
                href={`/${locale}/home/forum/bar/${encodeURIComponent(post.bar.id)}`}
                className="rounded-full bg-primary/[0.12] px-2.5 py-1 text-xs font-medium text-primary dark:bg-primary/[0.18] dark:text-primary"
              >
                {post.bar.name}
              </Link>
            ) : null}
            {isBarOwner ? (
              <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-medium text-zinc-700 ring-1 ring-primary/12 dark:bg-white/10 dark:text-zinc-200 dark:ring-primary/18">
                {isZh ? "吧主发帖" : "Owner"}
              </span>
            ) : null}
          </div>

          <h1 className="mt-4 text-[1.65rem] font-semibold leading-snug tracking-tight text-zinc-900 dark:text-white sm:text-[1.85rem]">
            {post.title}
          </h1>

          <div className="mt-5 flex items-center gap-3">
            <UserPublicProfileTrigger userUuid={post.author?.uuid || post.author_id}>
              <Avatar className="h-11 w-11">
                <AvatarImage
                  src={proxifyAvatarUrl(post.author?.avatar_url) || undefined}
                  alt={post.author?.nickname || "User"}
                />
                <AvatarFallback>{initials(post.author?.nickname)}</AvatarFallback>
              </Avatar>
            </UserPublicProfileTrigger>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <UserPublicProfileTrigger userUuid={post.author?.uuid || post.author_id}>
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {post.author?.nickname || (isZh ? "未命名用户" : "Unknown user")}
                  </span>
                </UserPublicProfileTrigger>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {formatDate(post.created_at, locale)}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                <span>{isZh ? `回复 ${post.reply_count}` : `${post.reply_count} replies`}</span>
                <span>{isZh ? `点赞 ${post.like_count}` : `${post.like_count} likes`}</span>
                <button
                  type="button"
                  onClick={() => openReplyTarget({ type: "post" })}
                  className={cn(
                    "inline-flex items-center gap-1.5 transition hover:text-primary",
                    activeReplyTarget?.type === "post" && "text-primary"
                  )}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>{isZh ? "回复主贴" : "Reply"}</span>
                </button>
                {post.last_reply_at ? (
                  <span>
                    {isZh
                      ? `最后活跃 ${formatDate(post.last_reply_at, locale)}`
                      : `Last active ${formatDate(post.last_reply_at, locale)}`}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-6 whitespace-pre-wrap text-[15px] leading-8 text-zinc-700 dark:text-zinc-200">
            {post.content}
          </div>

          {activeReplyTarget?.type === "post" ? (
            <div className="mt-6 border-t border-black/5 pt-5 dark:border-white/10">
              <ReplyComposer
                locale={locale}
                value={replyContent}
                imageUrl={replyImageUrl}
                replying={replying}
                submitDisabled={replySubmitDisabled}
                placeholder={
                  isZh
                    ? "回复主贴，可发文字、图片，或图文一起发。"
                    : "Reply to the thread with text, an image, or both."
                }
                submitLabel={isZh ? "发送回复" : "Reply"}
                cancelLabel={isZh ? "取消" : "Cancel"}
                targetLabel={getReplyTargetLabel(locale, null)}
                onValueChange={setReplyContent}
                onImageChange={setReplyImageUrl}
                onSubmit={handleReply}
                onCancel={resetReplyDraft}
              />
            </div>
          ) : null}
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              {isZh ? `全部回复 (${replies.length})` : `Replies (${replies.length})`}
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {isZh
                ? "按楼层顺序展开，点击任意一条楼层即可在该条下方直接回复。"
                : "Replies stay in floor order, and each item can be replied to inline."}
            </p>
          </div>

          {replies.length === 0 ? (
            <div className={cn(panelClass, "px-6 py-12 text-center")}>
              <p className="text-base font-medium text-zinc-900 dark:text-white">
                {isZh ? "还没有回复，来抢沙发。" : "No replies yet."}
              </p>
            </div>
          ) : (
            replies.map((reply) => {
              const isAuthor = reply.author_id === post.author_id;
              const isReplyBarOwner = reply.author_id === post.bar?.creator_id;
              const isReplyComposerOpen =
                activeReplyTarget?.type === "reply" &&
                activeReplyTarget.reply.id === reply.id;
              const replyTargetFloor = reply.reply_to_reply_id
                ? replyFloorMap.get(reply.reply_to_reply_id)
                : 0;

              return (
                <div key={reply.id} className="space-y-3">
                  <article className={cn(softPanelClass, "p-5")}>
                    <div className="flex items-start gap-3">
                      <UserPublicProfileTrigger userUuid={reply.author?.uuid || reply.author_id}>
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={proxifyAvatarUrl(reply.author?.avatar_url) || undefined}
                            alt={reply.author?.nickname || "User"}
                          />
                          <AvatarFallback>{initials(reply.author?.nickname)}</AvatarFallback>
                        </Avatar>
                      </UserPublicProfileTrigger>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <UserPublicProfileTrigger userUuid={reply.author?.uuid || reply.author_id}>
                            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                              {reply.author?.nickname || (isZh ? "未命名用户" : "Unknown user")}
                            </span>
                          </UserPublicProfileTrigger>
                          {isReplyBarOwner ? (
                            <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-medium text-zinc-700 ring-1 ring-primary/12 dark:bg-white/10 dark:text-zinc-200 dark:ring-primary/18">
                              {isZh ? "吧主" : "Owner"}
                            </span>
                          ) : null}
                          {isAuthor ? (
                            <span className="rounded-full bg-primary/[0.12] px-2 py-0.5 text-[11px] font-medium text-primary dark:bg-primary/[0.18] dark:text-primary">
                              {isZh ? "楼主" : "OP"}
                            </span>
                          ) : null}
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-white/8 dark:text-slate-300">
                            {isZh ? `${reply.floor || 0}楼` : `#${reply.floor || 0}`}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          {formatDate(reply.created_at, locale)}
                        </div>

                        {reply.reply_to_reply_id ? (
                          <div className="mt-3 rounded-xl border border-primary/10 bg-primary/[0.06] px-3 py-2 text-xs text-zinc-600 dark:border-primary/15 dark:bg-primary/[0.08] dark:text-zinc-300">
                            {getReplyTargetLabel(locale, {
                              nickname: reply.reply_to_author?.nickname,
                              floor: replyTargetFloor,
                            })}
                          </div>
                        ) : null}

                        {reply.content ? (
                          <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-700 dark:text-zinc-200">
                            {reply.content}
                          </div>
                        ) : null}

                        {reply.image_url ? (
                          <div className="mt-3">
                            <img
                              src={reply.image_url}
                              alt={isZh ? "回复图片" : "Reply image"}
                              className="max-h-80 w-auto max-w-full rounded-2xl border border-black/8 object-cover dark:border-white/10"
                            />
                          </div>
                        ) : null}

                        <div className="mt-4 flex justify-end">
                          <button
                            type="button"
                            onClick={() => openReplyTarget({ type: "reply", reply })}
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition hover:bg-primary/[0.08] hover:text-primary dark:hover:bg-primary/[0.12]",
                              isReplyComposerOpen && "bg-primary/[0.08] text-primary dark:bg-primary/[0.12]"
                            )}
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>{isZh ? "回复这条" : "Reply"}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>

                  {isReplyComposerOpen ? (
                    <div className={cn(softPanelClass, "p-5")}>
                      <ReplyComposer
                        locale={locale}
                        value={replyContent}
                        imageUrl={replyImageUrl}
                        replying={replying}
                        submitDisabled={replySubmitDisabled}
                        placeholder={
                          isZh
                            ? "回复这条留言，可发文字、图片，或图文一起发。"
                            : "Reply here with text, an image, or both."
                        }
                        submitLabel={isZh ? "发送回复" : "Reply"}
                        cancelLabel={isZh ? "取消" : "Cancel"}
                        targetLabel={getReplyTargetLabel(locale, {
                          nickname: reply.author?.nickname,
                          floor: reply.floor,
                        })}
                        onValueChange={setReplyContent}
                        onImageChange={setReplyImageUrl}
                        onSubmit={handleReply}
                        onCancel={resetReplyDraft}
                      />
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </section>
      </div>
    </div>
  );
}
