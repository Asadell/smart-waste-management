import { useMemo, useState } from "react";
import { ReportsMap } from "@/components/map/Maps";
import { Checkbox } from "@/components/ui/checkbox";
import { useAllReports } from "@/hooks/useReports";
import { CATEGORY_LIST, CATEGORY_META, STATUS_LIST, STATUS_META } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ReportStatus, WasteCategory } from "@/types";

export function ReportMapPage() {
  const { data } = useAllReports();
  const [statuses, setStatuses] = useState<ReportStatus[]>(STATUS_LIST);
  const [cats, setCats] = useState<WasteCategory[]>(CATEGORY_LIST);
  const filtered = useMemo(() => (data ?? []).filter((r) => statuses.includes(r.status) && cats.includes(r.category)), [data, statuses, cats]);
  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <div className="relative -mx-4 -my-6 h-[calc(100vh-4rem)] sm:-mx-6 lg:-mx-8">
      {data && <ReportsMap key={filtered.length} reports={filtered} />}
      <div className="absolute right-3 top-3 z-[500] w-56 rounded-xl border bg-card/95 p-4 shadow-soft backdrop-blur sm:right-4 sm:top-4">
        <p className="text-sm font-bold">Peta Laporan</p>
        <p className="mb-3 text-xs text-muted-foreground">{filtered.length} titik ditampilkan</p>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</p>
        <div className="space-y-2">
          {STATUS_LIST.map((s) => (
            <label key={s} className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox checked={statuses.includes(s)} onCheckedChange={() => setStatuses((a) => toggle(a, s))} />
              <span className={cn("size-2.5 rounded-full", STATUS_META[s].dot)} />{STATUS_META[s].label}
            </label>
          ))}
        </div>
        <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Kategori</p>
        <div className="space-y-2">
          {CATEGORY_LIST.map((c) => {
            const Icon = CATEGORY_META[c].icon;
            return (
              <label key={c} className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox checked={cats.includes(c)} onCheckedChange={() => setCats((a) => toggle(a, c))} />
                <Icon className={cn("size-3.5", CATEGORY_META[c].text)} />{CATEGORY_META[c].label}
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
