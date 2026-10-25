import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import { firebaseDb } from "./firebaseClient";
import type { WarehouseRepository, ShiftData } from "./repository";
import type { DeliveryNote, NoteCheck } from "../domain/reception";
import type { Machine, ShrinkageEvent } from "../domain/reception";
import type { Expense, WasteRecord } from "../domain/operations";
import type { Member } from "../domain/members";
import type { Payslip, ShiftKind, TimeEntry } from "../domain/workday";
import { checkNote } from "../domain/reception";
import { localDateIso } from "../domain/date";
import { buildSeed } from "./seed";

const NOTE_COLLECTION = "albaranes";
const SHRINKAGE_COLLECTION = "shrinkageEvents";
const MACHINE_COLLECTION = "machines";
const WASTE_COLLECTION = "wasteRecords";
const EXPENSE_COLLECTION = "expenses";
const MEMBER_COLLECTION = "members";
const TIME_COLLECTION = "timeEntries";
const PAYSLIP_COLLECTION = "payslips";

const ALL_COLLECTIONS = [
  NOTE_COLLECTION,
  SHRINKAGE_COLLECTION,
  MACHINE_COLLECTION,
  WASTE_COLLECTION,
  EXPENSE_COLLECTION,
  TIME_COLLECTION,
  PAYSLIP_COLLECTION,
];

export class FirebaseWarehouseRepository implements WarehouseRepository {
  private db: ReturnType<typeof getFirestore>;

  constructor() {
    this.db = firebaseDb();
  }

  // ── Read ────────────────────────────────────────────────

  async loadShift(_today: string): Promise<ShiftData> {
    const [notesSnap, shrinkageSnap, machinesSnap, wasteSnap, expensesSnap] =
      await Promise.all([
        getDocs(collection(this.db, NOTE_COLLECTION)),
        getDocs(collection(this.db, SHRINKAGE_COLLECTION)),
        getDocs(collection(this.db, MACHINE_COLLECTION)),
        getDocs(collection(this.db, WASTE_COLLECTION)),
        getDocs(collection(this.db, EXPENSE_COLLECTION)),
      ]);

    return {
      notes: notesSnap.docs.map((d) => d.data() as DeliveryNote),
      shrinkageEvents: shrinkageSnap.docs.map(
        (d) => d.data() as ShrinkageEvent,
      ),
      machines: machinesSnap.docs.map((d) => d.data() as Machine),
      wasteRecords: wasteSnap.docs.map((d) => d.data() as WasteRecord),
      expenses: expensesSnap.docs.map((d) => d.data() as Expense),
    };
  }

  // ── Delivery notes ──────────────────────────────────────

  async validateNote(noteId: string, checkedAt: string): Promise<NoteCheck> {
    const ref = doc(this.db, NOTE_COLLECTION, noteId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error(`Unknown delivery note ${noteId}`);
    const note = snap.data() as DeliveryNote;
    const check = checkNote(note, checkedAt);
    await updateDoc(ref, {
      status: check.verdict === "conforme" ? "validado" : "incidencia",
    });
    return check;
  }

  async addNote(note: DeliveryNote): Promise<void> {
    await setDoc(doc(this.db, NOTE_COLLECTION, note.id), note);
  }

  async updateNote(
    noteId: string,
    patch: Partial<DeliveryNote>,
  ): Promise<void> {
    const ref = doc(this.db, NOTE_COLLECTION, noteId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error(`Unknown delivery note ${noteId}`);
    await updateDoc(ref, patch);
  }

  async deleteNote(noteId: string): Promise<void> {
    await deleteDoc(doc(this.db, NOTE_COLLECTION, noteId));
  }

  // ── Shrinkage events ────────────────────────────────────

  async addShrinkageEvent(event: ShrinkageEvent): Promise<void> {
    await setDoc(doc(this.db, SHRINKAGE_COLLECTION, event.id), event);
  }

  async updateShrinkageEvent(
    eventId: string,
    patch: Partial<ShrinkageEvent>,
  ): Promise<void> {
    await updateDoc(doc(this.db, SHRINKAGE_COLLECTION, eventId), patch);
  }

  async deleteShrinkageEvent(eventId: string): Promise<void> {
    await deleteDoc(doc(this.db, SHRINKAGE_COLLECTION, eventId));
  }

  // ── Machinery ───────────────────────────────────────────

  async addMachine(machine: Machine): Promise<void> {
    await setDoc(doc(this.db, MACHINE_COLLECTION, machine.id), machine);
  }

  async updateMachine(
    machineId: string,
    patch: Partial<Machine>,
  ): Promise<void> {
    await updateDoc(doc(this.db, MACHINE_COLLECTION, machineId), patch);
  }

  async deleteMachine(machineId: string): Promise<void> {
    await deleteDoc(doc(this.db, MACHINE_COLLECTION, machineId));
  }

  // ── Waste records ───────────────────────────────────────

  async addWasteRecord(record: WasteRecord): Promise<void> {
    await setDoc(doc(this.db, WASTE_COLLECTION, record.id), record);
  }

  async updateWasteRecord(
    recordId: string,
    patch: Partial<WasteRecord>,
  ): Promise<void> {
    await updateDoc(doc(this.db, WASTE_COLLECTION, recordId), patch);
  }

  async deleteWasteRecord(recordId: string): Promise<void> {
    await deleteDoc(doc(this.db, WASTE_COLLECTION, recordId));
  }

  // ── Expenses ────────────────────────────────────────────

  async addExpense(expense: Expense): Promise<void> {
    await setDoc(doc(this.db, EXPENSE_COLLECTION, expense.id), expense);
  }

  async updateExpense(
    expenseId: string,
    patch: Partial<Expense>,
  ): Promise<void> {
    await updateDoc(doc(this.db, EXPENSE_COLLECTION, expenseId), patch);
  }

  async deleteExpense(expenseId: string): Promise<void> {
    await deleteDoc(doc(this.db, EXPENSE_COLLECTION, expenseId));
  }

  // ── Company members ─────────────────────────────────────

  async loadMembers(): Promise<Member[]> {
    const snapshot = await getDocs(collection(this.db, MEMBER_COLLECTION));
    return snapshot.docs.map((entry) => entry.data() as Member);
  }

  async addMember(member: Member): Promise<void> {
    await setDoc(doc(this.db, MEMBER_COLLECTION, member.id), member);
  }

  async updateMember(memberId: string, patch: Partial<Member>): Promise<void> {
    await updateDoc(doc(this.db, MEMBER_COLLECTION, memberId), patch);
  }

  async deleteMember(memberId: string): Promise<void> {
    await deleteDoc(doc(this.db, MEMBER_COLLECTION, memberId));
  }

  // ── Time tracking ───────────────────────────────────────

  async loadTimeEntries(memberId: string): Promise<TimeEntry[]> {
    const snapshot = await getDocs(
      query(
        collection(this.db, TIME_COLLECTION),
        where("memberId", "==", memberId),
      ),
    );
    return snapshot.docs.map((entry) => entry.data() as TimeEntry);
  }

  async clockIn(memberId: string, shift: ShiftKind): Promise<TimeEntry> {
    const now = new Date();
    const entry: TimeEntry = {
      id: `FIC-${crypto.randomUUID()}`,
      memberId,
      date: localDateIso(now),
      shift,
      clockIn: now.toISOString(),
      clockOut: null,
    };
    await setDoc(doc(this.db, TIME_COLLECTION, entry.id), entry);
    return entry;
  }

  async clockOut(entryId: string): Promise<void> {
    await updateDoc(doc(this.db, TIME_COLLECTION, entryId), {
      clockOut: new Date().toISOString(),
    });
  }

  // ── Payslips ────────────────────────────────────────────

  async loadPayslips(memberId?: string): Promise<Payslip[]> {
    const source = memberId
      ? query(
          collection(this.db, PAYSLIP_COLLECTION),
          where("memberId", "==", memberId),
        )
      : collection(this.db, PAYSLIP_COLLECTION);
    const snapshot = await getDocs(source);
    return snapshot.docs.map((entry) => entry.data() as Payslip);
  }

  async addPayslip(payslip: Payslip): Promise<void> {
    await setDoc(doc(this.db, PAYSLIP_COLLECTION, payslip.id), payslip);
  }

  async updatePayslip(
    payslipId: string,
    patch: Partial<Payslip>,
  ): Promise<void> {
    await updateDoc(doc(this.db, PAYSLIP_COLLECTION, payslipId), patch);
  }

  async deletePayslip(payslipId: string): Promise<void> {
    await deleteDoc(doc(this.db, PAYSLIP_COLLECTION, payslipId));
  }

  // ── Demo-data lifecycle ─────────────────────────────────

  async purgeSeed(): Promise<void> {
    await Promise.all(
      ALL_COLLECTIONS.map(async (collectionName) => {
        const snapshot = await getDocs(collection(this.db, collectionName));
        await Promise.all(
          snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref)),
        );
      }),
    );
  }

  async resetSeed(today: string): Promise<void> {
    await this.purgeSeed();
    const seed = buildSeed(today);
    const seeds: Array<[string, Array<{ id: string }>]> = [
      [NOTE_COLLECTION, seed.notes],
      [SHRINKAGE_COLLECTION, seed.shrinkageEvents],
      [MACHINE_COLLECTION, seed.machines],
      [WASTE_COLLECTION, seed.wasteRecords],
      [EXPENSE_COLLECTION, seed.expenses],
      [TIME_COLLECTION, seed.timeEntries],
      [PAYSLIP_COLLECTION, seed.payslips],
    ];
    await Promise.all(
      seeds.flatMap(([collectionName, docs]) =>
        docs.map((entry) =>
          setDoc(doc(this.db, collectionName, entry.id), entry, {
            merge: true,
          }),
        ),
      ),
    );
  }
}
