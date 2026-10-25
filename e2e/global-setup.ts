import { execSync } from "node:child_process";

// La suite purga y re-sembrilla antes de cada corrida. Apunta al proyecto
// Firebase real que indique VITE_FIREBASE_PROJECT_ID, así que pasamos --yes
// para no bloquear la ejecución automatizada y avisamos antes de borrar.
// Si necesitás proteger datos reales, apuntá las variables de entorno a un
// proyecto de pruebas antes de lanzar Playwright.
export default function globalSetup() {
  console.warn(
    `⚠️  global-setup: se van a purgar los datos operativos de "${process.env.VITE_FIREBASE_PROJECT_ID ?? "(proyecto sin definir)"}" antes de la suite E2E.`,
  );

  execSync("bun run purge -- --yes && bun run seed", {
    stdio: "inherit",
    cwd: process.cwd(),
    env: process.env,
    timeout: 120_000,
  });
}
