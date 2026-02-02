import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CostBreakdown } from "../CostBreakdown";

describe("CostBreakdown", () => {
  describe("fixed-price fallback (Phase 5)", () => {
    it("shows single Costo estimado amount when fallbackFixedAmount is set and no estimation", () => {
      render(
        <CostBreakdown
          estimation={null}
          isLoading={false}
          error={null}
          fallbackLaborAmount={0}
          fallbackHourlyRate={0}
          fallbackHours="0"
          fallbackFixedAmount={500}
          fallbackCurrency="UYU"
        />
      );

      expect(screen.getByText("Costo estimado")).toBeInTheDocument();
      expect(screen.getByText("$500 UYU")).toBeInTheDocument();
      expect(screen.queryByText(/horas/)).not.toBeInTheDocument();
    });
  });
});
