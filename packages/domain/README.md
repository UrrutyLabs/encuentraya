# Domain Package

Shared domain models, schemas, and utilities used across all applications in the EncuentraYa monorepo.

## Overview

This package provides:

- **Domain Models**: TypeScript types and interfaces for core business entities
- **Schemas**: Zod schemas for validation
- **Utilities**: Shared utility functions for common operations

## Amount Handling

### Amount Units Convention

All monetary amounts are handled in **MINOR UNITS (cents)** to prevent JavaScript float precision issues.

**Example:**

- Major units: `402.60 UYU`
- Minor units: `40260` cents

### Amount Utilities

#### `toMinorUnits(amount: number): number`

Convert amount from major units to minor units.

```typescript
import { toMinorUnits } from "@repo/domain";

const amountInCents = toMinorUnits(402.6); // Returns 40260
```

#### `toMajorUnits(amount: number): number`

Convert amount from minor units to major units.

```typescript
import { toMajorUnits } from "@repo/domain";

const amountInDollars = toMajorUnits(40260); // Returns 402.60
```

#### `roundMinorUnits(amount: number): number`

Round amount in minor units (ensures integer values).

```typescript
import { roundMinorUnits } from "@repo/domain";

const rounded = roundMinorUnits(40260.5); // Returns 40261
```

### Currency Formatting

#### `formatCurrency(amount: number, currency?: string, isMinorUnits?: boolean): string`

Format a currency amount for display.

```typescript
import { formatCurrency } from "@repo/domain";

// Amount in minor units (cents)
formatCurrency(40260, "UYU", true); // Returns "$402"

// Amount in major units
formatCurrency(402.6, "UYU", false); // Returns "$402"
```

**Best Practice**: Always store amounts in minor units and pass `true` for `isMinorUnits` when formatting.

## Domain Models

### Order

Order-related types and schemas:

- `Order` - Order entity
- `OrderStatus` - Order status enum
- `OrderEstimateOutput` - Cost estimation result
- `OrderCreateInput` - Order creation input

### Pro Profile

Professional profile types:

- `ProProfile` - Professional profile entity
- `ProProfileStatus` - Profile status enum

### Payment

Payment-related types:

- `Payment` - Payment entity
- `PaymentStatus` - Payment status enum

## Usage

```typescript
import {
  // Types
  type Order,
  type ProProfile,

  // Enums
  OrderStatus,
  PaymentStatus,

  // Utilities
  toMinorUnits,
  toMajorUnits,
  formatCurrency,
} from "@repo/domain";
```

## Best Practices

1. **Always use minor units** for storage and calculations
2. **Convert to major units** only for display or API responses
3. **Use `formatCurrency()`** with `isMinorUnits: true` for consistent formatting
4. **Never mix** major and minor units in the same calculation
