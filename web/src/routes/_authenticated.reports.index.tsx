import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ReportListPage } from "@/features/reports/ReportListPage";

const searchSchema = z.object({
  search: z.string().optional().catch(undefined),
  status: z.enum(["pending", "in_progress", "completed", "rejected"]).optional().catch(undefined),
  category: z.enum(["organic", "plastic", "paper"]).optional().catch(undefined),
  from: z.string().optional().catch(undefined),
  to: z.string().optional().catch(undefined),
  sort: z.enum(["latest", "oldest"]).optional().catch(undefined),
  page: z.number().int().positive().optional().catch(undefined),
  per_page: z.number().int().positive().optional().catch(undefined),
});

export type ReportSearch = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/_authenticated/reports/")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Laporan - Smart Waste Management" },
      { name: "description", content: "Daftar laporan sampah dengan filter status, kategori, dan tanggal." },
      { property: "og:title", content: "Laporan - SWM" },
      { property: "og:description", content: "Daftar laporan sampah." },
    ],
  }),
  component: ReportListPage,
});
