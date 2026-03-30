import Dropdown from "@/components/blocks/table/dropdown";
import { NavItem } from "@/types/blocks/base";
import { Post } from "@/types/post";
import TableSlot from "@/components/dashboard/slots/table";
import { Table as TableSlotType } from "@/types/slots/table";
import { getAllPosts } from "@/models/post";
import moment from "moment";

function getStatusText(status?: string) {
  switch (status) {
    case "online":
      return "已上线";
    case "offline":
      return "已下线";
    case "deleted":
      return "已删除";
    case "created":
    default:
      return "草稿";
  }
}

export default async function ({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const posts = await getAllPosts();

  const table: TableSlotType = {
    title: "文章管理",
    toolbar: {
      items: [
        {
          title: "新增文章",
          icon: "RiAddLine",
          url: `/${locale}/admin/posts/add`,
        },
      ],
    },
    columns: [
      {
        name: "title",
        title: "标题",
      },
      {
        name: "description",
        title: "描述",
      },
      {
        name: "slug",
        title: "别名",
      },
      {
        name: "locale",
        title: "语言",
      },
      {
        name: "status",
        title: "状态",
        callback: (item: Post) => getStatusText(item.status),
      },
      {
        name: "video_url",
        title: "视频",
        callback: (item: Post) => (item.video_url ? "已上传" : "无"),
      },
      {
        name: "created_at",
        title: "创建时间",
        callback: (item: Post) => {
          return moment(item.created_at).format("YYYY-MM-DD HH:mm:ss");
        },
      },
      {
        callback: (item: Post) => {
          const locale = item.locale || "zh";
          const slug = item.slug || "";

          const items: NavItem[] = [
            {
              title: "编辑",
              icon: "RiEditLine",
              url: `/${locale}/admin/posts/${item.uuid}/edit`,
            },
            {
              title: "查看",
              icon: "RiEyeLine",
              url: `/${locale}/posts/${encodeURIComponent(slug)}`,
              target: "_self",
            },
          ];

          return <Dropdown items={items} />;
        },
      },
    ],
    data: posts,
    empty_message: "暂无文章",
  };

  return <TableSlot {...table} />;
}
