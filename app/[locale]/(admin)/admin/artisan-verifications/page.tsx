import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArtisanShopReviewActions } from "@/components/admin/users/artisan-shop-review-actions";
import {
  getArtisanShopVerificationStatusLabel,
  normalizeArtisanShopVerificationStatus,
} from "@/lib/artisan-shop";
import { getAllUsers } from "@/models/user";

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "approved":
      return "bg-emerald-600 text-white";
    case "pending":
      return "bg-amber-500 text-white";
    case "rejected":
      return "bg-red-600 text-white";
    case "expired":
      return "bg-zinc-700 text-white";
    default:
      return "bg-zinc-900 text-white";
  }
}

export default async function AdminArtisanVerificationsPage({
  params,
}: {
  params: { locale: string };
}) {
  const users = await getAllUsers();
  const records = (users || [])
    .filter(
      (item) =>
        item.role === "artisan" &&
        normalizeArtisanShopVerificationStatus(
          item.artisan_shop_verification_status
        ) !== "none"
    )
    .sort((a, b) => {
      const aStatus = normalizeArtisanShopVerificationStatus(
        a.artisan_shop_verification_status
      );
      const bStatus = normalizeArtisanShopVerificationStatus(
        b.artisan_shop_verification_status
      );
      if (aStatus === "pending" && bStatus !== "pending") return -1;
      if (aStatus !== "pending" && bStatus === "pending") return 1;

      const aTime = new Date(
        a.artisan_shop_verification_submitted_at || a.updated_at || 0
      ).getTime();
      const bTime = new Date(
        b.artisan_shop_verification_submitted_at || b.updated_at || 0
      ).getTime();
      return bTime - aTime;
    });

  const pendingCount = records.filter(
    (item) =>
      normalizeArtisanShopVerificationStatus(
        item.artisan_shop_verification_status
      ) === "pending"
  ).length;

  return (
    <>
      <div className="space-y-6 px-4 py-8 md:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">淘宝店铺认证审核</h1>
            <p className="text-sm text-muted-foreground">
              共 {records.length} 条认证记录，其中待审核 {pendingCount} 条。
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/${params.locale}/admin/users`}>返回用户管理</Link>
          </Button>
        </div>

        {records.length > 0 ? (
          <div className="grid gap-4">
            {records.map((item) => {
              const status = normalizeArtisanShopVerificationStatus(
                item.artisan_shop_verification_status
              );

              return (
                <Card key={item.uuid}>
                  <CardHeader className="gap-3">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-lg">
                          {item.nickname || item.email || item.uuid}
                        </CardTitle>
                        <CardDescription>
                          {item.artisan_category || "未填写工匠类型"} /{" "}
                          {item.artisan_shop_name || "未填写店铺名"}
                        </CardDescription>
                      </div>
                      <Badge
                        className={`w-fit rounded-full px-3 py-1 ${getStatusBadgeClass(
                          status
                        )}`}
                      >
                        {getArtisanShopVerificationStatusLabel(status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <div className="text-xs text-zinc-500">邮箱</div>
                        <div className="mt-1 break-all text-sm font-medium">
                          {item.email || "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500">店主 / 经营者</div>
                        <div className="mt-1 text-sm font-medium">
                          {item.artisan_shop_owner_name || "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500">审核联系手机</div>
                        <div className="mt-1 text-sm font-medium">
                          {item.artisan_shop_contact_phone || "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500">提交时间</div>
                        <div className="mt-1 text-sm font-medium">
                          {formatDateTime(item.artisan_shop_verification_submitted_at)}
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-xs text-zinc-500">店铺链接</div>
                          {item.artisan_shop_url ? (
                            <Button asChild size="sm" variant="outline">
                              <Link
                                href={item.artisan_shop_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                打开店铺
                              </Link>
                            </Button>
                          ) : null}
                        </div>
                        <div className="mt-1 break-all text-sm font-medium">
                          {item.artisan_shop_url || "—"}
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <div className="text-xs text-zinc-500">审核备注</div>
                        <div className="mt-1 whitespace-pre-wrap text-sm font-medium">
                          {item.artisan_shop_verification_note || "暂无"}
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <div className="text-xs text-zinc-500">证明材料</div>
                        <div className="mt-2 grid gap-3 sm:grid-cols-3">
                          {[
                            {
                              label: "店铺首页截图",
                              url: item.artisan_shop_screenshot_url,
                            },
                            {
                              label: "归属证明",
                              url: item.artisan_shop_owner_proof_url,
                            },
                            {
                              label: "补充材料",
                              url: item.artisan_shop_supporting_proof_url,
                            },
                          ].map((proof) => (
                            <div
                              key={proof.label}
                              className="overflow-hidden rounded-xl border border-black/5 bg-white dark:border-white/10 dark:bg-white/[0.04]"
                            >
                              <div className="border-b border-black/5 px-3 py-2 text-xs text-zinc-500 dark:border-white/10">
                                {proof.label}
                              </div>
                              {proof.url ? (
                                <a
                                  href={proof.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block"
                                >
                                  <img
                                    src={proof.url}
                                    alt={proof.label}
                                    className="h-40 w-full object-cover"
                                  />
                                </a>
                              ) : (
                                <div className="flex h-40 items-center justify-center px-3 text-xs text-zinc-400">
                                  未上传
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-black/5 bg-zinc-50/80 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                      <div className="mb-3 text-sm font-medium text-zinc-900 dark:text-white">
                        审核操作
                      </div>
                      <div className="mb-4 space-y-2 text-xs leading-6 text-zinc-500">
                        <div>
                          最近审核时间：
                          {formatDateTime(item.artisan_shop_verification_reviewed_at)}
                        </div>
                        <div>
                          审核人：
                          {item.artisan_shop_verification_reviewer || "—"}
                        </div>
                      </div>
                      {item.uuid ? (
                        <ArtisanShopReviewActions
                          uuid={item.uuid}
                          initialNote={item.artisan_shop_verification_note}
                          status={status}
                        />
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">暂无认证记录</CardTitle>
              <CardDescription>
                当前还没有匠人提交淘宝店铺认证资料。
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </>
  );
}
