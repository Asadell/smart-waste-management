import { createFileRoute } from "@tanstack/react-router";
import { ReportEditPage } from "@/features/reports/ReportEditPage";

export const Route = createFileRoute("/_authenticated/reports/$id/edit")({
  head: () => ({
    meta: [
      { title: "Edit Laporan - Smart Waste Management" },
      { name: "description", content: "Perbarui laporan sampah selama status masih Pending." },
      { property: "og:title", content: "Edit Laporan - SWM" },
      { property: "og:description", content: "Perbarui laporan sampah." },
    ],
  }),
  component: function EditRoute() {
    const { id } = Route.useParams();
    return <ReportEditPage id={Number(id)} />;
  },
});
