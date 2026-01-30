import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SearchHero } from "../SearchHero";
import { useRouter, useSearchParams } from "next/navigation";

vi.mock("next/navigation");

const mockPush = vi.fn();
const mockGet = vi.fn();
const mockToString = vi.fn();

describe("SearchHero", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      push: mockPush,
    });
    (useSearchParams as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      get: mockGet,
      toString: mockToString,
    });
    mockToString.mockReturnValue("");
  });

  describe("rendering", () => {
    it("should render search input with placeholder", () => {
      render(<SearchHero />);
      expect(
        screen.getByPlaceholderText("Describí lo que estás precisando")
      ).toBeInTheDocument();
    });

    it("should render with initial query", () => {
      render(<SearchHero initialQuery="plumber" />);
      const input = screen.getByPlaceholderText(
        "Describí lo que estás precisando"
      ) as HTMLInputElement;
      expect(input.value).toBe("plumber");
    });

    it("should have proper accessibility attributes", () => {
      render(<SearchHero />);
      const form = screen.getByRole("search");
      expect(form).toBeInTheDocument();
      expect(screen.getByLabelText("Buscar profesionales")).toBeInTheDocument();
    });
  });

  describe("search submission", () => {
    it("should navigate to results page on submit", async () => {
      render(<SearchHero />);
      const input = screen.getByPlaceholderText(
        "Describí lo que estás precisando"
      );
      const form = screen.getByRole("search");

      fireEvent.change(input, { target: { value: "electrician" } });
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/search/results?q=electrician");
      });
    });

    it("should trim whitespace from search query", async () => {
      render(<SearchHero />);
      const input = screen.getByPlaceholderText(
        "Describí lo que estás precisando"
      );
      const form = screen.getByRole("search");

      fireEvent.change(input, { target: { value: "  plumber  " } });
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/search/results?q=plumber");
      });
    });

    it("should not navigate if query is empty", async () => {
      render(<SearchHero />);
      const form = screen.getByRole("search");

      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockPush).not.toHaveBeenCalled();
      });
    });

    it("should preserve params when preserveParams is true", async () => {
      mockGet.mockReturnValue("PLUMBING");
      mockToString.mockReturnValue("category=PLUMBING");
      render(<SearchHero preserveParams={true} />);
      const input = screen.getByPlaceholderText(
        "Describí lo que estás precisando"
      );
      const form = screen.getByRole("search");

      fireEvent.change(input, { target: { value: "test" } });
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          "/search/results?category=PLUMBING&q=test"
        );
      });
    });
  });

  describe("URL sync", () => {
    it("should sync with URL when preserveParams is true", async () => {
      mockGet.mockReturnValue("plumber");
      const { rerender } = render(<SearchHero preserveParams={true} />);
      const input = screen.getByPlaceholderText(
        "Describí lo que estás precisando"
      ) as HTMLInputElement;

      await waitFor(() => {
        expect(input.value).toBe("plumber");
      });

      mockGet.mockReturnValue("electrician");
      // Create a new mock searchParams object to trigger useEffect
      (useSearchParams as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        get: mockGet,
        toString: mockToString,
      });
      rerender(<SearchHero preserveParams={true} />);

      await waitFor(() => {
        expect(input.value).toBe("electrician");
      });
    });

    it("should not sync with URL when preserveParams is false", () => {
      mockGet.mockReturnValue("plumber");
      render(<SearchHero preserveParams={false} initialQuery="initial" />);
      const input = screen.getByPlaceholderText(
        "Describí lo que estás precisando"
      ) as HTMLInputElement;

      expect(input.value).toBe("initial");
    });
  });
});
