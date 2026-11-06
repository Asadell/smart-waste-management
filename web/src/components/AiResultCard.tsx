import { AlertTriangle, CloudOff, ImageOff, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CATEGORY_LIST, CATEGORY_META } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { PredictionResult } from "@/types";

export function ConfidenceBar({ value, className, barClass }: { value: number; className?: string; barClass?: string }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div className={cn("h-full rounded-full bg-primary transition-all duration-700", barClass)} style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  );
}

export function AiResultCard({ loading, result, error, onRetry }: { loading: boolean; result: PredictionResult | null; error?: string | null; onRetry: () => void }) {
  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-primary/40 bg-secondary/60 p-4">
        <Loader2 className="size-5 animate-spin text-primary" />
        <div>
          <p className="text-sm font-semibold">Mendeteksi jenis sampah...</p>
          <p className="text-xs text-muted-foreground">Model AI sedang menganalisis foto</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
        <div className="flex items-start gap-3">
          <CloudOff className="mt-0.5 size-5 shrink-0 text-destructive" />
          <p className="flex-1 text-sm font-medium text-destructive">{error}</p>
          <Button type="button" variant="outline" size="sm" onClick={onRetry}><RefreshCw /> Coba lagi</Button>
        </div>
      </div>
    );
  }
  if (!result) return null;
  if (!result.label) {
    return (
      <div className="rounded-xl border border-pending/30 bg-pending-soft p-4">
        <div className="flex items-start gap-3">
          <ImageOff className="mt-0.5 size-5 shrink-0 text-pending" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-pending">AI tidak mengenali foto ini sebagai sampah</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Foto tidak terlihat seperti sampah organik, kertas, atau plastik. Pastikan sampahnya terlihat jelas di foto, atau pilih kategori secara manual.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onRetry}><RefreshCw /> Deteksi ulang</Button>
        </div>
      </div>
    );
  }
  if (result.uncertain) {
    return (
      <div className="rounded-xl border border-pending/30 bg-pending-soft p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-pending" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-pending">AI tidak yakin, silakan pilih kategori secara manual</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Tebakan terdekat: {CATEGORY_META[result.label].label} ({Math.round(result.confidence * 100)}%). Mungkin foto kurang jelas atau bukan sampah. Coba foto lebih dekat dengan pencahayaan cukup.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onRetry}><RefreshCw /> Deteksi ulang</Button>
        </div>
      </div>
    );
  }
  const m = CATEGORY_META[result.label];
  const Icon = m.icon;
  return (
    <div className="rounded-xl border bg-card p-4 shadow-soft">
      <div className="flex items-start gap-3">
        <div className={cn("grid size-11 shrink-0 place-items-center rounded-xl", m.badge)}><Icon className="size-5" /></div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground"><Sparkles className="size-3 text-primary" /> Hasil deteksi AI</p>
          <p className="text-lg font-bold">{m.label} <span className="text-primary">{Math.round(result.confidence * 100)}%</span></p>
          <ConfidenceBar value={result.confidence} className="mt-1.5" barClass={m.bar} />
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onRetry}><RefreshCw /> <span className="hidden sm:inline">Deteksi ulang</span></Button>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 border-t pt-3">
        {CATEGORY_LIST.map((c) => (
          <div key={c}>
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">{CATEGORY_META[c].label}</span><span className="font-semibold tabular-nums">{Math.round((result.probabilities[c] ?? 0) * 100)}%</span></div>
            <ConfidenceBar value={result.probabilities[c] ?? 0} className="mt-1 h-1.5" barClass={CATEGORY_META[c].bar} />
          </div>
        ))}
      </div>
    </div>
  );
}
