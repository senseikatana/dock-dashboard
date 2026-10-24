export type ShiftKind = "manana" | "tarde" | "noche";

export const SHIFT_COPY: Record<ShiftKind, string> = {
  manana: "Mañana",
  tarde: "Tarde",
  noche: "Noche",
};

export interface TimeEntry {
  id: string;
  memberId: string;
  date: string;
  shift: ShiftKind;
  clockIn: string;
  clockOut: string | null;
}

export type PayslipStatus = "pagada" | "pendiente";

export const PAYSLIP_STATUS_COPY: Record<PayslipStatus, string> = {
  pagada: "Pagada",
  pendiente: "Pendiente",
};

export interface Payslip {
  id: string;
  memberId: string;
  period: string;
  grossEur: number;
  netEur: number;
  status: PayslipStatus;
  issuedAt: string;
}

export function hoursBetween(startIso: string, endIso: string | null): number {
  if (!endIso) return 0;
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0;
  return Math.round(((end - start) / 3_600_000) * 100) / 100;
}

export function formatHours(hours: number): string {
  const whole = Math.floor(hours);
  const minutes = Math.round((hours - whole) * 60);
  return `${whole} h ${String(minutes).padStart(2, "0")} min`;
}

export function formatPeriod(period: string): string {
  const [year, month] = period.split("-").map(Number);
  if (!year || !month) return period;
  return new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export function timeOf(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
