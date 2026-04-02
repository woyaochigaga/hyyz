import ConsoleLayout from "@/components/console/layout";
import { ReactNode } from "react";
import { Sidebar } from "@/types/blocks/sidebar";
import { getTranslations } from "next-intl/server";
import { getUserInfo } from "@/services/user";
import { redirect } from "next/navigation";

export default async function ({ children }: { children: ReactNode }) {
  const userInfo = await getUserInfo();
  if (!userInfo || !userInfo.email) {
    redirect("/auth/signin");
  }

  const t = await getTranslations();

  const sidebar: Sidebar = {
    nav: {
      items: [
        {
          title: t("user.personal_center"),
          url: "/personal_center",
          icon: "RiOrderPlayLine",
          is_active: false,
        }, 
        {
          title: t("my_invites.title"),
          url: "/my-posts",
          icon: "RiImageLine",
          is_active: false,
        },
        {
          title: "线下展览申请",
          url: "/my-exhibitions",
          icon: "RiMapPinLine",
          is_active: false,
        },
        {
          title: t("my_credits.title"),
          url: "/my-credits",
          icon: "RiBankCardLine",
          is_active: false,
        },
        {
          title: t("api_keys.title"),
          url: "/api-keys",
          icon: "RiKey2Line",
          is_active: false,
        },
      ],
    },
  };

  return <ConsoleLayout sidebar={sidebar}>{children}</ConsoleLayout>;
}
