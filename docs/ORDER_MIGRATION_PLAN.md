# Order Migration Plan: Booking → Order Transformation

This document outlines the phased migration plan to transform the `Booking` entity into an `Order` entity with `OrderLineItem` support, based on the architecture defined in `ARCHITECTURE.md` and `ORDER_FLOW.md`.

---

## Migration Overview

**Current State:**

- `Booking` entity with basic fields (id, displayId, clientUserId, proProfileId, category, status, scheduledAt, hoursEstimate, addressText)
- Related entities: `Review`, `Payment`, `Earning` (all 1:1 with Booking)
- Status enum: `pending_payment`, `pending`, `accepted`, `on_my_way`, `arrived`, `rejected`, `completed`, `cancelled`

**Target State:**

- `Order` entity with comprehensive lifecycle, pricing snapshots, tax fields, and dispute handling
- `OrderLineItem` entity for flexible receipt/invoice structure
- New `OrderStatus` enum aligned with ORDER_FLOW.md state machine
- Updated relations: `Review`, `Payment`, `Earning` reference `orderId` instead of `bookingId`

**Migration Strategy:**

- **Clean migration**: No existing Booking data to migrate (database is empty)
- **Direct implementation**: Build Order system from scratch, replacing Booking
- **No backward compatibility needed**: Can remove Booking code once Order is complete
- **Simplified rollout**: No dual-write period or feature flags required

---

## Phase 1: Database Schema Foundation

**Goal:** Create Order and OrderLineItem tables alongside Booking (no breaking changes)

**Tasks:**

1. **Create new enums:**
   - `OrderStatus`: `draft`, `pending_pro_confirmation`, `accepted`, `confirmed`, `in_progress`, `awaiting_client_approval`, `disputed`, `completed`, `paid`, `canceled`
   - `OrderLineItemType`: `labor`, `platform_fee`, `tax`, `tip`, `discount`, `adjustment`, `cancellation_fee`
   - `TaxBehavior`: `taxable`, `non_taxable`, `tax_included`
   - `PricingMode`: `hourly` (for MVP, extensible later)
   - `ApprovalMethod`: `client_accepted`, `auto_accepted`, `admin_adjusted`
   - `DisputeStatus`: `none`, `open`, `resolved`, `canceled`

2. **Create `orders` table:**
   - Identity fields: `id`, `displayId` (unique), `clientUserId`, `proProfileId`, `category`, `subcategoryId`
   - Job details: `title`, `description`, `addressText`, `addressLat`, `addressLng`, `scheduledWindowStartAt`, `scheduledWindowEndAt`
   - Lifecycle: `status` (OrderStatus), timestamps (`acceptedAt`, `confirmedAt`, `startedAt`, `arrivedAt`, `completedAt`, `paidAt`, `canceledAt`), `cancelReason`
   - Pricing snapshots: `pricingMode`, `hourlyRateSnapshotAmount`, `currency`, `minHoursSnapshot`
   - Hours: `estimatedHours`, `finalHoursSubmitted`, `approvedHours`, `approvalMethod`, `approvalDeadlineAt`
   - Totals (cached): `subtotalAmount`, `platformFeeAmount`, `taxAmount`, `totalAmount`, `totalsCalculatedAt`
   - Tax snapshot: `taxScheme`, `taxRate`, `taxIncluded`, `taxRegion`, `taxCalculatedAt`
   - Dispute fields: `disputeStatus`, `disputeReason`, `disputeOpenedBy`
   - Metadata: `isFirstBooking`, `createdAt`, `updatedAt`
   - Indexes: `clientUserId`, `proProfileId`, `status`, `scheduledWindowStartAt`, `category`, `subcategoryId`, `displayId`

3. **Create `order_line_items` table:**
   - Fields: `id`, `orderId`, `type` (OrderLineItemType), `description`, `quantity` (decimal), `unitAmount`, `amount`, `currency`
   - Tax: `taxBehavior`, `taxRate` (optional)
   - Metadata: `metadata` (JSON), `createdAt`
   - Indexes: `orderId`, `type`

4. **Add foreign key constraints:**
   - `orders.clientUserId` → `users.id`
   - `orders.proProfileId` → `pro_profiles.id`
   - `orders.subcategoryId` → `subcategories.id`
   - `order_line_items.orderId` → `orders.id`

5. **Create migration script:**
   - SQL migration file with all table definitions
   - No data migration yet (tables are empty)

**Validation:**

- Run migration in development/staging
- Verify indexes are created
- Verify foreign key constraints work
- Ensure no impact on existing Booking queries

**Rollback Plan:**

- Drop `order_line_items` table
- Drop `orders` table
- Drop new enums

---

## Phase 2: Domain Schema & Type Definitions

**Goal:** Create domain schemas and types for Order and OrderLineItem

**Tasks:**

1. **Create `packages/domain/src/schemas/order.schema.ts`:**
   - `orderStatusSchema` (zod enum)
   - `orderLineItemTypeSchema` (zod enum)
   - `taxBehaviorSchema` (zod enum)
   - `pricingModeSchema` (zod enum)
   - `approvalMethodSchema` (zod enum)
   - `disputeStatusSchema` (zod enum)
   - `orderLineItemSchema` (zod object)
   - `orderSchema` (zod object)
   - `orderCreateInputSchema` (zod object)
   - `orderUpdateInputSchema` (zod object)
   - Export TypeScript types: `Order`, `OrderLineItem`, `OrderCreateInput`, `OrderUpdateInput`

2. **Create `packages/domain/src/enums.ts` additions:**
   - `OrderStatus` enum (matching Prisma enum)
   - `OrderLineItemType` enum
   - `TaxBehavior` enum
   - `PricingMode` enum
   - `ApprovalMethod` enum
   - `DisputeStatus` enum

3. **No mapping utilities needed:**
   - Since no Booking data exists, no status mapping is required
   - Order will use OrderStatus enum directly

**Validation:**

- Run type checking (`pnpm typecheck`)
- Verify schemas validate correctly

**Rollback Plan:**

- Remove new schema files
- Remove enum additions

---

## Phase 3: Repository Layer (Order)

**Goal:** Implement Order and OrderLineItem repositories

**Tasks:**

1. **Create `apps/api/src/server/modules/order/order.repo.ts`:**
   - `OrderEntity` interface (matches Prisma model)
   - `OrderCreateInput` interface
   - `OrderUpdateInput` interface
   - `OrderRepository` interface with methods:
     - `create(input: OrderCreateInput): Promise<OrderEntity>`
     - `findById(id: string): Promise<OrderEntity | null>`
     - `findByDisplayId(displayId: string): Promise<OrderEntity | null>`
     - `findByClientUserId(clientUserId: string): Promise<OrderEntity[]>`
     - `findByProProfileId(proProfileId: string): Promise<OrderEntity[]>`
     - `update(id: string, data: OrderUpdateInput): Promise<OrderEntity | null>`
     - `updateStatus(id: string, status: OrderStatus, metadata?: Record<string, any>): Promise<OrderEntity | null>`
   - `OrderRepositoryImpl` class with Prisma implementation
   - `mapPrismaToDomain` method

2. **Create `apps/api/src/server/modules/order/orderLineItem.repo.ts`:**
   - `OrderLineItemEntity` interface
   - `OrderLineItemCreateInput` interface
   - `OrderLineItemRepository` interface with methods:
     - `create(input: OrderLineItemCreateInput): Promise<OrderLineItemEntity>`
     - `createMany(inputs: OrderLineItemCreateInput[]): Promise<OrderLineItemEntity[]>`
     - `findByOrderId(orderId: string): Promise<OrderLineItemEntity[]>`
     - `deleteByOrderId(orderId: string): Promise<void>`
     - `replaceOrderLineItems(orderId: string, items: OrderLineItemCreateInput[]): Promise<OrderLineItemEntity[]>` (delete + create)
   - `OrderLineItemRepositoryImpl` class

3. **Create `apps/api/src/server/modules/order/order.display-id.ts`:**
   - `getNextOrderDisplayId(): Promise<string>` (similar to booking display ID logic)

4. **Register repositories in DI container:**
   - Add `TOKENS.OrderRepository` and `TOKENS.OrderLineItemRepository` to `TOKENS`
   - Register implementations in container setup

**Validation:**

- Unit tests for repository methods
- Test display ID generation
- Test line item creation/replacement
- Verify Prisma queries are efficient

**Rollback Plan:**

- Remove repository files
- Remove DI registrations

---

## Phase 4: Service Layer (Order) - Core Logic

**Goal:** Implement Order service with core business logic

**Tasks:**

1. **Create `apps/api/src/server/modules/order/order.service.ts`:**
   - `OrderService` class with dependencies:
     - `OrderRepository`
     - `OrderLineItemRepository`
     - `ProService` (for hourly rate snapshot)
   - Methods:
     - `createOrder(input: OrderCreateInput): Promise<Order>`
     - `getOrderById(id: string): Promise<Order | null>`
     - `getOrderByDisplayId(displayId: string): Promise<Order | null>`
     - `getOrdersByClient(clientUserId: string): Promise<Order[]>`
     - `getOrdersByPro(proProfileId: string): Promise<Order[]>`
     - `updateOrderStatus(id: string, status: OrderStatus, metadata?: Record<string, any>): Promise<Order | null>`

2. **Create `apps/api/src/server/modules/order/order.creation.service.ts`:**
   - `OrderCreationService` class
   - `createOrderRequest(input: {...}): Promise<Order>` (maps from current booking creation flow)
   - Handles: display ID generation, hourly rate snapshot, initial status (`pending_pro_confirmation`)

3. **Create `apps/api/src/server/modules/order/order.finalization.service.ts`:**
   - `OrderFinalizationService` class (implements finalization algorithm from ARCHITECTURE.md)
   - `finalizeOrder(orderId: string, approvedHours: number, approvalMethod: ApprovalMethod): Promise<Order>`
   - Logic:
     1. Lock order (idempotency)
     2. Set `approvedHours`
     3. Create/replace line items (labor, platform_fee, tax)
     4. Compute totals from line items
     5. Update order totals
     6. Return order (payment capture happens in payment service)

4. **Create `apps/api/src/server/modules/order/order.calculations.ts`:**
   - Pure functions:
     - `calculateSubtotal(lineItems: OrderLineItemEntity[]): number`
     - `calculatePlatformFee(laborAmount: number, platformFeePercent: number): number`
     - `calculateTax(taxableBase: number, taxRate: number): number`
     - `calculateTotal(subtotal: number, taxAmount: number): number`
     - `buildLineItemsForFinalization(order: OrderEntity, approvedHours: number, platformFeePercent: number, taxRate: number): OrderLineItemCreateInput[]`

5. **Register services in DI container**

**Validation:**

- Unit tests for service methods
- Test finalization algorithm with various scenarios
- Test calculation functions
- Verify hourly rate snapshot logic

**Rollback Plan:**

- Remove service files
- Remove DI registrations

---

## Phase 5: Update Related Entities (Foreign Keys)

**Goal:** Update Review, Payment, Earning to reference Order instead of Booking

**Tasks:**

1. **Update `Review` model:**
   - Replace `bookingId` with `orderId` (required, non-nullable)
   - Update relation: `order Order @relation(...)`
   - Remove `bookingId` column and foreign key constraint
   - Migration: Drop `bookingId`, add `orderId` with foreign key

2. **Update `Payment` model:**
   - Replace `bookingId` with `orderId` (required, non-nullable)
   - Update relation: `order Order @relation(...)`
   - Remove `bookingId` column and foreign key constraint
   - Migration: Drop `bookingId`, add `orderId` with foreign key

3. **Update `Earning` model:**
   - Replace `bookingId` with `orderId` (required, non-nullable)
   - Update relation: `order Order @relation(...)`
   - Remove `bookingId` column and foreign key constraint
   - Migration: Drop `bookingId`, add `orderId` with foreign key

4. **Update repository methods:**
   - `ReviewRepository`: Replace `findByBookingId` with `findByOrderId`, update `create` to require `orderId`
   - `PaymentRepository`: Replace `findByBookingId` with `findByOrderId`, update `create` to require `orderId`
   - `EarningRepository`: Replace `findByBookingId` with `findByOrderId`, update `create` to require `orderId`

**Validation:**

- Verify foreign key constraints work correctly
- Test repository methods with `orderId`
- Verify no references to `bookingId` remain in new code

**Rollback Plan:**

- Re-add `bookingId` columns
- Revert repository changes

---

## Phase 6: Order Router & TRPC Procedures

**Goal:** Create Order API endpoints (replacing Booking endpoints)

**Tasks:**

1. **Create `apps/api/src/server/modules/order/order.router.ts`:**
   - `orderRouter` with procedures:
     - `create` (publicProcedure for clients)
     - `getById` (publicProcedure)
     - `getByDisplayId` (publicProcedure)
     - `listByClient` (protectedProcedure)
     - `listByPro` (proProcedure)
     - `accept` (proProcedure)
     - `confirm` (protectedProcedure) - client authorizes payment
     - `markInProgress` (proProcedure)
     - `markArrived` (proProcedure)
     - `submitHours` (proProcedure)
     - `approveHours` (protectedProcedure)
     - `disputeHours` (protectedProcedure)
     - `cancel` (publicProcedure)
     - `adminList` (adminProcedure)
     - `adminGetById` (adminProcedure)
     - `adminUpdateStatus` (adminProcedure)

2. **Create input/output schemas:**
   - `orderCreateInputSchema` (zod)
   - `orderUpdateInputSchema` (zod)
   - `orderSubmitHoursInputSchema` (zod)
   - `orderApproveHoursInputSchema` (zod)
   - `orderDisputeInputSchema` (zod)

3. **Register router in main router:**
   - Add `order: orderRouter` to main router
   - Can remove `booking` router once Order endpoints are tested

4. **Implement state machine transitions:**
   - Validate status transitions according to ORDER_FLOW.md
   - Update timestamps on status changes

**Validation:**

- Test all endpoints with Postman/curl
- Verify state machine transitions
- Test authorization (client vs pro vs admin)
- Verify input validation

**Rollback Plan:**

- Remove order router registration
- Re-add Booking router if needed

---

## Phase 7: Payment Service Integration

**Goal:** Update Payment service to work with Orders

**Tasks:**

1. **Update `PaymentService`:**
   - Replace `createPaymentForBooking` with `createPaymentForOrder(orderId: string, ...): Promise<Payment>`
   - Update `authorizePayment` to accept `orderId`
   - Update `capturePayment` to work with Order finalization

2. **Update payment flow:**
   - Authorization: Triggered on Order `confirmed` status
   - Capture: Triggered after Order finalization (approved hours)

3. **Update `OrderFinalizationService`:**
   - After computing totals, trigger payment capture
   - Handle capture success/failure

4. **Update Mercado Pago integration:**
   - Ensure `orderId` is stored in payment metadata
   - Update webhook handlers to reference Order

**Validation:**

- Test payment authorization flow
- Test payment capture after finalization
- Test webhook handling
- Verify payment → order relationship

**Rollback Plan:**

- Revert Payment service changes
- Re-add Booking payment methods if needed

---

## Phase 8: Earning & Payout Service Integration

**Goal:** Update Earning service to work with Orders

**Tasks:**

1. **Update `EarningService`:**
   - Replace `createEarningForBooking` with `createEarningForOrder(orderId: string, ...): Promise<Earning>`
   - Update earning calculation to read from Order line items:
     - `grossAmount` = labor line item amount
     - `platformFeeAmount` = platform_fee line item amount
     - `netAmount` = grossAmount - platformFeeAmount

2. **Update payout flow:**
   - Payouts can reference Orders via Earnings
   - Update `PayoutService` to work with Order-based earnings

3. **Update `OrderFinalizationService`:**
   - After payment capture, create Earning record
   - Schedule payout

**Validation:**

- Test earning creation from Order
- Test payout calculation
- Verify earnings → order relationship

**Rollback Plan:**

- Revert Earning service changes
- Re-add Booking earning methods if needed

---

## Phase 9: Review Service Integration

**Goal:** Update Review service to work with Orders

**Tasks:**

1. **Update `ReviewService`:**
   - Replace `createReviewForBooking` with `createReviewForOrder(orderId: string, ...): Promise<Review>`
   - Update `createReview` to require `orderId`

2. **Update review validation:**
   - Ensure Order status is `completed` or `paid` before allowing review
   - Verify Order belongs to client creating review

**Validation:**

- Test review creation for Orders
- Test review validation logic
- Verify reviews → order relationship

**Rollback Plan:**

- Revert Review service changes
- Re-add Booking review methods if needed

---

## Phase 10: Client App Migration

**Goal:** Update client app to use Order endpoints

**Tasks:**

1. **Update hooks:**
   - Replace `useCreateBooking` → `useCreateOrder`
   - Replace `useBookingDetail` → `useOrderDetail`
   - Replace `useBookingList` → `useOrderList`

2. **Update components:**
   - Rename/refactor `BookingCreateScreen` → `OrderCreateScreen`
   - Rename/refactor `BookingDetailScreen` → `OrderDetailScreen`
   - Rename/refactor `BookingListScreen` → `OrderListScreen`

3. **Update types:**
   - Import `Order` type from `@repo/domain`
   - Replace all `Booking` type references with `Order`
   - Update component props to use `Order`

4. **Update API calls:**
   - Replace Booking TRPC procedures with Order procedures
   - Update all API client methods

**Validation:**

- Test Order creation flow
- Test Order detail view
- Test Order list view
- Test full Order lifecycle in client app

**Rollback Plan:**

- Revert component changes
- Re-add Booking hooks and components

---

## Phase 11: Pro Mobile App Migration

**Goal:** Update pro mobile app to use Order endpoints

**Tasks:**

1. **Create feature flag:**
   - `USE_ORDER_API` config

2. **Update API client:**
   - Add Order endpoints
   - Update types

3. **Update screens:**
   - Order list screen
   - Order detail screen
   - Order acceptance flow
   - Hours submission flow

4. **Update state management:**
   - Replace Booking state with Order state
   - Update reducers/selectors

5. **Gradual rollout:**
   - Similar to client app

**Validation:**

- Test Order acceptance
- Test hours submission
- Test Order status updates
- Verify backward compatibility

**Rollback Plan:**

- Disable feature flag
- Revert to Booking API

---

## Phase 12: Admin App Migration

**Goal:** Update admin app to use Order endpoints

**Tasks:**

1. **Update admin dashboard:**
   - Replace Booking list view with Order list view
   - Replace Booking detail view with Order detail view
   - Update Order status management
   - Update Order dispute resolution

2. **Update analytics:**
   - Replace Booking metrics with Order metrics
   - Update reports to use Order data

3. **Update audit logs:**
   - Reference `orderId` instead of `bookingId`

**Validation:**

- Test admin Order management
- Test dispute resolution
- Verify analytics accuracy

**Rollback Plan:**

- Revert admin dashboard changes
- Re-add Booking admin views

---

## Phase 13: Remove Booking Code & Cleanup

**Goal:** Remove Booking code and clean up unused references

**Tasks:**

1. **Remove Booking API endpoints:**
   - Remove Booking router from main router
   - Delete `booking.router.ts`

2. **Remove Booking service code:**
   - Delete Booking service files (`booking.service.ts`, `booking.creation.service.ts`, etc.)
   - Remove Booking service from DI container

3. **Remove Booking repository (optional):**
   - Can keep for reference, but mark as deprecated
   - Or delete if not needed

4. **Remove Booking domain schemas:**
   - Delete `booking.schema.ts` from domain package
   - Remove `BookingStatus` enum (if not used elsewhere)
   - Update domain exports

5. **Remove Booking model from Prisma schema:**
   - Drop `Booking` model from schema
   - Create migration to drop `bookings` table
   - Remove `BookingStatus` enum (if not used elsewhere)

6. **Update documentation:**
   - Remove Booking API documentation
   - Update all docs to reference Order endpoints
   - Update client/pro/admin app docs

7. **Clean up unused imports:**
   - Remove Booking type imports from all files
   - Remove Booking-related utilities

**Validation:**

- Verify no references to Booking remain in codebase
- Run full test suite
- Verify Order system works end-to-end
- Check for any broken imports or references

**Rollback Plan:**

- Re-add Booking model to Prisma schema
- Re-add Booking service files
- Re-add Booking router

---

## Migration Timeline Estimate

| Phase                         | Duration | Risk Level | Dependencies |
| ----------------------------- | -------- | ---------- | ------------ |
| Phase 1: Database Schema      | 2-3 days | Low        | None         |
| Phase 2: Domain Schema        | 1-2 days | Low        | Phase 1      |
| Phase 3: Repository Layer     | 3-4 days | Low        | Phase 2      |
| Phase 4: Service Layer        | 4-5 days | Medium     | Phase 3      |
| Phase 5: Update Foreign Keys  | 2-3 days | Medium     | Phase 1-4    |
| Phase 6: Order Router         | 3-4 days | Medium     | Phase 4      |
| Phase 7: Payment Integration  | 2-3 days | High       | Phase 6      |
| Phase 8: Earning Integration  | 2-3 days | Medium     | Phase 7      |
| Phase 9: Review Integration   | 1-2 days | Low        | Phase 6      |
| Phase 10: Client App          | 5-7 days | Medium     | Phase 6      |
| Phase 11: Pro Mobile App      | 5-7 days | Medium     | Phase 6      |
| Phase 12: Admin App           | 3-4 days | Low        | Phase 6      |
| Phase 13: Remove Booking Code | 1-2 days | Low        | Phase 10-12  |

**Total Estimated Duration:** 6-9 weeks (depending on team size and testing rigor)

**Note:** Timeline is shorter since no data migration is needed.

---

## Risk Mitigation

1. **API Compatibility:**
   - Test Order API thoroughly before removing Booking API
   - Ensure all client apps are updated before removing Booking code
   - Monitor error rates during transition

2. **Payment Flow:**
   - Test payment authorization/capture thoroughly
   - Have rollback plan for payment issues
   - Monitor payment success rates

3. **Performance:**
   - Monitor query performance on Order table
   - Optimize indexes if needed
   - Consider read replicas for heavy queries

4. **Testing:**
   - Comprehensive unit tests for each phase
   - Integration tests for Order lifecycle
   - E2E tests for client/pro/admin flows
   - Test full Order state machine transitions

5. **Code Removal:**
   - Keep Booking code in git history (don't force delete)
   - Verify no dependencies before removing Booking model
   - Test thoroughly after each removal step

---

## Success Criteria

- ✅ Order API endpoints functional and tested
- ✅ Payment flow works with Orders
- ✅ Client/Pro/Admin apps using Order API
- ✅ All Booking code removed
- ✅ Performance maintained or improved
- ✅ Full Order lifecycle tested and working
- ✅ No references to Booking remain in active codebase

---

## Post-Migration Tasks

1. **Monitor:**
   - Order creation rates
   - Payment success rates
   - Error rates
   - Performance metrics

2. **Optimize:**
   - Query performance
   - Index usage
   - Caching strategies

3. **Document:**
   - Order API documentation
   - Migration lessons learned
   - Architecture decisions

4. **Future Enhancements:**
   - Support for fixed-price orders
   - Multi-line item orders (materials, etc.)
   - Advanced tax calculations
   - Invoice generation
