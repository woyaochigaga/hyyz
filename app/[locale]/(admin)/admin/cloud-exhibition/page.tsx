import {
  AdminCloudExhibitionDashboard,
  type CloudExhibitionDashboardData,
} from "@/components/admin/cloud-exhibition-dashboard";
import {
  getArtisanShopVerificationStatusLabel,
  normalizeArtisanShopVerificationStatus,
} from "@/lib/artisan-shop";
import { listForumPostsForAdmin } from "@/models/forum";
import { listHomePostsForAdmin } from "@/models/home-post";
import { listOfflineExhibitionsForAdmin } from "@/models/offline-exhibition";
import { getPaiedOrders } from "@/models/order";
import { getAllPosts } from "@/models/post";
import { getAllUsers } from "@/models/user";

const MONTH_WINDOW = 7;

type DatedRecord = {
  created_at?: string;
  updated_at?: string;
  published_at?: string;
  paid_at?: string;
};

function buildAdminHref(locale: string, path: string) {
  return `/${locale}/admin${path}`;
}

function getMonthKey(value?: string) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function getMonthBuckets() {
  const now = new Date();
  const buckets: Array<{ key: string; label: string }> = [];

  for (let offset = MONTH_WINDOW - 1; offset >= 0; offset -= 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
    buckets.push({
      key: `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`,
      label: `${date.getUTCMonth() + 1}月`,
    });
  }

  return buckets;
}

function countByMonth<T>(items: T[], getDate: (item: T) => string | undefined) {
  const counts = new Map<string, number>();

  for (const item of items) {
    const key = getMonthKey(getDate(item));
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return counts;
}

function sumByMonth<T>(items: T[], getDate: (item: T) => string | undefined, getValue: (item: T) => number) {
  const sums = new Map<string, number>();

  for (const item of items) {
    const key = getMonthKey(getDate(item));
    if (!key) continue;
    sums.set(key, (sums.get(key) || 0) + getValue(item));
  }

  return sums;
}

function buildMonthlySeries(map: Map<string, number>, buckets: Array<{ key: string; label: string }>) {
  return buckets.map((bucket) => map.get(bucket.key) || 0);
}

function getLatestTimestamp(groups: DatedRecord[][]) {
  let latest = 0;

  for (const items of groups) {
    for (const item of items) {
      const candidates = [item.updated_at, item.published_at, item.paid_at, item.created_at];

      for (const value of candidates) {
        if (!value) continue;
        const timestamp = new Date(value).getTime();
        if (!Number.isNaN(timestamp) && timestamp > latest) {
          latest = timestamp;
        }
      }
    }
  }

  return latest ? new Date(latest).toISOString() : undefined;
}

function percentage(part: number, total: number) {
  if (!total) return 0;
  return Number(((part / total) * 100).toFixed(1));
}

async function getDashboardData(locale: string): Promise<CloudExhibitionDashboardData> {
  const [users, homePosts, forumPosts, exhibitions, announcements, paidOrders] = await Promise.all([
    getAllUsers(),
    listHomePostsForAdmin(),
    listForumPostsForAdmin(),
    listOfflineExhibitionsForAdmin(),
    getAllPosts(1, 500),
    getPaiedOrders(1, 500),
  ]);

  const allUsers = users || [];
  const allHomePosts = homePosts || [];
  const allForumPosts = forumPosts || [];
  const allExhibitions = exhibitions || [];
  const allAnnouncements = announcements || [];
  const allPaidOrders = paidOrders || [];
  const monthBuckets = getMonthBuckets();
  const monthLabels = monthBuckets.map((item) => item.label);

  const userMonthly = buildMonthlySeries(
    countByMonth(allUsers, (item) => item.created_at),
    monthBuckets
  );
  const artisanMonthly = buildMonthlySeries(
    countByMonth(
      allUsers.filter((item) => item.role === "artisan"),
      (item) => item.created_at
    ),
    monthBuckets
  );
  const shopSubmissionMonthly = buildMonthlySeries(
    countByMonth(
      allUsers.filter(
        (item) =>
          normalizeArtisanShopVerificationStatus(item.artisan_shop_verification_status) !== "none"
      ),
      (item) => item.artisan_shop_verification_submitted_at || item.updated_at
    ),
    monthBuckets
  );
  const communityMonthly = buildMonthlySeries(
    countByMonth(allHomePosts, (item) => item.created_at),
    monthBuckets
  );
  const forumMonthly = buildMonthlySeries(
    countByMonth(allForumPosts, (item) => item.created_at),
    monthBuckets
  );
  const forumReplyMonthly = buildMonthlySeries(
    sumByMonth(
      allForumPosts,
      (item) => item.created_at,
      (item) => Number(item.reply_count || 0)
    ),
    monthBuckets
  );
  const exhibitionMonthly = buildMonthlySeries(
    countByMonth(allExhibitions, (item) => item.created_at),
    monthBuckets
  );
  const publishedExhibitionMonthly = buildMonthlySeries(
    countByMonth(
      allExhibitions.filter((item) => item.status === "published"),
      (item) => item.published_at || item.created_at
    ),
    monthBuckets
  );
  const announcementMonthly = buildMonthlySeries(
    countByMonth(allAnnouncements, (item) => item.created_at),
    monthBuckets
  );
  const onlineAnnouncementMonthly = buildMonthlySeries(
    countByMonth(
      allAnnouncements.filter((item) => item.status === "online"),
      (item) => item.updated_at || item.created_at
    ),
    monthBuckets
  );
  const orderMonthly = buildMonthlySeries(
    countByMonth(allPaidOrders, (item) => item.paid_at || item.created_at),
    monthBuckets
  );
  const revenueMonthly = buildMonthlySeries(
    sumByMonth(
      allPaidOrders,
      (item) => item.paid_at || item.created_at,
      (item) => Number(item.amount || 0)
    ),
    monthBuckets
  );

  const adminCount = allUsers.filter((item) => item.role === "admin").length;
  const artisanCount = allUsers.filter((item) => item.role === "artisan").length;
  const normalUserCount = allUsers.length - adminCount - artisanCount;
  const activeShopRecords = allUsers.filter(
    (item) => normalizeArtisanShopVerificationStatus(item.artisan_shop_verification_status) !== "none"
  );
  const shopPending = activeShopRecords.filter(
    (item) => normalizeArtisanShopVerificationStatus(item.artisan_shop_verification_status) === "pending"
  ).length;
  const shopApproved = activeShopRecords.filter(
    (item) => normalizeArtisanShopVerificationStatus(item.artisan_shop_verification_status) === "approved"
  ).length;
  const shopRejected = activeShopRecords.filter(
    (item) => normalizeArtisanShopVerificationStatus(item.artisan_shop_verification_status) === "rejected"
  ).length;
  const publishedHomePosts = allHomePosts.filter((item) => item.status === "published").length;
  const draftHomePosts = allHomePosts.filter((item) => item.status === "draft").length;
  const deletedHomePosts = allHomePosts.filter((item) => item.status === "deleted").length;
  const totalHomeInteractions = allHomePosts.reduce(
    (sum, item) => sum + Number(item.like_count || 0) + Number(item.comment_count || 0),
    0
  );
  const totalForumInteractions = allForumPosts.reduce(
    (sum, item) => sum + Number(item.like_count || 0) + Number(item.reply_count || 0),
    0
  );
  const pendingExhibitions = allExhibitions.filter((item) => item.status === "pending_review").length;
  const publishedExhibitions = allExhibitions.filter((item) => item.status === "published").length;
  const closedExhibitions = allExhibitions.filter((item) => item.status === "closed").length;
  const onlineAnnouncements = allAnnouncements.filter((item) => item.status === "online").length;
  const draftAnnouncements = allAnnouncements.filter(
    (item) => !item.status || item.status === "created"
  ).length;
  const totalRevenue = allPaidOrders.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const averageOrderAmount = allPaidOrders.length ? totalRevenue / allPaidOrders.length : 0;
  const totalContent =
    allHomePosts.length + allForumPosts.length + allExhibitions.length + allAnnouncements.length;
  const publishedContent = publishedHomePosts + publishedExhibitions + onlineAnnouncements;
  const totalInteractions = totalHomeInteractions + totalForumInteractions;

  return {
    overview: {
      title: "云展模块化数据看板",
      summary:
        "按模块拆分查看用户、内容、审核和订单数据。",
      lastUpdatedAt: getLatestTimestamp([
        allUsers,
        allHomePosts,
        allForumPosts,
        allExhibitions,
        allAnnouncements,
        allPaidOrders,
      ]),
      highlights: [
        {
          label: "内容总量",
          value: totalContent,
          description: "全部内容总数",
        },
        {
          label: "已发布占比",
          value: percentage(publishedContent, totalContent),
          format: "percent",
          description: "已发布内容占比",
        },
        {
          label: "累计收入",
          value: totalRevenue,
          format: "currency",
          description: "已支付订单收入",
        },
        {
          label: "互动总量",
          value: totalInteractions,
          description: "点赞、评论、回复合计",
        },
      ],
    },
    modules: [
      {
        key: "users",
        title: "用户模块",
        description: "看用户规模和增长。",
        accent: "#2563eb",
        metrics: [
          {
            label: "用户总数",
            value: allUsers.length,
            description: "全部账号",
          },
          {
            label: "管理员",
            value: adminCount,
            description: "后台管理员",
          },
          {
            label: "匠人用户",
            value: artisanCount,
            description: "匠人账号",
          },
          {
            label: "普通用户",
            value: normalUserCount,
            description: "普通账号",
          },
        ],
        charts: [
          {
            kind: "line",
            payload: {
              title: "近 7 个月用户增长",
              description: "看新增用户和匠人。",
              labels: monthLabels,
              series: [
                { name: "新增用户", data: userMonthly, color: "#2563eb" },
                { name: "新增匠人", data: artisanMonthly, color: "#0f766e" },
              ],
            },
          },
          {
            kind: "pie",
            payload: {
              title: "用户角色结构",
              description: "看角色占比。",
              colors: ["#2563eb", "#0f766e", "#f59e0b"],
              data: [
                { name: "管理员", value: adminCount },
                { name: "匠人", value: artisanCount },
                { name: "普通用户", value: normalUserCount },
              ],
            },
          },
        ],
        links: [
          { label: "用户管理", href: buildAdminHref(locale, "/users"), value: `${allUsers.length} 人` },
        ],
      },
      {
        key: "shops",
        title: "店铺模块",
        description: "看店铺认证进度。",
        accent: "#ea580c",
        metrics: [
          {
            label: "认证记录",
            value: activeShopRecords.length,
            description: "已提交认证",
          },
          {
            label: "待审核",
            value: shopPending,
            description: "等待处理",
          },
          {
            label: "已认证",
            value: shopApproved,
            description: "审核通过",
          },
          {
            label: "未通过",
            value: shopRejected,
            description: "审核驳回",
          },
        ],
        charts: [
          {
            kind: "line",
            payload: {
              title: "近 7 个月认证提交量",
              description: "看提交趋势。",
              labels: monthLabels,
              series: [{ name: "认证提交", data: shopSubmissionMonthly, color: "#ea580c" }],
            },
          },
          {
            kind: "pie",
            payload: {
              title: "认证状态分布",
              description: "看状态占比。",
              colors: ["#f59e0b", "#16a34a", "#dc2626", "#475569"],
              data: [
                { name: getArtisanShopVerificationStatusLabel("pending"), value: shopPending },
                { name: getArtisanShopVerificationStatusLabel("approved"), value: shopApproved },
                { name: getArtisanShopVerificationStatusLabel("rejected"), value: shopRejected },
                {
                  name: getArtisanShopVerificationStatusLabel("expired"),
                  value: activeShopRecords.filter(
                    (item) =>
                      normalizeArtisanShopVerificationStatus(item.artisan_shop_verification_status) ===
                      "expired"
                  ).length,
                },
              ],
            },
          },
        ],
        links: [
          {
            label: "店铺认证审核",
            href: buildAdminHref(locale, "/artisan-verifications"),
            value: `${shopPending} 待审`,
          },
        ],
      },
      {
        key: "community",
        title: "社区模块",
        description: "看社区内容和互动。",
        accent: "#0f766e",
        metrics: [
          {
            label: "帖子总数",
            value: allHomePosts.length,
            description: "全部帖子",
          },
          {
            label: "已发布",
            value: publishedHomePosts,
            description: "已上线内容",
          },
          {
            label: "草稿",
            value: draftHomePosts,
            description: "未发布内容",
          },
          {
            label: "互动总量",
            value: totalHomeInteractions,
            description: "点赞和评论",
          },
        ],
        charts: [
          {
            kind: "line",
            payload: {
              title: "近 7 个月社区新增",
              description: "看发帖趋势。",
              labels: monthLabels,
              series: [{ name: "社区帖子", data: communityMonthly, color: "#0f766e" }],
            },
          },
          {
            kind: "pie",
            payload: {
              title: "社区状态分布",
              description: "看内容状态。",
              colors: ["#16a34a", "#f59e0b", "#dc2626"],
              data: [
                { name: "已发布", value: publishedHomePosts },
                { name: "草稿", value: draftHomePosts },
                { name: "已删除", value: deletedHomePosts },
              ],
            },
          },
        ],
        links: [
          {
            label: "社区帖子",
            href: buildAdminHref(locale, "/community-posts"),
            value: `${publishedHomePosts} 已发布`,
          },
        ],
      },
      {
        key: "forum",
        title: "论坛模块",
        description: "看论坛活跃度。",
        accent: "#7c3aed",
        metrics: [
          {
            label: "帖子总数",
            value: allForumPosts.length,
            description: "全部主题帖",
          },
          {
            label: "回复总量",
            value: allForumPosts.reduce((sum, item) => sum + Number(item.reply_count || 0), 0),
            description: "累计回复",
          },
          {
            label: "点赞总量",
            value: allForumPosts.reduce((sum, item) => sum + Number(item.like_count || 0), 0),
            description: "累计点赞",
          },
          {
            label: "总互动",
            value: totalForumInteractions,
            description: "点赞和回复",
          },
        ],
        charts: [
          {
            kind: "line",
            payload: {
              title: "近 7 个月论坛活跃度",
              description: "看发帖和回复。",
              labels: monthLabels,
              series: [
                { name: "发帖数", data: forumMonthly, color: "#7c3aed" },
                { name: "回复量", data: forumReplyMonthly, color: "#2563eb" },
              ],
            },
          },
          {
            kind: "pie",
            payload: {
              title: "论坛互动结构",
              description: "看互动来源。",
              colors: ["#7c3aed", "#2563eb"],
              data: [
                {
                  name: "点赞",
                  value: allForumPosts.reduce((sum, item) => sum + Number(item.like_count || 0), 0),
                },
                {
                  name: "回复",
                  value: allForumPosts.reduce((sum, item) => sum + Number(item.reply_count || 0), 0),
                },
              ],
            },
          },
        ],
        links: [
          {
            label: "论坛帖子",
            href: buildAdminHref(locale, "/forum-posts"),
            value: `${allForumPosts.length} 帖`,
          },
        ],
      },
      {
        key: "exhibitions",
        title: "展览模块",
        description: "看展览供给和审核。",
        accent: "#0891b2",
        metrics: [
          {
            label: "展览总数",
            value: allExhibitions.length,
            description: "全部展览",
          },
          {
            label: "待审核",
            value: pendingExhibitions,
            description: "等待审核",
          },
          {
            label: "已发布",
            value: publishedExhibitions,
            description: "已上线展览",
          },
          {
            label: "已关闭",
            value: closedExhibitions,
            description: "已关闭展览",
          },
        ],
        charts: [
          {
            kind: "line",
            payload: {
              title: "近 7 个月展览新增与发布",
              description: "看新增和发布。",
              labels: monthLabels,
              series: [
                { name: "新增展览", data: exhibitionMonthly, color: "#0891b2" },
                { name: "发布展览", data: publishedExhibitionMonthly, color: "#16a34a" },
              ],
            },
          },
          {
            kind: "bar",
            payload: {
              title: "展览状态分布",
              description: "看状态分布。",
              labels: ["草稿", "待审核", "已发布", "已关闭", "已驳回", "已删除"],
              series: [
                {
                  name: "线下展览",
                  color: "#0891b2",
                  data: [
                    allExhibitions.filter((item) => item.status === "draft").length,
                    pendingExhibitions,
                    publishedExhibitions,
                    closedExhibitions,
                    allExhibitions.filter((item) => item.status === "rejected").length,
                    allExhibitions.filter((item) => item.status === "deleted").length,
                  ],
                },
              ],
            },
          },
        ],
        links: [
          {
            label: "线下展览",
            href: buildAdminHref(locale, "/offline-exhibitions"),
            value: `${pendingExhibitions} 待审`,
          },
        ],
      },
      {
        key: "announcements",
        title: "公告模块",
        description: "看公告状态和节奏。",
        accent: "#dc2626",
        metrics: [
          {
            label: "公告总数",
            value: allAnnouncements.length,
            description: "全部公告",
          },
          {
            label: "在线公告",
            value: onlineAnnouncements,
            description: "当前在线",
          },
          {
            label: "草稿公告",
            value: draftAnnouncements,
            description: "未发布公告",
          },
          {
            label: "上线率",
            value: percentage(onlineAnnouncements, allAnnouncements.length),
            format: "percent",
            description: "在线占比",
          },
        ],
        charts: [
          {
            kind: "line",
            payload: {
              title: "近 7 个月公告发布节奏",
              description: "看新增和在线。",
              labels: monthLabels,
              series: [
                { name: "新增公告", data: announcementMonthly, color: "#dc2626" },
                { name: "在线公告", data: onlineAnnouncementMonthly, color: "#f59e0b" },
              ],
            },
          },
          {
            kind: "pie",
            payload: {
              title: "公告状态占比",
              description: "看状态占比。",
              colors: ["#f59e0b", "#16a34a", "#64748b", "#dc2626"],
              data: [
                { name: "草稿", value: draftAnnouncements },
                { name: "在线", value: onlineAnnouncements },
                {
                  name: "下线",
                  value: allAnnouncements.filter((item) => item.status === "offline").length,
                },
                {
                  name: "删除",
                  value: allAnnouncements.filter((item) => item.status === "deleted").length,
                },
              ],
            },
          },
        ],
        links: [
          {
            label: "公告管理",
            href: buildAdminHref(locale, "/announcement"),
            value: `${onlineAnnouncements} 在线`,
          },
        ],
      },
      {
        key: "orders",
        title: "订单模块",
        description: "看支付和收入。",
        accent: "#ca8a04",
        metrics: [
          {
            label: "已支付订单",
            value: allPaidOrders.length,
            description: "支付成功订单",
          },
          {
            label: "累计收入",
            value: totalRevenue,
            format: "currency",
            description: "累计支付金额",
          },
          {
            label: "平均客单价",
            value: averageOrderAmount,
            format: "currency",
            description: "平均每单金额",
          },
          {
            label: "近月支付量",
            value: orderMonthly[orderMonthly.length - 1] || 0,
            description: "最近一个月支付",
          },
        ],
        charts: [
          {
            kind: "line",
            payload: {
              title: "近 7 个月订单与收入",
              description: "看订单和收入。",
              labels: monthLabels,
              series: [
                { name: "支付订单", data: orderMonthly, color: "#ca8a04" },
                { name: "订单收入", data: revenueMonthly, color: "#0f766e" },
              ],
            },
          },
          {
            kind: "pie",
            payload: {
              title: "订单产品结构",
              description: "看商品分布。",
              colors: ["#ca8a04", "#2563eb", "#0f766e", "#dc2626", "#7c3aed"],
              data: Object.entries(
                allPaidOrders.reduce<Record<string, number>>((acc, item) => {
                  const key = String(item.product_name || item.product_id || "未命名商品").trim();
                  acc[key] = (acc[key] || 0) + 1;
                  return acc;
                }, {})
              )
                .sort((left, right) => right[1] - left[1])
                .slice(0, 5)
                .map(([name, value]) => ({ name, value })),
            },
          },
        ],
        links: [
          {
            label: "支付订单",
            href: buildAdminHref(locale, "/paid-orders"),
            value: `${allPaidOrders.length} 笔`,
          },
        ],
      },
    ],
  };
}

export default async function AdminCloudExhibitionPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const data = await getDashboardData(locale);

  return (
    <>
      <div className="w-full px-4 py-8 md:px-8">
        <div className="mb-8 space-y-2">
          <h1 className="text-2xl font-medium">云展数据看板</h1>
          <p className="text-sm text-muted-foreground">
            按模块查看用户、内容、审核和订单数据。
          </p>
        </div>

        <AdminCloudExhibitionDashboard data={data} />
      </div>
    </>
  );
}
