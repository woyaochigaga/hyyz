"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  ExternalLink,
  LocateFixed,
  Mail,
  MapPin,
  Phone,
  Store,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { OfflineExhibition, OfflineExhibitionStatus } from "@/types/offline-exhibition";
import { OfflineExhibitionMapPreview } from "@/components/home/offline-exhibition-map-preview";

function formatDisplayDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatRange(start?: string, end?: string) {
  const startText = formatDisplayDate(start);
  const endText = formatDisplayDate(end);
  if (!startText && !endText) return "时间待定";
  return startText && endText ? `${startText} - ${endText}` : startText || endText;
}

function statusLabel(status?: OfflineExhibitionStatus) {
  switch (status) {
    case "pending_review":
      return "待审核";
    case "published":
      return "已发布";
    case "rejected":
      return "已驳回";
    case "closed":
      return "已结束";
    case "deleted":
      return "已删除";
    default:
      return "草稿";
  }
}

function statusTone(status?: OfflineExhibitionStatus) {
  switch (status) {
    case "published":
      return "border-[#c4ddd6] bg-[#edf8f4] text-[#24564b]";
    case "pending_review":
      return "border-[#e8d7b7] bg-[#fff7e8] text-[#946200]";
    case "rejected":
      return "border-[#efc6c6] bg-[#fff0f0] text-[#8a2d2d]";
    case "closed":
      return "border-[#d8dce1] bg-[#f3f5f7] text-[#52606d]";
    default:
      return "border-[#d8e4e0] bg-[#f3f8f6] text-[#506660]";
  }
}

function buildMapUrl(item: OfflineExhibition) {
  const name = encodeURIComponent(item.venue_name || item.title || "线下展览");
  const address = encodeURIComponent(item.formatted_address || item.address_detail || "");
  return `https://uri.amap.com/search?keyword=${name}%20${address}&src=hangyi&coordinate=gaode&callnative=0`;
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-[18px] bg-[#f7faf9] px-4 py-3 dark:bg-[#18211f]">
      <div className="mt-0.5 text-[#648078]">{icon}</div>
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-[0.18em] text-[#7b9089] dark:text-[#91a49d]">
          {label}
        </div>
        <div className="mt-1 text-sm leading-6 text-[#29413b] dark:text-[#d7e3de]">
          {value || "未填写"}
        </div>
      </div>
    </div>
  );
}

function PillList({ items }: { items?: string[] }) {
  if (!items || items.length === 0) return <div className="text-sm text-[#7b9089] dark:text-[#91a49d]">暂无</div>;

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full bg-[#edf4f1] px-3 py-1 text-xs text-[#516661] dark:bg-[#1b2623] dark:text-[#aec1bb]"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-[#d7e2de] bg-white/92 p-5 shadow-[0_18px_42px_rgba(30,44,40,0.05)] dark:border-[#31443e] dark:bg-[#111917]/92">
      <h2 className="text-lg font-semibold text-[#1f302c] dark:text-[#edf5f2]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function OfflineExhibitionDetailView({
  locale,
  uuid,
}: {
  locale: string;
  uuid: string;
}) {
  const [loading, setLoading] = React.useState(true);
  const [item, setItem] = React.useState<OfflineExhibition | null>(null);

  const loadDetail = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/home/exhibition/${uuid}`);
      const result = await response.json();
      if (result.code === 0) {
        setItem(result.data || null);
      } else {
        setItem(null);
        toast.error(result.message || "加载展览详情失败");
      }
    } catch {
      setItem(null);
      toast.error("加载展览详情失败");
    } finally {
      setLoading(false);
    }
  }, [uuid]);

  React.useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  if (loading) {
    return (
      <div className="h-[560px] animate-pulse rounded-[32px] bg-zinc-100 dark:bg-white/[0.04]" />
    );
  }

  if (!item) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[28px] border border-dashed border-zinc-200 bg-white/70 dark:border-white/10 dark:bg-white/[0.03]">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
          未找到线下展览
        </h1>
        <Link
          href={`/${locale}/home/exhibition`}
          className="mt-4 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
        >
          返回展览列表
        </Link>
      </div>
    );
  }

  const cover = item.cover_url || item.poster_url || item.gallery_images?.[0] || "";
  const heroStyle: React.CSSProperties | undefined = cover
    ? {
        backgroundImage: `linear-gradient(180deg, rgba(18,28,26,0.08), rgba(18,28,26,0.78)), url(${cover})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : undefined;

  return (
    <div className="flex min-h-full w-full min-w-0 max-w-none flex-col gap-6">
      <section className="relative overflow-hidden rounded-[32px] border border-[#d4dfdb] bg-white shadow-[0_24px_64px_rgba(15,23,42,0.08)] dark:border-[#31443e] dark:bg-[#111917]">
        <div
          className={cn(
            "relative min-h-[340px] p-6",
            cover
              ? "bg-black/0"
              : "bg-[linear-gradient(135deg,rgba(252,252,251,0.99),rgba(247,246,245,0.97)_54%,rgba(241,240,239,0.96))] dark:bg-[linear-gradient(135deg,rgba(24,26,28,0.98),rgba(29,31,34,0.98)_54%,rgba(20,22,24,0.97))]"
          )}
          style={heroStyle}
        >
          <Link
            href={`/${locale}/home/exhibition`}
            className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/85 px-4 py-2 text-sm font-medium text-[#29413b] shadow-sm transition hover:bg-white dark:border-white/10 dark:bg-[#111917]/80 dark:text-[#d7e3de]"
          >
            <ArrowLeft className="h-4 w-4" />
            返回展览列表
          </Link>

          <div className={cn("mt-12 max-w-4xl space-y-4", cover ? "text-white" : "text-[#1f302c]")}>
            <div className="flex flex-wrap items-center gap-3">
              <Badge className={cn("bg-white/90", statusTone(item.status))} variant="outline">
                {statusLabel(item.status)}
              </Badge>
              <Badge className="border-white/20 bg-black/20 text-white backdrop-blur" variant="outline">
                {item.applicant_role === "artisan" ? "匠人主理" : "用户主理"}
              </Badge>
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] opacity-80">
                OFFLINE EXHIBITION
              </div>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight">
                {item.title || "未命名展览"}
              </h1>
              {item.subtitle ? <p className="mt-3 text-lg opacity-90">{item.subtitle}</p> : null}
              {item.summary ? <p className="mt-4 max-w-3xl text-sm leading-7 opacity-90">{item.summary}</p> : null}
            </div>

            <div className="flex flex-wrap gap-2">
              {(item.tags || []).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white/16 px-3 py-1 text-xs text-white backdrop-blur"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Section title="展览介绍">
            <div className="whitespace-pre-wrap text-sm leading-8 text-[#334944] dark:text-[#d7e3de]">
              {item.description || "暂无详细介绍"}
            </div>
          </Section>

          <Section title="时间与地点">
            <div className="grid gap-3 md:grid-cols-2">
              <InfoRow
                icon={<CalendarDays className="h-4 w-4" />}
                label="展览时间"
                value={formatRange(item.start_at, item.end_at)}
              />
              <InfoRow
                icon={<Clock3 className="h-4 w-4" />}
                label="开放时段"
                value={item.opening_hours || "未填写"}
              />
              <InfoRow
                icon={<MapPin className="h-4 w-4" />}
                label="地图位置"
                value={item.formatted_address || item.address_detail}
              />
              <InfoRow
                icon={<LocateFixed className="h-4 w-4" />}
                label="地图备注"
                value={item.map_note}
              />
            </div>
          </Section>

          <Section title="策展与主办">
            <div className="grid gap-3 md:grid-cols-2">
              <InfoRow
                icon={<UserRound className="h-4 w-4" />}
                label="主理人"
                value={item.curator_name}
              />
              <InfoRow
                icon={<Store className="h-4 w-4" />}
                label="主办方"
                value={item.organizer_name}
              />
              <InfoRow
                icon={<Store className="h-4 w-4" />}
                label="联合主办"
                value={(item.co_organizers || []).join(" / ")}
              />
              <InfoRow
                icon={<Store className="h-4 w-4" />}
                label="支持机构"
                value={(item.supporting_organizations || []).join(" / ")}
              />
            </div>
          </Section>

          <Section title="申请与现场信息">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <div className="mb-3 text-sm font-medium text-[#29413b] dark:text-[#d7e3de]">
                  艺术类别
                </div>
                <PillList items={item.art_categories} />
              </div>
              <div>
                <div className="mb-3 text-sm font-medium text-[#29413b] dark:text-[#d7e3de]">
                  展览亮点
                </div>
                <PillList items={item.highlights} />
              </div>
              <div>
                <div className="mb-3 text-sm font-medium text-[#29413b] dark:text-[#d7e3de]">
                  交通指引
                </div>
                <PillList items={item.transportation} />
              </div>
              <div>
                <div className="mb-3 text-sm font-medium text-[#29413b] dark:text-[#d7e3de]">
                  现场设施
                </div>
                <PillList items={item.facilities} />
              </div>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <div className="mb-3 text-sm font-medium text-[#29413b] dark:text-[#d7e3de]">
                  申请要求
                </div>
                <div className="whitespace-pre-wrap text-sm leading-7 text-[#4c625c] dark:text-[#b7c8c2]">
                  {item.application_requirements || "暂无"}
                </div>
              </div>
              <div>
                <div className="mb-3 text-sm font-medium text-[#29413b] dark:text-[#d7e3de]">
                  提交材料
                </div>
                <PillList items={item.submission_materials} />
              </div>
            </div>
          </Section>

          {(item.schedule_items || []).length > 0 ? (
            <Section title="活动日程">
              <div className="space-y-3">
                {(item.schedule_items || []).map((schedule, index) => (
                  <div
                    key={`${schedule.label}-${index}`}
                    className="rounded-[18px] bg-[#f7faf9] px-4 py-3 dark:bg-[#18211f]"
                  >
                    <div className="font-medium text-[#29413b] dark:text-[#d7e3de]">
                      {schedule.label}
                    </div>
                    <div className="mt-1 text-sm text-[#5f736d] dark:text-[#b7c8c2]">
                      {formatRange(schedule.start_at, schedule.end_at)}
                    </div>
                    {schedule.note ? (
                      <div className="mt-2 text-sm text-[#5f736d] dark:text-[#b7c8c2]">
                        {schedule.note}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </Section>
          ) : null}

          {(item.gallery_images || []).length > 0 ? (
            <Section title="展览图集">
              <div className="grid gap-4 sm:grid-cols-2">
                {(item.gallery_images || []).map((image, index) => (
                  <div
                    key={`${image}-${index}`}
                    className="overflow-hidden rounded-[22px] border border-[#d7e2de] bg-[#f7faf9] dark:border-[#31443e] dark:bg-[#18211f]"
                  >
                    <img
                      src={image}
                      alt={`${item.title || "线下展览"}-${index + 1}`}
                      className="h-64 w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </Section>
          ) : null}
        </div>

        <div className="space-y-6">
          <Section title="联系与导航">
            <div className="space-y-3">
              <InfoRow
                icon={<Phone className="h-4 w-4" />}
                label="联系电话"
                value={item.contact_phone}
              />
              <InfoRow
                icon={<Mail className="h-4 w-4" />}
                label="联系邮箱"
                value={item.contact_email}
              />
              <InfoRow
                icon={<LocateFixed className="h-4 w-4" />}
                label="微信 / 其他联系方式"
                value={item.contact_wechat}
              />
            </div>

            <div className="mt-4">
              <a
                href={buildMapUrl(item)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#d0dbd6] px-4 text-sm font-medium text-[#27453d] transition hover:border-[#9db7b0] hover:bg-[#f4faf7] dark:border-[#31443e] dark:text-[#d7e3de] dark:hover:bg-[#18211f]"
              >
                <LocateFixed className="h-4 w-4" />
                在高德中查看位置
              </a>
            </div>
          </Section>

          <Section title="地图预览">
            <OfflineExhibitionMapPreview
              title={item.venue_name || item.title}
              address={item.formatted_address || item.address_detail}
            />
          </Section>

          <Section title="展览信息">
            <div className="space-y-3">
              <InfoRow
                icon={<CalendarDays className="h-4 w-4" />}
                label="报名截止"
                value={formatDisplayDate(item.apply_deadline) || "未设置"}
              />
              <InfoRow
                icon={<Clock3 className="h-4 w-4" />}
                label="门票类型"
                value={item.admission_type || "未设置"}
              />
              <InfoRow
                icon={<Clock3 className="h-4 w-4" />}
                label="票价 / 容量 / 展位"
                value={`票价 ${item.admission_fee || 0} / 容量 ${item.capacity || 0} / 展位 ${item.booth_count || 0}`}
              />
            </div>
          </Section>

          {(item.external_links || []).length > 0 ? (
            <Section title="外部链接">
              <div className="space-y-3">
                {(item.external_links || []).map((link) => (
                  <a
                    key={`${link.label}-${link.url}`}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-[18px] bg-[#f7faf9] px-4 py-3 text-sm text-[#29413b] transition hover:bg-[#eef6f2] dark:bg-[#18211f] dark:text-[#d7e3de] dark:hover:bg-[#22302c]"
                  >
                    <span>{link.label}</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </Section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
