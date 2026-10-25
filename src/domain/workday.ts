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
  // Redondea sobre los minutos TOTALES: partir de `Math.floor(hours)` y
  // redondear los decimales sueltos puede dar "8 h 60 min" cuando la suma
  // de horas cae justo por debajo de un entero por coma flotante.
  const totalMinutes = Math.round(hours * 60);
  const whole = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${whole} h ${String(minutes).padStart(2, "0")} min`;
}

export function formatPeriod(period: string): string {
  const [year, month] = period.split("-").map(Number);
  // `!month` cubre NaN y 0; los rangos evitan que "2026-13" se deslice a
  // enero de 2027 vía Date.UTC(2026, 12, 1).
  if (!year || !month || month < 1 || month > 12) return period;
  // Se construye con Date.UTC, así que se formatea en UTC: sin `timeZone`,
  // en un huso tras UTC el día 1 ya es diciembre del anterior.
  return new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export function timeOf(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  // `Intl.DateTimeFormat.format` revienta con RangeError sobre una fecha
  // inválida: sin este guard, un registro corrupto tumba toda la pantalla.
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
