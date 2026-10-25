import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "firebase/auth";
import {
  GithubAuthProvider,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";

import { firebaseAuthClient, firebaseDb } from "../data/firebaseClient";
import type { Member } from "../domain/members";
import {
  AuthContext,
  type AuthContextValue,
  type SsoProvider,
} from "./context";

const SSO_LABEL: Record<SsoProvider, string> = {
  google: "Google",
  github: "GitHub",
};

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

type LinkStatus = "linked" | "not_member" | "failed";

/**
 * Pide al Worker que enlace una cuenta recién creada por Google/GitHub con su
 * ficha de `members` y que le pinte el claim `role`. Sin ese claim las reglas
 * de Firestore no dejan ni leer `members`, así que un login SSO que no pase
 * por aquí queda siempre bloqueado.
 */
async function linkSession(user: User): Promise<LinkStatus> {
  try {
    const idToken = await user.getIdToken();
    const base =
      import.meta.env.VITE_AUTH_API_URL ?? "/apps/dock-dashboard/api";
    const response = await fetch(`${base}/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
    });
    if (response.ok) return "linked";
    const data = (await response.json().catch(() => ({}))) as {
      code?: string;
    };
    return data.code === "not_member" ? "not_member" : "failed";
  } catch {
    // Sin red no se puede enlazar: que decida la lectura de `members`.
    return "failed";
  }
}

function messageForError(error: unknown, sso?: SsoProvider): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";

  switch (code) {
    case "auth/invalid-credential":
      // Mismo código para "contraseña mala" y para "OAuth mal configurado":
      // el desenlace depende de si venimos de un proveedor.
      return sso
        ? `No se pudo conectar con ${SSO_LABEL[sso]}. Revisá que el proveedor esté habilitado en Firebase → Authentication → Sign-in method.`
        : "Email o contraseña incorrectos.";
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email o contraseña incorrectos.";
    case "auth/too-many-requests":
      return "Demasiados intentos. Esperá unos minutos y volvé a probar.";
    case "auth/operation-not-allowed":
    case "auth/configuration-not-found":
      return sso
        ? `${SSO_LABEL[sso]} no está habilitado. Activá Authentication → Sign-in method → ${SSO_LABEL[sso]} en la consola de Firebase.`
        : "Email/Password no está habilitado en Firebase. Activá Authentication → Sign-in method → Email/Password en la consola.";
    case "auth/unauthorized-domain":
      return "Este dominio no está autorizado en Firebase. Añadilo en Authentication → Settings → Authorized domains.";
    case "auth/popup-blocked":
      return "El navegador bloqueó la ventana de acceso. Permití las ventanas emergentes para este sitio y volvé a intentar.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Se cerró la ventana de acceso antes de terminar.";
    case "auth/account-exists-with-different-credential":
      return "Ya existe una cuenta con ese email usando otro método de acceso. Entrá con el método con el que se creó.";
    case "auth/network-request-failed":
      return "No se pudo conectar con Firebase. Revisá tu conexión.";
    case "auth/invalid-email":
      return "El email no tiene un formato válido.";
    default:
      return sso
        ? `No se pudo iniciar sesión con ${SSO_LABEL[sso]}. Intentá de nuevo.`
        : "No se pudo iniciar sesión. Intentá de nuevo.";
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
      const token = await current.getIdTokenResult();
      if (!token.claims.role) {
        const status = await linkSession(current);
        if (status === "linked") {
          // El claim acaba de pintarse: el token cacheado no lo trae todavía.
          await current.getIdToken(true);
        }
        if (status === "not_member") {
          setMember(null);
          return;
        }
      }
    } catch {
      // Si el enlace o el refresh fallan, la lectura de members de abajo
      // decide: sin claim va a fallar y se mostrará "no figura como miembro".
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

  const signInWithProvider = useCallback(async (provider: SsoProvider) => {
    setError(null);
    setLoading(true);
    try {
      const credential =
        provider === "google"
          ? new GoogleAuthProvider()
          : new GithubAuthProvider();
      if (provider === "github") {
        // `findMemberByEmail` necesita el email para enlazar la sesión con la
        // ficha de `members`. El scope `repo` que trae la documentación de
        // Firebase daría acceso de escritura a los repos: no hace falta.
        credential.addScope("user:email");
      }
      await signInWithPopup(firebaseAuthClient(), credential);
    } catch (ssoError) {
      setError(messageForError(ssoError, provider));
      throw ssoError;
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
      signInWithProvider,
      signUp,
      signOut,
      refreshMember,
    }),
    [
      user,
      member,
      loading,
      error,
      signIn,
      signInWithProvider,
      signUp,
      signOut,
      refreshMember,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
