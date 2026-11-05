import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/layouts/AppLayout";

/** ProtectedRoute: waits for the session check, then redirects to /login when signed out. */
export const Route = createFileRoute("/_authenticated")({
  component: ProtectedLayout,
});

function ProtectedLayout() {
  const { user, ready } = useAuth();
  if (!ready) return <div className="grid min-h-screen place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <AppLayout><Outlet /></AppLayout>;
}
