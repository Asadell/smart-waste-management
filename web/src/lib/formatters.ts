import { format, formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

export const formatDateTime = (iso: string) => format(new Date(iso), "d MMM yyyy, HH:mm", { locale: id });
export const formatDate = (iso: string) => format(new Date(iso), "d MMM yyyy", { locale: id });
export const formatRelative = (iso: string) =>
  formatDistanceToNow(new Date(iso), { addSuffix: true, locale: id }).replace("sekitar ", "");
export const formatNumber = (n: number) => new Intl.NumberFormat("id-ID").format(n);
export const formatPercent = (n: number) => `${Math.round(n * 100)}%`;
export const initials = (name: string) =>
  name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
