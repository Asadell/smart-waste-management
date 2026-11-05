import type { Paginated, PredictionResult, Report, ReportQueryParams, ReportStatus } from "@/types";
import { http, withMethod } from "./http";

/** Maps the URL filter names used by the UI to the Laravel query parameters. */
export function toApiQuery(p: ReportQueryParams) {
  return {
    search: p.search,
    status: p.status,
    category: p.category,
    date_from: p.from,
    date_to: p.to,
    sort: p.sort === "oldest" ? "created_at" : "-created_at",
    page: p.page,
    per_page: p.per_page ?? 10,
  };
}

export const reportService = {
  getReports(params: ReportQueryParams = {}): Promise<Paginated<Report>> {
    return http.get<Paginated<Report>>("/reports", toApiQuery(params));
  },

  /** All reports for the admin map (the API caps per_page at 100, so pages are fetched in turn). */
  async getAllReports(): Promise<Report[]> {
    const all: Report[] = [];
    for (let page = 1; page <= 20; page++) {
      const res = await http.get<Paginated<Report>>("/reports", { page, per_page: 100 });
      all.push(...res.data);
      if (page >= res.meta.last_page) break;
    }
    return all;
  },

  async getReport(id: number): Promise<Report> {
    return (await http.get<{ data: Report }>(`/reports/${id}`)).data;
  },

  async createReport(form: FormData): Promise<Report> {
    return (await http.post<{ data: Report }>("/reports", form)).data;
  },

  async updateReport(id: number, form: FormData): Promise<Report> {
    return (await http.post<{ data: Report }>(`/reports/${id}`, withMethod(form, "PUT"))).data;
  },

  async deleteReport(id: number): Promise<void> {
    await http.delete(`/reports/${id}`);
  },

  async updateReportStatus(
    id: number,
    payload: { status: ReportStatus; note: string },
  ): Promise<Report> {
    return (
      await http.patch<{ data: Report }>(`/reports/${id}/status`, {
        status: payload.status,
        note: payload.note || null,
      })
    ).data;
  },

  /** Proxied by Laravel to the FastAPI model. Throws ApiError(503) when the AI service is down. */
  async predictWaste(file: File): Promise<PredictionResult> {
    const form = new FormData();
    form.append("file", file);
    return (await http.post<{ data: PredictionResult }>("/predict", form)).data;
  },
};
