import Footer from "@/components/blocks/footer";
import HomeHeader from "@/components/blocks/home-header";
import { ReactNode } from "react";
import { getLandingPage } from "@/services/page";

export default async function DefaultLayout({
  children,
  params: { locale },
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  const page = await getLandingPage(locale);

  return (
    <>
      {page.header && <HomeHeader header={page.header} />}
      <main className="overflow-x-hidden">{children}</main>    
      
    </>
  );
}
