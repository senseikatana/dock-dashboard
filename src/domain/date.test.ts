import { describe, expect, it } from "vitest";

import { localDateIso } from "./date";

describe("localDateIso", () => {
  it("debe devolver la fecha civil LOCAL, no la UTC, justo tras la medianoche", () => {
    // 00:30 del 25 de octubre en hora local. En cualquier zona UTC+X,
    // `toISOString().slice(0, 10)` devolvería todavía "2026-10-24": es
    // exactamente el bug que metía los fichajes de turno "noche" en el
    // día anterior.
    const afterMidnight = new Date(2026, 9, 25, 0, 30, 0);

    expect(localDateIso(afterMidnight)).toBe("2026-10-25");
    expect(afterMidnight.getDate()).toBe(25);
    expect(afterMidnight.getMonth()).toBe(9);
    expect(afterMidnight.getFullYear()).toBe(2026);
  });

  it("debe rellenar con ceros mes y día de un solo dígito", () => {
    expect(localDateIso(new Date(2026, 0, 5, 12, 0, 0))).toBe("2026-01-05");
    expect(localDateIso(new Date(2026, 2, 9, 12, 0, 0))).toBe("2026-03-09");
  });

  it("debe mantener el día correcto en el cambio de año", () => {
    expect(localDateIso(new Date(2025, 11, 31, 23, 59, 0))).toBe("2025-12-31");
    expect(localDateIso(new Date(2026, 0, 1, 0, 0, 1))).toBe("2026-01-01");
  });

  it("debe usar la fecha actual cuando no se pasa argumento", () => {
    const now = new Date();
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    expect(localDateIso()).toBe(expected);
    expect(localDateIso(now)).toBe(expected);
  });
});
