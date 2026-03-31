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
      title: "杭艺云展",
      logo: {
        src: "/logo.png",
        alt: "杭艺云展",
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
          title: "云展首页",
          url: "/home/world",
          target: "_self",
          icon: "RiHomeLine",
        },
        {
          title: "云展大厅",
          url: "/home/world",
          target: "_self",
          icon: "RiGalleryLine",
        },
        {
          title: "AI 提问",
          url: "/home/ai-chat",
          target: "_self",
          icon: "RiRobot2Line",
        },
      ],
    },
  };

  return <DashboardLayout sidebar={sidebar}>{children}</DashboardLayout>;
}
