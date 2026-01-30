import { describe, it, expect } from "vitest";
import {
  calculateProfileCompleted,
  calculateIsTopPro,
} from "../pro.calculations";

describe("pro.calculations", () => {
  describe("calculateProfileCompleted", () => {
    it("should return true when both avatarUrl and bio are present", () => {
      expect(
        calculateProfileCompleted("https://example.com/avatar.jpg", "Test bio")
      ).toBe(true);
    });

    it("should return false when avatarUrl is missing", () => {
      expect(calculateProfileCompleted(null, "Test bio")).toBe(false);
      expect(calculateProfileCompleted(undefined, "Test bio")).toBe(false);
      expect(calculateProfileCompleted("", "Test bio")).toBe(false);
    });

    it("should return false when bio is missing", () => {
      expect(
        calculateProfileCompleted("https://example.com/avatar.jpg", null)
      ).toBe(false);
      expect(
        calculateProfileCompleted("https://example.com/avatar.jpg", undefined)
      ).toBe(false);
      expect(
        calculateProfileCompleted("https://example.com/avatar.jpg", "")
      ).toBe(false);
    });

    it("should return false when both are missing", () => {
      expect(calculateProfileCompleted(null, null)).toBe(false);
      expect(calculateProfileCompleted(undefined, undefined)).toBe(false);
      expect(calculateProfileCompleted(null, undefined)).toBe(false);
      expect(calculateProfileCompleted(undefined, null)).toBe(false);
    });

    it("should return false when avatarUrl is empty string", () => {
      expect(calculateProfileCompleted("", "Test bio")).toBe(false);
    });

    it("should return false when bio is empty string", () => {
      expect(
        calculateProfileCompleted("https://example.com/avatar.jpg", "")
      ).toBe(false);
    });
  });

  describe("calculateIsTopPro", () => {
    it("should return true when completedJobsCount is exactly 10", () => {
      expect(calculateIsTopPro(10)).toBe(true);
    });

    it("should return true when completedJobsCount is greater than 10", () => {
      expect(calculateIsTopPro(11)).toBe(true);
      expect(calculateIsTopPro(20)).toBe(true);
      expect(calculateIsTopPro(100)).toBe(true);
    });

    it("should return false when completedJobsCount is less than 10", () => {
      expect(calculateIsTopPro(9)).toBe(false);
      expect(calculateIsTopPro(5)).toBe(false);
      expect(calculateIsTopPro(1)).toBe(false);
      expect(calculateIsTopPro(0)).toBe(false);
    });

    it("should handle edge case at threshold", () => {
      expect(calculateIsTopPro(9)).toBe(false);
      expect(calculateIsTopPro(10)).toBe(true);
      expect(calculateIsTopPro(11)).toBe(true);
    });
  });
});
