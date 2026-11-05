import { createFileRoute } from "@tanstack/react-router";
import { RegisterPage } from "@/features/auth/RegisterPage";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Daftar - Smart Waste Management" },
      { name: "description", content: "Buat akun untuk mulai melaporkan sampah liar di kotamu." },
      { property: "og:title", content: "Daftar - Smart Waste Management" },
      { property: "og:description", content: "Buat akun dan bantu kota lebih bersih." },
    ],
  }),
  component: RegisterPage,
});
