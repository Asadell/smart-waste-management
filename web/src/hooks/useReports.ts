import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { dashboardService } from "@/services/dashboardService";
import { errorMessage } from "@/services/http";
import { reportService } from "@/services/reportService";
import type { ReportQueryParams, ReportStatus } from "@/types";

export const useReports = (params: ReportQueryParams) =>
  useQuery({
    queryKey: ["reports", params],
    queryFn: () => reportService.getReports(params),
    placeholderData: keepPreviousData,
  });

export const useAllReports = () =>
  useQuery({ queryKey: ["reports", "all"], queryFn: () => reportService.getAllReports() });

export const useReport = (id: number) =>
  useQuery({ queryKey: ["report", id], queryFn: () => reportService.getReport(id), retry: false });

export const useDashboardStats = () =>
  useQuery({ queryKey: ["dashboard"], queryFn: () => dashboardService.getDashboardStats(30) });

const errorToast = (e: unknown) => toast.error(errorMessage(e));

/** Anything that changes a report also changes lists and dashboard numbers. */
function useInvalidateReports() {
  const qc = useQueryClient();
  return (id?: number) => {
    qc.invalidateQueries({ queryKey: ["reports"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    if (id) qc.invalidateQueries({ queryKey: ["report", id] });
  };
}

export function useDeleteReport() {
  const invalidate = useInvalidateReports();
  return useMutation({
    mutationFn: (id: number) => reportService.deleteReport(id),
    onSuccess: (_r, id) => {
      toast.success("Laporan dihapus");
      invalidate(id);
    },
    onError: errorToast,
  });
}

/** Validation errors (422) are left to the form so they can be shown per field. */
export function useSaveReport() {
  const invalidate = useInvalidateReports();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: FormData }) =>
      id ? reportService.updateReport(id, data) : reportService.createReport(data),
    onSuccess: (r, v) => {
      toast.success(v.id ? "Laporan berhasil diperbarui" : "Laporan berhasil dikirim", {
        description: v.id ? undefined : "Admin akan segera menindaklanjuti laporanmu.",
      });
      invalidate(r.id);
    },
  });
}

export function useUpdateReportStatus(id: number) {
  const qc = useQueryClient();
  const invalidate = useInvalidateReports();
  return useMutation({
    mutationFn: (p: { status: ReportStatus; note: string }) =>
      reportService.updateReportStatus(id, p),
    onSuccess: (r) => {
      toast.success("Status laporan diperbarui");
      qc.setQueryData(["report", id], r);
      invalidate();
    },
    onError: errorToast,
  });
}

export const usePredictWaste = () =>
  useMutation({ mutationFn: (f: File) => reportService.predictWaste(f) });
