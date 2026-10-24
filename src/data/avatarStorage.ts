import { firebaseAuthClient } from "./firebaseClient";

export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

function apiBase(): string {
  return (
    import.meta.env.VITE_AVATAR_API_URL ??
    import.meta.env.VITE_AUTH_API_URL ??
    "/apps/dock-dashboard/api"
  );
}

export async function uploadAvatar(
  memberId: string,
  file: File,
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("El avatar tiene que ser una imagen.");
  }
  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error("El avatar no puede superar los 5 MB.");
  }

  const current = firebaseAuthClient().currentUser;
  if (!current) {
    throw new Error("La sesión expiró. Volvé a iniciar sesión.");
  }

  const token = await current.getIdToken();
  const form = new FormData();
  form.set("memberId", memberId);
  form.set("file", file);

  const response = await fetch(`${apiBase()}/avatars`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  const data = (await response.json().catch(() => ({}))) as {
    error?: string;
    url?: string;
  };

  if (!response.ok || !data.url) {
    throw new Error(data.error ?? "No se pudo subir el avatar.");
  }

  return data.url;
}
