import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "firebase/auth";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";

import { firebaseAuthClient, firebaseDb } from "../data/firebaseClient";
import type { Member } from "../domain/members";
import { AuthContext, type AuthContextValue } from "./context";

async function findMemberByEmail(email: string): Promise<Member | null> {
  const snapshot = await getDocs(
    query(
      collection(firebaseDb(), "members"),
      where("email", "==", email.toLowerCase()),
    ),
  );
  const found = snapshot.docs[0];
  return found ? (found.data() as Member) : null;
}

function messageForError(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";

  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email o contraseña incorrectos.";
    case "auth/too-many-requests":
      return "Demasiados intentos. Esperá unos minutos y volvé a probar.";
    case "auth/operation-not-allowed":
    case "auth/configuration-not-found":
      return "Email/Password no está habilitado en Firebase. Activá Authentication → Sign-in method → Email/Password en la consola.";
    case "auth/network-request-failed":
      return "No se pudo conectar con Firebase. Revisá tu conexión.";
    case "auth/invalid-email":
      return "El email no tiene un formato válido.";
    default:
      return "No se pudo iniciar sesión. Intentá de nuevo.";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMember = useCallback(async (current: User | null) => {
    if (!current?.email) {
      setMember(null);
      return;
    }
    try {
      setMember(await findMemberByEmail(current.email));
    } catch {
      setMember(null);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      firebaseAuthClient(),
      async (nextUser) => {
        setUser(nextUser);
        setLoading(true);
        await loadMember(nextUser);
        setLoading(false);
      },
      () => {
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [loadMember]);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(
        firebaseAuthClient(),
        email.trim().toLowerCase(),
        password,
      );
    } catch (signInError) {
      setError(messageForError(signInError));
      throw signInError;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(firebaseAuthClient());
    setMember(null);
    setError(null);
  }, []);

  const refreshMember = useCallback(async () => {
    await loadMember(user);
  }, [loadMember, user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      member,
      role: member?.role ?? null,
      loading,
      error,
      signIn,
      signOut,
      refreshMember,
    }),
    [user, member, loading, error, signIn, signOut, refreshMember],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
