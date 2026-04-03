import Branding from "@/components/blocks/branding";
import Feature1 from "@/components/blocks/feature1";
import Feature2 from "@/components/blocks/feature2";
import Hero from "@/components/blocks/hero";
import { getLandingPage } from "@/services/page";
import CinematicStackedTransition from "@/components/blocks/cinematic-stacked-transition";
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

export default async function LandingPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const page = await getLandingPage(locale);

  return (
    <>
      {(page.hero || page.branding) && (
        <div className="min-h-[calc(100svh-3.5rem)] flex flex-col">
          {page.hero && (
            <Hero
              hero={page.hero}
              sectionClassName="flex-1 py-0 flex items-center"
            />
          )}
          {page.branding && (
            <Branding section={page.branding} sectionClassName="py-6" />
          )}
        </div>
      )}

      <CinematicStackedTransition locale={locale} />
{/* 
      {page.introduce && <Feature1 section={page.introduce} />}
      {page.benefit && <Feature2 section={page.benefit} />} */}
    </>
  );
}
