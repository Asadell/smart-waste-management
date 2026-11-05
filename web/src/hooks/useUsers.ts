import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authService, type ProfilePayload } from "@/services/authService";
import { errorMessage } from "@/services/http";
import { userService, type UserPayload } from "@/services/userService";
import type { UserQueryParams } from "@/types";

export const useUsers = (p: UserQueryParams) =>
  useQuery({
    queryKey: ["users", p],
    queryFn: () => userService.getUsers(p),
    placeholderData: keepPreviousData,
  });

function useAction<T, R>(
  fn: (v: T) => Promise<R>,
  msg: string | ((r: R) => string),
  opts: { toastErrors?: boolean } = {},
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (r) => {
      toast.success(typeof msg === "function" ? msg(r) : msg);
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: opts.toastErrors === false ? undefined : (e) => toast.error(errorMessage(e)),
  });
}

/** Errors are shown inside the dialog form (per field), not as a toast. */
export const useSaveUser = () =>
  useAction(
    ({ id, data }: { id?: number; data: UserPayload }) =>
      id ? userService.updateUser(id, data) : userService.createUser(data),
    "Data pengguna disimpan",
    { toastErrors: false },
  );
export const useDeleteUser = () =>
  useAction((id: number) => userService.deleteUser(id), "Pengguna dihapus");
export const useToggleUserActive = () =>
  useAction(
    (id: number) => userService.toggleUserActive(id),
    (u) => (u.is_active ? `${u.name} diaktifkan` : `${u.name} dinonaktifkan`),
  );
export const useResetUserPassword = () =>
  useAction(
    ({ id, password }: { id: number; password: string }) =>
      userService.resetUserPassword(id, password),
    "Password berhasil direset",
  );
export const useUpdateProfile = () =>
  useAction((p: ProfilePayload) => authService.updateProfile(p), "Profil berhasil diperbarui", {
    toastErrors: false,
  });
export const useChangePassword = () =>
  useAction(authService.changePassword, "Password berhasil diubah", { toastErrors: false });
