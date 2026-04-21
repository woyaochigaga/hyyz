import Link from "next/link";
import { TableColumn } from "@/types/blocks/table";
import TableSlot from "@/components/dashboard/slots/table";
import { Table as TableSlotType } from "@/types/slots/table";
import { getForumExcerpt, listForumPostsForAdmin } from "@/models/forum";
import type { ForumPost } from "@/types/forum";
import moment from "moment";

export default async function AdminForumPostsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const posts = await listForumPostsForAdmin();

  const columns: TableColumn[] = [
    { name: "id", title: "帖子 ID" },
    {
      name: "title",
      title: "标题",
      callback: (row: ForumPost) => row.title || getForumExcerpt(row.content, 48) || "—",
    },
    {
      name: "bar",
      title: "所属吧",
      callback: (row: ForumPost) => row.bar?.name || row.bar_id,
    },
    {
      name: "author",
      title: "作者",
      callback: (row: ForumPost) => row.author?.nickname || row.author_id,
    },
    { name: "reply_count", title: "回复" },
    { name: "like_count", title: "点赞" },
    {
      name: "created_at",
      title: "创建时间",
      callback: (row: ForumPost) =>
        row.created_at ? moment(row.created_at).format("YYYY-MM-DD HH:mm:ss") : "—",
    },
    {
      title: "前台",
      className: "text-right",
      callback: (row: ForumPost) => (
        <Link
          href={`/${locale}/home/forum/post/${encodeURIComponent(row.id)}`}
          className="text-sm text-primary hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          查看
        </Link>
      ),
    },
  ];

  const table: TableSlotType = {
    title: "论坛管理",
    description: `杭艺论坛（共 ${posts.length} 条帖子）`,
    columns,
    empty_message: "暂无论坛帖子",
    groups: [{ title: "全部论坛帖子", data: posts, empty_message: "暂无论坛帖子" }],
  };

  return <TableSlot {...table} />;
}
