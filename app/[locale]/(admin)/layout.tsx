import DashboardLayout from "@/components/dashboard/layout";
import Empty from "@/components/blocks/empty";
import { ReactNode } from "react";
import { Sidebar } from "@/types/blocks/sidebar";
import { getUserInfo } from "@/services/user";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const userInfo = await getUserInfo();
  if (!userInfo || !userInfo.email) {
    redirect("/auth/signin");
  }

  const adminEmails = process.env.ADMIN_EMAILS?.split(",");
  if (!adminEmails?.includes(userInfo?.email)) {
    return <Empty message="无权限访问后台" />;
  }

  const sidebar: Sidebar = {
    brand: {
      title: "hyyz",
      logo: {
        src: "/logo.png",
        alt: "hyyz",
      },
      url: "/admin",
    },
    nav: {
      items: [
        {
          title: "用户管理",
          url: "/admin/users",
          icon: "RiUserLine",
        },
        {
          title: "订单管理",
          icon: "RiOrderPlayLine",
          is_expand: true,
          children: [
            {
              title: "已支付订单",
              url: "/admin/paid-orders",
            },
          ],
        },
        {
          title: "文章管理",
          url: "/admin/posts",
          icon: "RiArticleLine",
        },
      ],
    },
    social: {
      items: [
        {
          title: "前台首页",
          url: "/",
          target: "_blank",
          icon: "RiHomeLine",
        },
        {
          title: "Github",
          url: "https://github.com/shipanyai/shipany-template-one",
          target: "_blank",
          icon: "RiGithubLine",
        },
        {
          title: "Discord",
          url: "https://discord.gg/HQNnrzjZQS",
          target: "_blank",
          icon: "RiDiscordLine",
        },
        {
          title: "X",
          url: "https://x.com/shipanyai",
          target: "_blank",
          icon: "RiTwitterLine",
        },
      ],
    },
  };

  return <DashboardLayout sidebar={sidebar}>{children}</DashboardLayout>;
}
