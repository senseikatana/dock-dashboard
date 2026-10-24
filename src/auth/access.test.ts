import { describe, expect, it } from "vitest";

import { canAccess, routesForRole } from "./access";

describe("role access", () => {
  it("should let admin access every route", () => {
    expect(canAccess("admin", "dashboard")).toBe(true);
    expect(canAccess("admin", "settings")).toBe(true);
    expect(canAccess("admin", "expenses")).toBe(true);
  });

  it("should keep settings restricted to admin", () => {
    expect(canAccess("responsable", "settings")).toBe(false);
    expect(canAccess("operario", "settings")).toBe(false);
  });

  it("should limit operario to personal routes plus reception and incidents", () => {
    const paths = routesForRole("operario").map((route) => route.path);
    expect(paths).toEqual([
      "/me",
      "/timesheet",
      "/payslips",
      "/account",
      "/reception",
      "/incidents",
    ]);
  });

  it("should give responsable the operations routes without settings", () => {
    const paths = routesForRole("responsable").map((route) => route.path);
    expect(paths).toContain("/dashboard");
    expect(paths).toContain("/expenses");
    expect(paths).not.toContain("/settings");
  });
});
