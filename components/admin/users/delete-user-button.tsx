"use client";

import { Button } from "@/components/ui/button";
import { notify } from "@/lib/notify";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteUserButton({
  uuid,
  label,
}: {
  uuid: string;
  label?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onDelete = async () => {
    if (!uuid) return;
    const ok = window.confirm(`确认删除用户？\n${label || uuid}\n此操作不可恢复。`);
    if (!ok) return;

    try {
      setLoading(true);
      const resp = await fetch("/api/admin/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uuid }),
      });
      const { code, message } = await resp.json();
      if (code !== 0) {
        notify("error", message || "删除失败");
        return;
      }
      notify("success", "用户已删除");
      router.refresh();
    } catch (e) {
      notify("error", "删除失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      onClick={onDelete}
      disabled={loading}
    >
      {loading ? "删除中..." : "删除"}
    </Button>
  );
}

