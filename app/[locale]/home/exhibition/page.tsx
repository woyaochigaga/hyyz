import { OfflineExhibitionListView } from "@/components/home/offline-exhibition-list-view";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/home/exhibition`;

  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/home/exhibition`;
  }

  return {
    title: "线下展览",
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function LandingPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return (
    <OfflineExhibitionListView locale={locale} />
  );
}
