"use client";

import * as React from "react";
import {
  CalendarClock,
  ChevronDown,
  Eye,
  Megaphone,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import type { NotificationEvent } from "@/types/notification";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type ManagerFilter = "all" | "active" | "expired" | "revoked";

type NotificationFormState = {
  title: string;
  content: string;
  category: "system" | "interaction" | "review";
  audience_type: "all" | "role" | "direct";
  audience_value: string;
  action_url: string;
  priority: "low" | "normal" | "high";
  expires_at: string;
};

function describeAudience(audienceType: NotificationEvent["audience_type"], audienceValue?: string) {
  if (audienceType === "all") return "全部用户";
  if (audienceType === "role") {
    const role = String(audienceValue || "").trim();
    if (role === "artisan") return "匠人";
    if (role === "admin") return "管理员";
    if (role === "user") return "普通用户";
    return `角色：${role || "未指定"}`;
  }
  return `指定用户：${String(audienceValue || "").trim() || "未指定"}`;
}

function describeCategory(category: NotificationEvent["category"]) {
  if (category === "interaction") return "互动";
  if (category === "review") return "审核";
  return "系统";
}

function describeType(type: NotificationEvent["type"]) {
  switch (type) {
    case "announcement_published":
      return "公告发布";
    case "home_post_commented":
      return "帖子评论";
    case "home_post_replied":
      return "评论回复";
    case "forum_post_replied":
      return "论坛回复";
    case "offline_exhibition_approved":
      return "展览通过";
    case "offline_exhibition_rejected":
      return "展览驳回";
    case "artisan_verification_approved":
      return "认证通过";
    case "artisan_verification_rejected":
      return "认证驳回";
    case "system_message":
    default:
      return "系统消息";
  }
}

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

function toInputDateTimeValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

function fromNotification(item?: NotificationEvent): NotificationFormState {
  return {
    title: item?.title || "",
    content: item?.content || "",
    category:
      item?.category === "interaction" || item?.category === "review"
        ? item.category
        : "system",
    audience_type:
      item?.audience_type === "role" || item?.audience_type === "direct"
        ? item.audience_type
        : "all",
    audience_value: item?.audience_value || "",
    action_url: item?.action_url || "",
    priority: item?.priority === "low" || item?.priority === "high" ? item.priority : "normal",
    expires_at: toInputDateTimeValue(item?.expires_at),
  };
}

function getStatusText(item: NotificationEvent) {
  if (item.status === "revoked") return "已撤回";
  if (item.is_expired) return "已过期";
  return "进行中";
}

function getStatusClass(item: NotificationEvent) {
  if (item.status === "revoked") return "bg-zinc-700 text-white";
  if (item.is_expired) return "bg-red-600 text-white";
  return "bg-emerald-600 text-white";
}

export function AdminNotificationsManager({
  locale,
  initialNotifications,
}: {
  locale: string;
  initialNotifications: NotificationEvent[];
}) {
  const [items, setItems] = React.useState<NotificationEvent[]>(initialNotifications);
  const [filter, setFilter] = React.useState<ManagerFilter>("all");
  const [submitting, setSubmitting] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [viewDialogOpen, setViewDialogOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<NotificationEvent | null>(null);
  const [viewingItem, setViewingItem] = React.useState<NotificationEvent | null>(null);
  const [form, setForm] = React.useState<NotificationFormState>(fromNotification());

  const filteredItems = React.useMemo(() => {
    return items.filter((item) => {
      if (filter === "expired") return Boolean(item.is_expired);
      if (filter === "revoked") return item.status === "revoked";
      if (filter === "active") return item.status !== "revoked" && !item.is_expired;
      return true;
    });
  }, [filter, items]);

  const stats = React.useMemo(
    () => ({
      total: items.length,
      active: items.filter((item) => item.status !== "revoked" && !item.is_expired).length,
      expired: items.filter((item) => item.is_expired).length,
      revoked: items.filter((item) => item.status === "revoked").length,
    }),
    [items]
  );

  const refreshItem = React.useCallback((nextItem: NotificationEvent) => {
    setItems((prev) => [nextItem, ...prev.filter((item) => item.uuid !== nextItem.uuid)]);
  }, []);

  const removeItem = React.useCallback((uuid: string) => {
    setItems((prev) => prev.filter((item) => item.uuid !== uuid));
  }, []);

  const openCreate = React.useCallback(() => {
    setEditingItem(null);
    setForm(fromNotification());
    setDialogOpen(true);
  }, []);

  const openEdit = React.useCallback((item: NotificationEvent) => {
    setEditingItem(item);
    setForm(fromNotification(item));
    setDialogOpen(true);
  }, []);

  const openView = React.useCallback((item: NotificationEvent) => {
    setViewingItem(item);
    setViewDialogOpen(true);
  }, []);

  const submitForm = React.useCallback(async () => {
    if (!form.title.trim()) {
      window.alert("标题不能为空");
      return;
    }

    if (form.audience_type !== "all" && !form.audience_value.trim()) {
      window.alert("请填写发送对象");
      return;
    }

    try {
      setSubmitting(true);
      const url = editingItem
        ? `/api/admin/notifications/${editingItem.uuid}`
        : "/api/admin/notifications/send";
      const method = editingItem ? "PATCH" : "POST";
      const resp = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title,
          content: form.content,
          category: form.category,
          audience_type: form.audience_type,
          audience_value: form.audience_value,
          action_url: form.action_url,
          priority: form.priority,
          expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : "",
        }),
      });
      const result = await resp.json();
      if (result?.code !== 0 || !result?.data) {
        window.alert(result?.message || "保存失败");
        return;
      }
      refreshItem(result.data as NotificationEvent);
      setDialogOpen(false);
    } finally {
      setSubmitting(false);
    }
  }, [editingItem, form, refreshItem]);

  const quickAction = React.useCallback(
    async (item: NotificationEvent, action: "promote" | "extend" | "revoke" | "delete") => {
      if (action === "delete") {
        const resp = await fetch(`/api/admin/notifications/${item.uuid}`, {
          method: "DELETE",
        });
        const result = await resp.json();
        if (result?.code !== 0) {
          window.alert(result?.message || "删除失败");
          return;
        }
        removeItem(item.uuid);
        return;
      }

      const resp = await fetch(`/api/admin/notifications/${item.uuid}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          action === "extend"
            ? { action, extend_hours: 72 }
            : {
                action,
              }
        ),
      });
      const result = await resp.json();
      if (result?.code !== 0 || !result?.data) {
        window.alert(result?.message || "操作失败");
        return;
      }
      refreshItem(result.data as NotificationEvent);
    },
    [refreshItem, removeItem]
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-border/70 bg-background p-5">
          <div className="text-sm text-muted-foreground">消息总数</div>
          <div className="mt-2 text-3xl font-semibold">{stats.total}</div>
        </div>
        <div className="rounded-2xl border border-border/70 bg-background p-5">
          <div className="text-sm text-muted-foreground">进行中</div>
          <div className="mt-2 text-3xl font-semibold">{stats.active}</div>
        </div>
        <div className="rounded-2xl border border-border/70 bg-background p-5">
          <div className="text-sm text-muted-foreground">已过期</div>
          <div className="mt-2 text-3xl font-semibold">{stats.expired}</div>
        </div>
        <div className="rounded-2xl border border-border/70 bg-background p-5">
          <div className="text-sm text-muted-foreground">已撤回</div>
          <div className="mt-2 text-3xl font-semibold">{stats.revoked}</div>
        </div>
      </section>

      <section className="rounded-[28px] border border-border/70 bg-background p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "全部" },
              { key: "active", label: "进行中" },
              { key: "expired", label: "已过期" },
              { key: "revoked", label: "已撤回" },
            ].map((tab) => (
              <Button
                key={tab.key}
                type="button"
                size="sm"
                variant={filter === tab.key ? "default" : "outline"}
                onClick={() => setFilter(tab.key as ManagerFilter)}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          <Button type="button" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            新建消息
          </Button>
        </div>

        <div className="mt-5 grid gap-4">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <div
                key={item.uuid}
                className="rounded-2xl border border-border/70 bg-muted/10 p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={getStatusClass(item)}>{getStatusText(item)}</Badge>
                      <Badge variant="outline">{describeCategory(item.category)}</Badge>
                      <Badge variant="outline">{describeType(item.type)}</Badge>
                      <Badge variant="outline">{item.priority === "high" ? "高优先级" : item.priority === "low" ? "低优先级" : "普通优先级"}</Badge>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">{item.title}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {item.content || "暂无正文"}
                      </div>
                    </div>
                    <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-4">
                      <div>范围：{describeAudience(item.audience_type, item.audience_value)}</div>
                      <div>创建：{formatDateTime(item.created_at)}</div>
                      <div>过期：{formatDateTime(item.expires_at)}</div>
                      <div>跳转：{item.action_url || "—"}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start">
                    <Button type="button" variant="outline" size="sm" onClick={() => openView(item)}>
                      <Eye className="h-4 w-4" />
                      查看
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => openEdit(item)}>
                      <Pencil className="h-4 w-4" />
                      编辑
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="outline" size="sm">
                          管理
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => void quickAction(item, "promote")}>
                          <Megaphone className="h-4 w-4" />
                          加大权重
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => void quickAction(item, "extend")}>
                          <CalendarClock className="h-4 w-4" />
                          延长保质期
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(item)}>
                          <Pencil className="h-4 w-4" />
                          更改内容
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => void quickAction(item, "revoke")}>
                          <MoreHorizontal className="h-4 w-4" />
                          撤回消息
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => void quickAction(item, "delete")}
                        >
                          <Trash2 className="h-4 w-4" />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border/70 px-4 py-12 text-center text-sm text-muted-foreground">
              当前筛选下暂无消息
            </div>
          )}
        </div>
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? "编辑消息" : "新建消息"}</DialogTitle>
            <DialogDescription>支持设置过期时间，过期后前台自动不再展示。</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="notification-title">标题</Label>
              <Input
                id="notification-title"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notification-content">内容</Label>
              <Textarea
                id="notification-content"
                rows={5}
                value={form.content}
                onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="notification-category">分类</Label>
                <select
                  id="notification-category"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={form.category}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      category: event.target.value as NotificationFormState["category"],
                    }))
                  }
                >
                  <option value="system">系统</option>
                  <option value="interaction">互动</option>
                  <option value="review">审核</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notification-priority">优先级</Label>
                <select
                  id="notification-priority"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={form.priority}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      priority: event.target.value as NotificationFormState["priority"],
                    }))
                  }
                >
                  <option value="low">低</option>
                  <option value="normal">普通</option>
                  <option value="high">高</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notification-audience">发送范围</Label>
                <select
                  id="notification-audience"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={form.audience_type}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      audience_type: event.target.value as NotificationFormState["audience_type"],
                    }))
                  }
                >
                  <option value="all">全部用户</option>
                  <option value="role">指定角色</option>
                  <option value="direct">指定用户</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notification-expires">过期时间</Label>
                <Input
                  id="notification-expires"
                  type="datetime-local"
                  value={form.expires_at}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, expires_at: event.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notification-audience-value">发送对象</Label>
              <Input
                id="notification-audience-value"
                value={form.audience_value}
                placeholder="role 填 user/artisan/admin，direct 填用户 UUID"
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, audience_value: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notification-url">跳转链接</Label>
              <Input
                id="notification-url"
                value={form.action_url}
                placeholder={`例如 /${locale}/home`}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, action_url: event.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button type="button" onClick={() => void submitForm()} disabled={submitting}>
              {submitting ? "保存中..." : editingItem ? "保存修改" : "发送消息"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>消息详情</DialogTitle>
            <DialogDescription>查看消息内容和当前状态。</DialogDescription>
          </DialogHeader>

          {viewingItem ? (
            <div className="grid gap-4 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">标题</div>
                <div className="mt-1 text-base font-semibold">{viewingItem.title}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">内容</div>
                <div className="mt-1 whitespace-pre-wrap rounded-xl border border-border/70 bg-muted/20 p-3">
                  {viewingItem.content || "暂无正文"}
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>分类：{describeCategory(viewingItem.category)}</div>
                <div>类型：{describeType(viewingItem.type)}</div>
                <div>范围：{describeAudience(viewingItem.audience_type, viewingItem.audience_value)}</div>
                <div>优先级：{viewingItem.priority || "normal"}</div>
                <div>创建时间：{formatDateTime(viewingItem.created_at)}</div>
                <div>过期时间：{formatDateTime(viewingItem.expires_at)}</div>
                <div className="md:col-span-2">跳转链接：{viewingItem.action_url || "—"}</div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
