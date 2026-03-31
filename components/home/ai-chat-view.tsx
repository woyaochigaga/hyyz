"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { proxifyAvatarUrl } from "@/lib/avatar";
import { cn } from "@/lib/utils";
import {
  ArrowUp,
  Brain,
  Check,
  Copy,
  ImagePlus,
  LoaderCircle,
  Menu,
  MessageSquarePlus,
  PanelLeftClose,
  PanelLeft,
  RefreshCw,
  Search,
  Sparkles,
  ThumbsDown,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

type Role = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: Role;
  content: string;
  pending?: boolean;
  error?: boolean;
};

export type Conversation = {
  id: string;
  title: string;
  updatedAt: number;
  messages: ChatMessage[];
};

type AssistantStreamResult = {
  text: string;
  model?: string;
};

type AssistantReplyResult =
  AssistantStreamResult;

type UserInfoResponse = {
  code?: number;
  data?: {
    uuid?: string;
    nickname?: string;
    avatar_url?: string;
  };
};

type ChatProfile = {
  uuid: string;
  nickname: string;
  avatarUrl: string;
};

function id() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getInitials(name?: string, fallback = "U") {
  const value = String(name || "").trim();
  if (!value) return fallback;
  return value.slice(0, 1).toUpperCase();
}

function formatHistoryDateLabel(
  ts: number,
  locale: string,
  labels: { today: string; yesterday: string }
) {
  const d = new Date(ts);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startThat = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round(
    (startToday.getTime() - startThat.getTime()) / 86400000
  );
  if (diffDays === 0) return labels.today;
  if (diffDays === 1) return labels.yesterday;
  try {
    return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}

function groupByDateLabel(
  convs: Conversation[],
  locale: string,
  labels: { today: string; yesterday: string }
) {
  const map = new Map<string, Conversation[]>();
  for (const c of convs) {
    const label = formatHistoryDateLabel(c.updatedAt, locale, labels);
    const list = map.get(label) ?? [];
    list.push(c);
    map.set(label, list);
  }
  return Array.from(map.entries());
}

function normalizeStoredMessages(messages: unknown): ChatMessage[] {
  if (!Array.isArray(messages)) return [];

  return messages
    .filter((item) => item && typeof item === "object")
    .map((item: any) => ({
      id: String(item.id || ""),
      role: (item.role === "assistant" ? "assistant" : "user") as Role,
      content: String(item.content || ""),
      error: Boolean(item.error),
    }))
    .filter((item) => item.id && item.content.trim());
}

function normalizeConversationRecord(input: any): Conversation | null {
  const id = String(input?.uuid || input?.id || "").trim();
  const title = String(input?.title || "").trim();
  const updatedAtRaw = input?.updatedAt ?? input?.updated_at;
  const updatedAt =
    typeof updatedAtRaw === "number"
      ? updatedAtRaw
      : Date.parse(String(updatedAtRaw || "")) || Date.now();
  const messages = normalizeStoredMessages(input?.messages);

  if (!id || !title) return null;

  return {
    id,
    title,
    updatedAt,
    messages,
  };
}

function mergeConversations(
  localConversations: Conversation[],
  remoteConversations: Conversation[]
) {
  const map = new Map<string, Conversation>();

  for (const item of [...remoteConversations, ...localConversations]) {
    const current = map.get(item.id);
    if (!current || item.updatedAt >= current.updatedAt) {
      map.set(item.id, item);
    }
  }

  return Array.from(map.values()).sort((a, b) => b.updatedAt - a.updatedAt);
}

function HistoryPanel({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDeleteOne,
  onDeleteSelected,
  dateLabels,
  locale,
  selectionMode,
  selectedIds,
  onToggleSelectionMode,
  onToggleSelect,
  t,
}: {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDeleteOne: (id: string) => void;
  onDeleteSelected: () => void;
  dateLabels: { today: string; yesterday: string };
  locale: string;
  selectionMode: boolean;
  selectedIds: string[];
  onToggleSelectionMode: () => void;
  onToggleSelect: (id: string) => void;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
}) {
  const grouped = groupByDateLabel(conversations, locale, dateLabels);
  const selectedSet = new Set(selectedIds);
  const hasSelected = selectedIds.length > 0;

  return (
    <div className="flex h-full min-h-0 w-[280px] flex-col bg-[rgb(238,240,246)] dark:bg-[rgba(40,42,54,0.96)]">
      <div className="shrink-0 space-y-3 p-3">
        <Button
          type="button"
          onClick={onNew}
          className="h-10 w-full justify-center gap-2 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white/12 dark:text-white dark:hover:bg-white/18"
        >
          <MessageSquarePlus className="h-4 w-4" />
          {t("ai_chat.new_chat")}
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-3 pb-3">
        <div className="mb-2 flex shrink-0 items-center justify-between px-1 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
          <span>{t("ai_chat.history")}</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleSelectionMode}
              className="rounded px-2 py-1 text-[11px] text-zinc-500 transition hover:bg-black/[0.06] hover:text-zinc-700 dark:hover:bg-white/5 dark:hover:text-zinc-300"
            >
              {selectionMode
                ? t("ai_chat.selection_cancel")
                : t("ai_chat.selection_manage")}
            </button>
            {selectionMode && (
              <button
                type="button"
                onClick={onDeleteSelected}
                disabled={!hasSelected}
                className="rounded p-1 text-zinc-500 transition hover:bg-black/[0.06] hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/5 dark:hover:text-zinc-300"
                title={t("ai_chat.delete_selected")}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {conversations.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs text-zinc-500">
              {t("ai_chat.no_history")}
            </p>
          ) : (
            <Accordion type="multiple" defaultValue={grouped.map(([l]) => l)} className="space-y-1">
              {grouped.map(([label, items]) => (
                <AccordionItem
                  key={label}
                  value={label}
                  className="rounded-lg border-b-0 bg-transparent"
                >
                  <AccordionTrigger className="py-2 text-xs font-medium text-zinc-500 hover:no-underline [&[data-state=open]]:text-zinc-800 dark:text-zinc-500 dark:[&[data-state=open]]:text-zinc-200">
                    {label}
                  </AccordionTrigger>
                  <AccordionContent className="space-y-0.5 pb-2 pt-0">
                    {items.map((c) => (
                      <div
                        key={c.id}
                        className={cn(
                          "group flex w-full items-center gap-2 rounded-xl border px-2.5 py-2.5 text-sm transition-all",
                          activeId === c.id
                            ? "border-zinc-200 bg-white text-zinc-900 shadow-[0_8px_24px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                            : "border-transparent text-zinc-600 hover:border-black/[0.05] hover:bg-white/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:border-white/8 dark:hover:bg-white/[0.03] dark:hover:text-zinc-200"
                        )}
                      >
                        {selectionMode ? (
                          <button
                            type="button"
                            onClick={() => onToggleSelect(c.id)}
                            className={cn(
                              "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border transition",
                              selectedSet.has(c.id)
                                ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                                : "border-zinc-300 text-transparent dark:border-zinc-600"
                            )}
                            aria-label={t("ai_chat.select_chat")}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() =>
                            selectionMode ? onToggleSelect(c.id) : onSelect(c.id)
                          }
                          className="min-w-0 flex-1 text-left"
                        >
                          <span className="line-clamp-2">{c.title}</span>
                        </button>
                        {!selectionMode && (
                          <button
                            type="button"
                            onClick={() => onDeleteOne(c.id)}
                            className="opacity-0 transition group-hover:opacity-100 rounded p-1 text-zinc-500 hover:bg-black/[0.06] hover:text-zinc-700 dark:hover:bg-white/5 dark:hover:text-zinc-300"
                            title={t("ai_chat.delete_chat")}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </div>
    </div>
  );
}

function Composer({
  value,
  onChange,
  onSend,
  deepThinking,
  onToggleDeep,
  placeholder,
  deepLabel,
  compact,
  sending,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  deepThinking: boolean;
  onToggleDeep: () => void;
  placeholder: string;
  deepLabel: string;
  compact?: boolean;
  sending?: boolean;
}) {
  const taRef = React.useRef<HTMLTextAreaElement | null>(null);

  const submit = () => {
    onSend();
    requestAnimationFrame(() => taRef.current?.focus());
  };

  return (
    <div
      className={cn(
        "rounded-2xl bg-[rgba(255,255,255,0.78)] p-3 shadow-[0_12px_48px_rgba(15,23,42,0.09),0_1px_0_rgba(255,255,255,0.9)_inset] backdrop-blur-xl dark:bg-[rgba(50,52,66,0.52)] dark:shadow-[0_18px_56px_rgba(6,8,16,0.42),0_1px_0_rgba(255,255,255,0.06)_inset]",
        compact ? "max-w-3xl" : "max-w-2xl w-full"
      )}
    >
      <div className="flex gap-2">
        <Search className="mt-1.5 h-5 w-5 shrink-0 text-zinc-400 dark:text-zinc-500" />
        <Textarea
          ref={taRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !sending) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder}
          rows={compact ? 2 : 3}
          disabled={sending}
          className="min-h-[60px] resize-none border-0 bg-transparent px-0 py-1 text-base text-zinc-900 shadow-none placeholder:text-zinc-400 outline-none focus:border-0 focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 dark:text-zinc-100 dark:placeholder:text-zinc-500 md:min-h-[72px]"
        />
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onToggleDeep}
          disabled={sending}
          className={cn(
            "gap-1.5 rounded-full text-zinc-600 hover:bg-black/[0.04] hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-200",
            deepThinking && "bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary"
          )}
        >
          <Brain className="h-4 w-4" />
          {deepLabel}
        </Button>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="rounded-full text-zinc-600 hover:bg-black/[0.04] hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-200"
            onClick={() => toast.message("图片上传待接入")}
            disabled={sending}
          >
            <ImagePlus className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            size="icon"
            className="h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
            disabled={!value.trim() || sending}
            onClick={submit}
          >
            {sending ? (
              <LoaderCircle className="h-5 w-5 animate-spin" />
            ) : (
              <ArrowUp className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AiChatView({ locale }: { locale: string }) {
  const t = useTranslations("home");
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [desktopHistoryOpen, setDesktopHistoryOpen] = React.useState(true);
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [input, setInput] = React.useState("");
  const [deepThinking, setDeepThinking] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const [serverUserUuid, setServerUserUuid] = React.useState<string | null>(null);
  const [currentUser, setCurrentUser] = React.useState<ChatProfile | null>(null);
  const [selectionMode, setSelectionMode] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const storageKey = React.useMemo(
    () => `home-ai-chat:${locale}`,
    [locale]
  );
  const hydratedRef = React.useRef(false);

  const active =
    conversations.find((c) => c.id === activeId) ?? null;
  const messages = active?.messages ?? [];
  const hasStarted = messages.length > 0;

  const dateLabels = {
    today: t("ai_chat.date_today"),
    yesterday: t("ai_chat.date_yesterday"),
  };

  const scrollToBottom = () => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  React.useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      let localConversations: Conversation[] = [];
      let localActiveId: string | null = null;

      try {
        const raw = window.localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw) as {
            conversations?: Conversation[];
            activeId?: string | null;
          };

          if (Array.isArray(parsed.conversations)) {
            localConversations = parsed.conversations
              .map((item) => normalizeConversationRecord(item))
              .filter(Boolean) as Conversation[];
          }

          if (typeof parsed.activeId === "string" || parsed.activeId === null) {
            localActiveId = parsed.activeId ?? null;
          }
        }
      } catch {
        // ignore invalid local cache
      }

      if (cancelled) return;

      setConversations(localConversations);
      setActiveId(localActiveId);
      hydratedRef.current = true;

      try {
        const userResp = await fetch("/api/get-user-info", {
          method: "POST",
        });
        const userResult = (await userResp.json()) as UserInfoResponse;
        const userUuid = String(userResult?.data?.uuid || "").trim();
        const nickname = String(userResult?.data?.nickname || "").trim();
        const avatarUrl = String(userResult?.data?.avatar_url || "").trim();

        if (!userUuid || cancelled) {
          setServerUserUuid(null);
          setCurrentUser(null);
          return;
        }

        setServerUserUuid(userUuid);
        setCurrentUser({
          uuid: userUuid,
          nickname: nickname || "User",
          avatarUrl,
        });

        const remoteResp = await fetch("/api/home/ai-chat/conversations");
        const remoteResult = await remoteResp.json();
        const remoteConversations = Array.isArray(remoteResult?.data)
          ? remoteResult.data
              .map((item: any) => normalizeConversationRecord(item))
              .filter(Boolean)
          : [];

        if (cancelled) return;

        const mergedConversations = mergeConversations(
          localConversations,
          remoteConversations as Conversation[]
        );
        const nextActiveId = mergedConversations.some(
          (item) => item.id === localActiveId
        )
          ? localActiveId
          : mergedConversations[0]?.id || null;

        setConversations(mergedConversations);
        setActiveId(nextActiveId);

        if (mergedConversations.length > 0) {
          await fetch("/api/home/ai-chat/conversations", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              conversations: mergedConversations.map((item) => ({
                uuid: item.id,
                title: item.title,
                locale,
                updated_at: new Date(item.updatedAt).toISOString(),
                created_at: new Date(item.updatedAt).toISOString(),
                messages: item.messages
                  .filter((msg) => !msg.pending)
                  .map(({ id, role, content, error }) => ({
                    id,
                    role,
                    content,
                    error,
                  })),
              })),
            }),
          });
        }
      } catch {
        setServerUserUuid(null);
        setCurrentUser(null);
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [locale, storageKey]);

  const persistConversation = React.useCallback(
    async (conversation: Conversation) => {
      if (!serverUserUuid) return;

      const normalizedMessages = conversation.messages
        .filter((msg) => !msg.pending && msg.content.trim())
        .map(({ id, role, content, error }) => ({
          id,
          role,
          content,
          error,
        }));

      if (normalizedMessages.length === 0) return;

      const updatedAtIso = new Date(conversation.updatedAt).toISOString();

      await fetch("/api/home/ai-chat/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversation: {
            uuid: conversation.id,
            title: conversation.title,
            locale,
            created_at: updatedAtIso,
            updated_at: updatedAtIso,
            messages: normalizedMessages,
          },
        }),
      });
    },
    [locale, serverUserUuid]
  );

  const deleteConversations = React.useCallback(
    async (ids: string[]) => {
      if (!serverUserUuid || ids.length === 0) return;

      await fetch("/api/home/ai-chat/conversations", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ids,
        }),
      });
    },
    [serverUserUuid]
  );

  React.useEffect(() => {
    try {
      if (!hydratedRef.current) return;
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({ conversations, activeId })
      );
    } catch {
      // ignore localStorage errors
    }
  }, [activeId, conversations, storageKey]);

  const buildRequestMessages = React.useCallback(
    (chatMessages: ChatMessage[]) =>
      chatMessages
        .filter(
          (item) =>
            !item.pending &&
            (item.role === "user" || item.role === "assistant") &&
            item.content.trim()
        )
        .map((item) => ({
          role: item.role,
          content: item.content,
        })),
    []
  );

  const requestAssistantReply = React.useCallback(
    async (
      chatMessages: ChatMessage[],
      onDelta?: (text: string) => void
    ): Promise<AssistantReplyResult> => {
      const response = await fetch("/api/home/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: buildRequestMessages(chatMessages),
          locale,
          deepThinking,
        }),
      });

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const result = await response.json();
        throw new Error(result.message || t("ai_chat.request_failed"));
      }

      if (!response.body) {
        throw new Error(t("ai_chat.request_failed"));
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let text = "";
      let model = "";

      const parseEvent = (raw: string) => {
        const lines = raw.split("\n");
        let event = "message";
        const dataLines: string[] = [];

        for (const line of lines) {
          if (line.startsWith("event:")) {
            event = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            dataLines.push(line.slice(5).trim());
          }
        }

        if (dataLines.length === 0) return;
        const payload = JSON.parse(dataLines.join("\n"));

        if (event === "delta") {
          const delta = String(payload.text || "");
          text += delta;
          onDelta?.(text);
          return { type: "delta" as const, text };
        }

        if (event === "start") {
          model = String(payload.model || "");
          return { type: "start" as const, model };
        }

        if (event === "error") {
          throw new Error(String(payload.message || t("ai_chat.request_failed")));
        }

        if (event === "done") {
          if (payload.model) {
            model = String(payload.model);
          }
          return { type: "done" as const, text, model };
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const rawEvent of events) {
          const parsed = parseEvent(rawEvent);
          if (!parsed) continue;

          if (parsed.type === "delta") {
            continue;
          }
        }
      }

      return { text, model };
    },
    [buildRequestMessages, deepThinking, locale, t]
  );

  const replaceMessage = React.useCallback(
    (convId: string, messageId: string, updater: (msg: ChatMessage) => ChatMessage) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? {
                ...c,
                updatedAt: Date.now(),
                messages: c.messages.map((m) =>
                  m.id === messageId ? updater(m) : m
                ),
              }
            : c
        )
      );
    },
    []
  );

  const ensureActiveConversation = (): string => {
    if (activeId && conversations.some((c) => c.id === activeId)) {
      return activeId;
    }
    const newId = id();
    const conv: Conversation = {
      id: newId,
      title: t("ai_chat.new_chat"),
      updatedAt: Date.now(),
      messages: [],
    };
    setConversations((prev) => [conv, ...prev]);
    setActiveId(newId);
    return newId;
  };

  const handleNewChat = () => {
    if (isSending) return;
    const newId = id();
    setConversations((prev) => {
      const next: Conversation = {
        id: newId,
        title: t("ai_chat.new_chat"),
        updatedAt: Date.now(),
        messages: [],
      };
      return [next, ...prev];
    });
    setActiveId(newId);
    setInput("");
    setDrawerOpen(false);
  };

  const handleSelect = (convId: string) => {
    if (isSending) return;
    setActiveId(convId);
    setDrawerOpen(false);
  };

  const handleDeleteConversation = React.useCallback(
    (ids: string[]) => {
      if (isSending || ids.length === 0) return;

      const idSet = new Set(ids);
      const remain = conversations.filter((item) => !idSet.has(item.id));
      const nextActiveId =
        activeId && idSet.has(activeId)
          ? remain[0]?.id || null
          : activeId;

      setConversations(remain);
      setActiveId(nextActiveId);
      setSelectedIds((prev) => prev.filter((id) => !idSet.has(id)));
      void deleteConversations(ids);
    },
    [activeId, conversations, deleteConversations, isSending]
  );

  const handleDeleteOne = React.useCallback(
    (id: string) => {
      if (!id) return;
      handleDeleteConversation([id]);
    },
    [handleDeleteConversation]
  );

  const handleDeleteSelected = React.useCallback(() => {
    if (selectedIds.length === 0) return;
    handleDeleteConversation(selectedIds);
    setSelectionMode(false);
  }, [handleDeleteConversation, selectedIds]);

  const handleToggleSelect = React.useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const handleToggleSelectionMode = React.useCallback(() => {
    setSelectionMode((prev) => !prev);
    setSelectedIds([]);
  }, []);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    const convId = ensureActiveConversation();
    const userMsg: ChatMessage = { id: id(), role: "user", content: text };
    const assistantId = id();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      pending: true,
    };
    const title =
      text.length > 28 ? `${text.slice(0, 28)}…` : text || t("ai_chat.new_chat");

    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? {
              ...c,
              title: c.messages.length === 0 ? title : c.title,
              updatedAt: Date.now(),
              messages: [...c.messages, userMsg, assistantMsg],
            }
          : c
      )
    );
    setInput("");
    setIsSending(true);

    const requestMessages = [...messages, userMsg];

    try {
      const reply = await requestAssistantReply(requestMessages, (partial) => {
        replaceMessage(convId, assistantId, (msg) => ({
          ...msg,
          content: partial,
          pending: true,
          error: false,
        }));
      });

      replaceMessage(convId, assistantId, (msg) => ({
        ...msg,
        content: reply.text,
        pending: false,
        error: false,
      }));

      const finalConversation: Conversation = {
        id: convId,
        title,
        updatedAt: Date.now(),
        messages: [...requestMessages, { id: assistantId, role: "assistant", content: reply.text }],
      };
      void persistConversation(finalConversation);
    } catch (error: any) {
      const errorText = error?.message || t("ai_chat.request_failed");
      replaceMessage(convId, assistantId, (msg) => ({
        ...msg,
        content: errorText,
        pending: false,
        error: true,
      }));

      const failedConversation: Conversation = {
        id: convId,
        title,
        updatedAt: Date.now(),
        messages: [
          ...requestMessages,
          {
            id: assistantId,
            role: "assistant",
            content: errorText,
            error: true,
          },
        ],
      };
      void persistConversation(failedConversation);
      toast.error(errorText);
    } finally {
      setIsSending(false);
    }
  };

  const regenerateMessage = async (assistantId: string) => {
    if (!active || isSending) return;

    const assistantIndex = active.messages.findIndex(
      (msg) => msg.id === assistantId && msg.role === "assistant"
    );
    if (assistantIndex <= 0) return;

    const requestMessages = active.messages.slice(0, assistantIndex);
    if (!requestMessages.some((msg) => msg.role === "user")) {
      return;
    }

    setIsSending(true);
    replaceMessage(active.id, assistantId, (msg) => ({
      ...msg,
      content: "",
      pending: true,
      error: false,
    }));

    try {
      const reply = await requestAssistantReply(requestMessages, (partial) => {
        replaceMessage(active.id, assistantId, (msg) => ({
          ...msg,
          content: partial,
          pending: true,
          error: false,
        }));
      });

      replaceMessage(active.id, assistantId, (msg) => ({
        ...msg,
        content: reply.text,
        pending: false,
        error: false,
      }));

      const finalConversation: Conversation = {
        id: active.id,
        title: active.title,
        updatedAt: Date.now(),
        messages: active.messages.map((msg) =>
          msg.id === assistantId
            ? {
                id: assistantId,
                role: "assistant",
                content: reply.text,
              }
            : {
                id: msg.id,
                role: msg.role,
                content: msg.content,
                error: msg.error,
              }
        ),
      };
      void persistConversation(finalConversation);
    } catch (error: any) {
      const errorText = error?.message || t("ai_chat.request_failed");
      replaceMessage(active.id, assistantId, (msg) => ({
        ...msg,
        content: errorText,
        pending: false,
        error: true,
      }));

      const failedConversation: Conversation = {
        id: active.id,
        title: active.title,
        updatedAt: Date.now(),
        messages: active.messages.map((msg) =>
          msg.id === assistantId
            ? {
                id: assistantId,
                role: "assistant",
                content: errorText,
                error: true,
              }
            : {
                id: msg.id,
                role: msg.role,
                content: msg.content,
                error: msg.error,
              }
        ),
      };
      void persistConversation(failedConversation);
      toast.error(errorText);
    } finally {
      setIsSending(false);
    }
  };

  const suggestionCards = [
    {
      cat: t("ai_chat.suggest_1_cat"),
      text: t("ai_chat.suggest_1_text"),
      emoji: "🌧️",
    },
    {
      cat: t("ai_chat.suggest_2_cat"),
      text: t("ai_chat.suggest_2_text"),
      emoji: "😔",
    },
    {
      cat: t("ai_chat.suggest_3_cat"),
      text: t("ai_chat.suggest_3_text"),
      emoji: "💡",
    },
    {
      cat: t("ai_chat.suggest_4_cat"),
      text: t("ai_chat.suggest_4_text"),
      emoji: "❤️",
    },
  ];

  const followups = [
    t("ai_chat.followup_1"),
    t("ai_chat.followup_2"),
    t("ai_chat.followup_3"),
  ];

  const historyPanelProps = {
    conversations,
    activeId,
    onSelect: handleSelect,
    onNew: handleNewChat,
    onDeleteOne: handleDeleteOne,
    onDeleteSelected: handleDeleteSelected,
    dateLabels,
    locale,
    selectionMode,
    selectedIds,
    onToggleSelectionMode: handleToggleSelectionMode,
    onToggleSelect: handleToggleSelect,
    t,
  };

  return (
    <div
      className={cn(
        "flex w-full min-w-0 flex-col overflow-hidden rounded-2xl bg-[rgb(246,247,251)] text-zinc-900 dark:bg-[rgba(34,36,46,1)] dark:text-zinc-100",
        "h-[min(100%,calc(100dvh-5.75rem))] min-h-[480px] max-h-[calc(100dvh-5.75rem)]"
      )}
    >
      <header className="flex shrink-0 items-center justify-between gap-2 px-3 py-2">
        <div className="flex items-center gap-1">
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="text-zinc-600 hover:bg-black/[0.05] hover:text-zinc-900 lg:hidden dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[300px] border-0 bg-[rgb(238,240,246)] p-0 text-zinc-900 shadow-none dark:bg-[rgba(40,42,54,0.98)] dark:text-zinc-100 [&>button]:text-zinc-500 dark:[&>button]:text-zinc-400"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>{t("ai_chat.history")}</SheetTitle>
              </SheetHeader>
              <HistoryPanel {...historyPanelProps} />
            </SheetContent>
          </Sheet>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="hidden text-zinc-600 hover:bg-black/[0.05] hover:text-zinc-900 lg:inline-flex dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white"
            onClick={() => setDesktopHistoryOpen((o) => !o)}
            title={
              desktopHistoryOpen
                ? t("ai_chat.collapse_sidebar")
                : t("ai_chat.expand_sidebar")
            }
          >
            {desktopHistoryOpen ? (
              <PanelLeftClose className="h-5 w-5" />
            ) : (
              <PanelLeft className="h-5 w-5" />
            )}
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <div
          className={cn(
            "hidden shrink-0 overflow-hidden transition-[width] duration-200 ease-out lg:block",
            desktopHistoryOpen ? "w-[280px]" : "w-0"
          )}
        >
          <HistoryPanel {...historyPanelProps} />
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {!hasStarted ? (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-4 pt-14 pb-8">
              <h1 className="mb-10 text-center text-2xl font-semibold tracking-tight text-zinc-900 md:text-3xl dark:text-white">
                {t("ai_chat.greeting")}
              </h1>
              <Composer
                value={input}
                onChange={setInput}
                onSend={sendMessage}
                deepThinking={deepThinking}
                onToggleDeep={() => setDeepThinking((v) => !v)}
                placeholder={t("ai_chat.placeholder")}
                deepLabel={t("ai_chat.deep_thinking")}
                sending={isSending}
              />
              <div className="mt-10 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
                {suggestionCards.map((card) => (
                  <button
                    key={card.cat}
                    type="button"
                    onClick={() => {
                      setInput(card.text);
                    }}
                    className="rounded-2xl bg-[rgba(15,23,42,0.04)] p-4 text-left transition hover:bg-[rgba(15,23,42,0.07)] dark:bg-[rgba(255,255,255,0.05)] dark:hover:bg-[rgba(255,255,255,0.08)]"
                  >
                    <p className="text-xs font-medium text-zinc-500">{card.cat}</p>
                    <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-200">
                      <span className="mr-1">{card.emoji}</span>
                      {card.text}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_auto]">
                <div
                  ref={scrollRef}
                  className="min-h-0 space-y-6 overflow-y-auto px-4 py-6 lg:pr-2"
                >
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        "flex items-end gap-3",
                        m.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {m.role === "assistant" ? (
                        <div className="shrink-0">
                          <Avatar className="h-9 w-9 border border-black/5 bg-[linear-gradient(135deg,#171717,#3f3f46)] text-white shadow-[0_8px_24px_rgba(15,23,42,0.18)] dark:border-white/10">
                            <AvatarFallback className="bg-transparent text-xs font-semibold text-white">
                              AI
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      ) : null}
                      <div
                        className={cn(
                          "max-w-[min(100%,720px)] rounded-2xl px-4 py-3 text-[15px] leading-relaxed",
                          m.role === "user"
                            ? "bg-[rgba(43,95,200,0.92)] text-white shadow-[0_2px_14px_rgba(37,80,160,0.28)] dark:bg-[rgba(55,110,220,0.92)] dark:shadow-[0_2px_12px_rgba(28,64,140,0.35)]"
                            : m.error
                              ? "bg-[rgba(255,244,244,0.98)] text-red-700 shadow-[0_1px_3px_rgba(15,23,42,0.06)] dark:bg-[rgba(84,34,34,0.9)] dark:text-red-100 dark:shadow-none"
                              : "bg-[rgba(255,255,255,0.92)] text-zinc-800 shadow-[0_1px_3px_rgba(15,23,42,0.06)] dark:bg-[rgba(46,48,60,0.92)] dark:text-zinc-100 dark:shadow-none"
                        )}
                      >
                        {m.pending ? (
                          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-300">
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                            <span>{t("ai_chat.thinking")}</span>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{m.content}</p>
                        )}
                        {m.role === "assistant" && (
                          <>
                            <div className="mt-3 flex flex-wrap items-center gap-1 pt-1">
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                onClick={() => {
                                  if (!m.content) return;
                                  void navigator.clipboard.writeText(m.content);
                                  toast.success(t("ai_chat.copied"));
                                }}
                                disabled={m.pending}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                onClick={() => toast.message(t("ai_chat.feedback_thanks"))}
                              >
                                <ThumbsDown className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                onClick={() => void regenerateMessage(m.id)}
                                disabled={m.pending || isSending}
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="mt-2 text-[11px] text-zinc-500">
                              {t("ai_chat.disclaimer")}
                            </p>
                          </>
                        )}
                      </div>
                      {m.role === "user" ? (
                        <div className="shrink-0">
                          <Avatar className="h-9 w-9 border border-black/5 shadow-[0_8px_24px_rgba(15,23,42,0.12)] dark:border-white/10">
                            <AvatarImage
                              src={
                                proxifyAvatarUrl(currentUser?.avatarUrl) || undefined
                              }
                              alt={currentUser?.nickname || "User"}
                            />
                            <AvatarFallback className="bg-zinc-200 text-xs font-semibold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100">
                              {getInitials(currentUser?.nickname, "我")}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>

                <aside className="hidden w-[220px] shrink-0 px-3 py-6 lg:block">
                  <p className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
                    {t("ai_chat.followup_title")}
                  </p>
                  <ul className="space-y-2">
                    {followups.map((line) => (
                      <li key={line}>
                        <button
                          type="button"
                          onClick={() => setInput(line)}
                          className="flex w-full gap-2 rounded-lg px-2 py-2 text-left text-sm text-primary transition hover:bg-black/[0.04] dark:text-[rgba(124,168,255,0.95)] dark:hover:bg-[rgba(255,255,255,0.05)]"
                        >
                          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 opacity-70" />
                          <span>{line}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </aside>
              </div>

              <div className="shrink-0 bg-gradient-to-t from-[rgb(246,247,251)] via-[rgba(246,247,251,0.92)] to-transparent px-4 pb-5 pt-2 backdrop-blur-sm dark:from-[rgba(34,36,46,1)] dark:via-[rgba(34,36,46,0.9)]">
                <div className="mx-auto w-full max-w-3xl">
                  <Composer
                    compact
                    value={input}
                    onChange={setInput}
                    onSend={sendMessage}
                    deepThinking={deepThinking}
                    onToggleDeep={() => setDeepThinking((v) => !v)}
                    placeholder={t("ai_chat.placeholder")}
                    deepLabel={t("ai_chat.deep_thinking")}
                    sending={isSending}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
