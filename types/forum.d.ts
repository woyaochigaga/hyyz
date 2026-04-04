import { User } from "@/types/user";

export interface ForumAuthor {
  uuid: string;
  nickname: string;
  avatar_url: string;
  role?: User["role"];
}

export interface ForumBar {
  id: string;
  name: string;
  description: string;
  cover_image: string;
  creator_id: string;
  post_count: number;
  follow_count: number;
  created_at?: string;
  creator?: ForumAuthor;
  followed?: boolean;
}

export interface ForumBarFollow {
  user_id: string;
  bar_id: string;
  followed_at?: string;
}

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  author_id: string;
  bar_id: string;
  reply_count: number;
  like_count: number;
  liked?: boolean;
  last_reply_at?: string;
  created_at?: string;
  author?: ForumAuthor;
  bar?: ForumBar;
}

export interface ForumReply {
  id: string;
  content: string;
  image_url?: string;
  author_id: string;
  post_id: string;
  reply_to_reply_id?: string;
  reply_to_author_id?: string;
  like_count: number;
  created_at?: string;
  floor?: number;
  author?: ForumAuthor;
  reply_to_author?: ForumAuthor;
}

export interface ForumFeedResult {
  posts: ForumPost[];
  following_bar_ids: string[];
}

export interface ForumPostDetail {
  post: ForumPost;
  replies: ForumReply[];
}
