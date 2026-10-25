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
      // Las reglas exigen el claim `role`. Si el token cacheado todavía no lo
      // tiene (rol recién sincronizado o sesión vieja), forzamos un refresh
      // antes de leer: si no, el usuario vería "no figura como miembro".
      const token = await current.getIdTokenResult();
      if (!token.claims.role) {
        await current.getIdToken(true);
      }
    } catch {
      // Si el refresh falla, la lectura de members va a fallar igual.
    }
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        setMember(await findMemberByEmail(current.email));
        return;
      } catch {
        if (attempt === 0) {
          await new Promise((resolve) => window.setTimeout(resolve, 400));
        }
      }
    }
    setMember(null);
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

  const signUp = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      bootstrapToken?: string,
    ) => {
      setError(null);
      setLoading(true);
      try {
        const base =
          import.meta.env.VITE_AUTH_API_URL ?? "/apps/dock-dashboard/api";
        const response = await fetch(`${base}/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, bootstrapToken }),
        });
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
          code?: string;
        };
        if (!response.ok) {
          // `apiCode` y no `code`: el catch de abajo usa "code" in error para
          // decidir si el mensaje viene de Firebase o de nuestra API.
          const failure = new Error(
            data.error ?? "No se pudo crear la cuenta.",
          ) as Error & { apiCode?: string };
          failure.apiCode = data.code;
          throw failure;
        }
        await signInWithEmailAndPassword(
          firebaseAuthClient(),
          email.trim().toLowerCase(),
          password,
        );
      } catch (signUpError) {
        setError(
          signUpError instanceof Error && !("code" in signUpError)
            ? signUpError.message
            : messageForError(signUpError),
        );
        throw signUpError;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

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
      signUp,
      signOut,
      refreshMember,
    }),
    [user, member, loading, error, signIn, signUp, signOut, refreshMember],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
