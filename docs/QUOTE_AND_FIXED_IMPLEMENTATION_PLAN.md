# Quote and Fixed-Price Flow – Implementation Plan

This document is the **exact phased plan** to implement all changes described in **QUOTE_AND_FIXED_FLOW_IDEAS.md**. Phases and subphases are grouped by app. Each phase includes **updating API service tests** and **frontend hook/component tests** where applicable.

---

## Phase 1: Schema and domain (shared + API)

**Goal:** Add Prisma schema changes, migrations, and domain types/schemas. No app behavior changes yet.

### 1.1 Prisma schema

- **Category:** Add `pricingMode PricingMode @default(hourly)` and `paymentStrategy PaymentStrategy @default(single_capture)`. Create enum `PaymentStrategy` with value `single_capture` (reserve `deposit_balance`, `milestones` in enum or comment).
- **PricingMode enum:** Add value `fixed` (keep `hourly`).
- **Order:** Add `quotedAmountCents Int?`, `quotedAt DateTime?`, `quoteMessage String?`, `quoteAcceptedAt DateTime?`. Make `estimatedHours` optional (e.g. `Float?`) or keep required and document “use 0 for fixed”; ensure `hourlyRateSnapshotAmount` can be 0 for fixed. Add `pricingMode` to Order if not already (use same enum).
- **ProProfileCategory:** Add `hourlyRateCents Int?`, `startingFromCents Int?`.
- Run migration; update seed script (if any) to read `pricing_mode` and `payment_strategy` from `config.seed.json` and set on Category, and to set ProProfileCategory rates when seeding (or leave junction rates for app-only).

**Tests:** None at this phase (schema only).

---

### 1.2 Domain package (`packages/domain`)

- **Enums:** Export `PaymentStrategy` (e.g. `single_capture`, `deposit_balance`, `milestones`); ensure `PricingMode` includes `fixed`.
- **Category schema:** Add `pricingMode` and `paymentStrategy` to category schema (and to API response type if different).
- **Order schema:** Add `quotedAmountCents`, `quotedAt`, `quoteMessage`, `quoteAcceptedAt`; make `estimatedHours` optional when `pricingMode === 'fixed'` (or allow zero). Add `pricingMode` to order schema.
- **Order create input:** Allow `estimatedHours` optional or zero when `pricingMode: 'fixed'`; add optional `pricingMode` to input.
- **Pro schema / pro-by-id response:** Add `categoryRelations?: Array<{ categoryId, category: { id, name, pricingMode }, hourlyRateCents?, startingFromCents? }>` (or equivalent). Add input type for `categoryRates: Array<{ categoryId, hourlyRateCents?, startingFromCents? }>` for create/update.

**Tests:** Domain unit tests if they exist for schemas (e.g. validation). Otherwise skip.

---

## Phase 2: API – Category and Pro (pricing, payment strategy, category rates)

**Goal:** Category returns `pricingMode` and `paymentStrategy`; Pro CRUD and getById support per-category rates; order creation uses category rate for hourly.

### 2.1 Category module

- **Category repo:** Ensure `findById` / list return `pricingMode` and `paymentStrategy` from DB (Prisma select).
- **Category service/router:** Expose `pricingMode` and `paymentStrategy` in `category.getAll` and any get-by-id used by client/pro apps. If category is loaded from config/seed, ensure seed consumer writes these to DB.
- **Seed consumer (if exists):** When syncing from `config.seed.json`, map `pricing_mode` → `pricingMode`, `payment_strategy` → `paymentStrategy` on Category.

**Tests:**

- **`apps/api/src/server/modules/category/__tests__/category.service.test.ts`** (or equivalent): Update expectations so category responses include `pricingMode` and `paymentStrategy`. Add cases: category with `pricingMode: 'fixed'`, `paymentStrategy: 'single_capture'`.

---

### 2.2 ProProfileCategory and Pro module

- **ProProfileCategory repo:** Extend `bulkCreate` to accept per-relation `hourlyRateCents?` and `startingFromCents?`; persist them. Extend `findByProProfileId` (or equivalent) to return these fields. When replacing relations on update, pass rates.
- **Pro repo:** When creating/updating pro, accept `categoryRates: Array<{ categoryId, hourlyRateCents?, startingFromCents? }>`. For each category, validate that the category exists and that the correct field is set (hourly → hourlyRateCents, fixed → startingFromCents). Call ProProfileCategory bulk create/replace with rates.
- **Pro service:** `convertToPro` and `updateProfile`: accept `categoryRates` instead of (or in addition to) `categoryIds`; validate per-category rate required by category.pricingMode; pass to repo. `getMyProfile` and `getById`: include `categoryRelations` with `category` (id, name, pricingMode) and `hourlyRateCents`, `startingFromCents`. Map from DB to domain shape.
- **Pro router:** Update input schema to accept `categoryRates`; keep or deprecate `categoryIds` (e.g. optional for backward compat, then require categoryRates when categories are provided).

**Tests:**

- **`apps/api/src/server/modules/pro/__tests__/pro.service.test.ts`**: Add/update tests for: create pro with `categoryRates` (hourly category: hourlyRateCents; fixed category: startingFromCents); update pro with categoryRates; getMyProfile/getById returns categoryRelations with rates. Test validation: missing rate for category, wrong type of rate for pricingMode.
- **ProProfileCategory repo tests** (if any): Extend for create/update with hourlyRateCents and startingFromCents.

---

### 2.3 Order creation: fixed and hourly rate from junction

- **Order creation service:** When creating order, resolve category (by `categoryId`). If category.`pricingMode === 'fixed'`, allow `estimatedHours` to be 0 or null; set order.`pricingMode` to `fixed`; set `hourlyRateSnapshotAmount` to 0 or leave as-is. If category.`pricingMode === 'hourly'`, resolve `hourlyRateSnapshotAmount` from ProProfileCategory(proId, categoryId).`hourlyRateCents`; if null, fallback to ProProfile.`hourlyRate`. Set order.`pricingMode` to `hourly`.
- **Order repo:** Persist new Order fields (`quotedAmountCents`, `quotedAt`, `quoteMessage`, `quoteAcceptedAt`, `pricingMode`); allow `estimatedHours` 0 or null when pricingMode is fixed.

**Tests:**

- **`apps/api/src/server/modules/order/__tests__/order.creation.service.test.ts`**: Add case: create order with category that has `pricingMode: 'fixed'`, no (or zero) estimatedHours; expect order has pricingMode fixed, quotedAmountCents null. Add case: create hourly order with category that has hourly rate on ProProfileCategory; expect hourlyRateSnapshotAmount from junction.

---

## Phase 3: API – Order quote flow and payment/finalization for fixed

**Goal:** Pro can submit quote; client can accept quote; payment preauth uses quoted amount for fixed; finalization for fixed uses quoted amount; pro can submit completion (no hours) for fixed.

### 3.1 Order lifecycle: submitQuote, acceptQuote

- **Order service/repo:** Add update to set `quotedAmountCents`, `quotedAt`, `quoteMessage` on order; add update to set `quoteAcceptedAt`.
- **Order lifecycle service (or new):** Implement `submitQuote(actor, orderId, amountCents, message?)`: validate order status `accepted`, order.pricingMode `fixed`, actor is order’s pro; set quotedAmountCents, quotedAt, quoteMessage.
- **Order lifecycle service:** Implement `acceptQuote(actor, orderId)`: validate order status `accepted`, order.pricingMode `fixed`, quotedAmountCents set, actor is client; set quoteAcceptedAt.
- **Order router:** Add `order.submitQuote` (pro), `order.acceptQuote` (client) with correct input schemas.

**Tests:**

- **`apps/api/src/server/modules/order/__tests__/order.lifecycle.service.test.ts`** (or equivalent): Add tests for submitQuote (success, wrong status, wrong actor, non-fixed order); acceptQuote (success, no quote yet, wrong actor). Test that status remains `accepted` after quote and after acceptQuote.

---

### 3.2 Payment: preauth for fixed and payment strategy

- **Payment service:** In `createPreauthForOrder`, resolve category from order.categoryId. Read category.`paymentStrategy`. For `single_capture`: if order.`pricingMode === 'fixed'` and `quotedAmountCents` and `quoteAcceptedAt` set, use `quotedAmountCents` as preauth amount; else use `hourlyRateSnapshotAmount * estimatedHours`. (Ignore deposit_balance/milestones for now.)
- **Payment router:** No input change; behavior is driven by order and category.

**Tests:**

- **`apps/api/src/server/modules/payment/__tests__/payment.service.test.ts`**: Add case: order fixed, quotedAmountCents and quoteAcceptedAt set; createPreauthForOrder uses quotedAmountCents as amount. Add case: order fixed but quote not accepted; preauth should fail or use different rule per your design. Add case: order hourly; preauth amount = hourlyRateSnapshotAmount \* estimatedHours (existing behavior).

---

### 3.3 Finalization for fixed and submitCompletion

- **Order lifecycle service:** Implement `submitCompletion(actor, orderId)`: allowed only when order.pricingMode === 'fixed' and order status is `in_progress`; actor is order’s pro. Set order to `awaiting_client_approval`, set `completedAt`; do not set finalHoursSubmitted (or set null). No hours input.
- **Order finalization service:** In `finalizeOrder`, when order.`pricingMode === 'fixed'`, build line items using `quotedAmountCents` as labor amount (one labor line); do not use approvedHours. Capture payment for that amount. When pricingMode is hourly, keep current logic (approvedHours × rate).
- **Order router:** Add `order.submitCompletion` (pro, no body or empty). Keep `order.approveHours` for client; for fixed orders, approveHours still triggers finalization but backend uses quotedAmountCents (approvedHours can be ignored for fixed in finalization).

**Tests:**

- **`apps/api/src/server/modules/order/__tests__/order.lifecycle.service.test.ts`**: Add tests for submitCompletion: success (fixed order in_progress), reject when hourly order, reject when wrong status, reject when wrong actor.
- **`apps/api/src/server/modules/order/__tests__/order.finalization.service.test.ts`**: Add case: finalize fixed order (order has quotedAmountCents, no finalHoursSubmitted or zero); expect line items built from quotedAmountCents, capture amount = quotedAmountCents (minus fee/tax as per your math). Existing hourly finalization tests unchanged.

---

### 3.4 Order estimation and getById cost breakdown

- **Order estimation service:** When order has `pricingMode === 'fixed'` and `quotedAmountCents` set, `estimateCost` (or getById cost breakdown) can use quotedAmountCents to build estimate breakdown (for display). When fixed and no quote yet, return “no estimate” or range from config if you add it later.
- **Order router getById:** When building costBreakdown for detail view, if order is fixed and quotedAmountCents set, use that for estimate/receipt; if fixed and no quote, show appropriate message.

**Tests:**

- **`apps/api/src/server/modules/order/__tests__/order.estimation.service.test.ts`**: Add case: estimate for order that has quotedAmountCents (fixed); expect breakdown uses quoted amount. If you have getById integration tests, add fixed-order costBreakdown expectation.

---

## Phase 4: Client app – Category context, pro profile hire column, wizard (fixed)

**Goal:** Pro profile uses category/subcategory query params; hire column and price only when params set; wizard supports fixed (no hours, submit with pricingMode fixed).

### 4.1 Category and pro data

- **Category API usage:** Ensure client fetches category with `pricingMode` (and `paymentStrategy` if needed). If using `category.getAll` or get-by-id, confirm response includes these (from Phase 2).
- **Pro by id with category context:** Add or use existing API to get pro’s starting price for a category: e.g. `pro.getById` with `categoryId` (and optional `subcategoryId`) query param, or client gets pro + category list and finds ProProfileCategory rate for that category. Implement backend if needed: e.g. `pro.getById({ id, categoryId? })` returns pro and, when categoryId present, `startingPriceForCategory: { hourlyRateCents?, startingFromCents?, pricingMode }`.

**Tests:**

- **Client hooks that fetch category:** If any unit tests mock category response, add `pricingMode` (and `paymentStrategy`) to mocks.
- **`apps/client/src/hooks/pro/__tests__/useProDetail.test.ts`**: If pro detail is used for hire column, add test that when categoryId (or category) param is present, hook returns/uses starting price for that category; when absent, no price/hire (or equivalent assertion).

---

### 4.2 Pro profile page: query params and hire column

- **Pro profile route:** Read query params `category`, `subcategory` (or `categoryId`, `subcategoryId`). If present, fetch category (if needed) and pro’s rate for that category (from pro getById with categoryId or from pro’s categoryRelations).
- **UI:** When category (and optionally subcategory) params are set and pro offers that category: show right column/section to hire (e.g. “Contratar” / “Solicitar”); show starting price: “Desde $X/hora” (hourly) or “Desde $X” (fixed) from ProProfileCategory. When params not set: hide hire column and price.
- **Links:** From category flow (search, category landing, “choose pro” step), link to pro profile with `?category=...` (and `subcategory=...` if applicable).

**Tests:**

- **`apps/client/src/hooks/pro/__tests__/useProDetail.test.ts`**: Test with categoryId param returns/uses starting price; without param does not expose hire/price (or component test that hire column is hidden when no category param).
- **`apps/client/src/components/search/__tests__/ProList.test.tsx`** (or pro card tests): Ensure links to pro profile include category (and subcategory) when coming from category context.

---

### 4.3 Wizard: fixed category (no hours, payload)

- **LocationStep / wizard state:** When current category has `pricingMode === 'fixed'`, hide “Horas estimadas” input (or show copy “El profesional te enviará un presupuesto”). Do not require `state.hours` for fixed.
- **useReviewStepSubmit / useCreateOrder:** When category is fixed, call createOrder with `pricingMode: 'fixed'` and `estimatedHours: 0` (or omit if API allows). Pass categoryId, subcategoryId, address, schedule, description, categoryMetadataJson as today.
- **Validation:** For fixed, do not validate `state.hours`; validate rest as today.

**Tests:**

- **`apps/client/src/hooks/order/__tests__/useCreateOrder.test.ts`**: Add case: create order with category fixed; payload includes pricingMode 'fixed' and estimatedHours 0 (or omitted). Mock API to accept and return order.
- **`apps/client/src/hooks/order/__tests__/useReviewForm.test.ts`** (or wizard validation tests): For fixed category, submission does not require hours; for hourly, hours still required.

---

## Phase 5: Client app – Job detail and checkout (quote flow, completion for fixed)

**Goal:** Client sees quote flow (wait for quote → accept quote → authorize payment); completion for fixed (confirm completion, no approve hours).

### 5.1 Job detail: quote flow (fixed)

- **Job detail screen / hooks:** When order status is `accepted` and order.pricingMode is `fixed`: if no `quotedAmountCents`, show “El profesional te enviará un presupuesto. Te avisaremos cuando esté listo.” If `quotedAmountCents` set, show “Presupuesto: $X. ¿Aceptar y pagar?” and **Accept quote** button. On click, call `order.acceptQuote` mutation.
- **After quote accepted:** When `quoteAcceptedAt` set, show **Authorize payment** as today (same as hourly after accept); link to checkout.
- **useOrderDetail:** Ensure order includes quotedAmountCents, quoteAcceptedAt, pricingMode so UI can branch.
- **New hook or mutation:** `useAcceptQuote(orderId)` that calls `order.acceptQuote`; use in job detail.

**Tests:**

- **`apps/client/src/hooks/order/__tests__/useOrderDetail.test.ts`**: Mock order with pricingMode fixed, quotedAmountCents set, quoteAcceptedAt null; then quoteAcceptedAt set. Assert data used for UI (e.g. showAcceptQuote, showAuthorizePayment).
- Add test for acceptQuote mutation (e.g. in a hook test or integration test): call acceptQuote, expect order refetch shows quoteAcceptedAt set.

---

### 5.2 Checkout and payment success

- **CheckoutScreen:** Already uses order from getById; when order is fixed and quote accepted, backend preauth amount is quotedAmountCents (from Phase 3). No change needed if amount is read from order/backend; otherwise ensure checkout displays and uses quoted amount for fixed.
- **Payment success / confirm:** Unchanged; client returns from provider, then confirms order if needed. Same flow as hourly.

**Tests:**

- **`apps/client/src/hooks/order/__tests__/useCheckout.test.ts`**: Add or adjust: when order is fixed and has quotedAmountCents, expect createPreauth to be called (amount comes from backend); no change to success flow.

---

### 5.3 Job detail: completion for fixed (no approve hours)

- **Job detail:** When order status is `awaiting_client_approval` and order.pricingMode is `fixed`, do not show “approve hours” or “dispute hours.” Show “Confirmar que el trabajo se realizó” (or “Marcar como completado”); on confirm, call same approve endpoint (e.g. `order.approveHours` or a dedicated confirmCompletion that maps to same backend approval). Backend already treats fixed as “approve completion, capture quoted amount” (Phase 3).
- **useApproveHours or equivalent:** For fixed, call same API (approveHours with no hours UI); backend uses quotedAmountCents for finalization.

**Tests:**

- **Client job detail / order hooks:** When order is fixed and awaiting_client_approval, assert that UI shows “confirm completion” and not “approve hours” input. Assert that approve/confirm action calls the correct mutation and that refetched order moves to completed/paid.

---

### 5.4 Cost summary and receipt (fixed)

- **JobDetailCostSummary (and receipt view):** When order.pricingMode === 'fixed', show fixed amount (quotedAmountCents or totalAmount after finalization) instead of “X horas × $Y/h”. Use costBreakdown from getById when available.

**Tests:**

- Component or hook tests that render cost summary: for fixed order, expect label/amount to reflect single price, not hours × rate.

---

## Phase 6: Pro mobile app – Category rates (onboarding, edit profile)

**Goal:** Pro sets starting price per category (hourly rate or “precio desde”); category list has pricingMode; getMyProfile returns categoryRelations with rates; create/update use categoryRates.

### 6.1 API usage and hooks (pro mobile)

- **Category list:** Ensure `category.getAll` (or equivalent) returns `pricingMode` for each category (already done in Phase 2). Pro app uses this to show “Tarifa por hora” vs “Precio desde” per category.
- **useOnboarding:** Change submit payload from `hourlyRate` + `categoryIds` to `categoryRates: Array<{ categoryId, hourlyRateCents?, startingFromCents? }>`. Optionally keep a default hourlyRate for backward compat or as default for first hourly category. Call `pro.convertToPro` with categoryRates.
- **Pro update mutation:** Accept `categoryRates` in update payload; call `pro.updateProfile` with categoryRates so backend replaces ProProfileCategory rows with new rates.

**Tests:**

- **`apps/pro_mobile/src/hooks/auth/__tests__/useOnboarding.test.ts`**: Update to pass categoryRates instead of categoryIds; mock API to expect categoryRates; assert payload shape per category (hourlyRateCents for hourly category, startingFromCents for fixed).
- If there is a hook or test for pro update profile, add categoryRates to payload and expectations.

---

### 6.2 CategoryRatesEditor component

- **New component:** `CategoryRatesEditor` (or equivalent name): props = selected categories (with pricingMode), rates map (categoryId → { hourlyRateCents?, startingFromCents? }), onRatesChange, errors. For each category, one input: “Tarifa por hora (UYU) _” when pricingMode hourly, “Precio desde (UYU) _” when fixed. Validate required and > 0.
- **Integration:** Used below CategorySelector in OnboardingScreen and EditProfileScreen; parent state: selectedCategories + categoryRates (Record or array).

**Tests:**

- If component tests exist for onboarding/edit profile, add test that CategoryRatesEditor renders one input per selected category with correct label (hourly vs “precio desde”). Test validation: empty rate, invalid number.

---

### 6.3 OnboardingScreen

- **State:** Keep selectedCategories; add categoryRates (e.g. Record<categoryId, { hourlyRateCents?: number, startingFromCents?: number }>). When category is selected/deselected, init or clear rate for that category.
- **UI:** Remove or repurpose single global “Tarifa por hora” at top. Below CategorySelector, render CategoryRatesEditor for selected categories. On submit, build categoryRates array from state; call submitOnboarding with categoryRates (and optional default hourlyRate for new pros if kept).
- **Validation:** For each selected category, require the appropriate rate (hourlyRateCents or startingFromCents by category.pricingMode).

**Tests:**

- **`apps/pro_mobile/src/hooks/auth/__tests__/useOnboarding.test.ts`**: Already updated in 6.1. Add or extend test that onboarding submit includes categoryRates for all selected categories with correct field per pricingMode.

---

### 6.4 EditProfileScreen

- **Load:** When loading pro profile, get categoryRelations with hourlyRateCents, startingFromCents. Merge with category list to show selected categories and their current rates. Pre-fill CategoryRatesEditor.
- **Save:** On save, send categoryRates (same shape as onboarding); backend replaces junction rows. Keep categoryIds in sync from selected categories.

**Tests:**

- Pro mobile tests for edit profile: when profile has categoryRelations with rates, form shows them; on save, categoryRates payload is sent. If no dedicated edit-profile hook test, add assertions in a higher-level test or E2E.

---

## Phase 7: Pro mobile app – Quote and completion (fixed)

**Goal:** Pro can send quote for fixed orders; pro can mark job complete without submitting hours for fixed orders.

### 7.1 Job detail: send quote (fixed)

- **Job detail screen:** When order is `accepted` and order.pricingMode is `fixed`, show “Enviar presupuesto” form: amount input (and optional message). On submit, call `order.submitQuote` with orderId, amountCents, message. After success, show “Presupuesto enviado: $X. Esperando que el cliente acepte y pague.”
- **useOrderActions (or new hook):** Add `submitQuote(orderId, amountCents, message?)` mutation. Use in job detail for fixed orders.

**Tests:**

- **`apps/pro_mobile/src/hooks/order/__tests__/useOrderActions.test.ts`**: Add submitQuote: mock order.submitQuote mutation; assert called with orderId, amountCents, message; assert cache invalidation or refetch. Add case: fixed order in status accepted shows send-quote action; after submit, order still accepted but has quotedAmountCents.

---

### 7.2 Job detail: submit completion (fixed, no hours)

- **Job detail screen:** When order is `in_progress` and order.pricingMode is `fixed`, show “Marcar trabajo completado” (or equivalent); on press, call `order.submitCompletion(orderId)` with no hours. Do not show “Submit hours” input for fixed.
- **useOrderActions:** Add `submitCompletion(orderId)` that calls `order.submitCompletion`. For hourly orders, keep existing “complete” flow with finalHours (submitHours).

**Tests:**

- **`apps/pro_mobile/src/hooks/order/__tests__/useOrderActions.test.ts`**: Add submitCompletion: for fixed order in_progress, call submitCompletion; assert mutation called with orderId only (no hours). Assert order transitions to awaiting_client_approval. For hourly order, assert completeOrder still uses submitHours with finalHours.
- **`apps/pro_mobile/src/hooks/order/__tests__/useOrderDetail.test.ts`**: When order is fixed and in_progress, detail exposes “mark complete” action (no hours field); when hourly, expose submit hours flow.

---

### 7.3 Job list and detail: show quote status and quick answers

- **Job list / card:** For fixed orders in `accepted`, show “Enviar presupuesto” or “Presupuesto enviado” depending on quotedAmountCents. No backend change.
- **Job detail:** Show categoryMetadataJson (quick answers) in a readable way (“Cliente indicó: …”) so pro can use them to prepare quote. Optional: same in inbox summary.

**Tests:**

- Optional: assert job card or detail shows quote status for fixed accepted orders; assert client answers (categoryMetadataJson) are visible.

---

## Phase 8: Seed and E2E / smoke (optional but recommended)

**Goal:** Seed script writes Category.pricingMode and Category.paymentStrategy from config.seed.json; optional E2E or smoke tests for one happy path (fixed and hourly).

### 8.1 Seed script

- **Seed consumer:** If a script or job seeds categories from `config.seed.json`, ensure it sets `pricingMode` and `paymentStrategy` on each Category from `pricing_mode` and `payment_strategy` in JSON. For ProProfileCategory, if seed creates sample pros with categories, set `hourlyRateCents` / `startingFromCents` as required (or leave for app-only onboarding).
- **config.seed.json:** Already contains `pricing_mode` and `payment_strategy` per category; no change unless adding new categories.

**Tests:** Run seed and verify DB has pricingMode and paymentStrategy on categories; verify no regression in existing seed data.

---

### 8.2 E2E / smoke (optional)

- **API:** Smoke test: create fixed order (category fixed), pro accept, pro submitQuote, client acceptQuote, client createPreauth and confirm, pro submitCompletion, client approve completion; then check order completed and payment captured. Smoke test: hourly order flow unchanged.
- **Client:** If E2E exists, add: open pro profile with category param → hire column visible and price shown; open without param → hire column hidden. Wizard: select fixed category → no hours field, submit order with pricingMode fixed.
- **Pro mobile:** If E2E exists, add: onboarding with categoryRates (at least one hourly and one fixed category); fixed order: accept → send quote → mark complete.

**Tests:** E2E or smoke suite; not required for plan completion but recommended.

---

## Summary: test updates by app

| App            | Test files to update or add                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **API**        | category.service.test.ts (pricingMode, paymentStrategy); pro.service.test.ts (categoryRates, categoryRelations with rates); order.creation.service.test.ts (fixed order, hourly rate from junction); order.lifecycle.service.test.ts (submitQuote, acceptQuote, submitCompletion); order.finalization.service.test.ts (fixed finalization); order.estimation.service.test.ts (fixed estimate); payment.service.test.ts (preauth for fixed). |
| **Client**     | useProDetail.test.ts (category param, starting price); useCreateOrder.test.ts (fixed payload); useOrderDetail.test.ts (fixed quote flow); useCheckout.test.ts (fixed preauth); useReviewForm.test.ts or wizard tests (fixed no hours); ProList.test.tsx or pro card (link with category params); job detail / cost summary tests (fixed completion, fixed cost display).                                                                    |
| **Pro mobile** | useOnboarding.test.ts (categoryRates payload); useOrderActions.test.ts (submitQuote, submitCompletion); useOrderDetail.test.ts (fixed completion UI); CategoryRatesEditor or onboarding/EditProfile tests (rates per category).                                                                                                                                                                                                             |

---

## Dependency order

- **Phase 1** must be done first (schema and domain).
- **Phase 2** (Category + Pro) can follow; required for Phase 4 and 6 (client pro profile and pro mobile category rates).
- **Phase 3** (order quote flow and payment/finalization) can run in parallel with Phase 2 after Phase 1, or after Phase 2.
- **Phase 4** (client pro profile + wizard) depends on Phase 2 and optionally Phase 3 (if you want to test full quote flow in client).
- **Phase 5** (client job detail and checkout) depends on Phase 3.
- **Phase 6** (pro mobile category rates) depends on Phase 2.
- **Phase 7** (pro mobile quote and completion) depends on Phase 3.
- **Phase 8** (seed and E2E) after all above.

Recommended sequence: **1 → 2 → 3 → 4 & 5 (client)** and **6 & 7 (pro mobile)** in parallel if desired, then **8**.
