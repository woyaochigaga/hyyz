import Link from "next/link";
import { TableColumn } from "@/types/blocks/table";
import TableSlot from "@/components/dashboard/slots/table";
import { Table as TableSlotType } from "@/types/slots/table";
import { listHomePostsForAdmin } from "@/models/home-post";
import type { HomePost, HomePostStatus, HomePostType } from "@/types/home-post";
import moment from "moment";
import { getHomePostExcerpt } from "@/lib/home-post-content";
import { HomePostActions } from "@/components/admin/posts/home-post-actions";

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

export default async function AdminCommunityPostsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const posts = await listHomePostsForAdmin();
  const published = posts.filter((p) => p.status === "published");
  const drafts = posts.filter((p) => p.status === "draft");
  const deleted = posts.filter((p) => p.status === "deleted");
  const other = posts.filter(
    (p) => p.status !== "published" && p.status !== "draft" && p.status !== "deleted"
  );

  const columns: TableColumn[] = [
    { name: "uuid", title: "UUID" },
    {
      name: "title",
      title: "标题",
      callback: (row: HomePost) => row.title || getHomePostExcerpt(row.content, 40) || "—",
    },
    {
      name: "type",
      title: "类型",
      callback: (row: HomePost) => typeLabel(row.type),
    },
    {
      name: "status",
      title: "状态",
      callback: (row: HomePost) => statusLabel(row.status),
    },
    {
      name: "author",
      title: "作者",
      callback: (row: HomePost) => row.author?.nickname || row.user_uuid || "—",
    },
    { name: "like_count", title: "点赞" },
    { name: "comment_count", title: "评论" },
    {
      name: "created_at",
      title: "创建时间",
      callback: (row: HomePost) =>
        row.created_at ? moment(row.created_at).format("YYYY-MM-DD HH:mm:ss") : "—",
    },
    {
      title: "前台",
      className: "text-center",
      callback: (row: HomePost) => (
        <Link
          href={`/${locale}/home/post/${row.uuid}`}
          className="text-sm text-primary hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          查看
        </Link>
      ),
    },
    {
      title: "操作",
      className: "text-right",
      callback: (row: HomePost) => <HomePostActions post={row} />,
    },
  ];

  const groupDefs: { title: string; data: HomePost[]; empty_message: string }[] = [
    { title: "已发布", data: published, empty_message: "暂无已发布帖子" },
    { title: "草稿", data: drafts, empty_message: "暂无草稿" },
    { title: "已删除", data: deleted, empty_message: "暂无已删除帖子" },
  ];
  if (other.length > 0) {
    groupDefs.push({ title: "其他状态", data: other, empty_message: "暂无" });
  }

  const table: TableSlotType = {
    title: "帖子管理",
    description: `杭艺社区（共 ${posts.length} 条：已发布 ${published.length}、草稿 ${drafts.length}、已删除 ${deleted.length}${other.length ? `、其他 ${other.length}` : ""}）`,
    columns,
    empty_message: "暂无社区帖子",
    groups: groupDefs,
  };

  return <TableSlot {...table} />;
}
