import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { Info, Loader2, LocateFixed, MapPin, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AiResultCard } from "@/components/AiResultCard";
import { MapPicker } from "@/components/map/Maps";
import { FieldError } from "@/components/PasswordInput";
import { PhotoUpload } from "@/components/PhotoUpload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePredictWaste, useSaveReport } from "@/hooks/useReports";
import { CATEGORY_LIST, CATEGORY_META, DEFAULT_CENTER } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { reverseGeocode } from "@/services/geocodingService";
import { ApiError, errorMessage } from "@/services/http";
import type { PredictionResult, Report } from "@/types";

/** Mirrors backend/app/Http/Requests/Report/StoreReportRequest.php. */
const schema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Judul minimal 5 karakter")
    .max(150, "Judul maksimal 150 karakter"),
  description: z.string().max(2000, "Deskripsi maksimal 2000 karakter"),
  address: z.string().max(255, "Alamat maksimal 255 karakter"),
  category: z.enum(["organic", "plastic", "paper"], {
    errorMap: () => ({ message: "Pilih kategori sampah" }),
  }),
  latitude: z.number(),
  longitude: z.number(),
});
type Values = z.infer<typeof schema>;

export function ReportForm({ report }: { report?: Report }) {
  const navigate = useNavigate();
  const save = useSaveReport();
  const predict = usePredictWaste();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(report?.photo_url ?? null);
  const [ai, setAi] = useState<PredictionResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [locationTouched, setLocationTouched] = useState(!!report);
  const geoAbort = useRef<AbortController | null>(null);
  const geoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: report
      ? {
          title: report.title,
          description: report.description ?? "",
          address: report.address ?? "",
          category: report.category,
          latitude: report.latitude,
          longitude: report.longitude,
        }
      : {
          title: "",
          description: "",
          address: "",
          latitude: DEFAULT_CENTER[0],
          longitude: DEFAULT_CENTER[1],
        },
  });
  const lat = watch("latitude");
  const lng = watch("longitude");
  const desc = watch("description") ?? "";

  useEffect(
    () => () => {
      geoAbort.current?.abort();
      if (geoTimer.current) clearTimeout(geoTimer.current);
    },
    [],
  );

  // ---- photo + AI detection ----

  const runPredict = async (f: File) => {
    setAi(null);
    setAiError(null);
    try {
      const res = await predict.mutateAsync(f);
      setAi(res);
      // Prefill the category with the AI guess; when the AI is unsure the user must choose.
      if (!res.uncertain) setValue("category", res.label, { shouldValidate: true });
      else setValue("category", undefined as never);
    } catch (e) {
      setAiError(
        e instanceof ApiError && e.status === 503
          ? "Layanan AI sedang tidak tersedia. Pilih kategori secara manual, laporan tetap bisa dikirim."
          : errorMessage(e),
      );
    }
  };

  const onPhoto = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    void runPredict(f);
  };

  // ---- location ----

  /** Moves the pin and fills the address from OpenStreetMap (debounced, Nominatim allows 1 req/s). */
  const setPos = (la: number, ln: number) => {
    setValue("latitude", la);
    setValue("longitude", ln);
    setLocationTouched(true);
    if (geoTimer.current) clearTimeout(geoTimer.current);
    geoTimer.current = setTimeout(async () => {
      geoAbort.current?.abort();
      const ctrl = new AbortController();
      geoAbort.current = ctrl;
      setGeocoding(true);
      const address = await reverseGeocode(la, ln, ctrl.signal);
      if (ctrl.signal.aborted) return;
      setGeocoding(false);
      if (address) setValue("address", address.slice(0, 255), { shouldValidate: true });
    }, 700);
  };

  const locate = () => {
    if (!navigator.geolocation)
      return toast.error("Browser tidak mendukung geolokasi. Pilih titik di peta.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPos(p.coords.latitude, p.coords.longitude);
        setLocating(false);
        toast.success("Lokasi ditemukan");
      },
      (err) => {
        setLocating(false);
        toast.error(
          err.code === err.PERMISSION_DENIED
            ? "Izin lokasi ditolak. Izinkan akses lokasi di browser atau pilih titik di peta."
            : "Gagal mendapatkan lokasi. Pilih titik di peta.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // ---- submit ----

  const onSubmit = async (v: Values) => {
    if (!preview) return toast.error("Foto sampah wajib diunggah");
    if (!locationTouched)
      return toast.error("Tentukan lokasi sampah: klik peta atau gunakan lokasi saya");

    const fd = new FormData();
    fd.append("title", v.title.trim());
    fd.append("description", v.description.trim());
    fd.append("address", v.address.trim());
    fd.append("category", v.category);
    fd.append("latitude", String(v.latitude));
    fd.append("longitude", String(v.longitude));
    if (file) fd.append("photo", file);
    // Send the AI guess only for a newly detected photo. Without it the backend asks the ML service itself.
    if (file && ai) {
      fd.append("ai_label", ai.label);
      fd.append("ai_confidence", String(ai.confidence));
      fd.append("ai_uncertain", ai.uncertain ? "1" : "0");
    }

    try {
      const r = await save.mutateAsync({ id: report?.id, data: fd });
      navigate({ to: "/reports/$id", params: { id: String(r.id) } });
    } catch (e) {
      if (e instanceof ApiError && Object.keys(e.fieldErrors).length) {
        Object.entries(e.fieldErrors).forEach(([k, msg]) => {
          if (k in schema.shape) setError(k as keyof Values, { message: msg });
          else toast.error(msg);
        });
        toast.error("Periksa kembali isian formulir");
      } else {
        // Network or server error: the form keeps its values so the user can retry.
        toast.error(errorMessage(e));
      }
    }
  };

  const aiFilled = ai && !ai.uncertain;

  return (
    <form
      onSubmit={handleSubmit(onSubmit, () => toast.error("Periksa kembali isian formulir"))}
      className="space-y-6"
      noValidate
    >
      <Card className="rounded-xl shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="grid size-6 place-items-center rounded-full bg-primary text-xs text-primary-foreground">
              1
            </span>{" "}
            Foto Sampah
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <PhotoUpload
            preview={preview}
            onSelect={onPhoto}
            onClear={() => {
              setPreview(report?.photo_url ?? null);
              setFile(null);
              setAi(null);
              setAiError(null);
            }}
          />
          <AiResultCard
            loading={predict.isPending}
            result={ai}
            error={aiError}
            onRetry={() =>
              file ? runPredict(file) : toast.info("Unggah foto baru untuk deteksi ulang")
            }
          />

          <div className="space-y-2">
            <Label>
              Kategori sampah{" "}
              {(ai?.uncertain || aiError) && <span className="text-destructive">*</span>}
            </Label>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <div
                  role="radiogroup"
                  aria-label="Kategori sampah"
                  className="grid grid-cols-3 gap-3"
                >
                  {CATEGORY_LIST.map((c) => {
                    const m = CATEGORY_META[c];
                    const active = field.value === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => field.onChange(c)}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-4",
                          active
                            ? "border-primary bg-secondary"
                            : "border-border hover:border-primary/40",
                        )}
                      >
                        <span className={cn("grid size-10 place-items-center rounded-xl", m.badge)}>
                          <m.icon className="size-5" />
                        </span>
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              )}
            />
            <FieldError msg={errors.category?.message} />
            {aiFilled && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Info className="size-3.5" /> Kategori diisi otomatis oleh AI, kamu bisa mengubahnya
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-soft">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="grid size-6 place-items-center rounded-full bg-primary text-xs text-primary-foreground">
              2
            </span>{" "}
            Lokasi
          </CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={locate} disabled={locating}>
            {locating ? <Loader2 className="animate-spin" /> : <LocateFixed />} Gunakan lokasi saya
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-72 overflow-hidden rounded-xl border sm:h-80">
            <MapPicker lat={lat} lng={lng} onChange={setPos} />
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5" /> Klik peta atau geser penanda untuk menentukan titik
            lokasi.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="lat">Latitude</Label>
              <Input
                id="lat"
                readOnly
                value={lat.toFixed(6)}
                className="bg-muted font-mono text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lng">Longitude</Label>
              <Input
                id="lng"
                readOnly
                value={lng.toFixed(6)}
                className="bg-muted font-mono text-xs"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address" className="flex items-center gap-2">
              Alamat{" "}
              {geocoding && (
                <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" /> mencari alamat...
                </span>
              )}
            </Label>
            <Textarea
              id="address"
              rows={2}
              placeholder="Terisi otomatis dari titik peta, bisa diubah"
              {...register("address")}
            />
            <FieldError
              msg={errors.address?.message ?? errors.latitude?.message ?? errors.longitude?.message}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="grid size-6 place-items-center rounded-full bg-primary text-xs text-primary-foreground">
              3
            </span>{" "}
            Detail
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Judul laporan</Label>
            <Input
              id="title"
              placeholder="Contoh: Tumpukan sampah plastik di pinggir kali"
              {...register("title")}
            />
            <FieldError msg={errors.title?.message} />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="description">
                Deskripsi <span className="font-normal text-muted-foreground">(opsional)</span>
              </Label>
              <span
                className={cn(
                  "text-xs tabular-nums",
                  desc.length > 2000 ? "text-destructive" : "text-muted-foreground",
                )}
              >
                {desc.length}/2000
              </span>
            </div>
            <Textarea
              id="description"
              rows={5}
              placeholder="Jelaskan kondisi sampah, sudah berapa lama, dan dampaknya..."
              {...register("description")}
            />
            <FieldError msg={errors.description?.message} />
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-0 z-30 -mx-4 -mb-6 border-t bg-background/90 backdrop-blur sm:-mx-6 lg:-mx-8">
        <div className="flex justify-end gap-2 px-4 py-3 sm:px-6 lg:px-8">
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            Batal
          </Button>
          <Button type="submit" disabled={save.isPending || predict.isPending}>
            {save.isPending ? <Loader2 className="animate-spin" /> : <Send />}{" "}
            {report ? "Simpan Perubahan" : "Kirim Laporan"}
          </Button>
        </div>
      </div>
    </form>
  );
}
