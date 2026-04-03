import { HomePageView } from "@/components/home/home-page-view";
import { listHomePosts } from "@/models/home-post";
import { listOfflineExhibitions } from "@/models/offline-exhibition";
import { getUserUuid } from "@/services/user";

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
      canonical: canonicalUrl,
    },
  };
}

export default function LandingPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return <HomePageData locale={locale} />;
}

async function HomePageData({ locale }: { locale: string }) {
  const currentUserUuid = await getUserUuid();
  const [posts, exhibitions] = await Promise.all([
    listHomePosts({
      currentUserUuid,
      locale,
    }),
    listOfflineExhibitions({
      currentUserUuid,
      locale,
      status: "published",
      limit: 3,
    }),
  ]);

  return (
    <HomePageView
      locale={locale}
      featuredPosts={posts.slice(0, 6)}
      upcomingExhibitions={exhibitions.slice(0, 3)}
    />
  );
}
