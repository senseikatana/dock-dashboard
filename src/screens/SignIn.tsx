import { useState } from "react";

import { useAuth } from "../auth/useAuth";

export function SignIn() {
  const { signIn, error, loading } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    try {
      await signIn(String(form.get("email")), String(form.get("password")));
    } catch {
      // El mensaje se muestra desde el contexto de auth.
    } finally {
      setSubmitting(false);
    }
  }

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
            <div className="brand-name">Dock Dashboard</div>
            <div className="brand-scope">Recepción y operaciones · Nave 3</div>
          </div>
        </div>

        <h1>Acceso al panel</h1>
        <p className="sub">
          Iniciá sesión con tu cuenta de empresa para ver el turno.
        </p>

        <form className="signin-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="nombre@empresa.es"
            />
          </label>
          <label>
            Contraseña
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
            />
          </label>
          {error ? <div className="signin-error">{error}</div> : null}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting || loading}
          >
            {submitting ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <p className="signin-hint">
          Los roles se asignan en Ajustes → Miembros. Si tu cuenta no figura
          como miembro, pedile acceso al administrador.
        </p>
      </div>
    </div>
  );
}
