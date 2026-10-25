import { describe, expect, it } from "vitest";

import type { DeliveryNote } from "../domain/reception";
import { buildSeed } from "./seed";
import { MemoryWarehouseRepository } from "./memoryRepository";

const TODAY = "2026-10-24";

describe("MemoryWarehouseRepository", () => {
  it("should load the shift data it was built with", async () => {
    // Arrange
    const seed = buildSeed(TODAY);
    const repository = new MemoryWarehouseRepository(seed);

    // Act
    const shift = await repository.loadShift(TODAY);

    // Assert
    expect(shift.notes).toHaveLength(seed.notes.length);
    expect(shift.shrinkageEvents).toEqual(seed.shrinkageEvents);
    expect(shift.machines).toEqual(seed.machines);
  });

  it("should stamp a matching note as validated and keep it in later loads", async () => {
    // Arrange
    const repository = new MemoryWarehouseRepository(buildSeed(TODAY));

    // Act
    const check = await repository.validateNote(
      "ALB-2026-0403",
      `${TODAY}T11:42:00`,
    );
    const shift = await repository.loadShift(TODAY);

    // Assert
    expect(check.verdict).toBe("conforme");
    expect(
      shift.notes.find((note) => note.id === "ALB-2026-0403")?.status,
    ).toBe("validado");
  });

  it("should stamp a note with differences as incidencia", async () => {
    // Arrange
    const repository = new MemoryWarehouseRepository(buildSeed(TODAY));

    // Act
    const check = await repository.validateNote(
      "ALB-2026-0412",
      `${TODAY}T11:42:00`,
    );
    const shift = await repository.loadShift(TODAY);

    // Assert
    expect(check.verdict).toBe("incidencia");
    expect(
      shift.notes.find((note) => note.id === "ALB-2026-0412")?.status,
    ).toBe("incidencia");
  });

  it("should reject a note that does not exist", async () => {
    // Arrange
    const repository = new MemoryWarehouseRepository(buildSeed(TODAY));

    // Act & Assert
    await expect(
      repository.validateNote("ALB-0000-0000", `${TODAY}T11:42:00`),
    ).rejects.toThrow();
  });

  it("should keep a registered note in the shift", async () => {
    // Arrange
    const repository = new MemoryWarehouseRepository(buildSeed(TODAY));
    const note: DeliveryNote = {
      id: "ALB-2026-0417",
      supplier: "Aislamientos Vigo",
      carrier: "FrigoTrans Norte",
      date: TODAY,
      dock: 3,
      status: "pendiente",
      lines: [
        {
          sku: "AU-50",
          description: "Lana de roca 50 mm",
          unit: "m²",
          qtyExpected: 120,
          qtyReceived: 120,
          location: "04-D-02",
        },
      ],
    };

    // Act
    await repository.addNote(note);
    const shift = await repository.loadShift(TODAY);

    // Assert
    expect(shift.notes).toHaveLength(17);
    expect(
      shift.notes.find((entry) => entry.id === "ALB-2026-0417")?.supplier,
    ).toBe("Aislamientos Vigo");
  });

  it("should create, update and delete a company member", async () => {
    // Arrange
    const repository = new MemoryWarehouseRepository(buildSeed(TODAY));
    const member = {
      id: "MI-99",
      name: "Nuevo Miembro",
      email: "nuevo@panel-ola.es",
      role: "operario" as const,
      department: "almacen" as const,
      status: "activo" as const,
    };

    // Act
    await repository.addMember(member);
    const afterCreate = await repository.loadMembers();

    await repository.updateMember("MI-99", { role: "responsable" });
    const afterUpdate = await repository.loadMembers();

    await repository.deleteMember("MI-99");
    const afterDelete = await repository.loadMembers();

    // Assert
    expect(afterCreate.find((entry) => entry.id === "MI-99")).toEqual(member);
    expect(afterUpdate.find((entry) => entry.id === "MI-99")?.role).toBe(
      "responsable",
    );
    expect(afterDelete.find((entry) => entry.id === "MI-99")).toBeUndefined();
  });

  it("should delete a record that is already gone without failing (idempotent, like Firestore)", async () => {
    // Arrange
    const seed = buildSeed(TODAY);
    const repository = new MemoryWarehouseRepository(seed);

    // Act — Firestore `deleteDoc` succeeds for a missing document, so the
    // in-memory adapter must too, or this suite describes something that
    // production never does.
    await expect(
      repository.deleteExpense("EXP-0000-0000"),
    ).resolves.toBeUndefined();
    await expect(
      repository.deleteNote("ALB-0000-0000"),
    ).resolves.toBeUndefined();

    // Assert — and nothing else was removed by mistake.
    const shift = await repository.loadShift(TODAY);
    expect(shift.expenses).toHaveLength(seed.expenses.length);
    expect(shift.notes).toHaveLength(seed.notes.length);
  });
});
