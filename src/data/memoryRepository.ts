import {
  checkNote,
  type DeliveryNote,
  type NoteCheck,
} from "../domain/reception";
import type { ShiftData, WarehouseRepository } from "./repository";
import type { SeedData } from "./seed";

export class MemoryWarehouseRepository implements WarehouseRepository {
  private readonly data: SeedData;

  constructor(seed: SeedData) {
    this.data = {
      notes: seed.notes.map((note) => ({
        ...note,
        lines: note.lines.map((line) => ({ ...line })),
      })),
      shrinkageEvents: [...seed.shrinkageEvents],
      machines: [...seed.machines],
      wasteRecords: [...seed.wasteRecords],
      expenses: [...seed.expenses],
    };
  }

  async loadShift(_today: string): Promise<ShiftData> {
    return {
      notes: this.data.notes.map((note) => ({
        ...note,
        lines: [...note.lines],
      })),
      shrinkageEvents: [...this.data.shrinkageEvents],
      machines: [...this.data.machines],
      wasteRecords: [...this.data.wasteRecords],
      expenses: [...this.data.expenses],
    };
  }

  async validateNote(noteId: string, checkedAt: string): Promise<NoteCheck> {
    const note = this.data.notes.find((entry) => entry.id === noteId);
    if (!note) {
      throw new Error(`Unknown delivery note ${noteId}`);
    }

    const check = checkNote(note, checkedAt);
    note.status = check.verdict === "conforme" ? "validado" : "incidencia";
    return check;
  }

  async addNote(note: DeliveryNote): Promise<void> {
    this.data.notes.push({
      ...note,
      lines: note.lines.map((line) => ({ ...line })),
    });
  }
}
