import type { DashboardStats } from "@/types";
import { http } from "./http";

export const dashboardService = {
  /** Admins get global stats, regular users get their own (decided by the API). */
  async getDashboardStats(days: 7 | 30 = 30): Promise<DashboardStats> {
    return (await http.get<{ data: DashboardStats }>("/dashboard/stats", { days })).data;
  },
};
