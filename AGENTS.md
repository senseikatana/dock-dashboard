# Dock Dashboard — Agent Instructions

## Stack & Commands

| Task                       | Command                                               |
| -------------------------- | ----------------------------------------------------- |
| Dev server                 | `bun dev` (Vite)                                      |
| Build                      | `bun run build` (`tsc -b` + `vite build`)             |
| Unit tests                 | `bun run test` (**Vitest**, not Bun's runner)         |
| Single test                | `bun run test src/components/AlbaranesTable.test.tsx` |
| E2E                        | `npx playwright test`                                 |
| Lint                       | `bun run lint` (oxlint)                               |
| Typecheck                  | `bun check`                                           |
| Seguir datos demo          | `bun run seed`                                        |
| Purgar Firestore           | `bun run purge`                                       |
| Crear usuarios Auth        | `bun run auth:users`                                  |
| Sincronizar roles a claims | `bun run auth:sync-roles`                             |
| Deploy Worker (subpath)    | `bun run deploy:cf`                                   |
| Deploy Pages (subdomain)   | `bun run deploy:pages`                                |

**Gotcha:** `bun test` invoca el runner nativo de Bun y falla con `document is not defined`. Usá siempre `bun run test`.

Order before commit: `bun run lint` → `bun check` → `bun run test`.

## Architecture

- Vite + React 19 + TypeScript 6 (project refs `tsconfig.app.json` / `tsconfig.node.json`).
- **Backend: Firebase Firestore** (reemplaza InsForge; `@insforge/sdk` ya no se usa).
- `src/data/repository.ts` defines the `WarehouseRepository` seam — keep both adapters in sync when changing it.
- `FirebaseWarehouseRepository` (`src/data/firebaseRepository.ts`) is the production adapter; `MemoryWarehouseRepository` is the in-memory fallback used by tests.
- Collections: `albaranes`, `shrinkageEvents`, `machines`, `wasteRecords`, `expenses`, `members`, `timeEntries`, `payslips`. Document IDs equal domain IDs.
- Firebase project `panel-ola`; web app `panel-ola-web`; config in `.env` (gitignored, real values present) and `.firebaserc`.
- CRUD is wired on every screen: Recepcion (albaranes), Incidencias (mermas), Maquinaria, Residuos, Gastos, Ajustes (miembros + nóminas), and the personal panel (`/me`, `/timesheet`, `/payslips`, `/account`). Dashboard has a purge button only; restore demo data with `bun run seed` (no restore button by design).
- Member settings live in `src/screens/Ajustes.tsx` + `src/domain/members.ts` (roles: admin/responsable/operario; departments; activo/inactivo). Payslip admin lives in `src/components/PayslipsAdmin.tsx`. Do NOT introduce Keystatic: it is a Git-based content CMS, not a runtime admin for Firestore records.
- Auth: Firebase Auth email/password (`firebase.json` → `auth.providers.emailPassword`, deployed with `firebase deploy --only auth`). `AuthProvider` resolves the Firestore member by email; routes are guarded by `src/auth/access.ts`.
- Signup: the login screen has “Crear cuenta”. It calls the Worker `POST /api/signup`, which creates the Auth user + Firestore member + role claim. If the `members` collection is empty, the first signup becomes `admin` **only if it sends the `BOOTSTRAP_TOKEN` install code** (`wrangler secret put BOOTSTRAP_TOKEN`); otherwise it is `operario`. Without the secret configured, the first signup is refused with `503` (`bootstrap_unconfigured`). No demo credentials are required once an admin exists.
- Role access: `admin` → all routes incl. `/settings`; `responsable` → all except settings; `operario` → personal routes + `/reception` + `/incidents`. `/` redirects to `/dashboard` for admin/responsable and `/me` for operario.
- Firestore rules enforce roles via the `role` custom claim. Every read requires `provisioned()` — i.e. a token carrying one of the three roles, which only the Admin SDK can mint. A bare `accounts:signUp` account has no claim and therefore no access at all. Each user can update only their own `name`, `avatarUrl` and `email`; admin edits everything. Fichajes and nóminas are scoped to the member. **Do not remove `email` from the self-editable set until the member lookup moves from `email` to `uid`** (`AuthProvider.findMemberByEmail` + `Account.saveEmail`): removing it makes that write fail _after_ `updateEmail`, orphaning the member doc and locking the user out.
- After changing a member role, run `bun run auth:sync-roles` (and the user must re-login/refresh token) so the claim matches.
- New member flow: signup, or create in `/settings` then `bun run auth:users` + `bun run auth:sync-roles`.
- Routes are English: `/me`, `/timesheet`, `/payslips`, `/account`, `/reception`, `/dashboard`, `/incidents`, `/machinery`, `/waste`, `/expenses`, `/settings`. Spanish legacy paths redirect (`/nominas`, `/fichaje`, `/ajustes`, etc.).
- Content layer: `src/content/site.json` (brand/scope/title) and `src/content/dashboard.json` (dashboard/KPI/chart labels). `src/content/README.md` explains what is reusable vs domain-specific. Change content there before touching components.
- Demo-data lifecycle lives in the repository: `purgeSeed()` wipes the seven operational collections (albaranes, shrinkage, machines, waste, expenses, timeEntries, payslips) and preserves `members` so nobody loses access; `resetSeed(today)` rebuilds operational data from `buildSeed(today)`.
- Confirmations and success messages use SweetAlert2 via `src/ui/dialogs.ts` (`confirmDestructive`, `toastSuccess`). Do not use native `alert`/`confirm`.

## UI / Design Contract

`DESIGN.md` is the source of truth for the core app. Non-negotiables:

- One chroma only (Signal Orange); no shadows/glows/gradients. The sidebar account popover is the one exception: soft shadow + icons, HyperUI-style.
- Radius by rank: sheet 16 → card 8 → control 6 → chip 4; the account popover uses 8px.
- Figures in Barlow Condensed with tabular nums; prose in Archivo.
- Status = rubber stamp (verdict) or same-hue tinted pill (state).
- One primary action per screen; loading/empty = dashed slot with words.
- Navigation lives in the sidebar account dropdown, grouped in collapsible `<details>` sections (Personal / Operaciones / Administración), not as separate rail links. The rail starts collapsed; the dashboard stats are the default view for admin/responsable. Mobile keeps a bottom nav with the four personal routes.
- Theme selector: light / dark / system, persisted in `localStorage` (`dock:theme`), applied via `data-theme` on `<html>`; dark tokens live in `tokens.css`. Do not change the orange/cement identity when touching themes.
- UI copy is Spanish (es-ES).

### Dashboard (Cuadro de mando)

- Built from the HyperUI analytics template: Tailwind v4 utilities + Chart.js, integrated into the existing Shell (do not duplicate the sidebar).
- Tailwind is loaded via `@tailwindcss/vite`; `app.css` imports only `tailwindcss/theme.css` + `tailwindcss/utilities.css` (no preflight) so the bespoke CSS is not reset.
- Charts: line/bar equivalent for "Albaranes por muelle", donut for "Albaranes por estado", sparkline in the first KPI. Chart.js canvases need `role="img"` + `aria-label`.
- Keep the dashboard data derived from Firestore rows; do not hardcode totals.

## Firebase / Cloudflare Deploy

```bash
firebase deploy --only firestore:rules,firestore:indexes
firebase deploy --only auth
```

- `firebase.json` points indexes to `firestore.indexes.json` (must contain an `indexes` array with `fieldPath` entries).
- Firestore rules are role-based via the `role` custom claim; there is no open access.
- After changing seed data: `bun run purge` then `bun run seed`. There is intentionally no restore button in the dashboard.

### Cloudflare

- **Canonical deploy:** Worker `dock-dashboard` at `samuraicoder.dev/apps/dock-dashboard/` (base `/apps/dock-dashboard/`), plus API under `/apps/dock-dashboard/api/*`. The route only matches that prefix.
- **Pages** project `dock-dashboard` (`https://dock-dashboard-6wu.pages.dev`) is an optional preview/mirror; no custom subdomain is attached.
- **DNS requirement:** `samuraicoder.dev` needs a proxied record (A/CNAME/AAAA) pointing to the origin. The Worker route is already attached; without the root record it cannot resolve. If the main site is not live yet, a proxied placeholder `AAAA 100::` works temporarily, but the rest of the domain will not serve content.
- Worker URL for direct/preview access: `https://dock-dashboard.senseikatanacom.workers.dev`.
- **Worker** `dock-dashboard` (`workers/dock-dashboard`) serves the subpath `samuraicoder.dev/apps/dock-dashboard/*` and the API:
  - `POST /apps/dock-dashboard/api/signup` → public signup; creates Auth user + member (operario). The first admin requires the `BOOTSTRAP_TOKEN` secret; the slot is claimed atomically in `config/bootstrap`.
  - `POST /apps/dock-dashboard/api/members` → creates Firebase Auth user + role claim (admin only).
  - `POST /apps/dock-dashboard/api/avatars` → upload to R2 (max 5 MB, images only).
  - `GET /apps/dock-dashboard/api/avatars/{key}` → serves the R2 object.
- R2 bucket `dock-dashboard-avatars`; Worker binding `AVATARS`.
- Firebase project ID remains `panel-ola` (immutable, internal). Service account `panel-ola-auth@panel-ola.iam.gserviceaccount.com` (roles `firebaseauth.admin` + `datastore.user`) stored as Worker secret `FIREBASE_SERVICE_ACCOUNT`. Never commit the key.
- Deploy commands: `bun run deploy:cf` (Worker + subpath) and `bun run deploy:pages` (Pages preview). `build:cf` uses base `/apps/dock-dashboard/`; `build:pages` uses base `/` and absolute Worker API URLs.
- Local API: run `bun run dev` in `workers/dock-dashboard` (uses `wrangler.dev.jsonc`, port 8787); Vite proxies `/apps/dock-dashboard/api` to it.

## Testing Notes

- Vitest: `globals: true`, `jsdom`, setup `src/test/setup.ts`, include `src/**/*.test.{ts,tsx}`.
- Playwright: baseURL `http://localhost:5173`, viewport 1440×900, `testDir ./e2e`. Requires `bun dev` running.
- `e2e/global-setup.ts` purges and reseeds Firestore before the suite (operational data only; members preserved). E2E uses `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` (defaults: `sergio@panel-ola.es` / `PanelOla2026!`).
- Seed/purge CLI sign in as `ADMIN_EMAIL` / `ADMIN_PASSWORD` (same defaults) because Firestore rules require admin claims.

## References

- `DESIGN.md` — tokens, components, do/don't.
- `PRODUCT.md` — product context (backend line updated to Firebase).
- `scripts/seed-firestore.mjs`, `scripts/purge-firestore.mjs`.
