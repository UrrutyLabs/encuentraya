# Phase 5: Client app – Job detail and checkout (quote flow, completion for fixed) – Detailed plan

**Goal:** The client sees the full quote flow (wait for quote → accept quote → authorize payment) on job detail, and for fixed-price orders can confirm completion without approving hours. Cost summary and checkout display fixed amounts correctly.

---

## Current state (client)

- **Job detail:** Uses `useOrderDetail(orderId)` which calls `order.getById`; returns `order` (OrderDetailView with `costBreakdown`), `pro`, `payment`, etc. Order schema already has `pricingMode`, `quotedAmountCents`, `quoteAcceptedAt` (API returns them from Phase 2/3).
- **Accepted orders:** When `job.status === OrderStatus.ACCEPTED`, the screen shows `JobDetailPaymentBanner` with “Pago pendiente” and “Autorizar pago” → navigates to `/checkout?orderId=...`. There is **no** branching for fixed (no “wait for quote” or “accept quote” step).
- **Awaiting client approval:** There is **no** dedicated UI for `AWAITING_CLIENT_APPROVAL`. The screen does not show “approve hours” or “confirm completion” for this status today.
- **JobDetailCostSummary:** Renders `job.costBreakdown` via `CostBreakdown`; fallback uses `job.hourlyRateSnapshotAmount * job.estimatedHours` and “$X/hora × Y horas”. For fixed orders we need to show a single amount (quoted or total), not hours × rate.
- **CheckoutScreen:** Uses `order.getById` and `payment.getByOrder`. Amount shown as `payment?.amountEstimated ?? job?.totalAmount ?? 0`. For fixed before payment exists, `job.totalAmount` may be null; we should use `job.quotedAmountCents` or `job.costBreakdown` when fixed. Also shows “estimated hours” in job summary – for fixed we may hide or replace that.
- **useCheckout:** Calls `payment.createPreauthForOrder.useMutation({ orderId })`; backend already uses `quotedAmountCents` for fixed (Phase 3). No client change needed for the **call**; only display of amount may need to come from order when payment not yet created.

---

## 5.1 Job detail: quote flow (fixed)

### 5.1.1 Data

- **useOrderDetail:** Already returns `order` from `order.getById`. The API returns `OrderDetailView` with `pricingMode`, `quotedAmountCents`, `quoteAcceptedAt`, and `costBreakdown`. No change needed in the hook for **data**; ensure TypeScript types include these (they do in domain).
- **Derived flags for UI:** Add (in screen or a small hook/helper) something like:
  - `isFixedOrder = order?.pricingMode === 'fixed'`
  - `hasQuote = (order?.quotedAmountCents ?? 0) > 0`
  - `quoteAccepted = !!order?.quoteAcceptedAt`
  - `showWaitForQuote = isFixedOrder && order?.status === 'accepted' && !hasQuote`
  - `showAcceptQuote = isFixedOrder && order?.status === 'accepted' && hasQuote && !quoteAccepted`
  - `showAuthorizePayment = order?.status === 'accepted' && (quoteAccepted || !isFixedOrder)`  
    So: for fixed accepted, first show “wait for quote”, then “accept quote”, then “authorize payment”. For hourly accepted, only “authorize payment”.

### 5.1.2 UI – Accepted fixed, no quote yet

- **When:** `order.status === OrderStatus.ACCEPTED` and `order.pricingMode === 'fixed'` and `!order.quotedAmountCents` (or quotedAmountCents <= 0).
- **Show:** A card/banner (e.g. same area as `JobDetailPaymentBanner` but different content) with copy like: “El profesional te enviará un presupuesto. Te avisaremos cuando esté listo.”
- **Do not show:** “Autorizar pago” button (payment cannot be authorized until quote is accepted).

### 5.1.3 UI – Accepted fixed, quote received (accept quote)

- **When:** `order.status === OrderStatus.ACCEPTED` and `order.pricingMode === 'fixed'` and `order.quotedAmountCents` set and `!order.quoteAcceptedAt`.
- **Show:** “Presupuesto: $X” (format `quotedAmountCents` e.g. `(order.quotedAmountCents / 100).toFixed(0)` or use `formatCurrency`) and a primary button “Aceptar presupuesto y pagar” (or “Aceptar y pagar”).
- **On click:** Call `order.acceptQuote` mutation with `{ orderId }`. On success, invalidate/refetch order so UI updates to “show authorize payment”.

### 5.1.4 UI – Accepted, after quote accepted (or hourly)

- **When:** `order.status === OrderStatus.ACCEPTED` and either (fixed and `order.quoteAcceptedAt`) or hourly.
- **Show:** Same as today: “Pago pendiente” and “Autorizar pago” (existing `JobDetailPaymentBanner`). Optionally show the amount from `order.costBreakdown` or `order.quotedAmountCents` for fixed.

### 5.1.5 Mutations

- **useAcceptQuote:** New hook or add to existing order-actions hook: `trpc.order.acceptQuote.useMutation` with input `{ orderId }`. On success, invalidate `order.getById` (and optionally `payment.getByOrder`) so job detail refetches.

### 5.1.6 Job detail layout (ACCEPTED)

- **Option A:** One banner area that switches content by state: (wait for quote) | (accept quote) | (authorize payment).
- **Option B:** Separate cards: one for “wait for quote”, one for “accept quote”, one for “authorize payment”; render the right one by condition.

Recommendation: Single banner/section that shows one of the three states so the client always sees one clear next step.

---

## 5.2 Checkout and payment success

### 5.2.1 CheckoutScreen – amount and copy

- **Amount:** Today: `payment?.amountEstimated ?? job?.totalAmount ?? 0`. For fixed orders before payment is created, `job.totalAmount` is null. Use:
  - `payment?.amountEstimated` when payment exists (backend set it from quotedAmountCents for fixed).
  - Else for fixed with quote: `job.quotedAmountCents ?? 0` (order is OrderDetailView; it has quotedAmountCents).
  - Else: `job.totalAmount ?? 0` (finalized) or fallback 0.
- **Job summary:** Today it shows “Horas estimadas: X horas” when `job.estimatedHours`. For fixed orders, either hide that row or show “Presupuesto fijo” / “Monto acordado” so the client doesn’t see “0 horas”.
- **Copy:** “Monto estimado” is fine for both; for fixed after quote accepted you could say “Monto a autorizar” if you want to stress it’s the agreed quote.

### 5.2.2 Payment success / confirm

- No change: client returns from provider, then can confirm order or see “pago autorizado” as today. Same flow for fixed and hourly.

---

## 5.3 Job detail: completion for fixed (no approve hours)

### 5.3.1 Current gap

- The client **does not** currently show any specific UI for `OrderStatus.AWAITING_CLIENT_APPROVAL`. So we need to add a **new section** for this status.

### 5.3.2 When status is AWAITING_CLIENT_APPROVAL

- **Hourly:** Show “Aprobar horas” (and optionally “Disputar”): display `finalHoursSubmitted`, allow client to confirm and call `order.approveHours`. Backend finalizes with approved hours and captures payment.
- **Fixed:** Do **not** show “approve hours” or “dispute hours”. Show “Confirmar que el trabajo se realizó” (or “Marcar como completado”). One primary button that calls the **same** `order.approveHours` mutation (no hours input). Backend (Phase 3) already treats fixed as “approve completion, capture quoted amount”.

### 5.3.3 Implementation

- **New section:** e.g. `JobDetailAwaitingApproval` (or extend a generic “actions” section) rendered when `job.status === OrderStatus.AWAITING_CLIENT_APPROVAL`.
- **Content:**
  - If `job.pricingMode === 'fixed'`: title “Confirmar realización del trabajo”, short text, button “Confirmar que el trabajo se realizó” → `approveHours(orderId)`.
  - If hourly: title “Aprobar horas”, show “Horas realizadas: X”, button “Aprobar horas” → `approveHours(orderId)`, optional “Disputar” → future or existing dispute flow.
- **Hook:** `useApproveHours(orderId)`: `trpc.order.approveHours.useMutation` with input `{ orderId }`. On success, invalidate order (and payment if needed). No payload difference for fixed vs hourly; backend infers from order.

---

## 5.4 Cost summary and receipt (fixed)

### 5.4.1 JobDetailCostSummary

- **Today:** Passes `job.costBreakdown` to `CostBreakdown`; fallback is `job.hourlyRateSnapshotAmount * job.estimatedHours`, “$X/hora × Y horas”.
- **When `job.pricingMode === 'fixed'`:**
  - If `job.costBreakdown` is present (estimate or receipt), use it as today – the API already returns estimate from `quotedAmountCents` or receipt from finalization (Phase 3).
  - **Fallback:** When estimation is missing/error, do not use “hours × rate”. Use:
    - If `job.quotedAmountCents` (or `job.totalAmount` after finalization): show single amount and label like “Presupuesto” / “Monto acordado” / “Total”.
    - So: `JobDetailCostSummary` (or `CostBreakdown`) accepts an optional “fixed mode”: when true, fallback is a single amount (quotedAmountCents or totalAmount) and label, not “X horas × $Y/h”.

### 5.4.2 CostBreakdown component

- Either extend `CostBreakdown` with an optional `isFixedPrice?: boolean` and when true use fallback label/amount as above, or handle the fallback only in `JobDetailCostSummary` (e.g. when fixed and no estimation, render a simple “Total: $X” instead of calling `CostBreakdown` with hourly fallback).

---

## 5.5 Tests (minimum)

- **useOrderDetail:** Mock `order.getById` with order that has `pricingMode: 'fixed'`, `quotedAmountCents` set, `quoteAcceptedAt: null`; then with `quoteAcceptedAt` set. Assert that derived flags or data used for UI (e.g. showAcceptQuote, showAuthorizePayment) are correct.
- **useAcceptQuote (or order mutation):** Call acceptQuote with orderId; mock `order.acceptQuote`; assert mutation called with `{ orderId }`; assert invalidation/refetch.
- **useCheckout:** When order is fixed and has `quotedAmountCents`, ensure createPreauth is still called (amount comes from backend); no change to success flow. Optional: assert that displayed amount uses quotedAmountCents when payment not yet created.
- **Job detail / approval:** When order is fixed and `awaiting_client_approval`, assert UI shows “confirm completion” and not “approve hours” input; assert approve/confirm action calls `order.approveHours` and refetched order can move to completed/paid.
- **JobDetailCostSummary (or CostBreakdown):** For fixed order, expect label/amount to reflect single price (quoted or total), not “X horas × $Y/h”.

---

## Summary table

| Area                         | Current                                                             | Phase 5 change                                                                                                 |
| ---------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Job detail – ACCEPTED**    | Single “Authorize payment” banner                                   | For fixed: 1) Wait for quote message 2) Accept quote button + amount 3) Then authorize payment (same as today) |
| **useOrderDetail**           | Returns order (has pricingMode, quotedAmountCents, quoteAcceptedAt) | No change; use fields for branching                                                                            |
| **useAcceptQuote**           | —                                                                   | New: `order.acceptQuote` mutation, invalidate order                                                            |
| **CheckoutScreen**           | amount = payment?.amountEstimated ?? job?.totalAmount               | For fixed: use job.quotedAmountCents when payment not created; hide or replace “estimated hours” for fixed     |
| **AWAITING_CLIENT_APPROVAL** | No dedicated UI                                                     | New section: fixed → “Confirmar realización” → approveHours; hourly → “Aprobar horas” → approveHours           |
| **useApproveHours**          | —                                                                   | New (or existing): `order.approveHours` mutation                                                               |
| **JobDetailCostSummary**     | Fallback “hours × rate”                                             | For fixed: fallback single amount (quoted/total), not hours × rate                                             |

---

## Questions for you

1. **Accept quote button label**  
   Prefer “Aceptar presupuesto y pagar”, “Aceptar y pagar”, or another short label?

2. **Awaiting approval – dispute**  
   For Phase 5, should we implement “Disputar” for **hourly** orders in awaiting_client_approval (e.g. link to dispute flow or leave for later)?

3. **Checkout – fixed job summary**  
   For fixed orders, prefer to hide “Horas estimadas” entirely, or show a line like “Presupuesto fijo” / “Monto acordado” (no number) for clarity?

4. **Cost summary – fixed label**  
   When showing the single amount for fixed (quoted or total), which label do you prefer: “Presupuesto”, “Monto acordado”, “Total”, or keep “Costo estimado”/“Resumen de costo” and only change the fallback line (no “X horas × $Y/h”)?

5. **Confirm completion (fixed) – copy**  
   Prefer “Confirmar que el trabajo se realizó”, “Marcar como completado”, or another phrase for the fixed-price completion button?

6. **Test scope**  
   Prefer **minimum** (update existing useOrderDetail/useCheckout tests + one acceptQuote + one approve for fixed) or **broader** (add component tests for job detail banner states and cost summary fixed)?
