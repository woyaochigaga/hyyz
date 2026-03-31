"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ImageUpload } from "@/components/ui/image-upload";
import { VideoUpload } from "@/components/ui/video-upload";
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

type AiAssistResult = {
  title: string;
  content: string;
  tags: string[];
  notes: string;
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

export function PostCreateView({ locale }: { locale: string }) {
  const [type, setType] = React.useState<CreatorType>("text");
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [imageUrls, setImageUrls] = React.useState<string[]>([""]);
  const [videoUrl, setVideoUrl] = React.useState("");
  const [tagsInput, setTagsInput] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [posts, setPosts] = React.useState<MyPost[]>([]);
  const [loadingPosts, setLoadingPosts] = React.useState(true);
  const [editingDraftId, setEditingDraftId] = React.useState<string | null>(null);
  const [activeDrawer, setActiveDrawer] = React.useState<DrawerMode | null>(null);
  const [assistInstruction, setAssistInstruction] = React.useState("");
  const [assisting, setAssisting] = React.useState(false);
  const [assistResult, setAssistResult] = React.useState<AiAssistResult | null>(null);

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
    setContent("");
    setImageUrls([""]);
    setVideoUrl("");
    setTagsInput("");
    setType("text");
    setEditingDraftId(null);
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
      content,
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
        toast.error("请输入内容");
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

  const loadDraft = (draft: MyPost) => {
    setEditingDraftId(draft.uuid);
    setType(draft.type);
    setTitle(draft.title || "");
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

  const handleAssist = async () => {
    if (!title.trim() && !content.trim() && normalizedCurrentTags.length === 0) {
      toast.error("请先写一点标题、内容或标签，再使用 AI 辅助修改");
      return;
    }

    setAssisting(true);
    try {
      const resp = await fetch("/api/home/post/ai-assist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locale,
          type,
          title,
          content,
          tags: normalizedCurrentTags,
          instruction: assistInstruction,
        }),
      });

      const result = await resp.json();
      if (result.code !== 0) {
        throw new Error(result.message || "AI 辅助生成失败");
      }

      setAssistResult({
        title: String(result.data?.title || "").trim(),
        content: String(result.data?.content || "").trim(),
        tags: Array.isArray(result.data?.tags)
          ? result.data.tags.map((item: unknown) => String(item || "").trim()).filter(Boolean)
          : [],
        notes: String(result.data?.notes || "").trim(),
      });
      toast.success("AI 修改建议已生成");
    } catch (error: any) {
      toast.error(error?.message || "AI 辅助生成失败");
    } finally {
      setAssisting(false);
    }
  };

  const applyAssist = (mode: "title" | "content" | "tags" | "all") => {
    if (!assistResult) return;

    if (mode === "title" || mode === "all") {
      if (assistResult.title) {
        setTitle(assistResult.title);
      }
    }
    if (mode === "content" || mode === "all") {
      if (assistResult.content) {
        setContent(assistResult.content);
      }
    }
    if (mode === "tags" || mode === "all") {
      if (assistResult.tags.length > 0) {
        setTagsInput(assistResult.tags.join(", "));
      }
    }

    toast.success(mode === "all" ? "AI 建议已应用到当前草稿" : "AI 建议已应用");
  };

  const drawerTitle = activeDrawer === "assist" ? "AI 辅助修改" : "草稿箱";
  const drawerDescription =
    activeDrawer === "assist"
      ? "基于当前标题、正文和标签，生成更适合发布的修改建议。"
      : "未发布完成的内容会保存在这里，你可以随时继续编辑或直接删除。";

  const drawerBody =
    activeDrawer === "assist" ? (
      <div className="space-y-5 p-6">
        <div className="rounded-[22px] border border-black/5 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-[#6b827c] dark:text-[#92aea7]">
            当前草稿
          </div>
          <div className="mt-3 space-y-3">
            <div>
              <div className="text-xs text-zinc-500">标题</div>
              <div className="mt-1 text-sm text-zinc-900 dark:text-white">
                {title.trim() || "未填写标题"}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">内容</div>
              <div className="mt-1 line-clamp-5 whitespace-pre-wrap text-sm leading-6 text-zinc-700 dark:text-zinc-200">
                {content.trim() || "未填写内容"}
              </div>
            </div>
            {normalizedCurrentTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {normalizedCurrentTags.map((tag) => (
                  <span
                    key={`current-${tag}`}
                    className="rounded-full bg-white px-3 py-1 text-xs text-zinc-600 dark:border dark:border-white/10 dark:bg-[#334640] dark:text-[#eef7f3]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
            告诉 AI 你想怎么改
          </label>
          <Textarea
            value={assistInstruction}
            onChange={(e) => setAssistInstruction(e.target.value)}
            rows={5}
            placeholder="例如：更精炼一点，突出作品灵感，语气更适合公开发布，顺便优化标题和标签"
            className="rounded-2xl"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              setAssistInstruction("让标题更醒目，正文更精炼，整体更适合作品发布。")
            }
            className="rounded-full bg-[#edf4f1] px-3 py-1.5 text-xs text-[#516762] dark:bg-white/[0.05] dark:text-[#d7e6e1]"
          >
            更适合发布
          </button>
          <button
            type="button"
            onClick={() =>
              setAssistInstruction("保留原意，增强展览感和作品介绍感，语气更高级一些。")
            }
            className="rounded-full bg-[#edf4f1] px-3 py-1.5 text-xs text-[#516762] dark:bg-white/[0.05] dark:text-[#d7e6e1]"
          >
            更有展览感
          </button>
          <button
            type="button"
            onClick={() =>
              setAssistInstruction("帮我压缩语言，减少废话，并补充更合适的发布标签。")
            }
            className="rounded-full bg-[#edf4f1] px-3 py-1.5 text-xs text-[#516762] dark:bg-white/[0.05] dark:text-[#d7e6e1]"
          >
            更精炼
          </button>
        </div>

        <Button
          type="button"
          onClick={() => void handleAssist()}
          disabled={assisting}
          className="h-11 w-full rounded-full bg-[linear-gradient(135deg,#203b35,#31524a)] text-white shadow-[0_14px_34px_rgba(32,59,53,0.22)] hover:opacity-95 dark:bg-[linear-gradient(135deg,#4f7b6f,#6a988c)] dark:text-[#f5fbf8]"
        >
          <Sparkles className="h-4 w-4" />
          {assisting ? "AI 修改中..." : "生成修改建议"}
        </Button>

        {assistResult ? (
          <div className="space-y-4">
            <div className="rounded-[22px] border border-black/5 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.03]">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-zinc-900 dark:text-white">
                  标题建议
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyAssist("title")}
                  className="rounded-full border-[#9ab0aa]/20 bg-white text-[#29413b] dark:border-white/10 dark:bg-white/[0.04] dark:text-[#e4efeb]"
                >
                  应用标题
                </Button>
              </div>
              <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-200">
                {assistResult.title || "AI 没有单独给出标题建议。"}
              </p>
            </div>

            <div className="rounded-[22px] border border-black/5 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.03]">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-zinc-900 dark:text-white">
                  正文建议
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyAssist("content")}
                  className="rounded-full border-[#9ab0aa]/20 bg-white text-[#29413b] dark:border-white/10 dark:bg-white/[0.04] dark:text-[#e4efeb]"
                >
                  应用正文
                </Button>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-700 dark:text-zinc-200">
                {assistResult.content || "AI 没有返回正文建议。"}
              </p>
            </div>

            <div className="rounded-[22px] border border-black/5 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.03]">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-zinc-900 dark:text-white">
                  标签建议
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyAssist("tags")}
                  className="rounded-full border-[#9ab0aa]/20 bg-white text-[#29413b] dark:border-white/10 dark:bg-white/[0.04] dark:text-[#e4efeb]"
                >
                  应用标签
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {assistResult.tags.length > 0 ? (
                  assistResult.tags.map((tag) => (
                    <span
                      key={`assist-${tag}`}
                      className="rounded-full bg-white px-3 py-1 text-xs text-zinc-600 dark:border dark:border-white/10 dark:bg-[#334640] dark:text-[#eef7f3]"
                    >
                      #{tag}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-zinc-500">AI 没有返回标签建议。</span>
                )}
              </div>
            </div>

            {assistResult.notes ? (
              <div className="rounded-[22px] border border-dashed border-black/10 bg-[#f6faf8] p-4 text-sm leading-6 text-zinc-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300">
                {assistResult.notes}
              </div>
            ) : null}

            <Button
              type="button"
              onClick={() => applyAssist("all")}
              className="h-11 w-full rounded-full bg-[linear-gradient(135deg,#203b35,#31524a)] text-white shadow-[0_14px_34px_rgba(32,59,53,0.22)] hover:opacity-95 dark:bg-[linear-gradient(135deg,#4f7b6f,#6a988c)] dark:text-[#f5fbf8]"
            >
              一键应用全部建议
            </Button>
          </div>
        ) : null}
      </div>
    ) : (
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
              <p className="line-clamp-3 text-sm leading-6 text-zinc-500">{post.content}</p>
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

  return (
    <div
      className={cn(
        "min-w-0 gap-6 overflow-y-auto lg:grid lg:h-[min(100%,calc(100dvh-5.75rem))] lg:min-h-[480px] lg:max-h-[calc(100dvh-5.75rem)] lg:overflow-hidden",
        activeDrawer ? "lg:grid-cols-[minmax(0,1fr)_420px]" : "grid-cols-1"
      )}
    >
      <section className="relative min-h-0 rounded-[30px] border border-[#94a7a1]/16 bg-[radial-gradient(circle_at_14%_18%,rgba(130,163,153,0.14),transparent_26%),radial-gradient(circle_at_86%_12%,rgba(226,232,229,0.78),transparent_24%),radial-gradient(circle_at_76%_80%,rgba(93,121,114,0.07),transparent_22%),linear-gradient(135deg,rgba(252,252,251,0.98),rgba(243,246,244,0.96)_54%,rgba(236,240,239,0.95))] p-6 shadow-[0_26px_80px_rgba(43,60,55,0.08)] lg:h-full lg:overflow-y-auto dark:border-[#6c827c]/16 dark:bg-[radial-gradient(circle_at_14%_18%,rgba(95,129,120,0.11),transparent_26%),radial-gradient(circle_at_86%_12%,rgba(83,102,98,0.16),transparent_22%),radial-gradient(circle_at_76%_80%,rgba(56,77,72,0.10),transparent_22%),linear-gradient(135deg,rgba(24,28,28,0.98),rgba(29,35,34,0.98)_54%,rgba(22,25,25,0.97))]">
        <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(108,134,126,0.24),rgba(176,188,184,0.22),transparent)] dark:bg-[linear-gradient(90deg,transparent,rgba(117,144,136,0.24),rgba(86,104,99,0.20),transparent)]" />
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.32em] text-[#6b827c] dark:text-[#92aea7]">
              创作中心
            </div>
            <h1 className="text-3xl font-semibold tracking-[0.01em] text-[#20312d] dark:text-[#e6efec]">
              发布你的内容
            </h1>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button
              type="button"
              onClick={() =>
                setActiveDrawer((prev) => (prev === "assist" ? null : "assist"))
              }
              className="h-11 rounded-full bg-[linear-gradient(135deg,#203b35,#31524a)] px-5 text-white shadow-[0_14px_34px_rgba(32,59,53,0.22)] hover:opacity-95 dark:bg-[linear-gradient(135deg,#4f7b6f,#6a988c)] dark:text-[#f5fbf8]"
            >
              <Sparkles className="h-4 w-4" />
              AI辅助修改
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

        <div className="grid gap-3 md:grid-cols-3">
          {typeOptions.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setType(item.value)}
              className={cn(
                "rounded-2xl border p-4 text-left transition",
                type === item.value
                  ? "border-[#24433c] bg-[linear-gradient(135deg,#24433c,#35574f)] text-[#edf3ec] shadow-[0_14px_34px_rgba(36,67,60,0.24)] dark:border-[#6fa08c] dark:bg-[linear-gradient(135deg,#3d675d,#547a70)] dark:text-[#f4efe4]"
                  : "border-[#a6b7b2]/14 bg-white/46 text-[#5a6a66] hover:border-[#7f9891]/22 hover:bg-white/60 dark:border-[#6f9188]/10 dark:bg-white/[0.03] dark:text-[#b4c4c0] dark:hover:bg-white/[0.055]"
              )}
            >
              <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                {item.icon}
                {item.title}
              </div>
              <p className="text-xs leading-5 opacity-80">{item.description}</p>
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
              标题
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="给作品起一个名字，不填会自动截取内容前 30 个字"
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
              内容
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="写下你的创作说明、灵感、作品介绍或视频简介"
              rows={10}
              className="rounded-2xl"
            />
          </div>

          {type === "image" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  图片
                </label>
                <Button type="button" variant="outline" size="sm" onClick={addImageSlot}>
                  <Plus className="mr-1 h-4 w-4" />
                  添加图片
                </Button>
              </div>
              {imageUrls.map((value, index) => (
                <div key={`image-${index}`} className="rounded-2xl border border-black/5 p-3 dark:border-white/10">
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
          )}

          {type === "video" && (
            <div className="space-y-4">
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
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
              标签
            </label>
            <Input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="多个标签用英文逗号或中文逗号分隔，例如：杭绣, 非遗, 展览"
              className="h-11 rounded-xl"
            />
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
        <aside className="min-h-0 overflow-hidden rounded-[30px] border border-black/5 bg-[linear-gradient(180deg,rgba(251,252,252,0.98),rgba(243,246,245,0.97))] shadow-[0_24px_64px_rgba(15,23,42,0.10)] lg:flex lg:h-full lg:flex-col dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(27,31,31,0.98),rgba(22,26,26,0.98))]">
          <div className="flex items-start justify-between gap-4 border-b border-black/5 px-6 py-5 dark:border-white/10">
            <div>
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
                {drawerTitle}
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {drawerDescription}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveDrawer(null)}
              className="rounded-full p-2 text-zinc-500 transition hover:bg-black/[0.04] hover:text-zinc-900 dark:hover:bg-white/5 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">{drawerBody}</div>
        </aside>
      ) : null}
    </div>
  );
}
