import { Sparkles } from "lucide-react";
import { CATEGORY_META, ROLE_LABEL, STATUS_META } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ReportStatus, Role, WasteCategory } from "@/types";

const base = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap";

export function StatusBadge({ status, className }: { status: ReportStatus; className?: string }) {
  const m = STATUS_META[status];
  return (
    <span className={cn(base, m.badge, className)}>
      <span className={cn("size-1.5 rounded-full", m.dot)} />
      {m.label}
    </span>
  );
}

export function CategoryBadge({ category, className }: { category: WasteCategory; className?: string }) {
  const m = CATEGORY_META[category];
  const Icon = m.icon;
  return (
    <span className={cn(base, m.badge, className)}>
      <Icon className="size-3" />
      {m.label}
    </span>
  );
}

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span className={cn(base, role === "admin" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
      {ROLE_LABEL[role]}
    </span>
  );
}

export function AiInline({ label, confidence, uncertain }: { label: WasteCategory | null; confidence: number | null; uncertain?: boolean }) {
  // null label = the AI service was unavailable when the report was created.
  if (!label) return <span className="text-xs text-muted-foreground italic">Tidak tersedia</span>;
  return (
    <span className="inline-flex items-center gap-1 text-xs" title={uncertain ? "AI tidak yakin" : undefined}>
      <Sparkles className="size-3 text-primary" />
      <span className="font-medium">{CATEGORY_META[label].label}</span>
      <span className="text-muted-foreground">{Math.round((confidence ?? 0) * 100)}%</span>
      {uncertain && <span className="text-pending">(ragu)</span>}
    </span>
  );
}
