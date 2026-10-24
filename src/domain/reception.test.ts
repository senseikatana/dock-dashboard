import { describe, expect, it } from "vitest";

import {
  checkNote,
  shrinkageByMaterial,
  summarizeShift,
  type DeliveryNote,
  type Machine,
  type ReceptionLine,
  type ShrinkageEvent,
} from "./reception";

const line = (
  sku: string,
  qtyExpected: number,
  qtyReceived: number,
): ReceptionLine => ({
  sku,
  description: sku,
  unit: "uds",
  qtyExpected,
  qtyReceived,
  location: "03-A-12",
});

const note = (
  id: string,
  date: string,
  lines: ReceptionLine[],
): DeliveryNote => ({
  id,
  supplier: "Cerámicas del Ebro",
  carrier: "Transportes Ebro S.L.",
  date,
  dock: 1,
  status: "pendiente",
  lines,
});

const emptyInput = {
  notes: [],
  shrinkageEvents: [],
  machines: [],
  today: "2026-10-24",
};

describe("summarizeShift", () => {
  it("should compute the conformity rate from reception lines", () => {
    // Arrange
    const notes = [
      note("ALB-2026-0412", "2026-10-24", [
        line("CE-6060", 480, 480),
        line("CE-RP80", 220, 214),
        line("CE-AD25", 96, 96),
      ]),
    ];

    // Act
    const summary = summarizeShift({ ...emptyInput, notes });

    // Assert
    expect(summary.conformity).toEqual({
      conformingLines: 2,
      totalLines: 3,
      ratePct: 66.7,
    });
  });

  it("should report zero conformity for a shift with no lines", () => {
    // Arrange
    const input = {
      ...emptyInput,
      notes: [note("ALB-2026-0412", "2026-10-24", [])],
    };

    // Act
    const summary = summarizeShift(input);

    // Assert
    expect(summary.conformity).toEqual({
      conformingLines: 0,
      totalLines: 0,
      ratePct: 0,
    });
  });

  it("should split shrinkage into known and unknown loss with totals that add up", () => {
    // Arrange
    const shrinkageEvents: ShrinkageEvent[] = [
      {
        id: "MER-01",
        albaranId: "ALB-2026-0412",
        kind: "rotura",
        material: "Cerámica y pavimento",
        costEur: 410,
        known: true,
      },
      {
        id: "MER-02",
        albaranId: "ALB-2026-0414",
        kind: "faltante",
        material: "Cemento y áridos",
        costEur: 230,
        known: true,
      },
      {
        id: "MER-03",
        albaranId: "ALB-2026-0418",
        kind: "desconocida",
        material: "Pladur y aislamiento",
        costEur: 380,
        known: false,
      },
    ];

    // Act
    const summary = summarizeShift({ ...emptyInput, shrinkageEvents });

    // Assert
    expect(summary.shrinkage).toEqual({
      knownEur: 640,
      unknownEur: 380,
      totalEur: 1020,
    });
  });

  it("should count the receptions of the day", () => {
    // Arrange
    const notes = [
      note("ALB-2026-0412", "2026-10-24", []),
      note("ALB-2026-0413", "2026-10-24", []),
      note("ALB-2026-0411", "2026-10-23", []),
    ];

    // Act
    const summary = summarizeShift({ ...emptyInput, notes });

    // Assert
    expect(summary.receptionsToday).toBe(2);
  });

  it("should count machinery in service against the fleet", () => {
    // Arrange
    const machines: Machine[] = [
      { id: "FR-01", kind: "frontal", status: "operativa" },
      { id: "EL-02", kind: "elevadora", status: "taller" },
      { id: "RT-03", kind: "retractil", status: "operativa" },
    ];

    // Act
    const summary = summarizeShift({ ...emptyInput, machines });

    // Assert
    expect(summary.machinery).toEqual({ operational: 2, total: 3 });
  });
});

describe("shrinkageByMaterial", () => {
  it("should group shrinkage cost by material, largest first", () => {
    // Arrange
    const shrinkageEvents: ShrinkageEvent[] = [
      {
        id: "MER-01",
        albaranId: "ALB-2026-0412",
        kind: "rotura",
        material: "Cerámica y pavimento",
        costEur: 410,
        known: true,
      },
      {
        id: "MER-02",
        albaranId: "ALB-2026-0414",
        kind: "faltante",
        material: "Cemento y áridos",
        costEur: 295,
        known: true,
      },
      {
        id: "MER-03",
        albaranId: "ALB-2026-0412",
        kind: "rotura",
        material: "Cerámica y pavimento",
        costEur: 60,
        known: false,
      },
    ];

    // Act
    const rows = shrinkageByMaterial(shrinkageEvents);

    // Assert
    expect(rows).toEqual([
      { material: "Cerámica y pavimento", costEur: 470 },
      { material: "Cemento y áridos", costEur: 295 },
    ]);
  });

  it("should return no rows for a shift without shrinkage", () => {
    // Arrange
    const shrinkageEvents: ShrinkageEvent[] = [];

    // Act
    const rows = shrinkageByMaterial(shrinkageEvents);

    // Assert
    expect(rows).toEqual([]);
  });
});

describe("checkNote", () => {
  it("should mark matching lines as conform with zero delta", () => {
    // Arrange
    const deliveryNote = note("ALB-2026-0412", "2026-10-24", [
      line("CE-6060", 480, 480),
    ]);

    // Act
    const check = checkNote(deliveryNote, "2026-10-24T11:42:00");

    // Assert
    expect(check.lines).toEqual([
      { sku: "CE-6060", delta: 0, status: "conforme" },
    ]);
    expect(check.checkedAt).toBe("2026-10-24T11:42:00");
  });

  it("should mark a short line as difference with its negative delta", () => {
    // Arrange
    const deliveryNote = note("ALB-2026-0412", "2026-10-24", [
      line("CE-RP80", 220, 214),
    ]);

    // Act
    const check = checkNote(deliveryNote, "2026-10-24T11:42:00");

    // Assert
    expect(check.lines).toEqual([
      { sku: "CE-RP80", delta: -6, status: "diferencia" },
    ]);
  });

  it("should stamp the note as conforme when every line matches", () => {
    // Arrange
    const deliveryNote = note("ALB-2026-0412", "2026-10-24", [
      line("CE-6060", 480, 480),
      line("CE-AD25", 96, 96),
    ]);

    // Act
    const check = checkNote(deliveryNote, "2026-10-24T11:42:00");

    // Assert
    expect(check.verdict).toBe("conforme");
  });

  it("should stamp the note as incidencia when any line differs", () => {
    // Arrange
    const deliveryNote = note("ALB-2026-0414", "2026-10-24", [
      line("CE-6060", 480, 480),
      line("CE-RP80", 220, 214),
    ]);

    // Act
    const check = checkNote(deliveryNote, "2026-10-24T11:42:00");

    // Assert
    expect(check.verdict).toBe("incidencia");
  });

  it("should stamp a note without lines as incidencia", () => {
    // Arrange
    const deliveryNote = note("ALB-2026-0419", "2026-10-24", []);

    // Act
    const check = checkNote(deliveryNote, "2026-10-24T11:42:00");

    // Assert
    expect(check.verdict).toBe("incidencia");
    expect(check.lines).toEqual([]);
  });
});
