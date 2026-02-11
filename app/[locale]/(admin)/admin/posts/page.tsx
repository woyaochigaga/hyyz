import Dropdown from "@/components/blocks/table/dropdown";
import { NavItem } from "@/types/blocks/base";
import { Post } from "@/types/post";
import TableSlot from "@/components/dashboard/slots/table";
import { Table as TableSlotType } from "@/types/slots/table";
import { getAllPosts } from "@/models/post";
import moment from "moment";

export default async function ({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const posts = await getAllPosts();

  const table: TableSlotType = {
    title: "Posts",
    toolbar: {
      items: [
        {
          title: "Add Post",
          icon: "RiAddLine",
          url: `/${locale}/admin/posts/add`,
        },
      ],
    },
    columns: [
      {
        name: "title",
        title: "Title",
      },
      {
        name: "description",
        title: "Description",
      },
      {
        name: "slug",
        title: "Slug",
      },
      {
        name: "locale",
        title: "Locale",
      },
      {
        name: "status",
        title: "Status",
      },
      {
        name: "created_at",
        title: "Created At",
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
              title: "Edit",
              icon: "RiEditLine",
              url: `/${locale}/admin/posts/${item.uuid}/edit`,
            },
            {
              title: "View",
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
    empty_message: "No posts found",
  };

  return <TableSlot {...table} />;
}
