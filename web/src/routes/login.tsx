import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@/features/auth/LoginPage";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Masuk - Smart Waste Management" },
      { name: "description", content: "Masuk untuk melaporkan sampah liar dan memantau status laporanmu." },
      { property: "og:title", content: "Masuk - Smart Waste Management" },
      { property: "og:description", content: "Masuk untuk melaporkan sampah liar." },
    ],
  }),
  component: LoginPage,
});
