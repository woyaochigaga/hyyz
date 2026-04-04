import { HomePageView } from "@/components/home/home-page-view";

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

export default function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return <HomePageView locale={locale} />;
}
