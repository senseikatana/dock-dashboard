// scripts/create-auth-users.mjs — Crea usuarios de Firebase Auth para los miembros
// Uso: DEMO_PASSWORD="..." bun scripts/create-auth-users.mjs
// Requiere Email/Password habilitado, gcloud autenticado y .env con el proyecto.

import { execSync } from "node:child_process";

const API_KEY = process.env.VITE_FIREBASE_API_KEY;
const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID;
const PASSWORD = process.env.DEMO_PASSWORD ?? "PanelOla2026!";

if (!API_KEY || !PROJECT_ID) {
  console.error(
    "Faltan VITE_FIREBASE_API_KEY / VITE_FIREBASE_PROJECT_ID en .env",
  );
  process.exit(1);
}

const token = execSync("gcloud auth print-access-token").toString().trim();
const firestoreBase = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function fieldValue(fields, name) {
  return fields?.[name]?.stringValue ?? null;
}

async function listMembers() {
  const response = await fetch(`${firestoreBase}/members`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "x-goog-user-project": PROJECT_ID,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message ?? "No se pudieron leer los miembros");
  }
  return (data.documents ?? []).map((document) => ({
    docId: document.name.split("/").pop(),
    email: fieldValue(document.fields, "email"),
    role: fieldValue(document.fields, "role"),
    uid: fieldValue(document.fields, "uid"),
  }));
}

async function patchUid(docId, uid) {
  const response = await fetch(
    `${firestoreBase}/members/${encodeURIComponent(docId)}?updateMask.fieldPaths=uid`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "x-goog-user-project": PROJECT_ID,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields: { uid: { stringValue: uid } } }),
    },
  );
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error?.message ?? "No se pudo guardar el uid");
  }
}

async function authRequest(path, body) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:${path}?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, returnSecureToken: true }),
    },
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message ?? "UNKNOWN");
  }
  return data;
}

async function upsertUser(email) {
  try {
    const created = await authRequest("signUp", { email, password: PASSWORD });
    return { uid: created.localId, created: true };
  } catch (error) {
    if (String(error.message).includes("EMAIL_EXISTS")) {
      const signedIn = await authRequest("signInWithPassword", {
        email,
        password: PASSWORD,
      });
      return { uid: signedIn.localId, created: false };
    }
    throw error;
  }
}

async function main() {
  const members = await listMembers();
  console.log(`Miembros encontrados: ${members.length}`);

  for (const member of members) {
    if (!member.email) {
      console.warn(`- ${member.docId}: sin email, se omite`);
      continue;
    }
    try {
      const { uid, created } = await upsertUser(member.email);
      await patchUid(member.docId, uid);
      console.log(
        `✓ ${member.email} → uid ${uid} (${created ? "creado" : "existente"})`,
      );
    } catch (error) {
      console.error(`✗ ${member.email}: ${error.message}`);
    }
  }

  console.log(`\nContraseña demo para todos: ${PASSWORD}`);
  console.log("Cambiala antes de producción.");
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
