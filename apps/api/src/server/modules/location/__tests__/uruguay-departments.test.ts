import { describe, it, expect } from "vitest";
import {
  UY_DEPARTMENTS,
  getUyDepartments,
  isValidUyDepartment,
} from "../uruguay-departments";

describe("uruguay-departments", () => {
  describe("UY_DEPARTMENTS / getUyDepartments", () => {
    it("has exactly 19 departments", () => {
      expect(UY_DEPARTMENTS).toHaveLength(19);
      expect(getUyDepartments()).toHaveLength(19);
    });

    it("each department has code and name", () => {
      for (const d of UY_DEPARTMENTS) {
        expect(d.code).toBeDefined();
        expect(typeof d.code).toBe("string");
        expect(d.code.length).toBeGreaterThan(0);
        expect(d.name).toBeDefined();
        expect(typeof d.name).toBe("string");
        expect(d.name.length).toBeGreaterThan(0);
      }
    });

    it("includes Montevideo and Canelones", () => {
      const names = UY_DEPARTMENTS.map((d) => d.name);
      expect(names).toContain("Montevideo");
      expect(names).toContain("Canelones");
    });
  });

  describe("isValidUyDepartment", () => {
    it("returns true for each department name (case-insensitive)", () => {
      for (const d of UY_DEPARTMENTS) {
        expect(isValidUyDepartment(d.name)).toBe(true);
        expect(isValidUyDepartment(d.name.toLowerCase())).toBe(true);
        expect(isValidUyDepartment(d.name.toUpperCase())).toBe(true);
      }
    });

    it("returns true for each department code (case-insensitive)", () => {
      for (const d of UY_DEPARTMENTS) {
        expect(isValidUyDepartment(d.code)).toBe(true);
        expect(isValidUyDepartment(d.code.toLowerCase())).toBe(true);
        expect(isValidUyDepartment(d.code.toUpperCase())).toBe(true);
      }
    });

    it("returns false for invalid input", () => {
      expect(isValidUyDepartment("")).toBe(false);
      expect(isValidUyDepartment("   ")).toBe(false);
      expect(isValidUyDepartment("InvalidDepartment")).toBe(false);
      expect(isValidUyDepartment("XX")).toBe(false);
      expect(isValidUyDepartment("Buenos Aires")).toBe(false);
    });

    it("returns false for non-string or nullish", () => {
      expect(isValidUyDepartment(null as unknown as string)).toBe(false);
      expect(isValidUyDepartment(undefined as unknown as string)).toBe(false);
      expect(isValidUyDepartment(123 as unknown as string)).toBe(false);
    });
  });
});
