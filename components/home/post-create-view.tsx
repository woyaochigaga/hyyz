"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ImageUpload } from "@/components/ui/image-upload";
import { VideoUpload } from "@/components/ui/video-upload";
import { PostMarkdownEditor } from "@/components/home/post-markdown-editor";
import { PostAiAssistPanel } from "@/components/home/post-ai-assist-panel";
import { getHomePostExcerpt } from "@/lib/home-post-content";
import {
  HomePostAiPatch,
  HomePostAiTargetField,
} from "@/types/home-post-ai-assist";
import {
  BadgePlus,
  FileImage,
  FileText,
  Heart,
  MessageCircle,
  PanelRightOpen,
  Plus,
  Sparkles,
  Trash2,
  Video,
  X,
} from "lucide-react";

type CreatorType = "text" | "image" | "video";
type DrawerMode = "drafts" | "assist";

type MyPost = {
  uuid: string;
  type: CreatorType;
  title?: string;
  excerpt?: string;
  content: string;
  cover_url?: string;
  images?: string[];
  video_url?: string;
  tags?: string[];
  like_count?: number;
  comment_count?: number;
  status?: string;
  created_at?: string;
};

const typeOptions: Array<{
  value: CreatorType;
  title: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    value: "text",
    title: "文字",
    description: "适合发布短文、灵感、展览说明。",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    value: "image",
    title: "图文",
    description: "适合作品介绍、过程记录、图文说明。",
    icon: <FileImage className="h-4 w-4" />,
  },
  {
    value: "video",
    title: "视频",
    description: "适合发布演示、讲解、创作花絮。",
    icon: <Video className="h-4 w-4" />,
  },
];

function AiBeautifyTrigger({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-[#9ab0aa]/22 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(240,246,243,0.98))] px-3 py-1.5 text-[11px] font-semibold tracking-[0.08em] text-[#355149] shadow-[0_8px_20px_rgba(35,55,49,0.10)] transition hover:scale-[1.01] hover:border-[#6e8f85]/28 hover:text-[#203b35] dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(50,66,61,0.92),rgba(33,44,41,0.96))] dark:text-[#e0ece8] dark:hover:bg-[linear-gradient(135deg,rgba(63,84,77,0.95),rgba(43,58,53,0.98))]",
        className
      )}
    >
      <Sparkles className="h-3.5 w-3.5" />
      AI美化
    </button>
  );
}

export function PostCreateView({ locale }: { locale: string }) {
  const [type, setType] = React.useState<CreatorType>("text");
  const [title, setTitle] = React.useState("");
  const [excerpt, setExcerpt] = React.useState("");
  const [content, setContent] = React.useState("");
  const [imageUrls, setImageUrls] = React.useState<string[]>([""]);
  const [videoUrl, setVideoUrl] = React.useState("");
  const [tagsInput, setTagsInput] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [posts, setPosts] = React.useState<MyPost[]>([]);
  const [loadingPosts, setLoadingPosts] = React.useState(true);
  const [editingDraftId, setEditingDraftId] = React.useState<string | null>(null);
  const [activeDrawer, setActiveDrawer] = React.useState<DrawerMode | null>(null);
  const [assistField, setAssistField] = React.useState<HomePostAiTargetField>("combined");
  const [assistClearSignal, setAssistClearSignal] = React.useState(0);

  const loadMyPosts = React.useCallback(async () => {
    setLoadingPosts(true);
    try {
      const resp = await fetch("/api/home/post/mine");
      const result = await resp.json();
      if (result.code === 0) {
        setPosts(Array.isArray(result.data) ? result.data : []);
      } else if (result.code !== -2) {
        toast.error(result.message || "加载作品失败");
      }
    } catch {
      toast.error("加载作品失败");
    } finally {
      setLoadingPosts(false);
    }
  }, [locale]);

  React.useEffect(() => {
    void loadMyPosts();
  }, [loadMyPosts]);

  const resetForm = () => {
    setTitle("");
    setExcerpt("");
    setContent("");
    setImageUrls([""]);
    setVideoUrl("");
    setTagsInput("");
    setType("text");
    setEditingDraftId(null);
    setAssistClearSignal((prev) => prev + 1);
  };

  const buildPayload = (status: "draft" | "published") => {
    const normalizedImages = imageUrls.map((item) => item.trim()).filter(Boolean);
    const coverUrl = normalizedImages[0] || "";
    const tags = tagsInput
      .split(/[,，]/)
      .map((item) => item.trim())
      .filter(Boolean);

    return {
      locale,
      type,
      title,
      excerpt,
      content: type === "video" ? excerpt : content,
      content_format: type === "video" ? "plain" : "markdown",
      editor_mode: type === "video" ? "rich" : "hybrid",
      cover_url: coverUrl,
      images: normalizedImages,
      video_url: videoUrl,
      tags,
      status,
    };
  };

  const handleSave = async (status: "draft" | "published") => {
    const payload = buildPayload(status);

    if (status === "published") {
      if (!payload.content.trim()) {
        toast.error(type === "video" ? "请输入简介" : "请输入内容");
        return;
      }
      if (type === "image" && payload.images.length === 0) {
        toast.error("图文作品请先上传图片");
        return;
      }
      if (type === "video" && !payload.video_url) {
        toast.error("视频作品请先上传视频");
        return;
      }
    } else {
      const hasAnyDraftContent = Boolean(
        payload.title.trim() ||
          payload.excerpt.trim() ||
          payload.content.trim() ||
          payload.images.length > 0 ||
          payload.video_url ||
          payload.tags.length > 0
      );
      if (!hasAnyDraftContent) {
        toast.error("草稿内容不能为空");
        return;
      }
    }

    setSubmitting(true);
    try {
      const url = editingDraftId ? `/api/home/post/${editingDraftId}` : "/api/home/post";
      const method = editingDraftId ? "PATCH" : "POST";
      const resp = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = await resp.json();

      if (result.code !== 0) {
        throw new Error(
          result.message || (status === "draft" ? "保存草稿失败" : "发布失败")
        );
      }

      if (status === "draft") {
        setEditingDraftId(result.data?.uuid || editingDraftId);
        toast.success("草稿已保存");
      } else {
        toast.success("作品已发布");
        resetForm();
      }

      await loadMyPosts();
    } catch (error: any) {
      toast.error(
        error?.message || (status === "draft" ? "保存草稿失败" : "发布失败")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const setImageAt = (index: number, value: string) => {
    setImageUrls((prev) => prev.map((item, idx) => (idx === index ? value : item)));
  };

  const addImageSlot = () => {
    setImageUrls((prev) => [...prev, ""]);
  };

  const removeImageSlot = (index: number) => {
    setImageUrls((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      return next.length > 0 ? next : [""];
    });
  };

  const deletePost = async (uuid: string) => {
    try {
      const resp = await fetch(`/api/home/post/${uuid}`, {
        method: "DELETE",
      });
      const result = await resp.json();
      if (result.code !== 0) {
        throw new Error(result.message || "删除失败");
      }
      toast.success("作品已删除");
      if (editingDraftId === uuid) {
        resetForm();
      }
      await loadMyPosts();
    } catch (error: any) {
      toast.error(error?.message || "删除失败");
    }
  };

  const drafts = React.useMemo(
    () =>
      posts
        .filter((item) => item.status === "draft")
        .sort((a, b) => {
          const aTime = Date.parse(String(a.created_at || "")) || 0;
          const bTime = Date.parse(String(b.created_at || "")) || 0;
          return bTime - aTime;
        }),
    [posts]
  );

  const normalizedCurrentTags = React.useMemo(
    () =>
      tagsInput
        .split(/[,，]/)
        .map((item) => item.trim())
        .filter(Boolean),
    [tagsInput]
  );

  const excerptPreview = React.useMemo(
    () => excerpt.trim() || getHomePostExcerpt(content, 120) || "将自动从正文中提取摘要",
    [content, excerpt]
  );

  const loadDraft = (draft: MyPost) => {
    setEditingDraftId(draft.uuid);
    setType(draft.type);
    setTitle(draft.title || "");
    setExcerpt(draft.excerpt || "");
    setContent(draft.content || "");
    setImageUrls(
      draft.images && draft.images.length > 0
        ? draft.images
        : draft.cover_url
          ? [draft.cover_url]
          : [""]
    );
    setVideoUrl(draft.video_url || "");
    setTagsInput((draft.tags || []).join(", "));
    setActiveDrawer(null);
    toast.success("草稿已载入");
  };

  const openAssistDrawer = React.useCallback(
    (field: HomePostAiTargetField) => {
      const normalizedField =
        type === "video" && field === "content" ? "excerpt" : field;
      setAssistField(normalizedField);
      setActiveDrawer("assist");
    },
    [type]
  );

  React.useEffect(() => {
    if (type === "video" && assistField === "content") {
      setAssistField("excerpt");
    }
  }, [assistField, type]);

  React.useEffect(() => {
    if (activeDrawer !== "assist") {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      setActiveDrawer(null);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeDrawer]);

  const applyAiPatch = React.useCallback(
    (patch: HomePostAiPatch) => {
      if (typeof patch.title === "string") {
        setTitle(patch.title);
      }
      if (typeof patch.excerpt === "string") {
        setExcerpt(patch.excerpt);
      }
      if (typeof patch.content === "string") {
        setContent(patch.content);
      }
      if (Array.isArray(patch.tags)) {
        setTagsInput(patch.tags.join(", "));
      }
    },
    []
  );

  const draftDrawerBody = (
    <div className="space-y-4 p-6">
      {loadingPosts ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-500 dark:border-white/10">
          正在加载...
        </div>
      ) : drafts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-500 dark:border-white/10">
          暂无草稿。
        </div>
      ) : (
        drafts.map((post) => (
          <div
            key={post.uuid}
            className={cn(
              "rounded-[22px] border border-black/5 bg-white/80 p-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-white/[0.03]",
              editingDraftId === post.uuid &&
                "border-[#24433c] bg-[#f1f5f4] dark:border-[#7aa291] dark:bg-white/[0.08]"
            )}
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => loadDraft(post)}
                className="min-w-0 flex-1 text-left"
              >
                <h3 className="line-clamp-1 text-base font-semibold text-zinc-900 dark:text-white">
                  {post.title || "未命名草稿"}
                </h3>
              </button>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-[11px] text-white dark:bg-white dark:text-zinc-900">
                  {post.type === "text" ? "纯文本" : post.type === "image" ? "图文" : "视频"}
                </span>
                <button
                  type="button"
                  onClick={() => void deletePost(post.uuid)}
                  className="rounded-full p-2 text-zinc-500 transition hover:bg-black/[0.04] hover:text-zinc-900 dark:hover:bg-white/5 dark:hover:text-white"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="line-clamp-3 text-sm leading-6 text-zinc-500">
              {post.excerpt || getHomePostExcerpt(post.content, 120)}
            </p>
            {post.type === "image" && (post.images?.length || 0) > 1 ? (
              <div className="mt-3 text-xs text-zinc-500">共 {post.images?.length || 0} 张图片</div>
            ) : null}
            {post.tags && post.tags.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={`${post.uuid}-${tag}`}
                    className="rounded-full bg-white px-3 py-1 text-xs text-zinc-600 dark:border dark:border-white/10 dark:bg-[#334640] dark:text-[#eef7f3]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}
            <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500">
              <span className="inline-flex items-center gap-1">
                <Heart className="h-3.5 w-3.5" />
                {post.like_count || 0}
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="h-3.5 w-3.5" />
                {post.comment_count || 0}
              </span>
              <button
                type="button"
                onClick={() => loadDraft(post)}
                className="text-zinc-900 transition hover:opacity-70 dark:text-white"
              >
                继续编辑
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const drawerTitle = activeDrawer === "assist" ? "小云AI操作台" : "草稿箱";

  const drawerBody =
    activeDrawer === "assist" ? (
      <PostAiAssistPanel
        locale={locale}
        type={type}
        draftId={editingDraftId}
        clearUnsavedSignal={assistClearSignal}
        selectedField={assistField}
        onSelectedFieldChange={setAssistField}
        variant="drawer"
        fields={{
          title,
          excerpt,
          content,
          tags: normalizedCurrentTags,
        }}
        onApplyPatch={applyAiPatch}
      />
    ) : (
      draftDrawerBody
    );

  return (
    <div
      className={cn(
        "min-w-0 gap-6 overflow-y-auto lg:grid lg:h-[min(100%,calc(100dvh-5.75rem))] lg:min-h-[480px] lg:max-h-[calc(100dvh-5.75rem)] lg:overflow-hidden",
        activeDrawer ? "lg:grid-cols-[minmax(0,1fr)_440px]" : "grid-cols-1"
      )}
    >
      <section className="relative min-h-0 rounded-[30px] border border-[#94a7a1]/16 bg-[radial-gradient(circle_at_14%_18%,rgba(130,163,153,0.14),transparent_26%),radial-gradient(circle_at_86%_12%,rgba(226,232,229,0.78),transparent_24%),radial-gradient(circle_at_76%_80%,rgba(93,121,114,0.07),transparent_22%),linear-gradient(135deg,rgba(252,252,251,0.98),rgba(243,246,244,0.96)_54%,rgba(236,240,239,0.95))] p-6 shadow-[0_26px_80px_rgba(43,60,55,0.08)] lg:h-full lg:overflow-y-auto dark:border-[#6c827c]/16 dark:bg-[radial-gradient(circle_at_14%_18%,rgba(95,129,120,0.11),transparent_26%),radial-gradient(circle_at_86%_12%,rgba(83,102,98,0.16),transparent_22%),radial-gradient(circle_at_76%_80%,rgba(56,77,72,0.10),transparent_22%),linear-gradient(135deg,rgba(24,28,28,0.98),rgba(29,35,34,0.98)_54%,rgba(22,25,25,0.97))]">
        <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(108,134,126,0.24),rgba(176,188,184,0.22),transparent)] dark:bg-[linear-gradient(90deg,transparent,rgba(117,144,136,0.24),rgba(86,104,99,0.20),transparent)]" />
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.32em] text-[#6b827c] dark:text-[#92aea7]">
              创作中心
            </div>
            <h1 className="text-[2rem] font-semibold tracking-[0.01em] text-[#20312d] dark:text-[#e6efec]">
              杭艺云创
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5d6f6a] dark:text-[#aac0ba]">
              支持 Markdown、图文混排、表格、代码块和实时预览。标题、摘要、标签与正文分区编辑，阅读和创作都会更松一点。
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button
              type="button"
              onClick={() => openAssistDrawer("combined")}
              className="h-11 rounded-full bg-[linear-gradient(135deg,#203b35,#31524a)] px-5 text-white shadow-[0_14px_34px_rgba(32,59,53,0.22)] hover:opacity-95 dark:bg-[linear-gradient(135deg,#4f7b6f,#6a988c)] dark:text-[#f5fbf8]"
            >
              <Sparkles className="h-4 w-4" />
              小云AI操作台
            </Button>
            <Button
              type="button"
              onClick={() =>
                setActiveDrawer((prev) => (prev === "drafts" ? null : "drafts"))
              }
              className="h-11 rounded-full bg-[linear-gradient(135deg,#eef5f2,#dce7e2)] px-5 text-[#29413b] shadow-[0_10px_28px_rgba(43,60,55,0.08)] hover:opacity-95 dark:bg-[linear-gradient(135deg,#314741,#425e56)] dark:text-[#eef7f3]"
            >
              <PanelRightOpen className="h-4 w-4" />
              草稿箱
              <span className="ml-1 rounded-full bg-white/70 px-2 py-0.5 text-[11px] text-[#4e6760] dark:bg-white/10 dark:text-[#d7e7e2]">
                {drafts.length}
              </span>
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[26px] border border-[#9cb1ab]/16 bg-white/68 p-5 shadow-[0_14px_40px_rgba(35,55,49,0.05)] dark:border-white/10 dark:bg-white/[0.03]">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6b827c] dark:text-[#92aea7]">
              发布类型
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {typeOptions.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setType(item.value)}
                  className={cn(
                    "flex items-start gap-3 rounded-2xl border px-4 py-3 text-left transition",
                    type === item.value
                      ? "border-[#24433c] bg-[linear-gradient(135deg,#24433c,#35574f)] text-[#edf3ec] shadow-[0_14px_34px_rgba(36,67,60,0.18)] dark:border-[#6fa08c] dark:bg-[linear-gradient(135deg,#3d675d,#547a70)] dark:text-[#f4efe4]"
                      : "border-[#a6b7b2]/16 bg-white/72 text-[#5a6a66] hover:border-[#7f9891]/22 hover:bg-white dark:border-[#6f9188]/10 dark:bg-white/[0.03] dark:text-[#b4c4c0] dark:hover:bg-white/[0.055]"
                  )}
                >
                  <span className="mt-0.5">{item.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{item.title}</span>
                    <span className="mt-1 block text-xs leading-5 opacity-80">
                      {item.description}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[26px] border border-[#9cb1ab]/16 bg-white/68 p-5 shadow-[0_14px_40px_rgba(35,55,49,0.05)] dark:border-white/10 dark:bg-white/[0.03]">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6b827c] dark:text-[#92aea7]">
              卡片预览效果
            </div>
            <p className="mt-3 rounded-2xl bg-[#f5f8f7] px-4 py-3 text-sm leading-6 text-[#4f625c] dark:bg-white/[0.04] dark:text-zinc-300">
              {excerptPreview}
            </p>
          </div>

          <div className="rounded-[26px] border border-[#9cb1ab]/16 bg-white/68 p-5 shadow-[0_14px_40px_rgba(35,55,49,0.05)] dark:border-white/10 dark:bg-white/[0.03]">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(260px,0.9fr)]">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  标题
                </label>
                <div className="relative">
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={
                      type === "video"
                        ? "给作品起名；不填将自动截取简介前约 30 字"
                        : "给作品起名；不填将自动截取正文前约 30 字"
                    }
                    className="h-11 rounded-xl pr-28"
                  />
                  <AiBeautifyTrigger
                    onClick={() => openAssistDrawer("title")}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  {type === "video" ? "简介" : "摘要 / 导语"}
                </label>
                <div className="relative">
                  <Textarea
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    placeholder={
                      type === "video"
                        ? "写亮点与作品介绍；将同时作为视频说明与社区卡片摘要。本类型不使用 Markdown 正文。"
                        : "可选。用于社区卡片摘要；不填将从正文自动提取一段。"
                    }
                    rows={3}
                    className="rounded-2xl pb-10"
                  />
                  <AiBeautifyTrigger
                    onClick={() => openAssistDrawer("excerpt")}
                    className="absolute bottom-3 right-3"
                  />
                </div>
              </div>
            </div>
          </div>

          {type !== "video" ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                内容
              </label>
              <div className="relative">
                <PostMarkdownEditor
                  value={content}
                  onChange={setContent}
                  placeholder="支持 Markdown、表格、代码块与工具栏。图片可插在文中，或在下方「图片」区上传首图作为社区封面。"
                  rows={18}
                />
                <AiBeautifyTrigger
                  onClick={() => openAssistDrawer("content")}
                  className="absolute bottom-4 right-4"
                />
              </div>
            </div>
          ) : null}

          {type === "image" && (
            <div className="rounded-[26px] border border-[#9cb1ab]/16 bg-white/68 p-5 shadow-[0_14px_40px_rgba(35,55,49,0.05)] dark:border-white/10 dark:bg-white/[0.03]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    图片
                  </label>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    首图默认作为社区封面；更多图可点「添加图片」。
                  </p>
                </div>
                  <Button type="button" variant="outline" size="sm" onClick={addImageSlot}>
                    <Plus className="mr-1 h-4 w-4" />
                    添加图片
                  </Button>
                </div>
                <div className="grid gap-3 xl:grid-cols-2">
                  {imageUrls.map((value, index) => (
                    <div
                      key={`image-${index}`}
                      className="rounded-2xl border border-black/5 p-3 dark:border-white/10"
                    >
                      <div className="mb-2 flex items-center justify-between text-sm text-zinc-500">
                        <span>{index === 0 ? "首图 / 封面" : `图片 ${index + 1}`}</span>
                        {imageUrls.length > 1 ? (
                          <button type="button" onClick={() => removeImageSlot(index)}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                      <ImageUpload value={value} onChange={(url) => setImageAt(index, url)} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {type === "video" && (
              <div className="rounded-[26px] border border-[#9cb1ab]/16 bg-white/68 p-5 shadow-[0_14px_40px_rgba(35,55,49,0.05)] dark:border-white/10 dark:bg-white/[0.03]">
                <div className="grid gap-6 xl:grid-cols-[minmax(280px,0.85fr)_minmax(420px,1.15fr)] 2xl:grid-cols-[minmax(320px,0.8fr)_minmax(520px,1.2fr)]">
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                        视频
                      </label>
                      <VideoUpload value={videoUrl} onChange={setVideoUrl} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                        封面图
                      </label>
                      <ImageUpload
                        value={imageUrls[0] || ""}
                        onChange={(url) => setImageUrls([url])}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                      正常预览
                    </label>
                    <div className="overflow-hidden rounded-[26px] border border-black/6 bg-white shadow-[0_22px_54px_rgba(15,23,42,0.10)] dark:border-white/10 dark:bg-[#15191a]">
                      {videoUrl ? (
                        <video
                          src={videoUrl}
                          poster={imageUrls[0] || undefined}
                          controls
                          playsInline
                          preload="metadata"
                          className="aspect-[16/9.2] w-full bg-black object-cover"
                        />
                      ) : imageUrls[0] ? (
                        <img
                          src={imageUrls[0]}
                          alt={title || "视频封面"}
                          className="aspect-[16/9.2] w-full object-cover"
                        />
                      ) : (
                        <div className="flex aspect-[16/9.2] items-center justify-center bg-[linear-gradient(135deg,#20272a,#32413e)] px-6 text-center text-sm leading-6 text-white/72">
                          上传视频或封面后，这里显示正常预览
                        </div>
                      )}
                      <div className="space-y-3 px-5 py-5">
                        <div className="text-lg font-semibold text-zinc-900 dark:text-white">
                          {title.trim() || "输入视频标题"}
                        </div>
                        <div className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                          {excerpt.trim() || "这里显示视频简介"}
                        </div>
                        {normalizedCurrentTags.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {normalizedCurrentTags.slice(0, 4).map((tag) => (
                              <span
                                key={`video-preview-${tag}`}
                                className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] text-zinc-600 dark:border dark:border-white/10 dark:bg-white/[0.05] dark:text-zinc-300"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          <div className="rounded-[26px] border border-[#9cb1ab]/16 bg-white/68 p-5 shadow-[0_14px_40px_rgba(35,55,49,0.05)] dark:border-white/10 dark:bg-white/[0.03]">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6b827c] dark:text-[#92aea7]">
              标签
            </div>
            <div className="relative mt-4">
              <Input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="多个标签用英文逗号或中文逗号分隔（最多 10 个）"
                className="h-11 rounded-xl pr-28"
              />
              <AiBeautifyTrigger
                onClick={() => openAssistDrawer("tags")}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              />
            </div>
          </div>

          <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 rounded-[24px] border border-[#94a7a1]/14 bg-[linear-gradient(180deg,rgba(253,253,252,0.92),rgba(246,248,247,0.96))] px-4 py-4 backdrop-blur dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(28,32,32,0.88),rgba(24,28,28,0.94))]">
            <Button
              type="button"
              onClick={() => void handleSave("draft")}
              disabled={submitting}
              className="h-11 rounded-full bg-[linear-gradient(135deg,#eff5f2,#dde8e3)] px-6 text-[#233731] shadow-[0_12px_30px_rgba(35,55,49,0.10)] hover:opacity-95 dark:bg-[linear-gradient(135deg,#385149,#4b685f)] dark:text-[#eef7f3]"
            >
              {submitting ? "保存中..." : editingDraftId ? "更新草稿" : "保存草稿"}
            </Button>
            <Button
              type="button"
              onClick={() => void handleSave("published")}
              disabled={submitting}
              className="h-11 rounded-full bg-[linear-gradient(135deg,#203b35,#31524a)] px-6 text-white shadow-[0_14px_34px_rgba(32,59,53,0.22)] hover:opacity-95 dark:bg-[linear-gradient(135deg,#4f7b6f,#6a988c)] dark:text-[#f5fbf8]"
            >
              <BadgePlus className="mr-2 h-4 w-4" />
              {submitting ? "发布中..." : editingDraftId ? "发布草稿" : "立即发布"}
            </Button>
          </div>
        </div>
      </section>

      {activeDrawer ? (
        <aside
          className={cn(
            "min-h-0 overflow-hidden rounded-[30px] border shadow-[0_24px_64px_rgba(15,23,42,0.10)] lg:flex lg:h-full lg:flex-col",
            activeDrawer === "assist"
              ? "border-[#2d2d2d] bg-[#1e1e1e]"
              : "border-black/5 bg-[linear-gradient(180deg,rgba(251,252,252,0.98),rgba(243,246,245,0.97))] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(27,31,31,0.98),rgba(22,26,26,0.98))]"
          )}
        >
          <div
            className={cn(
              "flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3",
              activeDrawer === "assist"
                ? "border-[#2d2d2d] bg-[#252526]"
                : "border-zinc-200/80 dark:border-zinc-800"
            )}
          >
            <h2
              className={cn(
                "truncate text-sm font-medium",
                activeDrawer === "assist" ? "text-[#cccccc]" : "text-zinc-900 dark:text-zinc-100"
              )}
            >
              {drawerTitle}
            </h2>
            <button
              type="button"
              onClick={() => setActiveDrawer(null)}
              className={cn(
                "rounded-md p-1.5 transition",
                activeDrawer === "assist"
                  ? "text-[#858585] hover:bg-[#2d2d2d] hover:text-[#cccccc]"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              )}
              aria-label="关闭"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">{drawerBody}</div>
        </aside>
      ) : null}
    </div>
  );
}
