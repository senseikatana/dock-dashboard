import type { Expense, WasteRecord } from "../domain/operations";
import type { Member } from "../domain/members";
import type { Payslip, ShiftKind, TimeEntry } from "../domain/workday";
import type {
  DeliveryNote,
  Machine,
  NoteCheck,
  ShrinkageEvent,
} from "../domain/reception";

export interface ShiftData {
  notes: DeliveryNote[];
  shrinkageEvents: ShrinkageEvent[];
  machines: Machine[];
  wasteRecords: WasteRecord[];
  expenses: Expense[];
}

/**
 * Seam between the panel and wherever the shift data lives.
 * Adapters: in-memory demo store today, Firebase/Firestore.
 *
 * Los dos adaptadores deben comportarse igual: los tests corren sobre
 * memory, no sobre Firestore, así que cualquier divergencia hace que la
 * suite describa algo que producción no hace.
 *
 * - `delete*` es idempotente: borrar un id que ya no existe resuelve sin
 *   error, igual que `deleteDoc` de Firestore.
 * - `update*` rechaza si el id no existe (Firestore `updateDoc` falla).
 */
export interface WarehouseRepository {
  /**
   * Devuelve TODOS los registros de las cinco colecciones operativas; no
   * filtra por `today` (los adaptadores lo ignoran, `today` queda como
   * argumento de cara a un recorte futuro).
   *
   * No se filtra porque `machines` ni siquiera tiene campo `date`, y
   * Gastos —vista de mes— y Recepción —histórico— necesitan el conjunto
   * completo. Quien necesita un recorte por fecha lo hace en cliente: el
   * cuadro de mando calcula su "hoy" con `entry.date === today`.
   */
  loadShift(today: string): Promise<ShiftData>;

  // Delivery notes (albaranes)
  validateNote(noteId: string, checkedAt: string): Promise<NoteCheck>;
  addNote(note: DeliveryNote): Promise<void>;
  updateNote(noteId: string, patch: Partial<DeliveryNote>): Promise<void>;
  deleteNote(noteId: string): Promise<void>;

  // Shrinkage events (incidencias/mermas)
  addShrinkageEvent(event: ShrinkageEvent): Promise<void>;
  updateShrinkageEvent(
    eventId: string,
    patch: Partial<ShrinkageEvent>,
  ): Promise<void>;
  deleteShrinkageEvent(eventId: string): Promise<void>;

  // Machinery
  addMachine(machine: Machine): Promise<void>;
  updateMachine(machineId: string, patch: Partial<Machine>): Promise<void>;
  deleteMachine(machineId: string): Promise<void>;

  // Waste records
  addWasteRecord(record: WasteRecord): Promise<void>;
  updateWasteRecord(
    recordId: string,
    patch: Partial<WasteRecord>,
  ): Promise<void>;
  deleteWasteRecord(recordId: string): Promise<void>;

  // Expenses
  addExpense(expense: Expense): Promise<void>;
  updateExpense(expenseId: string, patch: Partial<Expense>): Promise<void>;
  deleteExpense(expenseId: string): Promise<void>;

  // Company members
  loadMembers(): Promise<Member[]>;
  addMember(member: Member): Promise<void>;
  updateMember(memberId: string, patch: Partial<Member>): Promise<void>;
  deleteMember(memberId: string): Promise<void>;

  // Time tracking
  loadTimeEntries(memberId: string): Promise<TimeEntry[]>;
  clockIn(memberId: string, shift: ShiftKind): Promise<TimeEntry>;
  clockOut(entryId: string): Promise<void>;

  // Payslips
  loadPayslips(memberId?: string): Promise<Payslip[]>;
  addPayslip(payslip: Payslip): Promise<void>;
  updatePayslip(payslipId: string, patch: Partial<Payslip>): Promise<void>;
  deletePayslip(payslipId: string): Promise<void>;

  // Demo-data lifecycle
  purgeSeed(): Promise<void>;
  resetSeed(today: string): Promise<void>;
}
