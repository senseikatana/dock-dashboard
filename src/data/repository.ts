import type { Expense, WasteRecord } from "../domain/operations";
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
 * Adapters: in-memory demo store today, InsForge (Postgres) when a project slot frees up.
 */
export interface WarehouseRepository {
  loadShift(today: string): Promise<ShiftData>;
  validateNote(noteId: string, checkedAt: string): Promise<NoteCheck>;
  addNote(note: DeliveryNote): Promise<void>;
}
