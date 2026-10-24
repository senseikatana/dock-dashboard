import { describe, expect, it } from "vitest";

import { shrinkageByMaterial, summarizeShift } from "../domain/reception";
import { buildSeed } from "./seed";

const TODAY = "2026-10-24";

describe("buildSeed", () => {
  it("should produce the shift figures the panel promises, all computed from rows", () => {
    // Arrange
    const seed = buildSeed(TODAY);

    // Act
    const summary = summarizeShift({ ...seed, today: TODAY });

    // Assert
    expect(summary.receptionsToday).toBe(14);
    expect(summary.shrinkage).toEqual({
      knownEur: 860,
      unknownEur: 380,
      totalEur: 1240,
    });
    expect(summary.machinery).toEqual({ operational: 8, total: 9 });
  });

  it("should give every note at least one line and every line a bay location", () => {
    // Arrange
    const seed = buildSeed(TODAY);
    const bayPattern = /^\d{2}-[A-D]-\d{2}$/;

    // Act
    const emptyNotes = seed.notes.filter((note) => note.lines.length === 0);
    const looseLines = seed.notes
      .flatMap((note) => note.lines)
      .filter((line) => !bayPattern.test(line.location));

    // Assert
    expect(emptyNotes).toEqual([]);
    expect(looseLines).toEqual([]);
  });

  it("should keep note, event and machine ids unique", () => {
    // Arrange
    const seed = buildSeed(TODAY);

    // Act
    const allIds = [
      ...seed.notes.map((note) => note.id),
      ...seed.shrinkageEvents.map((event) => event.id),
      ...seed.machines.map((machine) => machine.id),
    ];
    const repeated = allIds.filter((id, index) => allIds.indexOf(id) !== index);

    // Assert
    expect(repeated).toEqual([]);
  });

  it("should add the material rows up to the shrinkage total", () => {
    // Arrange
    const seed = buildSeed(TODAY);

    // Act
    const rows = shrinkageByMaterial(seed.shrinkageEvents);
    const rowsTotal = rows.reduce((sum, row) => sum + row.costEur, 0);
    const summary = summarizeShift({ ...seed, today: TODAY });

    // Assert
    expect(rowsTotal).toBe(summary.shrinkage.totalEur);
  });
});
