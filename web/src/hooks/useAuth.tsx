import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { authService, type RegisterPayload } from "@/services/authService";
import { ApiError, setUnauthorizedHandler, tokenStore } from "@/services/http";
import type { User } from "@/types";

interface AuthCtx {
  user: User | null;
  /** False until the stored token has been checked against /auth/me. */
  ready: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => Promise<void>;
  setUser: (u: User) => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const clearSession = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  // Restore the session from the stored token.
  useEffect(() => {
    if (!tokenStore.get()) {
      setReady(true);
      return;
    }
    authService
      .getMe()
      .then(setUser)
      .catch((e) => {
        // Keep the token when the server is just unreachable; drop it when it was rejected.
        if (e instanceof ApiError && e.status !== 0) tokenStore.clear();
      })
      .finally(() => setReady(true));
  }, []);

  // Expired or revoked token on any request: end the session (guards redirect to /login).
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
      toast.error("Sesi berakhir, silakan masuk kembali.");
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      ready,
      isAdmin: user?.role === "admin",
      login: async (email, password) => {
        const u = await authService.login({ email, password });
        queryClient.clear();
        setUser(u);
        return u;
      },
      register: async (payload) => {
        const u = await authService.register(payload);
        queryClient.clear();
        setUser(u);
        return u;
      },
      logout: async () => {
        try {
          await authService.logout();
        } catch {
          /* token is cleared locally anyway */
        }
        clearSession();
      },
      setUser,
    }),
    [user, ready, queryClient, clearSession],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
