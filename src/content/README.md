# Content

This folder is the content layer of Dock Dashboard. Change these files to reuse
the same shell, auth, roles and dashboard for another project without touching
the React components.

## Files

- `site.json` — brand, scope line and document title.
- `dashboard.json` — dashboard title, subtitle and section labels.

## What is reusable as-is

- Sidebar + account dropdown (groups, theme selector, logout).
- Login / signup / roles (admin, responsable, operario).
- Personal panel (`/me`), time clock (`/timesheet`), payslips (`/payslips`),
  account (`/account`).
- Dashboard layout (KPI cards, charts, table).

## What is domain-specific

- Firestore collections: `albaranes`, `shrinkageEvents`, `machines`,
  `wasteRecords`, `expenses`, `timeEntries`, `payslips`, `members`.
- `src/domain/` types and calculations.
- `src/data/seed.ts` demo data.
- Firestore rules and the Worker API.

For another vertical, keep the shell/auth/dashboard and replace the domain
modules + collections. The content JSON is the first place to change the
visible copy.

## Markdown

Long-form copy (help, onboarding, policies) can live here as `.md` files. Import
it only if the screen needs it; the current dashboard copy is structured JSON
because it maps to specific UI slots.
