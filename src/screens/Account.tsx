import { useState } from "react";
import { updateEmail, updatePassword, updateProfile } from "firebase/auth";

import { useAuth } from "../auth/useAuth";
import type { WarehouseRepository } from "../data/repository";
import { uploadAvatar } from "../data/avatarStorage";
import {
  MEMBER_DEPARTMENT_COPY,
  MEMBER_ROLE_COPY,
  MEMBER_STATUS_COPY,
} from "../domain/members";
import { toastSuccess } from "../ui/dialogs";

function authError(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
  if (code === "auth/requires-recent-login") {
    return "Por seguridad, cerrá sesión, volvé a entrar y repetí la operación.";
  }
  if (code === "auth/email-already-in-use") {
    return "Ese email ya está en uso.";
  }
  if (code === "auth/invalid-email") {
    return "El email no es válido.";
  }
  if (code === "auth/weak-password") {
    return "La contraseña es demasiado débil (mínimo 6 caracteres).";
  }
  return "No se pudo completar el cambio. Intentá de nuevo.";
}

export function Account({ repository }: { repository: WarehouseRepository }) {
  const { member, user, refreshMember } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  if (!member || !user) return null;

  const initials = member.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!member || !user) return;
    setError(null);
    setBusy(true);
    try {
      const form = new FormData(event.currentTarget);
      const name = String(form.get("name")).trim();
      // Firestore rechaza `undefined` (ignoreUndefinedProperties está en
      // false) y la mayoría de los miembros no tiene avatar todavía.
      const patch: { name: string; avatarUrl?: string } = { name };
      if (avatarFile) {
        patch.avatarUrl = await uploadAvatar(member.id, avatarFile);
      }
      await repository.updateMember(member.id, patch);
      await updateProfile(user, { displayName: name });
      await refreshMember();
      setAvatarFile(null);
      toastSuccess("Datos personales actualizados");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudieron guardar los datos.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function saveEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!member || !user) return;
    setError(null);
    setBusy(true);
    try {
      const form = new FormData(event.currentTarget);
      const email = String(form.get("email")).trim().toLowerCase();
      if (email === member.email) return;
      await updateEmail(user, email);
      await repository.updateMember(member.id, { email });
      await refreshMember();
      toastSuccess("Email actualizado");
    } catch (emailError) {
      setError(authError(emailError));
    } finally {
      setBusy(false);
    }
  }

  async function savePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    // React anula currentTarget cuando termina el dispatch: si lo leemos
    // después de un await, el reset() explota aunque la clave ya cambió.
    const formElement = event.currentTarget;
    setError(null);
    setBusy(true);
    try {
      const form = new FormData(formElement);
      const password = String(form.get("password"));
      const repeat = String(form.get("repeat"));
      if (password.length < 6) {
        throw new Error("La contraseña debe tener al menos 6 caracteres.");
      }
      if (password !== repeat) {
        throw new Error("Las contraseñas no coinciden.");
      }
      await updatePassword(user, password);
      formElement.reset();
      toastSuccess("Contraseña actualizada");
    } catch (passwordError) {
      setError(
        passwordError instanceof Error && !("code" in passwordError)
          ? passwordError.message
          : authError(passwordError),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="title-row">
        <div>
          <h1>Mi cuenta</h1>
          <p className="sub">
            Datos personales, acceso y contraseña de {member.email}.
          </p>
        </div>
      </div>

      {error ? <div className="signin-error">{error}</div> : null}

      <div className="account-grid">
        <section className="form-card">
          <h2>Datos personales</h2>
          <form className="form-stack" onSubmit={saveProfile}>
            <div className="account-avatar-row">
              {member.avatarUrl ? (
                <img
                  className="avatar avatar-lg"
                  src={member.avatarUrl}
                  alt=""
                  width={56}
                  height={56}
                />
              ) : (
                <span className="avatar avatar-lg avatar-fallback">
                  {initials}
                </span>
              )}
              <label className="file-field">
                Avatar (máx. 5 MB)
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) =>
                    setAvatarFile(event.currentTarget.files?.[0] ?? null)
                  }
                />
              </label>
            </div>
            <label>
              Nombre
              <input name="name" required defaultValue={member.name} />
            </label>
            <label>
              Rol
              <input
                value={`${MEMBER_ROLE_COPY[member.role]} · ${
                  MEMBER_DEPARTMENT_COPY[member.department]
                }`}
                readOnly
              />
            </label>
            <label>
              Estado
              <input value={MEMBER_STATUS_COPY[member.status]} readOnly />
            </label>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              Guardar datos
            </button>
          </form>
        </section>

        <section className="form-card">
          <h2>Email de acceso</h2>
          <form className="form-stack" onSubmit={saveEmail}>
            <label>
              Email
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                spellCheck={false}
                defaultValue={member.email}
              />
            </label>
            <p className="me-note">
              Cambiar el email también actualiza tu usuario de Firebase Auth.
            </p>
            <button type="submit" className="btn" disabled={busy}>
              Cambiar email
            </button>
          </form>
        </section>

        <section className="form-card">
          <h2>Contraseña</h2>
          <form className="form-stack" onSubmit={savePassword}>
            <label>
              Nueva contraseña
              <input
                name="password"
                type="password"
                minLength={6}
                autoComplete="new-password"
                required
              />
            </label>
            <label>
              Repetir contraseña
              <input
                name="repeat"
                type="password"
                minLength={6}
                autoComplete="new-password"
                required
              />
            </label>
            <button type="submit" className="btn" disabled={busy}>
              Cambiar contraseña
            </button>
          </form>
        </section>
      </div>
    </>
  );
}
