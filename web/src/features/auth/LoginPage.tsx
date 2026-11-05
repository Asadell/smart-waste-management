import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Info, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { FieldError, PasswordInput } from "@/components/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { AuthLayout } from "@/layouts/AuthLayout";
import { ApiError, errorMessage } from "@/services/http";

const schema = z.object({
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});
type Values = z.infer<typeof schema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = async (v: Values) => {
    setServerError(null);
    try {
      const user = await login(v.email, v.password);
      toast.success(`Selamat datang, ${user.name}!`);
      navigate({ to: "/dashboard" });
    } catch (e) {
      // 422 wrong credentials, 403 deactivated account, 429 too many attempts, 0 offline.
      setServerError(e instanceof ApiError && e.fieldErrors.email ? e.fieldErrors.email : errorMessage(e));
    }
  };

  const fill = (email: string) => { setValue("email", email); setValue("password", "password"); };

  return (
    <AuthLayout>
      <div className="rounded-2xl border bg-card p-6 shadow-soft sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight">Masuk ke akunmu</h1>
        <p className="mt-1 text-sm text-muted-foreground">Lanjutkan melaporkan sampah di sekitarmu.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
          {serverError && (
            <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" /> {serverError}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="nama@email.com" autoComplete="email" {...register("email")} />
            <FieldError msg={errors.email?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <PasswordInput id="password" placeholder="••••••••" autoComplete="current-password" {...register("password")} />
            <FieldError msg={errors.password?.message} />
          </div>
          <Button type="submit" className="h-10 w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />} Masuk
          </Button>
          <p className="text-center text-xs text-muted-foreground">Lupa password? Hubungi admin untuk reset.</p>
        </form>
        <div className="mt-6 rounded-xl bg-secondary p-4 text-sm">
          <p className="flex items-center gap-1.5 font-semibold text-secondary-foreground"><Info className="size-4" /> Akun demo</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => fill("admin@swm.test")}>admin@swm.test</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => fill("user@swm.test")}>user@swm.test</Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Password: <code className="font-semibold">password</code></p>
        </div>
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Belum punya akun? <Link to="/register" className="font-semibold text-primary hover:underline">Daftar sekarang</Link>
      </p>
    </AuthLayout>
  );
}
