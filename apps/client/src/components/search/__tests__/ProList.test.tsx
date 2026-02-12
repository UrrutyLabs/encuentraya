import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProList } from "../ProList";
import type { Pro } from "@repo/domain";

vi.mock("@/components/presentational/ProCard", () => ({
  ProCard: ({ pro }: { pro: Pro }) => (
    <div data-testid={`pro-${pro.id}`}>{pro.name}</div>
  ),
}));

vi.mock("../ProCardSkeleton", () => ({
  ProCardSkeleton: () => <div data-testid="skeleton">Loading...</div>,
}));

const mockPro: Pro = {
  id: "pro-1",
  name: "John Doe",
  email: "john@example.com",
  hourlyRate: 50,
  categoryIds: ["cat-plumbing"],
  isApproved: true,
  isSuspended: false,
  isAvailable: true,
  profileCompleted: true,
  completedJobsCount: 5,
  rating: 4.5,
  reviewCount: 10,
  isTopPro: false,
  serviceRadiusKm: 10,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

describe("ProList", () => {
  describe("loading state", () => {
    it("should render skeletons when loading", () => {
      render(<ProList pros={[]} isLoading={true} />);
      const skeletons = screen.getAllByTestId("skeleton");
      expect(skeletons).toHaveLength(3);
    });

    it("should have proper accessibility attributes when loading", () => {
      const { container } = render(<ProList pros={[]} isLoading={true} />);
      const list = container.querySelector('[role="status"]');
      expect(list).toBeInTheDocument();
      expect(list).toHaveAttribute("aria-label", "Cargando profesionales");
    });
  });

  describe("empty state", () => {
    it("should return null when pros array is empty and not loading", () => {
      const { container } = render(<ProList pros={[]} isLoading={false} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("pro list rendering", () => {
    it("should render list of pros", () => {
      const pros = [mockPro, { ...mockPro, id: "pro-2", name: "Jane Smith" }];
      render(<ProList pros={pros} isLoading={false} />);

      expect(screen.getByTestId("pro-pro-1")).toBeInTheDocument();
      expect(screen.getByTestId("pro-pro-2")).toBeInTheDocument();
    });

    it("should have proper accessibility attributes", () => {
      const { container } = render(
        <ProList pros={[mockPro]} isLoading={false} />
      );
      const list = container.querySelector('[role="list"]');
      expect(list).toBeInTheDocument();
      const items = container.querySelectorAll('[role="listitem"]');
      expect(items).toHaveLength(1);
    });
  });
});
