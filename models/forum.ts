import { getIsoTimestr } from "@/lib/time";
import { getSupabaseClient } from "@/models/db";
import {
  PUBLIC_USER_PROFILE_SELECT,
  getUsersByUuids,
} from "@/models/user";
import {
  ForumAuthor,
  ForumBar,
  ForumFeedResult,
  ForumPost,
  ForumPostDetail,
  ForumReply,
} from "@/types/forum";

type ForumBarRow = {
  id: string;
  name?: string;
  description?: string;
  cover_image?: string;
  creator_id: string;
  post_count?: number;
  follow_count?: number;
  created_at?: string;
};

type ForumBarFollowRow = {
  user_id: string;
  bar_id: string;
  followed_at?: string;
};

type ForumPostRow = {
  id: string;
  title?: string;
  content?: string;
  author_id: string;
  bar_id: string;
  reply_count?: number;
  like_count?: number;
  last_reply_at?: string;
  created_at?: string;
};

type ForumReplyRow = {
  id: string;
  content?: string;
  image_url?: string;
  author_id: string;
  post_id: string;
  reply_to_reply_id?: string;
  reply_to_author_id?: string;
  like_count?: number;
  created_at?: string;
};

type ForumPostLikeRow = {
  user_id: string;
  post_id: string;
  liked_at?: string;
};

function toForumBar(row: ForumBarRow): ForumBar {
  return {
    id: row.id,
    name: String(row.name || "").trim(),
    description: String(row.description || "").trim(),
    cover_image: String(row.cover_image || "").trim(),
    creator_id: row.creator_id,
    post_count: Number(row.post_count || 0),
    follow_count: Number(row.follow_count || 0),
    created_at: row.created_at || "",
  };
}

function toForumPost(row: ForumPostRow): ForumPost {
  return {
    id: row.id,
    title: String(row.title || "").trim(),
    content: String(row.content || ""),
    author_id: row.author_id,
    bar_id: row.bar_id,
    reply_count: Number(row.reply_count || 0),
    like_count: Number(row.like_count || 0),
    liked: false,
    last_reply_at: row.last_reply_at || "",
    created_at: row.created_at || "",
  };
}

function toForumReply(row: ForumReplyRow): ForumReply {
  return {
    id: row.id,
    content: String(row.content || ""),
    image_url: String(row.image_url || "").trim(),
    author_id: row.author_id,
    post_id: row.post_id,
    reply_to_reply_id: String(row.reply_to_reply_id || "").trim(),
    reply_to_author_id: String(row.reply_to_author_id || "").trim(),
    like_count: Number(row.like_count || 0),
    created_at: row.created_at || "",
  };
}

async function buildAuthors(userUuids: string[]) {
  const users = await getUsersByUuids(
    Array.from(new Set(userUuids.filter(Boolean))),
    PUBLIC_USER_PROFILE_SELECT
  );
  const map = new Map<string, ForumAuthor>();

  for (const user of users) {
    if (!user.uuid) continue;
    map.set(user.uuid, {
      uuid: user.uuid,
      nickname: String(user.nickname || "").trim() || "未命名用户",
      avatar_url: String(user.avatar_url || "").trim(),
      role: user.role,
    });
  }

  return map;
}

async function listBarsByIds(barIds: string[]) {
  if (barIds.length === 0) return [];
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("bars").select("*").in("id", barIds);
  if (error || !data) return [];
  return (data as ForumBarRow[]).map(toForumBar);
}

async function attachBarsMeta(bars: ForumBar[], currentUserUuid?: string) {
  if (bars.length === 0) return bars;

  const supabase = getSupabaseClient();
  const [authorMap, followRows] = await Promise.all([
    buildAuthors(bars.map((item) => item.creator_id)),
    currentUserUuid
      ? supabase
          .from("bar_follows")
          .select("bar_id")
          .in(
            "bar_id",
            bars.map((item) => item.id)
          )
          .eq("user_id", currentUserUuid)
      : Promise.resolve({ data: [] as Array<{ bar_id: string }> }),
  ]);

  const followedSet = new Set((followRows.data || []).map((item) => item.bar_id));

  return bars.map((item) => ({
    ...item,
    followed: followedSet.has(item.id),
    creator:
      authorMap.get(item.creator_id) ||
      ({
        uuid: item.creator_id,
        nickname: "未命名用户",
        avatar_url: "",
      } as ForumAuthor),
  }));
}

async function attachPostsMeta(posts: ForumPost[], currentUserUuid?: string) {
  if (posts.length === 0) return posts;

  const supabase = getSupabaseClient();
  const [authorMap, bars, likedRows] = await Promise.all([
    buildAuthors(posts.map((item) => item.author_id)),
    listBarsByIds(Array.from(new Set(posts.map((item) => item.bar_id)))),
    currentUserUuid
      ? supabase
          .from("forum_post_likes")
          .select("post_id")
          .in(
            "post_id",
            posts.map((item) => item.id)
          )
          .eq("user_id", currentUserUuid)
      : Promise.resolve({ data: [] as Array<{ post_id: string }> }),
  ]);
  const barMap = new Map<string, ForumBar>();
  const likedSet = new Set((likedRows.data || []).map((item) => item.post_id));
  const hydratedBars = await attachBarsMeta(bars, currentUserUuid);
  for (const bar of hydratedBars) {
    barMap.set(bar.id, bar);
  }

  return posts.map((item) => ({
    ...item,
    author:
      authorMap.get(item.author_id) ||
      ({
        uuid: item.author_id,
        nickname: "未命名用户",
        avatar_url: "",
      } as ForumAuthor),
    liked: likedSet.has(item.id),
    bar: barMap.get(item.bar_id),
  }));
}

async function attachRepliesMeta(replies: ForumReply[]) {
  if (replies.length === 0) return replies;
  const authorMap = await buildAuthors([
    ...replies.map((item) => item.author_id),
    ...replies.map((item) => item.reply_to_author_id || ""),
  ]);
  return replies.map((item, index) => ({
    ...item,
    floor: index + 1,
    author:
      authorMap.get(item.author_id) ||
      ({
        uuid: item.author_id,
        nickname: "未命名用户",
        avatar_url: "",
      } as ForumAuthor),
    reply_to_author: item.reply_to_author_id
      ? authorMap.get(item.reply_to_author_id) ||
        ({
          uuid: item.reply_to_author_id,
          nickname: "未命名用户",
          avatar_url: "",
        } as ForumAuthor)
      : undefined,
  }));
}

export function getForumExcerpt(content: string, limit: number = 120) {
  const plain = String(content || "").replace(/\s+/g, " ").trim();
  if (plain.length <= limit) return plain;
  return `${plain.slice(0, limit).trim()}...`;
}

export function validateForumBarPayload(input: Partial<ForumBar>) {
  const name = String(input.name || "")
    .trim()
    .replace(/\s+/g, " ");
  const description = String(input.description || "").trim().slice(0, 280);
  const cover_image = String(input.cover_image || "").trim();

  if (name.length < 2) {
    throw new Error("bar name is too short");
  }

  if (name.length > 50) {
    throw new Error("bar name is too long");
  }

  return {
    name,
    description,
    cover_image,
  };
}

export function validateForumPostPayload(input: Partial<ForumPost>) {
  const title = String(input.title || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 200);
  const content = String(input.content || "").trim();
  const bar_id = String(input.bar_id || "").trim();

  if (!bar_id) {
    throw new Error("bar_id is required");
  }

  if (!content) {
    throw new Error("post content is required");
  }

  return {
    bar_id,
    title: title || content.slice(0, 28),
    content,
  };
}

export function validateForumReplyPayload(input: Partial<ForumReply>) {
  const post_id = String(input.post_id || "").trim();
  const content = String(input.content || "").trim();
  const image_url = String(input.image_url || "").trim();
  const reply_to_reply_id = String(input.reply_to_reply_id || "").trim();
  const reply_to_author_id = String(input.reply_to_author_id || "").trim();

  if (!post_id) {
    throw new Error("post_id is required");
  }

  if (!content && !image_url) {
    throw new Error("reply content or image is required");
  }

  if (image_url.length > 500) {
    throw new Error("reply image is too long");
  }

  return {
    post_id,
    content,
    image_url,
    reply_to_reply_id,
    reply_to_author_id,
  };
}

export async function listFollowedBarIds(userId: string) {
  if (!userId) return [];
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("bar_follows")
    .select("bar_id")
    .eq("user_id", userId);

  if (error || !data) return [];
  return (data as Array<{ bar_id: string }>).map((item) => item.bar_id);
}

export async function listForumBars(params?: {
  currentUserUuid?: string;
  limit?: number;
}) {
  const supabase = getSupabaseClient();
  let query = supabase
    .from("bars")
    .select("*")
    .order("follow_count", { ascending: false })
    .order("post_count", { ascending: false })
    .order("created_at", { ascending: false });

  if (params?.limit) {
    query = query.limit(params.limit);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return attachBarsMeta(
    (data as ForumBarRow[]).map(toForumBar),
    params?.currentUserUuid
  );
}

async function findForumBarRowById(id: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("bars")
    .select("*")
    .eq("id", id)
    .limit(1)
    .single();

  if (error || !data) return undefined;
  return toForumBar(data as ForumBarRow);
}

export async function findForumBarById(id: string, currentUserUuid?: string) {
  const row = await findForumBarRowById(id);
  if (!row) return undefined;
  const [bar] = await attachBarsMeta([row], currentUserUuid);
  return bar;
}

export async function refreshForumBarStats(barId: string) {
  const supabase = getSupabaseClient();
  const [{ count: postCount }, { count: followCount }] = await Promise.all([
    supabase.from("forum_posts").select("*", { count: "exact", head: true }).eq("bar_id", barId),
    supabase.from("bar_follows").select("*", { count: "exact", head: true }).eq("bar_id", barId),
  ]);

  const { error } = await supabase
    .from("bars")
    .update({
      post_count: postCount || 0,
      follow_count: followCount || 0,
    })
    .eq("id", barId);

  if (error) throw error;
}

export async function createForumBar(input: {
  id: string;
  name: string;
  description?: string;
  cover_image?: string;
  creator_id: string;
}) {
  const supabase = getSupabaseClient();
  const now = getIsoTimestr();
  const payload = validateForumBarPayload(input);

  const { error } = await supabase.from("bars").insert({
    id: input.id,
    name: payload.name,
    description: payload.description,
    cover_image: payload.cover_image,
    creator_id: input.creator_id,
    post_count: 0,
    follow_count: 0,
    created_at: now,
  });

  if (error) throw error;

  const bar = await findForumBarById(input.id, input.creator_id);
  if (!bar) {
    throw new Error("create forum bar failed");
  }

  return bar;
}

export async function toggleForumBarFollow(barId: string, userId: string) {
  const supabase = getSupabaseClient();
  const existingBar = await findForumBarRowById(barId);
  if (!existingBar) {
    throw new Error("bar not found");
  }

  const { data, error: queryError } = await supabase
    .from("bar_follows")
    .select("bar_id")
    .eq("bar_id", barId)
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (queryError) throw queryError;

  if (data?.bar_id) {
    const { error } = await supabase
      .from("bar_follows")
      .delete()
      .eq("bar_id", barId)
      .eq("user_id", userId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("bar_follows").insert({
      bar_id: barId,
      user_id: userId,
      followed_at: getIsoTimestr(),
    });
    if (error) throw error;
  }

  await refreshForumBarStats(barId);
  const bar = await findForumBarById(barId, userId);
  return {
    followed: Boolean(bar?.followed),
    follow_count: Number(bar?.follow_count || 0),
  };
}

export async function listForumFeed(params?: {
  currentUserUuid?: string;
  limit?: number;
}): Promise<ForumFeedResult> {
  const supabase = getSupabaseClient();
  const following_bar_ids = params?.currentUserUuid
    ? await listFollowedBarIds(params.currentUserUuid)
    : [];

  let query = supabase
    .from("forum_posts")
    .select("*")
    .order("last_reply_at", { ascending: false })
    .limit(params?.limit || 20);

  if (following_bar_ids.length > 0) {
    query = query.in("bar_id", following_bar_ids);
  }

  const { data, error } = await query;
  if (error || !data) {
    return {
      posts: [],
      following_bar_ids,
    };
  }

  return {
    posts: await attachPostsMeta(
      (data as ForumPostRow[]).map(toForumPost),
      params?.currentUserUuid
    ),
    following_bar_ids,
  };
}

/** 管理后台：拉取 forum_posts 全表（不按关注过滤） */
export async function listForumPostsForAdmin() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("forum_posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return attachPostsMeta((data as ForumPostRow[]).map(toForumPost), undefined);
}

export async function listForumPostsByBarId(
  barId: string,
  currentUserUuid?: string,
  limit: number = 50
) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("forum_posts")
    .select("*")
    .eq("bar_id", barId)
    .order("last_reply_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return attachPostsMeta((data as ForumPostRow[]).map(toForumPost), currentUserUuid);
}

export async function listForumPostsByAuthorId(
  authorId: string,
  currentUserUuid?: string,
  limit: number = 20
) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("forum_posts")
    .select("*")
    .eq("author_id", authorId)
    .order("last_reply_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return attachPostsMeta((data as ForumPostRow[]).map(toForumPost), currentUserUuid);
}

export async function findForumPostRowById(id: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("forum_posts")
    .select("*")
    .eq("id", id)
    .limit(1)
    .single();

  if (error || !data) return undefined;
  return toForumPost(data as ForumPostRow);
}

export async function findForumPostById(id: string, currentUserUuid?: string) {
  const post = await findForumPostRowById(id);
  if (!post) return undefined;
  const [hydrated] = await attachPostsMeta([post], currentUserUuid);
  return hydrated;
}

export async function refreshForumPostStats(postId: string) {
  const supabase = getSupabaseClient();
  const [{ count: replyCount }, { count: likeCount }, { data: postRow, error: postError }, { data: latestReplyRow, error: latestReplyError }] =
    await Promise.all([
      supabase
        .from("forum_replies")
        .select("*", { count: "exact", head: true })
        .eq("post_id", postId),
      supabase
        .from("forum_post_likes")
        .select("*", { count: "exact", head: true })
        .eq("post_id", postId),
      supabase
        .from("forum_posts")
        .select("created_at")
        .eq("id", postId)
        .limit(1)
        .maybeSingle(),
      supabase
        .from("forum_replies")
        .select("created_at")
        .eq("post_id", postId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  if (postError) throw postError;
  if (latestReplyError) throw latestReplyError;

  const postCreatedAt = String((postRow as { created_at?: string } | null)?.created_at || "").trim();
  if (!postCreatedAt) {
    throw new Error("post not found");
  }

  const lastReplyAt =
    String((latestReplyRow as { created_at?: string } | null)?.created_at || "").trim() ||
    postCreatedAt;

  const { error } = await supabase.from("forum_posts").update({
    reply_count: replyCount || 0,
    like_count: likeCount || 0,
    last_reply_at: lastReplyAt,
  }).eq("id", postId);
  if (error) throw error;
}

export async function createForumPost(input: {
  id: string;
  title: string;
  content: string;
  author_id: string;
  bar_id: string;
}) {
  const supabase = getSupabaseClient();
  const now = getIsoTimestr();
  const payload = validateForumPostPayload(input);

  const bar = await findForumBarRowById(payload.bar_id);
  if (!bar) {
    throw new Error("bar not found");
  }

  const { error } = await supabase.from("forum_posts").insert({
    id: input.id,
    title: payload.title,
    content: payload.content,
    author_id: input.author_id,
    bar_id: payload.bar_id,
    reply_count: 0,
    like_count: 0,
    last_reply_at: now,
    created_at: now,
  });

  if (error) throw error;

  await refreshForumBarStats(payload.bar_id);
  const post = await findForumPostById(input.id, input.author_id);
  if (!post) {
    throw new Error("create forum post failed");
  }
  return post;
}

export async function listForumReplies(postId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("forum_replies")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return attachRepliesMeta((data as ForumReplyRow[]).map(toForumReply));
}

export async function createForumReply(input: {
  id: string;
  content: string;
  image_url?: string;
  author_id: string;
  post_id: string;
  reply_to_reply_id?: string;
  reply_to_author_id?: string;
}) {
  const supabase = getSupabaseClient();
  const now = getIsoTimestr();
  const payload = validateForumReplyPayload(input);

  const post = await findForumPostRowById(payload.post_id);
  if (!post) {
    throw new Error("post not found");
  }

  let replyToAuthorId = payload.reply_to_author_id;
  if (payload.reply_to_reply_id) {
    const targetReply = await getSupabaseClient()
      .from("forum_replies")
      .select("id, author_id, post_id")
      .eq("id", payload.reply_to_reply_id)
      .limit(1)
      .maybeSingle();

    if (targetReply.error) {
      throw targetReply.error;
    }

    const targetRow = targetReply.data as
      | { id?: string; author_id?: string; post_id?: string }
      | null;

    if (!targetRow?.id || String(targetRow.post_id || "").trim() !== payload.post_id) {
      throw new Error("reply target not found");
    }

    if (!replyToAuthorId) {
      replyToAuthorId = String(targetRow.author_id || "").trim();
    }
  }

  const { error } = await supabase.from("forum_replies").insert({
    id: input.id,
    content: payload.content,
    image_url: payload.image_url,
    author_id: input.author_id,
    post_id: payload.post_id,
    reply_to_reply_id: payload.reply_to_reply_id,
    reply_to_author_id: replyToAuthorId,
    like_count: 0,
    created_at: now,
  });

  if (error) throw error;

  await refreshForumPostStats(payload.post_id);
  const replies = await listForumReplies(payload.post_id);
  const reply = replies.find((item) => item.id === input.id);
  if (!reply) {
    throw new Error("create forum reply failed");
  }
  return reply;
}

export async function toggleForumPostLike(postId: string, userId: string) {
  const supabase = getSupabaseClient();
  const post = await findForumPostRowById(postId);
  if (!post) {
    throw new Error("post not found");
  }

  const { data, error: queryError } = await supabase
    .from("forum_post_likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (queryError) throw queryError;

  if (data?.post_id) {
    const { error } = await supabase
      .from("forum_post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("forum_post_likes").insert({
      post_id: postId,
      user_id: userId,
      liked_at: getIsoTimestr(),
    } satisfies ForumPostLikeRow);
    if (error) throw error;
  }

  await refreshForumPostStats(postId);
  const hydrated = await findForumPostById(postId, userId);
  return {
    liked: Boolean(hydrated?.liked),
    like_count: Number(hydrated?.like_count || 0),
  };
}

export async function getForumPostDetail(
  postId: string,
  currentUserUuid?: string
): Promise<ForumPostDetail | undefined> {
  const [post, replies] = await Promise.all([
    findForumPostById(postId, currentUserUuid),
    listForumReplies(postId),
  ]);

  if (!post) return undefined;
  return {
    post,
    replies,
  };
}
