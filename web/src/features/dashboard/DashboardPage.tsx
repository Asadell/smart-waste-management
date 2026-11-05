import { Link } from "@tanstack/react-router";
import { CheckCircle2, Clock, FilePlus2, FileText, Loader, Sparkles, Users, XCircle } from "lucide-react";
import { useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CategoryBadge, StatusBadge } from "@/components/Badges";
import { EmptyState, PageHeader, StatCard } from "@/components/Common";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardStats } from "@/hooks/useReports";
import { CATEGORY_LIST, CATEGORY_META, STATUS_LIST, STATUS_META } from "@/lib/constants";
import { formatPercent, formatRelative } from "@/lib/formatters";
import { PhotoThumb } from "@/components/Common";

const tooltipStyle = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--popover-foreground)", fontSize: 12 };

export function DashboardPage() {
  const { user, isAdmin } = useAuth();
  // The API scopes the numbers: admins get every report, users only their own.
  const { data: stats, isLoading } = useDashboardStats();
  const latest = stats?.recent_reports;
  const [range, setRange] = useState("30");
  const accuracy = stats?.ai_accuracy;

  const s = stats?.by_status;
  const catData = CATEGORY_LIST.map((c) => ({ name: CATEGORY_META[c].label, value: stats?.by_category[c] ?? 0, fill: CATEGORY_META[c].hex }));
  const statusData = STATUS_LIST.map((st) => ({ name: STATUS_META[st].label, value: s?.[st] ?? 0, fill: STATUS_META[st].chart }));
  const trend = (stats?.trend ?? []).slice(range === "7" ? -7 : -30).map((t) => ({ count: t.total, label: t.date.slice(8, 10) + "/" + t.date.slice(5, 7) }));

  return (
    <div className="space-y-6">
      {isAdmin ? (
        <PageHeader title="Dashboard" description="Ringkasan laporan sampah di seluruh kota." />
      ) : (
        <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-brand-foreground sm:p-8">
          <div className="leaf-pattern absolute inset-0" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">Halo, {user!.name.split(" ")[0]} 👋</h1>
              <p className="mt-1 text-brand-foreground/80">Lihat sampah menumpuk? Laporkan sekarang, AI bantu kategorikan.</p>
            </div>
            <Button asChild size="lg" variant="secondary" className="h-12 px-6 text-base font-semibold">
              <Link to="/reports/new"><FilePlus2 /> Buat Laporan</Link>
            </Button>
          </div>
        </div>
      )}

      <div className={isAdmin ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-5" : "grid gap-4 grid-cols-2 lg:grid-cols-4"}>
        {isAdmin && <StatCard label="Total Laporan" value={stats?.total_reports} icon={FileText} loading={isLoading} />}
        <StatCard label="Pending" value={s?.pending} icon={Clock} tone="pending" loading={isLoading} />
        <StatCard label="Diproses" value={s?.in_progress} icon={Loader} tone="progress" loading={isLoading} />
        <StatCard label="Selesai" value={s?.completed} icon={CheckCircle2} tone="success" loading={isLoading} />
        <StatCard label="Ditolak" value={s?.rejected} icon={XCircle} tone="danger" loading={isLoading} />
      </div>

      {isAdmin && (
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard label="Total Pengguna" value={stats?.total_users} icon={Users} loading={isLoading} hint={`${stats?.active_users ?? 0} akun aktif`} />
          <StatCard
            label="Akurasi AI di Lapangan"
            value={accuracy?.rate != null ? formatPercent(accuracy.rate) : "-"}
            icon={Sparkles}
            loading={isLoading}
            hint={accuracy ? `Tebakan AI sama dengan kategori final pada ${accuracy.matched} dari ${accuracy.total_predicted} laporan` : undefined}
          />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-xl shadow-soft">
          <CardHeader><CardTitle className="text-base">Per Kategori</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-60 w-full" /> : (
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <div className="grid h-56 w-full place-items-center sm:w-1/2">
                    <PieChart width={220} height={220}>
                      <Pie data={catData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={100} paddingAngle={3} stroke="none" isAnimationActive={false}>
                        {catData.map((d) => <Cell key={d.name} fill={d.fill} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                </div>
                <ul className="w-full space-y-3 sm:w-1/2">
                  {CATEGORY_LIST.map((c, i) => (
                    <li key={c} className="flex items-center justify-between"><CategoryBadge category={c} /><span className="font-semibold tabular-nums">{catData[i].value}</span></li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-soft">
          <CardHeader><CardTitle className="text-base">Per Status</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-60 w-full" /> : (
              <div className="h-60">
                <ResponsiveContainer>
                  <BarChart data={statusData}>
                    <CartesianGrid vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} width={28} stroke="var(--muted-foreground)" />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
                    <Bar dataKey="value" name="Jumlah" radius={[8, 8, 0, 0]}>{statusData.map((d) => <Cell key={d.name} fill={d.fill} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl shadow-soft">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Tren Laporan</CardTitle>
          <ToggleGroup type="single" size="sm" variant="outline" value={range} onValueChange={(v) => v && setRange(v)}>
            <ToggleGroupItem value="7">7 hari</ToggleGroupItem>
            <ToggleGroupItem value="30">30 hari</ToggleGroupItem>
          </ToggleGroup>
        </CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-64 w-full" /> : (
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" minTickGap={16} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} width={28} stroke="var(--muted-foreground)" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="count" name="Laporan" stroke="var(--primary)" strokeWidth={2.5} fill="url(#trendFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-soft">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Laporan Terbaru</CardTitle>
          <Button asChild variant="ghost" size="sm"><Link to="/reports">Lihat semua</Link></Button>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : !latest?.length ? (
            <EmptyState title="Belum ada laporan" description="Laporan yang kamu buat akan muncul di sini." />
          ) : (
            <ul className="divide-y">
              {latest.map((r) => (
                <li key={r.id}>
                  <Link to="/reports/$id" params={{ id: String(r.id) }} className="flex items-center gap-4 px-6 py-3 transition-colors hover:bg-muted/50">
                    <PhotoThumb src={r.photo_url} className="size-12 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{r.title}</p>
                      <p className="text-xs text-muted-foreground">{formatRelative(r.created_at)}</p>
                    </div>
                    <div className="hidden gap-2 sm:flex"><CategoryBadge category={r.category} /></div>
                    <StatusBadge status={r.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
