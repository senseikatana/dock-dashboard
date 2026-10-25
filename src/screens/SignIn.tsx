import { useState } from "react";

import { useAuth } from "../auth/useAuth";
import site from "../content/site.json";

type Mode = "signin" | "signup";

export function SignIn() {
  const { signIn, signUp, error, loading } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  // El panel virgen pide un código de instalación para el primer admin.
  const [needsBootstrap, setNeedsBootstrap] = useState(false);
  const [bootstrapToken, setBootstrapToken] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));

    if (mode === "signup") {
      const name = String(form.get("name")).trim();
      const repeat = String(form.get("repeat"));
      if (name.length < 2) {
        setLocalError("Indicá tu nombre completo.");
        return;
      }
      if (password.length < 6) {
        setLocalError("La contraseña debe tener al menos 6 caracteres.");
        return;
      }
      if (password !== repeat) {
        setLocalError("Las contraseñas no coinciden.");
        return;
      }
      setSubmitting(true);
      try {
        await signUp(name, email, password, bootstrapToken.trim() || undefined);
      } catch (signUpError) {
        // El mensaje se muestra desde el contexto de auth; el código
        // determina si hay que pedir el código de instalación.
        const apiCode =
          signUpError &&
          typeof signUpError === "object" &&
          "apiCode" in signUpError
            ? String((signUpError as { apiCode?: unknown }).apiCode ?? "")
            : "";
        if (apiCode === "bootstrap_required") {
          setNeedsBootstrap(true);
        }
      } finally {
        setSubmitting(false);
      }
      return;
    }

    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch {
      // El mensaje se muestra desde el contexto de auth.
    } finally {
      setSubmitting(false);
    }
  }

  const message = localError ?? error;

  return (
    <div className="signin">
      <div className="signin-card">
        <div className="signin-brand">
          <svg width="30" height="30" viewBox="0 0 26 26" aria-hidden="true">
            <rect
              x="1"
              y="1"
              width="24"
              height="24"
              rx="5"
              fill="var(--text)"
            />
            <path
              d="M6 19 L10 7 L13 15 L16 9 L20 19"
              stroke="var(--accent)"
              strokeWidth="2.2"
              fill="none"
            />
          </svg>
          <div>
            <div className="brand-name">{site.brand}</div>
            <div className="brand-scope">{site.scope}</div>
          </div>
        </div>

        <h1>{mode === "signin" ? "Acceso al panel" : "Crear cuenta"}</h1>
        <p className="sub">
          {mode === "signin"
            ? "Iniciá sesión con tu cuenta de empresa para ver el turno."
            : "Registrate con tu email. El alta crea un usuario operario. En un panel vacío se pide el código de instalación y la primera cuenta queda como admin."}
        </p>

        <form key={mode} className="signin-form" onSubmit={handleSubmit}>
          {mode === "signup" ? (
            <label>
              Nombre completo
              <input
                name="name"
                autoComplete="name"
                required
                spellCheck={false}
                placeholder="Sergio Álvarez"
              />
            </label>
          ) : null}

          <label>
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              spellCheck={false}
              required
              placeholder="nombre@empresa.es"
            />
          </label>

          <label>
            Contraseña
            <input
              name="password"
              type="password"
              autoComplete={
                mode === "signin" ? "current-password" : "new-password"
              }
              minLength={6}
              required
              placeholder="••••••••"
            />
          </label>

          {mode === "signup" ? (
            <label>
              Repetir contraseña
              <input
                name="repeat"
                type="password"
                autoComplete="new-password"
                minLength={6}
                required
                placeholder="••••••••"
              />
            </label>
          ) : null}

          {mode === "signup" && needsBootstrap ? (
            <label>
              Código de instalación
              <input
                name="bootstrapToken"
                autoComplete="one-time-code"
                spellCheck={false}
                value={bootstrapToken}
                onChange={(event) => setBootstrapToken(event.target.value)}
                placeholder="Código configurado en el Worker"
                required
              />
            </label>
          ) : null}

          {message ? (
            <div className="signin-error" role="alert" aria-live="polite">
              {message}
            </div>
          ) : null}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting || loading}
          >
            {submitting
              ? mode === "signin"
                ? "Entrando…"
                : "Creando cuenta…"
              : mode === "signin"
                ? "Entrar"
                : "Crear cuenta"}
          </button>
        </form>

        <button
          type="button"
          className="signin-switch"
          onClick={() => {
            setMode((current) => (current === "signin" ? "signup" : "signin"));
            setLocalError(null);
          }}
        >
          {mode === "signin"
            ? "¿No tenés cuenta? Crear cuenta"
            : "¿Ya tenés cuenta? Iniciar sesión"}
        </button>

        <p className="signin-hint">
          Los roles se asignan en Ajustes → Miembros. Si tu cuenta no figura
          como miembro, pedile acceso al administrador.
        </p>
      </div>
    </div>
  );
}
