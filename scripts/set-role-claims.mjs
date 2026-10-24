// scripts/set-role-claims.mjs — Sincroniza el rol de Firestore a custom claims de Auth
// Uso: bun scripts/set-role-claims.mjs
// Requiere gcloud autenticado y members con uid.

import { execSync } from "node:child_process";

const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
if (!projectId) {
  console.error("Falta VITE_FIREBASE_PROJECT_ID en .env");
  process.exit(1);
}

const token = execSync("gcloud auth print-access-token").toString().trim();
const firestoreBase = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

function fieldValue(fields, name) {
  return fields?.[name]?.stringValue ?? null;
}

async function listMembers() {
  const response = await fetch(`${firestoreBase}/members`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "x-goog-user-project": projectId,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message ?? "No se pudieron leer los miembros");
  }
  return (data.documents ?? []).map((document) => ({
    email: fieldValue(document.fields, "email"),
    role: fieldValue(document.fields, "role"),
    uid: fieldValue(document.fields, "uid"),
  }));
}

async function setRole(uid, role) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:update`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "x-goog-user-project": projectId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        localId: uid,
        customAttributes: JSON.stringify({ role }),
      }),
    },
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Error desconocido");
  }
  return data;
}

async function main() {
  const members = await listMembers();
  for (const member of members) {
    if (!member.uid) {
      console.warn(`- ${member.email}: sin uid, se omite`);
      continue;
    }
    try {
      await setRole(member.uid, member.role);
      console.log(`✓ ${member.email} → ${member.role}`);
    } catch (error) {
      console.error(`✗ ${member.email}: ${error.message}`);
    }
  }
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
