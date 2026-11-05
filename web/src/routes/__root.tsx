import type { QueryClient } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { SearchX } from "lucide-react";

import "../styles.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="relative mx-auto mb-6 w-fit">
          <div className="absolute inset-0 scale-150 rounded-full bg-secondary blur-2xl" />
          <div className="relative grid size-24 place-items-center rounded-3xl bg-secondary text-primary">
            <SearchX className="size-12" />
          </div>
        </div>
        <h1 className="text-6xl font-extrabold text-primary">404</h1>
        <h2 className="mt-3 text-xl font-semibold">Halaman tidak ditemukan</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Halaman yang kamu cari tidak ada atau sudah dipindahkan.
        </p>
        <Button asChild className="mt-6">
          <Link to="/dashboard">Kembali ke Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight">Halaman gagal dimuat</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Terjadi kesalahan. Coba muat ulang atau kembali ke beranda.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Coba lagi
          </Button>
          <Button variant="outline" asChild>
            <a href="/">Beranda</a>
          </Button>
        </div>
      </div>
    </div>
  );
}

const DEFAULT_TITLE = "Smart Waste Management";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

/** Applies the deepest matched route's `head().meta` title to document.title (SPA, no SSR head). */
function useDocumentTitle() {
  const title = useRouterState({
    select: (s) => {
      for (let i = s.matches.length - 1; i >= 0; i--) {
        const meta = s.matches[i].meta as Array<{ title?: string } | undefined> | undefined;
        const found = meta?.find((m) => m?.title)?.title;
        if (found) return found;
      }
      return DEFAULT_TITLE;
    },
  });
  useEffect(() => {
    document.title = title;
  }, [title]);
}

function RootComponent() {
  useDocumentTitle();

  return (
    <AuthProvider>
      <TooltipProvider>
        <Outlet />
        <Toaster richColors position="top-right" />
      </TooltipProvider>
    </AuthProvider>
  );
}
