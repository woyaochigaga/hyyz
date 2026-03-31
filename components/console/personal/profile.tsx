"use client";

import { useEffect, useState } from "react";
import { User, UserGender } from "@/types/user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { notify } from "@/lib/notify";
import { proxifyAvatarUrl } from "@/lib/avatar";
import { signIn } from "next-auth/react";
import {
  CalendarDays,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { SiGoogle } from "react-icons/si";

const USER_ROLE_STORAGE_KEY = "user_role";

type UserRole = "user" | "artisan" | "admin";

function normalizeRole(value: unknown): UserRole {
  return value === "artisan" || value === "admin" ? value : "user";
}

function normalizeGender(value: unknown): UserGender {
  return value === "male" || value === "female" || value === "other" ? value : "";
}

function getRoleLabel(role: UserRole) {
  if (role === "artisan") return "匠人";
  if (role === "admin") return "管理员";
  return "普通用户";
}

function getGenderLabel(gender: UserGender) {
  if (gender === "male") return "男";
  if (gender === "female") return "女";
  if (gender === "other") return "其他";
  return "未设置";
}

function formatDate(date?: string) {
  if (!date) return "-";
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "-";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

export function PersonalProfile({ user }: { user: User }) {
  const [nickname, setNickname] = useState(user.nickname || "");
  const [email, setEmail] = useState(user.email || "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || "");
  const [phoneNumber, setPhoneNumber] = useState(user.phone_number || "");
  const [gender, setGender] = useState<UserGender>(normalizeGender(user.gender));
  const [signature, setSignature] = useState(user.signature || "");
  const [address, setAddress] = useState(user.address || "");
  const [role, setRole] = useState<UserRole>(normalizeRole(user.role));
  const [editingField, setEditingField] = useState<
    null | "avatar" | "nickname" | "email" | "password" | "details"
  >(null);
  const [loadingField, setLoadingField] = useState<
    null | "avatar" | "nickname" | "email" | "password" | "details"
  >(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const googleBound =
    user.signin_provider === "google" || user.signin_type === "google";

  useEffect(() => {
    try {
      const storedRole = window.localStorage.getItem(USER_ROLE_STORAGE_KEY);
      if (storedRole) {
        setRole(normalizeRole(storedRole));
      }
    } catch {
      // ignore localStorage errors
    }

    let cancelled = false;

    const syncUserRole = async () => {
      try {
        const resp = await fetch("/api/get-user-info", { method: "POST" });
        const result = await resp.json();
        const dbRole = normalizeRole(result?.data?.role);

        try {
          window.localStorage.setItem(USER_ROLE_STORAGE_KEY, dbRole);
        } catch {
          // ignore localStorage errors
        }

        if (!cancelled) {
          setRole(dbRole);
        }
      } catch {
        // ignore fetch errors and keep current role
      }
    };

    void syncUserRole();

    return () => {
      cancelled = true;
    };
  }, []);

  const googleAccountText = (() => {
    if (!googleBound) return "";
    const emailText = user.email ? user.email : "未知账号";
    const openid = user.signin_openid ? String(user.signin_openid) : "";
    const openidText = openid ? `（ID: …${openid.slice(-6)}）` : "";
    return `${emailText}${openidText}`;
  })();

  const isEditing = (field: typeof editingField) => loadingField === field;

  const resetDetails = () => {
    setPhoneNumber(user.phone_number || "");
    setGender(normalizeGender(user.gender));
    setSignature(user.signature || "");
    setAddress(user.address || "");
  };

  const saveNickname = async () => {
    const value = nickname.trim();
    if (!value) {
      notify("error", "昵称不能为空");
      return;
    }

    try {
      setLoadingField("nickname");
      const resp = await fetch("/api/user/update/update-nickname", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: value }),
      });
      const { code, message } = await resp.json();
      if (code !== 0) {
        notify("error", message || "更新昵称失败");
        return;
      }
      notify("success", "昵称已更新");
      setEditingField(null);
    } catch {
      notify("error", "更新昵称失败");
    } finally {
      setLoadingField(null);
    }
  };

  const saveAvatar = async (url: string) => {
    try {
      setLoadingField("avatar");
      const resp = await fetch("/api/user/update/update-avatar-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: url }),
      });
      const { code, message } = await resp.json();
      if (code !== 0) {
        notify("error", message || "更新头像失败");
        return;
      }
      setAvatarUrl(url);
      notify("success", "头像已更新");
      setEditingField(null);
    } catch {
      notify("error", "更新头像失败");
    } finally {
      setLoadingField(null);
    }
  };

  const saveEmail = async () => {
    const value = email.trim().toLowerCase();
    if (!value) {
      notify("error", "邮箱不能为空");
      return;
    }

    try {
      setLoadingField("email");
      const resp = await fetch("/api/user/update/update-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      const { code, message } = await resp.json();
      if (code !== 0) {
        notify("error", message || "更新邮箱失败");
        return;
      }
      notify("success", "邮箱已更新");
      setEditingField(null);
    } catch {
      notify("error", "更新邮箱失败");
    } finally {
      setLoadingField(null);
    }
  };

  const saveDetails = async () => {
    try {
      setLoadingField("details");
      const resp = await fetch("/api/user/update/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number: phoneNumber,
          gender,
          signature,
          address,
        }),
      });
      const { code, message } = await resp.json();
      if (code !== 0) {
        notify("error", message || "更新资料失败");
        return;
      }
      notify("success", "资料已更新");
      setEditingField(null);
    } catch {
      notify("error", "更新资料失败");
    } finally {
      setLoadingField(null);
    }
  };

  const resetPassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      notify("error", "密码不能为空");
      return;
    }
    if (newPassword !== confirmPassword) {
      notify("error", "两次输入的密码不一致");
      return;
    }

    try {
      setLoadingField("password");
      const resp = await fetch("/api/user/update/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const { code, message } = await resp.json();
      if (code !== 0) {
        notify("error", message || "重置密码失败");
        return;
      }
      notify("success", "密码已更新，请下次使用新密码登录");
      setEditingField(null);
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      notify("error", "重置密码失败");
    } finally {
      setLoadingField(null);
    }
  };

  return (
    <div className="grid gap-6">
      <section className="relative overflow-hidden rounded-[28px] border border-black/5 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_32%),linear-gradient(135deg,#ffffff,#f4f6fb)] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.16),transparent_30%),linear-gradient(135deg,rgba(24,24,27,1),rgba(39,39,42,0.96))]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end">
          <div className="flex items-center gap-6">
            <div className="group relative">
              <Avatar className="h-24 w-24 border-4 border-white/80 shadow-2xl transition-all dark:border-white/10">
                <AvatarImage src={proxifyAvatarUrl(avatarUrl)} alt={nickname} />
                <AvatarFallback className="bg-zinc-200 text-2xl font-semibold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100">
                  {nickname?.slice(0, 2) || "用户"}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => setEditingField("avatar")}
                disabled={loadingField === "avatar"}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity hover:opacity-100 disabled:cursor-not-allowed"
              >
                {loadingField === "avatar" ? (
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                ) : (
                  <Pencil className="h-8 w-8 text-white" />
                )}
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">
                个人档案
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                {nickname || "未设置昵称"}
              </h1>
              <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-300">
                {signature.trim() ||
                  "在这里维护你的头像、昵称、邮箱和账户安全设置，整体信息展示与作品主页保持一致。"}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-full bg-zinc-900 px-3 py-1 text-white dark:bg-white dark:text-zinc-900">
                  {getRoleLabel(role)}
                </Badge>
                <span className="text-sm text-zinc-500">{email || "未设置邮箱"}</span>
              </div>
            </div>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-3 lg:ml-auto lg:max-w-2xl">
            <div className="rounded-2xl border border-black/5 bg-white/75 p-4 backdrop-blur dark:border-white/10 dark:bg-white/5">
              <div className="mb-3 flex items-center gap-2 text-zinc-500">
                <Phone className="h-4 w-4" />
                <span className="text-sm">手机号码</span>
              </div>
              <div className="text-lg font-semibold text-zinc-900 dark:text-white">
                {phoneNumber || "未设置"}
              </div>
            </div>

            <div className="rounded-2xl border border-black/5 bg-white/75 p-4 backdrop-blur dark:border-white/10 dark:bg-white/5">
              <div className="mb-3 flex items-center gap-2 text-zinc-500">
                <UserRound className="h-4 w-4" />
                <span className="text-sm">性别</span>
              </div>
              <div className="text-lg font-semibold text-zinc-900 dark:text-white">
                {getGenderLabel(gender)}
              </div>
            </div>

            <div className="rounded-2xl border border-black/5 bg-white/75 p-4 backdrop-blur dark:border-white/10 dark:bg-white/5">
              <div className="mb-3 flex items-center gap-2 text-zinc-500">
                <CalendarDays className="h-4 w-4" />
                <span className="text-sm">加入时间</span>
              </div>
              <div className="text-lg font-semibold text-zinc-900 dark:text-white">
                {formatDate(user.created_at)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {editingField === "avatar" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-[28px] border border-black/5 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-[rgb(32,34,44)]">
            <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
              更换头像
            </h3>
            <ImageUpload
              value={avatarUrl}
              onChange={(url) => saveAvatar(url)}
              disabled={isEditing("avatar")}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setAvatarUrl(user.avatar_url || "");
                  setEditingField(null);
                }}
                disabled={isEditing("avatar")}
              >
                取消
              </Button>
            </div>
          </div>
        </div>
      )}

      <section className="min-h-0 overflow-hidden rounded-[28px] border border-black/5 bg-white/80 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur dark:border-white/10 dark:bg-white/[0.03]">
        <div className="mb-5">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
            账户信息
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            统一管理你的基础资料、登录方式和账户安全设置。
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="overflow-hidden rounded-[24px] border border-black/5 bg-white shadow-[0_12px_34px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-zinc-950/40">
            <div className="px-8 py-6">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
                基本资料
              </h3>
            </div>
            <div className="space-y-6 px-8 pb-8">
              <div className="group rounded-2xl border border-black/5 bg-white/60 p-5 transition-all hover:bg-white/80 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-sm font-medium text-muted-foreground">昵称</span>
                  {editingField !== "nickname" ? (
                    <div className="flex flex-1 items-center justify-between gap-3 sm:justify-end">
                      <span className="text-base font-medium">{nickname || "未设置"}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => setEditingField("nickname")}
                      >
                        <Pencil className="mr-1 h-3.5 w-3.5" />
                        编辑
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                      <Input
                        className="sm:max-w-xs"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveNickname} disabled={isEditing("nickname")}>
                          {isEditing("nickname") ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "保存"
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setNickname(user.nickname || "");
                            setEditingField(null);
                          }}
                        >
                          取消
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="group rounded-2xl border border-black/5 bg-white/60 p-5 transition-all hover:bg-white/80 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-sm font-medium text-muted-foreground">邮箱</span>
                  {editingField !== "email" ? (
                    <div className="flex flex-1 items-center justify-between gap-3 sm:justify-end">
                      <span className="truncate text-base font-medium">{email || "未设置"}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => setEditingField("email")}
                      >
                        <Pencil className="mr-1 h-3.5 w-3.5" />
                        编辑
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                      <Input
                        className="sm:max-w-xs"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveEmail} disabled={isEditing("email")}>
                          {isEditing("email") ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "保存"
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEmail(user.email || "");
                            setEditingField(null);
                          }}
                        >
                          取消
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="group rounded-2xl border border-black/5 bg-white/60 p-5 transition-all hover:bg-white/80 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-muted-foreground">扩展资料</span>
                    {editingField !== "details" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => setEditingField("details")}
                      >
                        <Pencil className="mr-1 h-3.5 w-3.5" />
                        编辑
                      </Button>
                    ) : null}
                  </div>

                  {editingField !== "details" ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl border border-black/5 bg-white/80 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                        <div className="mb-1 flex items-center gap-2 text-xs text-zinc-500">
                          <Phone className="h-3.5 w-3.5" />
                          手机号码
                        </div>
                        <div className="text-sm font-medium text-zinc-900 dark:text-white">
                          {phoneNumber || "未设置"}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-black/5 bg-white/80 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                        <div className="mb-1 flex items-center gap-2 text-xs text-zinc-500">
                          <UserRound className="h-3.5 w-3.5" />
                          性别
                        </div>
                        <div className="text-sm font-medium text-zinc-900 dark:text-white">
                          {getGenderLabel(gender)}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-black/5 bg-white/80 px-4 py-3 sm:col-span-2 dark:border-white/10 dark:bg-white/[0.04]">
                        <div className="mb-1 text-xs text-zinc-500">个性签名</div>
                        <div className="whitespace-pre-wrap text-sm font-medium text-zinc-900 dark:text-white">
                          {signature || "未设置"}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-black/5 bg-white/80 px-4 py-3 sm:col-span-2 dark:border-white/10 dark:bg-white/[0.04]">
                        <div className="mb-1 flex items-center gap-2 text-xs text-zinc-500">
                          <MapPin className="h-3.5 w-3.5" />
                          详细地址
                        </div>
                        <div className="whitespace-pre-wrap text-sm font-medium text-zinc-900 dark:text-white">
                          {address || "未设置"}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                            手机号码
                          </div>
                          <Input
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="请输入手机号码"
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                            性别
                          </div>
                          <Select
                            value={gender || "unset"}
                            onValueChange={(value) =>
                              setGender(value === "unset" ? "" : normalizeGender(value))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="请选择性别" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unset">未设置</SelectItem>
                              <SelectItem value="male">男</SelectItem>
                              <SelectItem value="female">女</SelectItem>
                              <SelectItem value="other">其他</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                          个性签名
                        </div>
                        <Textarea
                          value={signature}
                          onChange={(e) => setSignature(e.target.value)}
                          placeholder="介绍一下你自己"
                          maxLength={200}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                          详细地址
                        </div>
                        <Textarea
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="请输入详细地址"
                          maxLength={255}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveDetails} disabled={isEditing("details")}>
                          {isEditing("details") ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "保存"
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            resetDetails();
                            setEditingField(null);
                          }}
                        >
                          取消
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-black/5 bg-white shadow-[0_12px_34px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-zinc-950/40">
            <div className="px-8 py-6">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
                账户设置
              </h3>
            </div>
            <div className="space-y-6 px-8 pb-8">
              <div className="rounded-2xl border border-black/5 bg-white/60 p-5 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-sm font-medium text-muted-foreground">账户类型</span>
                  <span className="text-base font-medium">{getRoleLabel(role)}</span>
                </div>
              </div>

              <div className="group rounded-2xl border border-black/5 bg-white/60 p-5 transition-all hover:bg-white/80 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <span className="text-sm font-medium text-muted-foreground">密码找回</span>
                  {editingField !== "password" ? (
                    <div className="flex flex-1 items-center justify-between gap-3 sm:justify-end">
                      <span className="text-sm text-muted-foreground">重新设置登录密码</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => {
                          setNewPassword("");
                          setConfirmPassword("");
                          setEditingField("password");
                        }}
                      >
                        <Pencil className="mr-1 h-3.5 w-3.5" />
                        编辑
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-1 flex-col gap-3">
                      <div className="grid w-full gap-2 sm:max-w-sm">
                        <Input
                          type="password"
                          placeholder="输入新密码"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <Input
                          type="password"
                          placeholder="再次输入新密码"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={isEditing("password")}
                          onClick={resetPassword}
                        >
                          {isEditing("password") ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "保存"
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingField(null);
                            setNewPassword("");
                            setConfirmPassword("");
                          }}
                        >
                          取消
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-black/5 bg-white/60 p-5 transition-all hover:bg-white/80 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-sm font-medium text-muted-foreground">第三方绑定</span>
                  <div className="flex flex-1 items-center justify-between gap-3 rounded-2xl border border-black/5 bg-white/80 px-4 py-3 sm:justify-end dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="flex items-center gap-2 text-sm">
                      <SiGoogle className="h-5 w-5" />
                      <span>
                        {googleBound
                          ? `已绑定：${googleAccountText}`
                          : "未绑定 Google 账号"}
                      </span>
                    </div>
                    {!googleBound && (
                      <Button
                        type="button"
                        size="sm"
                        className="shrink-0 rounded-full"
                        onClick={() =>
                          signIn("google", { callbackUrl: "/personal_center" })
                        }
                      >
                        去绑定
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-black/5 bg-white/60 p-5 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-sm font-medium text-muted-foreground">联系邮箱</span>
                  <div className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-white">
                    <Mail className="h-4 w-4 text-zinc-500" />
                    {email || "未设置"}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-black/5 bg-white/60 p-5 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-sm font-medium text-muted-foreground">账户角色</span>
                  <div className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-white">
                    <ShieldCheck className="h-4 w-4 text-zinc-500" />
                    {getRoleLabel(role)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
