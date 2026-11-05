import { createFileRoute } from "@tanstack/react-router";
import { ReportDetailPage } from "@/features/reports/ReportDetailPage";

export const Route = createFileRoute("/_authenticated/reports/$id/")({
  head: () => ({
    meta: [
      { title: "Detail Laporan - Smart Waste Management" },
      { name: "description", content: "Detail laporan sampah, hasil deteksi AI, lokasi, dan riwayat status." },
      { property: "og:title", content: "Detail Laporan - SWM" },
      { property: "og:description", content: "Detail laporan sampah." },
    ],
  }),
  component: function DetailRoute() {
    const { id } = Route.useParams();
    return <ReportDetailPage id={Number(id)} />;
  },
});
