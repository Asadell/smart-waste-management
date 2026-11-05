import type { User } from "@/types";
import { http, tokenStore, withMethod } from "./http";

interface TokenResponse {
  data: { token: string; token_type: "Bearer"; user: User };
  message: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone?: string | null;
  password: string;
  password_confirmation: string;
}

export interface ProfilePayload {
  name: string;
  email: string;
  phone: string | null;
  avatar?: File | null;
}

export const authService = {
  async login(payload: { email: string; password: string }): Promise<User> {
    const res = await http.post<TokenResponse>("/auth/login", {
      ...payload,
      client: "web",
      device_name: "web",
    });
    tokenStore.set(res.data.token);
    return res.data.user;
  },

  async register(payload: RegisterPayload): Promise<User> {
    const res = await http.post<TokenResponse>("/auth/register", {
      ...payload,
      phone: payload.phone || null,
      device_name: "web",
    });
    tokenStore.set(res.data.token);
    return res.data.user;
  },

  async getMe(): Promise<User> {
    return (await http.get<{ data: User }>("/auth/me")).data;
  },

  async logout(): Promise<void> {
    try {
      await http.post("/auth/logout");
    } finally {
      tokenStore.clear();
    }
  },

  async updateProfile({ avatar, ...fields }: ProfilePayload): Promise<User> {
    if (avatar) {
      const form = new FormData();
      form.append("name", fields.name);
      form.append("email", fields.email);
      form.append("phone", fields.phone ?? "");
      form.append("avatar", avatar);
      return (await http.post<{ data: User }>("/auth/profile", withMethod(form, "PUT"))).data;
    }
    return (await http.put<{ data: User }>("/auth/profile", fields)).data;
  },

  async changePassword(payload: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }): Promise<void> {
    await http.put("/auth/password", payload);
  },

  hasToken: () => tokenStore.get() !== null,
};
