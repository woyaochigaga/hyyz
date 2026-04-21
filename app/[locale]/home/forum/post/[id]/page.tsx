import { notFound } from "next/navigation";
import { ForumPostDetailView } from "@/components/forum/post-detail-view";
import { getForumPostDetail } from "@/models/forum";
import { getUserUuid } from "@/services/user";

export const dynamic = "force-dynamic";

export default async function ForumPostPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const currentUserUuid = await getUserUuid();
  const detail = await getForumPostDetail(params.id, currentUserUuid);

  if (!detail) {
    notFound();
  }

  return (
    <ForumPostDetailView
      locale={params.locale}
      postId={params.id}
      initialDetail={detail}
    />
  );
}
