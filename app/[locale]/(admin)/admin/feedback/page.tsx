import Header from "@/components/dashboard/header";
import { AdminFeedbackManager } from "@/components/admin/admin-feedback-manager";
import { listFeedbackItemsForAdmin } from "@/models/feedback";

export default async function AdminFeedbackPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const feedbackItems = await listFeedbackItemsForAdmin(200);

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
              title: "反馈管理",
              is_active: true,
            },
          ],
        }}
      />

      <div className="w-full px-4 py-8 md:px-8">
        <div className="mb-8 space-y-2">
          <h1 className="text-2xl font-medium">反馈管理</h1>
          <p className="text-sm text-muted-foreground">
            查看 AI 聊天反馈，完成分级、处理、备注和关闭，全程在当前页操作。
          </p>
        </div>

        <AdminFeedbackManager initialItems={feedbackItems} />
      </div>
    </>
  );
}
