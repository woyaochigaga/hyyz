import moment from "moment";

import TableSlot from "@/components/dashboard/slots/table";
import { Table as TableSlotType } from "@/types/slots/table";
import { TableColumn } from "@/types/blocks/table";
import {
  describeNotificationAudience,
  describeNotificationCategory,
  describeNotificationType,
  listNotificationEventsForAdmin,
} from "@/models/notification";
import type { NotificationEvent } from "@/types/notification";

export default async function AdminNotificationsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const notifications = await listNotificationEventsForAdmin(100);

  const columns: TableColumn[] = [
    {
      name: "title",
      title: "标题",
    },
    {
      name: "category",
      title: "分类",
      callback: (row: NotificationEvent) => describeNotificationCategory(row.category),
    },
    {
      name: "type",
      title: "类型",
      callback: (row: NotificationEvent) => describeNotificationType(row.type),
    },
    {
      title: "发送范围",
      callback: (row: NotificationEvent) =>
        describeNotificationAudience(row.audience_type, row.audience_value),
    },
    {
      name: "action_url",
      title: "跳转",
      callback: (row: NotificationEvent) => row.action_url || "—",
    },
    {
      name: "created_at",
      title: "创建时间",
      callback: (row: NotificationEvent) =>
        row.created_at ? moment(row.created_at).format("YYYY-MM-DD HH:mm:ss") : "—",
    },
  ];

  const table: TableSlotType = {
    title: "消息中心",
    description: "管理全站系统消息，并查看自动生成的公告、互动和审核通知记录。",
    toolbar: {
      items: [
        {
          title: "发送消息",
          icon: "RiAddLine",
          url: `/${locale}/admin/notifications/add`,
        },
      ],
    },
    columns,
    data: notifications,
    empty_message: "暂无消息记录",
  };

  return <TableSlot {...table} />;
}
