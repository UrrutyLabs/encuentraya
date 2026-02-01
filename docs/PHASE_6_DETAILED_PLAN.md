# Phase 6: Pro mobile app – Category rates (onboarding, edit profile) – Detailed plan

**Goal:** Pro sets starting price per category (hourly rate or “precio desde”); category list has pricingMode; getMyProfile returns categoryRelations with rates; onboarding and edit profile use categoryRates.

---

## Current state (pro_mobile)

- **Category list:** `trpc.category.getAll.useQuery()` – API already returns `pricingMode` per category (Phase 2).
- **OnboardingScreen:** Single “Tarifa por hora” input + CategorySelector; submit payload: `hourlyRate` (minor units), `categoryIds`. Calls `pro.convertToPro` with `ProOnboardInput`. Domain/API already accept optional `categoryRates` and optional `categoryIds`; when `categoryRates` is provided, backend uses it for junction (Phase 2).
- **EditProfileScreen:** Single “Tarifa por hora” + CategorySelector; load from `pro.getMyProfile` (has `categoryIds`, `hourlyRate`); save with `hourlyRate` + `categoryIds`. API `getMyProfile` already returns `categoryRelations` with `hourlyRateCents`, `startingFromCents`, and `category.pricingMode`.
- **CategorySelector:** Only selects categories (no rate inputs). No per-category rate UI today.

---

## 6.1 API usage and hooks (pro mobile)

### 6.1.1 Category list

- **No change:** `category.getAll` already returns `pricingMode` for each category. Pro app will use it to show “Tarifa por hora” vs “Precio desde” per category in the new editor.

### 6.1.2 useOnboarding

- **Payload change:** Submit with `categoryRates: Array<{ categoryId, hourlyRateCents?, startingFromCents? }>` only (no single hourlyRate + categoryIds).
  - Build `categoryRates` from screen state: for each selected category, include the rate entered for that category (`hourlyRateCents` when category.pricingMode === 'hourly', `startingFromCents` when 'fixed').
- **API:** Call `pro.convertToPro` with `categoryRates`; backend already validates and persists (Phase 2).

### 6.1.3 Pro update (EditProfileScreen)

- **Payload change:** Send `categoryRates` in update payload (same shape as onboarding). Call `pro.updateProfile` with `categoryRates`; backend replaces ProProfileCategory rows with new rates.
- **Keep:** `categoryIds` can be derived from selected categories and sent together, or backend derives from categoryRates; confirm router accepts categoryRates-only or categoryIds + categoryRates.

---

## 6.2 CategoryRatesEditor component

### 6.2.1 Responsibility

- **New component:** `CategoryRatesEditor` (or equivalent name).
- **Props (conceptual):**
  - `selectedCategories: Category[]` – categories currently selected (each has `pricingMode` from API).
  - `rates: Record<string, { hourlyRateCents?: number; startingFromCents?: number }>` – current values per categoryId (major units for display if you use strings, or minor units; see 6.2.2).
  - `onRatesChange: (rates) => void` – when user edits a rate.
  - `errors?: Record<string, string>` – per-category validation errors (e.g. categoryId → message).
- **UI:** For each category in `selectedCategories`:
  - If `category.pricingMode === 'hourly'`: one input, label “Tarifa por hora (UYU) \*”.
  - If `category.pricingMode === 'fixed'`: one input, label “Precio desde (UYU) \*”.
- **Validation:** Required; value must be > 0 and ≤ 999999 (same for hourly and fixed). Validate on blur or on submit (parent decides).

### 6.2.2 Units

- **Storage/API:** `hourlyRateCents` and `startingFromCents` are in **minor units** (cents). Domain uses “Cents” in the name.
- **Display:** Pro mobile today uses `toMinorUnits` for submit (so the single hourly rate is stored in minor units). For consistency, inputs can show **major units** (e.g. user types 500 for 500 UYU) and convert to minor units when building `categoryRates` for API.

### 6.2.3 Placement

- Used **below** CategorySelector in OnboardingScreen and EditProfileScreen. Parent state: `selectedCategories` + `categoryRates` (e.g. `Record<categoryId, { hourlyRateCents?: number; startingFromCents?: number }>` in minor units for API, or major for display then convert on submit).

---

## 6.3 OnboardingScreen

### 6.3.1 State

- Keep: `selectedCategories`, `name`, `phone`, `serviceArea`, etc.
- Remove: single `hourlyRate` (only per-category rates).
- Add: `categoryRates: Record<string, { hourlyRateCents?: number; startingFromCents?: number }>` (or equivalent). When a category is selected, init its rate to empty. When a category is deselected, remove its entry from `categoryRates`.

### 6.3.2 UI

- Remove the single “Tarifa por hora” at the top (one rate per category below selector).
- Below CategorySelector, render **CategoryRatesEditor** for `selectedCategories` and `categoryRates`, with `onRatesChange` updating state.
- On submit: build `categoryRates: Array<{ categoryId, hourlyRateCents?, startingFromCents? }>` from state (only the field required by each category’s pricingMode). Call `submitOnboarding` with `categoryRates` only.

### 6.3.3 Validation

- For each selected category, require the appropriate rate: hourly → `hourlyRateCents` > 0, max 999999 (in display major units; convert to minor for API); fixed → `startingFromCents` > 0, max 999999 (same). Show per-field or per-category errors.

---

## 6.4 EditProfileScreen

### 6.4.1 Load

- When `pro.getMyProfile` loads, use `pro.categoryRelations` (with `hourlyRateCents`, `startingFromCents`, `category.id`, `category.name`, `category.pricingMode`).
- Merge with `categories` from `category.getAll`: selected categories = those in `pro.categoryRelations` (or match `pro.categoryIds` with categories list).
- Pre-fill **CategoryRatesEditor**: for each relation, set rate in state. Note: API returns rates in **cents** (minor units); if editor displays major units, convert with `toMajorUnits` for display and `toMinorUnits` when saving.

### 6.4.2 Legacy pros

- If `categoryRelations` have null rates (legacy pros), show empty inputs and require the pro to enter rates (no pre-fill from pro.hourlyRate).

### 6.4.3 Save

- On save, send `categoryRates` (same shape as onboarding) built from current selected categories and their rates. Backend replaces junction rows. Keep sending `categoryIds` if the API expects them, or rely on backend deriving from categoryRates.

---

## 6.5 Tests (minimum)

- **useOnboarding:** Update tests so submit payload uses `categoryRates` instead of (or in addition to) `hourlyRate` + `categoryIds`. Mock API to expect `categoryRates`; assert payload shape per category (hourlyRateCents for hourly category, startingFromCents for fixed).
- **CategoryRatesEditor (or onboarding screen):** If component tests exist, add: render with 1 hourly and 1 fixed category; expect one “Tarifa por hora” and one “Precio desde” input; validation: empty rate, invalid number.
- **Edit profile:** When profile has categoryRelations with rates, form shows them; on save, categoryRates payload is sent. If no dedicated edit-profile hook test, add assertions in screen test or integration test.

---

## Summary table

| Area                    | Current                                     | Phase 6 change                                                                |
| ----------------------- | ------------------------------------------- | ----------------------------------------------------------------------------- |
| **Category list**       | getAll used                                 | Already has pricingMode; use for labels in editor                             |
| **useOnboarding**       | hourlyRate + categoryIds                    | categoryRates array (hourlyRateCents / startingFromCents per category)        |
| **OnboardingScreen**    | Single “Tarifa por hora” + CategorySelector | CategorySelector + CategoryRatesEditor (one rate per selected category)       |
| **EditProfileScreen**   | Single “Tarifa por hora” + CategorySelector | Load categoryRelations rates; CategoryRatesEditor; save categoryRates         |
| **CategoryRatesEditor** | —                                           | New: one input per category (label by pricingMode), validate required and > 0 |

---

## Decisions (Phase 6)

1. **Onboarding:** Only per-category rates (categoryRates). No single “Tarifa por hora” field; no default hourly rate.
2. **Labels:** Hourly: “Tarifa por hora (UYU) _”. Fixed: “Precio desde (UYU) _” (short: “Precio desde”).
3. **Currency:** Hardcode “UYU” in labels.
4. **Validation:** Required, greater than 0, max 999999 (same for hourly and fixed).
5. **Edit profile – legacy pros:** If categoryRelations have null rates, show empty and require input (no pre-fill from pro.hourlyRate).
6. **Test scope:** Minimum (useOnboarding payload tests + one CategoryRatesEditor or onboarding test).
