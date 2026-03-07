export interface User {
  id?: number;
  uuid?: string;
  email: string;
  created_at?: string;
  nickname: string;
  avatar_url: string;
  // 账号密码登录：数据库中存的是 hash（salt:hash），不要在代码里存明文密码
  password_hash?: string;
  locale?: string;
  signin_type?: string;
  signin_ip?: string;
  signin_provider?: string;
  signin_openid?: string;
  credits?: UserCredits;
  invite_code?: string;
  invited_by?: string;
  is_affiliate?: boolean;
  role?: "user" | "artisan" | "admin";
}

export interface UserCredits {
  one_time_credits?: number;
  monthly_credits?: number;
  total_credits?: number;
  used_credits?: number;
  left_credits: number;
  free_credits?: number;
  is_recharged?: boolean;
  is_pro?: boolean;
}
