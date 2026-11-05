import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/features/profile/ProfilePage";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profil - Smart Waste Management" },
      { name: "description", content: "Kelola profil dan password akun SWM kamu." },
      { property: "og:title", content: "Profil - SWM" },
      { property: "og:description", content: "Kelola profil akun." },
    ],
  }),
  component: ProfilePage,
});
