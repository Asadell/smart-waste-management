import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/features/dashboard/DashboardPage";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard - Smart Waste Management" },
      { name: "description", content: "Ringkasan laporan sampah, status, kategori, dan tren." },
      { property: "og:title", content: "Dashboard - SWM" },
      { property: "og:description", content: "Ringkasan laporan sampah." },
    ],
  }),
  component: DashboardPage,
});
