"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/notify";
import type { HomePost } from "@/types/home-post";
import { HomePostDetailDialog } from "./home-post-detail-dialog";

type ActionType = "delete" | "draft" | null;

export function HomePostActions({ post }: { post: HomePost }) {
  const router = useRouter();
  const [action, setAction] = useState<ActionType>(null);

  const isDeleted = post.status === "deleted";
  const isDraft = post.status === "draft";

  const updateStatus = async (status: "draft") => {
    try {
      setAction("draft");
      const resp = await fetch(`/api/admin/home-posts/${post.uuid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const { code, message } = await resp.json();
      if (code !== 0) {
        notify("error", message || "操作失败");
        return;
      }

      notify("success", "帖子已退回草稿");
      router.refresh();
    } catch (error) {
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
      const { code, message } = await resp.json();
      if (code !== 0) {
        notify("error", message || "删除失败");
        return;
      }

      notify("success", "帖子已删除");
      router.refresh();
    } catch (error) {
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
            void updateStatus("draft");
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
    </div>
  );
}
