import Header from "@/components/dashboard/header";
import { AdminNotificationsManager } from "@/components/admin/admin-notifications-manager";
import { listNotificationEventsForAdmin } from "@/models/notification";

export default async function AdminNotificationsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const notifications = await listNotificationEventsForAdmin(200);

  return (
    <>
      <Header
        crumb={{
          items: [
            {
              title: "后台管理",
              url: `/${locale}/admin`,
            },
            {
              title: "消息中心",
              is_active: true,
            },
          ],
        }}
      />

      <div className="w-full px-4 py-8 md:px-8">
        <div className="mb-8 space-y-2">
          <h1 className="text-2xl font-medium">消息中心</h1>
          <p className="text-sm text-muted-foreground">
            创建、查看、延期、提权和清理消息，全部在当前页完成。
          </p>
        </div>

        <AdminNotificationsManager locale={locale} initialNotifications={notifications} />
      </div>
    </>
  );
}
