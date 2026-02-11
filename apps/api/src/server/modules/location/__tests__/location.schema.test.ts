import { describe, it, expect } from "vitest";
import { baseLocationSchema } from "@repo/domain";

describe("location schemas (from @repo/domain)", () => {
  describe("baseLocationSchema", () => {
    it("accepts valid coords", () => {
      const result = baseLocationSchema.safeParse({
        latitude: -34.9,
        longitude: -56.2,
        postalCode: "11300",
        addressLine: "Calle X 123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects out-of-range coords", () => {
      expect(
        baseLocationSchema.safeParse({ latitude: 91, longitude: 0 }).success
      ).toBe(false);
      expect(
        baseLocationSchema.safeParse({ latitude: 0, longitude: 181 }).success
      ).toBe(false);
    });
  });
});
