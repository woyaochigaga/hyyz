import { PostCreateView } from "@/components/home/post-create-view";
import { listHomePosts } from "@/models/home-post";
import { getUserUuid } from "@/services/user";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: { locale: string } }) {
  const currentUserUuid = await getUserUuid();
  const initialPosts = currentUserUuid
    ? await listHomePosts({
        currentUserUuid,
        user_uuid: currentUserUuid,
        includeDraft: true,
      })
    : [];

  return <PostCreateView locale={params.locale} initialPosts={initialPosts} />;
}
