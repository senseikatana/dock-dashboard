import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "sergio@panel-ola.es";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "PanelOla2026!";

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByLabel("Email").fill(ADMIN_EMAIL);
  await page.getByLabel("Contraseña").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.locator(".account-trigger").first()).toBeVisible();
  await page.goto("/reception");
  await expect(
    page.getByRole("heading", { name: "Recepción de mercancía" }),
  ).toBeVisible();
}

test.describe("Recepción de mercancía", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("should print the shift figures computed from the rows", async ({
    page,
  }) => {
    // Arrange
    await page.goto("/reception");

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
    await page.goto("/reception");
    const row = page.locator("tr", { hasText: "ALB-2026-0405" });

    // Act
    await row.getByRole("button", { name: "Validar" }).click();

    // Assert
    await expect(row).toContainText("Conforme");
    await expect(row.locator(".stamp")).toBeVisible();
  });

  test("should filter the notes by state", async ({ page }) => {
    // Arrange
    await page.goto("/reception");

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
    const noteId = `ALB-2026-${Date.now().toString().slice(-6)}`;
    await page.goto("/reception");
    await page.getByRole("button", { name: "Registrar recepción" }).click();

    // Act
    await page.getByLabel("Albarán", { exact: true }).fill(noteId);
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
    const row = page.locator("tr", { hasText: noteId });
    await expect(row).toBeVisible();
    await expect(row).toContainText("Aislamientos Vigo");
  });

  test("should block a reception with missing data", async ({ page }) => {
    // Arrange
    await page.goto("/reception");
    await expect(
      page.locator("table.albaranes tbody tr").first(),
    ).toBeVisible();
    const rowsBefore = await page.locator("table.albaranes tbody tr").count();
    await page.getByRole("button", { name: "Registrar recepción" }).click();

    // Act
    await page.getByRole("button", { name: "Guardar recepción" }).click();

    // Assert
    await expect(page.locator("table.albaranes tbody tr")).toHaveCount(
      rowsBefore,
    );
    await expect(
      page.getByRole("button", { name: "Guardar recepción" }),
    ).toBeVisible();
  });
});

test.describe("Settings access", () => {
  test("admin can open settings and see company members", async ({ page }) => {
    // Arrange
    await signIn(page);

    // Act
    await page.locator(".account-trigger").click();
    await page
      .locator(".account-dropdown summary", { hasText: "Administración" })
      .click();
    await page
      .locator(".account-dropdown")
      .getByRole("link", { name: /Ajustes/ })
      .click();

    // Assert
    await expect(page.getByRole("heading", { name: "Ajustes" })).toBeVisible();
    await expect(page.locator("table")).toContainText("Sergio Álvarez");
  });
});

test.describe("Personal panel", () => {
  test("shows the logged-in user's panel and payslips", async ({ page }) => {
    // Arrange
    await signIn(page);

    // Act
    await page.goto("/me");

    // Assert
    await expect(page.getByRole("heading", { name: /Hola,/ })).toBeVisible();
    await expect(page.getByText("Esta semana")).toBeVisible();
    await page.goto("/payslips");
    await expect(page.getByRole("heading", { name: "Nóminas" })).toBeVisible();
    await expect(page.locator("table")).toContainText("Neto");
  });
});

test.describe("Account menu", () => {
  test("switches theme and exposes the session actions", async ({ page }) => {
    // Arrange
    await signIn(page);

    // Act
    await page.locator(".account-trigger").click();
    await page.getByRole("button", { name: "Oscuro" }).click();

    // Assert
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(
      page.locator(".account-dropdown").getByRole("button", {
        name: /Cerrar sesión/,
      }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Claro" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  });
});
