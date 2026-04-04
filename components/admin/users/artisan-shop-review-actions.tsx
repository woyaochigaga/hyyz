"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { notify } from "@/lib/notify";
import type { ArtisanShopVerificationStatus } from "@/lib/artisan-shop";

export function ArtisanShopReviewActions({
  uuid,
  initialNote,
  status,
}: {
  uuid: string;
  initialNote?: string;
  status: ArtisanShopVerificationStatus;
}) {
  const router = useRouter();
  const [note, setNote] = useState(initialNote || "");
  const [loadingStatus, setLoadingStatus] =
    useState<ArtisanShopVerificationStatus | null>(null);

  const review = async (
    nextStatus: Exclude<ArtisanShopVerificationStatus, "none" | "pending">
  ) => {
    if (!uuid) return;
    if (nextStatus === "rejected" && !note.trim()) {
      notify("error", "驳回时请填写原因");
      return;
    }

    try {
      setLoadingStatus(nextStatus);
      const resp = await fetch("/api/admin/users/review-artisan-shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uuid,
          status: nextStatus,
          note: note.trim(),
        }),
      });
      const result = await resp.json();
      if (result.code !== 0) {
        notify("error", result.message || "审核失败");
        return;
      }
      notify(
        "success",
        nextStatus === "approved"
          ? "已通过认证"
          : nextStatus === "expired"
            ? "已标记为过期"
            : "已驳回该认证"
      );
      router.refresh();
    } catch {
      notify("error", "审核失败");
    } finally {
      setLoadingStatus(null);
    }
  };

  return (
    <div className="space-y-3">
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="填写审核备注或驳回原因"
        rows={3}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => void review("approved")}
          disabled={loadingStatus !== null}
        >
          {loadingStatus === "approved" ? "处理中..." : "通过"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          onClick={() => void review("rejected")}
          disabled={loadingStatus !== null}
        >
          {loadingStatus === "rejected" ? "处理中..." : "驳回"}
        </Button>
        {status === "approved" ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void review("expired")}
            disabled={loadingStatus !== null}
          >
            {loadingStatus === "expired" ? "处理中..." : "标记过期"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
