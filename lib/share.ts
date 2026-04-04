export async function shareForumPost(options: {
  locale: string;
  postId: string;
  title?: string;
  text?: string;
}) {
  const url =
    typeof window !== "undefined"
      ? new URL(`/${options.locale}/home/forum/post/${options.postId}`, window.location.origin).toString()
      : `/${options.locale}/home/forum/post/${options.postId}`;

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    await navigator.share({
      title: options.title,
      text: options.text,
      url,
    });
    return "shared" as const;
  }

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
    return "copied" as const;
  }

  throw new Error("share unavailable");
}
