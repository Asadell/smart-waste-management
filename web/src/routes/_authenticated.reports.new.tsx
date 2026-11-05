import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/Common";
import { ReportForm } from "@/features/reports/ReportForm";

export const Route = createFileRoute("/_authenticated/reports/new")({
  head: () => ({
    meta: [
      { title: "Buat Laporan - Smart Waste Management" },
      { name: "description", content: "Unggah foto sampah, tandai lokasi, dan biarkan AI mendeteksi jenisnya." },
      { property: "og:title", content: "Buat Laporan - SWM" },
      { property: "og:description", content: "Laporkan sampah liar dengan foto dan lokasi." },
    ],
  }),
  component: () => (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Buat Laporan" description="Foto sampah, tandai lokasinya, dan AI akan membantu menentukan kategorinya." />
      <ReportForm />
    </div>
  ),
});
