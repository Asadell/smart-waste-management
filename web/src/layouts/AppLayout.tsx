import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  ChevronsLeft, FilePlus2, FileText, LayoutDashboard, LogOut, Map, Menu, Moon, Sun, User as UserIcon, Users,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { RoleBadge } from "@/components/Badges";
import { Logo } from "@/components/Common";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { initials } from "@/lib/formatters";
import { cn } from "@/lib/utils";

type NavItem = { to: "/dashboard" | "/reports" | "/map" | "/users" | "/profile" | "/reports/new"; label: string; icon: typeof LayoutDashboard; exact?: boolean };

const adminNav: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/reports", label: "Laporan", icon: FileText },
  { to: "/map", label: "Peta Laporan", icon: Map },
  { to: "/users", label: "Pengguna", icon: Users },
  { to: "/profile", label: "Profil", icon: UserIcon },
];
const userNav: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/reports", label: "Laporan Saya", icon: FileText, exact: true },
  { to: "/reports/new", label: "Buat Laporan", icon: FilePlus2 },
  { to: "/profile", label: "Profil", icon: UserIcon },
];

const CRUMBS: Record<string, string> = {
  dashboard: "Dashboard", reports: "Laporan", new: "Buat", edit: "Edit", users: "Pengguna", profile: "Profil", map: "Peta Laporan",
};

function NavList({ items, collapsed, onNavigate }: { items: NavItem[]; collapsed?: boolean; onNavigate?: () => void }) {
  const { pathname } = useLocation();
  return (
    <nav className="space-y-1">
      {items.map((it) => {
        const active = it.exact || it.to === "/reports"
          ? pathname === it.to || (it.to === "/reports" && /^\/reports\/\d+/.test(pathname))
          : pathname.startsWith(it.to);
        const link = (
          <Link
            key={it.to}
            to={it.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
              active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              collapsed && "justify-center px-0",
            )}
          >
            <it.icon className={cn("size-[18px] shrink-0", active && "text-sidebar-primary")} />
            {!collapsed && it.label}
          </Link>
        );
        return collapsed ? (
          <Tooltip key={it.to}><TooltipTrigger asChild>{link}</TooltipTrigger><TooltipContent side="right">{it.label}</TooltipContent></Tooltip>
        ) : link;
      })}
    </nav>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, isAdmin, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = isAdmin ? adminNav : userNav;

  const segs = pathname.split("/").filter(Boolean);
  const crumbs = segs.map((s) => (/^\d+$/.test(s) ? `#${s}` : CRUMBS[s] ?? s));

  const doLogout = async () => {
    await logout();
    toast.success("Kamu telah keluar");
    navigate({ to: "/login" });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside className={cn("sticky top-0 hidden h-screen shrink-0 flex-col border-r bg-sidebar transition-[width] duration-200 md:flex", collapsed ? "w-[72px]" : "w-64")}>
        <div className={cn("flex h-16 items-center border-b px-4", collapsed && "justify-center px-0")}>
          {collapsed ? <Logo className="[&>div:last-child]:hidden" /> : <Logo />}
        </div>
        <div className="flex-1 overflow-y-auto p-3"><NavList items={items} collapsed={collapsed} /></div>
        <div className="border-t p-3">
          <Button variant="ghost" size="sm" className={cn("w-full justify-start text-muted-foreground", collapsed && "justify-center")} onClick={() => setCollapsed((c) => !c)} aria-label="Ciutkan sidebar">
            <ChevronsLeft className={cn("transition-transform", collapsed && "rotate-180")} />
            {!collapsed && "Ciutkan"}
          </Button>
        </div>
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 bg-sidebar p-0">
          <SheetTitle className="sr-only">Menu navigasi</SheetTitle>
          <div className="flex h-16 items-center border-b px-4"><Logo /></div>
          <div className="p-3"><NavList items={items} onNavigate={() => setMobileOpen(false)} /></div>
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur sm:px-6">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)} aria-label="Buka menu"><Menu /></Button>
          <nav aria-label="Breadcrumb" className="min-w-0 flex-1 truncate text-sm">
            {crumbs.map((c, i) => (
              <span key={i} className={i === crumbs.length - 1 ? "font-semibold text-foreground" : "text-muted-foreground"}>
                {i > 0 && <span className="mx-1.5 text-muted-foreground/50">/</span>}{c}
              </span>
            ))}
          </nav>
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Ganti tema">{dark ? <Sun /> : <Moon />}</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Menu pengguna">
                <Avatar className="size-9">{user?.avatar_url && <AvatarImage src={user.avatar_url} className="object-cover" />}<AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground">{initials(user?.name ?? "?")}</AvatarFallback></Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="font-normal">
                <div className="flex items-center justify-between gap-2"><p className="truncate font-semibold">{user?.name}</p>{user && <RoleBadge role={user.role} />}</div>
                <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}><UserIcon /> Profil</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={doLogout} className="text-destructive focus:text-destructive"><LogOut /> Keluar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
