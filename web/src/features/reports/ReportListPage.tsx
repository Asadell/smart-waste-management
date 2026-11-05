import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { CalendarIcon, Eye, FilePlus2, Filter, MoreHorizontal, Pencil, RotateCcw, Search, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useEffect, useState } from "react";
import { AiInline, CategoryBadge, StatusBadge } from "@/components/Badges";
import { EmptyState, PageHeader, PhotoThumb } from "@/components/Common";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DataTablePagination } from "@/components/DataTablePagination";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { useDeleteReport, useReports } from "@/hooks/useReports";
import { CATEGORY_LIST, CATEGORY_META, STATUS_LIST, STATUS_META } from "@/lib/constants";
import { formatDateTime, formatRelative } from "@/lib/formatters";
import type { Report } from "@/types";

const ALL = "all";

export function ReportListPage() {
  const search = useSearch({ from: "/_authenticated/reports/" });
  const navigate = useNavigate({ from: "/reports/" });
  const { isAdmin } = useAuth();
  const [q, setQ] = useState(search.search ?? "");
  const [toDelete, setToDelete] = useState<Report | null>(null);
  const del = useDeleteReport();

  const set = (patch: Partial<typeof search>) =>
    navigate({ search: (prev) => ({ ...prev, page: undefined, ...patch }), replace: true });

  useEffect(() => {
    const t = setTimeout(() => { if ((search.search ?? "") !== q) set({ search: q || undefined }); }, 350);
    return () => clearTimeout(t);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scoping (own reports vs all) is done by the API based on the token's role.
  const { data, isLoading, isFetching } = useReports(search);
  const hasFilter = !!(search.search || search.status || search.category || search.from || search.to || search.sort);

  const filters = (
    <>
      <Select value={search.status ?? ALL} onValueChange={(v) => set({ status: v === ALL ? undefined : (v as never) })}>
        <SelectTrigger className="w-full lg:w-[150px]" aria-label="Filter status"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Semua status</SelectItem>
          {STATUS_LIST.map((s) => <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={search.category ?? ALL} onValueChange={(v) => set({ category: v === ALL ? undefined : (v as never) })}>
        <SelectTrigger className="w-full lg:w-[150px]" aria-label="Filter kategori"><SelectValue placeholder="Kategori" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Semua kategori</SelectItem>
          {CATEGORY_LIST.map((c) => <SelectItem key={c} value={c}>{CATEGORY_META[c].label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start font-normal lg:w-[220px]">
            <CalendarIcon />
            {search.from ? (
              <span className="truncate">{format(new Date(search.from), "d MMM", { locale: localeId })} - {search.to ? format(new Date(search.to), "d MMM yy", { locale: localeId }) : "…"}</span>
            ) : <span className="text-muted-foreground">Rentang tanggal</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            locale={localeId}
            numberOfMonths={1}
            selected={{ from: search.from ? new Date(search.from) : undefined, to: search.to ? new Date(search.to) : undefined }}
            onSelect={(r) => set({ from: r?.from ? format(r.from, "yyyy-MM-dd") : undefined, to: r?.to ? format(r.to, "yyyy-MM-dd") : undefined })}
          />
        </PopoverContent>
      </Popover>
      <Select value={search.sort ?? "latest"} onValueChange={(v) => set({ sort: v === "latest" ? undefined : (v as "oldest") })}>
        <SelectTrigger className="w-full lg:w-[130px]" aria-label="Urutkan"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="latest">Terbaru</SelectItem><SelectItem value="oldest">Terlama</SelectItem></SelectContent>
      </Select>
      {hasFilter && (
        <Button variant="ghost" onClick={() => { setQ(""); navigate({ search: {}, replace: true }); }}><RotateCcw /> Reset filter</Button>
      )}
    </>
  );

  // Edit/delete rights come from the backend policy (owner while pending, or admin).
  const actions = (r: Report) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-8" aria-label="Aksi"><MoreHorizontal /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild><Link to="/reports/$id" params={{ id: String(r.id) }}><Eye /> Lihat</Link></DropdownMenuItem>
        {r.can?.update && <DropdownMenuItem asChild><Link to="/reports/$id/edit" params={{ id: String(r.id) }}><Pencil /> Edit</Link></DropdownMenuItem>}
        {r.can?.delete && <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setToDelete(r)}><Trash2 /> Hapus</DropdownMenuItem>}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div>
      <PageHeader
        title={isAdmin ? "Laporan" : "Laporan Saya"}
        description={isAdmin ? "Kelola seluruh laporan sampah dari warga." : "Pantau status laporan yang kamu kirim."}
        actions={<Button asChild><Link to="/reports/new"><FilePlus2 /> Buat Laporan</Link></Button>}
      />

      <Card className="overflow-hidden rounded-xl shadow-soft">
        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:flex-wrap lg:items-center">
          <div className="relative flex-1 lg:min-w-[220px]">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari judul, deskripsi, atau alamat..." className="pl-9" aria-label="Cari laporan" />
          </div>
          <div className="hidden gap-2 lg:flex lg:flex-wrap">{filters}</div>
          <Sheet>
            <SheetTrigger asChild><Button variant="outline" className="lg:hidden"><Filter /> Filter {hasFilter && <span className="size-2 rounded-full bg-primary" />}</Button></SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl">
              <SheetHeader><SheetTitle>Filter laporan</SheetTitle></SheetHeader>
              <div className="grid gap-3 p-4">{filters}</div>
            </SheetContent>
          </Sheet>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : !data?.data.length ? (
          <EmptyState title="Tidak ada laporan" description={hasFilter ? "Coba ubah atau reset filter pencarian." : "Belum ada laporan. Yuk buat laporan pertamamu!"}
            action={hasFilter ? <Button variant="outline" onClick={() => { setQ(""); navigate({ search: {} }); }}>Reset filter</Button> : <Button asChild><Link to="/reports/new">Buat Laporan</Link></Button>} />
        ) : (
          <div className={isFetching ? "opacity-60 transition-opacity" : "transition-opacity"}>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[72px] pl-4">Foto</TableHead>
                    <TableHead>Judul</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Hasil AI</TableHead>
                    <TableHead>Status</TableHead>
                    {isAdmin && <TableHead>Pelapor</TableHead>}
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="w-[56px]"><span className="sr-only">Aksi</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="pl-4"><PhotoThumb src={r.photo_url} className="size-12" /></TableCell>
                      <TableCell className="max-w-[300px]">
                        <Link to="/reports/$id" params={{ id: String(r.id) }} className="line-clamp-1 font-semibold hover:text-primary">{r.title}</Link>
                        <p className="line-clamp-1 text-xs text-muted-foreground">{r.address}</p>
                      </TableCell>
                      <TableCell><CategoryBadge category={r.category} /></TableCell>
                      <TableCell><AiInline label={r.ai_label} confidence={r.ai_confidence} uncertain={r.ai_uncertain} /></TableCell>
                      <TableCell><StatusBadge status={r.status} /></TableCell>
                      {isAdmin && <TableCell className="text-sm">{r.user?.name ?? "-"}</TableCell>}
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground" title={formatDateTime(r.created_at)}>{formatRelative(r.created_at)}</TableCell>
                      <TableCell>{actions(r)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <ul className="divide-y md:hidden">
              {data.data.map((r) => (
                <li key={r.id} className="flex gap-3 p-4">
                  <Link to="/reports/$id" params={{ id: String(r.id) }} className="shrink-0"><PhotoThumb src={r.photo_url} className="size-20" /></Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link to="/reports/$id" params={{ id: String(r.id) }} className="line-clamp-2 text-sm font-semibold">{r.title}</Link>
                      {actions(r)}
                    </div>
                    <p className="line-clamp-1 text-xs text-muted-foreground">{r.address}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5"><StatusBadge status={r.status} /><CategoryBadge category={r.category} /></div>
                    <p className="mt-1.5 text-xs text-muted-foreground">{isAdmin && r.user && `${r.user.name} · `}{formatRelative(r.created_at)}</p>
                  </div>
                </li>
              ))}
            </ul>
            <DataTablePagination
              meta={data.meta}
              onPage={(p) => navigate({ search: (prev) => ({ ...prev, page: p }) })}
              onPerPage={(n) => set({ per_page: n })}
            />
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Hapus laporan?"
        description={`Laporan "${toDelete?.title}" akan dihapus.`}
        onConfirm={() => { if (toDelete) del.mutate(toDelete.id); setToDelete(null); }}
      />
    </div>
  );
}
