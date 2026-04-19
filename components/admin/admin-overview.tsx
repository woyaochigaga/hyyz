import Link from "next/link";
import moment from "moment";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPaiedOrders } from "@/models/order";
import { getAllPosts } from "@/models/post";
import { getAllUsers } from "@/models/user";
import { listForumPostsForAdmin } from "@/models/forum";
import { listHomePostsForAdmin } from "@/models/home-post";
import { listOfflineExhibitionsForAdmin } from "@/models/offline-exhibition";
import type { User } from "@/types/user";
import type { HomePost } from "@/types/home-post";
import type { OfflineExhibition } from "@/types/offline-exhibition";

function formatTime(value?: string) {
  if (!value) return "—";
  return moment(value).format("YYYY-MM-DD HH:mm");
}

function getAnnouncementStatusText(status?: string) {
  switch (status) {
    case "online":
      return "已上线";
    case "offline":
      return "已下线";
    case "deleted":
      return "已删除";
    case "created":
    default:
      return "草稿";
  }
}

function getHomePostStatusText(status?: HomePost["status"]) {
  if (status === "published") return "已发布";
  if (status === "draft") return "草稿";
  if (status === "deleted") return "已删除";
  return "其他";
}

function getExhibitionStatusText(status?: OfflineExhibition["status"]) {
  switch (status) {
    case "published":
      return "已发布";
    case "pending_review":
      return "待审核";
    case "draft":
      return "草稿";
    case "rejected":
      return "已驳回";
    case "closed":
      return "已关闭";
    case "deleted":
      return "已删除";
    default:
      return "其他";
  }
}

function getUserRoleText(role?: User["role"]) {
  if (role === "admin") return "管理员";
  if (role === "artisan") return "匠人";
  return "普通用户";
}

function buildAdminHref(locale: string, path: string) {
  return `/${locale}/admin${path}`;
}

function buildPublicHref(locale: string, path: string) {
  return `/${locale}${path}`;
}

function MetricCard({
  title,
  value,
  description,
  href,
}: {
  title: string;
  value: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href} className="block">
      <Card className="h-full transition-colors hover:border-primary/40">
        <CardHeader className="space-y-3">
          <CardDescription>{title}</CardDescription>
          <CardTitle className="text-3xl font-semibold">{value}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function ShortcutCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href} className="block">
      <Card className="h-full transition-colors hover:border-primary/40">
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}

function RecentListCard({
  title,
  description,
  emptyMessage,
  children,
}: {
  title: string;
  description: string;
  emptyMessage: string;
  children: React.ReactNode;
}) {
  const content = Array.isArray(children) ? children.filter(Boolean) : children;
  const hasContent = Array.isArray(content) ? content.length > 0 : Boolean(content);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {hasContent ? (
          content
        ) : (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        )}
      </CardContent>
    </Card>
  );
}

export async function AdminOverview({
  locale,
  title,
  description,
}: {
  locale: string;
  title: string;
  description: string;
}) {
  const [users, homePosts, forumPosts, exhibitions, announcements, paidOrders] =
    await Promise.all([
      getAllUsers(),
      listHomePostsForAdmin(),
      listForumPostsForAdmin(),
      listOfflineExhibitionsForAdmin(),
      getAllPosts(1, 200),
      getPaiedOrders(1, 200),
    ]);

  const allUsers = users || [];
  const allHomePosts = homePosts || [];
  const allForumPosts = forumPosts || [];
  const allExhibitions = exhibitions || [];
  const allAnnouncements = announcements || [];
  const allPaidOrders = paidOrders || [];

  const adminCount = allUsers.filter((item) => item.role === "admin").length;
  const artisanCount = allUsers.filter((item) => item.role === "artisan").length;
  const pendingArtisanVerificationCount = allUsers.filter(
    (item) => item.artisan_shop_verification_status === "pending"
  ).length;
  const publishedHomePostCount = allHomePosts.filter((item) => item.status === "published").length;
  const draftHomePostCount = allHomePosts.filter((item) => item.status === "draft").length;
  const deletedHomePostCount = allHomePosts.filter((item) => item.status === "deleted").length;
  const pendingExhibitionCount = allExhibitions.filter(
    (item) => item.status === "pending_review"
  ).length;
  const publishedExhibitionCount = allExhibitions.filter(
    (item) => item.status === "published"
  ).length;
  const onlineAnnouncementCount = allAnnouncements.filter(
    (item) => item.status === "online"
  ).length;
  const draftAnnouncementCount = allAnnouncements.filter(
    (item) => !item.status || item.status === "created"
  ).length;
  const totalOrderAmount = allPaidOrders.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const latestUsers = allUsers.slice(0, 5);
  const latestHomePosts = allHomePosts.slice(0, 5);
  const latestExhibitions = allExhibitions.slice(0, 5);
  const latestAnnouncements = allAnnouncements.slice(0, 5);

  return (
    <>
      <div className="w-full px-4 py-8 md:px-8">
        <div className="mb-8 space-y-2">
          <h1 className="text-2xl font-medium">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            title="用户"
            value={String(allUsers.length)}
            description={`管理员 ${adminCount}，匠人 ${artisanCount}，普通用户 ${allUsers.length - adminCount - artisanCount}`}
            href={buildAdminHref(locale, "/users")}
          />
          <MetricCard
            title="店铺认证"
            value={String(pendingArtisanVerificationCount)}
            description="待审核的淘宝店铺认证记录"
            href={buildAdminHref(locale, "/artisan-verifications")}
          />
          <MetricCard
            title="社区帖子"
            value={String(allHomePosts.length)}
            description={`已发布 ${publishedHomePostCount}，草稿 ${draftHomePostCount}，已删除 ${deletedHomePostCount}`}
            href={buildAdminHref(locale, "/community-posts")}
          />
          <MetricCard
            title="论坛帖子"
            value={String(allForumPosts.length)}
            description="查看论坛发帖、作者和所属吧"
            href={buildAdminHref(locale, "/forum-posts")}
          />
          <MetricCard
            title="线下展览"
            value={String(allExhibitions.length)}
            description={`待审核 ${pendingExhibitionCount}，已发布 ${publishedExhibitionCount}`}
            href={buildAdminHref(locale, "/offline-exhibitions")}
          />
          <MetricCard
            title="公告"
            value={String(allAnnouncements.length)}
            description={`已上线 ${onlineAnnouncementCount}，草稿 ${draftAnnouncementCount}`}
            href={buildAdminHref(locale, "/announcement")}
          />
          <MetricCard
            title="已支付订单"
            value={String(allPaidOrders.length)}
            description={`累计金额 ${totalOrderAmount.toFixed(2)}`}
            href={buildAdminHref(locale, "/paid-orders")}
          />
        </div>

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium">快捷入口</h2>
            <Link
              href={buildPublicHref(locale, "/home")}
              className="text-sm text-primary hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              打开前台首页
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <ShortcutCard
              title="云展内容总览"
              description="查看社区、论坛、线下展览、公告和订单的整体情况。"
              href={buildAdminHref(locale, "/cloud-exhibition")}
            />
            <ShortcutCard
              title="用户管理"
              description="按管理员、匠人、普通用户分组查看并处理账号。"
              href={buildAdminHref(locale, "/users")}
            />
            <ShortcutCard
              title="店铺认证审核"
              description="审核匠人提交的淘宝店铺资料与证明材料。"
              href={buildAdminHref(locale, "/artisan-verifications")}
            />
            <ShortcutCard
              title="社区帖子"
              description="处理已发布、草稿、已删除的杭艺社区内容。"
              href={buildAdminHref(locale, "/community-posts")}
            />
            <ShortcutCard
              title="论坛帖子"
              description="查看论坛发帖、所属吧和互动数据。"
              href={buildAdminHref(locale, "/forum-posts")}
            />
            <ShortcutCard
              title="线下展览"
              description="查看待审核展览、发布状态和场地信息。"
              href={buildAdminHref(locale, "/offline-exhibitions")}
            />
            <ShortcutCard
              title="公告管理"
              description="维护公告内容并跳转到创建、编辑和前台页面。"
              href={buildAdminHref(locale, "/announcement")}
            />
          </div>
        </section>

        <section className="mt-8 grid gap-4 xl:grid-cols-2">
          <RecentListCard
            title="最新用户"
            description="按创建时间倒序显示最近注册账号。"
            emptyMessage="暂无用户"
          >
            {latestUsers.map((item) => (
              <div
                key={item.uuid || item.email}
                className="flex items-start justify-between gap-4 rounded-lg border border-border/60 p-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">
                    {item.nickname || item.email || item.uuid || "未命名用户"}
                  </div>
                  <div className="mt-1 truncate text-xs text-muted-foreground">
                    {item.email || item.uuid || "—"}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-xs text-foreground">{getUserRoleText(item.role)}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {formatTime(item.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </RecentListCard>

          <RecentListCard
            title="最新社区帖子"
            description="查看最近创建的杭艺社区内容。"
            emptyMessage="暂无社区帖子"
          >
            {latestHomePosts.map((item) => (
              <div
                key={item.uuid}
                className="flex items-start justify-between gap-4 rounded-lg border border-border/60 p-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">
                    {item.title || item.excerpt || item.uuid}
                  </div>
                  <div className="mt-1 truncate text-xs text-muted-foreground">
                    {item.author?.nickname || item.user_uuid}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-xs text-foreground">
                    {getHomePostStatusText(item.status)}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {formatTime(item.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </RecentListCard>

          <RecentListCard
            title="最新线下展览"
            description="查看最近进入后台列表的展览项目。"
            emptyMessage="暂无线下展览"
          >
            {latestExhibitions.map((item) => (
              <div
                key={item.uuid}
                className="flex items-start justify-between gap-4 rounded-lg border border-border/60 p-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{item.title || item.uuid}</div>
                  <div className="mt-1 truncate text-xs text-muted-foreground">
                    {item.venue_name || item.formatted_address || item.owner?.nickname || "—"}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-xs text-foreground">
                    {getExhibitionStatusText(item.status)}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {formatTime(item.start_at || item.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </RecentListCard>

          <RecentListCard
            title="最新公告"
            description="查看最近创建或更新的公告内容。"
            emptyMessage="暂无公告"
          >
            {latestAnnouncements.map((item) => {
              const announcementLocale = item.locale || locale;
              const slug = item.slug ? encodeURIComponent(item.slug) : "";
              const publicHref = slug
                ? buildPublicHref(announcementLocale, `/posts/${slug}`)
                : buildAdminHref(locale, "/announcement");

              return (
                <div
                  key={item.uuid || `${item.locale}-${item.slug}`}
                  className="flex items-start justify-between gap-4 rounded-lg border border-border/60 p-3"
                >
                  <div className="min-w-0">
                    <Link
                      href={publicHref}
                      className="truncate text-sm font-medium hover:text-primary"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {item.title || item.slug || item.uuid || "未命名公告"}
                    </Link>
                    <div className="mt-1 truncate text-xs text-muted-foreground">
                      {item.locale || "zh"}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-xs text-foreground">
                      {getAnnouncementStatusText(item.status)}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {formatTime(item.updated_at || item.created_at)}
                    </div>
                  </div>
                </div>
              );
            })}
          </RecentListCard>
        </section>
      </div>
    </>
  );
}
