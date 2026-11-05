/**
 * Thin fetch client for the Laravel API (`/api/v1`).
 * - Adds the Sanctum bearer token from localStorage.
 * - Normalizes Laravel errors into ApiError (message + per-field validation errors).
 * - Notifies the app on 401 so the session can be cleared.
 */

export const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ??
  "http://localhost:8000/api/v1";

const TOKEN_KEY = "swm-token";

export const tokenStore = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* storage unavailable */
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* storage unavailable */
    }
  },
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fieldErrors: Record<string, string> = {},
  ) {
    super(message);
  }
}

type UnauthorizedListener = () => void;
let onUnauthorized: UnauthorizedListener | null = null;
export const setUnauthorizedHandler = (fn: UnauthorizedListener | null) => {
  onUnauthorized = fn;
};

type Query = Record<string, string | number | boolean | null | undefined>;

function buildUrl(path: string, query?: Query) {
  const url = new URL(API_URL + path);
  Object.entries(query ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  });
  return url.toString();
}

async function request<T>(
  method: string,
  path: string,
  opts: { query?: Query; body?: unknown } = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let body: BodyInit | undefined;
  if (opts.body instanceof FormData) {
    body = opts.body; // browser sets the multipart boundary
  } else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.query), { method, headers, body });
  } catch {
    throw new ApiError("Tidak dapat terhubung ke server. Periksa koneksi internet.", 0);
  }

  const data = res.status === 204 ? null : await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized?.();

    const fieldErrors: Record<string, string> = {};
    if (data?.errors && typeof data.errors === "object") {
      for (const [field, messages] of Object.entries(data.errors as Record<string, string[]>)) {
        if (Array.isArray(messages) && messages[0]) fieldErrors[field] = messages[0];
      }
    }
    const fallback =
      res.status === 403
        ? "Kamu tidak punya akses untuk aksi ini."
        : res.status === 404
          ? "Data tidak ditemukan."
          : res.status === 429
            ? "Terlalu banyak percobaan. Coba lagi sebentar."
            : res.status >= 500
              ? "Terjadi kesalahan di server."
              : "Permintaan gagal.";
    throw new ApiError(data?.message ?? fallback, res.status, fieldErrors);
  }

  return data as T;
}

export const http = {
  get: <T>(path: string, query?: Query) => request<T>("GET", path, { query }),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, { body }),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, { body }),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, { body }),
  delete: <T>(path: string) => request<T>("DELETE", path),
};

/** Laravel cannot read multipart bodies on PUT, so file uploads use POST + _method spoofing. */
export function withMethod(form: FormData, method: "PUT" | "PATCH") {
  form.append("_method", method);
  return form;
}

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : "Terjadi kesalahan");
