"use client";

import Header from "@/components/dashboard/header";
import type { Crumb, NavItem } from "@/types/blocks/base";
import { usePathname } from "next/navigation";

const ADMIN_ROUTE_TITLES: Record<string, string> = {
  "cloud-exhibition": "云展看板",
  users: "用户管理",
  "artisan-verifications": "店铺认证",
  "community-posts": "帖子管理",
  "forum-posts": "论坛管理",
  "offline-exhibitions": "展览管理",
  "paid-orders": "已支付订单",
  announcement: "公告管理",
  notifications: "消息中心",
};

function buildCrumb(pathname: string): Crumb | undefined {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length < 2 || parts[1] !== "admin") {
    return undefined;
  }

  const locale = parts[0];
  const adminSegments = parts.slice(2);
  const rootItem: NavItem = {
    title: "后台管理",
    url: `/${locale}/admin`,
    is_active: adminSegments.length === 0,
  };

  if (adminSegments.length === 0) {
    return { items: [rootItem] };
  }

  const route = adminSegments[0];
  const routeTitle = ADMIN_ROUTE_TITLES[route];
  if (!routeTitle) {
    return { items: [rootItem] };
  }

  const items: NavItem[] = [{ ...rootItem, is_active: false }];
  const routeItem: NavItem = {
    title: routeTitle,
    url: `/${locale}/admin/${route}`,
  };

  const nested = adminSegments.slice(1);
  if (nested.length === 0) {
    items.push({ ...routeItem, is_active: true });
    return { items };
  }

  items.push(routeItem);
  const nestedTitle = nested.includes("add")
    ? "新增"
    : nested.includes("edit")
      ? "编辑"
      : "详情";

  items.push({
    title: nestedTitle,
    is_active: true,
  });

  return { items };
}

export default function AdminBreadcrumbHeader() {
  const pathname = usePathname();
  const crumb = buildCrumb(pathname);

  return <Header crumb={crumb} />;
}
