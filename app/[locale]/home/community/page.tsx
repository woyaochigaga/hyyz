import { HomePostFeedView } from "@/components/home/post-feed-view";
import { listPublicHomePostsCached } from "@/models/home-post";

export const revalidate = 60;

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}`;

  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}`;
  }

  return {
    alternates: {
      canonical: `${canonicalUrl}/home/world`,
    },
  };
}

export default async function WorldPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const posts = await listPublicHomePostsCached(locale, 18);

  return <HomePostFeedView locale={locale} initialPosts={posts} />;
}
