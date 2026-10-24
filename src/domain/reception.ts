/**
 * Reception domain — the shift summary the panel's first screen answers.
 *
 * Deep module: one entry point computes every headline figure from the rows,
 * so a caller (or a test) never has to know how each figure is derived.
 */

export interface ReceptionLine {
  sku: string;
  description: string;
  unit: string;
  qtyExpected: number;
  qtyReceived: number;
  location: string;
}

export type NoteStatus = "pendiente" | "validado" | "incidencia";

export const MAX_DOCKS = 40;

export interface DeliveryNote {
  id: string;
  supplier: string;
  carrier: string;
  date: string;
  dock: number;
  status: NoteStatus;
  lines: ReceptionLine[];
}

export interface ShrinkageEvent {
  id: string;
  albaranId: string;
  kind: "rotura" | "faltante" | "desconocida";
  material: string;
  costEur: number;
  known: boolean;
}

export interface ShrinkageRow {
  material: string;
  costEur: number;
}

export function shrinkageByMaterial(events: ShrinkageEvent[]): ShrinkageRow[] {
  const totals = new Map<string, number>();
  for (const event of events) {
    totals.set(
      event.material,
      (totals.get(event.material) ?? 0) + event.costEur,
    );
  }

  return [...totals.entries()]
    .map(([material, costEur]) => ({ material, costEur }))
    .sort((a, b) => b.costEur - a.costEur);
}

export interface Machine {
  id: string;
  kind: "frontal" | "elevadora" | "retractil";
  status: "operativa" | "taller" | "revision";
}

export interface ShiftInput {
  notes: DeliveryNote[];
  shrinkageEvents: ShrinkageEvent[];
  machines: Machine[];
  today: string;
}

export interface ShiftSummary {
  receptionsToday: number;
  conformity: { conformingLines: number; totalLines: number; ratePct: number };
  shrinkage: { knownEur: number; unknownEur: number; totalEur: number };
  machinery: { operational: number; total: number };
}

export type LineCheckStatus = "conforme" | "diferencia";

export interface CheckedLine {
  sku: string;
  delta: number;
  status: LineCheckStatus;
}

export interface NoteCheck {
  verdict: "conforme" | "incidencia";
  lines: CheckedLine[];
  checkedAt: string;
}

export function checkNote(note: DeliveryNote, checkedAt: string): NoteCheck {
  const lines: CheckedLine[] = note.lines.map((line) => {
    const delta = line.qtyReceived - line.qtyExpected;
    return {
      sku: line.sku,
      delta,
      status: delta === 0 ? "conforme" : "diferencia",
    };
  });
  const allConform =
    lines.length > 0 && lines.every((entry) => entry.status === "conforme");

  return { verdict: allConform ? "conforme" : "incidencia", lines, checkedAt };
}

export function summarizeShift(input: ShiftInput): ShiftSummary {
  const lines = input.notes.flatMap((note) => note.lines);
  const conformingLines = lines.filter(
    (line) => line.qtyReceived === line.qtyExpected,
  ).length;
  const totalLines = lines.length;
  const ratePct =
    totalLines === 0
      ? 0
      : Math.round((conformingLines / totalLines) * 1000) / 10;

  const knownEur = input.shrinkageEvents
    .filter((event) => event.known)
    .reduce((sum, event) => sum + event.costEur, 0);
  const unknownEur = input.shrinkageEvents
    .filter((event) => !event.known)
    .reduce((sum, event) => sum + event.costEur, 0);

  return {
    receptionsToday: input.notes.filter((note) => note.date === input.today)
      .length,
    conformity: { conformingLines, totalLines, ratePct },
    shrinkage: { knownEur, unknownEur, totalEur: knownEur + unknownEur },
    machinery: {
      operational: input.machines.filter(
        (machine) => machine.status === "operativa",
      ).length,
      total: input.machines.length,
    },
  };
}
