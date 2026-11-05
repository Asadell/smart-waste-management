import { KeyRound, MoreHorizontal, Pencil, Search, Trash2, UserPlus, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { RoleBadge } from "@/components/Badges";
import { EmptyState, PageHeader } from "@/components/Common";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DataTablePagination } from "@/components/DataTablePagination";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { useDeleteUser, useToggleUserActive, useUsers } from "@/hooks/useUsers";
import { formatDate, initials } from "@/lib/formatters";
import type { Role, User } from "@/types";
import { ResetPasswordDialog, UserFormDialog } from "./UserDialogs";

export function UserListPage() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  useEffect(() => { const t = setTimeout(() => setDebounced(search.trim()), 350); return () => clearTimeout(t); }, [search]);
  const [role, setRole] = useState<Role | "all">("all");
  const [active, setActive] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [resetting, setResetting] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);

  const { data, isLoading } = useUsers({ search: debounced || undefined, role: role === "all" ? undefined : role, active: active === "all" ? undefined : active, page, per_page: perPage });
  const toggle = useToggleUserActive();
  const del = useDeleteUser();

  const { user: me } = useAuth();
  const isActive = (u: User) => (toggle.isPending && toggle.variables === u.id ? !u.is_active : u.is_active);
  const onToggle = (u: User) => toggle.mutate(u.id);
  const isMe = (u: User) => u.id === me?.id;

  const actions = (u: User) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-8" aria-label="Aksi"><MoreHorizontal /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => { setEditing(u); setFormOpen(true); }}><Pencil /> Edit</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setResetting(u)}><KeyRound /> Reset Password</DropdownMenuItem>
        {!isMe(u) && <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleting(u)}><Trash2 /> Hapus</DropdownMenuItem>}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const avatar = (u: User) => (
    <Avatar className="size-9"><AvatarFallback className="bg-secondary text-xs font-semibold text-secondary-foreground">{initials(u.name)}</AvatarFallback></Avatar>
  );

  return (
    <div>
      <PageHeader title="Pengguna" description="Kelola akun warga dan admin." actions={<Button onClick={() => { setEditing(null); setFormOpen(true); }}><UserPlus /> Tambah User</Button>} />
      <Card className="overflow-hidden rounded-xl shadow-soft">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Cari nama atau email..." className="pl-9" aria-label="Cari pengguna" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex">
            <Select value={role} onValueChange={(v) => { setRole(v as never); setPage(1); }}>
              <SelectTrigger className="sm:w-[140px]" aria-label="Filter role"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">Semua role</SelectItem><SelectItem value="admin">Admin</SelectItem><SelectItem value="user">Pengguna</SelectItem></SelectContent>
            </Select>
            <Select value={active} onValueChange={(v) => { setActive(v as never); setPage(1); }}>
              <SelectTrigger className="sm:w-[140px]" aria-label="Filter status"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">Semua status</SelectItem><SelectItem value="active">Aktif</SelectItem><SelectItem value="inactive">Nonaktif</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
        {isLoading ? (
          <div className="space-y-3 p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
        ) : !data?.data.length ? (
          <EmptyState icon={Users} title="Tidak ada pengguna" description="Coba ubah kata kunci atau filter." />
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Nama</TableHead><TableHead>Telepon</TableHead><TableHead>Role</TableHead>
                    <TableHead className="text-center">Laporan</TableHead><TableHead>Aktif</TableHead><TableHead>Bergabung</TableHead><TableHead className="w-[56px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="pl-4"><div className="flex items-center gap-3">{avatar(u)}<div className="min-w-0"><p className="font-semibold">{u.name}{isMe(u) && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(kamu)</span>}</p><p className="text-xs text-muted-foreground">{u.email}</p></div></div></TableCell>
                      <TableCell className="text-sm">{u.phone ?? <span className="text-muted-foreground">-</span>}</TableCell>
                      <TableCell><RoleBadge role={u.role} /></TableCell>
                      <TableCell className="text-center font-semibold tabular-nums">{u.reports_count}</TableCell>
                      <TableCell><Switch checked={isActive(u)} disabled={isMe(u)} onCheckedChange={() => onToggle(u)} aria-label={`Status aktif ${u.name}`} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(u.created_at)}</TableCell>
                      <TableCell>{actions(u)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <ul className="divide-y md:hidden">
              {data.data.map((u) => (
                <li key={u.id} className="flex items-start gap-3 p-4">
                  {avatar(u)}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><p className="truncate font-semibold">{u.name}</p><RoleBadge role={u.role} /></div>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{u.reports_count} laporan</span>
                      <label className="flex items-center gap-1.5"><Switch checked={isActive(u)} disabled={isMe(u)} onCheckedChange={() => onToggle(u)} /> {isActive(u) ? "Aktif" : "Nonaktif"}</label>
                    </div>
                  </div>
                  {actions(u)}
                </li>
              ))}
            </ul>
            <DataTablePagination meta={data.meta} onPage={setPage} onPerPage={(n) => { setPerPage(n); setPage(1); }} />
          </>
        )}
      </Card>
      <UserFormDialog open={formOpen} onOpenChange={setFormOpen} user={editing} />
      <ResetPasswordDialog user={resetting} onOpenChange={(o) => !o && setResetting(null)} />
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Hapus pengguna?" description={`Akun ${deleting?.name} beserta laporannya akan dihapus permanen.`}
        onConfirm={() => { if (deleting) del.mutate(deleting.id); setDeleting(null); }} />
    </div>
  );
}
