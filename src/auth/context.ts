import { createContext } from "react";
import type { User } from "firebase/auth";

import type { Member, MemberRole } from "../domain/members";

/** Proveedores SSO ofrecidos en la pantalla de acceso. */
export type SsoProvider = "google" | "github";

export interface AuthContextValue {
  user: User | null;
  member: Member | null;
  role: MemberRole | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithProvider: (provider: SsoProvider) => Promise<void>;
  signUp: (
    name: string,
    email: string,
    password: string,
    bootstrapToken?: string,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  refreshMember: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
