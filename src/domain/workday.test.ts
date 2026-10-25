import { describe, expect, it } from "vitest";

import { formatHours, formatPeriod, hoursBetween, timeOf } from "./workday";

describe("hoursBetween", () => {
  it("should return 0 while the shift is still open (clockOut null)", () => {
    expect(hoursBetween("2026-10-25T06:00:00.000Z", null)).toBe(0);
  });

  it("should return 0 when the end is not after the start", () => {
    expect(
      hoursBetween("2026-10-25T14:00:00.000Z", "2026-10-25T06:00:00.000Z"),
    ).toBe(0);
    expect(
      hoursBetween("2026-10-25T06:00:00.000Z", "2026-10-25T06:00:00.000Z"),
    ).toBe(0);
  });

  it("should return 0 for an unparseable ISO string", () => {
    expect(hoursBetween("basura", "2026-10-25T14:00:00.000Z")).toBe(0);
    expect(hoursBetween("2026-10-25T06:00:00.000Z", "basura")).toBe(0);
  });

  it("should round to two decimals", () => {
    expect(
      hoursBetween("2026-10-25T06:00:00.000Z", "2026-10-25T14:30:00.000Z"),
    ).toBe(8.5);
    expect(
      hoursBetween("2026-10-25T06:00:00.000Z", "2026-10-25T14:31:00.000Z"),
    ).toBe(8.52);
  });
});

describe("formatHours", () => {
  it("should render whole hours, half hours and under an hour", () => {
    expect(formatHours(8)).toBe("8 h 00 min");
    expect(formatHours(8.5)).toBe("8 h 30 min");
    expect(formatHours(0.5)).toBe("0 h 30 min");
  });

  it("should roll over to the next hour instead of printing 60 min", () => {
    // Suma de fichajes que por coma flotante queda justo por debajo de un
    // entero: `Math.floor` + redondeo de decimales sueltos imprimía
    // "41 h 60 min".
    expect(formatHours(41.995)).toBe("42 h 00 min");
    expect(formatHours(8.999999)).toBe("9 h 00 min");
  });

  it("should never print a 60-minute component", () => {
    for (const hours of [0.99, 8.999, 41.995, 47.997, 23.999, 119.995]) {
      expect(formatHours(hours)).not.toMatch(/ 60 min/);
    }
  });
});

describe("formatPeriod", () => {
  it("should render a valid period in Spanish", () => {
    expect(formatPeriod("2026-10")).toBe("octubre de 2026");
    expect(formatPeriod("2026-01")).toBe("enero de 2026");
  });

  it("should return an unparseable period untouched", () => {
    expect(formatPeriod("abc")).toBe("abc");
    expect(formatPeriod("")).toBe("");
  });

  it("should reject a month out of range instead of rolling into next year", () => {
    expect(formatPeriod("2026-13")).toBe("2026-13");
    expect(formatPeriod("2026-0")).toBe("2026-0");
    expect(formatPeriod("2026-00")).toBe("2026-00");
  });
});

describe("timeOf", () => {
  it("should render a dash for a missing timestamp", () => {
    expect(timeOf(null)).toBe("—");
  });

  it("should render a dash for a corrupt timestamp instead of throwing", () => {
    // `Intl.DateTimeFormat.format` levanta RangeError sobre una fecha
    // inválida, lo que tumbaría la pantalla de fichaje entera.
    expect(timeOf("basura-completamente-invalida")).toBe("—");
  });

  it("should render the local wall-clock time", () => {
    // Construido en hora local y devuelto en hora local: el resultado no
    // depende del huso de la máquina que ejecute los tests.
    const local = new Date(2026, 9, 25, 9, 5, 0);
    expect(timeOf(local.toISOString())).toBe("09:05");
  });
});
