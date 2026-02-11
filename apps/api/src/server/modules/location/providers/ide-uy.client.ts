/**
 * IDE Uruguay (direcciones.ide.uy) HTTP client.
 * Implements IIdeUyGeocodingProvider using v1 geocode and v0 localidades endpoints.
 * @see https://direcciones.ide.uy/swagger-ui.html
 */

import type {
  IIdeUyGeocodingProvider,
  GeocodeResult,
  AddressCandidate,
  ReverseGeocodeResult,
} from "../ide-geocoding.types";

const DEFAULT_BASE_URL = "https://direcciones.ide.uy";

export interface IdeUyClientConfig {
  baseUrl?: string;
  /** Custom fetch (e.g. globalThis.fetch for Node). */
  fetch?: typeof fetch;
}

/**
 * Low-level parser helpers for IDE responses (shape may vary; we extract what we need).
 */
function parseNumber(value: unknown): number | undefined {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const n = Number.parseFloat(value);
    return Number.isNaN(n) ? undefined : n;
  }
  return undefined;
}

function parseString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  return undefined;
}

export class IdeUyGeocodingClient implements IIdeUyGeocodingProvider {
  private readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;

  constructor(config: IdeUyClientConfig = {}) {
    this.baseUrl =
      config.baseUrl ?? process.env.IDE_UY_BASE_URL ?? DEFAULT_BASE_URL;
    this.fetchFn = config.fetch ?? globalThis.fetch;
  }

  private async get<T>(
    path: string,
    params: Record<string, string> = {}
  ): Promise<T> {
    const url = new URL(path, this.baseUrl);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await this.fetchFn(url.toString(), { method: "GET" });
    if (!res.ok) {
      throw new Error(`IDE UY API error: ${res.status} ${res.statusText}`);
    }
    return res.json() as Promise<T>;
  }

  async getCandidates(query: string): Promise<AddressCandidate[]> {
    if (!query?.trim()) return [];
    try {
      const data = await this.get<unknown>("/api/v1/geocode/candidates", {
        q: query.trim(),
      });
      return mapCandidatesResponse(data);
    } catch {
      return [];
    }
  }

  async geocodeAddress(
    addressOrRef: string | { id: string }
  ): Promise<GeocodeResult | null> {
    try {
      const q =
        typeof addressOrRef === "string"
          ? addressOrRef.trim()
          : addressOrRef.id;
      const data = await this.get<unknown>("/api/v1/geocode/direcUnica", {
        q,
      });
      return mapDirecUnicaResponse(data);
    } catch {
      return null;
    }
  }

  async reverseGeocode(
    lat: number,
    lng: number
  ): Promise<ReverseGeocodeResult | null> {
    try {
      const data = await this.get<unknown>("/api/v1/geocode/reverse", {
        latitud: String(lat),
        longitud: String(lng),
      });
      return mapReverseResponse(data);
    } catch {
      return null;
    }
  }
}

/** Map IDE candidates response to AddressCandidate[] (defensive). */
function mapCandidatesResponse(data: unknown): AddressCandidate[] {
  if (!data || typeof data !== "object") return [];
  const arr = Array.isArray(data)
    ? data
    : ((data as Record<string, unknown>).candidates ??
      (data as Record<string, unknown>).data);
  if (!Array.isArray(arr)) return [];
  return arr
    .map((item: unknown) => {
      const o =
        item && typeof item === "object"
          ? (item as Record<string, unknown>)
          : {};
      const label =
        parseString(o.label) ??
        parseString(o.address) ??
        parseString(o.nombre) ??
        parseString(o.direccion) ??
        parseString(o.text) ??
        "";
      return {
        id: parseString(o.id) ?? parseString(o.identificador),
        label: label || String(item),
        raw: item,
      };
    })
    .filter((c) => c.label);
}

/** Map IDE direcUnica response to GeocodeResult (defensive). API returns an array; we use the first element. */
function mapDirecUnicaResponse(data: unknown): GeocodeResult | null {
  if (!data || typeof data !== "object") return null;
  const raw = Array.isArray(data) ? data[0] : data;
  const o =
    raw && typeof raw === "object"
      ? (raw as Record<string, unknown>)
      : (data as Record<string, unknown>);
  const lat = parseNumber(o.lat ?? o.latitude ?? o.y);
  const lng = parseNumber(o.lng ?? o.longitude ?? o.x);
  if (lat == null || lng == null) {
    const first = Array.isArray((data as Record<string, unknown>).resultados)
      ? ((data as Record<string, unknown>).resultados as unknown[])[0]
      : null;
    if (first && typeof first === "object") return mapDirecUnicaResponse(first);
    return null;
  }
  return {
    latitude: lat,
    longitude: lng,
    postalCode: parseString(o.codigoPostal ?? o.postalCode ?? o.cp),
    department: parseString(o.departamento ?? o.department),
    addressLine: parseString(
      o.direccion ?? o.address ?? o.addressLine ?? o.direccionCompleta
    ),
  };
}

/** Map IDE reverse response to ReverseGeocodeResult (defensive). API returns an array of results; we use the first. */
function mapReverseResponse(data: unknown): ReverseGeocodeResult | null {
  const arr = Array.isArray(data) ? data : null;
  const o =
    arr?.[0] && typeof arr[0] === "object"
      ? (arr[0] as Record<string, unknown>)
      : null;
  if (!o) return null;
  const postalCode = parseString(o.codigoPostal ?? o.postalCode ?? o.cp);
  const department = parseString(o.departamento ?? o.department);
  const addressLine = parseString(
    o.direccion ?? o.address ?? o.addressLine ?? o.direccionCompleta
  );
  if (!postalCode && !department && !addressLine) return null;
  return { postalCode, department, addressLine };
}
