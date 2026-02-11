import { describe, it, expect, beforeEach, vi } from "vitest";
import { IdeUyGeocodingClient } from "../providers/ide-uy.client";

describe("IdeUyGeocodingClient", () => {
  const baseUrl = "https://test.ide.uy";
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
  });

  function createClient(overrides: { baseUrl?: string } = {}) {
    return new IdeUyGeocodingClient({
      baseUrl: overrides.baseUrl ?? baseUrl,
      fetch: mockFetch,
    });
  }

  describe("getCandidates", () => {
    it("returns empty array when query is empty", async () => {
      const client = createClient();
      expect(await client.getCandidates("")).toEqual([]);
      expect(await client.getCandidates("   ")).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("calls GET /api/v1/geocode/candidates with q param", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });
      await createClient().getCandidates("Buenos Aires 123");
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain("/api/v1/geocode/candidates");
      expect(url).toContain("q=");
      expect(url).toContain("Buenos");
      expect(url).toContain("Aires");
      expect(url).toContain("123");
    });

    it("maps array response to AddressCandidate[]", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { label: "Buenos Aires 123, Montevideo", id: "cand-1" },
          { nombre: "Av 18 de Julio 1000" },
        ],
      });
      const client = createClient();
      const result = await client.getCandidates("Buenos");
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: "cand-1",
        label: "Buenos Aires 123, Montevideo",
        raw: { label: "Buenos Aires 123, Montevideo", id: "cand-1" },
      });
      expect(result[1].label).toBe("Av 18 de Julio 1000");
    });

    it("returns empty array on API error", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
      const client = createClient();
      const result = await client.getCandidates("x");
      expect(result).toEqual([]);
    });
  });

  describe("geocodeAddress", () => {
    it("calls GET direcUnica with q when given string", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            lat: -34.9,
            lng: -56.2,
            codigoPostal: "11300",
            departamento: "Montevideo",
            direccion: "Buenos Aires 123",
          },
        ],
      });
      const client = createClient();
      const result = await client.geocodeAddress("Buenos Aires 123");
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain("/api/v1/geocode/direcUnica");
      expect(url).toContain("q=");
      expect(result).toEqual({
        latitude: -34.9,
        longitude: -56.2,
        postalCode: "11300",
        department: "Montevideo",
        addressLine: "Buenos Aires 123",
      });
    });

    it("calls GET direcUnica with q (ref id) when given ref object", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ lat: -34.9, lng: -56.2 }],
      });
      await createClient().geocodeAddress({ id: "cand-1" });
      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain("q=cand-1");
    });

    it("returns null on API error", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });
      const client = createClient();
      const result = await client.geocodeAddress("unknown");
      expect(result).toBeNull();
    });

    it("returns null when response has no lat/lng", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });
      const client = createClient();
      const result = await client.geocodeAddress("x");
      expect(result).toBeNull();
    });
  });

  describe("reverseGeocode", () => {
    it("calls GET reverse with latitud and longitud", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            codigoPostal: "11000",
            departamento: "Montevideo",
            direccion: "Av 18 de Julio 1000",
          },
        ],
      });
      const client = createClient();
      const result = await client.reverseGeocode(-34.9, -56.2);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain("/api/v1/geocode/reverse");
      expect(url).toContain("latitud=-34.9");
      expect(url).toContain("longitud=-56.2");
      expect(result).toEqual({
        postalCode: "11000",
        department: "Montevideo",
        addressLine: "Av 18 de Julio 1000",
      });
    });

    it("returns null on API error", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false });
      const client = createClient();
      const result = await client.reverseGeocode(0, 0);
      expect(result).toBeNull();
    });
  });

  describe("config", () => {
    it("uses IDE_UY_BASE_URL from env when not passed", async () => {
      const orig = process.env.IDE_UY_BASE_URL;
      process.env.IDE_UY_BASE_URL = "https://custom.ide.uy";
      const client = new IdeUyGeocodingClient({ fetch: mockFetch });
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] });
      await client.getCandidates("x");
      expect(mockFetch.mock.calls[0][0]).toContain("https://custom.ide.uy");
      process.env.IDE_UY_BASE_URL = orig;
    });
  });
});
