// scripts/purge-firestore.mjs — Borra todos los datos del panel en Firestore
// Uso: bun scripts/purge-firestore.mjs

import { initializeApp, getApps } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
} from "firebase/firestore";

const COLLECTIONS = [
  "albaranes",
  "shrinkageEvents",
  "machines",
  "wasteRecords",
  "expenses",
  "timeEntries",
  "payslips",
];

if (getApps().length === 0) {
  initializeApp({
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  });
}

const db = getFirestore();

async function purge() {
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
