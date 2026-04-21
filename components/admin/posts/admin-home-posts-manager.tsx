"use client";

import * as React from "react";
import Link from "next/link";
import moment from "moment";
import { notify } from "@/lib/notify";
import { getHomePostExcerpt } from "@/lib/home-post-content";
import type { HomePost, HomePostStatus, HomePostType } from "@/types/home-post";
import { Button } from "@/components/ui/button";
import { HomePostDetailDialog } from "./home-post-detail-dialog";

function statusLabel(s: HomePostStatus | undefined): string {
  if (s === "published") return "已发布";
  if (s === "draft") return "草稿";
  if (s === "deleted") return "已删除";
  return "其他";
}

function typeLabel(t: HomePostType): string {
  if (t === "text") return "文本";
  if (t === "image") return "图文";
  if (t === "video") return "视频";
  return t;
}

function groupPosts(posts: HomePost[]) {
  const published = posts.filter((p) => p.status === "published");
  const drafts = posts.filter((p) => p.status === "draft");
  const deleted = posts.filter((p) => p.status === "deleted");
  const other = posts.filter(
    (p) => p.status !== "published" && p.status !== "draft" && p.status !== "deleted"
  );

  const groups: Array<{ title: string; data: HomePost[]; emptyMessage: string }> = [
    { title: "已发布", data: published, emptyMessage: "暂无已发布帖子" },
    { title: "草稿", data: drafts, emptyMessage: "暂无草稿" },
    { title: "已删除", data: deleted, emptyMessage: "暂无已删除帖子" },
  ];

  if (other.length > 0) {
    groups.push({ title: "其他状态", data: other, emptyMessage: "暂无" });
  }

  return {
    groups,
    publishedCount: published.length,
    draftCount: drafts.length,
    deletedCount: deleted.length,
    otherCount: other.length,
  };
}

function Actions({
  locale,
  post,
  onChange,
}: {
  locale: string;
  post: HomePost;
  onChange: (next: HomePost | null) => void;
}) {
  const [action, setAction] = React.useState<"delete" | "draft" | null>(null);
  const isDeleted = post.status === "deleted";
  const isDraft = post.status === "draft";

  const updateStatus = async () => {
    try {
      setAction("draft");
      const resp = await fetch(`/api/admin/home-posts/${post.uuid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "draft" }),
      });
      const result = await resp.json();
      if (result?.code !== 0 || !result?.data) {
        notify("error", result?.message || "操作失败");
        return;
      }

      notify("success", "帖子已退回草稿");
      onChange(result.data as HomePost);
    } catch {
      notify("error", "操作失败");
    } finally {
      setAction(null);
    }
  };

  const removePost = async () => {
    try {
      setAction("delete");
      const resp = await fetch(`/api/admin/home-posts/${post.uuid}`, {
        method: "DELETE",
      });
      const result = await resp.json();
      if (result?.code !== 0) {
        notify("error", result?.message || "删除失败");
        return;
      }

      notify("success", "帖子已删除");
      onChange({
        ...post,
        status: "deleted",
      });
    } catch {
      notify("error", "删除失败");
    } finally {
      setAction(null);
    }
  };

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <HomePostDetailDialog
        post={post}
        trigger={
          <Button type="button" variant="outline" size="sm">
            查看
          </Button>
        }
      />

      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={isDeleted || isDraft || action !== null}
        onClick={() => {
          const ok = window.confirm(`确认将帖子退回草稿？\n${post.title || post.uuid}`);
          if (ok) {
            void updateStatus();
          }
        }}
      >
        {action === "draft" ? "退回中..." : "退回"}
      </Button>

      <Button
        type="button"
        variant="destructive"
        size="sm"
        disabled={isDeleted || action !== null}
        onClick={() => {
          const ok = window.confirm(`确认删除帖子？\n${post.title || post.uuid}\n此操作将帖子标记为已删除。`);
          if (ok) {
            void removePost();
          }
        }}
      >
        {action === "delete" ? "删除中..." : "删除"}
      </Button>

      <Link
        href={`/${locale}/home/post/${post.uuid}`}
        className="inline-flex h-9 items-center rounded-md border border-input px-3 text-sm transition hover:bg-accent"
        target="_blank"
        rel="noreferrer"
      >
        前台查看
      </Link>
    </div>
  );
}

export function AdminHomePostsManager({
  locale,
  initialPosts,
}: {
  locale: string;
  initialPosts: HomePost[];
}) {
  const [posts, setPosts] = React.useState<HomePost[]>(initialPosts);

  const grouped = React.useMemo(() => groupPosts(posts), [posts]);

  const handleChange = React.useCallback((next: HomePost | null) => {
    if (!next) {
      return;
    }

    setPosts((current) => current.map((item) => (item.uuid === next.uuid ? { ...item, ...next } : item)));
  }, []);

  return (
    <div className="w-full px-4 py-8 md:px-8">
      <h1 className="mb-2 text-2xl font-medium">帖子管理</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        杭艺社区（共 {posts.length} 条：已发布 {grouped.publishedCount}、草稿 {grouped.draftCount}、已删除{" "}
        {grouped.deletedCount}
        {grouped.otherCount ? `、其他 ${grouped.otherCount}` : ""}）
      </p>

      <div className="space-y-12">
        {grouped.groups.map((group) => (
          <section key={group.title}>
            <h2 className="mb-4 text-lg font-medium text-foreground">{group.title}</h2>
            {group.data.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 px-6 py-10 text-sm text-muted-foreground">
                {group.emptyMessage}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-border/70 bg-background">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/40 text-left text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">UUID</th>
                      <th className="px-4 py-3 font-medium">标题</th>
                      <th className="px-4 py-3 font-medium">类型</th>
                      <th className="px-4 py-3 font-medium">状态</th>
                      <th className="px-4 py-3 font-medium">作者</th>
                      <th className="px-4 py-3 font-medium">点赞</th>
                      <th className="px-4 py-3 font-medium">评论</th>
                      <th className="px-4 py-3 font-medium">创建时间</th>
                      <th className="px-4 py-3 text-right font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.data.map((post) => (
                      <tr key={post.uuid} className="border-t border-border/60 align-top">
                        <td className="max-w-[220px] px-4 py-3 text-xs text-muted-foreground">
                          <div className="break-all">{post.uuid}</div>
                        </td>
                        <td className="min-w-[240px] px-4 py-3">
                          {post.title || getHomePostExcerpt(post.content, 40) || "—"}
                        </td>
                        <td className="px-4 py-3">{typeLabel(post.type)}</td>
                        <td className="px-4 py-3">{statusLabel(post.status)}</td>
                        <td className="px-4 py-3">{post.author?.nickname || post.user_uuid || "—"}</td>
                        <td className="px-4 py-3">{post.like_count || 0}</td>
                        <td className="px-4 py-3">{post.comment_count || 0}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                          {post.created_at
                            ? moment(post.created_at).format("YYYY-MM-DD HH:mm:ss")
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Actions locale={locale} post={post} onChange={handleChange} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
