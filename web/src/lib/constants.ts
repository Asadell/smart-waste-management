import { FileText, Leaf, Milk, type LucideIcon } from "lucide-react";
import type { ReportStatus, WasteCategory } from "@/types";

export const STATUS_LIST: ReportStatus[] = ["pending", "in_progress", "completed", "rejected"];
export const CATEGORY_LIST: WasteCategory[] = ["organic", "plastic", "paper"];

export const STATUS_META: Record<
  ReportStatus,
  { label: string; badge: string; dot: string; chart: string; hex: string }
> = {
  pending: { label: "Pending", badge: "bg-pending-soft text-pending", dot: "bg-pending", chart: "var(--pending)", hex: "#d97706" },
  in_progress: { label: "In Progress", badge: "bg-progress-soft text-progress", dot: "bg-progress", chart: "var(--progress)", hex: "#2563eb" },
  completed: { label: "Completed", badge: "bg-success-soft text-success", dot: "bg-success", chart: "var(--success)", hex: "#16a34a" },
  rejected: { label: "Rejected", badge: "bg-danger-soft text-danger", dot: "bg-danger", chart: "var(--danger)", hex: "#dc2626" },
};

export const CATEGORY_META: Record<
  WasteCategory,
  { label: string; icon: LucideIcon; badge: string; text: string; bar: string; chart: string; hex: string }
> = {
  organic: { label: "Organik", icon: Leaf, badge: "bg-organic-soft text-organic", text: "text-organic", bar: "bg-organic", chart: "var(--organic)", hex: "#16a34a" },
  plastic: { label: "Plastik", icon: Milk, badge: "bg-plastic-soft text-plastic", text: "text-plastic", bar: "bg-plastic", chart: "var(--plastic)", hex: "#0891b2" },
  paper: { label: "Kertas", icon: FileText, badge: "bg-paper-soft text-paper", text: "text-paper", bar: "bg-paper", chart: "var(--paper)", hex: "#b45309" },
};

export const ROLE_LABEL = { admin: "Admin", user: "Pengguna" } as const;
/** Surabaya city center (demo data is seeded around Surabaya). */
export const DEFAULT_CENTER: [number, number] = [-7.2575, 112.7521];
export const MAX_PHOTO_SIZE = 10 * 1024 * 1024;
export const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
