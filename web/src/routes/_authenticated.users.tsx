import { createFileRoute } from "@tanstack/react-router";
import { AdminOnly } from "@/components/RoleRoute";
import { UserListPage } from "@/features/users/UserListPage";

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({
    meta: [
      { title: "Pengguna - Smart Waste Management" },
      { name: "description", content: "Kelola akun pengguna dan admin SWM." },
      { property: "og:title", content: "Pengguna - SWM" },
      { property: "og:description", content: "Kelola akun pengguna." },
    ],
  }),
  component: () => <AdminOnly><UserListPage /></AdminOnly>,
});
