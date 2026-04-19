"use client";

import * as React from "react";
import {
  Archive,
  Check,
  ChevronDown,
  Clock3,
  Eye,
  Filter,
  Mail,
  Megaphone,
  Pencil,
  Search,
  Trash2,
  User,
} from "lucide-react";
import type { FeedbackItem, FeedbackPriority, FeedbackStatus } from "@/types/feedback";
import { Badge } from "@/components/ui/badge";
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

type ManagerFilter = "all" | "new" | "in_progress" | "resolved" | "closed";
type SourceFilter = "all" | "home_ai_chat" | "home_general";
type PriorityFilter = "all" | "normal" | "high" | "urgent";

type FeedbackFormState = {
  content: string;
  contact: string;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  admin_note: string;
};

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

function describeStatus(status: FeedbackStatus) {
  if (status === "in_progress") return "处理中";
  if (status === "resolved") return "已解决";
  if (status === "closed") return "已关闭";
  return "待处理";
}

function statusClass(status: FeedbackStatus) {
  if (status === "resolved") return "bg-emerald-600 text-white";
  if (status === "closed") return "bg-zinc-700 text-white";
  if (status === "in_progress") return "bg-amber-500 text-white";
  return "bg-sky-600 text-white";
}

function describePriority(priority: FeedbackPriority) {
  if (priority === "urgent") return "紧急";
  if (priority === "high") return "高";
  return "普通";
}

function priorityClass(priority: FeedbackPriority) {
  if (priority === "urgent") return "border-red-500 text-red-600";
  if (priority === "high") return "border-amber-500 text-amber-600";
  return "border-border text-muted-foreground";
}

function describeSource(source: FeedbackItem["source"]) {
  return source === "home_general" ? "首页反馈" : "AI 聊天";
}

function toForm(item?: FeedbackItem): FeedbackFormState {
  return {
    content: item?.content || "",
    contact: item?.contact || "",
    status: item?.status || "new",
    priority: item?.priority || "normal",
    admin_note: item?.admin_note || "",
  };
}

export function AdminFeedbackManager({
  initialItems,
}: {
  initialItems: FeedbackItem[];
}) {
  const [items, setItems] = React.useState<FeedbackItem[]>(initialItems);
  const [filter, setFilter] = React.useState<ManagerFilter>("all");
  const [sourceFilter, setSourceFilter] = React.useState<SourceFilter>("all");
  const [priorityFilter, setPriorityFilter] = React.useState<PriorityFilter>("all");
  const [keyword, setKeyword] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [submitting, setSubmitting] = React.useState(false);
  const [batchSubmitting, setBatchSubmitting] = React.useState(false);
  const [viewDialogOpen, setViewDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [viewingItem, setViewingItem] = React.useState<FeedbackItem | null>(null);
  const [editingItem, setEditingItem] = React.useState<FeedbackItem | null>(null);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [form, setForm] = React.useState<FeedbackFormState>(toForm());

  const filteredItems = React.useMemo(() => {
    const query = keyword.trim().toLowerCase();
    return items.filter((item) => {
      if (filter !== "all" && item.status !== filter) return false;
      if (sourceFilter !== "all" && item.source !== sourceFilter) return false;
      if (priorityFilter !== "all" && item.priority !== priorityFilter) return false;
      if (!query) return true;

      const haystack = [
        item.content,
        item.user_nickname,
        item.user_email,
        item.contact,
        item.admin_note,
        item.uuid,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [filter, items, keyword, priorityFilter, sourceFilter]);

  const pageSize = 12;

  const totalPages = React.useMemo(
    () => Math.max(1, Math.ceil(filteredItems.length / pageSize)),
    [filteredItems.length]
  );

  const pagedItems = React.useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, totalPages]);

  const stats = React.useMemo(
    () => ({
      total: items.length,
      newCount: items.filter((item) => item.status === "new").length,
      progressCount: items.filter((item) => item.status === "in_progress").length,
      resolvedCount: items.filter((item) => item.status === "resolved").length,
      closedCount: items.filter((item) => item.status === "closed").length,
      urgentCount: items.filter((item) => item.priority === "urgent").length,
      aiCount: items.filter((item) => item.source === "home_ai_chat").length,
      homeCount: items.filter((item) => item.source === "home_general").length,
      recentCount: items.filter((item) => {
        const ts = new Date(String(item.created_at || "")).getTime();
        return !Number.isNaN(ts) && Date.now() - ts <= 24 * 60 * 60 * 1000;
      }).length,
    }),
    [items]
  );

  const resolvedRate = React.useMemo(() => {
    if (items.length === 0) return 0;
    return Math.round(((stats.resolvedCount + stats.closedCount) / items.length) * 100);
  }, [items.length, stats.closedCount, stats.resolvedCount]);

  React.useEffect(() => {
    setPage(1);
  }, [filter, keyword, priorityFilter, sourceFilter]);

  React.useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => items.some((item) => item.uuid === id)));
  }, [items]);

  React.useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const refreshItem = React.useCallback((nextItem: FeedbackItem) => {
    setItems((prev) => [nextItem, ...prev.filter((item) => item.uuid !== nextItem.uuid)]);
  }, []);

  const removeItem = React.useCallback((uuid: string) => {
    setItems((prev) => prev.filter((item) => item.uuid !== uuid));
  }, []);

  const mergeItems = React.useCallback((nextItems: FeedbackItem[]) => {
    setItems((prev) => {
      const map = new Map(prev.map((item) => [item.uuid, item]));
      for (const item of nextItems) {
        map.set(item.uuid, item);
      }
      return Array.from(map.values()).sort((a, b) => {
        const bTime = new Date(String(b.created_at || "")).getTime() || 0;
        const aTime = new Date(String(a.created_at || "")).getTime() || 0;
        return bTime - aTime;
      });
    });
  }, []);

  const openView = React.useCallback((item: FeedbackItem) => {
    setViewingItem(item);
    setViewDialogOpen(true);
  }, []);

  const openEdit = React.useCallback((item: FeedbackItem) => {
    setEditingItem(item);
    setForm(toForm(item));
    setEditDialogOpen(true);
  }, []);

  const submitForm = React.useCallback(async () => {
    if (!editingItem) return;
    if (!form.content.trim()) {
      window.alert("反馈内容不能为空");
      return;
    }

    try {
      setSubmitting(true);
      const resp = await fetch(`/api/admin/feedback/${editingItem.uuid}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: form.content,
          contact: form.contact,
          status: form.status,
          priority: form.priority,
          admin_note: form.admin_note,
        }),
      });
      const result = await resp.json();
      if (result?.code !== 0 || !result?.data) {
        window.alert(result?.message || "保存失败");
        return;
      }
      refreshItem(result.data as FeedbackItem);
      setEditDialogOpen(false);
    } finally {
      setSubmitting(false);
    }
  }, [editingItem, form, refreshItem]);

  const quickAction = React.useCallback(
    async (item: FeedbackItem, action: "promote" | "start" | "resolve" | "close" | "delete") => {
      if (action === "delete") {
        const resp = await fetch(`/api/admin/feedback/${item.uuid}`, {
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

      const resp = await fetch(`/api/admin/feedback/${item.uuid}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
        }),
      });
      const result = await resp.json();
      if (result?.code !== 0 || !result?.data) {
        window.alert(result?.message || "操作失败");
        return;
      }
      refreshItem(result.data as FeedbackItem);
    },
    [refreshItem, removeItem]
  );

  const toggleSelect = React.useCallback((uuid: string) => {
    setSelectedIds((prev) =>
      prev.includes(uuid) ? prev.filter((item) => item !== uuid) : [...prev, uuid]
    );
  }, []);

  const pageIds = React.useMemo(() => pagedItems.map((item) => item.uuid), [pagedItems]);
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((uuid) => selectedIds.includes(uuid));

  const toggleSelectAllPage = React.useCallback(() => {
    setSelectedIds((prev) => {
      if (pageIds.every((uuid) => prev.includes(uuid))) {
        return prev.filter((uuid) => !pageIds.includes(uuid));
      }
      return Array.from(new Set([...prev, ...pageIds]));
    });
  }, [pageIds]);

  const runBatchAction = React.useCallback(
    async (action: "promote" | "start" | "resolve" | "close" | "delete") => {
      if (selectedIds.length === 0) return;

      try {
        setBatchSubmitting(true);
        const resp = await fetch("/api/admin/feedback/batch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            ids: selectedIds,
          }),
        });
        const result = await resp.json();
        if (result?.code !== 0) {
          window.alert(result?.message || "批量操作失败");
          return;
        }

        if (action === "delete") {
          setItems((prev) => prev.filter((item) => !selectedIds.includes(item.uuid)));
        } else if (Array.isArray(result?.data)) {
          mergeItems(result.data as FeedbackItem[]);
        }

        setSelectedIds([]);
      } finally {
        setBatchSubmitting(false);
      }
    },
    [mergeItems, selectedIds]
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-border/70 bg-background p-5">
          <div className="text-sm text-muted-foreground">反馈总数</div>
          <div className="mt-2 text-3xl font-semibold">{stats.total}</div>
        </div>
        <div className="rounded-2xl border border-border/70 bg-background p-5">
          <div className="text-sm text-muted-foreground">待处理</div>
          <div className="mt-2 text-3xl font-semibold">{stats.newCount}</div>
        </div>
        <div className="rounded-2xl border border-border/70 bg-background p-5">
          <div className="text-sm text-muted-foreground">处理中</div>
          <div className="mt-2 text-3xl font-semibold">{stats.progressCount}</div>
        </div>
        <div className="rounded-2xl border border-border/70 bg-background p-5">
          <div className="text-sm text-muted-foreground">已解决</div>
          <div className="mt-2 text-3xl font-semibold">{stats.resolvedCount}</div>
        </div>
        <div className="rounded-2xl border border-border/70 bg-background p-5">
          <div className="text-sm text-muted-foreground">已关闭</div>
          <div className="mt-2 text-3xl font-semibold">{stats.closedCount}</div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <div className="rounded-[28px] border border-border/70 bg-background p-5 shadow-sm md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-base font-medium">处理概览</div>
              <div className="text-sm text-muted-foreground">观察处理进度与积压情况</div>
            </div>
            <Badge variant="outline">完成率 {resolvedRate}%</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-muted/30 p-4">
              <div className="text-sm text-muted-foreground">24 小时新增</div>
              <div className="mt-2 text-2xl font-semibold">{stats.recentCount}</div>
            </div>
            <div className="rounded-2xl bg-muted/30 p-4">
              <div className="text-sm text-muted-foreground">紧急反馈</div>
              <div className="mt-2 text-2xl font-semibold">{stats.urgentCount}</div>
            </div>
            <div className="rounded-2xl bg-muted/30 p-4">
              <div className="text-sm text-muted-foreground">处理中</div>
              <div className="mt-2 text-2xl font-semibold">{stats.progressCount}</div>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-border/70 bg-background p-5 shadow-sm md:p-6">
          <div className="mb-4">
            <div className="text-base font-medium">来源分布</div>
            <div className="text-sm text-muted-foreground">区分 AI 聊天与首页反馈</div>
          </div>
          <div className="space-y-4">
            {[
              {
                label: "AI 聊天",
                count: stats.aiCount,
                color: "bg-[#24433c]",
              },
              {
                label: "首页反馈",
                count: stats.homeCount,
                color: "bg-[#7c5c2b]",
              },
            ].map((item) => {
              const ratio = items.length > 0 ? Math.round((item.count / items.length) * 100) : 0;
              return (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{item.label}</span>
                    <span className="text-muted-foreground">
                      {item.count} / {ratio}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${ratio}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-border/70 bg-background p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "全部" },
              { key: "new", label: "待处理" },
              { key: "in_progress", label: "处理中" },
              { key: "resolved", label: "已解决" },
              { key: "closed", label: "已关闭" },
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

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="搜索反馈内容、用户、邮箱、联系方式"
                className="pl-9"
              />
            </div>
            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm"
                value={sourceFilter}
                onChange={(event) => setSourceFilter(event.target.value as SourceFilter)}
              >
                <option value="all">全部来源</option>
                <option value="home_ai_chat">AI 聊天</option>
                <option value="home_general">首页反馈</option>
              </select>
            </div>
            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm"
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value as PriorityFilter)}
              >
                <option value="all">全部优先级</option>
                <option value="normal">普通</option>
                <option value="high">高</option>
                <option value="urgent">紧急</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 text-sm">
              <button
                type="button"
                onClick={toggleSelectAllPage}
                className="inline-flex h-5 w-5 items-center justify-center rounded border border-border bg-background"
              >
                {allPageSelected ? <Check className="h-3.5 w-3.5" /> : null}
              </button>
              <span className="text-muted-foreground">
                已选 {selectedIds.length} 条
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={selectedIds.length === 0 || batchSubmitting}
                onClick={() => void runBatchAction("start")}
              >
                批量处理中
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={selectedIds.length === 0 || batchSubmitting}
                onClick={() => void runBatchAction("resolve")}
              >
                批量解决
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={selectedIds.length === 0 || batchSubmitting}
                onClick={() => void runBatchAction("promote")}
              >
                批量提级
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={selectedIds.length === 0 || batchSubmitting}
                onClick={() => void runBatchAction("close")}
              >
                批量关闭
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={selectedIds.length === 0 || batchSubmitting}
                onClick={() => {
                  if (
                    !window.confirm(
                      `确定批量删除已选的 ${selectedIds.length} 条反馈？此操作不可恢复。`
                    )
                  ) {
                    return;
                  }
                  void runBatchAction("delete");
                }}
              >
                批量删除
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          {pagedItems.length > 0 ? (
            pagedItems.map((item) => (
              <div
                key={item.uuid}
                className="rounded-2xl border border-border/70 bg-muted/10 p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => toggleSelect(item.uuid)}
                      className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border border-border bg-background"
                    >
                      {selectedIds.includes(item.uuid) ? <Check className="h-3.5 w-3.5" /> : null}
                    </button>
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={statusClass(item.status)}>{describeStatus(item.status)}</Badge>
                      <Badge variant="outline" className={priorityClass(item.priority)}>
                        {describePriority(item.priority)}
                      </Badge>
                      <Badge variant="outline">{describeSource(item.source)}</Badge>
                      <Badge variant="outline">{item.locale || "未指定语言"}</Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="line-clamp-3 text-sm leading-6 text-foreground">
                        {item.content}
                      </div>
                      <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{item.user_nickname || "匿名用户"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>{item.user_email || item.contact || "未留联系方式"}</span>
                        </div>
                        <div>提交：{formatDateTime(item.created_at)}</div>
                        <div>处理：{formatDateTime(item.resolved_at || item.updated_at)}</div>
                      </div>
                    </div>

                    {item.admin_note ? (
                      <div className="rounded-xl border border-border/70 bg-background/70 px-3 py-2 text-sm text-muted-foreground">
                        处理备注：{item.admin_note}
                      </div>
                    ) : null}
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
                          提升优先级
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => void quickAction(item, "start")}>
                          <Clock3 className="h-4 w-4" />
                          标记处理中
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => void quickAction(item, "resolve")}>
                          <Check className="h-4 w-4" />
                          标记已解决
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => void quickAction(item, "close")}>
                          <Archive className="h-4 w-4" />
                          关闭反馈
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
              当前筛选下暂无反馈
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            共 {filteredItems.length} 条，当前第 {Math.min(page, totalPages)} / {totalPages} 页
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              上一页
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            >
              下一页
            </Button>
          </div>
        </div>
      </section>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>反馈详情</DialogTitle>
            <DialogDescription>查看提交内容、用户信息和上下文快照。</DialogDescription>
          </DialogHeader>

          {viewingItem ? (
            <div className="space-y-4 text-sm">
              <div className="grid gap-3 md:grid-cols-2">
                <div>状态：{describeStatus(viewingItem.status)}</div>
                <div>优先级：{describePriority(viewingItem.priority)}</div>
                <div>来源：{describeSource(viewingItem.source)}</div>
                <div>语言：{viewingItem.locale || "—"}</div>
                <div>用户昵称：{viewingItem.user_nickname || "匿名用户"}</div>
                <div>用户邮箱：{viewingItem.user_email || "—"}</div>
                <div>联系信息：{viewingItem.contact || "—"}</div>
                <div>提交时间：{formatDateTime(viewingItem.created_at)}</div>
              </div>

              <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                <div className="mb-2 font-medium">反馈内容</div>
                <div className="whitespace-pre-wrap text-muted-foreground">
                  {viewingItem.content}
                </div>
              </div>

              <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                <div className="mb-2 font-medium">处理备注</div>
                <div className="whitespace-pre-wrap text-muted-foreground">
                  {viewingItem.admin_note || "暂无备注"}
                </div>
              </div>

              <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                <div className="mb-2 font-medium">上下文</div>
                <pre className="overflow-x-auto whitespace-pre-wrap break-all text-xs text-muted-foreground">
                  {JSON.stringify(viewingItem.context || {}, null, 2)}
                </pre>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>编辑反馈</DialogTitle>
            <DialogDescription>在当前页完成分派、处理和备注记录。</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="feedback-content">反馈内容</Label>
              <Textarea
                id="feedback-content"
                rows={6}
                value={form.content}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, content: event.target.value }))
                }
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="feedback-contact">联系方式</Label>
                <Input
                  id="feedback-contact"
                  value={form.contact}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, contact: event.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="feedback-priority">优先级</Label>
                <select
                  id="feedback-priority"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={form.priority}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      priority: event.target.value as FeedbackPriority,
                    }))
                  }
                >
                  <option value="normal">普通</option>
                  <option value="high">高</option>
                  <option value="urgent">紧急</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="feedback-status">状态</Label>
                <select
                  id="feedback-status"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={form.status}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      status: event.target.value as FeedbackStatus,
                    }))
                  }
                >
                  <option value="new">待处理</option>
                  <option value="in_progress">处理中</option>
                  <option value="resolved">已解决</option>
                  <option value="closed">已关闭</option>
                </select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="feedback-admin-note">处理备注</Label>
              <Textarea
                id="feedback-admin-note"
                rows={4}
                value={form.admin_note}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, admin_note: event.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
              取消
            </Button>
            <Button type="button" onClick={() => void submitForm()} disabled={submitting}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
