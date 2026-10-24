import { execSync } from "node:child_process";

export default function globalSetup() {
  execSync("bun run purge && bun run seed", {
    stdio: "inherit",
    cwd: process.cwd(),
    env: process.env,
  });
}
