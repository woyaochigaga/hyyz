import DashboardLayout from "@/components/dashboard/layout";
import AdminBreadcrumbHeader from "@/components/dashboard/admin-breadcrumb-header";
import Empty from "@/components/blocks/empty";
import { ReactNode } from "react";
import { Sidebar } from "@/types/blocks/sidebar";
import { getUserInfo } from "@/services/user";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
  params: { locale },
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  const userInfo = await getUserInfo();
  if (!userInfo || !userInfo.email) {
    redirect("/auth/signin");
  }

  const adminEmails = process.env.ADMIN_EMAILS?.split(",");
  if (!adminEmails?.includes(userInfo?.email)) {
    return <Empty message="无权限访问后台" />;
  }

  const adminPath = (path: string) => `/${locale}/admin${path}`;
  const homePath = (path: string) => `/${locale}${path}`;

  const sidebar: Sidebar = {
    brand: {
      title: "杭艺云展",
      logo: {
        src: "/logo.png",
        alt: "杭艺云展",
      },
      url: adminPath(""),
    },
    nav: {
      items: [
        {
          title: "云展管理",
          url: adminPath("/cloud-exhibition"),
          icon: "RiGalleryLine",
        },
        {
          title: "用户管理",
          url: adminPath("/users"),
          icon: "RiUserLine",
        },
        {
          title: "店铺认证",
          url: adminPath("/artisan-verifications"),
          icon: "RiShieldCheckLine",
        },
        {
          title: "帖子管理",
          url: adminPath("/community-posts"),
          icon: "RiFileList3Line",
        },
        {
          title: "论坛管理",
          url: adminPath("/forum-posts"),
          icon: "RiChat3Line",
        },
        {
          title: "展览管理",
          url: adminPath("/offline-exhibitions"),
          icon: "RiMapPinLine",
        },
        {
          title: "订单管理",
          icon: "RiOrderPlayLine",
          is_expand: true,
          children: [
            {
              title: "已支付订单",
              url: adminPath("/paid-orders"),
            },
          ],
        },
        {
          title: "公告管理",
          url: adminPath("/announcement"),
          icon: "RiArticleLine",
        },
        {
          title: "消息中心",
          url: adminPath("/notifications"),
          icon: "RiNotification3Line",
        },
      ],
    },
    social: {
      items: [
        {
          title: "前台首页",
          url: homePath(""),
          target: "_blank",
          icon: "RiHomeLine",
        },
        {
          title: "云展首页",
          url: homePath("/home"),
          target: "_self",
          icon: "RiHomeLine",
        },
        {
          title: "云展大厅",
          url: homePath("/home/community"),
          target: "_self",
          icon: "RiGalleryLine",
        },
        {
          title: "AI 提问",
          url: homePath("/home/ai-chat"),
          target: "_self",
          icon: "RiRobot2Line",
        },
      ],
    },
  };

  return (
    <DashboardLayout sidebar={sidebar}>
      <AdminBreadcrumbHeader />
      {children}
    </DashboardLayout>
  );
}
