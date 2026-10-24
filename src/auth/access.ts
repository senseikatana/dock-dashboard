import type { MemberRole } from "../domain/members";

export type AppRouteKey =
  | "me"
  | "timesheet"
  | "payslips"
  | "account"
  | "dashboard"
  | "reception"
  | "incidents"
  | "machinery"
  | "waste"
  | "expenses"
  | "settings";

export interface AppRoute {
  key: AppRouteKey;
  path: string;
  label: string;
  short: string;
}

export const APP_ROUTES: AppRoute[] = [
  { key: "me", path: "/me", label: "Mi panel", short: "MP" },
  { key: "timesheet", path: "/timesheet", label: "Fichaje", short: "FI" },
  { key: "payslips", path: "/payslips", label: "Nóminas", short: "NÓ" },
  { key: "account", path: "/account", label: "Mi cuenta", short: "CU" },
  {
    key: "dashboard",
    path: "/dashboard",
    label: "Cuadro de mando",
    short: "CM",
  },
  { key: "reception", path: "/reception", label: "Recepción", short: "RE" },
  {
    key: "incidents",
    path: "/incidents",
    label: "Incidencias y mermas",
    short: "IN",
  },
  { key: "machinery", path: "/machinery", label: "Maquinaria", short: "MA" },
  { key: "waste", path: "/waste", label: "Residuos", short: "RS" },
  {
    key: "expenses",
    path: "/expenses",
    label: "Gastos generales",
    short: "GA",
  },
  { key: "settings", path: "/settings", label: "Ajustes", short: "AJ" },
];

const ACCESS_MATRIX: Record<AppRouteKey, MemberRole[]> = {
  me: ["admin", "responsable", "operario"],
  timesheet: ["admin", "responsable", "operario"],
  payslips: ["admin", "responsable", "operario"],
  account: ["admin", "responsable", "operario"],
  dashboard: ["admin", "responsable"],
  reception: ["admin", "responsable", "operario"],
  incidents: ["admin", "responsable", "operario"],
  machinery: ["admin", "responsable"],
  waste: ["admin", "responsable"],
  expenses: ["admin", "responsable"],
  settings: ["admin"],
};

export const PERSONAL_ROUTES = ["/me", "/timesheet", "/payslips", "/account"];

export function canAccess(role: MemberRole, route: AppRouteKey): boolean {
  return ACCESS_MATRIX[route].includes(role);
}

export function routesForRole(role: MemberRole): AppRoute[] {
  return APP_ROUTES.filter((route) => canAccess(role, route.key));
}

export function routeKeyFromPath(pathname: string): AppRouteKey | null {
  return APP_ROUTES.find((route) => route.path === pathname)?.key ?? null;
}
