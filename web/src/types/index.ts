/** Shapes follow the Laravel API resources (backend/app/Http/Resources). */

export type Role = "admin" | "user";
export type ReportStatus = "pending" | "in_progress" | "completed" | "rejected";
export type WasteCategory = "organic" | "plastic" | "paper";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  reports_count?: number;
}

export interface ReportStatusLog {
  id: number;
  changed_by: Pick<User, "id" | "name"> | null;
  from_status: ReportStatus | null;
  to_status: ReportStatus;
  to_status_label: string;
  note: string | null;
  created_at: string;
}

/** Permissions computed by the backend policy for the current user. */
export interface ReportAbilities {
  update: boolean;
  delete: boolean;
  update_status: boolean;
}

export interface Report {
  id: number;
  user?: Pick<User, "id" | "name" | "email">;
  title: string;
  description: string | null;
  photo_url: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  category: WasteCategory;
  ai_label: WasteCategory | null;
  ai_confidence: number | null;
  ai_uncertain: boolean;
  ai_match: boolean | null;
  status: ReportStatus;
  status_label: string;
  admin_note: string | null;
  can: ReportAbilities | null;
  created_at: string;
  updated_at: string;
  status_logs?: ReportStatusLog[];
}

export interface AiAccuracy {
  total_predicted: number;
  matched: number;
  /** 0..1, null when no report has an AI prediction yet. */
  rate: number | null;
}

export interface DashboardStats {
  total_reports: number;
  by_status: Record<ReportStatus, number>;
  by_category: Record<WasteCategory, number>;
  trend: { date: string; total: number }[];
  recent_reports: Report[];
  /** Admin only. */
  total_users?: number;
  active_users?: number;
  ai_accuracy?: AiAccuracy;
}

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PredictionResult {
  /** null when the photo is not organic/paper/plastic waste (recognized = false). */
  label: WasteCategory | null;
  confidence: number;
  probabilities: Partial<Record<WasteCategory | "other", number>>;
  uncertain: boolean;
  recognized: boolean;
}

/** Report filters as kept in the URL (/reports?status=...). */
export interface ReportQueryParams {
  search?: string;
  status?: ReportStatus;
  category?: WasteCategory;
  from?: string;
  to?: string;
  sort?: "latest" | "oldest";
  page?: number;
  per_page?: number;
}

export interface UserQueryParams {
  search?: string;
  role?: Role;
  active?: "active" | "inactive";
  page?: number;
  per_page?: number;
}
