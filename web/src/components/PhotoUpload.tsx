import { ImagePlus, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ACCEPTED_PHOTO_TYPES, MAX_PHOTO_SIZE } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function PhotoUpload({ preview, onSelect, onClear }: { preview: string | null; onSelect: (f: File) => void; onClear: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const handle = (f?: File) => {
    if (!f) return;
    if (!ACCEPTED_PHOTO_TYPES.includes(f.type)) return toast.error("Format foto harus JPG, PNG, atau WEBP");
    if (f.size > MAX_PHOTO_SIZE) return toast.error("Ukuran foto maksimal 10MB");
    onSelect(f);
  };

  if (preview) {
    return (
      <div className="relative overflow-hidden rounded-xl border bg-muted">
        <img src={preview} alt="Pratinjau foto sampah" className="aspect-[4/3] w-full object-cover sm:aspect-[16/9]" />
        <div className="absolute right-3 top-3 flex gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={() => ref.current?.click()}>Ganti foto</Button>
          <Button type="button" size="icon" variant="secondary" className="size-8" aria-label="Hapus foto" onClick={onClear}><X /></Button>
        </div>
        <input ref={ref} type="file" accept={ACCEPTED_PHOTO_TYPES.join(",")} className="hidden" onChange={(e) => handle(e.target.files?.[0])} />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => ref.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files?.[0]); }}
      className={cn(
        "flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        drag ? "border-primary bg-secondary" : "border-input hover:border-primary/60 hover:bg-secondary/50",
      )}
    >
      <div className="grid size-14 place-items-center rounded-2xl bg-secondary text-primary"><ImagePlus className="size-7" /></div>
      <div>
        <p className="font-semibold">Seret & lepas foto di sini, atau klik untuk memilih</p>
        <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, WEBP · maks. 10MB</p>
      </div>
      <input ref={ref} type="file" accept={ACCEPTED_PHOTO_TYPES.join(",")} className="hidden" onChange={(e) => handle(e.target.files?.[0])} />
    </button>
  );
}
