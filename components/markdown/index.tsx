"use client";

import "highlight.js/styles/atom-one-dark.min.css";
import "./markdown.css";

import MarkdownIt from "markdown-it";
import React from "react";
import hljs from "highlight.js";
import { cn } from "@/lib/utils";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const md = new MarkdownIt({
  breaks: true,
  linkify: true,
  highlight: function (str: string, lang: string) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code>${
          hljs.highlight(str, { language: lang, ignoreIllegals: true }).value
        }</code></pre>`;
      } catch (_) {}
    }

    return `<pre class="hljs"><code>${escapeHtml(str)}</code></pre>`;
  },
});

export default function Markdown({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const renderedMarkdown = md.render(content);

  return (
    <div
      className={cn("markdown max-w-full overflow-x-auto", className)}
      dangerouslySetInnerHTML={{ __html: renderedMarkdown }}
    />
  );
}
