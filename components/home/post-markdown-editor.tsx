"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Bold,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Keyboard,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Quote,
  ScanText,
  Table2,
} from "lucide-react";
import Markdown from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type PostMarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
};

type SelectionTransform = {
  text: string;
  selectionStart?: number;
  selectionEnd?: number;
};

type ToolbarAction =
  | "heading1"
  | "heading2"
  | "heading3"
  | "bold"
  | "italic"
  | "inlineCode"
  | "codeBlock"
  | "quote"
  | "bullet"
  | "ordered"
  | "table"
  | "link"
  | "image"
  | "divider";

function wrapSelection(
  source: string,
  start: number,
  end: number,
  prefix: string,
  suffix = prefix,
  fallback = ""
): SelectionTransform {
  const selected = source.slice(start, end);
  const inserted = selected || fallback;
  const nextText =
    source.slice(0, start) + prefix + inserted + suffix + source.slice(end);
  const selectionStart = start + prefix.length;
  const selectionEnd = selectionStart + inserted.length;

  return {
    text: nextText,
    selectionStart,
    selectionEnd,
  };
}

function prefixSelectedLines(
  source: string,
  start: number,
  end: number,
  prefixBuilder: (index: number) => string
): SelectionTransform {
  const blockStart = source.lastIndexOf("\n", Math.max(start - 1, 0)) + 1;
  const nextBreak = source.indexOf("\n", end);
  const blockEnd = nextBreak === -1 ? source.length : nextBreak;
  const block = source.slice(blockStart, blockEnd);
  const lines = block.split("\n");
  const nextBlock = lines.map((line, index) => `${prefixBuilder(index)}${line}`).join("\n");
  const nextText = source.slice(0, blockStart) + nextBlock + source.slice(blockEnd);

  return {
    text: nextText,
    selectionStart: blockStart,
    selectionEnd: blockStart + nextBlock.length,
  };
}

const toolbarGroups: Array<
  Array<{
    key: ToolbarAction;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }>
> = [
  [
    { key: "heading1", label: "标题1", icon: Heading1 },
    { key: "heading2", label: "标题2", icon: Heading2 },
    { key: "heading3", label: "标题3", icon: Heading3 },
  ],
  [
    { key: "bold", label: "加粗", icon: Bold },
    { key: "italic", label: "斜体", icon: Italic },
    { key: "inlineCode", label: "行内代码", icon: Code2 },
    { key: "codeBlock", label: "代码块", icon: Code2 },
  ],
  [
    { key: "link", label: "链接", icon: LinkIcon },
    { key: "image", label: "插图", icon: ImageIcon },
    { key: "divider", label: "分隔线", icon: Minus },
  ],
  [
    { key: "quote", label: "引用", icon: Quote },
    { key: "bullet", label: "无序列表", icon: List },
    { key: "ordered", label: "有序列表", icon: ListOrdered },
    { key: "table", label: "表格", icon: Table2 },
  ],

];

const shortcutTips = [
  "Ctrl/Cmd + B 加粗",
  "Ctrl/Cmd + I 斜体",
  "Ctrl/Cmd + K 链接",
  "Alt + 1/2/3 标题",
  "Alt + C 代码块",
  "Alt + T 表格",
];

export function PostMarkdownEditor({
  value,
  onChange,
  placeholder,
  rows = 14,
  className,
}: PostMarkdownEditorProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const uploadInputRef = React.useRef<HTMLInputElement | null>(null);
  const [previewMode, setPreviewMode] = React.useState<"split" | "edit" | "preview">("split");
  const [uploading, setUploading] = React.useState(false);

  const focusTextarea = React.useCallback(
    (selection?: { start?: number; end?: number }) => {
      requestAnimationFrame(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.focus();
        if (
          typeof selection?.start === "number" &&
          typeof selection?.end === "number"
        ) {
          textarea.setSelectionRange(selection.start, selection.end);
        }
      });
    },
    []
  );

  const applyTransform = React.useCallback(
    (transformer: (source: string, start: number, end: number) => SelectionTransform) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart ?? value.length;
      const end = textarea.selectionEnd ?? value.length;
      const result = transformer(value, start, end);
      onChange(result.text);
      focusTextarea({
        start: result.selectionStart ?? start,
        end: result.selectionEnd ?? end,
      });
    },
    [focusTextarea, onChange, value]
  );

  const insertTemplate = React.useCallback(
    (
      template: string,
      selectionWithinTemplate?: {
        start: number;
        end: number;
      }
    ) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart ?? value.length;
      const end = textarea.selectionEnd ?? value.length;
      const prefix = start > 0 && value[start - 1] !== "\n" ? "\n\n" : "";
      const suffix = end < value.length && value[end] !== "\n" ? "\n\n" : "\n";
      const nextText =
        value.slice(0, start) + prefix + template + suffix + value.slice(end);
      const templateStart = start + prefix.length;

      onChange(nextText);
      focusTextarea({
        start:
          selectionWithinTemplate?.start !== undefined
            ? templateStart + selectionWithinTemplate.start
            : templateStart + template.length,
        end:
          selectionWithinTemplate?.end !== undefined
            ? templateStart + selectionWithinTemplate.end
            : templateStart + template.length,
      });
    },
    [focusTextarea, onChange, value]
  );

  const handleToolbarAction = React.useCallback(
    (action: ToolbarAction) => {
      switch (action) {
        case "heading1":
          applyTransform((source, start, end) =>
            prefixSelectedLines(source, start, end, () => "# ")
          );
          break;
        case "heading2":
          applyTransform((source, start, end) =>
            prefixSelectedLines(source, start, end, () => "## ")
          );
          break;
        case "heading3":
          applyTransform((source, start, end) =>
            prefixSelectedLines(source, start, end, () => "### ")
          );
          break;
        case "bold":
          applyTransform((source, start, end) =>
            wrapSelection(source, start, end, "**", "**", "加粗内容")
          );
          break;
        case "italic":
          applyTransform((source, start, end) =>
            wrapSelection(source, start, end, "*", "*", "斜体内容")
          );
          break;
        case "inlineCode":
          applyTransform((source, start, end) =>
            wrapSelection(source, start, end, "`", "`", "code")
          );
          break;
        case "codeBlock":
          insertTemplate("```ts\nconst work = true;\n```", {
            start: 6,
            end: 23,
          });
          break;
        case "quote":
          applyTransform((source, start, end) =>
            prefixSelectedLines(source, start, end, () => "> ")
          );
          break;
        case "bullet":
          applyTransform((source, start, end) =>
            prefixSelectedLines(source, start, end, () => "- ")
          );
          break;
        case "ordered":
          applyTransform((source, start, end) =>
            prefixSelectedLines(source, start, end, (index) => `${index + 1}. `)
          );
          break;
        case "table":
          insertTemplate(
            "| 字段 | 内容 |\n| --- | --- |\n| 示例 | 这里填写内容 |",
            {
              start: 31,
              end: 37,
            }
          );
          break;
        case "link":
          applyTransform((source, start, end) =>
            wrapSelection(source, start, end, "[", "](https://)", "链接文字")
          );
          break;
        case "image":
          uploadInputRef.current?.click();
          break;
        case "divider":
          insertTemplate("---");
          break;
        default:
          break;
      }
    },
    [applyTransform, insertTemplate]
  );

  const handleUploadImage = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";

      if (!file) return;
      if (!file.type.startsWith("image/")) {
        toast.error("请选择图片文件");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("图片大小不能超过 10MB");
        return;
      }

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload/image", {
          method: "POST",
          body: formData,
        });
        const result = await response.json();

        if (result.code !== 0 || !result.data?.url) {
          throw new Error(result.message || "上传失败");
        }

        const altText = file.name.replace(/\.[^.]+$/, "") || "图片";
        insertTemplate(`![${altText}](${result.data.url})`);
        toast.success("图片已插入正文");
      } catch (error: any) {
        toast.error(error?.message || "上传失败");
      } finally {
        setUploading(false);
      }
    },
    [insertTemplate]
  );

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const isMod = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

      if (isMod && key === "b") {
        event.preventDefault();
        handleToolbarAction("bold");
        return;
      }

      if (isMod && key === "i") {
        event.preventDefault();
        handleToolbarAction("italic");
        return;
      }

      if (isMod && key === "k") {
        event.preventDefault();
        handleToolbarAction("link");
        return;
      }

      if (event.altKey && key === "1") {
        event.preventDefault();
        handleToolbarAction("heading1");
        return;
      }

      if (event.altKey && key === "2") {
        event.preventDefault();
        handleToolbarAction("heading2");
        return;
      }

      if (event.altKey && key === "3") {
        event.preventDefault();
        handleToolbarAction("heading3");
        return;
      }

      if (event.altKey && key === "c") {
        event.preventDefault();
        handleToolbarAction("codeBlock");
        return;
      }

      if (event.altKey && key === "t") {
        event.preventDefault();
        handleToolbarAction("table");
      }
    },
    [handleToolbarAction]
  );

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[28px] border border-black/6 bg-white/88 shadow-[0_18px_42px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-white/[0.03]",
        className
      )}
    >
      <div className="flex flex-col gap-3 border-b border-black/6 px-4 py-4 dark:border-white/10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#6b827c] dark:text-[#92aea7]">
              <ScanText className="h-3.5 w-3.5" />
              混合编辑器
            </div>
            <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              支持 Markdown、快捷键、表格、代码块和正文插图。
            </div>
          </div>

          <div className="flex items-center gap-2">
            {[
              { key: "edit", label: "仅编辑" },
              { key: "split", label: "分栏预览" },
              { key: "preview", label: "仅预览" },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setPreviewMode(item.key as "split" | "edit" | "preview")}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs transition",
                  previewMode === item.key
                    ? "bg-[#203b35] text-white dark:bg-[#6f9188] dark:text-[#13221f]"
                    : "bg-[#edf3f0] text-[#5a6a66] hover:bg-white dark:bg-white/[0.05] dark:text-zinc-300 dark:hover:bg-white/[0.08]"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto pb-1">
          <div className="flex min-w-max items-center gap-2">
            {toolbarGroups.map((group, groupIndex) => (
              <div
                key={`group-${groupIndex}`}
                className="flex items-center gap-1.5 rounded-full border border-[#d7e1de] bg-[#f7faf8] px-2 py-1.5 dark:border-white/10 dark:bg-white/[0.04]"
              >
                {group.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.key}
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToolbarAction(item.key)}
                      disabled={uploading || previewMode === "preview"}
                      className="h-8 rounded-full px-2.5 text-[#314741] hover:bg-white dark:text-[#e3efeb] dark:hover:bg-white/[0.08]"
                    >
                      <Icon className="mr-1.5 h-4 w-4" />
                      {item.label}
                    </Button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        className={cn(
          "grid gap-px bg-black/6 dark:bg-white/10",
          previewMode === "split" ? "xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]" : "grid-cols-1"
        )}
      >
        {previewMode !== "preview" ? (
          <div className="bg-[linear-gradient(180deg,rgba(252,253,252,0.98),rgba(247,249,248,0.98))] p-4 dark:bg-[linear-gradient(180deg,rgba(26,30,30,0.96),rgba(23,27,27,0.98))]">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={rows}
              className="min-h-[360px] rounded-[22px] border-[#d4dfdb] bg-white/95 px-4 py-4 text-[15px] leading-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:border-white/10 dark:bg-[#171b1b]"
            />
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#eef4f1] px-2.5 py-1 text-[#55706a] dark:bg-white/[0.05] dark:text-zinc-300">
                <Keyboard className="h-3.5 w-3.5" />
                快捷键
              </span>
              {shortcutTips.map((tip) => (
                <span
                  key={tip}
                  className="rounded-full bg-white px-2.5 py-1 shadow-sm dark:bg-white/[0.04]"
                >
                  {tip}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {previewMode !== "edit" ? (
          <div className="bg-[linear-gradient(180deg,rgba(249,251,250,0.98),rgba(243,247,245,0.98))] p-4 dark:bg-[linear-gradient(180deg,rgba(24,28,28,0.98),rgba(20,24,24,0.98))]">
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#6b827c] dark:text-[#92aea7]">
              实时预览
            </div>
            <div className="min-h-[360px] rounded-[22px] border border-black/5 bg-white/88 p-5 dark:border-white/10 dark:bg-white/[0.03]">
              {value.trim() ? (
                <Markdown
                  content={value}
                  className="text-[15px] leading-7 text-zinc-700 dark:text-zinc-200"
                />
              ) : (
                <div className="text-sm text-zinc-500 dark:text-zinc-400">
                  这里会显示发布后的正文效果。
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        onChange={handleUploadImage}
        className="hidden"
      />
    </div>
  );
}
