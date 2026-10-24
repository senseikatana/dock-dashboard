export type MemberRole = "admin" | "responsable" | "operario";

export type MemberDepartment =
  "recepcion" | "almacen" | "compras" | "administracion" | "mantenimiento";

export type MemberStatus = "activo" | "inactivo";

export interface Member {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  department: MemberDepartment;
  status: MemberStatus;
  uid?: string;
  avatarUrl?: string;
}

export const MEMBER_ROLE_COPY: Record<MemberRole, string> = {
  admin: "Administración",
  responsable: "Responsable",
  operario: "Operario",
};

export const MEMBER_DEPARTMENT_COPY: Record<MemberDepartment, string> = {
  recepcion: "Recepción",
  almacen: "Almacén",
  compras: "Compras",
  administracion: "Administración",
  mantenimiento: "Mantenimiento",
};

export const MEMBER_STATUS_COPY: Record<MemberStatus, string> = {
  activo: "Activo",
  inactivo: "Inactivo",
};
