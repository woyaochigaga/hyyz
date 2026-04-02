"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  CalendarDays,
  LocateFixed,
  MapPin,
  Search,
  Store,
  Ticket,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type {
  OfflineExhibition,
  OfflineExhibitionAdmissionType,
  OfflineExhibitionStatus,
} from "@/types/offline-exhibition";

function formatDisplayDate(start?: string, end?: string) {
  if (!start && !end) return "时间待定";
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  const startText = start
    ? new Intl.DateTimeFormat("zh-CN", options).format(new Date(start))
    : "";
  const endText = end
    ? new Intl.DateTimeFormat("zh-CN", options).format(new Date(end))
    : "";
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

function admissionTypeLabel(type?: OfflineExhibitionAdmissionType) {
  switch (type) {
    case "ticketed":
      return "购票入场";
    case "reservation":
      return "预约入场";
    case "invite_only":
      return "邀约入场";
    case "free":
    default:
      return "免费入场";
  }
}

function buildMapUrl(exhibition: OfflineExhibition) {
  const name = encodeURIComponent(exhibition.venue_name || exhibition.title || "线下展览");
  const address = encodeURIComponent(exhibition.formatted_address || exhibition.address_detail || "");
  return `https://uri.amap.com/search?keyword=${name}%20${address}&src=hangyi&coordinate=gaode&callnative=0`;
}

export function OfflineExhibitionListView({ locale }: { locale: string }) {
  const [keyword, setKeyword] = React.useState("");
  const [cityFilter, setCityFilter] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [list, setList] = React.useState<OfflineExhibition[]>([]);

  const loadList = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("locale", locale);
      params.set("limit", "36");
      if (keyword.trim()) {
        params.set("q", keyword.trim());
      }
      if (cityFilter.trim()) {
        params.set("city", cityFilter.trim());
      }

      const response = await fetch(`/api/home/exhibition?${params.toString()}`);
      const result = await response.json();

      if (result.code === 0) {
        setList(Array.isArray(result.data) ? result.data : []);
      } else {
        toast.error(result.message || "加载展览列表失败");
      }
    } catch {
      toast.error("加载展览列表失败");
    } finally {
      setLoading(false);
    }
  }, [cityFilter, keyword, locale]);

  React.useEffect(() => {
    void loadList();
  }, [loadList]);

  const cityOptions = React.useMemo(() => {
    return Array.from(
      new Set(list.map((item) => String(item.city || "").trim()).filter(Boolean))
    );
  }, [list]);

  return (
    <div className="flex w-full flex-col gap-6 pb-10 pt-4">
      <section className="relative overflow-hidden rounded-[32px] border border-[#cfded9] bg-[radial-gradient(circle_at_top_left,rgba(204,228,220,0.86),transparent_30%),radial-gradient(circle_at_90%_12%,rgba(255,248,235,0.88),transparent_26%),linear-gradient(135deg,rgba(250,252,251,0.98),rgba(237,245,242,0.97)_54%,rgba(233,239,237,0.96))] p-6 shadow-[0_24px_60px_rgba(27,45,40,0.08)] dark:border-[#31443e] dark:bg-[radial-gradient(circle_at_top_left,rgba(64,91,83,0.38),transparent_30%),radial-gradient(circle_at_90%_12%,rgba(88,72,43,0.22),transparent_26%),linear-gradient(135deg,rgba(17,24,22,0.98),rgba(21,31,28,0.97)_54%,rgba(16,22,20,0.96))]">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_center,rgba(151,182,171,0.22),transparent_56%)] dark:bg-[radial-gradient(circle_at_center,rgba(96,128,118,0.18),transparent_56%)]" />
        <div className="relative grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <Badge className="w-fit border-[#b8d1ca] bg-white/80 px-3 py-1 text-[#35554e] dark:border-[#456258] dark:bg-white/10 dark:text-[#d2e4dd]" variant="outline">
              线下展览列表
            </Badge>
            <div className="space-y-3">
              <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-[#1f302c] dark:text-[#eef6f3]">
                公开中的线下展览
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-[#5a6f69] dark:text-[#a2b5af]">
                这里仅展示已发布的线下展览。申请提交和我的申请记录已经移到个人中心，方便用户在统一入口里管理自己的展览信息。
              </p>
            </div>
          </div>

          <div className="flex w-full justify-start lg:justify-end">
            <div className="w-full max-w-[360px] rounded-[24px] border border-white/80 bg-white/75 p-4 backdrop-blur sm:w-[280px] dark:border-white/10 dark:bg-white/5">
              <div className="text-xs uppercase tracking-[0.24em] text-[#789089] dark:text-[#8ea7a0]">
                Published
              </div>
              <div className="mt-2 text-3xl font-semibold text-[#223733] dark:text-[#edf5f2]">
                {list.length}
              </div>
              <div className="mt-1 text-sm text-[#6a7f79] dark:text-[#9bb0aa]">当前公开展览</div>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-5">
        <section className="grid gap-3 rounded-[28px] border border-[#d7e2de] bg-white/85 p-4 md:grid-cols-[1fr_220px_auto] dark:border-[#31443e] dark:bg-[#111917]/90">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-[#73837d] dark:text-[#91a49d]" />
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="搜索展览名、简介、主办方、场馆、城市或地址"
              className="h-11 rounded-[14px] border-[#d5e0dc] pl-9 dark:border-[#31443e] dark:bg-[#0e1513] dark:text-[#edf5f2]"
            />
          </div>
          <select
            value={cityFilter}
            onChange={(event) => setCityFilter(event.target.value)}
            className="h-11 rounded-[14px] border border-[#d5e0dc] bg-white px-3 text-sm text-[#223733] outline-none dark:border-[#31443e] dark:bg-[#0e1513] dark:text-[#edf5f2]"
          >
            <option value="">全部城市</option>
            {cityOptions.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          <Button type="button" variant="outline" onClick={() => void loadList()}>
            刷新列表
          </Button>
        </section>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-72 animate-pulse rounded-[28px] bg-[#eef3f1] dark:bg-[#18211f]"
              />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="flex min-h-[280px] items-center justify-center rounded-[28px] border border-dashed border-[#cfdbd6] bg-white/70 text-center text-sm text-[#66746f] dark:border-[#31443e] dark:bg-[#111917]/85 dark:text-[#9bb0aa]">
            当前没有公开中的线下展览。
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((item) => {
              const cover = item.cover_url || item.poster_url || item.gallery_images?.[0] || "";

              return (
                <article
                  key={item.uuid}
                  className="group overflow-hidden rounded-[26px] border border-[#d4dfdb] bg-white shadow-[0_14px_34px_rgba(32,46,42,0.05)] transition hover:border-[#c3d2cd] hover:shadow-[0_18px_44px_rgba(32,46,42,0.08)] dark:border-[#31443e] dark:bg-[#111917] dark:hover:border-[#3b534d]"
                >
                  <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-stretch sm:gap-5 sm:p-5">
                    <div className="relative overflow-hidden rounded-[18px] border border-black/5 bg-[#f3f4f6] sm:w-[220px] sm:shrink-0 dark:border-white/10 dark:bg-white/[0.05]">
                      <div
                        className="h-[140px] w-full sm:h-full sm:min-h-[168px]"
                        style={{
                          backgroundImage: cover
                            ? `linear-gradient(180deg, rgba(18,28,26,0.06), rgba(18,28,26,0.72)), url(${cover})`
                            : "linear-gradient(135deg, rgba(252,252,251,0.99), rgba(245,245,244,0.96))",
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      />
                      <div className="absolute left-3 top-3 flex items-center gap-2">
                        <Badge className={cn("bg-white/90", statusTone(item.status))} variant="outline">
                          {statusLabel(item.status)}
                        </Badge>
                        <Badge className="border-white/20 bg-black/20 text-white backdrop-blur" variant="outline">
                          {item.applicant_role === "artisan" ? "匠人主理" : "用户主理"}
                        </Badge>
                      </div>
                    </div>

                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="space-y-1.5">
                        <div className="text-[11px] uppercase tracking-[0.22em] text-[#7a8984] dark:text-[#91a49d]">
                          OFFLINE EXHIBITION
                        </div>
                        <Link href={`/${locale}/home/exhibition/${item.uuid}`} className="block">
                          <h2 className="line-clamp-2 text-xl font-semibold leading-snug text-[#1f302c] transition group-hover:opacity-95 dark:text-[#edf5f2]">
                            {item.title || "未命名展览"}
                          </h2>
                        </Link>
                        {item.subtitle ? (
                          <p className="line-clamp-1 text-sm text-[#5e716b] dark:text-[#9bb0aa]">
                            {item.subtitle}
                          </p>
                        ) : null}
                      </div>

                      <p className="line-clamp-2 text-sm leading-6 text-[#5e716b] dark:text-[#9bb0aa]">
                        {item.summary || item.description || "暂无展览介绍"}
                      </p>

                      <div className="grid gap-2 text-sm text-[#324540] sm:grid-cols-2 dark:text-[#d7e3de]">
                        <div className="flex items-start gap-2">
                          <CalendarDays className="mt-0.5 h-4 w-4 text-[#6e8780]" />
                          <span className="min-w-0 truncate">{formatDisplayDate(item.start_at, item.end_at)}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="mt-0.5 h-4 w-4 text-[#6e8780]" />
                          <span className="min-w-0 truncate">
                            {item.formatted_address || item.address_detail || "地址待补充"}
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Store className="mt-0.5 h-4 w-4 text-[#6e8780]" />
                          <span className="min-w-0 truncate">{item.organizer_name || "未填写主办方"}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <UserRound className="mt-0.5 h-4 w-4 text-[#6e8780]" />
                          <span className="min-w-0 truncate">{item.curator_name || "未填写主理人"}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Ticket className="mt-0.5 h-4 w-4 text-[#6e8780]" />
                          <span className="min-w-0 truncate">{admissionTypeLabel(item.admission_type)}</span>
                        </div>
                      </div>

                      {(item.tags || []).length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {(item.tags || []).slice(0, 6).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-[#edf4f1] px-3 py-1 text-xs text-[#516661] dark:bg-[#1b2623] dark:text-[#aec1bb]"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <div className="text-xs text-[#7a8984] dark:text-[#91a49d]">
                          发布者：{item.owner?.nickname || "未知用户"}
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/${locale}/home/exhibition/${item.uuid}`}
                            className="inline-flex items-center gap-1 rounded-full border border-[#d0dbd6] px-3 py-1.5 text-xs text-[#27453d] transition hover:border-[#9db7b0] hover:bg-[#f4faf7] dark:border-[#31443e] dark:text-[#d7e3de] dark:hover:bg-[#18211f]"
                          >
                            详情
                          </Link>
                          <a
                            href={buildMapUrl(item)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-full border border-[#d0dbd6] px-3 py-1.5 text-xs text-[#27453d] transition hover:border-[#9db7b0] hover:bg-[#f4faf7] dark:border-[#31443e] dark:text-[#d7e3de] dark:hover:bg-[#18211f]"
                          >
                            <LocateFixed className="h-3.5 w-3.5" />
                            高德打开
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
