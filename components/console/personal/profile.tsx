"use client";

import { useState } from "react";
import Link from "next/link";
import { User, UserGender } from "@/types/user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageUpload } from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import {
  getArtisanShopVerificationStatusLabel,
  hasArtisanShopVerificationDraft,
  isArtisanShopVerificationEditable,
  normalizeArtisanShopVerificationStatus,
  type ArtisanShopVerificationStatus,
} from "@/lib/artisan-shop";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentAmapAddress } from "@/lib/amap-client";
import { notify } from "@/lib/notify";
import { proxifyAvatarUrl } from "@/lib/avatar";
import { signIn } from "next-auth/react";
import {
  CalendarDays,
  ExternalLink,
  FileCheck2,
  Loader2,
  LocateFixed,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Store,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { SiGoogle } from "react-icons/si";

type UserRole = "user" | "artisan" | "admin";

type ArtisanFormState = {
  artisan_category: string;
  artisan_specialties: string;
  artisan_years_experience: string;
  artisan_shop_name: string;
  artisan_shop_address: string;
  artisan_service_area: string;
  artisan_contact_wechat: string;
  artisan_bio: string;
};

type ArtisanShopVerificationFormState = {
  artisan_shop_url: string;
  artisan_shop_owner_name: string;
  artisan_shop_contact_phone: string;
  artisan_shop_screenshot_url: string;
  artisan_shop_owner_proof_url: string;
  artisan_shop_supporting_proof_url: string;
};

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

function formatDateTime(date?: string | null) {
  if (!date) return "-";
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "-";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function getVerificationBadgeClass(status: ArtisanShopVerificationStatus) {
  switch (status) {
    case "approved":
      return "bg-emerald-600 text-white";
    case "pending":
      return "bg-amber-500 text-white";
    case "rejected":
      return "bg-red-600 text-white";
    case "expired":
      return "bg-zinc-700 text-white";
    case "none":
    default:
      return "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900";
  }
}

function buildAmapUrl(address?: string) {
  const value = String(address || "").trim();
  if (!value) return "";
  return `https://uri.amap.com/search?keyword=${encodeURIComponent(
    value
  )}&src=hangyi&coordinate=gaode&callnative=0`;
}

function createArtisanForm(user: User): ArtisanFormState {
  return {
    artisan_category: user.artisan_category || "",
    artisan_specialties: user.artisan_specialties || "",
    artisan_years_experience:
      typeof user.artisan_years_experience === "number" &&
      user.artisan_years_experience > 0
        ? String(user.artisan_years_experience)
        : "",
    artisan_shop_name: user.artisan_shop_name || "",
    artisan_shop_address: user.artisan_shop_address || "",
    artisan_service_area: user.artisan_service_area || "",
    artisan_contact_wechat: user.artisan_contact_wechat || "",
    artisan_bio: user.artisan_bio || "",
  };
}

function createArtisanShopVerificationForm(
  user: User
): ArtisanShopVerificationFormState {
  return {
    artisan_shop_url: user.artisan_shop_url || "",
    artisan_shop_owner_name: user.artisan_shop_owner_name || "",
    artisan_shop_contact_phone: user.artisan_shop_contact_phone || "",
    artisan_shop_screenshot_url: user.artisan_shop_screenshot_url || "",
    artisan_shop_owner_proof_url: user.artisan_shop_owner_proof_url || "",
    artisan_shop_supporting_proof_url:
      user.artisan_shop_supporting_proof_url || "",
  };
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
  const [artisanForm, setArtisanForm] = useState<ArtisanFormState>(() =>
    createArtisanForm(user)
  );
  const [artisanDialogOpen, setArtisanDialogOpen] = useState(false);
  const [shopVerificationDialogOpen, setShopVerificationDialogOpen] =
    useState(false);
  const [savedShopVerificationForm, setSavedShopVerificationForm] =
    useState<ArtisanShopVerificationFormState>(() =>
      createArtisanShopVerificationForm(user)
    );
  const [shopVerificationForm, setShopVerificationForm] =
    useState<ArtisanShopVerificationFormState>(() =>
      createArtisanShopVerificationForm(user)
    );
  const [shopVerificationStatus, setShopVerificationStatus] =
    useState<ArtisanShopVerificationStatus>(() =>
      normalizeArtisanShopVerificationStatus(
        user.artisan_shop_verification_status
      )
    );
  const [shopVerificationNote, setShopVerificationNote] = useState(
    user.artisan_shop_verification_note || ""
  );
  const [shopVerificationSubmittedAt, setShopVerificationSubmittedAt] =
    useState<string | null>(user.artisan_shop_verification_submitted_at || null);
  const [shopVerificationReviewedAt, setShopVerificationReviewedAt] =
    useState<string | null>(user.artisan_shop_verification_reviewed_at || null);
  const [shopVerificationReviewer, setShopVerificationReviewer] = useState(
    user.artisan_shop_verification_reviewer || ""
  );
  const [locatingTarget, setLocatingTarget] = useState<
    null | "profile_address" | "artisan_shop_address"
  >(null);
  const [editingField, setEditingField] = useState<
    null | "avatar" | "nickname" | "email" | "password" | "details"
  >(null);
  const [loadingField, setLoadingField] = useState<
    null | "avatar" | "nickname" | "email" | "password" | "details" | "role"
  >(null);
  const [shopVerificationSubmitting, setShopVerificationSubmitting] =
    useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const googleBound =
    user.signin_provider === "google" || user.signin_type === "google";
  const addressMapUrl = buildAmapUrl(address);
  const canApplyArtisan = role === "user";
  const canEditArtisan = role === "artisan";
  const canSubmitShopVerification = role === "artisan";
  const shopVerificationEditable =
    canSubmitShopVerification &&
    isArtisanShopVerificationEditable(shopVerificationStatus);
  const hasArtisanProfile =
    role === "artisan" ||
    role === "admin" ||
    [
      artisanForm.artisan_category,
      artisanForm.artisan_specialties,
      artisanForm.artisan_years_experience,
      artisanForm.artisan_shop_name,
      artisanForm.artisan_shop_address,
      artisanForm.artisan_service_area,
      artisanForm.artisan_contact_wechat,
      artisanForm.artisan_bio,
    ].some((value) => String(value || "").trim().length > 0);
  const artisanShopAddressMapUrl = buildAmapUrl(
    artisanForm.artisan_shop_address
  );
  const hasShopVerificationDraft = hasArtisanShopVerificationDraft(
    savedShopVerificationForm
  );

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

  const resetArtisanForm = () => {
    setArtisanForm(createArtisanForm(user));
  };

  const resetShopVerificationForm = () => {
    setShopVerificationForm(savedShopVerificationForm);
  };

  const submitShopVerification = async () => {
    if (!canSubmitShopVerification) {
      notify("error", "请先成为匠人再提交淘宝认证");
      return;
    }
    if (!shopVerificationEditable) {
      notify("info", "店铺认证正在审核中，暂时不能修改");
      return;
    }

    try {
      setShopVerificationSubmitting(true);
      const resp = await fetch("/api/user/update/artisan-shop-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artisan_shop_url: shopVerificationForm.artisan_shop_url,
          artisan_shop_owner_name:
            shopVerificationForm.artisan_shop_owner_name,
          artisan_shop_contact_phone:
            shopVerificationForm.artisan_shop_contact_phone,
          artisan_shop_screenshot_url:
            shopVerificationForm.artisan_shop_screenshot_url,
          artisan_shop_owner_proof_url:
            shopVerificationForm.artisan_shop_owner_proof_url,
          artisan_shop_supporting_proof_url:
            shopVerificationForm.artisan_shop_supporting_proof_url,
        }),
      });
      const result = await resp.json();
      if (result.code !== 0) {
        notify("error", result.message || "提交淘宝店铺认证失败");
        return;
      }

      const submittedAt =
        result?.data?.artisan_shop_verification_submitted_at ||
        new Date().toISOString();
      setSavedShopVerificationForm(shopVerificationForm);
      setShopVerificationStatus("pending");
      setShopVerificationNote("");
      setShopVerificationSubmittedAt(submittedAt);
      setShopVerificationReviewedAt(null);
      setShopVerificationReviewer("");
      setShopVerificationDialogOpen(false);
      notify("success", "淘宝店铺认证资料已提交，等待管理员审核");
    } catch {
      notify("error", "提交淘宝店铺认证失败");
    } finally {
      setShopVerificationSubmitting(false);
    }
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

  const locateCurrentAddress = async (
    target: "profile_address" | "artisan_shop_address"
  ) => {
    try {
      setLocatingTarget(target);
      const result = await getCurrentAmapAddress();
      const formattedAddress = String(result.formattedAddress || "").trim();
      if (!formattedAddress) {
        notify("error", "未获取到可用地址，请稍后重试");
        return;
      }

      if (target === "profile_address") {
        setAddress(formattedAddress);
      } else {
        setArtisanForm((current) => ({
          ...current,
          artisan_shop_address: formattedAddress,
        }));
      }

      notify("success", "当前位置已获取并回填");
    } catch (error: any) {
      notify(
        "error",
        error?.message === "missing_amap_key"
          ? "缺少 NEXT_PUBLIC_AMAP_KEY，无法使用高德定位"
          : error?.message || "定位失败"
      );
    } finally {
      setLocatingTarget(null);
    }
  };

  const submitArtisanProfile = async () => {
    try {
      setLoadingField("role");
      const resp = await fetch("/api/user/update/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "artisan",
          artisan_category: artisanForm.artisan_category,
          artisan_specialties: artisanForm.artisan_specialties,
          artisan_years_experience: artisanForm.artisan_years_experience,
          artisan_shop_name: artisanForm.artisan_shop_name,
          artisan_shop_address: artisanForm.artisan_shop_address,
          artisan_service_area: artisanForm.artisan_service_area,
          artisan_contact_wechat: artisanForm.artisan_contact_wechat,
          artisan_bio: artisanForm.artisan_bio,
        }),
      });
      const { code, message } = await resp.json();
      if (code !== 0) {
        notify("error", message || "申请匠人身份失败");
        return;
      }

      setRole("artisan");
      notify("success", canApplyArtisan ? "匠人资料已提交" : "匠人资料已更新");
      setArtisanDialogOpen(false);
    } catch {
      notify("error", canApplyArtisan ? "申请匠人身份失败" : "更新匠人资料失败");
    } finally {
      setLoadingField(null);
    }
  };

  return (
    <div className="grid gap-4 sm:gap-6">
      <Dialog
        open={artisanDialogOpen}
        onOpenChange={(open) => {
          setArtisanDialogOpen(open);
          if (!open) {
            resetArtisanForm();
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {canApplyArtisan ? "申请成为匠人" : "编辑匠人资料"}
            </DialogTitle>
            <DialogDescription>
              填写你的工艺方向、店铺信息和简介。店铺地址支持高德定位回填。
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  你是什么工匠
                </div>
                <Input
                  value={artisanForm.artisan_category}
                  onChange={(e) =>
                    setArtisanForm((current) => ({
                      ...current,
                      artisan_category: e.target.value,
                    }))
                  }
                  placeholder="例如：木作匠人、陶艺师、银饰手作"
                />
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  从业年限
                </div>
                <Input
                  type="number"
                  min={0}
                  max={80}
                  value={artisanForm.artisan_years_experience}
                  onChange={(e) =>
                    setArtisanForm((current) => ({
                      ...current,
                      artisan_years_experience: e.target.value,
                    }))
                  }
                  placeholder="例如：8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                擅长工艺 / 代表作品类型
              </div>
              <Input
                value={artisanForm.artisan_specialties}
                onChange={(e) =>
                  setArtisanForm((current) => ({
                    ...current,
                    artisan_specialties: e.target.value,
                  }))
                }
                placeholder="例如：榫卯家具、青瓷器皿、手工皮具"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  店铺 / 工作室名称
                </div>
                <Input
                  value={artisanForm.artisan_shop_name}
                  onChange={(e) =>
                    setArtisanForm((current) => ({
                      ...current,
                      artisan_shop_name: e.target.value,
                    }))
                  }
                  placeholder="请输入店铺或工作室名称"
                />
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  服务区域
                </div>
                <Input
                  value={artisanForm.artisan_service_area}
                  onChange={(e) =>
                    setArtisanForm((current) => ({
                      ...current,
                      artisan_service_area: e.target.value,
                    }))
                  }
                  placeholder="例如：杭州 / 江浙沪 / 线上接单"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                店铺地址
              </div>
              <Textarea
                value={artisanForm.artisan_shop_address}
                onChange={(e) =>
                  setArtisanForm((current) => ({
                    ...current,
                    artisan_shop_address: e.target.value,
                  }))
                }
                placeholder="请输入可被高德地图识别的店铺地址或工作室位置"
                maxLength={255}
              />
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
                <span>支持直接获取当前位置并回填，也可以手动输入完整地址。</span>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 rounded-full px-3 text-xs"
                    onClick={() => locateCurrentAddress("artisan_shop_address")}
                    disabled={locatingTarget === "artisan_shop_address"}
                  >
                    {locatingTarget === "artisan_shop_address" ? (
                      <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <LocateFixed className="mr-1 h-3.5 w-3.5" />
                    )}
                    使用当前位置
                  </Button>
                  {artisanShopAddressMapUrl ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 rounded-full px-3 text-xs"
                      onClick={() =>
                        window.open(
                          artisanShopAddressMapUrl,
                          "_blank",
                          "noopener,noreferrer"
                        )
                      }
                    >
                      <MapPin className="mr-1 h-3.5 w-3.5" />
                      高德预览
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  联系微信
                </div>
                <Input
                  value={artisanForm.artisan_contact_wechat}
                  onChange={(e) =>
                    setArtisanForm((current) => ({
                      ...current,
                      artisan_contact_wechat: e.target.value,
                    }))
                  }
                  placeholder="方便平台或用户联系你"
                />
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  联系手机
                </div>
                <Input value={phoneNumber} disabled placeholder="请在基础资料里维护手机号" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                匠人简介
              </div>
              <Textarea
                value={artisanForm.artisan_bio}
                onChange={(e) =>
                  setArtisanForm((current) => ({
                    ...current,
                    artisan_bio: e.target.value,
                  }))
                }
                placeholder="介绍你的工艺背景、风格、服务方式或代表作品"
                maxLength={1000}
                rows={5}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetArtisanForm();
                  setArtisanDialogOpen(false);
                }}
                disabled={loadingField === "role"}
              >
                取消
              </Button>
              <Button
                type="button"
                onClick={submitArtisanProfile}
                disabled={loadingField === "role"}
              >
                {loadingField === "role" ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-1 h-4 w-4" />
                )}
                {canApplyArtisan ? "提交申请" : "保存资料"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={shopVerificationDialogOpen}
        onOpenChange={(open) => {
          setShopVerificationDialogOpen(open);
          if (!open) {
            resetShopVerificationForm();
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>淘宝店铺认证</DialogTitle>
            <DialogDescription>
              提交淘宝店铺链接与证明材料后，管理员会人工审核并给你的匠人身份加上认证标识。
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="rounded-2xl border border-black/5 bg-zinc-50/80 p-4 text-sm text-zinc-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={`rounded-full px-3 py-1 ${getVerificationBadgeClass(shopVerificationStatus)}`}>
                  {getArtisanShopVerificationStatusLabel(shopVerificationStatus)}
                </Badge>
                <span>仅支持淘宝或天猫店铺链接。</span>
              </div>
              {shopVerificationStatus === "pending" ? (
                <p className="mt-3 text-xs leading-6 text-zinc-500">
                  当前资料正在审核中，如需修改请等待审核结果后重新提交。
                </p>
              ) : null}
              {shopVerificationNote ? (
                <p className="mt-3 text-xs leading-6 text-red-600 dark:text-red-300">
                  审核备注：{shopVerificationNote}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                店铺链接
              </div>
              <Input
                value={shopVerificationForm.artisan_shop_url}
                onChange={(e) =>
                  setShopVerificationForm((current) => ({
                    ...current,
                    artisan_shop_url: e.target.value,
                  }))
                }
                disabled={!shopVerificationEditable}
                placeholder="https://shopxxxx.taobao.com 或 https://xxxxx.tmall.com"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  店主 / 经营者
                </div>
                <Input
                  value={shopVerificationForm.artisan_shop_owner_name}
                  onChange={(e) =>
                    setShopVerificationForm((current) => ({
                      ...current,
                      artisan_shop_owner_name: e.target.value,
                    }))
                  }
                  disabled={!shopVerificationEditable}
                  placeholder="请输入店主姓名或品牌主体"
                />
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  审核联系手机
                </div>
                <Input
                  value={shopVerificationForm.artisan_shop_contact_phone}
                  onChange={(e) =>
                    setShopVerificationForm((current) => ({
                      ...current,
                      artisan_shop_contact_phone: e.target.value,
                    }))
                  }
                  disabled={!shopVerificationEditable}
                  placeholder="管理员核验时可联系你"
                />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="space-y-2">
                <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  店铺首页截图
                </div>
                <ImageUpload
                  value={shopVerificationForm.artisan_shop_screenshot_url}
                  onChange={(url) =>
                    setShopVerificationForm((current) => ({
                      ...current,
                      artisan_shop_screenshot_url: url,
                    }))
                  }
                  disabled={!shopVerificationEditable}
                />
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  店铺归属证明
                </div>
                <ImageUpload
                  value={shopVerificationForm.artisan_shop_owner_proof_url}
                  onChange={(url) =>
                    setShopVerificationForm((current) => ({
                      ...current,
                      artisan_shop_owner_proof_url: url,
                    }))
                  }
                  disabled={!shopVerificationEditable}
                />
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  补充证明材料
                </div>
                <ImageUpload
                  value={shopVerificationForm.artisan_shop_supporting_proof_url}
                  onChange={(url) =>
                    setShopVerificationForm((current) => ({
                      ...current,
                      artisan_shop_supporting_proof_url: url,
                    }))
                  }
                  disabled={!shopVerificationEditable}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-black/10 px-4 py-3 text-xs leading-6 text-zinc-500 dark:border-white/10">
              <div>建议材料：</div>
              <div>1. 店铺首页截图</div>
              <div>2. 能证明店铺归属的后台、旺旺或经营主体截图</div>
              <div>3. 补充佐证图，例如品牌证明、手持说明或营业执照</div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetShopVerificationForm();
                  setShopVerificationDialogOpen(false);
                }}
                disabled={shopVerificationSubmitting}
              >
                关闭
              </Button>
              {shopVerificationEditable ? (
                <Button
                  type="button"
                  onClick={submitShopVerification}
                  disabled={shopVerificationSubmitting}
                >
                  {shopVerificationSubmitting ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <FileCheck2 className="mr-1 h-4 w-4" />
                  )}
                  提交审核
                </Button>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <section className="relative overflow-hidden rounded-[24px] border border-black/5 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_32%),linear-gradient(135deg,#ffffff,#f4f6fb)] p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:rounded-[28px] sm:p-6 dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.16),transparent_30%),linear-gradient(135deg,rgba(24,24,27,1),rgba(39,39,42,0.96))]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="group relative">
              <Avatar className="h-20 w-20 border-4 border-white/80 shadow-2xl transition-all sm:h-24 sm:w-24 dark:border-white/10">
                <AvatarImage src={proxifyAvatarUrl(avatarUrl)} alt={nickname} />
                <AvatarFallback className="bg-zinc-200 text-2xl font-semibold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100">
                  {nickname?.slice(0, 2) || "用户"}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => setEditingField("avatar")}
                disabled={loadingField === "avatar"}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-100 transition-opacity sm:opacity-0 sm:hover:opacity-100 sm:group-hover:opacity-100 disabled:cursor-not-allowed"
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
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
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
                {role === "artisan" ? (
                  <Badge className={`rounded-full px-3 py-1 ${getVerificationBadgeClass(shopVerificationStatus)}`}>
                    {shopVerificationStatus === "approved"
                      ? "淘宝店铺已认证"
                      : getArtisanShopVerificationStatusLabel(shopVerificationStatus)}
                  </Badge>
                ) : null}
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
        <div className="fixed inset-0 z-[121] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-[24px] border border-black/5 bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.18)] sm:rounded-[28px] sm:p-6 dark:border-white/10 dark:bg-[rgb(32,34,44)]">
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

      <section className="min-h-0 overflow-hidden rounded-[24px] border border-black/5 bg-white/80 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur sm:rounded-[28px] sm:p-6 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-zinc-900 sm:text-2xl dark:text-white">
            账户信息
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            统一管理你的基础资料、登录方式和账户安全设置。
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="overflow-hidden rounded-[24px] border border-black/5 bg-white shadow-[0_12px_34px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-zinc-950/40">
            <div className="px-5 py-5 sm:px-8 sm:py-6">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
                基本资料
              </h3>
            </div>
            <div className="space-y-5 px-5 pb-5 sm:space-y-6 sm:px-8 sm:pb-8">
              <div className="group rounded-2xl border border-black/5 bg-white/60 p-5 transition-all hover:bg-white/80 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-sm font-medium text-muted-foreground">昵称</span>
                  {editingField !== "nickname" ? (
                    <div className="flex flex-1 items-center justify-between gap-3 sm:justify-end">
                      <span className="text-base font-medium">{nickname || "未设置"}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
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
                        className="h-8 shrink-0 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
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
                        className="h-8 shrink-0 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
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
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <MapPin className="h-3.5 w-3.5" />
                            详细地址
                          </div>
                          {addressMapUrl ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7 rounded-full px-3 text-xs"
                              onClick={() =>
                                window.open(
                                  addressMapUrl,
                                  "_blank",
                                  "noopener,noreferrer"
                                )
                              }
                            >
                              <LocateFixed className="mr-1 h-3.5 w-3.5" />
                              高德打开
                            </Button>
                          ) : null}
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
                          placeholder="请输入可被高德地图识别的详细地址或场馆名"
                          maxLength={255}
                        />
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
                          <span>建议填写完整街道、门牌或场馆名，便于直接拉起高德地图。</span>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7 rounded-full px-3 text-xs"
                              onClick={() => locateCurrentAddress("profile_address")}
                              disabled={locatingTarget === "profile_address"}
                            >
                              {locatingTarget === "profile_address" ? (
                                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <LocateFixed className="mr-1 h-3.5 w-3.5" />
                              )}
                              使用当前位置
                            </Button>
                            {addressMapUrl ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-7 rounded-full px-3 text-xs"
                                onClick={() =>
                                  window.open(
                                    addressMapUrl,
                                    "_blank",
                                    "noopener,noreferrer"
                                  )
                                }
                              >
                                <MapPin className="mr-1 h-3.5 w-3.5" />
                                预览高德
                              </Button>
                            ) : null}
                          </div>
                        </div>
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
            <div className="px-5 py-5 sm:px-8 sm:py-6">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
                账户设置
              </h3>
            </div>
            <div className="space-y-5 px-5 pb-5 sm:space-y-6 sm:px-8 sm:pb-8">
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
                        className="h-8 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
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
                  <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-zinc-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-zinc-500" />
                      {getRoleLabel(role)}
                    </div>
                    {canApplyArtisan ? (
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-full"
                        onClick={() => {
                          resetArtisanForm();
                          setArtisanDialogOpen(true);
                        }}
                        disabled={loadingField === "role"}
                      >
                        {loadingField === "role" ? (
                          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="mr-1 h-4 w-4" />
                        )}
                        申请匠人身份
                      </Button>
                    ) : null}
                    {canEditArtisan ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => {
                          resetArtisanForm();
                          setArtisanDialogOpen(true);
                        }}
                      >
                        <Pencil className="mr-1 h-4 w-4" />
                        编辑匠人资料
                      </Button>
                    ) : null}
                    {canSubmitShopVerification ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => {
                          resetShopVerificationForm();
                          setShopVerificationDialogOpen(true);
                        }}
                      >
                        <FileCheck2 className="mr-1 h-4 w-4" />
                        {shopVerificationStatus === "none"
                          ? "提交淘宝认证"
                          : shopVerificationStatus === "pending"
                            ? "查看淘宝认证"
                            : shopVerificationStatus === "approved"
                              ? "更新认证材料"
                              : "重新提交认证"}
                      </Button>
                    ) : null}
                  </div>
                </div>
                {canApplyArtisan ? (
                  <p className="mt-3 text-xs leading-6 text-zinc-500">
                    切换后可按匠人身份参与投稿与展览申请。管理员账号不需要申请。
                  </p>
                ) : canSubmitShopVerification ? (
                  <p className="mt-3 text-xs leading-6 text-zinc-500">
                    匠人可提交淘宝店铺链接和证明材料，通过人工审核后会显示“淘宝店铺已认证”。
                  </p>
                ) : null}
              </div>

              {hasArtisanProfile ? (
                <div className="rounded-2xl border border-black/5 bg-white/60 p-5 dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Store className="h-4 w-4" />
                    匠人资料
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <div className="text-xs text-zinc-500">工匠类型</div>
                      <div className="mt-1 text-sm font-medium text-zinc-900 dark:text-white">
                        {artisanForm.artisan_category || "未填写"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500">从业年限</div>
                      <div className="mt-1 text-sm font-medium text-zinc-900 dark:text-white">
                        {artisanForm.artisan_years_experience
                          ? `${artisanForm.artisan_years_experience} 年`
                          : "未填写"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500">店铺 / 工作室</div>
                      <div className="mt-1 text-sm font-medium text-zinc-900 dark:text-white">
                        {artisanForm.artisan_shop_name || "未填写"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500">服务区域</div>
                      <div className="mt-1 text-sm font-medium text-zinc-900 dark:text-white">
                        {artisanForm.artisan_service_area || "未填写"}
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <div className="text-xs text-zinc-500">擅长工艺</div>
                      <div className="mt-1 text-sm font-medium text-zinc-900 dark:text-white">
                        {artisanForm.artisan_specialties || "未填写"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500">联系微信</div>
                      <div className="mt-1 text-sm font-medium text-zinc-900 dark:text-white">
                        {artisanForm.artisan_contact_wechat || "未填写"}
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-xs text-zinc-500">店铺地址</div>
                        {artisanShopAddressMapUrl ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 rounded-full px-3 text-xs"
                            onClick={() =>
                              window.open(
                                artisanShopAddressMapUrl,
                                "_blank",
                                "noopener,noreferrer"
                              )
                            }
                          >
                            <LocateFixed className="mr-1 h-3.5 w-3.5" />
                            高德打开
                          </Button>
                        ) : null}
                      </div>
                      <div className="mt-1 whitespace-pre-wrap text-sm font-medium text-zinc-900 dark:text-white">
                        {artisanForm.artisan_shop_address || "未填写"}
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <div className="text-xs text-zinc-500">匠人简介</div>
                      <div className="mt-1 whitespace-pre-wrap text-sm font-medium text-zinc-900 dark:text-white">
                        {artisanForm.artisan_bio || "未填写"}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {canSubmitShopVerification || hasShopVerificationDraft ? (
                <div className="rounded-2xl border border-black/5 bg-white/60 p-5 dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <ShieldCheck className="h-4 w-4" />
                      淘宝店铺认证
                    </div>
                    <Badge className={`rounded-full px-3 py-1 ${getVerificationBadgeClass(shopVerificationStatus)}`}>
                      {shopVerificationStatus === "approved"
                        ? "淘宝店铺已认证"
                        : getArtisanShopVerificationStatusLabel(shopVerificationStatus)}
                    </Badge>
                  </div>

                  {hasShopVerificationDraft ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <div className="text-xs text-zinc-500">平台</div>
                        <div className="mt-1 text-sm font-medium text-zinc-900 dark:text-white">
                          {user.artisan_shop_platform ||
                          savedShopVerificationForm.artisan_shop_url
                            ? "淘宝"
                            : "未填写"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500">店主 / 经营者</div>
                        <div className="mt-1 text-sm font-medium text-zinc-900 dark:text-white">
                          {savedShopVerificationForm.artisan_shop_owner_name || "未填写"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500">审核联系手机</div>
                        <div className="mt-1 text-sm font-medium text-zinc-900 dark:text-white">
                          {savedShopVerificationForm.artisan_shop_contact_phone || "未填写"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500">提交时间</div>
                        <div className="mt-1 text-sm font-medium text-zinc-900 dark:text-white">
                          {formatDateTime(shopVerificationSubmittedAt)}
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-xs text-zinc-500">店铺链接</div>
                          {savedShopVerificationForm.artisan_shop_url ? (
                            <Button asChild size="sm" variant="outline" className="h-7 rounded-full px-3 text-xs">
                              <Link
                                href={savedShopVerificationForm.artisan_shop_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="mr-1 h-3.5 w-3.5" />
                                打开店铺
                              </Link>
                            </Button>
                          ) : null}
                        </div>
                        <div className="mt-1 break-all text-sm font-medium text-zinc-900 dark:text-white">
                          {savedShopVerificationForm.artisan_shop_url || "未填写"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500">审核时间</div>
                        <div className="mt-1 text-sm font-medium text-zinc-900 dark:text-white">
                          {formatDateTime(shopVerificationReviewedAt)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500">审核人</div>
                        <div className="mt-1 text-sm font-medium text-zinc-900 dark:text-white">
                          {shopVerificationReviewer || "—"}
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <div className="text-xs text-zinc-500">审核备注</div>
                        <div className="mt-1 whitespace-pre-wrap text-sm font-medium text-zinc-900 dark:text-white">
                          {shopVerificationNote || "暂无"}
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <div className="text-xs text-zinc-500">认证材料</div>
                        <div className="mt-2 grid gap-3 sm:grid-cols-3">
                          {[
                            {
                              label: "店铺首页截图",
                              url: savedShopVerificationForm.artisan_shop_screenshot_url,
                            },
                            {
                              label: "归属证明",
                              url: savedShopVerificationForm.artisan_shop_owner_proof_url,
                            },
                            {
                              label: "补充材料",
                              url: savedShopVerificationForm.artisan_shop_supporting_proof_url,
                            },
                          ].map((item) => (
                            <div
                              key={item.label}
                              className="overflow-hidden rounded-2xl border border-black/5 bg-white/80 dark:border-white/10 dark:bg-white/[0.04]"
                            >
                              <div className="border-b border-black/5 px-3 py-2 text-xs text-zinc-500 dark:border-white/10">
                                {item.label}
                              </div>
                              {item.url ? (
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block"
                                >
                                  <img
                                    src={item.url}
                                    alt={item.label}
                                    className="h-40 w-full object-cover"
                                  />
                                </a>
                              ) : (
                                <div className="flex h-40 items-center justify-center px-3 text-xs text-zinc-400">
                                  未上传
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-black/10 px-4 py-6 text-sm text-zinc-500 dark:border-white/10">
                      还没有提交淘宝店铺认证。提交后，管理员审核通过会显示“淘宝店铺已认证”。
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
