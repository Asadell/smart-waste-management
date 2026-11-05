import { ArrowRight } from "lucide-react";
import { StatusBadge } from "@/components/Badges";
import { STATUS_META } from "@/lib/constants";
import { formatDateTime, formatRelative } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { ReportStatusLog } from "@/types";

export function StatusTimeline({ logs }: { logs: ReportStatusLog[] }) {
  const sorted = [...logs].reverse();
  return (
    <ol className="relative space-y-5">
      {sorted.map((l, i) => (
        <li key={l.id} className="relative pl-7">
          {i < sorted.length - 1 && <span className="absolute left-[7px] top-5 h-[calc(100%+0.5rem)] w-px bg-border" />}
          <span className={cn("absolute left-0 top-1 size-[15px] rounded-full border-4 border-card ring-1 ring-border", STATUS_META[l.to_status].dot)} />
          <div className="flex flex-wrap items-center gap-1.5">
            {l.from_status && <><StatusBadge status={l.from_status} /><ArrowRight className="size-3 text-muted-foreground" /></>}
            <StatusBadge status={l.to_status} />
          </div>
          {l.note && <p className="mt-1.5 text-sm">{l.note}</p>}
          <p className="mt-1 text-xs text-muted-foreground" title={formatDateTime(l.created_at)}>
            {l.changed_by && <>oleh <span className="font-medium text-foreground">{l.changed_by.name}</span> · </>}{formatRelative(l.created_at)}
          </p>
        </li>
      ))}
    </ol>
  );
}
