"use client";

import * as React from "react";
import {
  BadgeCheck,
  CalendarDays,
  ExternalLink,
  MapPin,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getArtisanShopVerificationStatusLabel,
  normalizeArtisanShopVerificationStatus,
} from "@/lib/artisan-shop";
import { proxifyAvatarUrl } from "@/lib/avatar";
import { cn } from "@/lib/utils";
import type { PublicUserProfile } from "@/types/user";

function initials(name?: string) {
  return String(name || "").trim().slice(0, 1).toUpperCase() || "U";
}

function formatDate(date?: string) {
  if (!date) return "未知";
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "未知";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(value);
}

function getRoleLabel(role?: PublicUserProfile["role"]) {
  if (role === "artisan") return "匠人";
  if (role === "admin") return "管理员";
  return "普通用户";
}

function getRoleTone(role?: PublicUserProfile["role"]) {
  if (role === "artisan") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
  }
  if (role === "admin") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300";
  }
  return "bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-200";
}

function getPlatformLabel(platform?: string) {
  if (platform === "taobao") return "淘宝";
  return platform || "外部店铺";
}

function resolveLocaleFromPathname(pathname?: string | null) {
  const value = String(pathname || "").trim();
  const firstSegment = value.split("/").filter(Boolean)[0] || "";
  return firstSegment || "zh";
}

function PublicProfileSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[26px] border border-zinc-200/80 bg-zinc-50/85 p-4 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
        {title}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function PublicProfileMeta({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-white/90 px-3 py-3 dark:bg-white/[0.04]">
      <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-xs text-zinc-500 dark:text-zinc-400">{label}</div>
        <div className="mt-1 text-sm font-medium leading-6 text-zinc-900 dark:text-zinc-100">
          {value}
        </div>
      </div>
    </div>
  );
}

export function PublicUserProfilePanel({
  profile,
  locale = "zh",
  actionSlot,
}: {
  profile: PublicUserProfile | null;
  locale?: string;
  actionSlot?: React.ReactNode;
}) {
  const safeProfile = profile;
  const verificationStatus = normalizeArtisanShopVerificationStatus(
    safeProfile?.artisan_shop_verification_status
  );
  const isArtisan = safeProfile?.role === "artisan";
  const isAdmin = safeProfile?.role === "admin";
  const hasArtisanShowcase = Boolean(
    safeProfile &&
      [
        safeProfile.artisan_category,
        safeProfile.artisan_specialties,
        safeProfile.artisan_shop_name,
        safeProfile.artisan_service_area,
        safeProfile.artisan_bio,
      ].some((item) => String(item || "").trim())
  );

  if (!safeProfile) {
    return (
      <div className="relative z-[1] mt-6 rounded-[28px] border border-zinc-200/80 bg-white/85 px-5 py-12 text-center text-sm text-zinc-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-400">
        暂时无法获取该用户的公开资料
      </div>
    );
  }

  return (
    <div className="relative z-[1] mt-6 space-y-4">
      <section className="rounded-[30px] border border-zinc-200/80 bg-white/92 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/[0.05] dark:shadow-[0_18px_48px_rgba(0,0,0,0.24)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Avatar className="h-20 w-20 border border-black/5 shadow-sm dark:border-white/10">
            <AvatarImage
              src={proxifyAvatarUrl(safeProfile.avatar_url) || undefined}
              alt={safeProfile.nickname}
            />
            <AvatarFallback className="text-lg">
              {initials(safeProfile.nickname)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                {safeProfile.nickname}
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium",
                  getRoleTone(safeProfile.role)
                )}
              >
                {getRoleLabel(safeProfile.role)}
              </span>
              {isArtisan && verificationStatus === "approved" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  淘宝店铺已认证
                </span>
              ) : null}
              {isAdmin ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  平台管理身份
                </span>
              ) : null}
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <PublicProfileMeta
                icon={<CalendarDays className="h-4 w-4" />}
                label="加入时间"
                value={formatDate(safeProfile.created_at)}
              />
              <PublicProfileMeta
                icon={<UserRound className="h-4 w-4" />}
                label="个人定位"
                value={
                  isAdmin
                    ? "平台管理员"
                    : isArtisan
                      ? "认证匠人 / 创作者"
                      : "社区成员"
                }
              />
            </div>

            {safeProfile.signature ? (
              <div className="mt-4 rounded-2xl bg-zinc-50 px-4 py-3 text-sm leading-7 text-zinc-700 dark:bg-white/[0.04] dark:text-zinc-200">
                {safeProfile.signature}
              </div>
            ) : isAdmin ? (
              <div className="mt-4 rounded-2xl bg-zinc-50 px-4 py-3 text-sm leading-7 text-zinc-700 dark:bg-white/[0.04] dark:text-zinc-200">
                负责平台内容、社区治理与后台管理。
              </div>
            ) : null}

            {actionSlot ? <div className="mt-4 flex flex-wrap gap-2">{actionSlot}</div> : null}
          </div>
        </div>
      </section>

      {(safeProfile.address || (!isArtisan && !isAdmin)) ? (
        <PublicProfileSection title="基础信息">
          <div className="grid gap-3 sm:grid-cols-2">
            {safeProfile.address ? (
              <PublicProfileMeta
                icon={<MapPin className="h-4 w-4" />}
                label="所在地区"
                value={safeProfile.address}
              />
            ) : null}
            {!isArtisan && !isAdmin ? (
              <PublicProfileMeta
                icon={<Sparkles className="h-4 w-4" />}
                label="社区身份"
                value="在论坛与社区中参与发布、讨论与互动"
              />
            ) : null}
          </div>
        </PublicProfileSection>
      ) : null}

      {hasArtisanShowcase ? (
        <PublicProfileSection title={isAdmin ? "专业背景" : "匠人档案"}>
          <div className="grid gap-3 sm:grid-cols-2">
            {safeProfile.artisan_category ? (
              <PublicProfileMeta
                icon={<Sparkles className="h-4 w-4" />}
                label="工艺类别"
                value={safeProfile.artisan_category}
              />
            ) : null}
            {safeProfile.artisan_specialties ? (
              <PublicProfileMeta
                icon={<Sparkles className="h-4 w-4" />}
                label="擅长方向"
                value={safeProfile.artisan_specialties}
              />
            ) : null}
            {safeProfile.artisan_years_experience ? (
              <PublicProfileMeta
                icon={<CalendarDays className="h-4 w-4" />}
                label="从业经验"
                value={`${safeProfile.artisan_years_experience} 年`}
              />
            ) : null}
            {safeProfile.artisan_service_area ? (
              <PublicProfileMeta
                icon={<MapPin className="h-4 w-4" />}
                label="服务范围"
                value={safeProfile.artisan_service_area}
              />
            ) : null}
          </div>

          {safeProfile.artisan_shop_name || safeProfile.artisan_bio ? (
            <div className="mt-3 space-y-3">
              {safeProfile.artisan_shop_name ? (
                <div className="rounded-2xl bg-white/90 px-4 py-3 dark:bg-white/[0.04]">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    店铺 / 工作室
                  </div>
                  <div className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {safeProfile.artisan_shop_name}
                  </div>
                </div>
              ) : null}
              {safeProfile.artisan_bio ? (
                <div className="rounded-2xl bg-white/90 px-4 py-3 text-sm leading-7 text-zinc-700 dark:bg-white/[0.04] dark:text-zinc-200">
                  {safeProfile.artisan_bio}
                </div>
              ) : null}
            </div>
          ) : null}
        </PublicProfileSection>
      ) : null}

      {isArtisan ? (
        <PublicProfileSection title="店铺认证">
          <div className="grid gap-3 sm:grid-cols-2">
            <PublicProfileMeta
              icon={<BadgeCheck className="h-4 w-4" />}
              label="认证状态"
              value={getArtisanShopVerificationStatusLabel(verificationStatus)}
            />
            {safeProfile.artisan_shop_platform ? (
              <PublicProfileMeta
                icon={<ShieldCheck className="h-4 w-4" />}
                label="店铺平台"
                value={getPlatformLabel(safeProfile.artisan_shop_platform)}
              />
            ) : null}
          </div>

          {verificationStatus === "approved" && safeProfile.artisan_shop_url ? (
            <a
              href={safeProfile.artisan_shop_url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              查看店铺主页
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : null}
        </PublicProfileSection>
      ) : null}
    </div>
  );
}

export function UserPublicProfileTrigger({
  userUuid,
  children,
  className,
}: {
  userUuid?: string;
  children: React.ReactElement<any>;
  className?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [profile, setProfile] = React.useState<PublicUserProfile | null>(null);

  React.useEffect(() => {
    if (!open || !userUuid) return;

    let cancelled = false;
    const loadProfile = async () => {
      try {
        setLoading(true);
        const resp = await fetch(`/api/users/${userUuid}/public-profile`, {
          cache: "no-store",
        });
        const result = await resp.json();
        if (!cancelled) {
          setProfile(result?.code === 0 ? result.data || null : null);
        }
      } catch {
        if (!cancelled) {
          setProfile(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [open, userUuid]);

  if (!userUuid || !React.isValidElement(children)) {
    return children;
  }

  const child = React.cloneElement(children as React.ReactElement<any>, {
    className: cn(
      "cursor-pointer transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
      (children.props as { className?: string }).className,
      className
    ),
    role: (children.props as { role?: string }).role || "button",
    tabIndex:
      typeof (children.props as { tabIndex?: number }).tabIndex === "number"
        ? (children.props as { tabIndex?: number }).tabIndex
        : 0,
    onMouseDownCapture: (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const original = (children.props as {
        onMouseDownCapture?: (event: React.MouseEvent) => void;
      }).onMouseDownCapture;
      original?.(event);
    },
    onClickCapture: (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setOpen(true);
      const original = (children.props as {
        onClickCapture?: (event: React.MouseEvent) => void;
      }).onClickCapture;
      original?.(event);
    },
    onClick: (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const original = (children.props as { onClick?: (event: React.MouseEvent) => void }).onClick;
      original?.(event);
      setOpen(true);
    },
    onKeyDown: (event: React.KeyboardEvent) => {
      const original = (children.props as {
        onKeyDown?: (event: React.KeyboardEvent) => void;
      }).onKeyDown;
      original?.(event);
      if (event.defaultPrevented) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        event.stopPropagation();
        setOpen(true);
      }
    },
  });

  const locale = resolveLocaleFromPathname(pathname);

  return (
    <>
      {child}
      <Dialog
        open={open}
        onOpenChange={setOpen}
      >
        <DialogContent className="max-w-2xl overflow-hidden border-zinc-200/80 p-0 dark:border-white/10">
          <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_28%),linear-gradient(180deg,rgba(248,251,250,1),rgba(239,245,242,0.98))] p-6 dark:bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_28%),linear-gradient(180deg,rgba(20,25,24,0.98),rgba(17,21,20,0.96))]">
            <div className="pointer-events-none absolute right-[-3rem] top-[-2rem] h-36 w-36 rounded-full bg-white/40 blur-3xl dark:bg-white/5" />
            <DialogHeader className="relative z-[1] space-y-2 text-left">
              <DialogTitle className="text-xl">用户详情</DialogTitle>
              <DialogDescription>
                查看社区和论坛中的公开个人资料。
              </DialogDescription>
            </DialogHeader>

            {loading ? (
              <div className="relative z-[1] mt-6 rounded-[28px] border border-zinc-200/80 bg-white/85 px-5 py-12 text-center text-sm text-zinc-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-400">
                正在加载用户资料...
              </div>
            ) : !profile ? (
              <div className="relative z-[1] mt-6 rounded-[28px] border border-zinc-200/80 bg-white/85 px-5 py-12 text-center text-sm text-zinc-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-400">
                暂时无法获取该用户的公开资料
              </div>
            ) : (
              <PublicUserProfilePanel
                profile={profile}
                locale={locale}
                actionSlot={
                  <>
                    <Button asChild type="button" size="sm" className="rounded-full px-4">
                      <Link href={`/${locale}/home/u/${profile.uuid}`}>查看主页</Link>
                    </Button>
                    <Button asChild type="button" size="sm" variant="ghost" className="rounded-full px-4">
                      <Link href={`/${locale}/home/community`}>社区</Link>
                    </Button>
                    <Button asChild type="button" size="sm" variant="ghost" className="rounded-full px-4">
                      <Link href={`/${locale}/home/forum`}>论坛</Link>
                    </Button>
                  </>
                }
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
