import { describe, expect, it } from "vitest";

import { formatCount, formatEur, formatPct, formatSignedEur } from "./format";

describe("formatEur", () => {
  it("should format euros with thousands separator and two decimals", () => {
    // Arrange
    const value = 1240;

    // Act
    const text = formatEur(value);

    // Assert
    expect(text).toBe("1.240,00 €");
  });

  it("should keep the minus sign on a loss", () => {
    // Arrange
    const value = -380;

    // Act
    const text = formatEur(value);

    // Assert
    expect(text).toBe("-380,00 €");
  });
});

describe("formatPct", () => {
  it("should format percentages with one decimal", () => {
    // Arrange
    const value = 96.4;

    // Act
    const text = formatPct(value);

    // Assert
    expect(text).toBe("96,4 %");
  });
});

describe("formatCount", () => {
  it("should separate thousands without decimals", () => {
    // Arrange
    const value = 1284;

    // Act
    const text = formatCount(value);

    // Assert
    expect(text).toBe("1.284");
  });
});

describe("formatSignedEur", () => {
  it("should sign a positive change", () => {
    // Arrange
    const value = 180;

    // Act
    const text = formatSignedEur(value);

    // Assert
    expect(text).toBe("+180,00 €");
  });

  it("should sign a negative change", () => {
    // Arrange
    const value = -380;

    // Act
    const text = formatSignedEur(value);

    // Assert
    expect(text).toBe("-380,00 €");
  });
});
