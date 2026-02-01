# Phase 7: Pro mobile app – Quote and completion (fixed) – Detailed plan

**Goal:** Pro can send a quote for fixed orders; pro can mark job complete without submitting hours for fixed orders. Job list and detail show quote status; client answers (quick questions) are visible for preparing the quote.

---

## Current state (pro_mobile)

- **Job detail:** Uses `useOrderDetail(orderId)` and `useOrderActions()`. Order from `order.getById` (API returns `pricingMode`, `quotedAmountCents`, `quoteAcceptedAt`, etc. from Phase 2/3).
- **ACCEPTED:** After accept, screen shows “Marcar en camino” when CONFIRMED (after client pays). There is **no** “Enviar presupuesto” flow for fixed ACCEPTED orders.
- **IN_PROGRESS:** Shows “Marcar llegada” then “Completar Trabajo”; `handleComplete` calls `completeOrder(orderId, finalHours)` → `order.submitHours`. No branching for fixed (no “Marcar trabajo completado” without hours).
- **useOrderActions:** Exposes `acceptOrder`, `rejectOrder`, `markOnMyWay`, `arriveOrder`, `completeOrder(orderId, finalHours)` (submitHours only). No `submitQuote` or `submitCompletion`.
- **Job list / JobCard:** Shows status label and “don’t start until paid” for ACCEPTED/CONFIRMED/etc. No “Enviar presupuesto” / “Presupuesto enviado” for fixed ACCEPTED.
- **Quick answers:** Job detail already shows “Detalles adicionales” with `categoryMetadataJson` quick answers (formatted with labels). No change needed for Phase 7.

---

## 7.1 Job detail: send quote (fixed)

### 7.1.1 When to show

- **When:** `order.status === OrderStatus.ACCEPTED` and `order.pricingMode === 'fixed'`.
- **States:**
  - No quote yet: `!order.quotedAmountCents` (or quotedAmountCents <= 0) → show “Enviar presupuesto” form (amount input + optional message). On submit, call `order.submitQuote` with `{ orderId, amountCents, message? }`.
  - Quote sent: `order.quotedAmountCents` set → show “Presupuesto enviado. Esperando aceptación del cliente.” and the amount on a separate line (e.g. “Monto: $X”). No form, no edit.

### 7.1.2 UI – Send quote form

- **Inputs:** Amount (required; in major units for display, convert to cents for API) and optional message (textarea or single line).
- **Button:** “Enviar presupuesto”.
- **Validation:** Amount > 0; optional max (e.g. 999999 UYU). Same as Phase 6 if you want consistency.
- **On success:** Refetch order (or invalidate); UI switches to “Presupuesto enviado” state.

### 7.1.3 useOrderActions (or equivalent)

- **New:** `submitQuote(orderId: string, amountCents: number, message?: string): Promise<void>`.
- **Implementation:** Call `trpc.order.submitQuote.useMutation` with input `{ orderId, amountCents, message }`. On success, invalidate `order.getById` and `order.listByPro` (same pattern as other actions).
- **Loading/error:** Expose `isSubmittingQuote` and include quote errors in hook `error` (or separate `quoteError`).

---

## 7.2 Job detail: submit completion (fixed, no hours)

### 7.2.1 When to show

- **When:** `order.status === OrderStatus.IN_PROGRESS` and `order.pricingMode === 'fixed'`.
- **UI:** One primary button: “Completar trabajo” (same label as hourly). **Do not** show “Submit hours” / “Horas realizadas” input for fixed.
- **On press:** Call `order.submitCompletion(orderId)` (no hours). Backend (Phase 3) sets status to `awaiting_client_approval` and uses quoted amount for finalization.

### 7.2.2 useOrderActions

- **New:** `submitCompletion(orderId: string): Promise<void>`.
- **Implementation:** Call `trpc.order.submitCompletion.useMutation` with input `{ orderId }`. On success, invalidate order and list (same as completeOrder).
- **Hourly vs fixed:** For **hourly** IN_PROGRESS, keep current flow: “Marcar llegada” then “Completar Trabajo” with `completeOrder(orderId, finalHours)` → `submitHours`. For **fixed** IN_PROGRESS, show “Completar trabajo” (after “Marcar llegada”) → `submitCompletion(orderId)`.

### 7.2.3 Fixed: “Marcar llegada” and “Marcar en camino”

- **Option A:** Keep “Marcar en camino” and “Marcar llegada” for fixed orders too (same flow as hourly until completion; only the “complete” action differs).
- **Option B:** For fixed, skip “Marcar llegada” and allow “Completar trabajo” as soon as status is IN_PROGRESS (no arrivedAt required).

**Decision:** Option A – require “Marcar llegada” before “Completar trabajo” for fixed (same as hourly).

---

## 7.3 Job list and detail: quote status and quick answers

### 7.3.1 Job list / JobCard

- **When:** Order is fixed (`job.pricingMode === 'fixed'`) and status is ACCEPTED.
- **Show:** “Enviar presupuesto” if `!job.quotedAmountCents`; “Presupuesto enviado” if `job.quotedAmountCents` is set.
- **Where:** A short line under the status. No backend change.

### 7.3.2 Job detail – quick answers

- **Current:** Job detail already shows “Detalles adicionales” with `categoryMetadataJson` quick answers (labels + values). No change required for Phase 7.
- **Optional:** Ensure this block is visible when the pro is in “send quote” state (e.g. above the quote form) so they can use it to prepare the quote. Likely already the case.

---

## 7.4 Job detail layout (ACCEPTED and IN_PROGRESS)

### 7.4.1 ACCEPTED + fixed

- If no quote yet: show “Enviar presupuesto” card/section (amount, optional message, button). Do **not** show “Marcar en camino” until the client has paid (current rule: mark on my way when CONFIRMED). So for fixed ACCEPTED the only action is “Enviar presupuesto” until quote is sent; after that, “Presupuesto enviado” and later (once client pays) “Marcar en camino” when status becomes CONFIRMED.
- If quote sent: show “Presupuesto enviado. Esperando aceptación del cliente.” and amount on a separate line. No “Marcar en camino” until status is CONFIRMED (payment confirmed).

### 7.4.2 IN_PROGRESS + fixed

- Show “Marcar llegada” (if not yet arrived) then “Completar trabajo” (one button; calls submitCompletion). No hours input. Same sequence as hourly (arrive required before complete).
- IN_PROGRESS + hourly: unchanged (Marcar llegada → Completar Trabajo with finalHours → submitHours).

---

## 7.5 Tests (minimum)

- **useOrderActions:**
  - **submitQuote:** Mock `order.submitQuote`; call `submitQuote(orderId, amountCents, message)`; assert mutation called with `{ orderId, amountCents, message }`; assert invalidation/refetch.
  - **submitCompletion:** For fixed order in_progress, call `submitCompletion(orderId)`; assert mutation called with `{ orderId }` only; assert order transitions to awaiting_client_approval (or refetch). For hourly, assert `completeOrder` still uses `submitHours` with finalHours.
- **useOrderDetail (or JobDetailScreen):** When order is fixed and IN_PROGRESS, detail exposes “mark complete” action (no hours field); when hourly, expose submit-hours flow. Optional: when fixed and ACCEPTED, detail exposes send-quote form or “Presupuesto enviado” by state.

---

## Summary table

| Area                                 | Current                      | Phase 7 change                                                                                                                                                                                    |
| ------------------------------------ | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Job detail – ACCEPTED + fixed**    | No quote flow                | Show “Enviar presupuesto” form (amount + message); after submit, “Presupuesto enviado. Esperando aceptación del cliente.” + amount elsewhere.                                                     |
| **useOrderActions**                  | completeOrder → submitHours  | Add submitQuote(orderId, amountCents, message?); add submitCompletion(orderId). For fixed IN_PROGRESS use submitCompletion (after “Marcar llegada”); for hourly keep completeOrder → submitHours. |
| **Job detail – IN_PROGRESS + fixed** | Same as hourly (submitHours) | Show “Completar trabajo” → submitCompletion(orderId) (no hours input; “Marcar llegada” required first).                                                                                           |
| **Job list / JobCard**               | Generic status               | For fixed ACCEPTED: short line under status “Enviar presupuesto” or “Presupuesto enviado”.                                                                                                        |
| **Quick answers**                    | Already in detail            | No change (already “Detalles adicionales”).                                                                                                                                                       |

---

## Decisions (Phase 7)

1. **Send-quote button label:** “Enviar presupuesto”.
2. **After-quote message:** “Presupuesto enviado. Esperando aceptación del cliente.” Show the amount elsewhere (e.g. separate line “Monto: $X”).
3. **Fixed IN_PROGRESS – “Marcar llegada”:** Require “Marcar llegada” before “Completar trabajo” (same as hourly).
4. **Complete button label (fixed):** “Completar trabajo” (same as hourly).
5. **JobCard quote status:** A short line under the status (“Enviar presupuesto” / “Presupuesto enviado”).
6. **Test scope:** Minimum (useOrderActions: submitQuote + submitCompletion tests only).
