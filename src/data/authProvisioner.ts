import type { MemberRole } from "../domain/members";
import { firebaseAuthClient } from "./firebaseClient";

export interface ProvisionMemberInput {
  memberId: string;
  email: string;
  name: string;
  role: MemberRole;
}

export interface ProvisionMemberResult {
  uid: string;
  email: string;
  password: string;
}

export async function provisionMember(
  input: ProvisionMemberInput,
): Promise<ProvisionMemberResult> {
  const current = firebaseAuthClient().currentUser;
  if (!current) {
    throw new Error("La sesión expiró. Volvé a iniciar sesión.");
  }

  const token = await current.getIdToken();
  const base = import.meta.env.VITE_AUTH_API_URL ?? "/apps/dock-dashboard/api";
  const response = await fetch(`${base}/members`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const data = (await response.json().catch(() => ({}))) as {
    error?: string;
    uid?: string;
    email?: string;
    password?: string;
  };

  if (!response.ok || !data.uid || !data.email || !data.password) {
    throw new Error(data.error ?? "No se pudo crear el acceso.");
  }

  return {
    uid: data.uid,
    email: data.email,
    password: data.password,
  };
}
