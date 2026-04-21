import { findUserByUuid } from "@/models/user";
import { getUserUuid } from "@/services/user";
import { listHomePosts } from "@/models/home-post";
import { redirect } from "next/navigation";
import { MyPostsView } from "@/components/console/my-posts-view";

export default async function ({ params }: { params: { locale: string } }) {
  const locale = params.locale;
  const user_uuid = await getUserUuid();
  const callbackUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/my-posts`;

  if (!user_uuid) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  const user = await findUserByUuid(user_uuid);
  if (!user) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  const posts = await listHomePosts({
    currentUserUuid: user_uuid,
    user_uuid,
    includeDraft: true,
    includeDeleted: true,
  });

  return (
    <MyPostsView
      locale={locale}
      user={{
        nickname: user.nickname,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
      }}
      initialPosts={posts}
    />
  );
}
