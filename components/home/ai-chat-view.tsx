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
import {
  DEFAULT_HOME_PREFERENCES,
  type HomePreferences,
  loadHomePreferences,
} from "@/lib/home-preferences";
import { cn } from "@/lib/utils";
import {
  ArrowUp,
  Brain,
  Check,
  Copy,
  ChevronDown,
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
import type { AiChatConversation } from "@/types/ai-chat";

type Role = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: Role;
  content: string;
  reasoning?: string;
  model?: string;
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
  reasoning: string;
  model?: string;
};

type AssistantReplyResult =
  AssistantStreamResult;

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
      reasoning: String(item.reasoning || ""),
      model: String(item.model || ""),
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

function normalizeRemoteConversations(
  conversations: AiChatConversation[] | undefined
): Conversation[] {
  if (!Array.isArray(conversations)) return [];

  return conversations
    .map((item) => normalizeConversationRecord(item))
    .filter(Boolean) as Conversation[];
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
    <div className="flex h-full min-h-0 w-full max-w-full flex-col rounded-[22px] border border-[#9cb1ab]/16 bg-[linear-gradient(180deg,rgba(250,252,251,0.98),rgba(243,247,245,0.96))] shadow-[0_18px_48px_rgba(15,23,42,0.06)] lg:w-[280px] lg:rounded-[26px] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(28,32,33,0.98),rgba(23,27,28,0.98))]">
      <div className="shrink-0 space-y-3 p-3">
        <Button
          type="button"
          onClick={onNew}
          className="h-10 w-full justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#203b35,#31524a)] text-white shadow-[0_14px_30px_rgba(32,59,53,0.18)] hover:opacity-95 dark:bg-[linear-gradient(135deg,#4f7b6f,#6a988c)] dark:text-[#f5fbf8]"
        >
          <MessageSquarePlus className="h-4 w-4" />
          {t("ai_chat.new_chat")}
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-3 pb-3">
        <div className="mb-2 flex shrink-0 items-center justify-between px-1 text-xs font-medium uppercase tracking-[0.18em] text-[#6b827c] dark:text-[#92aea7]">
          <span>{t("ai_chat.history")}</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleSelectionMode}
              className="rounded px-2 py-1 text-[11px] text-zinc-500 transition hover:bg-black/[0.04] hover:text-zinc-700 dark:hover:bg-white/5 dark:hover:text-zinc-300"
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
                  <AccordionTrigger className="py-2 text-xs font-medium text-zinc-500 hover:no-underline [&[data-state=open]]:text-[#20312d] dark:text-zinc-500 dark:[&[data-state=open]]:text-zinc-200">
                    {label}
                  </AccordionTrigger>
                  <AccordionContent className="space-y-0.5 pb-2 pt-0">
                    {items.map((c) => (
                      <div
                        key={c.id}
                        className={cn(
                          "group flex w-full items-center gap-2 rounded-xl border px-2.5 py-2.5 text-sm transition-all",
                          activeId === c.id
                            ? "border-[#cfd8d4] bg-white text-zinc-900 shadow-[0_12px_28px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                            : "border-transparent text-zinc-600 hover:border-black/[0.04] hover:bg-white/76 hover:text-zinc-900 dark:text-zinc-400 dark:hover:border-white/8 dark:hover:bg-white/[0.03] dark:hover:text-zinc-200"
                        )}
                      >
                        {selectionMode ? (
                          <button
                            type="button"
                            onClick={() => onToggleSelect(c.id)}
                            className={cn(
                              "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border transition",
                              selectedSet.has(c.id)
                                ? "border-[#203b35] bg-[#203b35] text-white dark:border-white dark:bg-white dark:text-zinc-900"
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
  enterBehavior = "send",
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
  enterBehavior?: "send" | "newline";
}) {
  const taRef = React.useRef<HTMLTextAreaElement | null>(null);

  const submit = () => {
    onSend();
    requestAnimationFrame(() => taRef.current?.focus());
  };

  return (
    <div
      className={cn(
        "rounded-[26px] border border-[#9cb1ab]/16 bg-[linear-gradient(180deg,rgba(252,253,252,0.98),rgba(246,249,247,0.96))] p-3 shadow-[0_18px_48px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(34,38,39,0.94),rgba(28,32,33,0.92))] dark:shadow-[0_18px_56px_rgba(6,8,16,0.42)]",
        compact ? "max-w-3xl" : "max-w-2xl w-full"
      )}
    >
      <div className="flex gap-2">
        <Search className="mt-1.5 h-5 w-5 shrink-0 text-[#7f9790] dark:text-zinc-500" />
        <Textarea
          ref={taRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (
              enterBehavior === "send" &&
              e.key === "Enter" &&
              !e.shiftKey &&
              !sending
            ) {
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
            deepThinking && "bg-[#dde8e3] text-[#24433c] hover:bg-[#d6e4de] hover:text-[#24433c] dark:bg-white/10 dark:text-[#dcebe6]"
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
            className="h-10 w-10 rounded-full bg-[linear-gradient(135deg,#203b35,#31524a)] text-white shadow-[0_14px_30px_rgba(32,59,53,0.22)] hover:opacity-95 dark:bg-[linear-gradient(135deg,#4f7b6f,#6a988c)] dark:text-[#f5fbf8]"
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

export default function AiChatView({
  locale,
  initialUser = null,
  initialRemoteConversations = [],
}: {
  locale: string;
  initialUser?: ChatProfile | null;
  initialRemoteConversations?: AiChatConversation[];
}) {
  const t = useTranslations("home");
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [desktopHistoryOpen, setDesktopHistoryOpen] = React.useState(true);
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [input, setInput] = React.useState("");
  const [deepThinking, setDeepThinking] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const [serverUserUuid, setServerUserUuid] = React.useState<string | null>(
    initialUser?.uuid || null
  );
  const [currentUser, setCurrentUser] = React.useState<ChatProfile | null>(initialUser);
  const [selectionMode, setSelectionMode] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [expandedReasoningIds, setExpandedReasoningIds] = React.useState<Record<string, boolean>>({});
  const [preferences, setPreferences] = React.useState<HomePreferences>(
    DEFAULT_HOME_PREFERENCES
  );
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
    const nextPreferences = loadHomePreferences();
    setPreferences(nextPreferences);
    setDeepThinking(nextPreferences.aiDefaultDeepThinking);

    const handlePreferencesChange = (event: Event) => {
      const customEvent = event as CustomEvent<HomePreferences>;
      const next = customEvent.detail || loadHomePreferences();
      setPreferences(next);
      setDeepThinking(next.aiDefaultDeepThinking);
    };

    const handleClearHistory = () => {
      setConversations([]);
      setActiveId(null);
      setInput("");
      setSelectionMode(false);
      setSelectedIds([]);
      setExpandedReasoningIds({});
      setDeepThinking(loadHomePreferences().aiDefaultDeepThinking);
    };

    window.addEventListener("home-preferences-change", handlePreferencesChange);
    window.addEventListener("home-ai-chat-clear", handleClearHistory);
    return () => {
      window.removeEventListener("home-preferences-change", handlePreferencesChange);
      window.removeEventListener("home-ai-chat-clear", handleClearHistory);
    };
  }, []);

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
      const remoteConversations = normalizeRemoteConversations(initialRemoteConversations);
      const mergedConversations = mergeConversations(
        localConversations,
        remoteConversations
      );
      const nextActiveId = mergedConversations.some(
        (item) => item.id === localActiveId
      )
        ? localActiveId
        : mergedConversations[0]?.id || null;

      setConversations(mergedConversations);
      setActiveId(nextActiveId);
      hydratedRef.current = true;

      try {
        if (!initialUser || cancelled) {
          setServerUserUuid(null);
          setCurrentUser(null);
          return;
        }

        setServerUserUuid(initialUser.uuid);
        setCurrentUser(initialUser);

        if (preferences.syncHistoryToCloud && mergedConversations.length > 0) {
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
                  .map(({ id, role, content, reasoning, model, error }) => ({
                    id,
                    role,
                    content,
                    reasoning,
                    model,
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
  }, [initialRemoteConversations, initialUser, locale, preferences.syncHistoryToCloud, storageKey]);

  const persistConversation = React.useCallback(
    async (conversation: Conversation) => {
      if (!serverUserUuid || !preferences.syncHistoryToCloud) return;

      const normalizedMessages = conversation.messages
        .filter((msg) => !msg.pending && msg.content.trim())
        .map(({ id, role, content, reasoning, model, error }) => ({
          id,
          role,
          content,
          reasoning,
          model,
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
    [locale, preferences.syncHistoryToCloud, serverUserUuid]
  );

  const deleteConversations = React.useCallback(
    async (ids: string[]) => {
      if (!serverUserUuid || !preferences.syncHistoryToCloud || ids.length === 0) {
        return;
      }

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
    [preferences.syncHistoryToCloud, serverUserUuid]
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
      onDelta?: (state: { text: string; reasoning: string }) => void
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
      let reasoning = "";
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
          onDelta?.({ text, reasoning });
          return { type: "delta" as const, text };
        }

        if (event === "reasoning") {
          const delta = String(payload.text || "");
          reasoning += delta;
          onDelta?.({ text, reasoning });
          return { type: "reasoning" as const, text, reasoning };
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

      return { text, reasoning, model };
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

  const toggleReasoning = React.useCallback((messageId: string) => {
    setExpandedReasoningIds((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
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
          content: partial.text,
          reasoning: partial.reasoning,
          pending: true,
          error: false,
        }));
      });

      replaceMessage(convId, assistantId, (msg) => ({
        ...msg,
        content: reply.text,
        reasoning: reply.reasoning,
        model: reply.model,
        pending: false,
        error: false,
      }));

      const finalConversation: Conversation = {
        id: convId,
        title,
        updatedAt: Date.now(),
        messages: [
          ...requestMessages,
          {
            id: assistantId,
            role: "assistant",
            content: reply.text,
            reasoning: reply.reasoning,
            model: reply.model,
          },
        ],
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
          content: partial.text,
          reasoning: partial.reasoning,
          pending: true,
          error: false,
        }));
      });

      replaceMessage(active.id, assistantId, (msg) => ({
        ...msg,
        content: reply.text,
        reasoning: reply.reasoning,
        model: reply.model,
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
                reasoning: reply.reasoning,
                model: reply.model,
              }
            : {
                id: msg.id,
                role: msg.role,
                content: msg.content,
                reasoning: msg.reasoning,
                model: msg.model,
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
                reasoning: "",
                model: "",
                error: true,
              }
            : {
                id: msg.id,
                role: msg.role,
                content: msg.content,
                reasoning: msg.reasoning,
                model: msg.model,
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
       "relative flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-[24px] border border-[#94a7a1]/16 bg-[radial-gradient(circle_at_14%_18%,rgba(130,163,153,0.14),transparent_26%),radial-gradient(circle_at_86%_12%,rgba(226,232,229,0.78),transparent_24%),radial-gradient(circle_at_76%_80%,rgba(93,121,114,0.07),transparent_22%),linear-gradient(135deg,rgba(252,252,251,0.98),rgba(243,246,244,0.96)_54%,rgba(236,240,239,0.95))] text-zinc-900 shadow-[0_26px_80px_rgba(43,60,55,0.08)] sm:rounded-[30px] dark:border-[#6c827c]/16 dark:bg-[radial-gradient(circle_at_14%_18%,rgba(95,129,120,0.11),transparent_26%),radial-gradient(circle_at_86%_12%,rgba(83,102,98,0.16),transparent_22%),radial-gradient(circle_at_76%_80%,rgba(56,77,72,0.10),transparent_22%),linear-gradient(135deg,rgba(24,28,28,0.98),rgba(29,35,34,0.98)_54%,rgba(22,25,25,0.97))] dark:text-zinc-100"    )}
    >
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(108,134,126,0.24),rgba(176,188,184,0.22),transparent)] dark:bg-[linear-gradient(90deg,transparent,rgba(117,144,136,0.24),rgba(86,104,99,0.20),transparent)]" />
      <header className="flex shrink-0 flex-wrap items-start justify-between gap-3 px-4 py-4 sm:px-5 sm:py-5 lg:px-6">
        <div className="min-w-0">
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.32em] text-[#6b827c] dark:text-[#92aea7]">
            AI
          </div>
          <h1 className="text-[1.65rem] font-semibold tracking-[0.01em] text-[#20312d] sm:text-[2rem] dark:text-[#e6efec]">
            {t("ai_chat.meta_title")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5d6f6a] dark:text-[#aac0ba]">
            {t("ai_chat.greeting")}
          </p>
        </div>

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
              className="w-[calc(100vw-1rem)] max-w-[320px] border-0 bg-transparent p-2 sm:p-3 text-zinc-900 shadow-none dark:text-zinc-100 [&>button]:text-zinc-500 dark:[&>button]:text-zinc-400"
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

      <div className="flex min-h-0 flex-1 gap-3 px-3 pb-3 sm:px-4 lg:gap-4 lg:px-6 lg:pb-0">
        <div
          className={cn(
            "hidden shrink-0 overflow-hidden transition-[width] duration-200 ease-out lg:block",
            desktopHistoryOpen ? "w-[280px]" : "w-0"
          )}
        >
          <HistoryPanel {...historyPanelProps} />
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[22px] border border-[#9cb1ab]/16 bg-[linear-gradient(180deg,rgba(251,252,252,0.98),rgba(243,246,245,0.97))] shadow-[0_24px_64px_rgba(15,23,42,0.10)] sm:rounded-[26px] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(27,31,31,0.98),rgba(22,26,26,0.98))]">
          {!hasStarted ? (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-4 pb-8 pt-10 sm:pt-14">
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
                enterBehavior={preferences.enterBehavior}
              />
              <div className="mt-10 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
                {suggestionCards.map((card) => (
                  <button
                    key={card.cat}
                    type="button"
                    onClick={() => {
                      setInput(card.text);
                    }}
                    className="rounded-[22px] border border-[#d8e2de] bg-white/82 p-4 text-left shadow-[0_12px_28px_rgba(15,23,42,0.04)] transition hover:-translate-y-px hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
                  >
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#6b827c] dark:text-[#92aea7]">{card.cat}</p>
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
              <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[1fr_auto]">
                <div
                  ref={scrollRef}
                  className="min-h-0 space-y-5 overflow-y-auto overscroll-contain px-3 py-4 sm:space-y-6 sm:px-4 sm:py-6 lg:pr-2"
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
                          "max-w-[88%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed sm:max-w-[min(100%,720px)]",
                          m.role === "user"
                            ? "bg-[linear-gradient(135deg,#203b35,#31524a)] text-white shadow-[0_10px_28px_rgba(32,59,53,0.18)] dark:bg-[linear-gradient(135deg,#4f7b6f,#6a988c)] dark:text-[#f5fbf8]"
                            : m.error
                              ? "bg-[rgba(255,244,244,0.98)] text-red-700 shadow-[0_1px_3px_rgba(15,23,42,0.06)] dark:bg-[rgba(84,34,34,0.9)] dark:text-red-100 dark:shadow-none"
                              : "bg-[rgba(255,255,255,0.92)] text-zinc-800 shadow-[0_8px_24px_rgba(15,23,42,0.05)] dark:bg-[rgba(46,48,60,0.92)] dark:text-zinc-100 dark:shadow-none"
                        )}
                      >
                        {(() => {
                          const hasReasoning = m.role === "assistant" && Boolean(m.reasoning);
                          const reasoningExpanded =
                            Boolean(expandedReasoningIds[m.id]) ||
                            (preferences.aiAutoExpandReasoning && hasReasoning);

                          return (
                        <div className="space-y-3">
                          {hasReasoning ? (
                            <div className="rounded-xl border border-black/5 bg-black/[0.025] text-xs text-zinc-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300">
                              <button
                                type="button"
                                onClick={() => toggleReasoning(m.id)}
                                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
                              >
                                <span className="flex items-center gap-2 font-medium">
                                  <Brain className="h-3.5 w-3.5" />
                                  <span>{t("ai_chat.reasoning_title")}</span>
                                </span>
                                <ChevronDown
                                  className={cn(
                                    "h-3.5 w-3.5 transition-transform",
                                    reasoningExpanded ? "rotate-180" : "rotate-0"
                                  )}
                                />
                              </button>
                              {reasoningExpanded ? (
                                <div className="border-t border-black/5 px-3 py-2 dark:border-white/10">
                                  <p className="whitespace-pre-wrap">{m.reasoning}</p>
                                </div>
                              ) : null}
                            </div>
                          ) : null}

                          {m.pending ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-300">
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                                <span>
                                  {m.reasoning
                                    ? t("ai_chat.thinking_deep")
                                    : t("ai_chat.thinking")}
                                </span>
                              </div>
                              {m.content ? <p className="whitespace-pre-wrap">{m.content}</p> : null}
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap">{m.content}</p>
                          )}
                        </div>
                          );
                        })()}
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
                              {m.model ? `${m.model} · ${t("ai_chat.disclaimer")}` : t("ai_chat.disclaimer")}
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

                {preferences.aiShowFollowups ? (
                  <aside className="hidden w-[240px] shrink-0 px-3 py-6 lg:block">
                    <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-[#6b827c] dark:text-[#92aea7]">
                      {t("ai_chat.followup_title")}
                    </p>
                    <ul className="space-y-2">
                      {followups.map((line) => (
                        <li key={line}>
                          <button
                            type="button"
                            onClick={() => setInput(line)}
                            className="flex w-full gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-[#24433c] transition hover:bg-black/[0.04] dark:text-[#cfe3dd] dark:hover:bg-[rgba(255,255,255,0.05)]"
                          >
                            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 opacity-70" />
                            <span>{line}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </aside>
                ) : null}
              </div>

              {preferences.aiShowFollowups ? (
                <div className="border-t border-black/5 px-3 py-3 lg:hidden dark:border-white/10">
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[#6b827c] dark:text-[#92aea7]">
                    {t("ai_chat.followup_title")}
                  </p>
                  <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 pl-1 pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {followups.map((line) => (
                      <button
                        key={`mobile-${line}`}
                        type="button"
                        onClick={() => setInput(line)}
                        className="shrink-0 rounded-full border border-[#d8e2de] bg-white/90 px-3 py-2 text-left text-xs text-[#24433c] transition hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-[#cfe3dd] dark:hover:bg-white/[0.08]"
                      >
                        {line}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="shrink-0 bg-gradient-to-t from-[rgba(243,246,245,0.98)] via-[rgba(243,246,245,0.92)] to-transparent px-3 pb-3 pt-2 backdrop-blur-sm sm:px-4 dark:from-[rgba(27,31,31,0.98)] dark:via-[rgba(27,31,31,0.9)]">
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
                    enterBehavior={preferences.enterBehavior}
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
