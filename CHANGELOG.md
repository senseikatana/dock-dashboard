# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.2.3] - 2026-10-25

Highlights: feat(auth): acceso con Google y GitHub, y ninguna contraseña en el repo and fix(workday): corregir tres bordes y cubrir el módulo con tests, plus 7 more changes.

- 🚀 feat(auth): acceso con Google y GitHub, y ninguna contraseña en el repo `d2dc070`
  - `AGENTS.md`
  - `e2e/recepcion.spec.ts`
  - `scripts/create-auth-users.mjs`
  - `scripts/purge-firestore.mjs`
  - `scripts/seed-firestore.mjs`
  - `src/auth/AuthProvider.tsx`
  - `src/auth/context.ts`
  - `src/screens/SignIn.tsx`
  - `src/styles/app.css`
  - `workers/dock-dashboard/src/index.ts`
- 🤖 ci: gate de calidad en cada push y limpia ignorePatterns obsoletos `f18098d`
  - `.github/workflows/ci.yml`
  - `.oxlintrc.json`
- 🚀 feat(ui): avisos de error y confirmación en los borrados de las pantallas `c2cd0ba`
  - `src/data/useShift.ts`
  - `src/screens/CuadroDeMando.tsx`
  - `src/screens/Gastos.tsx`
  - `src/screens/Incidencias.tsx`
  - `src/screens/Maquinaria.tsx`
  - `src/screens/Recepcion.tsx`
  - `src/screens/Residuos.tsx`
  - `src/ui/dialogs.ts`
- 🐛 fix(workday): corregir tres bordes y cubrir el módulo con tests `11e8539`
  - `src/domain/workday.test.ts`
  - `src/domain/workday.ts`
- 📝 docs(data): la carga no es "del turno" y ahora lo dice `6c98525`
  - `src/App.tsx`
  - `src/data/repository.ts`
- 🐛 fix(data): borrados idempotentes en el adaptador en memoria `6c0615b`
  - `src/data/memoryRepository.test.ts`
  - `src/data/memoryRepository.ts`
  - `src/data/repository.ts`
- 🐛 fix(dates): usar fecha civil local en lugar de UTC `f76084f`
  - `scripts/seed-firestore.mjs`
  - `src/App.tsx`
  - `src/data/firebaseRepository.ts`
  - `src/data/memoryRepository.ts`
  - `src/domain/date.test.ts`
  - `src/domain/date.ts`
  - `src/screens/MyPanel.tsx`
  - `src/screens/Recepcion.tsx`
- 🐛 fix(scripts): confirmación antes de purgar Firestore `0b42628`
  - `e2e/global-setup.ts`
  - `scripts/purge-firestore.mjs`
- 🚀 feat: improve interactive purge script to prompt for confirmation `31ad4bf`
  - `scripts/purge-firestore.mjs`

## [0.2.2] - 2026-10-25

Highlights: feat: updates content, routes, and theme for the dashboard (Cuadro de mando and fix(auth): gate reads on the role claim and close the signup race.

- 🐛 fix(auth): gate reads on the role claim and close the signup race `9af4467`
  - `AGENTS.md`
  - `DEPLOY.md`
  - `firestore.rules`
  - `src/auth/AuthProvider.tsx`
  - `src/auth/context.ts`
  - `src/data/avatarStorage.ts`
  - `src/screens/Account.tsx`
  - `src/screens/SignIn.tsx`
  - `workers/dock-dashboard/.dev.vars.example`
  - `workers/dock-dashboard/src/index.ts`
  - `workers/dock-dashboard/wrangler.jsonc`
- 🚀 feat: updates content, routes, and theme for the dashboard (Cuadro de mando `779ef4f`
  - `AGENTS.md`
  - `bun.lock`
  - `e2e/recepcion.spec.ts`
  - `index.html`
  - `package.json`
  - `src/App.tsx`
  - `src/auth/AuthProvider.tsx`
  - `src/auth/context.ts`
  - `src/components/Shell.tsx`
  - `src/content/README.md`
  - `src/content/dashboard.json`
  - `src/content/site.json`
  - `src/domain/format.ts`
  - `src/screens/Account.tsx`
  - `src/screens/Ajustes.tsx`
  - `src/screens/CuadroDeMando.tsx`
  - `src/screens/SignIn.tsx`
  - `src/styles/app.css`
  - `src/ui/theme.ts`
  - `vite.config.ts`
  - `workers/dock-dashboard/src/index.ts`
- 🐛 fix: update AGENTS.md with revised design guidelines and sidebar account po `111896e`
- 🚀 feat: update configuration files and implement Firebase Repository `b7d10c8`
- 🚀 feat: implement Firebase migration plan with Firestore repository and add c `174664f`
- 📦 build(bun.lock): add prepare, typecheck, @types/bun and vitest to package.json `9cd4f2c`

## [0.2.1] - 2026-10-24

Highlights: fix: update AGENTS.md with revised design guidelines and sidebar account po.

- [x] 🐛 fix: update AGENTS.md with revised design guidelines and sidebar account po
  - `AGENTS.md`
- [x] 🚀 feat: update configuration files and implement Firebase Repository
- [x] 🚀 feat: implement Firebase migration plan with Firestore repository and add c
- [x] 📦 build(bun.lock): add prepare, typecheck, @types/bun and vitest to package.json
- [x] 🔹 ]7;file://localhost/home/senseikatana/Proyectos/panel-olayarn add v1.22.22 [1/4] Resolving packages... [2/4] Fetching packages... [3/4] Linking dependencies... [4/4] Building fresh packages... success Saved lockfile. success Saved 5 new dependencies. info Direct dependencies ├─ husky@9.1.7 ├─ lint-staged@17.6.0 └─ prettier@3.9.10 info All dependencies ├─ husky@9.1.7 ├─ lint-staged@17.6.0 ├─ prettier@3.9.10 ├─ string-argv@0.3.2 └─ yaml@2.9.1 $ husky Done in 1.89s. ]7;file://localhost/home/senseikatana/Proyectos/panel-ola]7;file://localhost/home/senseikatana/Proyectos/panel-olafix: update receiver mode: Operate, add albaran validation and reporting

## [0.2.0] - 2026-10-24

Highlights: feat: update configuration files and implement Firebase Repository.

- [x] 🚀 feat: update configuration files and implement Firebase Repository
  - `.env.example`
  - `.gitignore`
  - `.oxlintrc.json`
  - `AGENTS.md`
  - `DEPLOY.md`
  - `DESIGN.md`
  - `PRODUCT.md`
  - `README.md`
  - `bun.lock`
  - `e2e/global-setup.ts`
  - `e2e/recepcion.spec.ts`
  - `firebase.json`
  - `firestore.rules`
  - `index.html`
  - `package-lock.json`
  - `package.json`
  - `playwright.config.ts`
  - `scripts/create-auth-users.mjs`
  - `scripts/purge-firestore.mjs`
  - `scripts/seed-firestore.mjs`
  - `scripts/set-role-claims.mjs`
  - `src/App.tsx`
  - `src/auth/AuthProvider.tsx`
  - `src/auth/access.test.ts`
  - `src/auth/access.ts`
  - `src/auth/context.ts`
  - `src/auth/useAuth.ts`
  - `src/components/AlbaranesTable.tsx`
  - `src/components/KpiStrip.tsx`
  - `src/components/PayslipsAdmin.tsx`
  - `src/components/Shell.tsx`
  - `src/data/authProvisioner.ts`
  - `src/data/avatarStorage.ts`
  - `src/data/firebaseClient.ts`
  - `src/data/firebaseRepository.ts`
  - `src/data/memoryRepository.test.ts`
  - `src/data/memoryRepository.ts`
  - `src/data/repository.ts`
  - `src/data/seed.ts`
  - `src/domain/members.ts`
  - `src/domain/reception.ts`
  - `src/domain/workday.ts`
  - `src/main.tsx`
  - `src/screens/Account.tsx`
  - `src/screens/Ajustes.tsx`
  - `src/screens/CuadroDeMando.tsx`
  - `src/screens/Gastos.tsx`
  - `src/screens/Incidencias.tsx`
  - `src/screens/Maquinaria.tsx`
  - `src/screens/MyPanel.tsx`
  - `src/screens/Payslips.tsx`
  - `src/screens/Recepcion.tsx`
  - `src/screens/Residuos.tsx`
  - `src/screens/SignIn.tsx`
  - `src/screens/Timesheet.tsx`
  - `src/styles/app.css`
  - `src/styles/tokens.css`
  - `src/ui/dialogs.ts`
  - `src/ui/theme.ts`
  - `vite.config.ts`
  - `workers/dock-dashboard/.dev.vars.example`
  - `workers/dock-dashboard/bun.lock`
  - `workers/dock-dashboard/package.json`
  - `workers/dock-dashboard/src/index.ts`
  - `workers/dock-dashboard/tsconfig.json`
  - `workers/dock-dashboard/wrangler.dev.jsonc`
  - `workers/dock-dashboard/wrangler.jsonc`
- [x] 🚀 feat: implement Firebase migration plan with Firestore repository and add c
- [x] 📦 build(bun.lock): add prepare, typecheck, @types/bun and vitest to package.json
- [x] 🔹 ]7;file://localhost/home/senseikatana/Proyectos/panel-olayarn add v1.22.22 [1/4] Resolving packages... [2/4] Fetching packages... [3/4] Linking dependencies... [4/4] Building fresh packages... success Saved lockfile. success Saved 5 new dependencies. info Direct dependencies ├─ husky@9.1.7 ├─ lint-staged@17.6.0 └─ prettier@3.9.10 info All dependencies ├─ husky@9.1.7 ├─ lint-staged@17.6.0 ├─ prettier@3.9.10 ├─ string-argv@0.3.2 └─ yaml@2.9.1 $ husky Done in 1.89s. ]7;file://localhost/home/senseikatana/Proyectos/panel-ola]7;file://localhost/home/senseikatana/Proyectos/panel-olafix: update receiver mode: Operate, add albaran validation and reporting

## [0.1.0] - 2026-10-24

Highlights: feat: implement Firebase migration plan with Firestore repository and add c, plus 2 more changes.

- [x] 🚀 feat: implement Firebase migration plan with Firestore repository and add c
  - `.env.example`
  - `.firebaserc`
  - `.gitignore`
  - `AGENTS.md`
  - `bun.lock`
  - `firebase.json`
  - `firestore.indexes.json`
  - `firestore.rules`
  - `package.json`
  - `scripts/seed-firestore.mjs`
  - `src/App.tsx`
  - `src/data/firebaseRepository.ts`
  - `src/screens/CuadroDeMando.tsx`
- [x] 📦 build(bun.lock): add prepare, typecheck, @types/bun and vitest to package.json
  - `bun.lock`
  - `package.json`
  - `yarn.lock`
- [x] 🔹 ]7;file://localhost/home/senseikatana/Proyectos/panel-olayarn add v1.22.22 [1/4] Resolving packages... [2/4] Fetching packages... [3/4] Linking dependencies... [4/4] Building fresh packages... success Saved lockfile. success Saved 5 new dependencies. info Direct dependencies ├─ husky@9.1.7 ├─ lint-staged@17.6.0 └─ prettier@3.9.10 info All dependencies ├─ husky@9.1.7 ├─ lint-staged@17.6.0 ├─ prettier@3.9.10 ├─ string-argv@0.3.2 └─ yaml@2.9.1 $ husky Done in 1.89s. ]7;file://localhost/home/senseikatana/Proyectos/panel-ola]7;file://localhost/home/senseikatana/Proyectos/panel-olafix: update receiver mode: Operate, add albaran validation and reporting
  - `.gitignore`
  - `.husky/pre-commit`
  - `.impeccable/brief-body.md`
  - `.impeccable/decision-payload.json`
  - `.impeccable/design.json`
  - `.impeccable/mocks/decision/albaran-sellado.html`
  - `.impeccable/mocks/decision/canon.html`
  - `.impeccable/mocks/decision/challenger-terreno.html`
  - `.impeccable/mocks/decision/materia-obra.html`
  - `.impeccable/review/desktop-stamped.png`
  - `.impeccable/review/desktop.png`
  - `.impeccable/review/mobile.png`
  - `.impeccable/review/tablet.png`
  - `.impeccable/surfaces/src-app-tsx.md`
  - `.oxlintrc.json`
  - `.taste-skill/app/direction.json`
  - `.taste-skill/inspect/desktop-fold.jpg`
  - `.taste-skill/inspect/desktop-page-01.jpg`
  - `.taste-skill/inspect/mobile-fold.jpg`
  - `.taste-skill/inspect/mobile-page-01.jpg`
  - `.taste-skill/inspect/report.json`
  - `.taste-skill/inspect/tablet-fold.jpg`
  - `.taste-skill/inspect/tablet-page-01.jpg`
  - `DESIGN.md`
  - `PRODUCT.md`
  - `README.md`
  - `e2e/recepcion.spec.ts`
  - `index.html`
  - `package-lock.json`
  - `package.json`
  - `playwright.config.ts`
  - `public/favicon.svg`
  - `public/icons.svg`
  - `scripts/capture.mjs`
  - `src/App.tsx`
  - `src/components/AlbaranesTable.test.tsx`
  - `src/components/AlbaranesTable.tsx`
  - `src/components/KpiStrip.test.tsx`
  - `src/components/KpiStrip.tsx`
  - `src/components/MermaRail.tsx`
  - `src/components/Shell.tsx`
  - `src/data/memoryRepository.test.ts`
  - `src/data/memoryRepository.ts`
  - `src/data/repository.ts`
  - `src/data/seed.test.ts`
  - `src/data/seed.ts`
  - `src/data/useShift.ts`
  - `src/domain/format.test.ts`
  - `src/domain/format.ts`
  - `src/domain/operations.test.ts`
  - `src/domain/operations.ts`
  - `src/domain/reception.test.ts`
  - `src/domain/reception.ts`
  - `src/main.tsx`
  - `src/screens/CuadroDeMando.tsx`
  - `src/screens/Gastos.tsx`
  - `src/screens/Incidencias.tsx`
  - `src/screens/Maquinaria.tsx`
  - `src/screens/Recepcion.tsx`
  - `src/screens/Residuos.tsx`
  - `src/styles/app.css`
  - `src/styles/tokens.css`
  - `src/test/setup.ts`
  - `test-results/.last-run.json`
  - `tsconfig.app.json`
  - `tsconfig.json`
  - `tsconfig.node.json`
  - `vite.config.ts`
  - `vitest.config.ts`
  - `yarn.lock`
