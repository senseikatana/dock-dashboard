// scripts/purge-firestore.mjs — Borra los datos operativos de Firestore.
//
// Uso interactivo:  bun scripts/purge-firestore.mjs
// Uso automatizado: bun scripts/purge-firestore.mjs --yes
// Dry run:          bun scripts/purge-firestore.mjs --dry-run
//
// Entra con un token de acceso de gcloud, no como usuario, así que no hace
// falta ninguna contraseña en el repo ni en .env. Mismo requisito que
// `bun run auth:users` y `bun run auth:sync-roles`: gcloud autenticado.

import { execSync } from "node:child_process";

const COLLECTIONS = [
  "albaranes",
  "shrinkageEvents",
  "machines",
  "wasteRecords",
  "expenses",
  "timeEntries",
  "payslips",
];

const FORCE = process.argv.includes("--yes") || process.argv.includes("-y");
const DRY_RUN = process.argv.includes("--dry-run");
// Tamaño máximo de un commit de Firestore: 500 escrituras.
const COMMIT_BATCH = 500;

const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
if (!projectId) {
  console.error("Falta VITE_FIREBASE_PROJECT_ID en .env");
  process.exit(1);
}

const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

function accessToken() {
  try {
    return execSync("gcloud auth print-access-token", {
      stdio: ["ignore", "pipe", "pipe"],
    })
      .toString()
      .trim();
  } catch {
    console.error("❌ No se pudo obtener un token de acceso de gcloud.");
    console.error("   Ejecutá `gcloud auth login` y volvé a intentarlo.");
    process.exit(1);
  }
}

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    "x-goog-user-project": projectId,
    "Content-Type": "application/json",
  };
}

// `pageSize` está limitado a 300: hay que paginar o se borra una fracción.
async function listDocumentNames(collection, token) {
  const names = [];
  let pageToken = "";
  do {
    const url = new URL(`${base}/${collection}`);
    url.searchParams.set("pageSize", "300");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const response = await fetch(url, { headers: authHeaders(token) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(
        data?.error?.message ?? `No se pudo leer la colección ${collection}`,
      );
    }
    for (const document of data.documents ?? []) names.push(document.name);
    pageToken = data.nextPageToken ?? "";
  } while (pageToken);
  return names;
}

async function deleteDocuments(names, token) {
  for (let i = 0; i < names.length; i += COMMIT_BATCH) {
    const chunk = names.slice(i, i + COMMIT_BATCH);
    const response = await fetch(`${base}:commit`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ writes: chunk.map((name) => ({ delete: name })) }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(
        data?.error?.message ?? "No se pudieron borrar los documentos",
      );
    }
  }
}

async function confirmAction(message) {
  if (FORCE || DRY_RUN) return true;

  if (!process.stdin.isTTY) {
    console.error("❌ Purga abortada: no hay terminal para confirmar.");
    console.error(
      "   Falta --yes (invocación automatizada, p. ej. e2e/global-setup.ts).",
    );
    console.error(
      "   Ejecutá en una terminal interactiva, o añadí --yes si es automatizado.",
    );
    return false;
  }

  const { createInterface } = await import("node:readline/promises");
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const answer = await rl.question(`${message} (yes/N): `);
    const normalized = answer.trim().toLowerCase();
    return ["y", "yes", "s", "sí", "si"].includes(normalized);
  } finally {
    rl.close();
  }
}

async function purge() {
  console.log(
    "⚠️  ADVERTENCIA: esta acción elimina TODOS los datos operativos de Firestore",
  );
  console.log(
    "   (albaranes, incidencias, máquinas, residuos, gastos, fichajes y nóminas).",
  );
  console.log(
    "   Los miembros NO se borran, para no perder el acceso al panel.",
  );

  const confirmed = await confirmAction(
    `¿Continuar con la purga de "${projectId}"?`,
  );
  if (!confirmed) {
    console.log("Operación cancelada. Nada se ha borrado.");
    process.exit(1);
  }

  const token = accessToken();

  for (const collection of COLLECTIONS) {
    const names = await listDocumentNames(collection, token);
    if (DRY_RUN) {
      console.log(`· ${collection}: ${names.length} documentos (dry run)`);
      continue;
    }
    if (names.length > 0) await deleteDocuments(names, token);
    console.log(`✓ ${collection}: ${names.length} documentos borrados`);
  }

  console.log(
    DRY_RUN
      ? "Dry run terminado — no se ha borrado nada."
      : "Purga completa — Firestore vacío.",
  );
  process.exit(0);
}

purge().catch((error) => {
  console.error("Error en purga:", error);
  process.exit(1);
});
