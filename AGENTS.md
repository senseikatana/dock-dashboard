# Panel OLA — Firebase Migration Plan (AGENTS.md)

Status: Firebase SDK 13.1.0, proyecto `panel-ola` creado (`projectId: panel-ola`, `appId: 1:334755916967:web:cdefda1d8e8da4763c3f82`), `.firebaserc` configurado. `firebase.json`, `firestore.rules`, `firestore.indexes.json` y `.env` (con credenciales reales) desplegados (`firebase deploy --only firestore:rules,firestore:indexes`). `FirebaseWarehouseRepository` implementado (`src/data/firebaseRepository.ts`). `App.tsx` usa `FirebaseWarehouseRepository` vía `useMemo`. `CuadroDeMando` mejorado (fecha real, tarjeta de gastos). `scripts/seed-firestore.mjs` corrió: 16 albaranes + 6 shrinkage + 9 machines + 6 waste + 8 expenses en Firestore. `bun check`: 0 errores. `firebase projects:create panel-ola` y `firebase apps:create web panel-ola-web` completados.

## Remaining for full deployment

- Provide `.env` with real `projectId` / `apiKey` (user has CLI/project)
- Run `firebase init firestore` / `firebase deploy`
- Seed Firestore collections (`albaranes`, `shrinkageEvents`, `machines`, `wasteRecords`, `expenses`)
- Verify `bun test` / `npx playwright test` with real data

## 🔄 Migration Plan

### 1. Add Firebase to Project

- `npm install firebase@10` (or `bun add firebase`)
- Add `firebase` to `devDependencies` in `package.json`
- Create `firebase.json` and `.env` for config

### 2. Implement Firestore Repository

Create `src/data/firebaseRepository.ts` that implements `WarehouseRepository` interface:

- **Firestore Collections**:
  - `albaranes`: DeliveryNote documents
  - `shrinkageEvents`: ShrinkageEvent documents
  - `machines`: Machine documents
  - `wasteRecords`: WasteRecord documents
  - `expenses`: Expense documents
- **Operations**:
  - `loadShift(today: string)`: Fetch all data for today's shift
  - `validateNote(noteId: string, checkedAt: string)`: Update note status
  - `addNote(note: DeliveryNote)`: Add new delivery note

### 3. Update App Entry Point

Modify `src/App.tsx`:

```tsx
// Replace:
const [repository] = useState(
  () => new MemoryWarehouseRepository(buildSeed(today)),
);

// With:
const repository = useMemo(() => new FirebaseWarehouseRepository(), []);
```

### 4. Dashboard Improvements (CuadroDeMando)

- Show real date instead of "mañana"
- Add expense summary card (daily totals)
- Show machinery operational status breakdown
- Improve layout with DESIGN.md rules (radius, spacing, flat design)

### 5. Design System Compliance

- Use DESIGN.md rules for visual elements:
  - Radius: 16px (sheet), 8px (card), 6px (control), 4px (chip)
  - Color: Signal Orange (#D95D2B) for primary actions
  - Status: Stamp for verdicts, tinted pills for states
  - Tables: Brick-course layout (44px rows, --rule-course at dock changes)

### 6. Testing

- Update Vitest tests to use Firebase emulators or mock data
- Playwright E2E tests should work with Firestore
- Verify CRUD operations pass tests

### 7. Rollback Plan

- Keep MemoryWarehouseRepository as fallback until fully validated
- Document exact migration steps in README
