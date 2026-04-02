export type OfflineExhibitionApplicantRole = "user" | "artisan";

export type OfflineExhibitionStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "rejected"
  | "closed"
  | "deleted";

export type OfflineExhibitionAdmissionType =
  | "free"
  | "ticketed"
  | "reservation"
  | "invite_only";

export interface OfflineExhibitionOwner {
  uuid: string;
  nickname: string;
  avatar_url: string;
}

export interface OfflineExhibitionScheduleItem {
  label: string;
  start_at?: string;
  end_at?: string;
  note?: string;
}

export interface OfflineExhibitionExternalLink {
  label: string;
  url: string;
}

export interface OfflineExhibitionTicketType {
  uuid?: string;
  name: string;
  description?: string;
  price?: number;
  quantity?: number;
  sort_order?: number;
}

export interface OfflineExhibition {
  id?: number;
  uuid: string;
  user_uuid: string;
  locale?: string;
  applicant_role?: OfflineExhibitionApplicantRole;
  status?: OfflineExhibitionStatus;
  title: string;
  subtitle?: string;
  summary?: string;
  description: string;
  curator_name?: string;
  curator_title?: string;
  organizer_name?: string;
  co_organizers?: string[];
  sponsor_name?: string;
  supporting_organizations?: string[];
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
  start_at?: string;
  end_at?: string;
  apply_deadline?: string;
  opening_hours?: string;
  admission_type?: OfflineExhibitionAdmissionType;
  admission_fee?: number;
  capacity?: number;
  booth_count?: number;
  cover_url?: string;
  poster_url?: string;
  gallery_images?: string[];
  tags?: string[];
  art_categories?: string[];
  highlights?: string[];
  transportation?: string[];
  facilities?: string[];
  application_requirements?: string;
  submission_materials?: string[];
  schedule_items?: OfflineExhibitionScheduleItem[];
  external_links?: OfflineExhibitionExternalLink[];
  ticket_types?: OfflineExhibitionTicketType[];
  review_note?: string;
  created_at?: string;
  updated_at?: string;
  published_at?: string;
  approved_at?: string;
  rejected_at?: string;
  owner?: OfflineExhibitionOwner;
}
