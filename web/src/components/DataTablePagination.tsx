import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Paginated } from "@/types";

export function DataTablePagination({ meta, onPage, onPerPage }: {
  meta: Paginated<unknown>["meta"]; onPage: (p: number) => void; onPerPage: (n: number) => void;
}) {
  const from = meta.total === 0 ? 0 : (meta.current_page - 1) * meta.per_page + 1;
  const to = Math.min(meta.current_page * meta.per_page, meta.total);
  return (
    <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground">Menampilkan {from}-{to} dari {meta.total}</p>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Per halaman</span>
          <Select value={String(meta.per_page)} onValueChange={(v) => onPerPage(Number(v))}>
            <SelectTrigger className="h-8 w-[72px]"><SelectValue /></SelectTrigger>
            <SelectContent>{[10, 20, 50].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="size-8" aria-label="Sebelumnya" disabled={meta.current_page <= 1} onClick={() => onPage(meta.current_page - 1)}><ChevronLeft /></Button>
          <span className="px-2 tabular-nums">{meta.current_page} / {meta.last_page}</span>
          <Button variant="outline" size="icon" className="size-8" aria-label="Berikutnya" disabled={meta.current_page >= meta.last_page} onClick={() => onPage(meta.current_page + 1)}><ChevronRight /></Button>
        </div>
      </div>
    </div>
  );
}
