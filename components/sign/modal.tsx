"use client";

import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { SiGithub, SiGoogle } from "react-icons/si";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { signIn } from "next-auth/react";
import { useAppContext } from "@/contexts/app";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useTranslations } from "next-intl";
import { PasswordAuth } from "@/components/sign/form";

export default function SignModal() {
  const t = useTranslations();
  const { showSignModal, setShowSignModal } = useAppContext();

  const [open, setOpen] = React.useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={showSignModal} onOpenChange={setShowSignModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("sign_modal.sign_in_title")}</DialogTitle>
            <DialogDescription>
              {t("sign_modal.sign_in_description")}
            </DialogDescription>
          </DialogHeader>
          <ProfileForm />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={showSignModal} onOpenChange={setShowSignModal}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{t("sign_modal.sign_in_title")}</DrawerTitle>
          <DrawerDescription>
            {t("sign_modal.sign_in_description")}
          </DrawerDescription>
        </DrawerHeader>
        <ProfileForm className="px-4" />
        <DrawerFooter className="pt-4">
          <DrawerClose asChild>
            <Button variant="outline">{t("sign_modal.cancel_title")}</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function ProfileForm({ className }: React.ComponentProps<"form">) {
  const t = useTranslations();
  const [role, setRole] = React.useState<"user" | "artisan">("user");

  const setSignupRoleCookie = (nextRole: "user" | "artisan") => {
    // 与页面版登录保持一致：仅在登录这一小段时间内生效
    document.cookie = `signup_role=${nextRole}; path=/; max-age=600; samesite=lax`;
  };

  return (
    <div className={cn("grid items-start gap-6", className)}>


      {/* 模式一：一键登录（Google / Github） */}
      <div className="flex flex-col gap-3 ">
      {process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === "true" && (
        <Button
          variant="outline"
          className="w-full flex items-center gap-2 mt-2"
          onClick={() => {
              setSignupRoleCookie(role);
            signIn("google");
          }}
        >
          <SiGoogle className="w-4 h-4" />
          {t("sign_modal.google_sign_in")}
        </Button>
      )}

      {process.env.NEXT_PUBLIC_AUTH_GITHUB_ENABLED === "true" && (
        <Button
          variant="outline"
          className="w-full flex items-center gap-2"
          onClick={() => {
              setSignupRoleCookie(role);
            signIn("github");
          }}
        >
          <SiGithub className="w-4 h-4" />
          {t("sign_modal.github_sign_in")}
        </Button>
      )}
      </div>

      {/* 模式二：账号密码登录 */}
      <div className="relative text-center text-xs text-muted-foreground">
        <span className="px-2 bg-background">或使用账号密码登录</span>
      </div>

      <PasswordAuth role={role} />
    </div>
  );
}
