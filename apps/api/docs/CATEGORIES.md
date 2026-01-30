# Arreglatodo MVP – Categories & Subcategories Data Model (UY)

This document describes the recommended **2-level taxonomy** (Category → Subcategory) for Arreglatodo’s MVP, plus how it integrates with Orders and UI configuration.

---

## Goals

- Exactly **2 levels**: Category (parent) and Subcategory (child)
- Categories/subcategories are **data-driven** (no hardcoded enums as source of truth)
- Use per-(sub)category **config JSON** to shape UX (defaults, prompts, hints) without branching backend logic
- Orders remain **single universal lifecycle** (hourly-only MVP)

---

## Core Entities

### 1) `categories` (parents)

**Purpose**

- Navigation, grouping, analytics, pro scoping.
- Holds default UX configuration for all its subcategories.

**Recommended fields**

- `id` (uuid)
- `key` (string, unique, stable identifier like `PLUMBING`)
- `name` (display name, localized later)
- `slug` (unique)
- `sort_order` (int)
- `is_active` (bool)
- `config_json` (jsonb) – defaults for this category
- timestamps

**Indexes**

- unique(`key`)
- unique(`slug`)
- index(`is_active`, `sort_order`)

---

### 2) `subcategories` (children)

**Purpose**

- The “leaf selection” that best represents what the client needs.
- Overrides/extends category UX configuration.

**Recommended fields**

- `id` (uuid)
- `category_id` (FK → categories.id)
- `key` (string, stable within category, e.g. `UNCLOG_DRAIN`)
- `name`
- `slug` (unique, or unique within category)
- `sort_order`
- `is_active`
- `config_json` (jsonb) – overrides parent config
- `search_keywords` (string[]) optional
- timestamps

**Constraints / Indexes**

- unique(`category_id`, `key`)
- index(`category_id`, `is_active`, `sort_order`)

---

### 3) `orders` integration

Orders store both category and subcategory for:

- faster queries,
- analytics,
- easier filtering.

**Fields**

- `category_id` (FK)
- `subcategory_id` (FK)
- `category_metadata_json` (jsonb) – answers to dynamic questions derived from config

**Notes**

- Enforce “subcategory belongs to category” in the service layer for MVP (simple validation).
- Can be DB-enforced later with a composite FK pattern if desired.

---

## Config inheritance strategy (Category → Subcategory)

At runtime build an “effective config”:

1. Start from system defaults
2. Merge `categories.config_json`
3. Merge `subcategories.config_json` (wins)

This keeps UX flexible while avoiding category-specific backend code paths.

**Typical config keys**

- `default_estimated_hours`
- `min_hours`, `max_hours`, `hour_step`
- `suggested_photos[]`
- `quick_questions[]` (key/label/type/options)
- `disclaimer`
- `allow_tips`
- `show_arrived_step`

Store user answers in `orders.category_metadata_json` as key/value pairs.

---

## Example configs

**Category (Plumbing)**

```json
{
  "default_estimated_hours": 2,
  "min_hours": 1,
  "max_hours": 6,
  "hour_step": 0.5,
  "suggested_photos": ["Problema", "Zona", "Llave de paso"],
  "quick_questions": [
    { "key": "urgency", "label": "¿Es urgente?", "type": "boolean" },
    {
      "key": "water_shutoff",
      "label": "¿Podés cerrar la llave de paso?",
      "type": "boolean"
    }
  ],
  "disclaimer": "No incluye materiales.",
  "show_arrived_step": true
}
```

**Subcategory (Unclog drain)**

```json
{
  "default_estimated_hours": 1.5,
  "suggested_photos": ["Desagüe", "Bacha completa", "Sifón/tubería visible"],
  "quick_questions": [
    {
      "key": "which_area",
      "label": "¿Dónde es?",
      "type": "select",
      "options": ["Cocina", "Baño", "Lavadero"]
    }
  ]
}
```

---

## Recommended MVP constraints

- Only 2 levels (Category → Subcategory)
- Keep it lightweight:
  - Max 10–20 subcategories per category
  - Max 3 quick questions per subcategory
  - Max 3 photo hints per subcategory
- Categories/subcategories should be editable without deploy.

---

## Prisma schema (copy/paste starter)

```prisma
// Prisma schema snippet (PostgreSQL recommended)

model Category {
  id         String        @id @default(uuid())
  key        String        @unique // stable identifier like "PLUMBING"
  name       String
  slug       String        @unique
  sortOrder  Int           @default(0)
  isActive   Boolean       @default(true)
  configJson Json?         // category-level UI defaults
  createdAt  DateTime      @default(now())
  updatedAt  DateTime      @updatedAt

  subcategories Subcategory[]
  orders        Order[]

  @@index([isActive, sortOrder])
}

model Subcategory {
  id         String   @id @default(uuid())
  categoryId String
  category   Category @relation(fields: [categoryId], references: [id], onDelete: Restrict)

  key        String   // stable within category, e.g. "UNCLOG_DRAIN"
  name       String
  slug       String   // unique globally OR make unique within category (see @@unique)
  sortOrder  Int      @default(0)
  isActive   Boolean  @default(true)

  configJson     Json?
  searchKeywords String[] @default([])

  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  orders     Order[]

  @@unique([categoryId, key])
  @@unique([slug])
  @@index([categoryId, isActive, sortOrder])
}

model Order {
  id        String   @id @default(uuid())
  // ... your other order fields (status, pricing snapshots, etc.)

  clientId  String
  proId     String?

  categoryId    String
  subcategoryId String

  category    Category    @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  subcategory Subcategory @relation(fields: [subcategoryId], references: [id], onDelete: Restrict)

  categoryMetadataJson Json? // answers to dynamic questions from config

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([categoryId, subcategoryId])
  @@index([clientId])
  @@index([proId])
}
```

---

## Summary

- Store Categories and Subcategories in DB.
- Use config JSON with inheritance to customize UX per subcategory.
- Keep Orders universal; store `category_id`, `subcategory_id`, and `category_metadata_json`.
- This design supports fast iteration and future pricing models without migrations.
