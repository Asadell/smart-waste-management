import { Navigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

/** RoleRoute: non-admins are redirected to /dashboard (the API enforces the same rule with role:admin). */
export function AdminOnly({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
