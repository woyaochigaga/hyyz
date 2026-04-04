import { ForumHomeView } from "@/components/forum/forum-home-view";
import { listForumBars, listForumFeed } from "@/models/forum";
import { getUserUuid } from "@/services/user";

export const dynamic = "force-dynamic";

export default async function ForumPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams?: { bar?: string; post?: string };
}) {
  const initialBarId = String(searchParams?.bar || "").trim();
  const initialPostId = String(searchParams?.post || "").trim();

  const currentUserUuid = await getUserUuid();
  const [feed, bars] = await Promise.all([
    listForumFeed({
      currentUserUuid,
      limit: 20,
    }),
    listForumBars({
      currentUserUuid,
      limit: 12,
    }),
  ]);

  return (
    <ForumHomeView
      locale={locale}
      initialBars={bars}
      initialPosts={feed.posts}
      followingBarIds={feed.following_bar_ids}
      initialBarId={initialBarId}
      initialPostId={initialPostId}
    />
  );
}
