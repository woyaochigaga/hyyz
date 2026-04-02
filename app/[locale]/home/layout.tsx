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
      { title: "首页", url: "/home", icon: "home" },
      { title: "杭艺社区", url: "/home/community", icon: "users" },
      { title: "杭艺论坛", url: "/home/forum", icon: "message-square" },
      { title: "线下展览", url: "/home/exhibition", icon: "map-pinned" },
      { title: "小云AI", url: "/home/ai-chat", icon: "bot-message-square" },
      { title: "杭艺云创", url: "/home/post", icon: "pen-square" },
    ],
  };

  return (
    <HomeLayout header={page.header} rails={rails} locale={locale}>
      {children}
    </HomeLayout>
  );
}
