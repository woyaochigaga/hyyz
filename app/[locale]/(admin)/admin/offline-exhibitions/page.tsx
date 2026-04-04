import Link from "next/link";
import { TableColumn } from "@/types/blocks/table";
import TableSlot from "@/components/dashboard/slots/table";
import { Table as TableSlotType } from "@/types/slots/table";
import { listOfflineExhibitionsForAdmin } from "@/models/offline-exhibition";
import type { OfflineExhibition, OfflineExhibitionStatus } from "@/types/offline-exhibition";
import moment from "moment";

function exhibitionStatusLabel(s: OfflineExhibitionStatus | undefined): string {
  const map: Record<OfflineExhibitionStatus, string> = {
    draft: "草稿",
    pending_review: "待审核",
    published: "已发布",
    rejected: "已驳回",
    closed: "已关闭",
    deleted: "已删除",
  };
  if (!s) return "—";
  return map[s] || s;
}

export default async function AdminOfflineExhibitionsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const all = await listOfflineExhibitionsForAdmin();

  const published = all.filter((e) => e.status === "published");
  const pending = all.filter((e) => e.status === "pending_review");
  const draft = all.filter((e) => e.status === "draft");
  const rejected = all.filter((e) => e.status === "rejected");
  const closed = all.filter((e) => e.status === "closed");
  const deleted = all.filter((e) => e.status === "deleted");
  const other = all.filter(
    (e) =>
      !(
        e.status === "published" ||
        e.status === "pending_review" ||
        e.status === "draft" ||
        e.status === "rejected" ||
        e.status === "closed" ||
        e.status === "deleted"
      )
  );

  const columns: TableColumn[] = [
    { name: "uuid", title: "UUID" },
    { name: "title", title: "标题" },
    {
      name: "status",
      title: "状态",
      callback: (row: OfflineExhibition) => exhibitionStatusLabel(row.status),
    },
    {
      name: "owner",
      title: "创建者",
      callback: (row: OfflineExhibition) => row.owner?.nickname || row.user_uuid,
    },
    {
      name: "venue_name",
      title: "场地",
      callback: (row: OfflineExhibition) => row.venue_name || "—",
    },
    {
      name: "start_at",
      title: "开始时间",
      callback: (row: OfflineExhibition) =>
        row.start_at ? moment(row.start_at).format("YYYY-MM-DD HH:mm") : "—",
    },
    {
      name: "created_at",
      title: "创建时间",
      callback: (row: OfflineExhibition) =>
        row.created_at ? moment(row.created_at).format("YYYY-MM-DD HH:mm:ss") : "—",
    },
    {
      title: "前台",
      className: "text-right",
      callback: (row: OfflineExhibition) => (
        <Link
          href={`/${locale}/home/exhibition/${row.uuid}`}
          className="text-sm text-primary hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          查看
        </Link>
      ),
    },
  ];

  const groups = [
    { title: "已发布", data: published, empty_message: "暂无已发布展览" },
    { title: "待审核", data: pending, empty_message: "暂无待审核展览" },
    { title: "草稿", data: draft, empty_message: "暂无草稿" },
    { title: "已驳回", data: rejected, empty_message: "暂无已驳回" },
    { title: "已关闭", data: closed, empty_message: "暂无已关闭" },
    { title: "已删除", data: deleted, empty_message: "暂无已删除" },
    ...(other.length
      ? [{ title: "其他", data: other, empty_message: "暂无" as string }]
      : []),
  ];

  const table: TableSlotType = {
    title: "展览管理",
    description: `线下展览（共 ${all.length} 场）`,
    columns,
    empty_message: "暂无展览",
    groups,
  };

  return <TableSlot {...table} />;
}
