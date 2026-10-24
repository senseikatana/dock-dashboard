import { describe, expect, it } from "vitest";

import { render, screen } from "@testing-library/react";
import type { ShiftSummary } from "../domain/reception";
import { KpiStrip } from "./KpiStrip";

const summary: ShiftSummary = {
  receptionsToday: 14,
  conformity: { conformingLines: 27, totalLines: 30, ratePct: 90 },
  shrinkage: { knownEur: 860, unknownEur: 380, totalEur: 1240 },
  machinery: { operational: 8, total: 9 },
};

describe("KpiStrip", () => {
  it("should print the shift figures with es-ES formatting", () => {
    // Arrange
    const input = summary;

    // Act
    render(<KpiStrip summary={input} />);

    // Assert
    expect(screen.getByText("14")).toBeInTheDocument();
    expect(screen.getByText("90,0 %")).toBeInTheDocument();
    expect(screen.getByText("1.240,00 €")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
  });

  it("should name the fleet behind the machinery figure", () => {
    // Arrange
    const input = summary;

    // Act
    render(<KpiStrip summary={input} />);

    // Assert
    expect(screen.getByText("/ 9")).toBeInTheDocument();
    expect(screen.getByText("1 fuera de servicio")).toBeInTheDocument();
  });

  it("should split the shrinkage caption from the rows", () => {
    // Arrange
    const input = summary;

    // Act
    render(<KpiStrip summary={input} />);

    // Assert
    expect(screen.getByText("860,00 € conocidas")).toBeInTheDocument();
    expect(screen.getByText("27 de 30 líneas conformes")).toBeInTheDocument();
  });
});
