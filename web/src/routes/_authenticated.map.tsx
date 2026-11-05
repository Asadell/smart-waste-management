import { createFileRoute } from "@tanstack/react-router";
import { AdminOnly } from "@/components/RoleRoute";
import { ReportMapPage } from "@/features/map/ReportMapPage";

export const Route = createFileRoute("/_authenticated/map")({
  head: () => ({
    meta: [
      { title: "Peta Laporan - Smart Waste Management" },
      { name: "description", content: "Peta sebaran laporan sampah berdasarkan status dan kategori." },
      { property: "og:title", content: "Peta Laporan - SWM" },
      { property: "og:description", content: "Peta sebaran laporan sampah." },
    ],
  }),
  component: () => <AdminOnly><ReportMapPage /></AdminOnly>,
});
