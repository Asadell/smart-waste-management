import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart Waste Management - Laporkan sampah, kota lebih bersih" },
      { name: "description", content: "Platform pelaporan sampah liar dengan deteksi kategori otomatis oleh AI." },
      { property: "og:title", content: "Smart Waste Management" },
      { property: "og:description", content: "Laporkan sampah, kota lebih bersih." },
    ],
  }),
  component: Index,
});

function Index() {
  const { user, ready } = useAuth();
  if (!ready) return <div className="grid min-h-screen place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>;
  return <Navigate to={user ? "/dashboard" : "/login"} replace />;
}
