import {
  checkNote,
  type DeliveryNote,
  type Machine,
  type NoteCheck,
  type ShrinkageEvent,
} from "../domain/reception";
import type { Expense, WasteRecord } from "../domain/operations";
import type { Member } from "../domain/members";
import type { Payslip, ShiftKind, TimeEntry } from "../domain/workday";
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
      members: [...seed.members],
      timeEntries: [...seed.timeEntries],
      payslips: [...seed.payslips],
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

  async updateNote(
    noteId: string,
    patch: Partial<DeliveryNote>,
  ): Promise<void> {
    const note = this.data.notes.find((entry) => entry.id === noteId);
    if (!note) throw new Error(`Unknown delivery note ${noteId}`);
    Object.assign(note, patch);
  }

  async deleteNote(noteId: string): Promise<void> {
    const index = this.data.notes.findIndex((entry) => entry.id === noteId);
    if (index === -1) throw new Error(`Unknown delivery note ${noteId}`);
    this.data.notes.splice(index, 1);
  }

  async addShrinkageEvent(event: ShrinkageEvent): Promise<void> {
    this.data.shrinkageEvents.push(event);
  }

  async updateShrinkageEvent(
    eventId: string,
    patch: Partial<ShrinkageEvent>,
  ): Promise<void> {
    const event = this.data.shrinkageEvents.find(
      (entry) => entry.id === eventId,
    );
    if (!event) throw new Error(`Unknown shrinkage event ${eventId}`);
    Object.assign(event, patch);
  }

  async deleteShrinkageEvent(eventId: string): Promise<void> {
    const index = this.data.shrinkageEvents.findIndex(
      (entry) => entry.id === eventId,
    );
    if (index === -1) throw new Error(`Unknown shrinkage event ${eventId}`);
    this.data.shrinkageEvents.splice(index, 1);
  }

  async addMachine(machine: Machine): Promise<void> {
    this.data.machines.push(machine);
  }

  async updateMachine(
    machineId: string,
    patch: Partial<Machine>,
  ): Promise<void> {
    const machine = this.data.machines.find((entry) => entry.id === machineId);
    if (!machine) throw new Error(`Unknown machine ${machineId}`);
    Object.assign(machine, patch);
  }

  async deleteMachine(machineId: string): Promise<void> {
    const index = this.data.machines.findIndex(
      (entry) => entry.id === machineId,
    );
    if (index === -1) throw new Error(`Unknown machine ${machineId}`);
    this.data.machines.splice(index, 1);
  }

  async addWasteRecord(record: WasteRecord): Promise<void> {
    this.data.wasteRecords.push(record);
  }

  async updateWasteRecord(
    recordId: string,
    patch: Partial<WasteRecord>,
  ): Promise<void> {
    const record = this.data.wasteRecords.find(
      (entry) => entry.id === recordId,
    );
    if (!record) throw new Error(`Unknown waste record ${recordId}`);
    Object.assign(record, patch);
  }

  async deleteWasteRecord(recordId: string): Promise<void> {
    const index = this.data.wasteRecords.findIndex(
      (entry) => entry.id === recordId,
    );
    if (index === -1) throw new Error(`Unknown waste record ${recordId}`);
    this.data.wasteRecords.splice(index, 1);
  }

  async addExpense(expense: Expense): Promise<void> {
    this.data.expenses.push(expense);
  }

  async updateExpense(
    expenseId: string,
    patch: Partial<Expense>,
  ): Promise<void> {
    const expense = this.data.expenses.find((entry) => entry.id === expenseId);
    if (!expense) throw new Error(`Unknown expense ${expenseId}`);
    Object.assign(expense, patch);
  }

  async deleteExpense(expenseId: string): Promise<void> {
    const index = this.data.expenses.findIndex(
      (entry) => entry.id === expenseId,
    );
    if (index === -1) throw new Error(`Unknown expense ${expenseId}`);
    this.data.expenses.splice(index, 1);
  }

  async loadMembers(): Promise<Member[]> {
    return this.data.members.map((member) => ({ ...member }));
  }

  async addMember(member: Member): Promise<void> {
    this.data.members.push({ ...member });
  }

  async updateMember(memberId: string, patch: Partial<Member>): Promise<void> {
    const member = this.data.members.find((entry) => entry.id === memberId);
    if (!member) throw new Error(`Unknown member ${memberId}`);
    Object.assign(member, patch);
  }

  async deleteMember(memberId: string): Promise<void> {
    const index = this.data.members.findIndex((entry) => entry.id === memberId);
    if (index === -1) throw new Error(`Unknown member ${memberId}`);
    this.data.members.splice(index, 1);
  }

  async loadTimeEntries(memberId: string): Promise<TimeEntry[]> {
    return this.data.timeEntries
      .filter((entry) => entry.memberId === memberId)
      .map((entry) => ({ ...entry }));
  }

  async clockIn(memberId: string, shift: ShiftKind): Promise<TimeEntry> {
    const now = new Date();
    const entry: TimeEntry = {
      id: `FIC-${crypto.randomUUID()}`,
      memberId,
      date: now.toISOString().slice(0, 10),
      shift,
      clockIn: now.toISOString(),
      clockOut: null,
    };
    this.data.timeEntries.push(entry);
    return { ...entry };
  }

  async clockOut(entryId: string): Promise<void> {
    const entry = this.data.timeEntries.find((item) => item.id === entryId);
    if (!entry) throw new Error(`Unknown time entry ${entryId}`);
    entry.clockOut = new Date().toISOString();
  }

  async loadPayslips(memberId?: string): Promise<Payslip[]> {
    return this.data.payslips
      .filter((entry) => !memberId || entry.memberId === memberId)
      .map((entry) => ({ ...entry }));
  }

  async addPayslip(payslip: Payslip): Promise<void> {
    this.data.payslips.push({ ...payslip });
  }

  async updatePayslip(
    payslipId: string,
    patch: Partial<Payslip>,
  ): Promise<void> {
    const payslip = this.data.payslips.find((entry) => entry.id === payslipId);
    if (!payslip) throw new Error(`Unknown payslip ${payslipId}`);
    Object.assign(payslip, patch);
  }

  async deletePayslip(payslipId: string): Promise<void> {
    const index = this.data.payslips.findIndex(
      (entry) => entry.id === payslipId,
    );
    if (index === -1) throw new Error(`Unknown payslip ${payslipId}`);
    this.data.payslips.splice(index, 1);
  }

  async purgeSeed(): Promise<void> {
    this.data.notes = [];
    this.data.shrinkageEvents = [];
    this.data.machines = [];
    this.data.wasteRecords = [];
    this.data.expenses = [];
    this.data.timeEntries = [];
    this.data.payslips = [];
  }

  async resetSeed(today: string): Promise<void> {
    const { buildSeed } = await import("./seed");
    const seed = buildSeed(today);
    this.data.notes = seed.notes;
    this.data.shrinkageEvents = seed.shrinkageEvents;
    this.data.machines = seed.machines;
    this.data.wasteRecords = seed.wasteRecords;
    this.data.expenses = seed.expenses;
    this.data.timeEntries = seed.timeEntries;
    this.data.payslips = seed.payslips;
  }
}
