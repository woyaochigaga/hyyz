import { notFound } from "next/navigation";
import { ForumBarView } from "@/components/forum/bar-view";
import { findForumBarById, listForumPostsByBarId } from "@/models/forum";
import { getUserUuid } from "@/services/user";

export const dynamic = "force-dynamic";

export default async function ForumBarPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const currentUserUuid = await getUserUuid();
  const [bar, posts] = await Promise.all([
    findForumBarById(params.id, currentUserUuid),
    listForumPostsByBarId(params.id, currentUserUuid, 50),
  ]);

  if (!bar) {
    notFound();
  }

  return (
    <ForumBarView
      locale={params.locale}
      initialBar={bar}
      initialPosts={posts}
    />
  );
}
