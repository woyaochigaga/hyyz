export type HomePostType = "text" | "image" | "video";
export type HomePostStatus = "draft" | "published" | "deleted";
export type HomePostCommentStatus = "active" | "hidden" | "deleted";

export interface HomePostAuthor {
  uuid: string;
  nickname: string;
  avatar_url: string;
}

export interface HomePost {
  id?: number;
  uuid: string;
  user_uuid: string;
  locale?: string;
  type: HomePostType;
  title?: string;
  content: string;
  cover_url?: string;
  images?: string[];
  video_url?: string;
  status?: HomePostStatus;
  like_count?: number;
  comment_count?: number;
  created_at?: string;
  updated_at?: string;
  published_at?: string;
  tags?: string[];
  liked?: boolean;
  author?: HomePostAuthor;
}

export interface HomePostComment {
  id?: number;
  uuid: string;
  post_uuid: string;
  user_uuid: string;
  parent_uuid?: string;
  content: string;
  status?: HomePostCommentStatus;
  created_at?: string;
  updated_at?: string;
  author?: HomePostAuthor;
  replies?: HomePostComment[];
}
