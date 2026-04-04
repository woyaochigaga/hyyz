import { getUuid } from "@/lib/hash";
import { getIsoTimestr } from "@/lib/time";
import { getSupabaseClient } from "@/models/db";
import {
  PUBLIC_USER_PROFILE_SELECT,
  getUsersByUuids,
} from "@/models/user";
import { unstable_cache } from "next/cache";
import type {
  OfflineExhibition,
  OfflineExhibitionAdmissionType,
  OfflineExhibitionApplicantRole,
  OfflineExhibitionExternalLink,
  OfflineExhibitionOwner,
  OfflineExhibitionScheduleItem,
  OfflineExhibitionStatus,
  OfflineExhibitionTicketType,
} from "@/types/offline-exhibition";

type OfflineExhibitionRow = {
  id?: number;
  uuid: string;
  user_uuid: string;
  locale?: string;
  applicant_role?: OfflineExhibitionApplicantRole;
  status?: OfflineExhibitionStatus;
  title?: string;
  subtitle?: string;
  summary?: string;
  description?: string;
  curator_name?: string;
  curator_title?: string;
  organizer_name?: string;
  co_organizers?: unknown;
  sponsor_name?: string;
  supporting_organizations?: unknown;
  contact_name?: string;
  contact_phone?: string;
  contact_wechat?: string;
  contact_email?: string;
  venue_name?: string;
  province?: string;
  city?: string;
  district?: string;
  street?: string;
  address_detail?: string;
  formatted_address?: string;
  map_note?: string;
  start_at?: string | null;
  end_at?: string | null;
  apply_deadline?: string | null;
  opening_hours?: string;
  admission_type?: OfflineExhibitionAdmissionType;
  admission_fee?: number | string | null;
  capacity?: number | string | null;
  booth_count?: number | string | null;
  cover_url?: string;
  poster_url?: string;
  gallery_images?: unknown;
  tags?: unknown;
  art_categories?: unknown;
  highlights?: unknown;
  transportation?: unknown;
  facilities?: unknown;
  application_requirements?: string;
  submission_materials?: unknown;
  schedule_items?: unknown;
  external_links?: unknown;
  review_note?: string;
  created_at?: string;
  updated_at?: string;
  published_at?: string | null;
  approved_at?: string | null;
  rejected_at?: string | null;
};

type OfflineExhibitionTicketTypeRow = {
  id?: number;
  uuid?: string;
  exhibition_uuid?: string;
  name?: string;
  description?: string;
  price?: number | string | null;
  quantity?: number | string | null;
  sort_order?: number | string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const OFFLINE_EXHIBITION_FULL_SELECT = "*";

const OFFLINE_EXHIBITION_LIST_SELECT = [
  "id",
  "uuid",
  "user_uuid",
  "locale",
  "applicant_role",
  "status",
  "title",
  "subtitle",
  "summary",
  "description",
  "curator_name",
  "organizer_name",
  "venue_name",
  "city",
  "address_detail",
  "formatted_address",
  "start_at",
  "end_at",
  "admission_type",
  "cover_url",
  "poster_url",
  "gallery_images",
  "tags",
  "created_at",
  "updated_at",
  "published_at",
].join(", ");

function normalizeString(input: unknown, maxLength?: number) {
  const value = String(input || "").trim().replace(/\s+/g, " ");
  if (!maxLength) return value;
  return value.slice(0, maxLength);
}

function normalizeMultilineText(input: unknown, maxLength?: number) {
  const value = String(input || "").trim();
  if (!maxLength) return value;
  return value.slice(0, maxLength);
}

function normalizeStringArray(input: unknown, max = 20) {
  if (Array.isArray(input)) {
    return Array.from(
      new Set(
        input
          .map((item) => normalizeString(item, 120))
          .filter(Boolean)
          .slice(0, max)
      )
    );
  }

  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) {
        return normalizeStringArray(parsed, max);
      }
    } catch {
      return Array.from(
        new Set(
          input
            .split(/[\n,，]/)
            .map((item) => normalizeString(item, 120))
            .filter(Boolean)
            .slice(0, max)
        )
      );
    }
  }

  return [] as string[];
}

function buildSearchTerms(input: unknown, max = 5) {
  const raw = normalizeString(input, 80)
    .replace(/[%(),，（）]/g, " ")
    .trim();

  if (!raw) return [] as string[];

  return Array.from(
    new Set(
      raw
        .split(/\s+/)
        .map((item) => normalizeString(item, 40))
        .filter((item) => item.length > 0)
        .slice(0, max)
    )
  );
}

function normalizeNumber(input: unknown, opts?: { min?: number; max?: number }) {
  if (input === null || input === undefined || input === "") return null;
  const value =
    typeof input === "number" ? input : Number.parseFloat(String(input).trim());

  if (!Number.isFinite(value)) return null;

  let next = value;
  if (typeof opts?.min === "number" && next < opts.min) next = opts.min;
  if (typeof opts?.max === "number" && next > opts.max) next = opts.max;
  return next;
}

function normalizeTimestr(input: unknown) {
  const value = String(input || "").trim();
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString();
}

function normalizeRecordArray(input: unknown) {
  if (Array.isArray(input)) {
    return input.filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null && !Array.isArray(item)
    );
  }

  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) {
        return normalizeRecordArray(parsed);
      }
    } catch {
      return [];
    }
  }

  return [] as Record<string, unknown>[];
}

function normalizeScheduleItems(input: unknown): OfflineExhibitionScheduleItem[] {
  const result: OfflineExhibitionScheduleItem[] = [];

  for (const item of normalizeRecordArray(input)) {
    const label = normalizeString(item.label, 80);
    if (!label) continue;

    result.push({
      label,
      start_at: normalizeTimestr(item.start_at) || undefined,
      end_at: normalizeTimestr(item.end_at) || undefined,
      note: normalizeString(item.note, 240) || undefined,
    });
  }

  return result.slice(0, 20);
}

function normalizeExternalLinks(input: unknown): OfflineExhibitionExternalLink[] {
  const result: OfflineExhibitionExternalLink[] = [];

  for (const item of normalizeRecordArray(input)) {
    const label = normalizeString(item.label, 40);
    const url = normalizeString(item.url, 500);
    if (!label || !url) continue;

    result.push({
      label,
      url,
    });
  }

  return result.slice(0, 10);
}

function normalizeTicketTypes(input: unknown): OfflineExhibitionTicketType[] {
  const result: OfflineExhibitionTicketType[] = [];

  for (const item of normalizeRecordArray(input)) {
    const name = normalizeString(item.name, 120);
    if (!name) continue;

    result.push({
      uuid: normalizeString(item.uuid, 255) || undefined,
      name,
      description: normalizeString(item.description, 255) || undefined,
      price: normalizeNumber(item.price, { min: 0, max: 999999 }) || 0,
      quantity: normalizeNumber(item.quantity, { min: 0, max: 1000000 }) || 0,
      sort_order: normalizeNumber(item.sort_order, { min: 0, max: 9999 }) || 0,
    });
  }

  return result.slice(0, 20);
}

function toOfflineExhibitionTicketType(
  row: OfflineExhibitionTicketTypeRow
): OfflineExhibitionTicketType {
  return {
    uuid: row.uuid || "",
    name: row.name || "",
    description: row.description || "",
    price: normalizeNumber(row.price, { min: 0 }) || 0,
    quantity: normalizeNumber(row.quantity, { min: 0 }) || 0,
    sort_order: normalizeNumber(row.sort_order, { min: 0 }) || 0,
  };
}

function buildFormattedAddress(input: Partial<OfflineExhibition>) {
  const full = normalizeString(input.formatted_address, 500);
  if (full) return full;

  return [
    normalizeString(input.province, 100),
    normalizeString(input.city, 100),
    normalizeString(input.district, 100),
    normalizeString(input.street, 255),
    normalizeString(input.address_detail, 255),
  ]
    .filter(Boolean)
    .join("");
}

function buildFallbackTicketTypes(
  exhibition: OfflineExhibition
): OfflineExhibitionTicketType[] {
  const admissionType = exhibition.admission_type || "free";
  const price = normalizeNumber(exhibition.admission_fee, { min: 0 }) || 0;
  const quantity = normalizeNumber(exhibition.capacity, { min: 0 }) || 0;

  if (!admissionType && !price && !quantity) {
    return [];
  }

  let name = "标准票";
  let description = "";

  switch (admissionType) {
    case "free":
      name = "免费票";
      break;
    case "reservation":
      name = "预约票";
      description = "需提前预约";
      break;
    case "invite_only":
      name = "邀约票";
      description = "仅限邀约";
      break;
    case "ticketed":
    default:
      name = "标准票";
      break;
  }

  return [
    {
      uuid: `${exhibition.uuid}-default-ticket`,
      name,
      description: description || undefined,
      price,
      quantity,
      sort_order: 0,
    },
  ];
}

function toOfflineExhibition(row: OfflineExhibitionRow): OfflineExhibition {
  return {
    id: row.id,
    uuid: row.uuid,
    user_uuid: row.user_uuid,
    locale: row.locale || "",
    applicant_role: row.applicant_role || "user",
    status: row.status || "draft",
    title: row.title || "",
    subtitle: row.subtitle || "",
    summary: row.summary || "",
    description: row.description || "",
    curator_name: row.curator_name || "",
    curator_title: row.curator_title || "",
    organizer_name: row.organizer_name || "",
    co_organizers: normalizeStringArray(row.co_organizers),
    sponsor_name: row.sponsor_name || "",
    supporting_organizations: normalizeStringArray(row.supporting_organizations),
    contact_name: row.contact_name || "",
    contact_phone: row.contact_phone || "",
    contact_wechat: row.contact_wechat || "",
    contact_email: row.contact_email || "",
    venue_name: row.venue_name || "",
    province: row.province || "",
    city: row.city || "",
    district: row.district || "",
    street: row.street || "",
    address_detail: row.address_detail || "",
    formatted_address: row.formatted_address || "",
    map_note: row.map_note || "",
    start_at: row.start_at || "",
    end_at: row.end_at || "",
    apply_deadline: row.apply_deadline || "",
    opening_hours: row.opening_hours || "",
    admission_type: row.admission_type || "free",
    admission_fee: normalizeNumber(row.admission_fee, { min: 0 }) || 0,
    capacity: normalizeNumber(row.capacity, { min: 0 }) || 0,
    booth_count: normalizeNumber(row.booth_count, { min: 0 }) || 0,
    cover_url: row.cover_url || "",
    poster_url: row.poster_url || "",
    gallery_images: normalizeStringArray(row.gallery_images, 12),
    tags: normalizeStringArray(row.tags, 12),
    art_categories: normalizeStringArray(row.art_categories, 12),
    highlights: normalizeStringArray(row.highlights, 12),
    transportation: normalizeStringArray(row.transportation, 12),
    facilities: normalizeStringArray(row.facilities, 12),
    application_requirements: row.application_requirements || "",
    submission_materials: normalizeStringArray(row.submission_materials, 12),
    schedule_items: normalizeScheduleItems(row.schedule_items),
    external_links: normalizeExternalLinks(row.external_links),
    ticket_types: [],
    review_note: row.review_note || "",
    created_at: row.created_at || "",
    updated_at: row.updated_at || "",
    published_at: row.published_at || "",
    approved_at: row.approved_at || "",
    rejected_at: row.rejected_at || "",
  };
}

async function buildOwners(userUuids: string[]) {
  const users = await getUsersByUuids(
    Array.from(new Set(userUuids.filter(Boolean))),
    PUBLIC_USER_PROFILE_SELECT
  );
  const map = new Map<string, OfflineExhibitionOwner>();

  for (const user of users) {
    if (!user.uuid) continue;
    map.set(user.uuid, {
      uuid: user.uuid,
      nickname: user.nickname || "未命名用户",
      avatar_url: user.avatar_url || "",
    });
  }

  return map;
}

async function attachOwners(exhibitions: OfflineExhibition[]) {
  if (exhibitions.length === 0) return exhibitions;

  const ownerMap = await buildOwners(exhibitions.map((item) => item.user_uuid));

  return exhibitions.map((item) => ({
    ...item,
    owner:
      ownerMap.get(item.user_uuid) || {
        uuid: item.user_uuid,
        nickname: "未命名用户",
        avatar_url: "",
      },
  }));
}

async function attachTicketTypes(exhibitions: OfflineExhibition[]) {
  if (exhibitions.length === 0) return exhibitions;

  const exhibitionUuids = Array.from(
    new Set(exhibitions.map((item) => item.uuid).filter(Boolean))
  );
  if (exhibitionUuids.length === 0) return exhibitions;

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("offline_exhibition_ticket_types")
    .select("*")
    .in("exhibition_uuid", exhibitionUuids)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !data) {
    return exhibitions.map((item) => ({
      ...item,
      ticket_types: buildFallbackTicketTypes(item),
    }));
  }

  const ticketTypeMap = new Map<string, OfflineExhibitionTicketType[]>();

  for (const row of data as OfflineExhibitionTicketTypeRow[]) {
    const exhibitionUuid = normalizeString(row.exhibition_uuid, 255);
    if (!exhibitionUuid) continue;
    const current = ticketTypeMap.get(exhibitionUuid) || [];
    current.push(toOfflineExhibitionTicketType(row));
    ticketTypeMap.set(exhibitionUuid, current);
  }

  return exhibitions.map((item) => ({
    ...item,
    ticket_types:
      ticketTypeMap.get(item.uuid)?.filter((ticketType) => ticketType.name) ||
      buildFallbackTicketTypes(item),
  }));
}

async function replaceOfflineExhibitionTicketTypes(
  exhibitionUuid: string,
  ticketTypes: OfflineExhibitionTicketType[]
) {
  const supabase = getSupabaseClient();
  const { error: deleteError } = await supabase
    .from("offline_exhibition_ticket_types")
    .delete()
    .eq("exhibition_uuid", exhibitionUuid);

  if (deleteError) throw deleteError;

  if (ticketTypes.length === 0) {
    return;
  }

  const now = getIsoTimestr();
  const rows = ticketTypes.map((item, index) => ({
    uuid: item.uuid || getUuid(),
    exhibition_uuid: exhibitionUuid,
    name: item.name,
    description: item.description || "",
    price: normalizeNumber(item.price, { min: 0, max: 999999 }) || 0,
    quantity: normalizeNumber(item.quantity, { min: 0, max: 1000000 }) || 0,
    sort_order: normalizeNumber(item.sort_order, { min: 0, max: 9999 }) ?? index,
    created_at: now,
    updated_at: now,
  }));

  const { error: insertError } = await supabase
    .from("offline_exhibition_ticket_types")
    .insert(rows);

  if (insertError) throw insertError;
}

export function validateOfflineExhibitionPayload(input: Partial<OfflineExhibition>) {
  const applicant_role: OfflineExhibitionApplicantRole =
    input.applicant_role === "artisan" ? "artisan" : "user";
  const status: OfflineExhibitionStatus =
    input.status === "pending_review" ||
    input.status === "published" ||
    input.status === "rejected" ||
    input.status === "closed" ||
    input.status === "deleted"
      ? input.status
      : "draft";
  const admission_type: OfflineExhibitionAdmissionType =
    input.admission_type === "ticketed" ||
    input.admission_type === "reservation" ||
    input.admission_type === "invite_only"
      ? input.admission_type
      : "free";

  const title = normalizeString(input.title, 120);
  const subtitle = normalizeString(input.subtitle, 160);
  const summary = normalizeMultilineText(input.summary, 300);
  const description = normalizeMultilineText(input.description, 5000);
  const organizer_name = normalizeString(input.organizer_name, 160);
  const curator_name = normalizeString(input.curator_name, 120);
  const curator_title = normalizeString(input.curator_title, 120);
  const contact_name = normalizeString(input.contact_name, 80);
  const contact_phone = normalizeString(input.contact_phone, 50);
  const contact_wechat = normalizeString(input.contact_wechat, 80);
  const contact_email = normalizeString(input.contact_email, 160);
  const venue_name = normalizeString(input.venue_name, 160);
  const province = normalizeString(input.province, 100);
  const city = normalizeString(input.city, 100);
  const district = normalizeString(input.district, 100);
  const street = normalizeString(input.street, 255);
  const address_detail = normalizeString(input.address_detail, 255);
  const formatted_address = buildFormattedAddress(input);
  const start_at = normalizeTimestr(input.start_at);
  const end_at = normalizeTimestr(input.end_at);
  const apply_deadline = normalizeTimestr(input.apply_deadline);
  const opening_hours = normalizeString(input.opening_hours, 255);
  const cover_url = normalizeString(input.cover_url, 500);
  const poster_url = normalizeString(input.poster_url, 500);

  const gallery_images = normalizeStringArray(input.gallery_images, 12);
  const tags = normalizeStringArray(input.tags, 12);
  const art_categories = normalizeStringArray(input.art_categories, 12);
  const highlights = normalizeStringArray(input.highlights, 12);
  const transportation = normalizeStringArray(input.transportation, 12);
  const facilities = normalizeStringArray(input.facilities, 12);
  const co_organizers = normalizeStringArray(input.co_organizers, 12);
  const supporting_organizations = normalizeStringArray(
    input.supporting_organizations,
    12
  );
  const submission_materials = normalizeStringArray(input.submission_materials, 12);
  const schedule_items = normalizeScheduleItems(input.schedule_items);
  const external_links = normalizeExternalLinks(input.external_links);
  const ticket_types = normalizeTicketTypes(input.ticket_types);
  const admission_fee = normalizeNumber(input.admission_fee, {
    min: 0,
    max: 999999,
  });
  const capacity = normalizeNumber(input.capacity, { min: 0, max: 1000000 });
  const booth_count = normalizeNumber(input.booth_count, { min: 0, max: 100000 });
  const review_note = normalizeMultilineText(input.review_note, 1000);
  const application_requirements = normalizeMultilineText(
    input.application_requirements,
    2000
  );

  if (status !== "draft") {
    if (!title) {
      throw new Error("title is required");
    }
    if (!description && !summary) {
      throw new Error("description is required");
    }
    if (!organizer_name) {
      throw new Error("organizer_name is required");
    }
    if (!contact_name && !contact_phone && !contact_email && !contact_wechat) {
      throw new Error("contact info is required");
    }
    if (!venue_name) {
      throw new Error("venue_name is required");
    }
    if (!formatted_address) {
      throw new Error("address is required");
    }
    if (!start_at || !end_at) {
      throw new Error("start_at and end_at are required");
    }
  }

  if (start_at && end_at && new Date(start_at).getTime() > new Date(end_at).getTime()) {
    throw new Error("start_at must be before end_at");
  }

  return {
    locale: normalizeString(input.locale, 50),
    applicant_role,
    status,
    title,
    subtitle,
    summary,
    description,
    curator_name,
    curator_title,
    organizer_name,
    co_organizers,
    sponsor_name: normalizeString(input.sponsor_name, 160),
    supporting_organizations,
    contact_name,
    contact_phone,
    contact_wechat,
    contact_email,
    venue_name,
    province,
    city,
    district,
    street,
    address_detail,
    formatted_address,
    map_note: normalizeString(input.map_note, 255),
    start_at,
    end_at,
    apply_deadline,
    opening_hours,
    admission_type,
    admission_fee: admission_fee || 0,
    capacity: capacity || 0,
    booth_count: booth_count || 0,
    cover_url,
    poster_url,
    gallery_images,
    tags,
    art_categories,
    highlights,
    transportation,
    facilities,
    application_requirements,
    submission_materials,
    schedule_items,
    external_links,
    ticket_types,
    review_note,
  };
}

export async function createOfflineExhibition(
  exhibition: Omit<OfflineExhibition, "id" | "owner">
) {
  const supabase = getSupabaseClient();
  const now = getIsoTimestr();
  const payload = validateOfflineExhibitionPayload(exhibition);
  const publishedNow = payload.status === "published" ? now : null;
  const rejectedNow = payload.status === "rejected" ? now : null;

  const { error } = await supabase.from("offline_exhibitions").insert({
    uuid: exhibition.uuid,
    user_uuid: exhibition.user_uuid,
    locale: payload.locale || "",
    applicant_role: payload.applicant_role,
    status: payload.status,
    title: payload.title,
    subtitle: payload.subtitle,
    summary: payload.summary,
    description: payload.description,
    curator_name: payload.curator_name,
    curator_title: payload.curator_title,
    organizer_name: payload.organizer_name,
    co_organizers: payload.co_organizers,
    sponsor_name: payload.sponsor_name,
    supporting_organizations: payload.supporting_organizations,
    contact_name: payload.contact_name,
    contact_phone: payload.contact_phone,
    contact_wechat: payload.contact_wechat,
    contact_email: payload.contact_email,
    venue_name: payload.venue_name,
    province: payload.province,
    city: payload.city,
    district: payload.district,
    street: payload.street,
    address_detail: payload.address_detail,
    formatted_address: payload.formatted_address,
    map_note: payload.map_note,
    start_at: payload.start_at || null,
    end_at: payload.end_at || null,
    apply_deadline: payload.apply_deadline || null,
    opening_hours: payload.opening_hours,
    admission_type: payload.admission_type,
    admission_fee: payload.admission_fee,
    capacity: payload.capacity,
    booth_count: payload.booth_count,
    cover_url: payload.cover_url,
    poster_url: payload.poster_url,
    gallery_images: payload.gallery_images,
    tags: payload.tags,
    art_categories: payload.art_categories,
    highlights: payload.highlights,
    transportation: payload.transportation,
    facilities: payload.facilities,
    application_requirements: payload.application_requirements,
    submission_materials: payload.submission_materials,
    schedule_items: payload.schedule_items,
    external_links: payload.external_links,
    review_note: payload.review_note,
    created_at: now,
    updated_at: now,
    published_at: publishedNow,
    approved_at: publishedNow,
    rejected_at: rejectedNow,
  });

  if (error) throw error;

  await replaceOfflineExhibitionTicketTypes(exhibition.uuid, payload.ticket_types);

  return findOfflineExhibitionByUuid(exhibition.uuid, exhibition.user_uuid);
}

export async function updateOfflineExhibition(
  uuid: string,
  user_uuid: string,
  patch: Partial<OfflineExhibition>
) {
  const supabase = getSupabaseClient();
  const payload = validateOfflineExhibitionPayload(patch);
  const nextPayload: Record<string, unknown> = {
    updated_at: getIsoTimestr(),
  };

  for (const [key, value] of Object.entries(payload)) {
    if (
      key === "start_at" ||
      key === "end_at" ||
      key === "apply_deadline"
    ) {
      nextPayload[key] = value || null;
      continue;
    }
    nextPayload[key] = value;
  }

  if (payload.status === "published") {
    nextPayload.published_at = getIsoTimestr();
    nextPayload.approved_at = getIsoTimestr();
    nextPayload.rejected_at = null;
  } else if (payload.status === "rejected") {
    nextPayload.rejected_at = getIsoTimestr();
  }

  const { error } = await supabase
    .from("offline_exhibitions")
    .update(nextPayload)
    .eq("uuid", uuid)
    .eq("user_uuid", user_uuid);

  if (error) throw error;

  await replaceOfflineExhibitionTicketTypes(uuid, payload.ticket_types);

  return findOfflineExhibitionByUuid(uuid, user_uuid);
}

export async function softDeleteOfflineExhibition(uuid: string, user_uuid: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("offline_exhibitions")
    .update({
      status: "deleted",
      updated_at: getIsoTimestr(),
    })
    .eq("uuid", uuid)
    .eq("user_uuid", user_uuid);

  if (error) throw error;
}

export async function findOfflineExhibitionRowByUuid(uuid: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("offline_exhibitions")
    .select("*")
    .eq("uuid", uuid)
    .limit(1)
    .single();

  if (error || !data) return undefined;
  return toOfflineExhibition(data as OfflineExhibitionRow);
}

export async function findOfflineExhibitionByUuid(
  uuid: string,
  currentUserUuid?: string
) {
  const exhibition = await findOfflineExhibitionRowByUuid(uuid);
  if (!exhibition) return undefined;
  const withTicketTypes = await attachTicketTypes([exhibition]);
  const [result] = await attachOwners(withTicketTypes);
  if (
    result.status !== "published" &&
    result.user_uuid !== currentUserUuid
  ) {
    return undefined;
  }
  return result;
}

export async function listOfflineExhibitions(params?: {
  currentUserUuid?: string;
  locale?: string;
  user_uuid?: string;
  includeDraft?: boolean;
  includeDeleted?: boolean;
  status?: OfflineExhibitionStatus;
  city?: string;
  q?: string;
  limit?: number;
  summaryOnly?: boolean;
}) {
  const searchFields = [
    "title",
    "subtitle",
    "summary",
    "description",
    "organizer_name",
    "curator_name",
    "sponsor_name",
    "venue_name",
    "province",
    "city",
    "district",
    "street",
    "address_detail",
    "formatted_address",
    "map_note",
  ];
  const supabase = getSupabaseClient();
  let query = supabase
    .from("offline_exhibitions")
    .select(
      params?.summaryOnly
        ? OFFLINE_EXHIBITION_LIST_SELECT
        : OFFLINE_EXHIBITION_FULL_SELECT
    )
    .order("start_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (params?.user_uuid) {
    query = query.eq("user_uuid", params.user_uuid);
  }

  if (params?.locale) {
    query = query.eq("locale", params.locale);
  }

  if (params?.city) {
    query = query.eq("city", params.city);
  }

  if (params?.status) {
    query = query.eq("status", params.status);
  } else if (!params?.includeDraft) {
    query = query.eq("status", "published");
  }

  if (!params?.includeDeleted) {
    query = query.neq("status", "deleted");
  }

  const searchTerms = buildSearchTerms(params?.q);
  for (const term of searchTerms) {
    query = query.or(
      searchFields
        .map((field) => `${field}.ilike.%${term}%`)
        .join(",")
    );
  }

  if (typeof params?.limit === "number" && params.limit > 0) {
    query = query.limit(params.limit);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  const exhibitions = (data as unknown as OfflineExhibitionRow[]).map(
    toOfflineExhibition
  );

  if (params?.summaryOnly) {
    return attachOwners(exhibitions);
  }

  const exhibitionsWithTickets = await attachTicketTypes(exhibitions);

  return attachOwners(exhibitionsWithTickets);
}

export const listPublicOfflineExhibitionsCached = unstable_cache(
  async (locale: string, limit: number = 18) =>
    listOfflineExhibitions({
      locale,
      limit,
      summaryOnly: true,
    }),
  ["public-offline-exhibitions"],
  {
    revalidate: 60,
  }
);

/** 管理后台：拉取 offline_exhibitions 全表（所有状态） */
export async function listOfflineExhibitionsForAdmin() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("offline_exhibitions")
    .select("*")
    .order("start_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const exhibitions = await attachTicketTypes(
    (data as OfflineExhibitionRow[]).map(toOfflineExhibition)
  );

  return attachOwners(exhibitions);
}
