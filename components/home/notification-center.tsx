"use client";

import * as React from "react";
import {
  Bell,
  CheckCheck,
  Eye,
  MessageCircleMore,
  Megaphone,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppContext } from "@/contexts/app";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";
import type { NotificationListItem, NotificationSummary } from "@/types/notification";

type NotificationTab = "all" | "unread" | "system" | "interaction" | "review";

type NotificationCopy = {
  title: string;
  dialogDescription: string;
  tabs: Record<NotificationTab, string>;
  unreadCountLabel: string;
  unreadSummary: (count: number) => string;
  syncing: string;
  emptyUnread: string;
  noRecent: string;
  signInHint: string;
  noItems: string;
  loading: string;
  viewAll: string;
  markAllRead: string;
  markRead: string;
  read: string;
  done: string;
  view: string;
  collapse: string;
  delete: string;
  confirmDelete: string;
  contentFallback: string;
  linkedPageLabel: string;
  notifySignIn: string;
  notifyMarkAllReadFailed: string;
  notifyMarkReadFailed: string;
  notifyDeleteFailed: string;
  minutesAgo: (n: number) => string;
  hoursAgo: (n: number) => string;
  toLocale: string;
  categories: {
    system: string;
    interaction: string;
    review: string;
  };
};

const COPY_ZH: NotificationCopy = {
  title: "消息中心",
  dialogDescription: "管理员公告、互动提醒、审核结果都会集中显示在这里。",
  tabs: {
    all: "全部",
    unread: "未读",
    system: "系统",
    interaction: "互动",
    review: "审核",
  },
  unreadCountLabel: "未读",
  unreadSummary: (count) => `你有 ${count} 条未读消息`,
  syncing: "正在同步消息",
  emptyUnread: "暂无未读消息",
  noRecent: "最近没有新消息",
  signInHint: "登录后可查看公告、互动和审核通知",
  noItems: "当前筛选下没有消息",
  loading: "正在加载消息...",
  viewAll: "查看全部",
  markAllRead: "全部已读",
  markRead: "标为已读",
  read: "已读",
  done: "已完成",
  view: "查看",
  collapse: "收起",
  delete: "删除",
  confirmDelete: "确定删除这条通知？删除后将不再显示在列表中。",
  contentFallback: "点击查看详情",
  linkedPageLabel: "关联页面",
  notifySignIn: "请先登录后查看消息",
  notifyMarkAllReadFailed: "全部已读失败",
  notifyMarkReadFailed: "标记已读失败",
  notifyDeleteFailed: "删除失败",
  minutesAgo: (n) => `${n} 分钟前`,
  hoursAgo: (n) => `${n} 小时前`,
  toLocale: "zh-CN",
  categories: {
    system: "系统",
    interaction: "互动",
    review: "审核",
  },
};

const COPY_EN: NotificationCopy = {
  title: "Notification Center",
  dialogDescription:
    "Admin announcements, interaction alerts, and review results are shown here.",
  tabs: {
    all: "All",
    unread: "Unread",
    system: "System",
    interaction: "Interaction",
    review: "Review",
  },
  unreadCountLabel: "Unread",
  unreadSummary: (count) => `You have ${count} unread notifications`,
  syncing: "Syncing notifications",
  emptyUnread: "No unread notifications",
  noRecent: "No recent notifications",
  signInHint: "Sign in to view announcements, interactions, and reviews",
  noItems: "No notifications in this filter",
  loading: "Loading notifications...",
  viewAll: "View all",
  markAllRead: "Mark all read",
  markRead: "Mark read",
  read: "Read",
  done: "Done",
  view: "View",
  collapse: "Collapse",
  delete: "Delete",
  confirmDelete: "Delete this notification? It will be removed from your list.",
  contentFallback: "Click to view details",
  linkedPageLabel: "Linked page",
  notifySignIn: "Please sign in to view notifications",
  notifyMarkAllReadFailed: "Failed to mark all as read",
  notifyMarkReadFailed: "Failed to mark as read",
  notifyDeleteFailed: "Failed to delete",
  minutesAgo: (n) => `${n} min ago`,
  hoursAgo: (n) => `${n} hr ago`,
  toLocale: "en-US",
  categories: {
    system: "System",
    interaction: "Interaction",
    review: "Review",
  },
};

const TAB_KEYS: NotificationTab[] = ["all", "unread", "system", "interaction", "review"];

/** 通知跳转：无 action_url 时落到当前语言的个人中心；相对路径补全 locale 前缀 */
function resolveNotificationHref(
  actionUrl: string | undefined,
  locale: string
): string {
  const raw = String(actionUrl || "").trim();
  if (!raw) {
    return `/${locale}/personal_center`;
  }
  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }
  if (raw.startsWith("/")) {
    if (/^\/(zh|en)(\/|$)/.test(raw)) {
      return raw;
    }
    return `/${locale}${raw}`;
  }
  return `/${locale}/${raw}`;
}

function formatTime(copy: NotificationCopy, value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const now = Date.now();
  const diff = now - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < hour) {
    return copy.minutesAgo(Math.max(1, Math.floor(diff / minute) || 1));
  }

  if (diff < day) {
    return copy.hoursAgo(Math.floor(diff / hour));
  }

  return date.toLocaleString(copy.toLocale, {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getCategoryLabel(copy: NotificationCopy, item: NotificationListItem) {
  if (item.category === "interaction") return copy.categories.interaction;
  if (item.category === "review") return copy.categories.review;
  return copy.categories.system;
}

function NotificationItemIcon({ item }: { item: NotificationListItem }) {
  if (item.category === "interaction") {
    return <MessageCircleMore className="h-4 w-4" />;
  }
  if (item.category === "review") {
    return <ShieldCheck className="h-4 w-4" />;
  }
  return <Megaphone className="h-4 w-4" />;
}

function NotificationItemButton({
  item,
  copy,
  compact = false,
  onOpen,
  expanded = false,
  busy = false,
  justMarkedRead = false,
  onToggleExpand,
  onMarkRead,
  onDelete,
}: {
  item: NotificationListItem;
  copy: NotificationCopy;
  compact?: boolean;
  onOpen: (item: NotificationListItem) => void;
  expanded?: boolean;
  busy?: boolean;
  justMarkedRead?: boolean;
  onToggleExpand?: (item: NotificationListItem) => void;
  onMarkRead?: (item: NotificationListItem) => void;
  onDelete?: (item: NotificationListItem) => void;
}) {
  if (compact) {
    return (
      <button
        type="button"
        onClick={() => void onOpen(item)}
        className="w-full rounded-[22px] bg-white/58 p-3.5 text-left shadow-[0_10px_28px_rgba(15,23,42,0.07)] backdrop-blur-xl transition hover:bg-white/72 dark:bg-white/[0.05] dark:shadow-[0_12px_30px_rgba(0,0,0,0.26)] dark:hover:bg-white/[0.09]"
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#1f3a35,#35584f)] text-white shadow-[0_8px_20px_rgba(31,58,53,0.2)] dark:bg-white dark:text-zinc-900">
            <NotificationItemIcon item={item} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-black/[0.04] px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
                {getCategoryLabel(copy, item)}
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  "h-2 w-2 rounded-full bg-red-500 transition-all duration-200",
                  item.read_at ? "scale-75 opacity-0" : "scale-100 opacity-100"
                )}
              />
              <span className="ml-auto text-[11px] text-zinc-500 dark:text-zinc-400">
                {formatTime(copy, item.created_at || item.receipt_created_at)}
              </span>
            </div>
            <div className="mt-2 line-clamp-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {item.title}
            </div>
            <div className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-600 dark:text-zinc-300">
              {item.content || copy.contentFallback}
            </div>
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="w-full rounded-[24px] bg-white/62 p-4 text-left shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl transition dark:bg-white/[0.05] dark:shadow-[0_16px_36px_rgba(0,0,0,0.28)]">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#1f3a35,#35584f)] text-white shadow-[0_8px_20px_rgba(31,58,53,0.2)] dark:bg-white dark:text-zinc-900">
          <NotificationItemIcon item={item} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-black/[0.04] px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
              {getCategoryLabel(copy, item)}
            </span>
            <span
              aria-hidden="true"
              className={cn(
                "h-2 w-2 rounded-full bg-red-500 transition-all duration-200",
                item.read_at ? "scale-75 opacity-0" : "scale-100 opacity-100"
              )}
            />
            <span className="ml-auto text-[11px] text-zinc-500 dark:text-zinc-400">
              {formatTime(copy, item.created_at || item.receipt_created_at)}
            </span>
          </div>
          <div className="mt-2 line-clamp-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {item.title}
          </div>
          <div
            className={cn(
              "mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-300",
              expanded ? "whitespace-pre-wrap break-words" : "line-clamp-2"
            )}
          >
            {item.content || copy.contentFallback}
          </div>
          {expanded && item.action_url ? (
            <div className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
              {copy.linkedPageLabel}: {item.action_url}
            </div>
          ) : null}
          <div className="mt-3 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 rounded-md px-2 text-[11px]"
              disabled={busy || Boolean(item.read_at)}
              onClick={() => onMarkRead?.(item)}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              {justMarkedRead ? copy.done : item.read_at ? copy.read : copy.markRead}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 rounded-md px-2 text-[11px]"
              disabled={busy}
              onClick={() => onToggleExpand?.(item)}
            >
              <Eye className="h-3.5 w-3.5" />
              {expanded ? copy.collapse : copy.view}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 rounded-md px-2 text-[11px] text-red-500 hover:text-red-500"
              disabled={busy}
              onClick={() => onDelete?.(item)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {copy.delete}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotificationCenter() {
  const router = useRouter();
  const params = useParams<{ locale?: string }>();
  const locale =
    typeof params?.locale === "string" && params.locale ? params.locale : "zh";
  const copy = locale === "en" ? COPY_EN : COPY_ZH;
  const { user, setShowSignModal } = useAppContext();
  const [open, setOpen] = React.useState(false);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [tab, setTab] = React.useState<NotificationTab>("all");
  const [summary, setSummary] = React.useState<NotificationSummary>({
    unread_count: 0,
    items: [],
  });
  const [items, setItems] = React.useState<NotificationListItem[]>([]);
  const [loadingSummary, setLoadingSummary] = React.useState(false);
  const [loadingList, setLoadingList] = React.useState(false);
  const [markingAll, setMarkingAll] = React.useState(false);
  const [expandedKeys, setExpandedKeys] = React.useState<Record<string, boolean>>({});
  const [busyKeys, setBusyKeys] = React.useState<Record<string, boolean>>({});
  const [justMarkedKeys, setJustMarkedKeys] = React.useState<Record<string, boolean>>({});
  const previewCloseTimerRef = React.useRef<number | null>(null);
  const justMarkedTimerRef = React.useRef<Record<string, number>>({});

  const getItemKey = React.useCallback(
    (item: NotificationListItem) => `${item.receipt_id}-${item.uuid}`,
    []
  );

  const fetchSummary = React.useCallback(async () => {
    if (!user?.uuid) {
      setSummary({ unread_count: 0, items: [] });
      return;
    }

    try {
      setLoadingSummary(true);
      const resp = await fetch("/api/notifications/summary", {
        cache: "no-store",
      });
      const result = await resp.json();
      if (result?.code !== 0) {
        setSummary({ unread_count: 0, items: [] });
        return;
      }
      setSummary(result.data || { unread_count: 0, items: [] });
    } catch (error) {
      setSummary({ unread_count: 0, items: [] });
    } finally {
      setLoadingSummary(false);
    }
  }, [user?.uuid]);

  const fetchList = React.useCallback(
    async (nextTab: NotificationTab) => {
      if (!user?.uuid) {
        setItems([]);
        return;
      }

      try {
        setLoadingList(true);
        const resp = await fetch(`/api/notifications?tab=${nextTab}&limit=40`, {
          cache: "no-store",
        });
        const result = await resp.json();
        if (result?.code !== 0) {
          setItems([]);
          return;
        }
        setItems(Array.isArray(result.data) ? result.data : []);
      } catch (error) {
        setItems([]);
      } finally {
        setLoadingList(false);
      }
    },
    [user?.uuid]
  );

  React.useEffect(() => {
    void fetchSummary();
  }, [fetchSummary]);

  React.useEffect(() => {
    return () => {
      if (previewCloseTimerRef.current !== null) {
        window.clearTimeout(previewCloseTimerRef.current);
      }
      Object.values(justMarkedTimerRef.current).forEach((timerId) => {
        window.clearTimeout(timerId);
      });
    };
  }, []);

  React.useEffect(() => {
    if (!open) return;
    void fetchList(tab);
  }, [fetchList, open, tab]);

  const ensureSignedIn = React.useCallback(() => {
    if (user?.uuid) return true;
    setShowSignModal(true);
    notify("info", copy.notifySignIn);
    return false;
  }, [copy.notifySignIn, setShowSignModal, user?.uuid]);

  const refreshState = React.useCallback(
    async (withList: boolean) => {
      await fetchSummary();
      if (withList) {
        await fetchList(tab);
      }
    },
    [fetchList, fetchSummary, tab]
  );

  const openNotification = React.useCallback(
    async (item: NotificationListItem) => {
      if (!ensureSignedIn()) return;

      try {
        if (!item.read_at) {
          await fetch("/api/notifications/read", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              notification_uuids: [item.uuid],
            }),
          });
        }
      } catch (error) {
        console.error("mark notification read failed:", error);
      }

      await fetchSummary();
      setOpen(false);
      router.push(resolveNotificationHref(item.action_url, locale));
    },
    [ensureSignedIn, fetchSummary, locale, router]
  );

  const handleMarkAllRead = React.useCallback(async () => {
    if (!ensureSignedIn()) return;

    try {
      setMarkingAll(true);
      const resp = await fetch("/api/notifications/read-all", {
        method: "POST",
      });
      const result = await resp.json();
      if (result?.code !== 0) {
        notify("error", result?.message || copy.notifyMarkAllReadFailed);
        return;
      }
      await refreshState(true);
    } catch (error) {
      notify("error", copy.notifyMarkAllReadFailed);
    } finally {
      setMarkingAll(false);
    }
  }, [copy.notifyMarkAllReadFailed, ensureSignedIn, refreshState]);

  const handleMarkOneRead = React.useCallback(
    async (item: NotificationListItem) => {
      if (!ensureSignedIn() || item.read_at) return;
      const key = getItemKey(item);
      try {
        setBusyKeys((prev) => ({ ...prev, [key]: true }));
        const resp = await fetch("/api/notifications/read", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            notification_uuids: [item.uuid],
          }),
        });
        const result = await resp.json();
        if (result?.code !== 0) {
          notify("error", result?.message || copy.notifyMarkReadFailed);
          return;
        }
        setJustMarkedKeys((prev) => ({ ...prev, [key]: true }));
        if (justMarkedTimerRef.current[key] !== undefined) {
          window.clearTimeout(justMarkedTimerRef.current[key]);
        }
        justMarkedTimerRef.current[key] = window.setTimeout(() => {
          setJustMarkedKeys((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
          });
          delete justMarkedTimerRef.current[key];
        }, 800);
        await refreshState(true);
      } catch (error) {
        notify("error", copy.notifyMarkReadFailed);
      } finally {
        setBusyKeys((prev) => ({ ...prev, [key]: false }));
      }
    },
    [copy.notifyMarkReadFailed, ensureSignedIn, getItemKey, refreshState]
  );

  const handleDeleteOne = React.useCallback(
    async (item: NotificationListItem) => {
      if (!ensureSignedIn()) return;
      if (!window.confirm(copy.confirmDelete)) {
        return;
      }
      const key = getItemKey(item);
      try {
        setBusyKeys((prev) => ({ ...prev, [key]: true }));
        const resp = await fetch("/api/notifications/delete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            notification_uuids: [item.uuid],
          }),
        });
        const result = await resp.json();
        if (result?.code !== 0) {
          notify("error", result?.message || copy.notifyDeleteFailed);
          return;
        }
        setExpandedKeys((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
        setJustMarkedKeys((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
        if (justMarkedTimerRef.current[key] !== undefined) {
          window.clearTimeout(justMarkedTimerRef.current[key]);
          delete justMarkedTimerRef.current[key];
        }
        await refreshState(true);
      } catch (error) {
        notify("error", copy.notifyDeleteFailed);
      } finally {
        setBusyKeys((prev) => ({ ...prev, [key]: false }));
      }
    },
    [copy.confirmDelete, copy.notifyDeleteFailed, ensureSignedIn, getItemKey, refreshState]
  );

  const handleToggleExpand = React.useCallback(
    (item: NotificationListItem) => {
      const key = getItemKey(item);
      const willExpand = !expandedKeys[key];
      setExpandedKeys((prev) => ({
        ...prev,
        [key]: !prev[key],
      }));
      if (willExpand && !item.read_at) {
        void handleMarkOneRead(item);
      }
    },
    [expandedKeys, getItemKey, handleMarkOneRead]
  );

  const previewItems = summary.items || [];

  const openPreview = React.useCallback(() => {
    if (previewCloseTimerRef.current !== null) {
      window.clearTimeout(previewCloseTimerRef.current);
      previewCloseTimerRef.current = null;
    }
    setPreviewOpen(true);
  }, []);

  const closePreviewSoon = React.useCallback(() => {
    if (previewCloseTimerRef.current !== null) {
      window.clearTimeout(previewCloseTimerRef.current);
    }
    previewCloseTimerRef.current = window.setTimeout(() => {
      setPreviewOpen(false);
      previewCloseTimerRef.current = null;
    }, 140);
  }, []);

  return (
    <>
      <div
        className="relative"
        onMouseEnter={openPreview}
        onMouseLeave={closePreviewSoon}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full bg-white/42 text-zinc-700 shadow-[0_8px_22px_rgba(15,23,42,0.08)] backdrop-blur-xl hover:bg-white/62 dark:bg-white/[0.06] dark:text-zinc-100 dark:hover:bg-white/[0.11]"
          aria-label={copy.title}
          onClick={() => {
            if (!ensureSignedIn()) return;
            setOpen(true);
          }}
        >
          <Bell className="h-[17px] w-[17px]" strokeWidth={2.1} />
          {summary.unread_count > 0 ? (
            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border border-white bg-red-500 dark:border-zinc-950" />
          ) : null}
        </Button>

        <div
          className={cn(
            "absolute right-0 top-full z-[116] hidden w-[30rem] pt-3 transition duration-200 lg:block xl:w-[34rem]",
            previewOpen
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none translate-y-1 opacity-0"
          )}
        >
          <div className="overflow-hidden rounded-[30px] bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(248,250,252,0.58))] p-4 shadow-[0_24px_60px_rgba(15,23,42,0.18)] backdrop-blur-2xl dark:bg-[linear-gradient(180deg,rgba(18,20,29,0.82),rgba(20,24,34,0.66))] dark:shadow-[0_24px_60px_rgba(0,0,0,0.42)]">
            <div className="flex items-center justify-between px-1 pb-4 pt-1">
              <div>
                <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {copy.title}
                </div>
                <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {summary.unread_count > 0
                    ? copy.unreadSummary(summary.unread_count)
                    : loadingSummary
                      ? copy.syncing
                      : copy.emptyUnread}
                </div>
              </div>
              {summary.unread_count > 0 ? (
                <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-[11px] font-medium text-red-600 dark:bg-red-500/12 dark:text-red-300">
                  {copy.unreadCountLabel} {summary.unread_count}
                </span>
              ) : null}
            </div>

            <div className="max-h-[30rem] space-y-2.5 overflow-y-auto pr-1">
              {previewItems.length > 0 ? (
                previewItems.map((item) => (
                  <NotificationItemButton
                    key={`${item.receipt_id}-${item.uuid}`}
                    item={item}
                    copy={copy}
                    compact
                    onOpen={openNotification}
                  />
                ))
              ) : (
                <div className="rounded-[22px] bg-white/28 px-4 py-10 text-center text-sm text-zinc-500 backdrop-blur-md dark:bg-white/[0.04] dark:text-zinc-400">
                  {user?.uuid ? copy.noRecent : copy.signInHint}
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between gap-2 pt-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 rounded-full px-3.5 text-xs"
                disabled={summary.unread_count === 0 || markingAll}
                onClick={() => void handleMarkAllRead()}
              >
                <CheckCheck className="h-4 w-4" />
                {copy.markAllRead}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 rounded-full px-3.5 text-xs"
                onClick={() => {
                  if (!ensureSignedIn()) return;
                  setOpen(true);
                }}
              >
                {copy.viewAll}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (next && !ensureSignedIn()) {
            return;
          }
          setOpen(next);
        }}
      >
        <DialogContent className="max-w-2xl overflow-hidden border-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(248,250,252,0.58))] p-0 shadow-[0_28px_72px_rgba(15,23,42,0.2)] backdrop-blur-2xl dark:bg-[linear-gradient(180deg,rgba(18,20,29,0.82),rgba(20,24,34,0.66))] dark:shadow-[0_28px_72px_rgba(0,0,0,0.45)] [&>button]:right-5 [&>button]:top-5 [&>button]:rounded-full [&>button]:bg-black/5 [&>button]:p-1.5 dark:[&>button]:bg-white/10">
          <DialogHeader className="border-b border-black/5 px-6 py-5 dark:border-white/10">
            <DialogTitle className="text-xl">{copy.title}</DialogTitle>
            <DialogDescription className="text-zinc-500 dark:text-zinc-400">
              {copy.dialogDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap gap-2 border-b border-black/5 px-6 py-4 dark:border-white/10">
            {TAB_KEYS.map((key) => (
              <Button
                key={key}
                type="button"
                size="sm"
                variant={tab === key ? "default" : "ghost"}
                className={cn(
                  "h-8 rounded-full px-3 text-xs",
                  tab === key
                    ? "bg-emerald-500/85 text-white hover:bg-emerald-500"
                    : "bg-white/20 hover:bg-white/35 dark:bg-white/[0.04] dark:hover:bg-white/[0.1]"
                )}
                onClick={() => setTab(key)}
              >
                {copy.tabs[key]}
              </Button>
            ))}
            <div className="ml-auto">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 rounded-full bg-white/20 px-3 text-xs hover:bg-white/35 dark:bg-white/[0.04] dark:hover:bg-white/[0.1]"
                disabled={summary.unread_count === 0 || markingAll}
                onClick={() => void handleMarkAllRead()}
              >
                <CheckCheck className="h-4 w-4" />
                {copy.markAllRead}
              </Button>
            </div>
          </div>

          <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
            {loadingList ? (
              <div className="rounded-[22px] bg-white/30 py-12 text-center text-sm text-zinc-500 backdrop-blur-md dark:bg-white/[0.04] dark:text-zinc-400">
                {copy.loading}
              </div>
            ) : items.length > 0 ? (
              <div className="space-y-3">
                {items.map((item) => (
                  <NotificationItemButton
                    key={`${item.receipt_id}-${item.uuid}`}
                    item={item}
                    copy={copy}
                    onOpen={openNotification}
                    expanded={Boolean(expandedKeys[getItemKey(item)])}
                    busy={Boolean(busyKeys[getItemKey(item)])}
                    justMarkedRead={Boolean(justMarkedKeys[getItemKey(item)])}
                    onToggleExpand={handleToggleExpand}
                    onMarkRead={handleMarkOneRead}
                    onDelete={handleDeleteOne}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-[22px] bg-white/30 py-12 text-center text-sm text-zinc-500 backdrop-blur-md dark:bg-white/[0.04] dark:text-zinc-400">
                {copy.noItems}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
