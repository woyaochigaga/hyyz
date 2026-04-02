"use client";

import * as React from "react";
import { toast } from "sonner";
import Markdown from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  HomePostAiAssistConversation,
  HomePostAiAssistMessage,
  HomePostAiDecision,
  HomePostAiPatch,
  HomePostAiTargetField,
} from "@/types/home-post-ai-assist";
import { ArrowUp, Check, LoaderCircle, Sparkles, X } from "lucide-react";

type CreatorType = "text" | "image" | "video";

type PostAiAssistPanelProps = {
  locale: string;
  type: CreatorType;
  draftId: string | null;
  clearUnsavedSignal: number;
  selectedField?: HomePostAiTargetField;
  onSelectedFieldChange?: (field: HomePostAiTargetField) => void;
  variant?: "card" | "drawer";
  fields: {
    title: string;
    excerpt: string;
    content: string;
    tags: string[];
  };
  onApplyPatch: (patch: HomePostAiPatch, targetField: HomePostAiTargetField) => void;
};

const UNSAVED_STORAGE_PREFIX = "home-post-ai-assist:unsaved:";

const FIELD_LABEL: Record<HomePostAiTargetField, string> = {
  combined: "综合",
  title: "标题",
  excerpt: "导语",
  content: "内容",
  tags: "标签",
};

function createClientId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeTags(input: unknown) {
  if (!Array.isArray(input)) return [];

  return Array.from(
    new Set(
      input
        .map((item) => String(item || "").trim().replace(/^#/, ""))
        .filter(Boolean)
    )
  ).slice(0, 10);
}

function normalizePatch(input: unknown): HomePostAiPatch | undefined {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return undefined;
  }

  const raw = input as Record<string, unknown>;
  const patch: HomePostAiPatch = {};

  if (typeof raw.title === "string" && raw.title.trim()) {
    patch.title = raw.title.trim();
  }
  if (typeof raw.excerpt === "string" && raw.excerpt.trim()) {
    patch.excerpt = raw.excerpt.trim();
  }
  if (typeof raw.content === "string" && raw.content.trim()) {
    patch.content = raw.content.trim();
  }

  const tags = normalizeTags(raw.tags);
  if (tags.length > 0) {
    patch.tags = tags;
  }

  return Object.keys(patch).length > 0 ? patch : undefined;
}

function normalizeTargetField(input: unknown): HomePostAiTargetField | undefined {
  const value = String(input || "").trim();
  if (
    value === "combined" ||
    value === "title" ||
    value === "excerpt" ||
    value === "content" ||
    value === "tags"
  ) {
    return value;
  }

  return undefined;
}

function normalizeDecision(input: unknown): HomePostAiDecision | undefined {
  const value = String(input || "").trim();
  if (value === "pending" || value === "applied" || value === "rejected") {
    return value;
  }

  return undefined;
}

function buildConversationTitle(title: string) {
  return title.trim().slice(0, 80) || "小云AI操作台";
}

function createEmptyConversation(
  locale: string,
  title: string,
  post_uuid?: string
): HomePostAiAssistConversation {
  const now = new Date().toISOString();

  return {
    uuid: createClientId(),
    locale,
    post_uuid: post_uuid || "",
    title: buildConversationTitle(title),
    messages: [],
    created_at: now,
    updated_at: now,
  };
}

function normalizeMessages(input: unknown): HomePostAiAssistMessage[] {
  if (!Array.isArray(input)) return [];

  return input
    .filter((item) => item && typeof item === "object")
    .map((item: any) => ({
      id: String(item.id || "").trim(),
      role: (item.role === "assistant" ? "assistant" : "user") as
        | "assistant"
        | "user",
      content: String(item.content || "").trim(),
      target_field: normalizeTargetField(item.target_field),
      patch: normalizePatch(item.patch),
      decision: normalizeDecision(item.decision),
      decision_at: String(item.decision_at || "").trim() || undefined,
      created_at: String(item.created_at || "").trim() || undefined,
    }))
    .filter((item) => item.id && item.content);
}

function normalizeConversation(input: unknown): HomePostAiAssistConversation | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }

  const raw = input as Record<string, any>;
  const uuid = String(raw.uuid || "").trim();
  if (!uuid) return null;

  return {
    uuid,
    locale: String(raw.locale || "").trim(),
    post_uuid: String(raw.post_uuid || "").trim(),
    title: String(raw.title || "").trim() || "小云AI操作台",
    messages: normalizeMessages(raw.messages),
    created_at: String(raw.created_at || "").trim() || undefined,
    updated_at: String(raw.updated_at || "").trim() || undefined,
  };
}

function getUnsavedStorageKey(locale: string) {
  return `${UNSAVED_STORAGE_PREFIX}${locale || "default"}`;
}

function readLocalConversation(locale: string) {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(getUnsavedStorageKey(locale));
    if (!raw) return null;
    return normalizeConversation(JSON.parse(raw));
  } catch {
    return null;
  }
}

function writeLocalConversation(
  locale: string,
  conversation: HomePostAiAssistConversation
) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      getUnsavedStorageKey(locale),
      JSON.stringify(conversation)
    );
  } catch {
    // ignore localStorage failures
  }
}

function removeLocalConversation(locale: string) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(getUnsavedStorageKey(locale));
  } catch {
    // ignore localStorage failures
  }
}

function updateMessageDecision(
  conversation: HomePostAiAssistConversation,
  messageId: string,
  decision: HomePostAiDecision
) {
  const now = new Date().toISOString();
  return {
    ...conversation,
    updated_at: now,
    messages: conversation.messages.map((message) =>
      message.id === messageId
        ? {
            ...message,
            decision,
            decision_at: now,
          }
        : message
    ),
  };
}

async function fetchRemoteConversation(post_uuid: string) {
  const resp = await fetch(
    `/api/home/post/ai-assist/conversations?post_uuid=${encodeURIComponent(post_uuid)}`
  );
  const result = await resp.json();

  if (result.code !== 0) {
    throw new Error(result.message || "加载 AI 对话失败");
  }

  return normalizeConversation(result.data?.conversation);
}

async function saveRemoteConversation(
  conversation: HomePostAiAssistConversation
) {
  const resp = await fetch("/api/home/post/ai-assist/conversations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      conversation,
    }),
  });
  const result = await resp.json();

  if (result.code !== 0) {
    throw new Error(result.message || "保存 AI 对话失败");
  }

  return normalizeConversation(result.data);
}

function buildQuickPrompts(
  type: CreatorType,
  selectedField: HomePostAiTargetField
) {
  if (selectedField === "combined") {
    if (type === "video") {
      return [
        "根据我的标题和简介，补一版更完整的标题、简介和标签，我来选择是否应用。",
        "做一版更适合首页发布的视频文案组合：标题、简介、标签一起给我。",
        "保留原意，整体整理成更适合公开发布的视频信息。",
      ];
    }

    return [
      "根据我的标题，补一版内容、导语和标签，我来选择是否应用。",
      "整体整理这篇内容，给出标题、导语、正文和标签的一套建议。",
      "保留原意，但把整篇内容整理得更适合首页展示和分享。",
    ];
  }

  if (type === "video") {
    return [
      "把简介改得更利落一点，突出看点和亮点。",
      "标题更醒目一些，但不要夸张。",
      "帮我补一组更适合社区展示的标签。",
    ];
  }

  return [
    "保留原意，语气更适合公开发布。",
    "增强一点展览感和作品介绍感。",
    "更精炼，减少重复表达。",
  ];
}

function hasPatchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value.length > 0 : Boolean(String(value || "").trim());
}

function AiPatchPreview({
  patch,
  isDrawer,
}: {
  patch: HomePostAiPatch;
  isDrawer: boolean;
}) {
  const sections: Array<{
    key: keyof HomePostAiPatch;
    label: string;
    value: string | string[] | undefined;
  }> = [
    { key: "title" as const, label: FIELD_LABEL.title, value: patch.title },
    { key: "excerpt" as const, label: FIELD_LABEL.excerpt, value: patch.excerpt },
    { key: "content" as const, label: FIELD_LABEL.content, value: patch.content },
    { key: "tags" as const, label: FIELD_LABEL.tags, value: patch.tags },
  ].filter((item) => hasPatchValue(item.value));

  if (sections.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 space-y-2">
      {sections.map((section) => (
        <div
          key={section.key}
          className={cn(
            "rounded-lg border p-3",
            isDrawer
              ? "border-[#3c3c3c] bg-[#1f1f1f]"
              : "border-black/6 bg-black/[0.03] dark:border-white/10 dark:bg-white/[0.03]"
          )}
        >
          <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[#858585]">
            {section.label}
          </div>

          {section.key === "tags" && Array.isArray(section.value) ? (
            <div className="flex flex-wrap gap-1.5">
              {section.value.map((tag) => (
                <span
                  key={`${section.key}-${tag}`}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px]",
                    isDrawer
                      ? "bg-[#2d2d2d] text-[#9cdcfe]"
                      : "bg-zinc-100 text-zinc-700 dark:bg-white/[0.08] dark:text-zinc-200"
                  )}
                >
                  #{tag}
                </span>
              ))}
            </div>
          ) : section.key === "content" && typeof section.value === "string" ? (
            <div
              className={cn(
                "max-h-56 overflow-y-auto rounded-md px-3 py-2 text-[13px] leading-relaxed",
                isDrawer
                  ? "bg-[#252526] text-[#d4d4d4]"
                  : "bg-white text-zinc-800 dark:bg-black/20 dark:text-zinc-200"
              )}
            >
              <Markdown
                content={section.value}
                className="text-[13px] leading-relaxed [&_p]:my-1.5 [&_li]:my-0.5"
              />
            </div>
          ) : (
            <div
              className={cn(
                "whitespace-pre-wrap rounded-md px-3 py-2 text-[13px] leading-relaxed",
                isDrawer
                  ? "bg-[#252526] text-[#d4d4d4]"
                  : "bg-white text-zinc-800 dark:bg-black/20 dark:text-zinc-200"
              )}
            >
              {String(section.value || "")}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function PostAiAssistPanel({
  locale,
  type,
  draftId,
  clearUnsavedSignal,
  selectedField: selectedFieldProp,
  onSelectedFieldChange,
  variant = "card",
  fields,
  onApplyPatch,
}: PostAiAssistPanelProps) {
  const availableFields = React.useMemo<HomePostAiTargetField[]>(
    () =>
      type === "video"
        ? ["combined", "title", "excerpt", "tags"]
        : ["combined", "content", "excerpt", "title", "tags"],
    [type]
  );
  const [internalSelectedField, setInternalSelectedField] = React.useState<HomePostAiTargetField>(
    "combined"
  );
  const selectedField = selectedFieldProp && availableFields.includes(selectedFieldProp)
    ? selectedFieldProp
    : internalSelectedField;
  const [instruction, setInstruction] = React.useState("");
  const [conversation, setConversation] = React.useState<HomePostAiAssistConversation | null>(
    null
  );
  const [loadingConversation, setLoadingConversation] = React.useState(true);
  const [sending, setSending] = React.useState(false);
  const clearSignalRef = React.useRef(clearUnsavedSignal);
  const titleRef = React.useRef(fields.title);

  React.useEffect(() => {
    titleRef.current = fields.title;
  }, [fields.title]);

  const persistConversation = React.useCallback(
    async (
      sourceConversation: HomePostAiAssistConversation,
      options?: {
        postUuidOverride?: string;
        silent?: boolean;
      }
    ) => {
      const now = new Date().toISOString();
      const prepared: HomePostAiAssistConversation = {
        ...sourceConversation,
        locale,
        title: buildConversationTitle(titleRef.current || sourceConversation.title || ""),
        post_uuid: options?.postUuidOverride ?? draftId ?? "",
        created_at: sourceConversation.created_at || now,
        updated_at: now,
      };

      if (!prepared.post_uuid) {
        if (prepared.messages.length === 0) {
          removeLocalConversation(locale);
        } else {
          writeLocalConversation(locale, prepared);
        }
        return prepared;
      }

      if (prepared.messages.length === 0) {
        return prepared;
      }

      try {
        const saved = await saveRemoteConversation(prepared);
        return saved || prepared;
      } catch (error: any) {
        if (!options?.silent) {
          toast.error(error?.message || "保存 AI 对话失败");
        }
        return prepared;
      }
    },
    [draftId, locale]
  );

  const handleSelectField = React.useCallback(
    (field: HomePostAiTargetField) => {
      setInternalSelectedField(field);
      onSelectedFieldChange?.(field);
    },
    [onSelectedFieldChange]
  );

  React.useEffect(() => {
    if (availableFields.includes(selectedField)) {
      return;
    }

    handleSelectField(availableFields[0]);
  }, [availableFields, handleSelectField, selectedField]);

  React.useEffect(() => {
    let cancelled = false;

    async function loadConversation() {
      setLoadingConversation(true);

      try {
        if (draftId) {
          const localConversation = readLocalConversation(locale);
          if (localConversation && localConversation.messages.length > 0) {
            const synced = await persistConversation(localConversation, {
              postUuidOverride: draftId,
              silent: true,
            });
            removeLocalConversation(locale);

            if (!cancelled) {
              setConversation(
                synced || {
                  ...localConversation,
                  post_uuid: draftId,
                }
              );
            }
            return;
          }

          const remoteConversation = await fetchRemoteConversation(draftId);
          if (!cancelled) {
            setConversation(
              remoteConversation || createEmptyConversation(locale, titleRef.current, draftId)
            );
          }
          return;
        }

        const localConversation = readLocalConversation(locale);
        if (!cancelled) {
          setConversation(localConversation || createEmptyConversation(locale, titleRef.current));
        }
      } catch (error: any) {
        if (!cancelled) {
          setConversation(createEmptyConversation(locale, titleRef.current, draftId || ""));
        }
        toast.error(error?.message || "加载 AI 对话失败");
      } finally {
        if (!cancelled) {
          setLoadingConversation(false);
        }
      }
    }

    void loadConversation();

    return () => {
      cancelled = true;
    };
  }, [draftId, locale, persistConversation]);

  React.useEffect(() => {
    if (clearSignalRef.current === clearUnsavedSignal) {
      return;
    }

    clearSignalRef.current = clearUnsavedSignal;

    if (!draftId) {
      removeLocalConversation(locale);
      setConversation(createEmptyConversation(locale, fields.title));
      setInstruction("");
    }
  }, [clearUnsavedSignal, draftId, fields.title, locale]);

  const handleSend = React.useCallback(async () => {
    const safeInstruction = instruction.trim();
    const currentConversation =
      conversation || createEmptyConversation(locale, fields.title, draftId || "");

    if (!safeInstruction) {
      toast.error("先写一下你想怎么改");
      return;
    }

    const now = new Date().toISOString();
    const nextUserMessage: HomePostAiAssistMessage = {
      id: createClientId(),
      role: "user",
      content: safeInstruction,
      target_field: selectedField,
      created_at: now,
    };

    const optimisticConversation: HomePostAiAssistConversation = {
      ...currentConversation,
      locale,
      title: buildConversationTitle(fields.title || currentConversation.title || ""),
      post_uuid: draftId || "",
      updated_at: now,
      messages: [...currentConversation.messages, nextUserMessage],
    };

    setConversation(optimisticConversation);
    setInstruction("");
    void persistConversation(optimisticConversation, { silent: true });

    setSending(true);
    try {
      const resp = await fetch("/api/home/post/ai-assist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locale,
          type,
          target_field: selectedField,
          instruction: safeInstruction,
          fields,
          history: currentConversation.messages.slice(-6).map((message) => ({
            role: message.role,
            content: message.content,
            target_field: message.target_field,
          })),
        }),
      });
      const result = await resp.json();
      if (result.code !== 0) {
        throw new Error(result.message || "AI 修改失败");
      }

      const assistantMessage: HomePostAiAssistMessage = {
        id: createClientId(),
        role: "assistant",
        content: String(result.data?.reply || "").trim() || "已生成修改建议。",
        target_field:
          normalizeTargetField(result.data?.target_field) || selectedField,
        patch: normalizePatch(result.data?.patch),
        decision: "pending",
        created_at: new Date().toISOString(),
      };

      const nextConversation: HomePostAiAssistConversation = {
        ...optimisticConversation,
        updated_at: assistantMessage.created_at,
        messages: [...optimisticConversation.messages, assistantMessage],
      };

      setConversation(nextConversation);
      void persistConversation(nextConversation, { silent: true });
    } catch (error: any) {
      const failureMessage: HomePostAiAssistMessage = {
        id: createClientId(),
        role: "assistant",
        content: `AI 修改失败：${error?.message || "请稍后重试"}`,
        target_field: selectedField,
        created_at: new Date().toISOString(),
      };

      const nextConversation: HomePostAiAssistConversation = {
        ...optimisticConversation,
        updated_at: failureMessage.created_at,
        messages: [...optimisticConversation.messages, failureMessage],
      };

      setConversation(nextConversation);
      void persistConversation(nextConversation, { silent: true });
      toast.error(error?.message || "AI 修改失败");
    } finally {
      setSending(false);
    }
  }, [
    conversation,
    draftId,
    fields,
    instruction,
    locale,
    persistConversation,
    selectedField,
    type,
  ]);

  const getPatchFieldLabels = React.useCallback((patch?: HomePostAiPatch) => {
    if (!patch) return [];

    return (Object.keys(patch) as Array<keyof HomePostAiPatch>)
      .filter((key) => {
        const value = patch[key];
        return Array.isArray(value) ? value.length > 0 : Boolean(String(value || "").trim());
      })
      .map((key) => FIELD_LABEL[key as HomePostAiTargetField])
      .filter(Boolean);
  }, []);

  const handleDecision = React.useCallback(
    async (messageId: string, decision: HomePostAiDecision) => {
      if (!conversation) return;

      const targetMessage = conversation.messages.find((message) => message.id === messageId);
      if (!targetMessage || !targetMessage.patch || !targetMessage.target_field) {
        return;
      }

      if (decision === "applied") {
        onApplyPatch(targetMessage.patch, targetMessage.target_field);
        const labels = getPatchFieldLabels(targetMessage.patch);
        toast.success(
          labels.length > 1
            ? `已应用到${labels.join("、")}`
            : `已应用到${labels[0] || FIELD_LABEL[targetMessage.target_field]}`
        );
      } else {
        toast.success("已拒绝这次修改建议");
      }

      const nextConversation = updateMessageDecision(conversation, messageId, decision);
      setConversation(nextConversation);
      await persistConversation(nextConversation, { silent: true });
    },
    [conversation, getPatchFieldLabels, onApplyPatch, persistConversation]
  );

  const quickPrompts = React.useMemo(
    () => buildQuickPrompts(type, selectedField),
    [selectedField, type]
  );

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const isDrawer = variant === "drawer";

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [conversation?.messages, loadingConversation]);

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col",
        isDrawer
          ? "h-full bg-[#1e1e1e] text-[#cccccc]"
          : "rounded-[26px] border border-[#9cb1ab]/16 bg-white/72 p-5 shadow-[0_14px_40px_rgba(35,55,49,0.05)] dark:border-white/10 dark:bg-[#1e1e1e] dark:text-[#cccccc]"
      )}
    >
      {!isDrawer ? (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6b827c] dark:text-[#92aea7]">
              小云AI操作台
            </div>
            <h3 className="mt-2 text-lg font-semibold text-[#223430] dark:text-[#eef7f3]">
              综合生成与局部润色
            </h3>
          </div>
          <div className="rounded-full bg-[linear-gradient(135deg,#203b35,#31524a)] p-2 text-white">
            <Sparkles className="h-4 w-4" />
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          "flex shrink-0 gap-1 overflow-x-auto border-b px-2 py-2",
          isDrawer ? "border-[#2d2d2d] bg-[#252526]" : "border-black/5 bg-zinc-50/80 dark:border-white/10 dark:bg-white/[0.03]"
        )}
      >
        {availableFields.map((field) => (
          <button
            key={field}
            type="button"
            onClick={() => handleSelectField(field)}
            className={cn(
              "shrink-0 rounded-md px-2.5 py-1 text-[12px] font-medium transition",
              selectedField === field
                ? isDrawer
                  ? "bg-[#3c3c3c] text-white"
                  : "bg-[#24433c] text-white dark:bg-[#547a70]"
                : isDrawer
                  ? "text-[#858585] hover:bg-[#2d2d2d] hover:text-[#cccccc]"
                  : "text-zinc-600 hover:bg-white dark:text-zinc-400 dark:hover:bg-white/5"
            )}
          >
            {FIELD_LABEL[field]}
          </button>
        ))}
      </div>

      <p
        className={cn(
          "shrink-0 px-3 py-1.5 text-[11px] leading-relaxed",
          isDrawer ? "text-[#858585]" : "text-zinc-500 dark:text-zinc-400"
        )}
      >
        {draftId
          ? "对话已随草稿保存。"
          : "无草稿 ID 时对话暂存本地，保存草稿后同步。"}
        {type === "video" ? " 视频仅支持标题、简介、标签。" : ""}
      </p>

      <div
        ref={scrollRef}
        className={cn(
          "min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-2",
          isDrawer && "bg-[#1e1e1e]"
        )}
      >
        {loadingConversation ? (
          <div className="flex min-h-[200px] items-center justify-center gap-2 text-sm text-[#858585]">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            加载中…
          </div>
        ) : conversation && conversation.messages.length > 0 ? (
          conversation.messages.map((message) => {
            const isAssistant = message.role === "assistant";
            const decision = message.decision || "pending";
            const canDecide = Boolean(
              isAssistant && message.patch && message.target_field && decision === "pending"
            );
            const patchFieldLabels = getPatchFieldLabels(message.patch);

            return (
              <div
                key={message.id}
                className={cn("flex w-full", isAssistant ? "justify-start" : "justify-end")}
              >
                <div
                  className={cn(
                    "max-w-[min(100%,520px)] rounded-lg px-3 py-2.5 text-[13px] leading-relaxed",
                    isAssistant
                      ? "bg-[#252526] text-[#cccccc]"
                      : "bg-[#2b2b2b] text-[#e0e0e0]"
                  )}
                >
                  <div className="mb-1.5 flex flex-wrap items-center gap-1.5 text-[10px] uppercase tracking-wide text-[#858585]">
                    <span>{isAssistant ? "Assistant" : "You"}</span>
                    {message.target_field ? (
                      <span className="text-[#6a9955]">@{FIELD_LABEL[message.target_field]}</span>
                    ) : null}
                  </div>

                  {isAssistant ? (
                    <Markdown
                      content={message.content}
                      className="text-[13px] leading-relaxed text-[#cccccc] [&_p]:my-1.5 [&_li]:my-0.5"
                    />
                  ) : (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  )}

                  {isAssistant && patchFieldLabels.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {patchFieldLabels.map((label) => (
                        <span
                          key={`${message.id}-${label}`}
                          className="rounded-full bg-[#2d2d2d] px-2 py-0.5 text-[10px] text-[#9cdcfe]"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {isAssistant && message.patch ? (
                    <AiPatchPreview patch={message.patch} isDrawer={isDrawer} />
                  ) : null}

                  {isAssistant && message.patch && message.target_field ? (
                    <div className="mt-3 flex flex-wrap gap-2 border-t border-[#3c3c3c] pt-2">
                      {canDecide ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => void handleDecision(message.id, "applied")}
                            className="h-7 rounded border-0 bg-[#0e639c] px-2.5 text-xs text-white hover:bg-[#1177bb]"
                          >
                            <Check className="mr-1 h-3 w-3" />
                            应用
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => void handleDecision(message.id, "rejected")}
                            className="h-7 rounded px-2.5 text-xs text-[#858585] hover:bg-[#2d2d2d] hover:text-[#cccccc]"
                          >
                            <X className="mr-1 h-3 w-3" />
                            拒绝
                          </Button>
                        </>
                      ) : (
                        <span className="text-[11px] text-[#858585]">
                          {decision === "applied"
                            ? "已应用"
                            : decision === "rejected"
                              ? "已拒绝"
                              : "待处理"}
                        </span>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex min-h-[180px] flex-col items-center justify-center gap-2 px-4 text-center">
            <Sparkles className="h-8 w-8 text-[#3c3c3c]" />
            <p className="text-sm text-[#858585]">输入指令开始对话</p>
            <p className="text-xs text-[#6a6a6a]">
              先选综合或具体字段，再描述你想要的修改方式
            </p>
          </div>
        )}
      </div>

      <div
        className={cn(
          "shrink-0 border-t px-2 py-2",
          isDrawer ? "border-[#2d2d2d] bg-[#252526]" : "border-black/5 dark:border-white/10"
        )}
      >
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {quickPrompts.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setInstruction(item)}
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-[11px] transition",
                isDrawer
                  ? "bg-[#3c3c3c] text-[#cccccc] hover:bg-[#454545]"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-white/10 dark:text-zinc-300"
              )}
            >
              {item.length > 22 ? `${item.slice(0, 22)}…` : item}
            </button>
          ))}
        </div>
      </div>

      <div className={cn("shrink-0 p-3 pt-0", !isDrawer && "pb-5")}>
        <div
          className={cn(
            "relative rounded-lg border",
            isDrawer ? "border-[#3c3c3c] bg-[#252526]" : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
          )}
        >
          <Textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            rows={isDrawer ? 5 : 4}
            placeholder={
              selectedField === "combined"
                ? "综合模式：例如根据我的标题生成内容、导语、标签，我来选择是否应用。"
                : `修改「${FIELD_LABEL[selectedField]}」：例如更精炼、更适合展示…`
            }
            className={cn(
              "min-h-[100px] resize-none border-0 bg-transparent pr-12 text-sm focus-visible:ring-0 focus-visible:ring-offset-0",
              isDrawer
                ? "text-[#cccccc] placeholder:text-[#6a6a6a]"
                : "dark:text-zinc-200"
            )}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                void handleSend();
              }
            }}
          />
          <Button
            type="button"
            onClick={() => void handleSend()}
            disabled={sending}
            size="icon"
            className={cn(
              "absolute bottom-2 right-2 h-8 w-8 rounded-md",
              isDrawer
                ? "bg-[#0e639c] text-white hover:bg-[#1177bb]"
                : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-[#0e639c]"
            )}
          >
            {sending ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
