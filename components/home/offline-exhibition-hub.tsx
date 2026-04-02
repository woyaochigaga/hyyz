"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  CalendarDays,
  Clock3,
  LocateFixed,
  MapPin,
  Pencil,
  Trash2,
} from "lucide-react";
import { OfflineExhibitionMapPanel } from "@/components/home/offline-exhibition-map-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type {
  OfflineExhibition,
  OfflineExhibitionStatus,
} from "@/types/offline-exhibition";

type HubTab = "apply" | "mine";

type ExhibitionFormState = {
  applicant_role: "user" | "artisan";
  title: string;
  subtitle: string;
  summary: string;
  description: string;
  curator_name: string;
  curator_title: string;
  organizer_name: string;
  co_organizers_text: string;
  sponsor_name: string;
  supporting_organizations_text: string;
  contact_name: string;
  contact_phone: string;
  contact_wechat: string;
  contact_email: string;
  venue_name: string;
  province: string;
  city: string;
  district: string;
  street: string;
  address_detail: string;
  formatted_address: string;
  map_note: string;
  start_at: string;
  end_at: string;
  apply_deadline: string;
  opening_hours: string;
  admission_type: "free" | "ticketed" | "reservation" | "invite_only";
  admission_fee: string;
  capacity: string;
  booth_count: string;
  cover_url: string;
  poster_url: string;
  gallery_images_text: string;
  tags_text: string;
  art_categories_text: string;
  highlights_text: string;
  transportation_text: string;
  facilities_text: string;
  application_requirements: string;
  submission_materials_text: string;
  schedule_items_text: string;
  external_links_text: string;
};

function createEmptyForm(): ExhibitionFormState {
  return {
    applicant_role: "user",
    title: "",
    subtitle: "",
    summary: "",
    description: "",
    curator_name: "",
    curator_title: "",
    organizer_name: "",
    co_organizers_text: "",
    sponsor_name: "",
    supporting_organizations_text: "",
    contact_name: "",
    contact_phone: "",
    contact_wechat: "",
    contact_email: "",
    venue_name: "",
    province: "",
    city: "",
    district: "",
    street: "",
    address_detail: "",
    formatted_address: "",
    map_note: "",
    start_at: "",
    end_at: "",
    apply_deadline: "",
    opening_hours: "",
    admission_type: "free",
    admission_fee: "0",
    capacity: "0",
    booth_count: "0",
    cover_url: "",
    poster_url: "",
    gallery_images_text: "",
    tags_text: "",
    art_categories_text: "",
    highlights_text: "",
    transportation_text: "",
    facilities_text: "",
    application_requirements: "",
    submission_materials_text: "",
    schedule_items_text: "",
    external_links_text: "",
  };
}

function splitText(value: string) {
  return value
    .split(/[\n,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseJsonArray(value: string) {
  if (!value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    throw new Error("JSON 字段格式不正确，请检查日程或外部链接配置");
  }
}

function toDatetimeLocal(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function fromExhibition(exhibition: OfflineExhibition): ExhibitionFormState {
  return {
    applicant_role: exhibition.applicant_role || "user",
    title: exhibition.title || "",
    subtitle: exhibition.subtitle || "",
    summary: exhibition.summary || "",
    description: exhibition.description || "",
    curator_name: exhibition.curator_name || "",
    curator_title: exhibition.curator_title || "",
    organizer_name: exhibition.organizer_name || "",
    co_organizers_text: (exhibition.co_organizers || []).join("\n"),
    sponsor_name: exhibition.sponsor_name || "",
    supporting_organizations_text: (exhibition.supporting_organizations || []).join("\n"),
    contact_name: exhibition.contact_name || "",
    contact_phone: exhibition.contact_phone || "",
    contact_wechat: exhibition.contact_wechat || "",
    contact_email: exhibition.contact_email || "",
    venue_name: exhibition.venue_name || "",
    province: exhibition.province || "",
    city: exhibition.city || "",
    district: exhibition.district || "",
    street: exhibition.street || "",
    address_detail: exhibition.address_detail || "",
    formatted_address: exhibition.formatted_address || "",
    map_note: exhibition.map_note || "",
    start_at: toDatetimeLocal(exhibition.start_at),
    end_at: toDatetimeLocal(exhibition.end_at),
    apply_deadline: toDatetimeLocal(exhibition.apply_deadline),
    opening_hours: exhibition.opening_hours || "",
    admission_type: exhibition.admission_type || "free",
    admission_fee: String(exhibition.admission_fee || 0),
    capacity: String(exhibition.capacity || 0),
    booth_count: String(exhibition.booth_count || 0),
    cover_url: exhibition.cover_url || "",
    poster_url: exhibition.poster_url || "",
    gallery_images_text: (exhibition.gallery_images || []).join("\n"),
    tags_text: (exhibition.tags || []).join("\n"),
    art_categories_text: (exhibition.art_categories || []).join("\n"),
    highlights_text: (exhibition.highlights || []).join("\n"),
    transportation_text: (exhibition.transportation || []).join("\n"),
    facilities_text: (exhibition.facilities || []).join("\n"),
    application_requirements: exhibition.application_requirements || "",
    submission_materials_text: (exhibition.submission_materials || []).join("\n"),
    schedule_items_text: JSON.stringify(exhibition.schedule_items || [], null, 2),
    external_links_text: JSON.stringify(exhibition.external_links || [], null, 2),
  };
}

function formatDisplayDate(start?: string, end?: string) {
  if (!start && !end) return "时间待定";
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  const startText = start
    ? new Intl.DateTimeFormat("zh-CN", options).format(new Date(start))
    : "";
  const endText = end
    ? new Intl.DateTimeFormat("zh-CN", options).format(new Date(end))
    : "";
  return startText && endText ? `${startText} - ${endText}` : startText || endText;
}

function statusLabel(status?: OfflineExhibitionStatus) {
  switch (status) {
    case "pending_review":
      return "待审核";
    case "published":
      return "已发布";
    case "rejected":
      return "已驳回";
    case "closed":
      return "已结束";
    case "deleted":
      return "已删除";
    default:
      return "草稿";
  }
}

function statusTone(status?: OfflineExhibitionStatus) {
  switch (status) {
    case "published":
      return "border-[#c4ddd6] bg-[#edf8f4] text-[#24564b]";
    case "pending_review":
      return "border-[#e8d7b7] bg-[#fff7e8] text-[#946200]";
    case "rejected":
      return "border-[#efc6c6] bg-[#fff0f0] text-[#8a2d2d]";
    case "closed":
      return "border-[#d8dce1] bg-[#f3f5f7] text-[#52606d]";
    default:
      return "border-[#d8e4e0] bg-[#f3f8f6] text-[#506660]";
  }
}

function buildMapUrl(exhibition: Partial<OfflineExhibition>) {
  const name = encodeURIComponent(exhibition.venue_name || exhibition.title || "线下展览");
  const address = encodeURIComponent(exhibition.formatted_address || exhibition.address_detail || "");
  return `https://uri.amap.com/search?keyword=${name}%20${address}&src=hangyi&coordinate=gaode&callnative=0`;
}

function FormField({
  label,
  hint,
  required = false,
  children,
  className,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-2", className)}>
      <span className="flex items-center gap-2 text-sm font-medium text-[#213632] dark:text-[#e5efeb]">
        <span>
          {label}
          {required ? <span className="ml-1 text-[#dc2626]">*</span> : null}
        </span>
        <span
          className={cn(
            "text-xs font-normal",
            required ? "text-[#dc2626]" : "text-[#72827c] dark:text-[#91a49d]"
          )}
        >
          {required ? "必填" : "选填"}
        </span>
      </span>
      {children}
      {hint ? (
        <span className="text-xs text-[#72827c] dark:text-[#91a49d]">{hint}</span>
      ) : null}
    </label>
  );
}

export function OfflineExhibitionHub({
  locale,
  userRole,
}: {
  locale: string;
  userRole?: "user" | "artisan" | "admin";
}) {
  const [tab, setTab] = React.useState<HubTab>("apply");
  const [myList, setMyList] = React.useState<OfflineExhibition[]>([]);
  const [loadingMine, setLoadingMine] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [editingUuid, setEditingUuid] = React.useState("");
  const [authed, setAuthed] = React.useState<boolean | null>(null);
  const [form, setForm] = React.useState<ExhibitionFormState>(createEmptyForm());

  const loadMyList = React.useCallback(async () => {
    setLoadingMine(true);
    try {
      const params = new URLSearchParams();
      params.set("mine", "1");
      params.set("locale", locale);
      const response = await fetch(`/api/home/exhibition?${params.toString()}`);
      const result = await response.json();
      if (result.code === 0) {
        setMyList(Array.isArray(result.data) ? result.data : []);
        setAuthed(true);
      } else if (result.code === -2) {
        setAuthed(false);
        setMyList([]);
      } else {
        toast.error(result.message || "加载我的申请失败");
      }
    } catch {
      toast.error("加载我的申请失败");
    } finally {
      setLoadingMine(false);
    }
  }, [locale]);

  React.useEffect(() => {
    void loadMyList();
  }, [loadMyList]);

  const draftCount = React.useMemo(
    () => myList.filter((item) => item.status === "draft").length,
    [myList]
  );

  const pendingCount = React.useMemo(
    () => myList.filter((item) => item.status === "pending_review").length,
    [myList]
  );

  const resetForm = () => {
    setEditingUuid("");
    setForm(createEmptyForm());
  };

  const updateForm = <K extends keyof ExhibitionFormState>(
    key: K,
    value: ExhibitionFormState[K]
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const buildPayload = (status: OfflineExhibitionStatus) => {
    return {
      locale,
      status,
      applicant_role: form.applicant_role,
      title: form.title,
      subtitle: form.subtitle,
      summary: form.summary,
      description: form.description,
      curator_name: form.curator_name,
      curator_title: form.curator_title,
      organizer_name: form.organizer_name,
      co_organizers: splitText(form.co_organizers_text),
      sponsor_name: form.sponsor_name,
      supporting_organizations: splitText(form.supporting_organizations_text),
      contact_name: form.contact_name,
      contact_phone: form.contact_phone,
      contact_wechat: form.contact_wechat,
      contact_email: form.contact_email,
      venue_name: form.venue_name,
      province: form.province,
      city: form.city,
      district: form.district,
      street: form.street,
      address_detail: form.address_detail,
      formatted_address: form.formatted_address,
      map_note: form.map_note,
      start_at: form.start_at,
      end_at: form.end_at,
      apply_deadline: form.apply_deadline,
      opening_hours: form.opening_hours,
      admission_type: form.admission_type,
      admission_fee: form.admission_fee,
      capacity: form.capacity,
      booth_count: form.booth_count,
      cover_url: form.cover_url,
      poster_url: form.poster_url,
      gallery_images: splitText(form.gallery_images_text),
      tags: splitText(form.tags_text),
      art_categories: splitText(form.art_categories_text),
      highlights: splitText(form.highlights_text),
      transportation: splitText(form.transportation_text),
      facilities: splitText(form.facilities_text),
      application_requirements: form.application_requirements,
      submission_materials: splitText(form.submission_materials_text),
      schedule_items: parseJsonArray(form.schedule_items_text),
      external_links: parseJsonArray(form.external_links_text),
    };
  };

  const submitForm = async (status: OfflineExhibitionStatus) => {
    try {
      const payload = buildPayload(status);
      setSubmitting(true);

      const response = await fetch(
        editingUuid ? `/api/home/exhibition/${editingUuid}` : "/api/home/exhibition",
        {
          method: editingUuid ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      if (result.code === -2) {
        setAuthed(false);
        throw new Error("请先登录后再提交线下展览");
      }
      if (result.code !== 0) {
        throw new Error(result.message || "保存失败");
      }

      toast.success(
        status === "draft"
          ? "草稿已保存"
          : status === "pending_review"
            ? "申请已提交，当前状态为待审核"
            : "展览已发布"
      );

      resetForm();
      setTab("mine");
      await loadMyList();
    } catch (error: any) {
      toast.error(error?.message || "保存失败");
    } finally {
      setSubmitting(false);
    }
  };

  const editItem = (item: OfflineExhibition) => {
    setEditingUuid(item.uuid);
    setForm(fromExhibition(item));
    setTab("apply");
  };

  const deleteItem = async (item: OfflineExhibition) => {
    if (!window.confirm(`确认删除「${item.title || "未命名展览"}」吗？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/home/exhibition/${item.uuid}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.code !== 0) {
        throw new Error(result.message || "删除失败");
      }

      toast.success("展览已删除");
      if (editingUuid === item.uuid) {
        resetForm();
      }
      await loadMyList();
    } catch (error: any) {
      toast.error(error?.message || "删除失败");
    }
  };

  return (
    <div className="flex w-full flex-col gap-6 pb-10 pt-4">
      <section className="relative overflow-hidden rounded-[32px] border border-[#cfded9] bg-[radial-gradient(circle_at_top_left,rgba(204,228,220,0.86),transparent_30%),radial-gradient(circle_at_90%_12%,rgba(255,248,235,0.88),transparent_26%),linear-gradient(135deg,rgba(250,252,251,0.98),rgba(237,245,242,0.97)_54%,rgba(233,239,237,0.96))] p-6 shadow-[0_24px_60px_rgba(27,45,40,0.08)] dark:border-[#31443e] dark:bg-[radial-gradient(circle_at_top_left,rgba(64,91,83,0.38),transparent_30%),radial-gradient(circle_at_90%_12%,rgba(88,72,43,0.22),transparent_26%),linear-gradient(135deg,rgba(17,24,22,0.98),rgba(21,31,28,0.97)_54%,rgba(16,22,20,0.96))]">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_center,rgba(151,182,171,0.22),transparent_56%)] dark:bg-[radial-gradient(circle_at_center,rgba(96,128,118,0.18),transparent_56%)]" />
        <div className="relative grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <Badge className="w-fit border-[#b8d1ca] bg-white/80 px-3 py-1 text-[#35554e] dark:border-[#456258] dark:bg-white/10 dark:text-[#d2e4dd]" variant="outline">
              个人中心 · 线下展览
            </Badge>
            <div className="space-y-3">
              <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-[#1f302c] dark:text-[#eef6f3]">
                提交线下展览申请并管理我的记录
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-[#5a6f69] dark:text-[#a2b5af]">
                这里是个人中心工作台。你可以提交新的线下展览申请、保存草稿、查看审核状态，并随时编辑自己的申请记录。
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-[24px] border border-white/80 bg-white/75 p-4 backdrop-blur dark:border-white/10 dark:bg-white/5">
              <div className="text-xs uppercase tracking-[0.24em] text-[#789089] dark:text-[#8ea7a0]">
                Mine
              </div>
              <div className="mt-2 text-3xl font-semibold text-[#223733] dark:text-[#edf5f2]">
                {myList.length}
              </div>
              <div className="mt-1 text-sm text-[#6a7f79] dark:text-[#9bb0aa]">我的申请总数</div>
            </div>
            <div className="rounded-[24px] border border-white/80 bg-white/75 p-4 backdrop-blur dark:border-white/10 dark:bg-white/5">
              <div className="text-xs uppercase tracking-[0.24em] text-[#789089] dark:text-[#8ea7a0]">
                Draft
              </div>
              <div className="mt-2 text-3xl font-semibold text-[#223733] dark:text-[#edf5f2]">
                {draftCount}
              </div>
              <div className="mt-1 text-sm text-[#6a7f79] dark:text-[#9bb0aa]">当前草稿</div>
            </div>
            <div className="rounded-[24px] border border-white/80 bg-white/75 p-4 backdrop-blur dark:border-white/10 dark:bg-white/5">
              <div className="text-xs uppercase tracking-[0.24em] text-[#789089] dark:text-[#8ea7a0]">
                Review
              </div>
              <div className="mt-2 text-3xl font-semibold text-[#223733] dark:text-[#edf5f2]">
                {pendingCount}
              </div>
              <div className="mt-1 text-sm text-[#6a7f79] dark:text-[#9bb0aa]">待审核申请</div>
            </div>
          </div>
        </div>
      </section>

      <Tabs value={tab} onValueChange={(value) => setTab(value as HubTab)}>
        <TabsList className="h-auto rounded-[18px] bg-[#edf3f0] p-1 dark:bg-[#18211f]">
          <TabsTrigger value="apply" className="rounded-[14px] px-5 py-2.5">
            提交申请
          </TabsTrigger>
          <TabsTrigger value="mine" className="rounded-[14px] px-5 py-2.5">
            我的申请
          </TabsTrigger>
        </TabsList>

        <TabsContent value="apply" className="mt-5">
          <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-[30px] border border-[#d7e2de] bg-white/92 p-5 shadow-[0_18px_42px_rgba(30,44,40,0.05)] dark:border-[#31443e] dark:bg-[#111917]/92">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-[#1f302c] dark:text-[#edf5f2]">
                    {editingUuid ? "编辑线下展览" : "新建线下展览申请"}
                  </h2>
                  <p className="mt-1 text-sm text-[#68807a] dark:text-[#9bb0aa]">
                    支持保存草稿和提交审核。只有管理员可以直接发布，地图只保留一个位置描述，展示时直接拉起高德导航。
                  </p>
                </div>
                {editingUuid ? (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    取消编辑
                  </Button>
                ) : null}
              </div>

              <div className="mt-6 grid gap-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="申请主体" required>
                    <select
                      value={form.applicant_role}
                      onChange={(event) =>
                        updateForm(
                          "applicant_role",
                          event.target.value as ExhibitionFormState["applicant_role"]
                        )
                      }
                      className="h-11 rounded-[14px] border border-[#d5e0dc] bg-white px-3 text-sm text-[#223733] outline-none dark:border-[#31443e] dark:bg-[#0e1513] dark:text-[#edf5f2]"
                    >
                      <option value="user">普通用户</option>
                      <option value="artisan">匠人 / 创作者</option>
                    </select>
                  </FormField>
                  <FormField label="门票类型" required>
                    <select
                      value={form.admission_type}
                      onChange={(event) =>
                        updateForm(
                          "admission_type",
                          event.target.value as ExhibitionFormState["admission_type"]
                        )
                      }
                      className="h-11 rounded-[14px] border border-[#d5e0dc] bg-white px-3 text-sm text-[#223733] outline-none dark:border-[#31443e] dark:bg-[#0e1513] dark:text-[#edf5f2]"
                    >
                      <option value="free">免费</option>
                      <option value="ticketed">收费票务</option>
                      <option value="reservation">预约制</option>
                      <option value="invite_only">仅限邀约</option>
                    </select>
                  </FormField>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="展览标题" required>
                    <Input value={form.title} onChange={(event) => updateForm("title", event.target.value)} />
                  </FormField>
                  <FormField label="副标题">
                    <Input
                      value={form.subtitle}
                      onChange={(event) => updateForm("subtitle", event.target.value)}
                    />
                  </FormField>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="主理人" required>
                    <Input
                      value={form.curator_name}
                      onChange={(event) => updateForm("curator_name", event.target.value)}
                    />
                  </FormField>
                  <FormField label="主理人头衔">
                    <Input
                      value={form.curator_title}
                      onChange={(event) => updateForm("curator_title", event.target.value)}
                    />
                  </FormField>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="主办方组织" required>
                    <Input
                      value={form.organizer_name}
                      onChange={(event) => updateForm("organizer_name", event.target.value)}
                    />
                  </FormField>
                  <FormField label="赞助方 / 冠名方">
                    <Input
                      value={form.sponsor_name}
                      onChange={(event) => updateForm("sponsor_name", event.target.value)}
                    />
                  </FormField>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="联合主办方" hint="每行一个或用逗号分隔">
                    <Textarea
                      value={form.co_organizers_text}
                      onChange={(event) => updateForm("co_organizers_text", event.target.value)}
                      rows={4}
                    />
                  </FormField>
                  <FormField label="支持机构 / 合作方" hint="每行一个或用逗号分隔">
                    <Textarea
                      value={form.supporting_organizations_text}
                      onChange={(event) =>
                        updateForm("supporting_organizations_text", event.target.value)
                      }
                      rows={4}
                    />
                  </FormField>
                </div>

                <FormField label="一句话摘要">
                  <Textarea
                    value={form.summary}
                    onChange={(event) => updateForm("summary", event.target.value)}
                    rows={3}
                  />
                </FormField>

                <FormField label="详细介绍" required>
                  <Textarea
                    value={form.description}
                    onChange={(event) => updateForm("description", event.target.value)}
                    rows={7}
                  />
                </FormField>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="联系人" required>
                    <Input
                      value={form.contact_name}
                      onChange={(event) => updateForm("contact_name", event.target.value)}
                    />
                  </FormField>
                  <FormField label="联系电话" hint="电话 / 微信 / 邮箱至少填写一种">
                    <Input
                      value={form.contact_phone}
                      onChange={(event) => updateForm("contact_phone", event.target.value)}
                    />
                  </FormField>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="微信号" hint="电话 / 微信 / 邮箱至少填写一种">
                    <Input
                      value={form.contact_wechat}
                      onChange={(event) => updateForm("contact_wechat", event.target.value)}
                    />
                  </FormField>
                  <FormField label="联系邮箱" hint="电话 / 微信 / 邮箱至少填写一种">
                    <Input
                      value={form.contact_email}
                      onChange={(event) => updateForm("contact_email", event.target.value)}
                    />
                  </FormField>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="场馆名称" required>
                    <Input
                      value={form.venue_name}
                      onChange={(event) => updateForm("venue_name", event.target.value)}
                    />
                  </FormField>
                  <FormField label="开放时段" hint="例如：周二至周日 10:00-18:00">
                    <Input
                      value={form.opening_hours}
                      onChange={(event) => updateForm("opening_hours", event.target.value)}
                    />
                  </FormField>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                  <FormField label="省">
                    <Input value={form.province} onChange={(event) => updateForm("province", event.target.value)} />
                  </FormField>
                  <FormField label="市">
                    <Input value={form.city} onChange={(event) => updateForm("city", event.target.value)} />
                  </FormField>
                  <FormField label="区 / 县">
                    <Input
                      value={form.district}
                      onChange={(event) => updateForm("district", event.target.value)}
                    />
                  </FormField>
                  <FormField label="街道">
                    <Input value={form.street} onChange={(event) => updateForm("street", event.target.value)} />
                  </FormField>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="详细地址" required>
                    <Input
                      value={form.address_detail}
                      onChange={(event) => updateForm("address_detail", event.target.value)}
                    />
                  </FormField>
                  <FormField label="地图位置" hint="用于高德打开和导航，可填完整地址或场馆位置描述" required>
                    <Input
                      value={form.formatted_address}
                      onChange={(event) => updateForm("formatted_address", event.target.value)}
                    />
                  </FormField>
                </div>

                <FormField label="地图备注" hint="例如：从地铁 A 口步行 300 米">
                  <Input
                    value={form.map_note}
                    onChange={(event) => updateForm("map_note", event.target.value)}
                  />
                </FormField>

                <div className="grid gap-4 md:grid-cols-3">
                  <FormField label="开始时间" required>
                    <Input
                      type="datetime-local"
                      value={form.start_at}
                      onChange={(event) => updateForm("start_at", event.target.value)}
                    />
                  </FormField>
                  <FormField label="结束时间" required>
                    <Input
                      type="datetime-local"
                      value={form.end_at}
                      onChange={(event) => updateForm("end_at", event.target.value)}
                    />
                  </FormField>
                  <FormField label="报名截止时间">
                    <Input
                      type="datetime-local"
                      value={form.apply_deadline}
                      onChange={(event) => updateForm("apply_deadline", event.target.value)}
                    />
                  </FormField>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <FormField label="票价">
                    <Input
                      type="number"
                      min="0"
                      value={form.admission_fee}
                      onChange={(event) => updateForm("admission_fee", event.target.value)}
                    />
                  </FormField>
                  <FormField label="人数容量">
                    <Input
                      type="number"
                      min="0"
                      value={form.capacity}
                      onChange={(event) => updateForm("capacity", event.target.value)}
                    />
                  </FormField>
                  <FormField label="展位数量">
                    <Input
                      type="number"
                      min="0"
                      value={form.booth_count}
                      onChange={(event) => updateForm("booth_count", event.target.value)}
                    />
                  </FormField>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="封面图">
                    <ImageUpload
                      value={form.cover_url}
                      onChange={(value) => updateForm("cover_url", value)}
                    />
                  </FormField>
                  <FormField label="海报图">
                    <ImageUpload
                      value={form.poster_url}
                      onChange={(value) => updateForm("poster_url", value)}
                    />
                  </FormField>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="图集 URL" hint="每行一个">
                    <Textarea
                      value={form.gallery_images_text}
                      onChange={(event) => updateForm("gallery_images_text", event.target.value)}
                      rows={5}
                    />
                  </FormField>
                  <FormField label="标签" hint="每行一个或用逗号分隔">
                    <Textarea
                      value={form.tags_text}
                      onChange={(event) => updateForm("tags_text", event.target.value)}
                      rows={5}
                    />
                  </FormField>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="艺术类别" hint="每行一个">
                    <Textarea
                      value={form.art_categories_text}
                      onChange={(event) => updateForm("art_categories_text", event.target.value)}
                      rows={4}
                    />
                  </FormField>
                  <FormField label="亮点卖点" hint="每行一个">
                    <Textarea
                      value={form.highlights_text}
                      onChange={(event) => updateForm("highlights_text", event.target.value)}
                      rows={4}
                    />
                  </FormField>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="交通指引" hint="每行一个">
                    <Textarea
                      value={form.transportation_text}
                      onChange={(event) => updateForm("transportation_text", event.target.value)}
                      rows={4}
                    />
                  </FormField>
                  <FormField label="现场设施" hint="每行一个">
                    <Textarea
                      value={form.facilities_text}
                      onChange={(event) => updateForm("facilities_text", event.target.value)}
                      rows={4}
                    />
                  </FormField>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="申请要求">
                    <Textarea
                      value={form.application_requirements}
                      onChange={(event) =>
                        updateForm("application_requirements", event.target.value)
                      }
                      rows={5}
                    />
                  </FormField>
                  <FormField label="提交材料" hint="每行一个">
                    <Textarea
                      value={form.submission_materials_text}
                      onChange={(event) =>
                        updateForm("submission_materials_text", event.target.value)
                      }
                      rows={5}
                    />
                  </FormField>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    label="日程 JSON"
                    hint='示例：[{"label":"开幕","start_at":"2026-05-01T10:00:00+08:00","note":"主理人导览"}]'
                  >
                    <Textarea
                      value={form.schedule_items_text}
                      onChange={(event) => updateForm("schedule_items_text", event.target.value)}
                      rows={6}
                    />
                  </FormField>
                  <FormField
                    label="外部链接 JSON"
                    hint='示例：[{"label":"购票链接","url":"https://example.com"}]'
                  >
                    <Textarea
                      value={form.external_links_text}
                      onChange={(event) => updateForm("external_links_text", event.target.value)}
                      rows={6}
                    />
                  </FormField>
                </div>

                <div className="flex flex-wrap gap-3 border-t border-[#e4ece8] pt-4">
                  <Button type="button" variant="outline" disabled={submitting} onClick={() => void submitForm("draft")}>
                    保存草稿
                  </Button>
                  <Button type="button" variant="outline" disabled={submitting} onClick={() => void submitForm("pending_review")}>
                    提交审核
                  </Button>
                  {userRole === "admin" ? (
                    <Button type="button" disabled={submitting} onClick={() => void submitForm("published")}>
                      直接发布
                    </Button>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="space-y-5">
              <div className="rounded-[30px] border border-[#d7e2de] bg-white/92 p-5 shadow-[0_18px_42px_rgba(30,44,40,0.05)] dark:border-[#31443e] dark:bg-[#111917]/92">
                <h3 className="text-lg font-semibold text-[#1f302c] dark:text-[#edf5f2]">地图位置</h3>
                <p className="mt-1 text-sm text-[#6b817b] dark:text-[#9bb0aa]">
                  不再存 POI、adcode 或经纬度，展示时直接用位置描述打开高德搜索与导航。
                </p>
                <div className="mt-4">
                  <OfflineExhibitionMapPanel
                    title={form.title}
                    venueName={form.venue_name}
                    locationText={form.formatted_address}
                    addressDetail={form.address_detail}
                    onResolve={(patch) => {
                      if (patch.province) updateForm("province", patch.province);
                      if (patch.city) updateForm("city", patch.city);
                      if (patch.district) updateForm("district", patch.district);
                      if (patch.street) updateForm("street", patch.street);
                      if (patch.address_detail) {
                        updateForm("address_detail", patch.address_detail);
                      }
                      if (patch.formatted_address) {
                        updateForm("formatted_address", patch.formatted_address);
                      }
                    }}
                  />
                </div>
              </div>

              <div className="rounded-[30px] border border-[#d7e2de] bg-white/92 p-5 shadow-[0_18px_42px_rgba(30,44,40,0.05)] dark:border-[#31443e] dark:bg-[#111917]/92">
                <h3 className="text-lg font-semibold text-[#1f302c] dark:text-[#edf5f2]">录入建议</h3>
                <div className="mt-4 space-y-3 text-sm leading-7 text-[#5f736d] dark:text-[#9bb0aa]">
                  <div>1. `主办方组织`、`联系人`、`详细地址`、`地图位置`、`开始/结束时间` 是发布和提交审核时的核心字段。</div>
                  <div>2. `地图位置` 建议填写用户可以直接搜索到的完整地址或场馆名，便于高德导航。</div>
                  <div>3. `日程 JSON` 和 `外部链接 JSON` 适合录入开幕式、工作坊、购票页、公众号等扩展信息。</div>
                </div>
              </div>
            </section>
          </div>
        </TabsContent>

        <TabsContent value="mine" className="mt-5">
          <section className="rounded-[30px] border border-[#d7e2de] bg-white/92 p-5 shadow-[0_18px_42px_rgba(30,44,40,0.05)] dark:border-[#31443e] dark:bg-[#111917]/92">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-[#1f302c] dark:text-[#edf5f2]">我的线下展览申请</h2>
                <p className="mt-1 text-sm text-[#68807a] dark:text-[#9bb0aa]">
                  可以继续编辑草稿、重新提交被驳回的申请，或者直接删除记录。
                </p>
              </div>
              <Button type="button" variant="outline" onClick={() => void loadMyList()}>
                刷新
              </Button>
            </div>

            {loadingMine ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-48 animate-pulse rounded-[24px] bg-[#eef3f1] dark:bg-[#18211f]"
                  />
                ))}
              </div>
            ) : authed === false ? (
              <div className="mt-5 flex min-h-[200px] items-center justify-center rounded-[24px] border border-dashed border-[#cfdbd6] bg-[#fafcfb] text-center text-sm text-[#66746f] dark:border-[#31443e] dark:bg-[#111917] dark:text-[#9bb0aa]">
                登录后可查看和管理自己的线下展览申请。
              </div>
            ) : myList.length === 0 ? (
              <div className="mt-5 flex min-h-[200px] items-center justify-center rounded-[24px] border border-dashed border-[#cfdbd6] bg-[#fafcfb] text-center text-sm text-[#66746f] dark:border-[#31443e] dark:bg-[#111917] dark:text-[#9bb0aa]">
                你还没有提交过线下展览申请。
              </div>
            ) : (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {myList.map((item) => (
                  <article
                    key={item.uuid}
                    className="rounded-[24px] border border-[#d8e3df] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,248,247,0.95))] p-5 dark:border-[#31443e] dark:bg-[linear-gradient(180deg,rgba(17,25,23,0.98),rgba(20,29,26,0.95))]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-[#213632] dark:text-[#edf5f2]">
                          {item.title || "未命名展览"}
                        </h3>
                        <div className="text-sm text-[#68807a] dark:text-[#9bb0aa]">
                          {item.organizer_name || "未填写主办方"}
                        </div>
                      </div>
                      <Badge className={statusTone(item.status)} variant="outline">
                        {statusLabel(item.status)}
                      </Badge>
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-[#536762] dark:text-[#b7c8c2]">
                      <div className="flex items-start gap-2">
                        <CalendarDays className="mt-0.5 h-4 w-4 text-[#79908a]" />
                        <span>{formatDisplayDate(item.start_at, item.end_at)}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 text-[#79908a]" />
                        <span>{item.formatted_address || item.address_detail || "未填写地址"}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock3 className="mt-0.5 h-4 w-4 text-[#79908a]" />
                        <span>{item.updated_at ? `最近更新 ${formatDisplayDate(item.updated_at)}` : "尚未更新时间"}</span>
                      </div>
                    </div>

                    {item.review_note ? (
                      <div className="mt-4 rounded-[18px] bg-[#fff7e8] p-3 text-sm text-[#946200] dark:bg-[#3a2d12] dark:text-[#f2cf7f]">
                        审核备注：{item.review_note}
                      </div>
                    ) : null}

                    <div className="mt-5 flex flex-wrap gap-3">
                      <Button type="button" variant="outline" onClick={() => editItem(item)}>
                        <Pencil className="h-4 w-4" />
                        编辑
                      </Button>
                      <a
                        href={buildMapUrl(item)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d0dbd6] px-4 text-sm font-medium text-[#27453d] transition hover:border-[#9db7b0] hover:bg-[#f4faf7] dark:border-[#31443e] dark:text-[#d7e3de] dark:hover:bg-[#18211f]"
                      >
                        <LocateFixed className="h-4 w-4" />
                        高德打开
                      </a>
                      <Button type="button" variant="outline" onClick={() => void deleteItem(item)}>
                        <Trash2 className="h-4 w-4" />
                        删除
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
