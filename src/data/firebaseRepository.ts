import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import type { WarehouseRepository, ShiftData } from "./repository";
import type { DeliveryNote, NoteCheck } from "../domain/reception";
import type { Machine, ShrinkageEvent } from "../domain/reception";
import type { Expense, WasteRecord } from "../domain/operations";

export class FirebaseWarehouseRepository implements WarehouseRepository {
  private db: ReturnType<typeof getFirestore>;

  constructor() {
    if (getApps().length === 0) {
      initializeApp({
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
      });
    }
    this.db = getFirestore();
  }

  async loadShift(_today: string): Promise<ShiftData> {
    const notesSnap = await getDocs(collection(this.db, "albaranes"));
    const shrinkageSnap = await getDocs(collection(this.db, "shrinkageEvents"));
    const machinesSnap = await getDocs(collection(this.db, "machines"));
    const wasteSnap = await getDocs(collection(this.db, "wasteRecords"));
    const expensesSnap = await getDocs(collection(this.db, "expenses"));

    const notes: DeliveryNote[] = notesSnap.docs.map(
      (d) => d.data() as DeliveryNote,
    );
    const shrinkageEvents: ShrinkageEvent[] = shrinkageSnap.docs.map(
      (d) => d.data() as ShrinkageEvent,
    );
    const machines: Machine[] = machinesSnap.docs.map(
      (d) => d.data() as Machine,
    );
    const wasteRecords: WasteRecord[] = wasteSnap.docs.map(
      (d) => d.data() as WasteRecord,
    );
    const expenses: Expense[] = expensesSnap.docs.map(
      (d) => d.data() as Expense,
    );

    return { notes, shrinkageEvents, machines, wasteRecords, expenses };
  }

  async validateNote(noteId: string, checkedAt: string): Promise<NoteCheck> {
    const ref = doc(this.db, "albaranes", noteId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error(`Unknown delivery note ${noteId}`);
    const note = snap.data() as DeliveryNote;
    const { checkNote } = await import("../domain/reception");
    const check = checkNote(note, checkedAt);
    await updateDoc(ref, {
      status: check.verdict === "conforme" ? "validado" : "incidencia",
    });
    return check;
  }

  async addNote(note: DeliveryNote): Promise<void> {
    const ref = doc(this.db, "albaranes", note.id);
    await setDoc(ref, note);
  }
}
