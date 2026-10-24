import { describe, expect, it } from "vitest";

import {
  expenseTotalsByCategory,
  wasteTotalKg,
  type Expense,
  type WasteRecord,
} from "./operations";

describe("expenseTotalsByCategory", () => {
  it("should group expenses by category, largest first", () => {
    // Arrange
    const expenses: Expense[] = [
      {
        id: "G-01",
        date: "2026-10-24",
        category: "mantenimiento",
        concept: "Revisión de retráctil",
        amountEur: 180,
      },
      {
        id: "G-02",
        date: "2026-10-24",
        category: "residuos",
        concept: "Gestor autorizado",
        amountEur: 240,
      },
      {
        id: "G-03",
        date: "2026-10-23",
        category: "mantenimiento",
        concept: "Neumáticos del frontal",
        amountEur: 90,
      },
    ];

    // Act
    const rows = expenseTotalsByCategory(expenses);

    // Assert
    expect(rows).toEqual([
      { category: "mantenimiento", amountEur: 270 },
      { category: "residuos", amountEur: 240 },
    ]);
  });

  it("should return no rows without expenses", () => {
    // Arrange
    const expenses: Expense[] = [];

    // Act
    const rows = expenseTotalsByCategory(expenses);

    // Assert
    expect(rows).toEqual([]);
  });
});

describe("wasteTotalKg", () => {
  it("should sum the kilograms of every record", () => {
    // Arrange
    const records: WasteRecord[] = [
      {
        id: "RES-01",
        date: "2026-10-24",
        kind: "embalaje",
        quantityKg: 320,
        handler: "EcoGestión Ebro",
        certificateRef: "CERT-2026-114",
      },
      {
        id: "RES-02",
        date: "2026-10-23",
        kind: "madera",
        quantityKg: 180,
        handler: "EcoGestión Ebro",
        certificateRef: "CERT-2026-109",
      },
    ];

    // Act
    const total = wasteTotalKg(records);

    // Assert
    expect(total).toBe(500);
  });
});
