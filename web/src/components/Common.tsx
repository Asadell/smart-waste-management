import type { LucideIcon } from "lucide-react";
import { ImageOff, Inbox, Recycle } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className={cn("grid size-9 place-items-center rounded-xl", light ? "bg-brand-foreground/15 text-brand-foreground" : "bg-primary text-primary-foreground")}>
        <Recycle className="size-5" />
      </div>
      <div className="leading-tight">
        <div className={cn("text-lg font-extrabold tracking-tight", light && "text-brand-foreground")}>SWM</div>
        <div className={cn("text-[10px] font-medium uppercase tracking-wider", light ? "text-brand-foreground/70" : "text-muted-foreground")}>Smart Waste</div>
      </div>
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

const tones = {
  default: "bg-secondary text-secondary-foreground",
  pending: "bg-pending-soft text-pending",
  progress: "bg-progress-soft text-progress",
  success: "bg-success-soft text-success",
  danger: "bg-danger-soft text-danger",
} as const;

export function StatCard({ label, value, icon: Icon, tone = "default", hint, loading }: {
  label: string; value: ReactNode; icon: LucideIcon; tone?: keyof typeof tones; hint?: string; loading?: boolean;
}) {
  return (
    <Card className="rounded-xl p-5 shadow-soft transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {loading ? <Skeleton className="mt-2 h-8 w-16" /> : <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>}
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={cn("grid size-10 shrink-0 place-items-center rounded-xl", tones[tone])}>
          <Icon className="size-5" />
        </div>
      </div>
    </Card>
  );
}

export function EmptyState({ title, description, action, icon: Icon = Inbox }: { title: string; description?: string; action?: ReactNode; icon?: LucideIcon }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="relative mb-4">
        <div className="absolute inset-0 scale-150 rounded-full bg-secondary blur-xl" />
        <div className="relative grid size-16 place-items-center rounded-2xl bg-secondary text-primary">
          <Icon className="size-8" />
        </div>
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Report photo with a placeholder when the URL is missing or fails to load. */
export function PhotoThumb({ src, alt = "", className }: { src: string | null | undefined; alt?: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={cn("grid place-items-center rounded-lg bg-muted text-muted-foreground", className)} aria-label={alt || undefined}>
        <ImageOff className="size-1/3 min-h-4 min-w-4" />
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={cn("rounded-lg object-cover", className)} />;
}
