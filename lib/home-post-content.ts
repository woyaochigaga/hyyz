export function stripMarkdownToText(content: string) {
  return content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "$1 ")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/^>\s?/gm, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/[*_~]/g, "")
    .replace(/^---$/gm, " ")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getHomePostExcerpt(content: string, maxLength = 120) {
  const plainText = stripMarkdownToText(content);

  if (plainText.length <= maxLength) {
    return plainText;
  }

  return `${plainText.slice(0, maxLength).trimEnd()}...`;
}

export function getHomePostMarkdownPreview(content: string, maxLength = 220) {
  const source = String(content || "")
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "")
    .replace(/<img[^>]*>/gi, "")
    .replace(/```[\s\S]*?```/g, (block) => {
      const summary = stripMarkdownToText(block).slice(0, 56).trim();
      return summary ? `\n\n\`${summary}\`\n\n` : "\n\n";
    })
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (source.length <= maxLength) {
    return source;
  }

  const sliced = source.slice(0, maxLength).trimEnd();
  const normalized = sliced.replace(/\s+[^\s]*$/, "").trimEnd();

  return `${normalized || sliced}\n\n...`;
}
