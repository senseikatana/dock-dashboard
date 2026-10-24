// scripts/seed-firestore.mjs — Ejecutar una vez tras firebase init firestore
// Requiere: firebase CLI logueado, projectId en .env

import { initializeApp, getApps } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { buildSeed } from "../src/data/seed";

const today = new Date().toISOString().slice(0, 10);
const {
  notes,
  shrinkageEvents,
  machines,
  wasteRecords,
  expenses,
  members,
  timeEntries,
  payslips,
} = buildSeed(today);

if (getApps().length === 0) {
  initializeApp({
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  });
}

const db = getFirestore();

async function signInAdmin() {
  const auth = getAuth();
  const email = process.env.ADMIN_EMAIL ?? "sergio@panel-ola.es";
  const password = process.env.ADMIN_PASSWORD ?? "PanelOla2026!";
  await signInWithEmailAndPassword(auth, email, password);
}

async function seed() {
  await signInAdmin();
  const colls = {
    albaranes: notes,
    shrinkageEvents,
    machines,
    wasteRecords,
    expenses,
    members,
    timeEntries,
    payslips,
  };

  for (const [collName, docs] of Object.entries(colls)) {
    for (const d of docs) {
      await setDoc(doc(db, collName, d.id), d, { merge: true });
    }
    console.log(`✓ ${collName}: ${docs.length} documentos`);
  }

  console.log("Seed completo — Firestore listo para el panel.");
  process.exit(0);
}

seed().catch((e) => {
  console.error("Error en seed:", e);
  process.exit(1);
});
