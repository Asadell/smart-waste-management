import { Camera, ShieldCheck, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "@/components/Common";

const steps = [
  { icon: Camera, title: "Foto", desc: "Ambil foto sampah & tandai lokasi" },
  { icon: Sparkles, title: "AI deteksi", desc: "Kategori terdeteksi otomatis" },
  { icon: ShieldCheck, title: "Admin tindak lanjut", desc: "Petugas membersihkan lokasi" },
];

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-brand-gradient p-10 text-brand-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="leaf-pattern absolute inset-0" />
        <div className="absolute -right-24 -top-24 size-80 rounded-full bg-brand-foreground/10 blur-3xl" />
        <div className="relative"><Logo light /></div>
        <div className="relative max-w-md">
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight">Laporkan sampah, kota lebih bersih.</h2>
          <p className="mt-3 text-brand-foreground/80">Bantu dinas kebersihan menemukan tumpukan sampah liar lebih cepat dengan foto dan lokasi.</p>
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[["3", "kategori sampah"], ["97%", "akurasi model (data uji)"], ["Web & HP", "lapor dari mana saja"]].map(([v, l]) => (
              <div key={l} className="rounded-xl bg-brand-foreground/10 p-3 backdrop-blur">
                <div className="text-2xl font-bold">{v}</div>
                <div className="text-xs text-brand-foreground/75">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-foreground/70">Cara kerja</p>
          <ol className="grid grid-cols-3 gap-3">
            {steps.map((s, i) => (
              <li key={s.title} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="grid size-9 place-items-center rounded-lg bg-brand-foreground/15"><s.icon className="size-4" /></div>
                  {i < steps.length - 1 && <div className="h-px flex-1 bg-brand-foreground/25" />}
                </div>
                <div className="text-sm font-semibold">{s.title}</div>
                <div className="text-xs text-brand-foreground/70">{s.desc}</div>
              </li>
            ))}
          </ol>
        </div>
      </aside>
      <main className="flex flex-col items-center justify-center px-4 py-10 sm:px-8">
        <Logo className="mb-8 lg:hidden" />
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
