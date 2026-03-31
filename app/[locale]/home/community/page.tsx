import { HomePostFeedView } from "@/components/home/post-feed-view";

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

export default function WorldPage({
  params,
}: {
  params: { locale: string };
}) {
  return <HomePostFeedView locale={params.locale} />;
}
