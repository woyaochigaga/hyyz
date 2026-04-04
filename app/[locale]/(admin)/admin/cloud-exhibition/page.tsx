import { AdminOverview } from "@/components/admin/admin-overview";

export default function AdminCloudExhibitionPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return (
    <AdminOverview
      locale={locale}
      title="云展管理"
      description="集中查看社区帖子、论坛帖子、线下展览、公告和订单等内容运营数据。"
    />
  );
}
