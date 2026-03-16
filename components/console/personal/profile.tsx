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

  const saveAvatar = async () => {
    const value = avatarUrl.trim();
    try {
      setLoadingField("avatar");
      const resp = await fetch("/api/user/update/update-avatar-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: value }),
      });
      const { code, message } = await resp.json();
      if (code !== 0) {
        notify("error", message || "更新头像失败");
        return;
      }
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
    <div className="mx-auto w-full max-w-2xl space-y-8 px-4 pb-12">
      {/* 顶部头像与身份区 */}
      <div className="overflow-hidden rounded-2xl border bg-muted/30">
        <div className="flex flex-col items-center gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-4 border-background shadow-md sm:h-24 sm:w-24">
              <AvatarImage src={proxifyAvatarUrl(avatarUrl)} alt={nickname} />
              <AvatarFallback className="text-lg font-medium sm:text-xl">
                {nickname?.slice(0, 2) || "用户"}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
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

      {/* 基本资料 */}
      <Card className="overflow-hidden border shadow-sm">
        <CardHeader className="border-b bg-muted/20 px-6 py-4">
          <CardTitle className="text-base font-medium">基本资料</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {/* 头像 */}
            <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <span className="w-20 shrink-0 text-sm text-muted-foreground">
                  头像
                </span>
                {editingField !== "avatar" ? (
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="truncate text-sm">
                      {avatarUrl || "暂未设置头像"}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={() => setEditingField("avatar")}
                    >
                      <Pencil className="mr-1 h-3.5 w-3.5" />
                      编辑
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                      className="sm:max-w-xs"
                      placeholder="粘贴头像图片地址"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={saveAvatar}
                        disabled={isEditing("avatar")}
                      >
                        {isEditing("avatar") ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "保存"
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setAvatarUrl(user.avatar_url || "");
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

            {/* 昵称 */}
            <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="w-20 shrink-0 text-sm text-muted-foreground">
                昵称
              </span>
              {editingField !== "nickname" ? (
                <div className="flex flex-1 items-center justify-between gap-3">
                  <span className="font-medium">
                    {nickname || "未设置"}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-muted-foreground hover:text-foreground"
                    onClick={() => setEditingField("nickname")}
                  >
                    <Pencil className="mr-1 h-3.5 w-3.5" />
                    编辑
                  </Button>
                </div>
              ) : (
                <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
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

            {/* 邮箱 */}
            <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="w-20 shrink-0 text-sm text-muted-foreground">
                邮箱
              </span>
              {editingField !== "email" ? (
                <div className="flex flex-1 items-center justify-between gap-3">
                  <span className="truncate font-medium">{email}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={() => setEditingField("email")}
                  >
                    <Pencil className="mr-1 h-3.5 w-3.5" />
                    编辑
                  </Button>
                </div>
              ) : (
                <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
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
        </CardContent>
      </Card>

      {/* 账户设置 */}
      <Card className="overflow-hidden border shadow-sm">
        <CardHeader className="border-b bg-muted/20 px-6 py-4">
          <CardTitle className="text-base font-medium">账户设置</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {/* 账户类型 */}
            <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="w-20 shrink-0 text-sm text-muted-foreground">
                账户类型
              </span>
              {editingField !== "role" ? (
                <div className="flex flex-1 items-center justify-between gap-3">
                  <span className="font-medium">
                    {role === "artisan" ? "匠人" : "普通用户"}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-muted-foreground hover:text-foreground"
                    onClick={() => setEditingField("role")}
                  >
                    <Pencil className="mr-1 h-3.5 w-3.5" />
                    编辑
                  </Button>
                </div>
              ) : (
                <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                  <RadioGroup
                    className="flex gap-6"
                    value={role}
                    onValueChange={(v) =>
                      setRole((v as "user" | "artisan") || "user")
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="user" id="role-user" />
                      <Label htmlFor="role-user" className="cursor-pointer font-normal">
                        普通用户
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="artisan" id="role-artisan" />
                      <Label htmlFor="role-artisan" className="cursor-pointer font-normal">
                        匠人
                      </Label>
                    </div>
                  </RadioGroup>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={saveRole}
                      disabled={isEditing("role")}
                    >
                      {isEditing("role") ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "保存"
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setRole((user.role as "user" | "artisan") || "user");
                        setEditingField(null);
                      }}
                    >
                      取消
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* 密码找回 */}
            <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="w-20 shrink-0 text-sm text-muted-foreground">
                密码找回
              </span>
              {editingField !== "password" ? (
                <div className="flex flex-1 items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">
                    重新设置登录密码
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-muted-foreground hover:text-foreground"
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
                <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                  <div className="mt-2 flex gap-2 sm:mt-0">
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

            {/* Google 绑定 */}
            <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="w-20 shrink-0 text-sm text-muted-foreground">
                第三方绑定
              </span>
              <div className="flex flex-1 items-center justify-between gap-3 rounded-lg border bg-muted/30 px-4 py-3">
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
        </CardContent>
      </Card>
    </div>
  );
}

