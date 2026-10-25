// scripts/seed-firestore.mjs — Sembrilla los datos de demo en Firestore.
//
// Uso:              bun scripts/seed-firestore.mjs
// Dry run:          bun scripts/seed-firestore.mjs --dry-run
//
// Entra con un token de acceso de gcloud, no como usuario, así que no hace
// falta ninguna contraseña en el repo ni en .env. Mismo requisito que
// `bun run auth:users` y `bun run auth:sync-roles`: gcloud autenticado.
//
// La escritura va por la API REST de Firestore, así que hay que traducir los
// valores JS a `fields` (convertidor de abajo). `buildSeed` solo produce
// string / number / boolean / array / object, y nunca `Date` — verificado
// sobre el seed real.

import { execSync } from "node:child_process";
import { buildSeed } from "../src/data/seed";
import { localDateIso } from "../src/domain/date";

const DRY_RUN = process.argv.includes("--dry-run");
// Tamaño máximo de un commit de Firestore: 500 escrituras.
const COMMIT_BATCH = 500;

const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
if (!projectId) {
  console.error("Falta VITE_FIREBASE_PROJECT_ID en .env");
  process.exit(1);
}

const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

const today = localDateIso();
const seed = buildSeed(today);
// members entra en el seed para tener fichas, pero los datos operativos son
// los que purga `purge-firestore.mjs`.
const COLLECTIONS = {
  albaranes: seed.notes,
  shrinkageEvents: seed.shrinkageEvents,
  machines: seed.machines,
  wasteRecords: seed.wasteRecords,
  expenses: seed.expenses,
  members: seed.members,
  timeEntries: seed.timeEntries,
  payslips: seed.payslips,
};

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

function toFieldValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toFieldValue) } };
  }
  if (typeof value === "object") {
    return { mapValue: { fields: toFields(value) } };
  }
  throw new Error(`Valor del seed no soportado: ${typeof value}`);
}

function toFields(record) {
  return Object.fromEntries(
    Object.entries(record)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, toFieldValue(value)]),
  );
}

function writeFor(collection, record) {
  if (!record.id) {
    throw new Error(`El registro de ${collection} no tiene id`);
  }
  return {
    update: {
      name: `${base}/${collection}/${encodeURIComponent(record.id)}`,
      fields: toFields(record),
    },
  };
}

async function commit(writes, token) {
  for (let i = 0; i < writes.length; i += COMMIT_BATCH) {
    const response = await fetch(`${base}:commit`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ writes: writes.slice(i, i + COMMIT_BATCH) }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(
        data?.error?.message ?? "No se pudieron escribir los datos",
      );
    }
  }
}

async function runSeed() {
  // Se serializan SIEMPRE, también en dry run: es lo que valida el
  // convertidor contra los datos reales sin escribir nada.
  const writes = [];
  for (const [collection, records] of Object.entries(COLLECTIONS)) {
    writes.push(...records.map((record) => writeFor(collection, record)));
    console.log(
      `${DRY_RUN ? "·" : "✓"} ${collection}: ${records.length} documentos${DRY_RUN ? " (dry run)" : ""}`,
    );
  }

  if (DRY_RUN) {
    const sample = COLLECTIONS.albaranes[0];
    console.log(
      `Dry run terminado — no se ha escrito nada. ${writes.length} escrituras válidas.`,
    );
    console.log(
      `Ejemplo serializado (primer albarán): ${JSON.stringify(toFieldValue(sample)).slice(0, 160)}…`,
    );
    process.exit(0);
  }

  const token = accessToken();
  await commit(writes, token);
  console.log("Seed completo — Firestore listo para el panel.");
  process.exit(0);
}

runSeed().catch((error) => {
  console.error("Error en seed:", error);
  process.exit(1);
});
