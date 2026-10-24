import { describe, expect, it } from "vitest";

import { render, screen, within } from "@testing-library/react";
import type { DeliveryNote } from "../domain/reception";
import { AlbaranesTable } from "./AlbaranesTable";

const notes: DeliveryNote[] = [
  {
    id: "ALB-2026-0412",
    supplier: "Cerámicas del Ebro",
    carrier: "Transportes Ebro S.L.",
    date: "2026-10-24",
    dock: 5,
    status: "pendiente",
    lines: [
      {
        sku: "CE-RP80",
        description: "Rodapié blanco 80 mm",
        unit: "uds",
        qtyExpected: 220,
        qtyReceived: 214,
        location: "03-A-12",
      },
    ],
  },
  {
    id: "ALB-2026-0403",
    supplier: "Cementos del Norte",
    carrier: "Grúas Vega",
    date: "2026-10-24",
    dock: 2,
    status: "validado",
    lines: [
      {
        sku: "CM-25",
        description: "Cemento gris CEM II 25 kg",
        unit: "sacos",
        qtyExpected: 240,
        qtyReceived: 240,
        location: "02-B-07",
      },
    ],
  },
  {
    id: "ALB-2026-0414",
    supplier: "Yesos Alcarria",
    carrier: "Duero Logística",
    date: "2026-10-24",
    dock: 6,
    status: "incidencia",
    lines: [
      {
        sku: "YE-25",
        description: "Yeso de proyección 25 kg",
        unit: "sacos",
        qtyExpected: 320,
        qtyReceived: 312,
        location: "02-C-05",
      },
    ],
  },
];

describe("AlbaranesTable", () => {
  it("should stamp each note with its state", () => {
    // Arrange
    const input = notes;

    // Act
    render(<AlbaranesTable notes={input} />);
    const row = screen.getByText("ALB-2026-0403").closest("tr") as HTMLElement;

    // Assert
    expect(within(row).getByText("Conforme")).toBeInTheDocument();
    expect(screen.getByText("En validación")).toBeInTheDocument();
    expect(screen.getByText("No conforme")).toBeInTheDocument();
  });

  it("should show the bay location of each note", () => {
    // Arrange
    const input = notes;

    // Act
    render(<AlbaranesTable notes={input} />);

    // Assert
    expect(screen.getByText("03-A-12")).toBeInTheDocument();
    expect(screen.getByText("02-B-07")).toBeInTheDocument();
    expect(screen.getByText("02-C-05")).toBeInTheDocument();
  });

  it("should count the lines of each note", () => {
    // Arrange
    const input = notes;

    // Act
    render(<AlbaranesTable notes={input} />);

    // Assert
    expect(screen.getAllByText("1").length).toBe(3);
  });
});
