import { notFound } from "next/navigation";
import { PostDetailView } from "@/components/home/post-detail-view";
import { findHomePostByUuid } from "@/models/home-post";
import { getUserUuid } from "@/services/user";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: { locale: string; uuid: string };
}) {
  const currentUserUuid = await getUserUuid();
  const post = await findHomePostByUuid(params.uuid, currentUserUuid);

  if (!post || post.status === "deleted") {
    notFound();
  }

  if (post.status !== "published" && post.user_uuid !== currentUserUuid) {
    notFound();
  }

  return (
    <PostDetailView
      locale={params.locale}
      uuid={params.uuid}
      initialPost={post}
      initialCurrentUserUuid={currentUserUuid || null}
    />
  );
}
