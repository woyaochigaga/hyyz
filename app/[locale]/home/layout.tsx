import { ReactNode } from "react";
import { getLandingPage } from "@/services/page";
import HomeLayout from "@/components/home/layout";

export default async function DefaultLayout({
  children,
  params: { locale },
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  const page = await getLandingPage(locale);
  const rails = {
    leftNav: [
      { title: "云展首页", url: "/home" },
      { title: "线下展览", url: "/home/exhibition" },
      { title: "AI提问", url: "/home/ai-chat" },
    ] 
    
  };

  return (
    <HomeLayout header={page.header} rails={rails} locale={locale}>
      {children}
    </HomeLayout>
  );
}
