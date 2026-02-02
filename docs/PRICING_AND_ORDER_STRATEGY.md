# Pricing and Order Strategy (Product)

This document explains **from a product perspective** how EncuentraYa supports two pricing strategies—**hourly** and **fixed (quote)**—and how they fit into the **order lifecycle**. For the technical order state machine and transitions, see **[Order Flow](./ORDER_FLOW.md)**.

---

## Overview

Each **category** has a **pricing mode**:

- **Hourly** – The client provides an estimated number of hours at booking. The professional’s hourly rate is known upfront. Payment is authorized for that estimate and later captured based on **actual hours** submitted and approved.
- **Fixed (quote)** – The client does **not** set a price at booking. After the professional accepts the request, they send a **quote** (fixed amount). The client accepts the quote, then authorizes payment for that amount. Payment is captured for the **agreed amount** when the job is completed (no hours).

The **order statuses are the same** for both strategies. Only the **steps and data** within certain statuses differ (e.g. quote sub-flow inside `accepted`, completion without hours for fixed).

---

## How It Relates to the Order Flow

The [Order Flow](./ORDER_FLOW.md) document describes the **hourly-only** lifecycle: creation → pro acceptance → client authorization → execution → pro submits hours → client approves → capture.

That flow still applies. We **extend** it as follows:

| Phase                 | Hourly                                                                                               | Fixed (quote)                                                                                                         |
| --------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Creation**          | Client sends address, time, **estimated hours**. Rate is known (pro’s hourly rate for the category). | Client sends address, time, description, quick answers. **No hours, no price yet.**                                   |
| **After pro accepts** | Client authorizes payment (cap = rate × estimated hours).                                            | Pro sends a **quote** (amount + optional message). Client **accepts quote**, then authorizes payment for that amount. |
| **Completion**        | Pro submits **final hours**. Client approves (or disputes) hours. Capture = final hours × rate.      | Pro **marks job complete** (no hours). Client confirms completion. Capture = **agreed quote amount**.                 |

So:

- **Same statuses**: `pending_pro_confirmation` → `accepted` → `confirmed` → `in_progress` → `awaiting_client_approval` → `completed` → `paid`.
- **Same boundaries**: Payment is only authorized **after** pro accepts; capture happens **after** client approves completion.
- **Differences**: What the client sends at creation (hours vs none), what happens inside `accepted` (authorize vs quote → accept quote → authorize), and how completion and capture work (hours × rate vs fixed amount).

---

## User Journeys

### Hourly (client)

1. Choose category/subcategory and pro (sees “$X/hora” for that category).
2. Enter address, time window, **estimated hours**, description.
3. Pro accepts.
4. Authorize payment (cap = hourly rate × estimated hours).
5. Pro does the job (on my way → arrived → work).
6. Pro submits **final hours**.
7. Client approves (or disputes) hours → payment captured for final hours × rate.

### Fixed / quote (client)

1. Choose category/subcategory and pro (sees “Desde $X” for that category—indicative only).
2. Enter address, time window, description (and quick answers). **No hours field**; message like “El profesional te enviará un presupuesto.”
3. Pro accepts.
4. **Wait for quote** – Pro sends a quote (amount + optional message). Client sees “Presupuesto: $X. ¿Aceptar y pagar?”
5. Client **accepts quote** → then **authorizes payment** for that amount.
6. Pro does the job (on my way → arrived → work).
7. Pro **marks job complete** (no hours).
8. Client **confirms completion** → payment captured for the agreed quote amount.

### Hourly (professional)

1. Receive request; see estimated hours and rate.
2. Accept or decline.
3. After client authorizes, go to job (on my way → arrived → work).
4. **Submit final hours** when done.
5. Client approves → payment captured; payout scheduled.

### Fixed / quote (professional)

1. Receive request; see description and client answers (no price yet).
2. Accept or decline.
3. **Send a quote** (amount + optional message). Client sees it and can accept.
4. After client accepts quote and pays, go to job (on my way → arrived → work).
5. **Mark job complete** (no hours).
6. Client confirms → payment captured for quoted amount; payout scheduled.

---

## Key Product Rules

- **Category-level**: Pricing mode (hourly vs fixed) is set **per category**. All subcategories in that category share the same mode. The client and pro UIs adapt automatically (e.g. show/omit hours, show quote flow).
- **Pro’s starting price**: For each category a pro offers, they set either an **hourly rate** (hourly categories) or a **“precio desde”** (fixed categories). The former is used for estimates and payment; the latter is display-only (“Desde $X”) to give clients an idea; the real price is the **quote per order**.
- **One payment strategy (for now)**: All categories use **single capture**: one authorization at confirmation (full amount), one capture at completion. Other strategies (e.g. deposit + balance) are reserved for later.
- **Same order statuses**: No extra statuses for “quote sent” or “quote accepted”; those are represented by **fields** on the order (`quotedAmountCents`, `quoteAcceptedAt`) while status remains `accepted` until the client authorizes and the order moves to `confirmed`.

---

## Where to Read More

- **[Order Flow](./ORDER_FLOW.md)** – Canonical order lifecycle, state machine, and transitions (hourly-oriented; fixed reuses the same states with different actions).
- **[Quote and Fixed Flow – Ideas](./QUOTE_AND_FIXED_FLOW_IDEAS.md)** – Design and backend/frontend ideas for quote and fixed.
- **[Quote and Fixed – Implementation Plan](./QUOTE_AND_FIXED_IMPLEMENTATION_PLAN.md)** – Phased technical implementation plan.
