"use client";

import { useState } from "react";
import { User } from "@/types/user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/ui/image-upload";
import { notify } from "@/lib/notify";
import { SiGoogle } from "react-icons/si";
import { signIn } from "next-auth/react";
import { Pencil, Loader2 } from "lucide-react";
import { proxifyAvatarUrl } from "@/lib/avatar";

export function PersonalProfile({ user }: { user: User }) {
  const [nickname, setNickname] = useState(user.nickname || "");
  const [email, setEmail] = useState(user.email || "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || "");
  const [role, setRole] = useState<"user" | "artisan">(
    (user.role as "user" | "artisan") || "user"
  );
  const [editingField, setEditingField] = useState<
    null | "avatar" | "nickname" | "email" | "role" | "password"
  >(null);
  const [loadingField, setLoadingField] = useState<
    null | "avatar" | "nickname" | "email" | "role" | "password"
  >(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const googleBound =
    user.signin_provider === "google" || user.signin_type === "google";

  const googleAccountText = (() => {
    if (!googleBound) return "";
    const emailText = user.email ? user.email : "未知账号";
    const openid = user.signin_openid ? String(user.signin_openid) : "";
    const openidText = openid ? `（ID: …${openid.slice(-6)}）` : "";
    return `${emailText}${openidText}`;
  })();

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

  const saveRole = async () => {
    try {
      setLoadingField("role");
      const resp = await fetch("/api/user/update/update-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const { code, message } = await resp.json();
      if (code !== 0) {
        notify("error", message || "更新账户类型失败");
        return;
      }
      notify("success", "账户类型已更新");
      setEditingField(null);
    } catch {
      notify("error", "更新账户类型失败");
    } finally {
      setLoadingField(null);
    }
  };

  const isEditing = (field: typeof editingField) => loadingField === field;

  return (
    <section className="relative overflow-hidden py-10">
      <div
        className="hero-bg-slideshow pointer-events-none"
        aria-hidden="true"
      >
        <div className="hero-bg-slide hero-bg-slide-1" />
        <div className="hero-bg-slide hero-bg-slide-2" />
        <div className="hero-bg-slide hero-bg-slide-3" />
        <div className="hero-bg-slide hero-bg-slide-4" />
        <div className="hero-bg-slide hero-bg-slide-5" />
        <div className="hero-bg-overlay" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl space-y-8 px-4 pb-12">
        {/* 顶部头像与身份区 */}
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-muted/30 to-muted/10 backdrop-blur">
          <div className="flex flex-col items-center gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
            <div className="flex items-center gap-6">
              <div className="group relative">
                <Avatar className="h-32 w-32 shadow-2xl transition-all sm:h-40 sm:w-40 group-hover:shadow-3xl">
                  <AvatarImage
                    src={proxifyAvatarUrl(avatarUrl)}
                    alt={nickname}
                  />
                  <AvatarFallback className="text-3xl font-medium sm:text-4xl">
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
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  {nickname || "未设置昵称"}
                </h2>
                <Badge
                  variant="secondary"
                  className="w-fit font-normal text-muted-foreground"
                >
                  {role === "artisan" ? "匠人" : "普通用户"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* 头像上传弹窗 */}
        {editingField === "avatar" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="mx-4 w-full max-w-md rounded-2xl bg-background p-6 shadow-2xl">
              <h3 className="mb-4 text-lg font-semibold">更换头像</h3>
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

        {/* 基本资料 */}
        <Card className="overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-background/90 to-muted/20 shadow-lg backdrop-blur">
        <CardHeader className="px-8 py-6">
          <CardTitle className="text-lg font-semibold">基本资料</CardTitle>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <div className="space-y-6">
            {/* 昵称 */}
            <div className="group rounded-xl bg-muted/20 p-5 transition-all hover:bg-muted/30">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  昵称
                </span>
                {editingField !== "nickname" ? (
                  <div className="flex flex-1 items-center justify-between gap-3 sm:justify-end">
                    <span className="text-base font-medium">
                      {nickname || "未设置"}
                    </span>
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
                      <Button
                        size="sm"
                        onClick={saveNickname}
                        disabled={isEditing("nickname")}
                      >
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

            {/* 邮箱 */}
            <div className="group rounded-xl bg-muted/20 p-5 transition-all hover:bg-muted/30">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  邮箱
                </span>
                {editingField !== "email" ? (
                  <div className="flex flex-1 items-center justify-between gap-3 sm:justify-end">
                    <span className="truncate text-base font-medium">{email}</span>
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
                      <Button
                        size="sm"
                        onClick={saveEmail}
                        disabled={isEditing("email")}
                      >
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
          </div>
        </CardContent>
      </Card>

        {/* 账户设置 */}
        <Card className="overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-background/90 to-muted/20 shadow-lg backdrop-blur">
        <CardHeader className="px-8 py-6">
          <CardTitle className="text-lg font-semibold">账户设置</CardTitle>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <div className="space-y-6">
            {/* 账户类型 */}
            <div className="rounded-xl bg-muted/20 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  账户类型
                </span>
                <span className="text-base font-medium">
                  {role === "artisan" ? "匠人" : "普通用户"}
                </span>
              </div>
            </div>

            {/* 密码找回 */}
            <div className="group rounded-xl bg-muted/20 p-5 transition-all hover:bg-muted/30">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  密码找回
                </span>
                {editingField !== "password" ? (
                  <div className="flex flex-1 items-center justify-between gap-3 sm:justify-end">
                    <span className="text-sm text-muted-foreground">
                      重新设置登录密码
                    </span>
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
                        onClick={async () => {
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
                            const resp = await fetch(
                              "/api/user/update/reset-password",
                              {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ password: newPassword }),
                              }
                            );
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
                        }}
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

            {/* Google 绑定 */}
            <div className="rounded-xl bg-muted/20 p-5 transition-all hover:bg-muted/30">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  第三方绑定
                </span>
                <div className="flex flex-1 items-center justify-between gap-3 rounded-lg bg-background/50 px-4 py-3 sm:justify-end">
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
                      variant="default"
                      size="sm"
                      className="shrink-0"
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
          </div>
        </CardContent>
      </Card>
      </div>
    </section>
  );
}

