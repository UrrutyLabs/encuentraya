import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ActiveFilters } from "../ActiveFilters";
import { useRouter, useSearchParams } from "next/navigation";

const mockUseCategoryBySlug = vi.fn();
const mockUseSubcategoryBySlugAndCategoryId = vi.fn();

vi.mock("next/navigation");
vi.mock("@/hooks/category", () => ({
  useCategoryBySlug: (...args: unknown[]) => mockUseCategoryBySlug(...args),
}));
vi.mock("@/hooks/subcategory", () => ({
  useSubcategoryBySlugAndCategoryId: (...args: unknown[]) =>
    mockUseSubcategoryBySlugAndCategoryId(...args),
}));

const mockPush = vi.fn();
const mockGet = vi.fn();
const mockToString = vi.fn();
const mockDelete = vi.fn();

describe("ActiveFilters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      push: mockPush,
    });
    (useSearchParams as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      get: mockGet,
      toString: mockToString,
      delete: mockDelete,
    });
    mockToString.mockReturnValue("");
    // Mock category hook to return null by default
    mockUseCategoryBySlug.mockReturnValue({
      category: null,
      isLoading: false,
      error: null,
    });
    // Mock subcategory hook to return null by default
    mockUseSubcategoryBySlugAndCategoryId.mockReturnValue({
      subcategory: null,
      isLoading: false,
      error: null,
    });
  });

  describe("rendering", () => {
    it("should not render when no filters are active", () => {
      mockGet.mockReturnValue(null);
      const { container } = render(<ActiveFilters onFilterRemove={vi.fn()} />);
      expect(container.firstChild).toBeNull();
    });

    it("should render search query filter", () => {
      mockGet.mockImplementation((key: string) => {
        if (key === "q") return "plumber";
        return null;
      });
      render(<ActiveFilters onFilterRemove={vi.fn()} />);
      expect(screen.getByText('"plumber"')).toBeInTheDocument();
    });

    it("should render category filter", () => {
      mockGet.mockImplementation((key: string) => {
        if (key === "category") return "plumbing";
        return null;
      });
      mockUseCategoryBySlug.mockReturnValue({
        category: {
          id: "cat-plumbing",
          name: "Plomería",
          slug: "plumbing",
        },
        isLoading: false,
        error: null,
      });
      render(<ActiveFilters onFilterRemove={vi.fn()} />);
      expect(screen.getByText("Plomería")).toBeInTheDocument();
    });

    it("should render subcategory filter", () => {
      mockGet.mockImplementation((key: string) => {
        if (key === "category") return "plumbing";
        if (key === "subcategory") return "fugas-goteras";
        return null;
      });
      mockUseCategoryBySlug.mockReturnValue({
        category: {
          id: "cat-plumbing",
          name: "Plomería",
          slug: "plumbing",
        },
        isLoading: false,
        error: null,
      });
      mockUseSubcategoryBySlugAndCategoryId.mockReturnValue({
        subcategory: {
          id: "sub-1",
          name: "Fugas y goteras",
          slug: "fugas-goteras",
        },
        isLoading: false,
        error: null,
      });
      render(<ActiveFilters onFilterRemove={vi.fn()} />);
      expect(screen.getByText("Fugas y goteras")).toBeInTheDocument();
    });

    it("should not render location chip (location is always applied but not shown)", () => {
      mockGet.mockImplementation((key: string) => {
        if (key === "location") return "Bulevar España 1234, 11300 Montevideo";
        if (key === "zipCode") return "11300";
        return null;
      });
      const { container } = render(<ActiveFilters onFilterRemove={vi.fn()} />);
      // Location/zipCode are not displayed as chips - only q, category, subcategory
      expect(
        container.querySelector('[aria-label*="Remover ubicación"]')
      ).toBeNull();
      expect(screen.queryByText("CP 11300")).not.toBeInTheDocument();
    });

    it("should render all active filters", () => {
      mockGet.mockImplementation((key: string) => {
        if (key === "q") return "plumber";
        if (key === "category") return "plumbing";
        if (key === "subcategory") return "fugas-goteras";
        return null;
      });
      mockUseCategoryBySlug.mockReturnValue({
        category: {
          id: "cat-plumbing",
          name: "Plomería",
          slug: "plumbing",
        },
        isLoading: false,
        error: null,
      });
      mockUseSubcategoryBySlugAndCategoryId.mockReturnValue({
        subcategory: {
          id: "sub-1",
          name: "Fugas y goteras",
          slug: "fugas-goteras",
        },
        isLoading: false,
        error: null,
      });
      render(<ActiveFilters onFilterRemove={vi.fn()} />);
      expect(screen.getByText('"plumber"')).toBeInTheDocument();
      expect(screen.getByText("Plomería")).toBeInTheDocument();
      expect(screen.getByText("Fugas y goteras")).toBeInTheDocument();
    });
  });

  describe("filter removal", () => {
    it("should remove search query filter", async () => {
      mockGet.mockImplementation((key: string) => {
        if (key === "q") return "plumber";
        return null;
      });
      mockToString.mockReturnValue("q=plumber");
      render(<ActiveFilters onFilterRemove={vi.fn()} />);

      const removeButton = screen.getByLabelText('Remover búsqueda "plumber"');
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/search/results");
      });
    });

    it("should remove category filter and subcategory", async () => {
      mockGet.mockImplementation((key: string) => {
        if (key === "category") return "plumbing";
        if (key === "subcategory") return "fugas-goteras";
        return null;
      });
      mockToString.mockReturnValue(
        "category=plumbing&subcategory=fugas-goteras"
      );
      mockUseCategoryBySlug.mockReturnValue({
        category: {
          id: "cat-plumbing",
          name: "Plomería",
          slug: "plumbing",
        },
        isLoading: false,
        error: null,
      });
      mockUseSubcategoryBySlugAndCategoryId.mockReturnValue({
        subcategory: {
          id: "sub-1",
          name: "Fugas y goteras",
          slug: "fugas-goteras",
        },
        isLoading: false,
        error: null,
      });
      render(<ActiveFilters onFilterRemove={vi.fn()} />);

      const removeButton = screen.getByLabelText("Remover categoría Plomería");
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/search/results");
      });
    });

    it("should remove only subcategory filter", async () => {
      mockGet.mockImplementation((key: string) => {
        if (key === "category") return "plumbing";
        if (key === "subcategory") return "fugas-goteras";
        return null;
      });
      mockToString.mockReturnValue(
        "category=plumbing&subcategory=fugas-goteras"
      );
      mockUseCategoryBySlug.mockReturnValue({
        category: {
          id: "cat-plumbing",
          name: "Plomería",
          slug: "plumbing",
        },
        isLoading: false,
        error: null,
      });
      mockUseSubcategoryBySlugAndCategoryId.mockReturnValue({
        subcategory: {
          id: "sub-1",
          name: "Fugas y goteras",
          slug: "fugas-goteras",
        },
        isLoading: false,
        error: null,
      });
      render(<ActiveFilters onFilterRemove={vi.fn()} />);

      const removeButton = screen.getByLabelText(
        "Remover subcategoría Fugas y goteras"
      );
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining("/search/results")
        );
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining("category=plumbing")
        );
        expect(mockPush).not.toHaveBeenCalledWith(
          expect.stringContaining("subcategory=")
        );
      });
    });
  });
});
