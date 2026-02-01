# Quote and Fixed-Price Flow – Implementation Ideas

This document outlines **what would need to change** to support a **quote + fixed-price** flow alongside the current **hourly-only** flow. Quick questions are **not** used to drive price; they stay as context so pros can give better quotes.

**Order statuses: unchanged.** The same statuses as today are used for both hourly and quote/fixed flows. No new statuses (e.g. no `quote_sent` or `quote_accepted`). The quote sub-flow is represented by **fields** on the order (`quotedAmountCents`, `quoteAcceptedAt`) while status remains **`accepted`** until the client authorizes payment and the order moves to **`confirmed`**. The rest of the lifecycle (in_progress → awaiting_client_approval → completed → paid) is shared.

**Payment strategy by category.** Each category has a **payment strategy** that controls when we preauth and when we capture (e.g. one capture at completion vs deposit + balance for long jobs). For **now**, all categories use the **initial strategy** (`single_capture`): one preauth at confirmation, one capture at completion. The field and seed are in place so later we can set `deposit_balance` or `milestones` for specific categories (e.g. Construcción, Pintura) without changing order statuses.

---

## 1. High-level flow (quote/fixed)

1. **Client** creates a request: category/subcategory, address, time window, description, photos, **quick_questions answers** (stored in `categoryMetadataJson`). **No estimated hours** for fixed; no payment yet.
2. **Pro** accepts the request (same as today).
3. **Pro** sends a **quote** (fixed amount in minor units, optional message). Client sees it.
4. **Client** accepts the quote → agreed amount is locked.
5. **Client** authorizes payment (preauth for agreed amount) and confirms order.
6. **Pro** executes: on my way → arrived → work.
7. **Pro** marks job **complete** (no “submit hours” for fixed).
8. **Client** confirms completion (or auto-approve) → payment captured at agreed amount.

Hourly flow stays as today: client sends estimated hours at creation → pro accepts → client authorizes (cap) → work → pro submits hours → client approves → capture.

---

## 2. Backend changes

### 2.1 Schema (Prisma)

**Category model**

- Add **`pricingMode PricingMode @default(hourly)`** to the Category table. All subcategories of a category share the same pricing mode (no field on Subcategory).
- Add **`paymentStrategy PaymentStrategy @default(single_capture)`** to the Category table. Controls when payment is preauth’d and captured (see payment strategy below). All subcategories share the same strategy. **For now**, seed and use **`single_capture`** only; other strategies are reserved for later.

**Order model**

- **`PricingMode` enum**: add `fixed` (keep `hourly`).
- **Quote / agreed price** (for fixed only):
  - `quotedAmountCents Int?` — pro’s quote in minor units (e.g. cents).
  - `quotedAt DateTime?`
  - `quoteMessage String?` — optional message with the quote.
  - `quoteAcceptedAt DateTime?` — when client accepted the quote (optional but useful for audit).
- **Hourly fields**: for fixed orders, `estimatedHours` can be `null` or a sentinel (e.g. 0). Alternatively keep `estimatedHours` required but ignore it when `pricingMode === 'fixed'` and use `quotedAmountCents` for payment. Recommendation: make `estimatedHours` optional in DB for fixed, or keep it and set a placeholder (e.g. 0) so existing code paths don’t break.
- **`hourlyRateSnapshotAmount`**: for **hourly** orders, snapshot the rate from **ProProfileCategory(proId, categoryId).hourlyRateCents** (or fallback to ProProfile.hourlyRate). For fixed, can be 0 or unused; payment uses `quotedAmountCents` only.

**ProProfileCategory (junction table)**

- Today the junction only has `proProfileId`, `categoryId`, timestamps — no price. **ProProfile** has a single global **hourlyRate**.
- Add **starting price per category** — **required for every category** the pro offers:
  - **`hourlyRateCents Int?`** — required when **Category.pricingMode is hourly**. Pro’s hourly rate for that category; used for order snapshot and display (“Desde $X/hora”). When null for an hourly category, fallback to **ProProfile.hourlyRate** (e.g. migration); validation can require it when adding hourly categories.
  - **`startingFromCents Int?`** — required when **Category.pricingMode is fixed**. Display-only “Desde $X”; actual price is the quote per order. Clients see “Desde $X” when browsing pros for fixed categories.
- **Rule**: for any category a pro offers, they must set exactly one starting price: **hourly** → `hourlyRateCents`; **fixed** → `startingFromCents`. Validation at API level: when adding/updating categories, require the appropriate field based on **Category.pricingMode**.

**Domain / API**

- Order schema: add `quotedAmountCents`, `quotedAt`, `quoteMessage`, `quoteAcceptedAt`; `estimatedHours` optional when `pricingMode === 'fixed'`.
- Order create input: when category is “quote/fixed”, accept `pricingMode: 'fixed'` and omit or pass 0 for `estimatedHours` (validation: if `pricingMode === 'fixed'`, `estimatedHours` not required).
- Pro/Category: expose **ProProfileCategory.hourlyRateCents** and **startingFromCents** in APIs. Client app shows “Desde $X/hora” (hourly) or “Desde $X” (fixed) per category. Pro app must let pros set both when adding/editing categories (required per category).

### 2.2 Category model: pricing mode and payment strategy

**Pricing mode**

- **`pricing_mode` is part of the Category entity**, not metadata. Add a column to the **Category** model, e.g. `pricingMode PricingMode @default(hourly)` (using the same enum as Order).
- **All subcategories of a category share the same pricing mode** — there is no per-subcategory override. When validating or rendering an order, use `order.category.pricingMode` (or the category fetched by `order.categoryId`).
- **Seed**: when seeding categories (e.g. from `config.seed.json` or a seed script), set each category’s `pricingMode` (`"hourly"` or `"fixed"`). Default for existing categories is `hourly`. Do **not** put `pricing_mode` inside `configJson`; it is a first-class field on the Category table.
- Backend reads `category.pricingMode` when validating order creation (e.g. allow fixed only when the order’s category has `pricingMode === 'fixed'`). No need for quick_questions to drive price; they’re already in `categoryMetadataJson` for the pro to use when quoting.

**Payment strategy by category (§ 2.2.1)**

- Add **`paymentStrategy PaymentStrategy @default(single_capture)`** to the **Category** model (new enum, first-class field). All subcategories share it. Used by payment flow to decide: one preauth + one capture vs deposit + balance vs milestones.
- **Enum `PaymentStrategy`**: `single_capture` | `deposit_balance` | `milestones` (implement only `single_capture` for now).
  - **`single_capture`** (initial strategy): one preauth at confirmation (full amount), one capture at completion when client approves. Same as current plan. Use for all categories initially.
  - **`deposit_balance`** (later): capture deposit (e.g. 30%) at confirmation, preauth/capture balance (70%) at completion. For categories where jobs often run 3–7+ days (e.g. Construcción, Pintura).
  - **`milestones`** (later): multiple captures at agreed milestones (e.g. 30% / 40% / 30%). For very long or high-value jobs.
- **Seed**: when seeding categories, set each category’s **`paymentStrategy`** to **`single_capture`** for now. Do **not** put it in `configJson`; it is a first-class field. Later, switch specific categories (e.g. Construcción, Pintura) to `deposit_balance` when that flow is implemented.
- **Backend**: when creating preauth / confirming / finalizing, read **`category.paymentStrategy`** (from order’s category). **For now**, only handle `single_capture`: one preauth for full amount, one capture at completion. Branching for `deposit_balance` and `milestones` is out of scope until those strategies are implemented.

**Resolving the pro’s rate for an order (hourly only)**

- When creating an **hourly** order: resolve **hourlyRateSnapshotAmount** from **ProProfileCategory** for `(proProfileId, categoryId)`: use `rel.hourlyRateCents` if set, else **ProProfile.hourlyRate**. Ensures the pro’s price is per category and per pricing mode (hourly rate only on the junction for hourly categories; fixed categories get no rate at creation).

### 2.3 New procedures / services

**Pro submits quote**

- **`order.submitQuote`** (pro): input `{ orderId, amountCents, message?: string }`.
  - Allowed when: order status is `accepted`, `pricingMode === 'fixed'`, actor is the order’s pro.
  - Idempotency: optional — e.g. allow one quote per order, or “last quote wins”.
  - Effect: set `quotedAmountCents`, `quotedAt`, `quoteMessage` on order; status can stay `accepted` (client still has to “accept quote” and pay).

**Client accepts quote**

- **`order.acceptQuote`** (client): input `{ orderId }`.
  - Allowed when: order status is `accepted`, `pricingMode === 'fixed'`, `quotedAmountCents` is set, actor is client.
  - Effect: set `quoteAcceptedAt` (and optionally snapshot “agreed amount” if you add a separate field). After this, client can call payment preauth.

**Payment (existing flow, extended)**

- **`payment.createPreauthForOrder`**: today it uses `hourlyRateSnapshotAmount * estimatedHours`. Extend:
  - Resolve **category** from order (by `order.categoryId`) and read **`category.paymentStrategy`**. **For now** only **`single_capture`** is implemented: preauth the full amount (fixed: `quotedAmountCents`; hourly: `hourlyRateSnapshotAmount * estimatedHours`). Future: for `deposit_balance`, preauth full but capture only deposit at confirm; for `milestones`, preauth full and capture per milestone (not in scope yet).
  - If `pricingMode === 'fixed'` and `quotedAmountCents` (and optionally `quoteAcceptedAt`) are set → use `quotedAmountCents` as the preauth amount (when strategy is `single_capture`).
  - Else use `hourlyRateSnapshotAmount * estimatedHours` as today.
- **`order.confirm`**: no change; still “payment must be AUTHORIZED” then transition to `confirmed`. With `single_capture`, no capture at confirm; capture happens at finalization.

**Finalization (fixed vs hourly)**

- Today: **`order.approveHours`** → lifecycle approves hours → **`orderFinalizationService.finalizeOrder(orderId, approvedHours, ...)`** → build line items from hours × rate, capture payment.
- For **fixed**:
  - Option A: Pro **marks complete** without submitting hours → new **`order.submitCompletion`** (pro) for fixed: sets status to `awaiting_client_approval`, no `finalHoursSubmitted`. Client then “confirms work done” (reuse **`approveHours`** or add **`confirmCompletion`**). In finalization, when `pricingMode === 'fixed'`, use `quotedAmountCents` (or agreed amount) to build a single labor line item and capture that amount (no hours).
  - Option B: Reuse “submit hours” for fixed by sending a dummy quantity (e.g. 1) and storing agreed amount as “labor” in line items; backend treats `pricingMode === 'fixed'` and uses `quotedAmountCents` for capture instead of recalculating from hours. Option A is clearer.

Recommendation: **Option A** — for fixed, pro calls **`submitCompletion`** (no hours); client calls **`confirmCompletion`** (or reuse **`approveHours`** with no hours UI); finalization service detects `pricingMode === 'fixed'` and uses `quotedAmountCents` for labor amount and capture.

### 2.4 Order lifecycle: same statuses only

- **Use the same order statuses as today.** No new statuses. Existing enum: `draft`, `pending_pro_confirmation`, `accepted`, `confirmed`, `in_progress`, `awaiting_client_approval`, `disputed`, `completed`, `paid`, `canceled`.
- **Quote/fixed sub-flow within `accepted`**: After the pro accepts, for fixed orders the pro sends a quote and the client accepts it. **Status stays `accepted`** throughout; we only set `quotedAmountCents`, `quotedAt`, `quoteMessage`, and `quoteAcceptedAt`. Client cannot preauth until `quotedAmountCents` and `quoteAcceptedAt` are set. Then client authorizes payment → status moves to **`confirmed`** (same as hourly).
- **Rest of lifecycle unchanged**: `confirmed` → `in_progress` (pro starts) → … → `awaiting_client_approval` (pro completes; for fixed, “submit completion” instead of “submit hours”) → `completed` (client approves; for fixed, approve completion / capture agreed amount) → `paid`. Same status names; only the actions and data (quote fields, no hours for fixed, finalization by amount) differ.

### 2.5 Estimation / cost breakdown

- **`order.estimateCost`**: today takes `proProfileId`, `estimatedHours`, `categoryId`. For fixed, before the pro quotes, you might return a “no estimate yet” or a range from category config; after quote, the “estimate” is the quoted amount. So either:
  - Allow `estimateCost` without `estimatedHours` when order already has `quotedAmountCents` (return breakdown for that amount), or
  - Add a separate “get quote breakdown” for an order that has a quote.
- **`order.getById`** (detail view): when `pricingMode === 'fixed'` and `quotedAmountCents` is set, `costBreakdown` should show the quoted (or agreed) amount, not hours × rate. Same for after finalization (receipt uses agreed amount).

### 2.6 Quick questions

- **No backend change** for “quick questions don’t drive price.” They’re already stored in `categoryMetadataJson` and returned with the order. Pros see them in job detail and use them to decide the quote. Optional: ensure job-detail/order APIs return `categoryMetadataJson` (and subcategory name) so the pro app can show “Client answers: …” clearly.

---

## 3. Frontend – Client app

### 3.1 Category and wizard entry

- When loading **category** (e.g. from API), read **`pricingMode`** from the Category entity. All subcategories of that category use the same pricing mode.
- If **`category.pricingMode === 'fixed'`**:
  - Don’t show the **“Horas estimadas”** (hours) field in **LocationStep** (or show a different copy: “El profesional te enviará un presupuesto después de aceptar”).
  - In **ReviewStep** and **useReviewStepSubmit**: for fixed, call **createOrder** with `pricingMode: 'fixed'` and omit `estimatedHours` (or send 0 if API still requires it until you relax validation). Ensure backend accepts this.

### 3.2 Order creation payload

- **useReviewStepSubmit** / **useCreateOrder**: if category is fixed, payload should include `pricingMode: 'fixed'` and no (or zero) `estimatedHours` once API allows it.

### 3.3 Job detail (order status)

- **ACCEPTED + fixed**: don’t show “Authorize payment” yet. Show “El profesional te enviará un presupuesto. Te avisaremos cuando esté listo.” (and optionally show quote when `quotedAmountCents` is set).
- When **quote is present** (`quotedAmountCents` set): show “Presupuesto: $X. ¿Aceptar y pagar?” and an **Accept quote** button → call **`order.acceptQuote`**.
- After **quote accepted** (`quoteAcceptedAt` set): show **Authorize payment** as today → same checkout flow (preauth for `quotedAmountCents`).
- **CheckoutScreen**: already uses order from `getById`; backend will return the amount to authorize (quoted amount for fixed), so the same screen can work if the preauth amount is correct.
- **Payment success / confirm**: unchanged; client returns, then calls **confirm** if needed (or confirm is triggered by webhook). Then order is `confirmed`.

### 3.4 Completion (fixed)

- When order is **awaiting_client_approval** and **fixed**: don’t show “approve hours” or “dispute hours.” Show “Confirmar que el trabajo se realizó” or “Marcar como completado” → call **confirmCompletion** (or **approveHours** with a backend that treats fixed as “approve completion, capture agreed amount”). No hours input.

### 3.5 Cost summary / receipt

- **JobDetailCostSummary** and receipt: when `pricingMode === 'fixed'`, show fixed amount (quoted/agreed) instead of “X horas × $Y/h”.

### 3.6 Pro profile page: category context and hire column

Today the pro profile in the client app shows **price/h** (hourly rate) always. With per-category starting prices (hourly rate or “precio desde”), that single “price/h” is no longer correct: the pro has a different starting price per category.

**Adaptation: use category + subcategory query params**

- **Query params:** The pro profile page (and any “view pro” route) should accept **`category`** (or `categoryId`) and optionally **`subcategory`** (or `subcategoryId`) as query params. These indicate the context: “the client is viewing this pro in the context of hiring for this category (and subcategory).”
- **When category (and optionally subcategory) params ARE set:**
  - **Show the right column/section to hire** (e.g. “Contratar” CTA, price column, “Solicitar” button).
  - Resolve the **category** from the param (by id or slug). Resolve the pro’s **starting price for that category** from **ProProfileCategory(proId, categoryId)** (and category.pricingMode): if **hourly** → show “Desde $X/hora” (from `hourlyRateCents`); if **fixed** → show “Desde $X” (from `startingFromCents`). Only show the hire column and price if the pro **offers that category** (has a ProProfileCategory for that categoryId).
  - Do **not** show a single global “price/h” for the whole profile; show only the starting price for the category in context.
- **When category/subcategory params are NOT set:**
  - **Do not show the right column to hire** (hide the hire CTA, price column, “Solicitar” / “Contratar” section). Reason: there is no single “profile price”; each category has its own rate or “precio desde,” so showing a generic hourly rate would be misleading. The client should reach the pro profile from a **category flow** (e.g. browse/search by category → click pro) so the URL includes `category` (and optionally `subcategory`).
- **Links to pro profile:** From category/subcategory search results, listing, or “choose a pro” step, link to the pro profile **with** query params, e.g. `/pro/[id]?category=slug` or `?categoryId=...&subcategoryId=...`, so the hire column and correct starting price are shown. Direct or bookmark visits without params show the pro’s bio and services but no hire/price column until the user selects a category (e.g. from a “¿Para qué servicio?” selector on the same page, which then adds params and shows the hire column).

**Summary**

| Params                                        | Show hire column?                 | Price shown                                                     |
| --------------------------------------------- | --------------------------------- | --------------------------------------------------------------- |
| `category` (and optionally `subcategory`) set | Yes (if pro offers that category) | Starting price for that category: “Desde $X/hora” or “Desde $X” |
| Params not set                                | No                                | —                                                               |

---

## 4. Frontend – Pro app (React Native)

### 4.1 Job detail – accept vs send quote

- When order is **pending_pro_confirmation** and category is **fixed**: pro still **accepts** first (same as today). After accept, status is `accepted`.
- For **fixed**, after accept: show **“Enviar presupuesto”** instead of only “Waiting for client to pay.” Pro enters **amount** (and optional message) and submits → **`order.submitQuote`**.

### 4.2 After sending quote

- Show “Presupuesto enviado: $X. Esperando que el cliente acepte y pague.”
- When client has accepted quote and paid (order `confirmed`): show normal flow (on my way, arrive, complete).

### 4.3 Completion (fixed)

- For **fixed**, when pro finishes the job: don’t show “Submit hours” (no `finalHours` input). Show **“Marcar trabajo completado”** → call **`order.submitCompletion`** (new) with no hours. Backend sets status to `awaiting_client_approval` and uses `quotedAmountCents` for finalization when client confirms.

### 4.4 Pro profile: starting price per category (required)

- When a pro **adds or edits categories** (onboarding or settings): for **every** category they offer, they must set a **starting price**. For **hourly** categories: require **hourly rate for this category** (ProProfileCategory.hourlyRateCents). For **fixed** categories: require **“Precio desde” / “Starting from”** (ProProfileCategory.startingFromCents). No category without a starting price.
- Search / client-facing pro card: for **hourly** categories show “Desde $X/hora” from hourlyRateCents; for **fixed** show “Desde $X” from startingFromCents.

### 4.5 Pro mobile app: managing category rates

The pro mobile app today sends a **single global hourly rate** and **categoryIds** (no per-category rate). To support **required starting price per category** (hourlyRateCents for hourly, startingFromCents for fixed), the following changes are needed.

**API / backend**

- **Category list**: `category.getAll` (or equivalent) must return each category with **pricingMode** so the app knows for each category whether to ask for “tarifa por hora” or “precio desde”.
- **Pro profile read**: `pro.getMyProfile` (and any pro-by-id used by client) should return **category relations with rates**: e.g. `categoryRelations: Array<{ categoryId, category: { id, name, pricingMode }, hourlyRateCents?, startingFromCents? }>` so the app can display and edit “your rate for Plumbing: $X/h” or “your starting from for Electrical: $Y”.
- **Pro create/update payload**: Change from `categoryIds: string[]` to a structure that includes per-category rates, e.g. `categoryRates: Array<{ categoryId: string, hourlyRateCents?: number, startingFromCents?: number }>`. For each entry, require **hourlyRateCents** when that category’s pricingMode is **hourly**, and **startingFromCents** when **fixed**. Backend validates and persists to ProProfileCategory (hourlyRateCents, startingFromCents).

**OnboardingScreen** (`apps/pro_mobile/src/screens/onboarding/OnboardingScreen.tsx`)

- Today: one global **“Tarifa por hora (UYU)”** input and **CategorySelector** (multi-select by id). Submit sends `hourlyRate`, `categoryIds`.
- Change: after (or integrated with) category selection, the pro must set a **starting price for each selected category**. Options:
  - **Option A (recommended)**: Keep CategorySelector for multi-select. Below it, show a **“Tarifas por categoría”** section: for each selected category, one row with category name + **one input**: if `category.pricingMode === 'hourly'` show “Tarifa por hora (UYU) _”, if `fixed` show “Precio desde (UYU) _”. All required. Default hourly categories to current global `hourlyRate` if desired. Submit payload: `categoryRates: selectedCategories.map(cat => ({ categoryId: cat.id, hourlyRateCents: ... | startingFromCents: ... }))` (and optionally keep global hourlyRate as default for new hourly categories).
  - **Option B**: When user taps a category to select it, open a **modal/sheet** to set the rate for that category (hourly rate or “precio desde” depending on category.pricingMode) before adding it; selection state becomes “category + rate”. Submit sends categoryRates.
- Remove or repurpose the single global “Tarifa por hora” at the top: either remove it and require per-category only, or keep it as **default for hourly categories** when adding the first one, then show per-category inputs that can override.
- Validation: for each selected category, the corresponding rate (hourlyRateCents or startingFromCents) must be present and valid.

**EditProfileScreen** (`apps/pro_mobile/src/screens/profile/EditProfileScreen.tsx`)

- Today: one global **“Tarifa por hora”** and **CategorySelector** (selected from `pro.categoryIds`). Update sends `hourlyRate`, `categoryIds`.
- Change: load and display **per-category rates** from `pro.categoryRelations` (or equivalent). For each selected category, show category name and the appropriate input (hourly rate or “precio desde”) pre-filled. Same “Tarifas por categoría” section as onboarding: list selected categories with one rate input each (hourly or starting from by category.pricingMode). Save sends `categoryRates` instead of (or in addition to) `categoryIds`.
- If the API still returns `categoryIds` and a separate structure for rates, merge them for display (e.g. selected categories with their rates from categoryRelations). When saving, send full categoryRates so backend can replace junction rows with new rates.

**CategorySelector** (`apps/pro_mobile/src/components/presentational/CategorySelector.tsx`)

- Today: only multi-select categories (toggle); no rate input. Parent holds `Category[]` selected.
- Options:
  - **Keep as-is**: CategorySelector stays “select categories only”. Parent (OnboardingScreen / EditProfileScreen) adds a **CategoryRatesEditor** (new component) below: given `selectedCategories` and `category.pricingMode` per category, render one input per category (hourly rate or starting from). Parent state: `selectedCategories` + `categoryRates: Record<categoryId, { hourlyRateCents?: number, startingFromCents?: number }>`.
  - **Extend CategorySelector**: Pass `categories` with `pricingMode` and optional `categoryRates`; when a category is selected, show inline or in a small row the rate input. More coupled but single component.

**New component: CategoryRatesEditor (suggested)**

- Props: `categories: Category[]` (selected, with pricingMode), `rates: Record<string, { hourlyRateCents?: number, startingFromCents?: number }>`, `onRatesChange`, `errors?`.
- Renders one row per category: category name + one input (label “Tarifa por hora (UYU) _” or “Precio desde (UYU) _” depending on category.pricingMode). Validates required and > 0. Used in OnboardingScreen and EditProfileScreen below CategorySelector.

**Hooks / submit payload**

- **useOnboarding**: `submitOnboarding` today accepts `ProOnboardInput` with `hourlyRate`, `categoryIds`. Change to accept **categoryRates** (array of { categoryId, hourlyRateCents?, startingFromCents? }) and optionally keep hourlyRate as default. Same for **pro.updateProfile** in EditProfileScreen: payload must include categoryRates so backend can persist ProProfileCategory.hourlyRateCents and startingFromCents.
- **Domain**: `ProOnboardInput` / pro update schema: add `categoryRates` (or replace categoryIds with it). Backend creates/updates ProProfileCategory with the correct fields per category.pricingMode.

**Summary (pro mobile)**

| Area                                 | Change                                                                                                                                            |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **category.getAll**                  | Return `pricingMode` per category.                                                                                                                |
| **pro.getMyProfile**                 | Return category relations with `hourlyRateCents`, `startingFromCents` per category.                                                               |
| **pro.convertToPro / updateProfile** | Accept `categoryRates: Array<{ categoryId, hourlyRateCents?, startingFromCents? }>`; validate and persist to ProProfileCategory.                  |
| **OnboardingScreen**                 | After category selection, require starting price per category (CategoryRatesEditor); submit categoryRates; optional global hourlyRate as default. |
| **EditProfileScreen**                | Load and edit per-category rates; save categoryRates.                                                                                             |
| **CategorySelector**                 | Unchanged or extended; parent must hold categoryRates state.                                                                                      |
| **CategoryRatesEditor**              | New component: one rate input per selected category (hourly or “precio desde” by pricingMode).                                                    |

### 4.6 Quick questions for pros

- In job detail (and inbox list if space): show **categoryMetadataJson** in a readable way (“Cliente indicó: …”) so pros can use it to prepare the quote. No backend change; just UI to display existing fields.

---

## 5. Summary of “what to build”

| Layer                             | What to do                                                                                                                                                                                                                                                                                                                          |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Category model**                | Add `pricingMode PricingMode @default(hourly)` and **`paymentStrategy PaymentStrategy @default(single_capture)`** to the **Category** table. All subcategories share both. Seed: set `pricingMode` per category; set **`paymentStrategy` to `single_capture` for all categories** for now. Do **not** store either in `configJson`. |
| **ProProfileCategory (junction)** | Add **`hourlyRateCents Int?`** (required when category is hourly) and **`startingFromCents Int?`** (required when category is fixed). Pro must set a **starting price for every category** they offer: hourly → hourly rate (“Desde $X/hora”); fixed → “precio desde” (“Desde $X”, display only; actual price is quote per order).  |
| **Order statuses**                | **Same as today.** No new statuses. Quote sub-flow lives inside `accepted` (quote fields only); then `confirmed` → `in_progress` → `awaiting_client_approval` → `completed` → `paid` unchanged.                                                                                                                                     |
| **Schema (Order)**                | Add `fixed` to `PricingMode`; add `quotedAmountCents`, `quotedAt`, `quoteMessage`, `quoteAcceptedAt` on Order; make `estimatedHours` optional or allow 0 for fixed.                                                                                                                                                                 |
| **Domain**                        | Order schema and create input: support `pricingMode: 'fixed'`, optional `estimatedHours`; add quote fields. Category: expose `pricingMode`. ProProfileCategory / pro API: expose `hourlyRateCents` and `startingFromCents` per category; pro create/update accepts `categoryRates` with required starting price per category.       |
| **Order creation**                | For **hourly**: resolve snapshot rate from **ProProfileCategory(proId, categoryId).hourlyRateCents** else ProProfile.hourlyRate. Validate fixed when **category.pricingMode === 'fixed'**; allow create without (or with 0) `estimatedHours`.                                                                                       |
| **Order router**                  | New: `submitQuote` (pro), `acceptQuote` (client). Optional: `submitCompletion` (pro, fixed only), or reuse `submitHours` with special handling.                                                                                                                                                                                     |
| **Payment**                       | Branch on **`category.paymentStrategy`**. For **`single_capture`** (only strategy for now): preauth full amount at confirm (fixed: `quotedAmountCents`; hourly: `hourlyRateSnapshotAmount * estimatedHours`); capture once at completion. Future: `deposit_balance` and `milestones` reserved.                                      |
| **Finalization**                  | When `pricingMode === 'fixed'`, build line items and capture from `quotedAmountCents`; no hours. Trigger from client “confirm completion” (or approveHours with no hours).                                                                                                                                                          |
| **Estimate / getById**            | Cost breakdown for fixed: use quoted/agreed amount; no hours-based estimate before quote.                                                                                                                                                                                                                                           |
| **Client wizard**                 | Read `category.pricingMode`; if fixed: hide hours input; submit with `pricingMode: 'fixed'` and no hours.                                                                                                                                                                                                                           |
| **Client pro profile**            | Use **category** (and optionally **subcategory**) query params. If set: show hire column and pro’s starting price for that category (“Desde $X/hora” or “Desde $X”). If **not** set: do **not** show the right column to hire. Link to pro profile with params from category flow.                                                  |
| **Client job detail**             | If fixed: show “wait for quote” → “accept quote” → “authorize payment” → “confirm completion” (no approve hours).                                                                                                                                                                                                                   |
| **Pro job detail**                | If fixed: after accept, “Send quote” form; after quote sent, “wait for client”; on completion, “Mark complete” (no hours).                                                                                                                                                                                                          |
| **Pro mobile: category rates**    | Category list with `pricingMode`; getMyProfile with category relations + rates; create/update with `categoryRates`. OnboardingScreen + EditProfileScreen: require starting price per selected category (CategoryRatesEditor); submit categoryRates.                                                                                 |
| **Quick questions**               | No change to logic; ensure pro UI shows `categoryMetadataJson` so pros can use it for quoting.                                                                                                                                                                                                                                      |

---

## 6. Optional extensions (later)

- **Multiple quotes**: allow pro to update quote before client accepts (e.g. “last quote wins”).
- **Suggested range**: on Category or in config, add `suggested_min_cents`, `suggested_max_cents` for display only (e.g. “Presupuestos típicos: $X–$Y”). Not used for payment.
- **Hourly + cap**: some categories might want “pro quotes max hours and rate” then client authorizes cap; capture still by final hours. That’s a small variant of the hourly flow with a “quote” for the cap.
- **Payment strategy `deposit_balance`**: implement for categories where jobs often run 3–7+ days (e.g. Construcción, Pintura). Capture deposit at confirm, balance at completion.
- **Payment strategy `milestones`**: implement for very long or high-value jobs; multiple captures at agreed milestones.

This document is ideas only; no code changes were made. Implement in small steps: schema + backend quote/acceptQuote and payment/finalization for fixed first, then client wizard and job detail, then pro app. Payment strategy: add enum and Category field, seed all as `single_capture`, and branch in payment logic so only `single_capture` is used until deposit_balance/milestones are built.
