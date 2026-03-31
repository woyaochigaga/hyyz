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
      { title: "首页", url: "/home" },
      { title: "杭艺论坛", url: "/home/forum" },
      { title: "杭艺社区", url: "/home/community" },
      { title: "线下展览", url: "/home/exhibition" },
      { title: "AI提问", url: "/home/ai-chat" },
      { title: "杭艺云创", url: "/home/post" },
    ],
  };

  return (
    <HomeLayout header={page.header} rails={rails} locale={locale}>
      {children}
    </HomeLayout>
  );
}
