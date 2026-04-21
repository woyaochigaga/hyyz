import { listHomePostsForAdmin } from "@/models/home-post";
import { AdminHomePostsManager } from "@/components/admin/posts/admin-home-posts-manager";

export default async function AdminCommunityPostsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const posts = await listHomePostsForAdmin();
  return <AdminHomePostsManager locale={locale} initialPosts={posts} />;
}
