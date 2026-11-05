import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, KeyRound, Loader2, Wand2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { FieldError, PasswordInput } from "@/components/PasswordInput";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useResetUserPassword, useSaveUser } from "@/hooks/useUsers";
import { ApiError, errorMessage } from "@/services/http";
import type { User } from "@/types";

const base = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  email: z.string().email("Format email tidak valid"),
  phone: z.string().optional(),
  role: z.enum(["admin", "user"]),
  password: z.string().optional(),
});

export function UserFormDialog({ open, onOpenChange, user }: { open: boolean; onOpenChange: (o: boolean) => void; user: User | null }) {
  const save = useSaveUser();
  const schema = user ? base : base.extend({ password: z.string().min(8, "Password minimal 8 karakter") });
  const { register, control, handleSubmit, reset, setError, formState: { errors } } = useForm<z.infer<typeof base>>({ resolver: zodResolver(schema) });
  const onSubmit = (v: z.infer<typeof base>) =>
    save.mutate({ id: user?.id, data: v }, {
      onSuccess: () => onOpenChange(false),
      onError: (e) => {
        const fields = e instanceof ApiError ? Object.entries(e.fieldErrors) : [];
        if (fields.length) fields.forEach(([k, msg]) => setError(k as keyof z.infer<typeof base>, { message: msg }));
        else toast.error(errorMessage(e));
      },
    });

  useEffect(() => {
    if (open) reset(user ? { name: user.name, email: user.email, phone: user.phone ?? "", role: user.role } : { name: "", email: "", phone: "", role: "user", password: "" });
  }, [open, user, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{user ? "Edit Pengguna" : "Tambah Pengguna"}</DialogTitle></DialogHeader>
        <form id="user-form" className="space-y-4" noValidate
          onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1.5"><Label htmlFor="u-name">Nama</Label><Input id="u-name" {...register("name")} /><FieldError msg={errors.name?.message} /></div>
          <div className="space-y-1.5"><Label htmlFor="u-email">Email</Label><Input id="u-email" type="email" {...register("email")} /><FieldError msg={errors.email?.message} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="u-phone">Nomor HP</Label><Input id="u-phone" {...register("phone")} /><FieldError msg={errors.phone?.message} /></div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Controller control={control} name="role" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="user">Pengguna</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent>
                </Select>
              )} />
            </div>
          </div>
          {!user && <div className="space-y-1.5"><Label htmlFor="u-pass">Password</Label><PasswordInput id="u-pass" {...register("password")} /><FieldError msg={errors.password?.message} /></div>}
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button type="submit" form="user-form" disabled={save.isPending}>{save.isPending && <Loader2 className="animate-spin" />} Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const genPassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  return Array.from(crypto.getRandomValues(new Uint32Array(12)), (n) => chars[n % chars.length]).join("");
};

export function ResetPasswordDialog({ user, onOpenChange }: { user: User | null; onOpenChange: (o: boolean) => void }) {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [generated, setGenerated] = useState<string | null>(null);
  const m = useResetUserPassword();

  useEffect(() => { if (user) { setPw(""); setConfirm(""); setGenerated(null); } }, [user]);

  const submit = () => {
    if (pw.length < 8) return toast.error("Password minimal 8 karakter");
    if (pw !== confirm) return toast.error("Konfirmasi password tidak cocok");
    m.mutate({ id: user!.id, password: pw }, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <Dialog open={!!user} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><KeyRound className="size-5 text-primary" /> Reset Password</DialogTitle>
          <DialogDescription>Atur password baru untuk {user?.name}.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5"><Label htmlFor="rp1">Password baru</Label><PasswordInput id="rp1" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="rp2">Konfirmasi password</Label><PasswordInput id="rp2" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div>
          <Button type="button" variant="outline" className="w-full" onClick={() => { const g = genPassword(); setGenerated(g); setPw(g); setConfirm(g); }}><Wand2 /> Generate password</Button>
          {generated && (
            <div className="flex items-center gap-2 rounded-lg bg-secondary p-3">
              <code className="flex-1 truncate font-mono text-sm font-semibold">{generated}</code>
              <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(generated); toast.success("Password disalin"); }}><Copy /> Salin</Button>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={submit} disabled={m.isPending}>{m.isPending && <Loader2 className="animate-spin" />} Reset Password</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
