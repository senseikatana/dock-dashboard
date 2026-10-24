import { expect, test } from "@playwright/test";

test.describe("Recepción de mercancía", () => {
  test("should print the shift figures computed from the rows", async ({
    page,
  }) => {
    // Arrange
    await page.goto("/");

    // Act
    const kpis = page.locator(".kpi-strip");

    // Assert
    await expect(kpis).toContainText("14");
    await expect(kpis).toContainText("90,0 %");
    await expect(kpis).toContainText("1.240,00 €");
    await expect(kpis).toContainText("8");
    await expect(kpis).toContainText("/ 9");
  });

  test("should stamp a note as Conforme when it is validated", async ({
    page,
  }) => {
    // Arrange
    await page.goto("/");
    const row = page.locator("tr", { hasText: "ALB-2026-0405" });

    // Act
    await row.getByRole("button", { name: "Validar" }).click();

    // Assert
    await expect(row).toContainText("Conforme");
    await expect(row.locator(".stamp")).toBeVisible();
  });

  test("should filter the notes by state", async ({ page }) => {
    // Arrange
    await page.goto("/");

    // Act
    await page.getByRole("tab", { name: /^Con incidencia/ }).click();

    // Assert
    await expect(
      page.locator("tr", { hasText: "ALB-2026-0414" }),
    ).toBeVisible();
    await expect(page.locator("tr", { hasText: "ALB-2026-0405" })).toHaveCount(
      0,
    );
  });

  test("should register a reception and show it in the shift", async ({
    page,
  }) => {
    // Arrange
    await page.goto("/");
    await page.getByRole("button", { name: "Registrar recepción" }).click();

    // Act
    await page
      .getByLabel("Proveedor", { exact: true })
      .fill("Aislamientos Vigo");
    await page
      .getByLabel("Transportista", { exact: true })
      .fill("FrigoTrans Norte");
    await page.getByLabel("Artículo (SKU)", { exact: true }).fill("AU-50");
    await page
      .getByLabel("Descripción", { exact: true })
      .fill("Lana de roca 50 mm");
    await page.getByLabel("Ubicación", { exact: true }).fill("04-D-02");
    await page.getByRole("button", { name: "Guardar recepción" }).click();

    // Assert
    const row = page.locator("tr", { hasText: "ALB-2026-0417" });
    await expect(row).toBeVisible();
    await expect(row).toContainText("Aislamientos Vigo");
  });

  test("should block a reception with missing data", async ({ page }) => {
    // Arrange
    await page.goto("/");
    await page.getByRole("button", { name: "Registrar recepción" }).click();

    // Act
    await page.getByRole("button", { name: "Guardar recepción" }).click();

    // Assert
    await expect(page.locator("tr", { hasText: "ALB-2026-0417" })).toHaveCount(
      0,
    );
    await expect(
      page.getByRole("button", { name: "Guardar recepción" }),
    ).toBeVisible();
  });
});
