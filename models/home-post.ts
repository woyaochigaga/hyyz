import { getSupabaseClient } from "@/models/db";
import { getUsersByUuids } from "@/models/user";
import {
  HomePost,
  HomePostAuthor,
  HomePostAttachment,
  HomePostComment,
  HomePostCommentStatus,
  HomePostDisplaySettings,
  HomePostEditorMode,
  HomePostContentFormat,
  HomePostStatus,
  HomePostType,
} from "@/types/home-post";
import { getIsoTimestr } from "@/lib/time";
import { getHomePostExcerpt } from "@/lib/home-post-content";

type HomePostRow = {
  id?: number;
  uuid: string;
  user_uuid: string;
  locale?: string;
  type: HomePostType;
  title?: string;
  excerpt?: string;
  content?: string;
  content_format?: HomePostContentFormat;
  editor_mode?: HomePostEditorMode;
  content_blocks?: unknown;
  attachments?: unknown;
  display_settings?: unknown;
  cover_url?: string;
  images?: unknown;
  video_url?: string;
  status?: HomePostStatus;
  like_count?: number;
  comment_count?: number;
  created_at?: string;
  updated_at?: string;
  published_at?: string;
};

type HomePostTagRow = {
  post_uuid: string;
  tag: string;
};

type HomePostLikeRow = {
  post_uuid: string;
  user_uuid: string;
};

type HomePostCommentRow = {
  id?: number;
  uuid: string;
  post_uuid: string;
  user_uuid: string;
  parent_uuid?: string;
  content?: string;
  status?: HomePostCommentStatus;
  created_at?: string;
  updated_at?: string;
};

function normalizeStringArray(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input.map((item) => String(item || "").trim()).filter(Boolean);
  }

  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item || "").trim()).filter(Boolean);
      }
    } catch {
      return [];
    }
  }

  return [];
}

function normalizeImages(input: unknown): string[] {
  return normalizeStringArray(input);
}

function normalizeRecordArray(input: unknown): Record<string, unknown>[] {
  if (Array.isArray(input)) {
    return input.filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null && !Array.isArray(item)
    );
  }

  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item): item is Record<string, unknown> =>
            typeof item === "object" && item !== null && !Array.isArray(item)
        );
      }
    } catch {
      return [];
    }
  }

  return [];
}

function normalizeAttachments(input: unknown): HomePostAttachment[] {
  const attachments = normalizeRecordArray(input).map((item): HomePostAttachment | null => {
      const type = String(item.type || "").trim();
      const url = String(item.url || "").trim();

      if (!url) return null;
      if (!["image", "video", "file", "link"].includes(type)) return null;

      return {
        type: type as HomePostAttachment["type"],
        url,
        title: String(item.title || "").trim() || undefined,
        mime_type: String(item.mime_type || "").trim() || undefined,
        size:
          typeof item.size === "number" && Number.isFinite(item.size)
            ? item.size
            : undefined,
        width:
          typeof item.width === "number" && Number.isFinite(item.width)
            ? item.width
            : undefined,
        height:
          typeof item.height === "number" && Number.isFinite(item.height)
            ? item.height
            : undefined,
        alt: String(item.alt || "").trim() || undefined,
      };
    });

  return attachments.filter((item): item is HomePostAttachment => item !== null).slice(0, 30);
}

function normalizeDisplaySettings(input: unknown): HomePostDisplaySettings {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    if (typeof input === "string") {
      try {
        const parsed = JSON.parse(input);
        return normalizeDisplaySettings(parsed);
      } catch {
        return {};
      }
    }

    return {};
  }

  const raw = input as Record<string, unknown>;
  const contentWidth = String(raw.content_width || "").trim();
  const coverStyle = String(raw.cover_style || "").trim();

  return {
    content_width:
      contentWidth === "compact" ||
      contentWidth === "comfortable" ||
      contentWidth === "wide"
        ? (contentWidth as HomePostDisplaySettings["content_width"])
        : undefined,
    cover_style:
      coverStyle === "auto" ||
      coverStyle === "immersive" ||
      coverStyle === "card"
        ? (coverStyle as HomePostDisplaySettings["cover_style"])
        : undefined,
    emphasize_excerpt:
      typeof raw.emphasize_excerpt === "boolean"
        ? raw.emphasize_excerpt
        : undefined,
  };
}

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];

  return Array.from(
    new Set(
      tags
        .map((item) => String(item || "").trim().replace(/\s+/g, " "))
        .filter(Boolean)
        .slice(0, 10)
    )
  );
}

function toHomePost(row: HomePostRow): HomePost {
  return {
    id: row.id,
    uuid: row.uuid,
    user_uuid: row.user_uuid,
    locale: row.locale || "",
    type: row.type,
    title: row.title || "",
    excerpt: row.excerpt || "",
    content: row.content || "",
    content_format: row.content_format || "markdown",
    editor_mode: row.editor_mode || "hybrid",
    content_blocks: normalizeRecordArray(row.content_blocks),
    attachments: normalizeAttachments(row.attachments),
    display_settings: normalizeDisplaySettings(row.display_settings),
    cover_url: row.cover_url || "",
    images: normalizeImages(row.images),
    video_url: row.video_url || "",
    status: row.status || "published",
    like_count: Number(row.like_count || 0),
    comment_count: Number(row.comment_count || 0),
    created_at: row.created_at || "",
    updated_at: row.updated_at || "",
    published_at: row.published_at || "",
  };
}

function toHomePostComment(row: HomePostCommentRow): HomePostComment {
  return {
    id: row.id,
    uuid: row.uuid,
    post_uuid: row.post_uuid,
    user_uuid: row.user_uuid,
    parent_uuid: row.parent_uuid || "",
    content: row.content || "",
    status: row.status || "active",
    created_at: row.created_at || "",
    updated_at: row.updated_at || "",
  };
}

function buildCommentTree(comments: HomePostComment[]) {
  const map = new Map<string, HomePostComment>();
  const roots: HomePostComment[] = [];

  for (const comment of comments) {
    map.set(comment.uuid, {
      ...comment,
      replies: [],
    });
  }

  for (const comment of Array.from(map.values())) {
    if (comment.parent_uuid && map.has(comment.parent_uuid)) {
      map.get(comment.parent_uuid)?.replies?.push(comment);
    } else {
      roots.push(comment);
    }
  }

  const sortReplies = (items: HomePostComment[]) => {
    items.sort((a, b) => {
      const aTime = Date.parse(String(a.created_at || "")) || 0;
      const bTime = Date.parse(String(b.created_at || "")) || 0;
      return aTime - bTime;
    });

    for (const item of items) {
      if (item.replies?.length) {
        sortReplies(item.replies);
      }
    }
  };

  sortReplies(roots);
  return roots.sort((a, b) => {
    const aTime = Date.parse(String(a.created_at || "")) || 0;
    const bTime = Date.parse(String(b.created_at || "")) || 0;
    return bTime - aTime;
  });
}

async function buildAuthors(userUuids: string[]) {
  const users = await getUsersByUuids(Array.from(new Set(userUuids.filter(Boolean))));
  const map = new Map<string, HomePostAuthor>();

  for (const user of users) {
    if (!user.uuid) continue;
    map.set(user.uuid, {
      uuid: user.uuid,
      nickname: user.nickname || "未命名用户",
      avatar_url: user.avatar_url || "",
    });
  }

  return map;
}

async function attachPostMeta(posts: HomePost[], currentUserUuid?: string) {
  if (posts.length === 0) return posts;

  const supabase = getSupabaseClient();
  const postUuids = posts.map((item) => item.uuid);

  const [{ data: tagRows }, { data: likeRows }, authorMap] = await Promise.all([
    supabase
      .from("home_post_tags")
      .select("post_uuid, tag")
      .in("post_uuid", postUuids),
    currentUserUuid
      ? supabase
          .from("home_post_likes")
          .select("post_uuid, user_uuid")
          .in("post_uuid", postUuids)
          .eq("user_uuid", currentUserUuid)
      : Promise.resolve({ data: [] as HomePostLikeRow[] }),
    buildAuthors(posts.map((item) => item.user_uuid)),
  ]);

  const tagsMap = new Map<string, string[]>();
  for (const row of (tagRows || []) as HomePostTagRow[]) {
    const list = tagsMap.get(row.post_uuid) || [];
    list.push(String(row.tag || ""));
    tagsMap.set(row.post_uuid, list);
  }

  const likedSet = new Set(
    ((likeRows || []) as HomePostLikeRow[]).map((item) => item.post_uuid)
  );

  return posts.map((item) => ({
    ...item,
    tags: tagsMap.get(item.uuid) || [],
    liked: likedSet.has(item.uuid),
    author:
      authorMap.get(item.user_uuid) ||
      ({
        uuid: item.user_uuid,
        nickname: "未命名用户",
        avatar_url: "",
      } as HomePostAuthor),
  }));
}

async function attachCommentAuthors(comments: HomePostComment[]) {
  if (comments.length === 0) return comments;

  const authorMap = await buildAuthors(comments.map((item) => item.user_uuid));

  return comments.map((item) => ({
    ...item,
    author:
      authorMap.get(item.user_uuid) ||
      ({
        uuid: item.user_uuid,
        nickname: "未命名用户",
        avatar_url: "",
      } as HomePostAuthor),
  }));
}

export function validateHomePostPayload(input: Partial<HomePost>) {
  const type = (input.type || "text") as HomePostType;
  const content = String(input.content || "").trim();
  const title = String(input.title || "").trim();
  const excerpt = String(input.excerpt || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 280);
  const content_format: HomePostContentFormat =
    input.content_format === "plain" ? "plain" : "markdown";
  const editor_mode: HomePostEditorMode =
    input.editor_mode === "markdown" || input.editor_mode === "rich"
      ? input.editor_mode
      : "hybrid";
  const content_blocks = normalizeRecordArray(input.content_blocks);
  const attachments = normalizeAttachments(input.attachments);
  const display_settings = normalizeDisplaySettings(input.display_settings);
  const cover_url = String(input.cover_url || "").trim();
  const images = normalizeImages(input.images);
  const video_url = String(input.video_url || "").trim();
  const status: HomePostStatus =
    input.status === "draft" || input.status === "deleted"
      ? input.status
      : "published";
  const tags = normalizeTags(input.tags);

  if (!["text", "image", "video"].includes(type)) {
    throw new Error("invalid post type");
  }

  if (status !== "draft") {
    if (!content) {
      throw new Error("content is required");
    }

    if (type === "image" && !cover_url && images.length === 0) {
      throw new Error("image post requires cover_url");
    }

    if (type === "video" && !video_url) {
      throw new Error("video post requires video_url");
    }
  } else {
    const hasAnyContent = Boolean(
      title ||
        excerpt ||
        content ||
        cover_url ||
        images.length > 0 ||
        video_url ||
        tags.length > 0 ||
        attachments.length > 0
    );
    if (!hasAnyContent) {
      throw new Error("draft is empty");
    }
  }

  return {
    type,
    title: title || content.slice(0, 30),
    excerpt: excerpt || getHomePostExcerpt(content, 120),
    content,
    content_format,
    editor_mode,
    content_blocks,
    attachments,
    display_settings,
    cover_url,
    images: images.length > 0 ? images : cover_url ? [cover_url] : [],
    video_url,
    status,
    tags,
  };
}

export async function createHomePost(
  post: Omit<HomePost, "id" | "like_count" | "comment_count" | "author" | "liked" | "tags"> & {
    tags?: string[];
  }
) {
  const supabase = getSupabaseClient();
  const now = getIsoTimestr();

  const row = {
    uuid: post.uuid,
    user_uuid: post.user_uuid,
    locale: post.locale || "",
    type: post.type,
    title: post.title || "",
    excerpt: post.excerpt || "",
    content: post.content || "",
    content_format: post.content_format || "markdown",
    editor_mode: post.editor_mode || "hybrid",
    content_blocks: normalizeRecordArray(post.content_blocks),
    attachments: normalizeAttachments(post.attachments),
    display_settings: normalizeDisplaySettings(post.display_settings),
    cover_url: post.cover_url || "",
    images: JSON.stringify(normalizeImages(post.images)),
    video_url: post.video_url || "",
    status: post.status || "published",
    like_count: 0,
    comment_count: 0,
    created_at: now,
    updated_at: now,
    published_at: post.status === "draft" ? null : now,
  };

  const { error } = await supabase.from("home_posts").insert(row);
  if (error) throw error;

  await replaceHomePostTags(post.uuid, post.tags || []);
  return findHomePostByUuid(post.uuid, post.user_uuid);
}

export async function updateHomePost(
  uuid: string,
  user_uuid: string,
  patch: Partial<HomePost> & { tags?: string[] }
) {
  const supabase = getSupabaseClient();
  const updatePayload: Record<string, any> = {
    updated_at: getIsoTimestr(),
  };

  if (patch.type) updatePayload.type = patch.type;
  if (typeof patch.title === "string") updatePayload.title = patch.title;
  if (typeof patch.excerpt === "string") updatePayload.excerpt = patch.excerpt;
  if (typeof patch.content === "string") updatePayload.content = patch.content;
  if (patch.content_format) updatePayload.content_format = patch.content_format;
  if (patch.editor_mode) updatePayload.editor_mode = patch.editor_mode;
  if (patch.content_blocks) {
    updatePayload.content_blocks = normalizeRecordArray(patch.content_blocks);
  }
  if (patch.attachments) {
    updatePayload.attachments = normalizeAttachments(patch.attachments);
  }
  if (patch.display_settings) {
    updatePayload.display_settings = normalizeDisplaySettings(patch.display_settings);
  }
  if (typeof patch.cover_url === "string") updatePayload.cover_url = patch.cover_url;
  if (patch.images) updatePayload.images = JSON.stringify(normalizeImages(patch.images));
  if (typeof patch.video_url === "string") updatePayload.video_url = patch.video_url;
  if (patch.status) {
    updatePayload.status = patch.status;
    if (patch.status === "published") {
      updatePayload.published_at = getIsoTimestr();
    }
  }

  const { error } = await supabase
    .from("home_posts")
    .update(updatePayload)
    .eq("uuid", uuid)
    .eq("user_uuid", user_uuid);

  if (error) throw error;

  if (patch.tags) {
    await replaceHomePostTags(uuid, patch.tags);
  }

  return findHomePostByUuid(uuid, user_uuid);
}

export async function softDeleteHomePost(uuid: string, user_uuid: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("home_posts")
    .update({
      status: "deleted",
      updated_at: getIsoTimestr(),
    })
    .eq("uuid", uuid)
    .eq("user_uuid", user_uuid);

  if (error) throw error;
}

export async function findHomePostRowByUuid(uuid: string): Promise<HomePost | undefined> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("home_posts")
    .select("*")
    .eq("uuid", uuid)
    .limit(1)
    .single();

  if (error || !data) return undefined;
  return toHomePost(data as HomePostRow);
}

export async function findHomePostByUuid(uuid: string, currentUserUuid?: string) {
  const post = await findHomePostRowByUuid(uuid);
  if (!post) return undefined;
  const [result] = await attachPostMeta([post], currentUserUuid);
  return result;
}

export async function listHomePosts(params?: {
  currentUserUuid?: string;
  locale?: string;
  user_uuid?: string;
  includeDraft?: boolean;
  includeDeleted?: boolean;
}) {
  const supabase = getSupabaseClient();
  let query = supabase
    .from("home_posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (params?.user_uuid) {
    query = query.eq("user_uuid", params.user_uuid);
  }

  if (!params?.includeDeleted) {
    query = query.neq("status", "deleted");
  }

  if (!params?.includeDraft) {
    query = query.eq("status", "published");
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return attachPostMeta(
    (data as HomePostRow[]).map(toHomePost),
    params?.currentUserUuid
  );
}

export async function replaceHomePostTags(post_uuid: string, tags: string[]) {
  const supabase = getSupabaseClient();
  const normalized = normalizeTags(tags);

  const { error: deleteError } = await supabase
    .from("home_post_tags")
    .delete()
    .eq("post_uuid", post_uuid);
  if (deleteError) throw deleteError;

  if (normalized.length === 0) return;

  const { error } = await supabase.from("home_post_tags").insert(
    normalized.map((tag) => ({
      post_uuid,
      tag,
      created_at: getIsoTimestr(),
    }))
  );

  if (error) throw error;
}

export async function refreshHomePostCounters(post_uuid: string) {
  const supabase = getSupabaseClient();
  const [{ count: likeCount }, { count: commentCount }] = await Promise.all([
    supabase
      .from("home_post_likes")
      .select("*", { count: "exact", head: true })
      .eq("post_uuid", post_uuid),
    supabase
      .from("home_post_comments")
      .select("*", { count: "exact", head: true })
      .eq("post_uuid", post_uuid)
      .eq("status", "active"),
  ]);

  const { error } = await supabase
    .from("home_posts")
    .update({
      like_count: likeCount || 0,
      comment_count: commentCount || 0,
      updated_at: getIsoTimestr(),
    })
    .eq("uuid", post_uuid);

  if (error) throw error;
}

export async function toggleHomePostLike(post_uuid: string, user_uuid: string) {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from("home_post_likes")
    .select("id")
    .eq("post_uuid", post_uuid)
    .eq("user_uuid", user_uuid)
    .limit(1)
    .maybeSingle();

  if (data?.id) {
    const { error } = await supabase
      .from("home_post_likes")
      .delete()
      .eq("post_uuid", post_uuid)
      .eq("user_uuid", user_uuid);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("home_post_likes").insert({
      post_uuid,
      user_uuid,
      created_at: getIsoTimestr(),
    });
    if (error) throw error;
  }

  await refreshHomePostCounters(post_uuid);
  const post = await findHomePostByUuid(post_uuid, user_uuid);
  return {
    liked: Boolean(post?.liked),
    like_count: post?.like_count || 0,
  };
}

export async function listHomePostComments(
  post_uuid: string,
  opts?: { includeHidden?: boolean }
) {
  const supabase = getSupabaseClient();
  let query = supabase
    .from("home_post_comments")
    .select("*")
    .eq("post_uuid", post_uuid)
    .order("created_at", { ascending: false });

  if (!opts?.includeHidden) {
    query = query.eq("status", "active");
  }

  const { data, error } = await query;
  if (error || !data) return [];

  const comments = await attachCommentAuthors(
    (data as HomePostCommentRow[]).map(toHomePostComment)
  );
  return buildCommentTree(comments);
}

export async function createHomePostComment(comment: HomePostComment) {
  const supabase = getSupabaseClient();
  const now = getIsoTimestr();
  const { error } = await supabase.from("home_post_comments").insert({
    uuid: comment.uuid,
    post_uuid: comment.post_uuid,
    user_uuid: comment.user_uuid,
    parent_uuid: comment.parent_uuid || "",
    content: comment.content,
    status: "active",
    created_at: now,
    updated_at: now,
  });

  if (error) throw error;
  await refreshHomePostCounters(comment.post_uuid);
  const list = await listHomePostComments(comment.post_uuid);
  return list.find((item) => item.uuid === comment.uuid);
}

export async function findHomePostCommentByUuid(uuid: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("home_post_comments")
    .select("*")
    .eq("uuid", uuid)
    .limit(1)
    .single();

  if (error || !data) return undefined;
  return toHomePostComment(data as HomePostCommentRow);
}

export async function updateHomePostComment(
  uuid: string,
  patch: Partial<HomePostComment>
) {
  const supabase = getSupabaseClient();
  const payload: Record<string, any> = {
    updated_at: getIsoTimestr(),
  };
  if (typeof patch.content === "string") {
    payload.content = patch.content;
  }
  if (patch.status) {
    payload.status = patch.status;
  }

  const { error } = await supabase
    .from("home_post_comments")
    .update(payload)
    .eq("uuid", uuid);
  if (error) throw error;

  const updated = await findHomePostCommentByUuid(uuid);
  if (updated) {
    await refreshHomePostCounters(updated.post_uuid);
  }
  return updated;
}
