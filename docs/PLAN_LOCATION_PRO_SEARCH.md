# Plan: Pro location & search by location (Option A + localidades)

This document describes the full plan for adding **pro service area** (departments + localidades) and **base location** (address → zip + coords), then using that data for **client search by location** (filter by department/localidad, sort by distance). It follows [BE_BEST_PRACTICES.md](./BE_BEST_PRACTICES.md) and [FE_BEST_PRACTICES.md](./FE_BEST_PRACTICES.md).

**References:**

- IDE Uruguay API: [direcciones.ide.uy Swagger](https://direcciones.ide.uy/swagger-ui.html) (v1 geocode, v0 localidades)
- Option A: `serviceAreaJson` on ProProfile + base fields (no Region table)

---

## Summary

| Phase | Scope                        | Outcome                                                                                                        |
| ----- | ---------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 1     | BE – Reference data & schema | UY departments list, ProProfile schema (base + serviceAreaJson), migration                                     |
| 2     | BE – IDE integration         | Geocoding client (candidates, direcUnica/find, reverse) + localidades client; optional cache                   |
| 3     | BE – Pro location API        | Endpoints (departments, localidades, suggestions, geocode-one); pro updateProfile/onboard input and validation |
| 4     | BE – Search by location      | searchPros accepts zipCode/lat-lng; filter by department/localidad; sort by distance                           |
| 5     | Pro app (mobile)             | Location screen: departments + localidades + base address; hooks; tests                                        |
| 6     | Client app                   | Search bar zip (editable, geolocation); results URL zipCode; search uses location                              |
| 7     | Data migration & cleanup     | Backfill serviceAreaJson from serviceArea; optional deprecation of serviceArea                                 |

---

## Phase 1: Backend – Reference data & schema

**Goal:** Define UY departments, extend ProProfile with base location and `serviceAreaJson`, run migration. No external API calls yet.

### 1.1 Reference data – UY departments

- **Location:** `apps/api/src/server/modules/location/` (new module) or `apps/api/src/server/shared/location/` (shared).
- **Deliverables:**
  - Static list of 19 Uruguay departments: `{ code: string, name: string }[]`. Use a single source (e.g. `uruguay-departments.ts`).
  - Validator: `isValidUyDepartment(nameOrCode: string): boolean` and/or `getUyDepartments(): readonly { code, name }[]`.
- **BE practices:** Pure data + pure functions; no DB, no API. Easy to unit test.
- **Testing:**
  - Unit test: validator returns true for each of the 19 names/codes and false for invalid input.

### 1.2 Schema – ProProfile location fields

- **Location:** `apps/api/prisma/schema.prisma`.
- **Changes on `ProProfile`:**
  - `baseCountryCode   String?` (e.g. `"UY"`)
  - `baseLatitude      Float?`
  - `baseLongitude     Float?`
  - `basePostalCode    String?` (5 digits UY)
  - `baseAddressLine   String?` (display)
  - `serviceAreaJson   Json?` (shape below)
  - Keep `serviceArea String?` for now (legacy); stop writing to it in new flow; plan to deprecate after migration.
- **`serviceAreaJson` shape (UY):**
  ```json
  {
    "departments": ["Montevideo", "Canelones"],
    "localidades": [
      {
        "department": "Montevideo",
        "id": "localidad-ide-id",
        "name": "Pocitos",
        "postalCode": "11300"
      }
    ]
  }
  ```
- **Deliverables:** Migration file; update Prisma client.
- **Testing:** No unit test for schema; migration applies cleanly (manual or CI).

### 1.3 Domain types & Zod (packages/domain)

- **Location:** `packages/domain/src/` (e.g. schemas or types for location).
- **Deliverables:**
  - Type for UY service area: `ServiceAreaUy { departments: string[], localidades: { department, id, name?, postalCode? }[] }`.
  - Zod schema for `serviceAreaJson` validation (for pro update/onboard input).
  - Pro update/onboard input: extend with `serviceDepartments?: string[]`, `serviceLocalidades?: { department, id, name?, postalCode? }[]`, `baseAddress?: string` or `baseLocation?: { latitude, longitude, postalCode, addressLine }`, `baseCountryCode?: string`.
- **Testing:** Unit test Zod schema (valid/invalid payloads).

---

## Phase 2: Backend – IDE Uruguay integration

**Goal:** Integrate with [IDE Uruguay API](https://direcciones.ide.uy/swagger-ui.html): geocoding (candidates, direcUnica/find, reverse) and localidades by department. Keep all IDE coupling in one place; expose small DTOs to the rest of the app.

### 2.1 IDE HTTP client & config

- **Location:** `apps/api/src/server/modules/location/providers/` or `integrations/` (e.g. `ide-uy.client.ts`).
- **Responsibilities:**
  - Base URL from env (e.g. `IDE_UY_BASE_URL`, default `https://direcciones.ide.uy`).
  - GET requests to `/api/v1/geocode/*` and `/api/v0/geocode/localidades`; parse JSON; map to internal DTOs.
- **BE practices:** Treat as Integration/Provider: wrap 3rd party API, no business logic, expose a small interface.
- **Testing:**
  - Unit tests with mocked `fetch`/HTTP: given a canned IDE response, client returns expected DTO.
  - Optional: one integration test against real IDE (smoke, can be skipped in CI if flaky).

### 2.2 Geocoding – candidates & direcUnica/find

- **Endpoints used:**
  - `GET /api/v1/geocode/candidates` – autocomplete (query param for address text).
  - `GET /api/v1/geocode/direcUnica` or `GET /api/v1/geocode/find` – single address → coords + components.
- **Interface (e.g. `IdeUyGeocodingProvider` or `UruguayGeocodingService`):**
  - `getCandidates(query: string): Promise<{ id?: string, label: string, ... }[]>`.
  - `geocodeAddress(addressOrCandidateRef: string | { id: string }): Promise<GeocodeResult | null>` where `GeocodeResult = { latitude, longitude, postalCode, department, addressLine }`.
- **Error handling:** No result or API error → return `null` or Result type; caller shows “address not found”.
- **Testing:** Unit tests with mocked HTTP: valid IDE response → correct DTO; 404/500 → null or error.

### 2.3 Geocoding – reverse (optional for Phase 3/4)

- **Endpoint:** `GET /api/v1/geocode/reverse?lat=...&lng=...`.
- **Interface:** `reverseGeocode(lat: number, lng: number): Promise<{ postalCode?, department?, addressLine? } | null>`.
- **Use later:** Client “use my location” → lat/lng → zip + department for search.
- **Testing:** Mocked HTTP; valid response → DTO.

### 2.4 Localidades by department

- **Endpoint:** `GET /api/v0/geocode/localidades` (or POST) with department name.
- **Interface:** `getLocalidadesByDepartment(department: string): Promise<{ id: string, name: string, postalCode?: string, alias?: string }[]>`.
- **Caching (optional):** In-memory or Redis cache per department, TTL e.g. 24h, to avoid hitting IDE on every pro form load.
- **Testing:** Mocked HTTP; valid response → list of localidades; invalid department → empty or error.

### 2.5 Module registration & DI

- **Location:** `apps/api/src/server/container/modules/location.module.ts` (or add to existing module).
- **Register:** Geocoding provider/client; optional LocalidadesService that uses client + cache. Expose via tokens (e.g. `TOKENS.UruguayGeocodingProvider`, `TOKENS.LocationReferenceService`).
- **BE practices:** Integrations registered in container; services depend on abstractions.

---

## Phase 3: Backend – Pro location API

**Goal:** Expose endpoints for reference data (departments, localidades) and for address suggestions/geocode; extend pro updateProfile (and onboard) to accept and validate service area + base location; persist to ProProfile.

### 3.1 Public/reference endpoints

- **Location:** `apps/api/src/server/modules/location/location.router.ts` (or under `pro` if you prefer).
- **Procedures:**
  - `location.getDepartments` (or `getUyDepartments`) – returns list from static data (no IDE).
  - `location.getLocalidades` – input: `{ countryCode: string, department: string }`; for UY, call IDE localidades client; return `{ id, name, postalCode?, alias? }[]`.
- **BE practices:** Router thin: validate input (Zod), call service/provider, return result; no business logic in router.
- **Testing:** Unit test service that returns departments; unit test localidades with mocked IDE client.

### 3.2 Address suggestions & geocode-one endpoints

- **Procedures:**
  - `location.addressSuggestions` – input: `{ q: string, countryCode: string }`; for UY call IDE candidates; return list of suggestions (label, id if needed).
  - `location.geocodeAddress` – input: `{ address: string }` or `{ candidateId: string }`; for UY call direcUnica/find; return `GeocodeResult` or error.
- **Authorization:** Can be public (no auth) or require auth; if public, consider rate limiting.
- **Testing:** Unit test with mocked geocoding provider.

### 3.3 Pro profile – extend input & validation

- **Location:** `packages/domain` – extend `ProUpdateProfileInput` (and onboard input if used).
- **New fields:** `serviceDepartments?: string[]`, `serviceLocalidades?: { department, id, name?, postalCode? }[]`, `baseAddress?: string` or `baseLocation?: { latitude, longitude, postalCode, addressLine }`, `baseCountryCode?: string`.
- **Validation (in service):**
  - Each `serviceDepartments` entry must be in UY departments list.
  - Each `serviceLocalidades` entry: `department` must be in `serviceDepartments`; `id` should be validated against IDE localidades for that department (or accept and persist; validate on read if needed).
  - If `baseAddress` provided: call geocoding service; on success set base\*; on failure return validation error.
  - If `baseLocation` provided: validate ranges (lat/lng), optional postal format; set base\*.
- **BE practices:** Validation and orchestration in ProService; repository only persists; use existing ProRepository for updates.
- **Testing:** Unit tests for ProService (or dedicated location validation helper): valid/invalid departments; valid/invalid localidades; base address success/failure (mocked geocoding).

### 3.4 Pro profile – persist and read

- **Location:** `apps/api/src/server/modules/pro/pro.repo.ts` (and pro.service.ts).
- **Write:** Map `serviceDepartments` + `serviceLocalidades` to `serviceAreaJson`; map base location to `baseCountryCode`, `baseLatitude`, `baseLongitude`, `basePostalCode`, `baseAddressLine`. Do not write to legacy `serviceArea` for new flow.
- **Read:** getMyProfile / getById include base\* and `serviceAreaJson`; map to a friendly shape (departments array, localidades array) for clients.
- **Testing:** Unit test repo mapper (input → Prisma shape); unit test service (build update payload from input, call repo with correct shape).

### 3.5 Router wiring

- **Location:** `apps/api/src/server/modules/pro/pro.router.ts`.
- **Update:** updateProfile (and onboard if applicable) accept new input; pass to service; translate service errors to TRPCError.
- **Testing:** Router-level test optional; main coverage in service unit tests.

---

## Phase 4: Backend – Search by location

**Goal:** searchPros accepts optional `zipCode` and/or `latitude`/`longitude`; resolve to department (and localidad when possible); filter pros by service area; sort by distance using pro base coords.

### 4.1 Resolve user location to department (and localidad)

- **Location:** `apps/api/src/server/modules/search/` or `modules/location/`.
- **Logic:** Given `zipCode` or (lat, lng): use IDE reverse geocode (or static zip→department table for UY) to get `department` and optionally `localidadId`/localidad name.
- **Interface:** `resolveUserLocation(countryCode: string, zipCode?: string, lat?: number, lng?: number): Promise<{ department: string, localidadId?: string } | null>`.
- **Testing:** Unit test with mocked reverse geocode / static table.

### 4.2 Extend search input and service

- **Location:** `packages/domain` – extend search input with `zipCode?: string`, `latitude?: number`, `longitude?: number`, `countryCode?: string`.
- **Location:** `apps/api/src/server/modules/search/search.service.ts`.
- **Logic:**
  - If location params provided: call resolveUserLocation; get department (and localidad).
  - Fetch pros (existing category/availability logic).
  - Filter: pro’s `serviceAreaJson.departments` must include user’s department; if user has localidad and pro’s `serviceAreaJson.localidades` is non-empty, pro must list that localidad (by id).
  - Sort: by distance (Haversine) using pro’s `baseLatitude`/`baseLongitude`; then by rank (e.g. rating, isTopPro, completedJobsCount). Pros without base coords: put at end or exclude (product decision).
- **BE practices:** Search logic in SearchService; filter/sort in service or repo; repo can expose a method that returns pros with location data for service to sort/filter.
- **Testing:** Unit tests: filter by department; filter by department + localidad (pro with localidades must match); sort order by distance; no location params → existing behaviour unchanged.

### 4.3 Repository / query adjustments

- **Location:** `apps/api/src/server/modules/pro/pro.repo.ts` (e.g. searchPros or new method).
- **Change:** Ensure search returns pros with `baseLatitude`, `baseLongitude`, `serviceAreaJson` (and category/availability as today). Filtering by department/localidad can be in repo (JSONB/JSON contains) or in service (fetch then filter in memory for Option A).
- **Testing:** Unit test repo with mocked Prisma: correct where/include; or test via SearchService with mocked repo.

---

## Phase 5: Pro app (mobile) – Location UI

**Goal:** Pro can set departments, localidades, and base address from the mobile app; data flows through hooks and existing profile update.

### 5.1 Hooks (FE best practices)

- **Location:** `apps/pro_mobile/src/hooks/` (or equivalent).
- **Hooks:**
  - `useDepartments()` – calls `location.getDepartments` (or equivalent); returns list.
  - `useLocalidades(department: string | null)` – calls `location.getLocalidades({ countryCode: 'UY', department })`; returns list; only run when department is set.
  - `useAddressSuggestions(query: string)` – calls `location.addressSuggestions`; debounced.
  - `useGeocodeAddress()` – mutation or query that calls `location.geocodeAddress`; returns GeocodeResult.
  - Existing `useUpdateProProfile()` (or same) used to submit `serviceDepartments`, `serviceLocalidades`, and base location (from geocode result or manual).
- **FE practices:** One hook per procedure/concern; no direct trpc in screens; return standard React Query shape.
- **Testing:** Hook tests with mocked tRPC (e.g. wrapper + mock server) or integration tests that hit real API.

### 5.2 Location screen / section

- **Location:** `apps/pro_mobile/src/screens/...` (e.g. EditProfile or dedicated ServiceAreaScreen).
- **UI:**
  - Section title: “Zona de trabajo y ubicación” (or from copy doc).
  - Departments: multi-select from `useDepartments()`.
  - Localidades: after departments selected, show “Localidades (opcional)” and multi-select per department using `useLocalidades(department)`; if none selected, treat as “whole department”.
  - Base address: one field with autocomplete using `useAddressSuggestions`; on select, call `useGeocodeAddress` and show address line + postal; on save, send geocoded result (or address string) in profile update.
  - Helper text as in plan (departments = where you work; base = your base for “near me”).
- **FE practices:** Screen orchestrates hooks and callbacks; presentational subcomponents for lists and inputs; no direct trpc in components.
- **Testing:** Screen tests with mocked hooks (or E2E later).

### 5.3 Presentational components

- **Location:** `apps/pro_mobile/src/components/...`.
- **Components:** e.g. `DepartmentMultiSelect`, `LocalidadMultiSelect`, `AddressAutocomplete` (or reuse from shared UI). All receive data and callbacks via props.
- **FE practices:** Pure presentational; testable with mock props (Storybook optional).

---

## Phase 6: Client app – Search bar zip & results

**Goal:** Search bar has editable zip; optional “use my location” (geolocation → reverse geocode → zip); results page receives and sends `zipCode` (and optionally lat/lng); search uses location for filter and sort.

### 6.1 Hooks

- **Location:** `apps/client/src/hooks/`.
- **Hooks:**
  - `useGeolocation()` – browser geolocation; returns lat/lng or error (no tRPC).
  - `useReverseGeocode(lat, lng)` – optional; calls backend reverse (or a small backend endpoint that calls IDE reverse) to get zip/department; used after “use my location”.
  - Extend `useSearchPros` (or equivalent) to pass `zipCode`, `latitude`, `longitude`, `countryCode` in filters.
- **FE practices:** Hooks encapsulate tRPC and browser API; screens use hooks only.

### 6.2 Search bar – zip field & geolocation

- **Location:** `apps/client/src/components/search/SearchBar.tsx` (or subcomponent).
- **UI:** Editable zip field (5 digits); optional “Usar mi ubicación” that calls `useGeolocation`, then reverse geocode, then sets zip (and optionally stores lat/lng for search). Zip and location state lifted to parent so results page can read from URL.
- **FE practices:** Presentational input + button; parent/screen handles state and callbacks.

### 6.3 Results URL and search filters

- **Location:** `apps/client/src/screens/search/SearchResultsScreen.tsx` (and search screen).
- **Logic:** When user clicks search or selects subcategory, build results URL with existing params plus `zipCode` (and optionally lat/lng if you want to send them). Read `zipCode` from `searchParams`; pass to `useSearchPros` filters.
- **FE practices:** Screen reads URL, passes to hooks; no direct trpc.

### 6.4 Testing (client)

- Unit test hooks with mocked tRPC.
- Unit test presentational components with mock props.
- Optional E2E: set zip, navigate to results, assert query param and (if possible) that results are filtered/sorted.

---

## Phase 7: Data migration & cleanup

**Goal:** Backfill `serviceAreaJson` (and optionally base fields) from existing `serviceArea` where possible; then deprecate or remove `serviceArea`.

### 7.1 Backfill script

- **Location:** One-off script or migration step (e.g. `scripts/backfill-pro-service-area.ts`).
- **Logic:** For each ProProfile with `serviceArea` set and `serviceAreaJson` null: try to parse or match to department names (e.g. “Montevideo” → `{ departments: ["Montevideo"] }`); write `serviceAreaJson`; leave base\* null unless parseable. If no match, set `serviceAreaJson` to `{ departments: [], localidades: [] }` or leave null.
- **Testing:** Run against copy of DB or test DB; assert counts and sample rows.

### 7.2 Deprecate serviceArea

- **After backfill:** Stop reading `serviceArea` for “service area” display in apps; only read `serviceAreaJson` and base\*. Optionally keep `serviceArea` column for history or remove in a later migration.
- **Docs:** Note in changelog or docs that `serviceArea` is deprecated in favor of `serviceAreaJson` + base fields.

---

## Testing summary (aligned with BE/FE practices)

| Layer                      | What to test                                                 | How                                              |
| -------------------------- | ------------------------------------------------------------ | ------------------------------------------------ |
| BE – Reference data        | UY departments validator                                     | Unit test (valid/invalid input).                 |
| BE – Zod schemas           | serviceAreaJson, pro location input                          | Unit test (valid/invalid payloads).              |
| BE – IDE client            | HTTP client mapping IDE → DTO                                | Unit test with mocked fetch.                     |
| BE – Geocoding/Localidades | Provider methods                                             | Unit test with mocked client.                    |
| BE – ProService            | Location validation, build serviceAreaJson, call geocode     | Unit test with mocked repo + geocoding provider. |
| BE – SearchService         | Resolve location, filter by dept/localidad, sort by distance | Unit test with mocked repo + resolve fn.         |
| BE – Repo                  | Map location fields to Prisma                                | Unit test with mocked Prisma or integration.     |
| FE – Hooks                 | useDepartments, useLocalidades, useSearchPros with location  | Mocked tRPC or integration.                      |
| FE – Screens/Components    | Location screen, search bar zip                              | Mocked hooks / Storybook / E2E.                  |

---

## Dependency order

```
Phase 1 (schema + reference) → Phase 2 (IDE integration) → Phase 3 (Pro API)
                                                              ↓
Phase 4 (search) depends on Phase 1 + 2 (resolve location) + 3 (pro data shape)
Phase 5 (Pro app) depends on Phase 3
Phase 6 (Client search) depends on Phase 4
Phase 7 can run after Phase 3 is deployed (backfill) and before/after Phase 5/6
```

---

## References

- [BE_BEST_PRACTICES.md](./BE_BEST_PRACTICES.md) – Router → Service → Repository; DI; module structure; unit tests with mocks.
- [FE_BEST_PRACTICES.md](./FE_BEST_PRACTICES.md) – Hooks for tRPC; screens orchestrate; presentational components; no direct trpc in UI.
- [IDE Uruguay Swagger](https://direcciones.ide.uy/swagger-ui.html) – v1 geocode (candidates, direcUnica, find, reverse), v0 localidades.
