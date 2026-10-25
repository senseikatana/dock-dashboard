// scripts/purge-firestore.mjs — Borra todos los datos del panel en Firestore
// Uso interactivo:  bun scripts/purge-firestore.mjs
// Uso en scripts/CI: bun scripts/purge-firestore.mjs --yes
//
// La purga borra datos del proyecto real que indique VITE_FIREBASE_PROJECT_ID,
// así que en terminal interactiva pide confirmación y en modo no interactivo
// exige el flag --yes explícito.

import { initializeApp, getApps } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { createInterface } from "node:readline/promises";

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

if (getApps().length === 0) {
  initializeApp({
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  });
}

const db = getFirestore();

async function confirmAction(message) {
  if (FORCE) return true;

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
    `¿Continuar con la purga de "${process.env.VITE_FIREBASE_PROJECT_ID}"?`,
  );
  if (!confirmed) {
    console.log("Operación cancelada. Nada se ha borrado.");
    process.exit(1);
  }

  const auth = getAuth();
  await signInWithEmailAndPassword(
    auth,
    process.env.ADMIN_EMAIL ?? "sergio@panel-ola.es",
    process.env.ADMIN_PASSWORD ?? "PanelOla2026!",
  );
  for (const name of COLLECTIONS) {
    const snapshot = await getDocs(collection(db, name));
    await Promise.all(snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref)));
    console.log(`✓ ${name}: ${snapshot.size} documentos borrados`);
  }
  console.log("Purga completa — Firestore vacío.");
  process.exit(0);
}

purge().catch((error) => {
  console.error("Error en purga:", error);
  process.exit(1);
});
