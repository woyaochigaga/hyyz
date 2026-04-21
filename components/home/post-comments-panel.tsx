"use client";

import * as React from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { proxifyAvatarUrl } from "@/lib/avatar";
import {
  getCachedResource,
  invalidateCachedResourcePrefix,
} from "@/lib/client-request-cache";
import { EyeOff, MessageCircle, Send, Trash2 } from "lucide-react";
import { HomePost, HomePostComment } from "@/types/home-post";
import { UserPublicProfileTrigger } from "@/components/user/public-profile-dialog";

type CommentStatus = "active" | "hidden" | "deleted";

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

function countActiveComments(items: HomePostComment[]): number {
  return items.reduce(
    (sum, item) =>
      sum +
      (item.status === "active" ? 1 : 0) +
      countActiveComments(item.replies || []),
    0
  );
}

function insertCommentIntoTree(
  items: HomePostComment[],
  comment: HomePostComment
): HomePostComment[] {
  const nextComment = {
    ...comment,
    replies: comment.replies || [],
  };

  if (!comment.parent_uuid) {
    return [nextComment, ...items];
  }

  return items.map((item) => {
    if (item.uuid === comment.parent_uuid) {
      return {
        ...item,
        replies: [...(item.replies || []), nextComment],
      };
    }

    if (item.replies?.length) {
      return {
        ...item,
        replies: insertCommentIntoTree(item.replies, comment),
      };
    }

    return item;
  });
}

function updateCommentInTree(
  items: HomePostComment[],
  commentUuid: string,
  updater: (comment: HomePostComment) => HomePostComment
): HomePostComment[] {
  return items.map((item) => {
    if (item.uuid === commentUuid) {
      return updater(item);
    }

    if (item.replies?.length) {
      return {
        ...item,
        replies: updateCommentInTree(item.replies, commentUuid, updater),
      };
    }

    return item;
  });
}

export function PostCommentsPanel({
  locale,
  currentUserUuid,
  post,
  onCommentCountChange,
  className,
}: {
  locale: string;
  currentUserUuid: string | null;
  post: HomePost | null;
  onCommentCountChange?: (count: number) => void;
  className?: string;
}) {
  const t = useTranslations("home");
  const [comments, setComments] = React.useState<HomePostComment[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [content, setContent] = React.useState("");
  const [replyTo, setReplyTo] = React.useState<HomePostComment | null>(null);
  const onCommentCountChangeRef = React.useRef(onCommentCountChange);

  const isOwner = Boolean(post && currentUserUuid && post.user_uuid === currentUserUuid);

  React.useEffect(() => {
    onCommentCountChangeRef.current = onCommentCountChange;
  }, [onCommentCountChange]);

  const setCommentsAndCount = React.useCallback((nextComments: HomePostComment[]) => {
    setComments(nextComments);
    onCommentCountChangeRef.current?.(countActiveComments(nextComments));
  }, []);

  const loadComments = React.useCallback(async () => {
    if (!post?.uuid) return;
    setLoading(true);
    try {
      const url = isOwner
        ? `/api/home/post/${post.uuid}/comments?manage=1`
        : `/api/home/post/${post.uuid}/comments`;
      const cacheKey = `post-comments:${post.uuid}:${isOwner ? "manage" : "public"}`;
      const result = await getCachedResource(
        cacheKey,
        async () => {
          const resp = await fetch(url);
          return resp.json();
        },
        {
          ttlMs: 15 * 1000,
        }
      );
      if (result.code === 0) {
        const list = Array.isArray(result.data) ? result.data : [];
        setCommentsAndCount(list);
      } else {
        toast.error(result.message || t("feed.comment_load_failed"));
      }
    } catch {
      toast.error(t("feed.comment_load_failed"));
    } finally {
      setLoading(false);
    }
  }, [isOwner, post?.uuid, setCommentsAndCount, t]);

  React.useEffect(() => {
    void loadComments();
  }, [loadComments]);

  const submitComment = React.useCallback(async () => {
    if (!post?.uuid) return;
    if (!currentUserUuid) {
      toast.error(t("feed.login_required"));
      return;
    }
    if (!content.trim()) {
      toast.error(t("feed.comment_placeholder"));
      return;
    }

    setSubmitting(true);
    try {
      const resp = await fetch(`/api/home/post/${post.uuid}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          parent_uuid: replyTo?.uuid || "",
        }),
      });
      const result = await resp.json();
      if (result.code !== 0) {
        throw new Error(result.message || t("feed.comment_submit_failed"));
      }
      invalidateCachedResourcePrefix(`post-comments:${post.uuid}:`);
      if (result.data?.uuid) {
        setCommentsAndCount(insertCommentIntoTree(comments, result.data as HomePostComment));
      }
      setContent("");
      setReplyTo(null);
    } catch (error: any) {
      toast.error(error?.message || t("feed.comment_submit_failed"));
    } finally {
      setSubmitting(false);
    }
  }, [comments, content, currentUserUuid, post?.uuid, replyTo, setCommentsAndCount, t]);

  const patchComment = async (
    commentUuid: string,
    body: { status?: CommentStatus }
  ) => {
    if (!post?.uuid) return;
    try {
      const resp = await fetch(
        `/api/home/post/${post.uuid}/comments/${commentUuid}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );
      const result = await resp.json();
      if (result.code !== 0) {
        throw new Error(result.message || t("feed.comment_action_failed"));
      }
      invalidateCachedResourcePrefix(`post-comments:${post.uuid}:`);
      setCommentsAndCount(
        updateCommentInTree(comments, commentUuid, (comment) => ({
          ...comment,
          ...result.data,
          author: comment.author,
          replies: comment.replies || [],
        }))
      );
    } catch (error: any) {
      toast.error(error?.message || t("feed.comment_action_failed"));
    }
  };

  const deleteComment = async (commentUuid: string) => {
    if (!post?.uuid) return;
    try {
      const resp = await fetch(
        `/api/home/post/${post.uuid}/comments/${commentUuid}`,
        {
          method: "DELETE",
        }
      );
      const result = await resp.json();
      if (result.code !== 0) {
        throw new Error(result.message || t("feed.comment_action_failed"));
      }
      invalidateCachedResourcePrefix(`post-comments:${post.uuid}:`);
      setCommentsAndCount(
        updateCommentInTree(comments, commentUuid, (comment) => ({
          ...comment,
          status: "deleted",
        }))
      );
    } catch (error: any) {
      toast.error(error?.message || t("feed.comment_action_failed"));
    }
  };

  const renderComment = (comment: HomePostComment, depth = 0) => {
    const mine = Boolean(currentUserUuid && comment.user_uuid === currentUserUuid);
    const commentByAuthor = Boolean(post && comment.user_uuid === post.user_uuid);
    const hidden = comment.status === "hidden";
    const deleted = comment.status === "deleted";

    return (
      <div
        key={comment.uuid}
        className={cn(
          depth > 0 && "ml-8 mt-4 border-l border-black/6 pl-5 dark:border-white/10"
        )}
      >
        <div
          className={cn(
            "rounded-[24px] border p-4",
            hidden
              ? "border-amber-200 bg-amber-50/80 dark:border-amber-900/40 dark:bg-amber-950/20"
              : deleted
                ? "border-zinc-200 bg-zinc-50/80 opacity-70 dark:border-white/10 dark:bg-white/[0.02]"
                : "border-black/5 bg-white/80 dark:border-white/10 dark:bg-white/[0.04]"
          )}
        >
          <div className="flex items-start gap-3">
            <UserPublicProfileTrigger userUuid={comment.author?.uuid || comment.user_uuid}>
              <Avatar className="h-9 w-9 border border-black/5 dark:border-white/10">
                <AvatarImage
                  src={proxifyAvatarUrl(comment.author?.avatar_url) || undefined}
                  alt={comment.author?.nickname || "User"}
                />
                <AvatarFallback>{initials(comment.author?.nickname)}</AvatarFallback>
              </Avatar>
            </UserPublicProfileTrigger>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <UserPublicProfileTrigger userUuid={comment.author?.uuid || comment.user_uuid}>
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">
                    {comment.author?.nickname || t("feed.unknown_author")}
                  </span>
                </UserPublicProfileTrigger>
                {commentByAuthor ? (
                  <span className="rounded-full bg-[#e8f0ed] px-2 py-0.5 text-[10px] font-medium text-[#4d665f] dark:bg-white/[0.08] dark:text-[#d7e6e0]">
                    {t("feed.author_badge")}
                  </span>
                ) : null}
                <span className="text-[11px] text-zinc-500">
                  {formatDate(comment.created_at, locale)}
                </span>
                {hidden ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                    {t("feed.comment_hidden")}
                  </span>
                ) : null}
                {deleted ? (
                  <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
                    {t("feed.comment_deleted")}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-600 dark:text-zinc-200">
                {comment.content}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {!deleted ? (
                  <button
                    type="button"
                    onClick={() => setReplyTo(comment)}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-zinc-500 transition hover:bg-black/[0.04] hover:text-zinc-900 dark:hover:bg-white/5 dark:hover:text-zinc-100"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    {t("feed.reply_comment")}
                  </button>
                ) : null}
                {mine && !deleted ? (
                  <button
                    type="button"
                    onClick={() => void deleteComment(comment.uuid)}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-zinc-500 transition hover:bg-black/[0.04] hover:text-zinc-900 dark:hover:bg-white/5 dark:hover:text-zinc-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {t("feed.delete_comment")}
                  </button>
                ) : null}
                {isOwner && !deleted ? (
                  <button
                    type="button"
                    onClick={() =>
                      void patchComment(comment.uuid, {
                        status: hidden ? "active" : "hidden",
                      })
                    }
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-zinc-500 transition hover:bg-black/[0.04] hover:text-zinc-900 dark:hover:bg-white/5 dark:hover:text-zinc-100"
                  >
                    <EyeOff className="h-3.5 w-3.5" />
                    {hidden ? t("feed.show_comment") : t("feed.hide_comment")}
                  </button>
                ) : null}
                {isOwner && !deleted ? (
                  <button
                    type="button"
                    onClick={() => void deleteComment(comment.uuid)}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-zinc-500 transition hover:bg-black/[0.04] hover:text-zinc-900 dark:hover:bg-white/5 dark:hover:text-zinc-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {t("feed.remove_comment")}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        {comment.replies?.map((reply) => renderComment(reply, depth + 1))}
      </div>
    );
  };

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div className="border-b border-black/5 px-6 py-5 dark:border-white/10">
        <div className="text-lg font-semibold text-zinc-900 dark:text-white">
          {t("feed.comment_count_label", { count: post?.comment_count || 0 })}
        </div>
        <div className="mt-1 text-sm text-zinc-500">
          {t("feed.comment_hint")}
        </div>
      </div>

      <div className="min-h-0 flex-1 px-6 py-5">
        {loading ? (
          <div className="text-sm text-zinc-500">{t("feed.loading_comments")}</div>
        ) : comments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 px-4 py-6 text-center text-sm text-zinc-500 dark:border-white/10">
            {t("feed.no_comments")}
          </div>
        ) : (
          <div className="space-y-4">{comments.map((comment) => renderComment(comment))}</div>
        )}
      </div>

      <div className="border-t border-black/5 p-5 dark:border-white/10">
        {replyTo ? (
          <div className="mb-3 flex items-center justify-between rounded-2xl bg-zinc-100 px-3 py-2 text-xs text-zinc-600 dark:bg-white/5 dark:text-zinc-300">
            <span>
              {t("feed.replying_to")} {replyTo.author?.nickname || t("feed.unknown_author")}
            </span>
            <button type="button" onClick={() => setReplyTo(null)}>
              {t("feed.cancel_reply")}
            </button>
          </div>
        ) : null}
        <div className="flex items-end gap-3">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder={t("feed.comment_placeholder")}
            className="min-h-[108px] rounded-[22px] bg-white dark:bg-white/[0.04]"
          />
          <Button
            type="button"
            onClick={() => void submitComment()}
            disabled={submitting}
            className="h-11 shrink-0 rounded-full px-4"
          >
            <Send className="mr-2 h-4 w-4" />
            {t("feed.send_comment")}
          </Button>
        </div>
      </div>
    </div>
  );
}
