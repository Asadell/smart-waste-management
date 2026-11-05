import { Link, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, CheckCircle2, ExternalLink, HelpCircle, Loader2, MapPin, Pencil, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ConfidenceBar } from "@/components/AiResultCard";
import { CategoryBadge, StatusBadge } from "@/components/Badges";
import { EmptyState, PhotoThumb } from "@/components/Common";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { MapView } from "@/components/map/Maps";
import { StatusTimeline } from "@/components/StatusTimeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useDeleteReport, useReport, useUpdateReportStatus } from "@/hooks/useReports";
import { CATEGORY_META, STATUS_LIST, STATUS_META } from "@/lib/constants";
import { formatDateTime } from "@/lib/formatters";
import { ApiError } from "@/services/http";
import type { Report, ReportStatus } from "@/types";

function AiCard({ r }: { r: Report }) {
  return (
    <Card className="rounded-xl shadow-soft">
      <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Sparkles className="size-4 text-primary" /> Hasil Deteksi AI</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Tebakan AI</p>
            {r.ai_label ? (
              <>
                <p className="mt-1 font-semibold">{CATEGORY_META[r.ai_label].label} <span className="text-primary">{Math.round((r.ai_confidence ?? 0) * 100)}%</span></p>
                <ConfidenceBar value={r.ai_confidence ?? 0} className="mt-1.5" barClass={CATEGORY_META[r.ai_label].bar} />
              </>
            ) : <p className="mt-1 text-sm italic text-muted-foreground">Tidak tersedia</p>}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Kategori Final</p>
            <div className="mt-1"><CategoryBadge category={r.category} /></div>
          </div>
        </div>
        {!r.ai_label ? (
          <p className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground"><HelpCircle className="size-4" /> Layanan AI tidak tersedia saat laporan dibuat</p>
        ) : r.ai_match ? (
          <p className="flex items-center gap-2 rounded-lg bg-success-soft px-3 py-2 text-sm font-medium text-success"><CheckCircle2 className="size-4" /> Sesuai dengan kategori final{r.ai_uncertain && " (AI sempat ragu)"}</p>
        ) : (
          <p className="flex items-center gap-2 rounded-lg bg-pending-soft px-3 py-2 text-sm font-medium text-pending"><AlertTriangle className="size-4" /> {r.ai_uncertain ? "AI tidak yakin, kategori dipilih pelapor" : "Kategori diubah oleh pelapor"}</p>
        )}
      </CardContent>
    </Card>
  );
}

function UpdateStatusCard({ r }: { r: Report }) {
  const [status, setStatus] = useState<ReportStatus>(r.status);
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);
  const m = useUpdateReportStatus(r.id);
  useEffect(() => setStatus(r.status), [r.status]);

  const submit = () => {
    setNoteError(null);
    if (status === r.status && !note.trim()) return toast.info("Pilih status baru atau isi catatan");
    if (status === "rejected" && !note.trim()) return setNoteError("Catatan wajib diisi saat menolak laporan");
    m.mutate({ status, note: note.trim() }, {
      onSuccess: () => setNote(""),
      onError: (e) => { if (e instanceof ApiError && e.fieldErrors.note) setNoteError(e.fieldErrors.note); },
    });
  };
  return (
    <Card className="rounded-xl border-primary/30 shadow-soft">
      <CardHeader><CardTitle className="text-base">Update Status</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label>Status baru</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as ReportStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{STATUS_LIST.map((s) => <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="note">Catatan {status === "rejected" && <span className="text-destructive">*</span>}</Label>
          <Textarea id="note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Contoh: Petugas dijadwalkan besok pagi" aria-invalid={!!noteError} />
          {noteError && <p className="text-xs text-destructive">{noteError}</p>}
          <p className="text-xs text-muted-foreground">Catatan terlihat oleh pelapor dan tersimpan di riwayat status.</p>
        </div>
        <Button className="w-full" disabled={m.isPending} onClick={submit}>
          {m.isPending && <Loader2 className="animate-spin" />} Simpan
        </Button>
      </CardContent>
    </Card>
  );
}

export function ReportDetailPage({ id }: { id: number }) {
  const { data: r, isLoading, isError, error } = useReport(id);
  const navigate = useNavigate();
  const del = useDeleteReport();
  const [lightbox, setLightbox] = useState(false);
  const [confirm, setConfirm] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <div className="grid gap-6 lg:grid-cols-3"><Skeleton className="h-[420px] lg:col-span-2" /><Skeleton className="h-[420px]" /></div>
      </div>
    );
  }
  if (isError || !r) {
    const forbidden = error instanceof ApiError && error.status === 403;
    return (
      <EmptyState
        title={forbidden ? "Kamu tidak punya akses ke laporan ini" : "Laporan tidak ditemukan"}
        description={forbidden ? "Laporan ini milik pengguna lain." : "Laporan mungkin sudah dihapus."}
        action={<Button asChild><Link to="/reports">Kembali ke daftar</Link></Button>}
      />
    );
  }

  // Rights computed by the backend policy for the current user.
  const canEdit = !!r.can?.update;
  const canDelete = !!r.can?.delete;
  const canUpdateStatus = !!r.can?.update_status;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Button variant="outline" size="icon" asChild className="shrink-0"><Link to="/reports" aria-label="Kembali"><ArrowLeft /></Link></Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-bold tracking-tight sm:text-2xl">{r.title}</h1><StatusBadge status={r.status} /></div>
            <p className="mt-1 text-sm text-muted-foreground">
              Dibuat {formatDateTime(r.created_at)}{canUpdateStatus && r.user && <> · oleh <span className="font-medium text-foreground">{r.user.name}</span></>}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && <Button variant="outline" asChild><Link to="/reports/$id/edit" params={{ id: String(r.id) }}><Pencil /> Edit</Link></Button>}
          {canDelete && <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setConfirm(true)}><Trash2 /> Hapus</Button>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="overflow-hidden rounded-xl shadow-soft">
            {r.photo_url ? (
              <button onClick={() => setLightbox(true)} className="block w-full focus-visible:outline-none" aria-label="Perbesar foto">
                <img src={r.photo_url} alt={r.title} className="aspect-[16/10] w-full object-cover transition-transform duration-300 hover:scale-[1.02]" />
              </button>
            ) : <PhotoThumb src={null} className="aspect-[16/10] w-full rounded-none" />}
            <CardContent className="pt-5">
              <div className="mb-3"><CategoryBadge category={r.category} /></div>
              {r.description ? <p className="whitespace-pre-line text-sm leading-relaxed">{r.description}</p> : <p className="text-sm italic text-muted-foreground">Tanpa deskripsi</p>}
              {r.admin_note && <div className="mt-4 rounded-lg border-l-4 border-primary bg-secondary px-4 py-3 text-sm"><span className="font-semibold">Catatan admin:</span> {r.admin_note}</div>}
            </CardContent>
          </Card>
          <Card className="overflow-hidden rounded-xl shadow-soft">
            <div className="h-72"><MapView lat={r.latitude} lng={r.longitude} color={STATUS_META[r.status].hex} /></div>
            <CardContent className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-start gap-2 text-sm"><MapPin className="mt-0.5 size-4 shrink-0 text-primary" />{r.address ?? `${r.latitude.toFixed(5)}, ${r.longitude.toFixed(5)}`}</p>
              <Button variant="outline" size="sm" asChild>
                <a href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`} target="_blank" rel="noreferrer"><ExternalLink /> Buka di Google Maps</a>
              </Button>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <AiCard r={r} />
          {canUpdateStatus && <UpdateStatusCard r={r} />}
          <Card className="rounded-xl shadow-soft">
            <CardHeader><CardTitle className="text-base">Riwayat Status</CardTitle></CardHeader>
            <CardContent><StatusTimeline logs={r.status_logs ?? []} /></CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={lightbox} onOpenChange={setLightbox}>
        <DialogContent className="max-w-4xl overflow-hidden p-0">
          <DialogTitle className="sr-only">{r.title}</DialogTitle>
          {r.photo_url && <img src={r.photo_url} alt={r.title} className="w-full" />}
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={confirm} onOpenChange={setConfirm} title="Hapus laporan ini?" description="Tindakan ini tidak dapat dibatalkan."
        onConfirm={() => del.mutate(r.id, { onSuccess: () => navigate({ to: "/reports" }) })} />
    </div>
  );
}
