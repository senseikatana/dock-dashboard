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
 */
export interface WarehouseRepository {
  // Read
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
