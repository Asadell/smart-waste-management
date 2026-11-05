import type { Paginated, Role, User, UserQueryParams } from "@/types";
import { http } from "./http";

export interface UserPayload {
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
  password?: string;
}

const clean = ({ password, phone, ...rest }: UserPayload) => ({
  ...rest,
  phone: phone || null,
  ...(password ? { password } : {}),
});

export const userService = {
  getUsers(p: UserQueryParams = {}): Promise<Paginated<User>> {
    return http.get<Paginated<User>>("/users", {
      search: p.search,
      role: p.role,
      is_active: p.active === undefined ? undefined : p.active === "active" ? 1 : 0,
      page: p.page,
      per_page: p.per_page ?? 10,
    });
  },
  async createUser(payload: UserPayload): Promise<User> {
    return (await http.post<{ data: User }>("/users", clean(payload))).data;
  },
  async updateUser(id: number, payload: UserPayload): Promise<User> {
    return (await http.put<{ data: User }>(`/users/${id}`, clean(payload))).data;
  },
  async deleteUser(id: number): Promise<void> {
    await http.delete(`/users/${id}`);
  },
  async toggleUserActive(id: number): Promise<User> {
    return (await http.patch<{ data: User }>(`/users/${id}/toggle-active`)).data;
  },
  async resetUserPassword(id: number, password: string): Promise<void> {
    await http.patch(`/users/${id}/reset-password`, { password });
  },
};
