"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SiGithub, SiGoogle } from "react-icons/si";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import * as React from "react";
import { notify } from "@/lib/notify";

export default function SignForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const t = useTranslations();
  const [role, setRole] = React.useState<"user" | "artisan">("user");

  const setSignupRoleCookie = (nextRole: "user" | "artisan") => {
    // keep it short-lived; only needed during the OAuth redirect roundtrip
    document.cookie = `signup_role=${nextRole}; path=/; max-age=600; samesite=lax`;
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">
            {t("sign_modal.sign_in_title")}
          </CardTitle>
          <CardDescription>
            {t("sign_modal.sign_in_description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {/* <div className="grid gap-2">
              <Label>身份选择</Label>
              <RadioGroup
                value={role}
                onValueChange={(v) => setRole(v as "user" | "artisan")}
                className="flex gap-4 justify-center"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="user" id="role-user" />
                  <Label htmlFor="role-user">普通用户</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="artisan" id="role-artisan" />
                  <Label htmlFor="role-artisan">匠人</Label>
                </div>
              </RadioGroup>
            </div> */}
            <div className="flex flex-col gap-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSignupRoleCookie(role);
                  signIn("google");
                }}
              >
                <SiGoogle className="w-4 h-4" />
                {t("sign_modal.google_sign_in")}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSignupRoleCookie(role);
                  signIn("github");
                }}
              >
                <SiGithub className="w-4 h-4" />
                {t("sign_modal.github_sign_in")}
              </Button>
            </div>

            {/* 账号密码登录 */}
            <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
              <span className="relative z-10 bg-background px-2 text-muted-foreground">
                或使用账号密码登录
              </span>
            </div>
            <PasswordAuth role={role} />
          </div>
        </CardContent>
      </Card>
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary  ">
        By clicking continue, you agree to our{" "}
        <a href="/terms-of-service" target="_blank">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="/privacy-policy" target="_blank">
          Privacy Policy
        </a>
        .
      </div>
    </div>
  );
}

export function PasswordAuth({ role }: { role: "user" | "artisan" }) {
  const [mode, setMode] = React.useState<"login" | "register">("login");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [nickname, setNickname] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleRegister = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedNickname = nickname.trim();
    const normalizedPassword = password;

    if (!normalizedEmail || !normalizedPassword || !normalizedNickname) {
      notify("error", "邮箱、昵称、密码不能为空");
      return;
    }
    try {
      setLoading(true);
      const resp = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          password: normalizedPassword,
          nickname: normalizedNickname,
          role,
        }),
      });
      const { code, message } = await resp.json();
      if (code !== 0) {
        notify("error", message || "注册失败");
        return;
      }
      notify("success", "注册成功，请使用账号密码登录");
      setMode("login");
    } catch (e) {
      notify("error", "注册失败");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password;

    if (!normalizedEmail || !normalizedPassword) {
      notify("error", "邮箱和密码不能为空");
      return;
    }
    try {
      setLoading(true);
      const result = await signIn("credentials-login", {
        email: normalizedEmail,
        password: normalizedPassword,
        redirect: false,
      });

      if (!result) {
        notify("error", "登录失败");
        return;
      }

      if (result.error) {
        const msg =
          result.error === "CredentialsSignin"
            ? "邮箱或密码错误"
            : result.error;
        notify("error", msg);
        return;
      }

      // 登录成功后跳转
      window.location.href = result.url || "/";
    } catch (e) {
      notify("error", "登录失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-4">
      <div className="flex justify-center gap-4 text-sm">
        <button
          type="button"
          className={cn(
            "px-3 py-1 rounded-full border",
            mode === "login"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-foreground border-muted"
          )}
          onClick={() => setMode("login")}
        >
          登录
        </button>
        <button
          type="button"
          className={cn(
            "px-3 py-1 rounded-full border",
            mode === "register"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-foreground border-muted"
          )}
          onClick={() => setMode("register")}
        >
          注册
        </button>
      </div>

      <div className="grid gap-3">
        <div className="grid gap-2">
          <Label htmlFor="email">邮箱</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {mode === "register" && (
          <div className="grid gap-2">
            <Label htmlFor="nickname">昵称</Label>
            <Input
              id="nickname"
              placeholder="你的昵称"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>
        )}
        <div className="grid gap-2">
          <Label htmlFor="password">密码</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button
          type="button"
          className="w-full"
          onClick={mode === "login" ? handleLogin : handleRegister}
          disabled={loading}
        >
          {mode === "login" ? "登录" : "注册"}
        </Button>
      </div>
    </div>
  );
}
