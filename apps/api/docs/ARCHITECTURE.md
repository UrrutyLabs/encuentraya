# Arreglatodo (UY) – Orders, Line Items, IVA & Mercado Pago Strategy (Hourly-only MVP)

> **Disclaimer:** This is a technical/product strategy document, not legal/tax advice. You should validate specifics (who must invoice whom, wording, regimes like Literal E, etc.) with your accountant.

---

## 1) Goals (MVP)

- Hourly-only pricing (pro sets an hourly rate).
- Client chooses a pro and creates an order request.
- Pro accepts → client authorizes (pre-auth cap) → work → hours approved → capture → payout.
- Keep the **Order** entity thin but future-proof via **line items**.
- Support Uruguay **IVA** (usually 22% for services) in a way that can evolve without schema rewrites.
- Use **Mercado Pago** as payment provider.

---

## 2) Key tax + billing assumptions (Uruguay)

- Most services are subject to **IVA tasa básica (22%)**, with some exceptions at 10% depending on the type of service and regime.
- In Uruguay, electronic invoicing (CFE / eFactura) is widely required depending on taxpayer type and dates, so your model must not rely on “no invoices”.

This doc recommends an architecture that works under either of these marketplace realities:

### Model A (recommended for marketplaces): **Pros are the sellers of the service**

- The professional provides the service to the client.
- The platform facilitates discovery, trust, and payment.
- The professional is the party that must invoice the client for the service.

Platform’s “revenue” is a **service fee/commission** that the pro pays to the platform (platform invoices the pro).

### Model B (more operational): **Platform as merchant-of-record**

- Platform invoices the client, then pays the pro.
- This increases platform tax complexity and operational burden.

**Recommendation:** Start with **Model A** for MVP.

---

## 3) Money primitives (do this even in hourly-only MVP)

### Why line items in MVP?

Even with hourly-only, you will soon need:

- cancellation fee
- discounts / credits
- tips
- adjustments
- platform fee breakdown
- taxes (IVA)

So the canonical “receipt” should be a list of **line items**.

---

## 4) Order entity structure (recommended)

### `orders` (core lifecycle + snapshots)

**Identity**

- `id`
- `client_id`
- `pro_id`
- `category_id`, `subcategory_id`

**Job details**

- `title`
- `description`
- `photos[]` (or `order_attachments`)
- `address` (and optionally `lat`, `lng`)
- `scheduled_window_start_at`, `scheduled_window_end_at`

**Lifecycle**

- `status`:  
  `draft | pending_pro_confirmation | accepted | confirmed | in_progress | awaiting_client_approval | disputed | completed | paid | canceled`
- Timestamps: `accepted_at`, `confirmed_at`, `started_at`, `arrived_at`, `completed_at`, `paid_at`, `canceled_at`
- `cancel_reason`

**Pricing snapshots**

- `pricing_mode = hourly`
- `hourly_rate_snapshot_amount`
- `currency = UYU` (or multi-currency later)
- `min_hours_snapshot` (optional)

**Hours**

- `estimated_hours` (client-picked, for authorization cap)
- `final_hours_submitted` (pro-submitted)
- `approved_hours` (client-approved or auto-approved)
- `approval_method`: `client_accepted | auto_accepted | admin_adjusted`
- `approval_deadline_at`

**Totals (cached)**

- `subtotal_amount` (labor pre-tax)
- `platform_fee_amount`
- `tax_amount` (IVA total shown in receipt)
- `total_amount`
- `totals_calculated_at`

**Tax snapshot**

- `tax_scheme = iva`
- `tax_rate` (e.g. 0.22)
- `tax_included` (usually `false` if you show IVA separately; decide UX)
- `tax_region = UY`
- `tax_calculated_at`

**Dispute fields (MVP)**

- `dispute_status`: `none | open | resolved | canceled`
- `dispute_reason` (string)
- `dispute_opened_by` (client/pro/admin)

---

## 5) Line items (receipt as the source of truth)

### `order_line_items`

Fields:

- `id`
- `order_id`
- `type`:
  - `labor`
  - `platform_fee`
  - `tax`
  - `tip`
  - `discount`
  - `adjustment`
  - `cancellation_fee`
- `description`
- `quantity` (decimal; hours for labor)
- `unit_amount`
- `amount` (quantity \* unit_amount)
- `currency`
- `tax_behavior`: `taxable | non_taxable | tax_included`
- `tax_rate` (optional per line, else computed at order level)
- `metadata` (JSON)
- `created_at`

### Source of truth

- The **final invoice** is the sum of line items at approval time.
- Store cached totals on `orders` for fast reads, but re-derivable from line items.

---

## 6) IVA strategy (pragmatic MVP)

### Decision 1 — Do you display IVA separately or “IVA incluido”?

Pick one and be consistent across UI and receipts.

**Recommendation for MVP:** Display **subtotal + IVA + total** (IVA not included) because:

- It’s explicit and standard for many invoicing flows.
- Easier to reason about and reconcile.

### Decision 2 — What is taxable?

In Uruguay, IVA treatment can differ by item and role (service vs platform fee).
For MVP, implement a simple tax engine:

- `labor` line item: **taxable**
- `platform_fee` line item: **taxable** (platform is providing a service)
- `tip`: usually **non_taxable** (but confirm with your accountant for invoicing treatment)
- `discount`: reduces taxable base if applied to taxable items
- `cancellation_fee`: taxable if it’s considered a service fee; otherwise could be non-taxable (validate)

### Simple tax computation (order-level)

At finalization (client approval or auto-approval):

1. Build labor line item:
   - `quantity = approved_hours`
   - `unit_amount = hourly_rate_snapshot_amount`
2. Build platform fee line item:
   - `amount = labor_amount * platform_fee_percent`
3. Compute taxable base:
   - sum of `amount` where `tax_behavior = taxable`
4. Compute IVA:
   - `iva_amount = taxable_base * tax_rate`
5. Add a `tax` line item with `amount = iva_amount`

> If later you need per-line IVA, keep the same structure but compute taxes per item and sum.

---

## 7) Who invoices whom (Model A – recommended)

### Client receipt (what the client sees in the app)

Your app can show a “receipt” made of line items, but the **fiscal invoice** depends on the seller.

**Model A approach:**

- **Pro invoices Client** for the service (labor + IVA).
- **Platform invoices Pro** for the platform fee (+ IVA).

In practice:

- The “client-facing receipt” can show:
  - Labor (taxable)
  - IVA
  - Total
  - (Optionally) “Service fee” as informational, but be careful: if client is not paying it, it should not look like an extra charge to the client.

### Platform revenue recognition

- Platform revenue is the **platform_fee** collected from the pro.

---

## 8) Mercado Pago integration notes (MVP)

### Payment lifecycle

- Create an **authorization cap** at confirmation time:
  - `authorized_amount = hourly_rate * estimated_hours` (+ optional small buffer)
- Capture happens only after:
  - pro submits `final_hours`
  - client approves (or auto-approval triggers)

### Reporting and reconciliation

Store:

- Mercado Pago payment identifiers on `payments`:
  - `mp_payment_id`, `mp_preference_id`, etc.
- Capture breakdown:
  - `authorized_amount`, `captured_amount`
  - platform fee
  - iva amount
  - pro payout amount

Mercado Pago may apply:

- processing fees (which themselves can have IVA)
- possible withholding/retentions depending on account and regulations

So implement:

- `payment_provider_fees_amount`
- `withholdings_amount` (optional)
- and store them on the payment record when webhooks confirm settlement.

---

## 9) Recommended “finalization” algorithm (server-side)

Triggered when client accepts (or auto-accept fires):

1. Lock order (idempotency key)
2. Set `approved_hours`
3. Create/replace final line items:
   - labor
   - platform_fee
   - tax (IVA)
   - tip (if any)
   - adjustments/discounts (if any)
4. Compute totals from line items and persist:
   - `orders.subtotal_amount`
   - `orders.platform_fee_amount`
   - `orders.tax_amount`
   - `orders.total_amount`
5. Capture payment for `orders.total_amount`
6. On capture success:
   - set `status = paid`
   - schedule payout to pro (net of platform fee if you collect it from the same payment)
7. On capture failure:
   - set `status = completed` + `payment_failed` flag, or a dedicated status
   - notify both parties + retry policy

---

## 10) Recommended tables/collections summary

- `orders`
- `order_line_items`
- `payments`
- `payouts` (optional if you need a separate payout lifecycle)
- `messages`
- `reviews`
- `disputes` (optional separate table; MVP can inline)

---

## 11) Examples (UYU)

Assume:

- hourly_rate = 800 UYU
- approved_hours = 3.5
- platform_fee = 12%
- IVA = 22%

Line items:

- Labor: 3.5 × 800 = 2,800
- Platform fee: 12% × 2,800 = 336
- IVA base (taxable): 2,800 + 336 = 3,136
- IVA: 22% × 3,136 = 689.92

Totals:

- Subtotal: 3,136
- IVA: 689.92
- Total: 3,825.92

> Decide rounding rules (e.g. round IVA to nearest peso) and apply consistently.

---

## 12) MVP decisions you must lock

1. IVA display:
   - show IVA separately vs “IVA incluido”
2. Platform fee visibility:
   - shown to client as informational vs shown as a client-paid fee
3. Tips:
   - allowed? taxable? invoicing treatment?
4. Dispute timeout:
   - auto-approve after X hours (recommend 24h)
5. Cancellation fee:
   - enable in MVP or not
6. Rounding:
   - per-line vs order-level rounding

---

## 13) References (high-level)

- DGI guidance on IVA rates and services personal IVA (tasa básica 22%, mínima 10% in specific cases).
- DGI regime of electronic invoicing (eFactura / CFE) and onboarding guide/FAQs.
- Mercado Pago help/docs on taxes/retentions and reporting fields for withholdings in Uruguay.
