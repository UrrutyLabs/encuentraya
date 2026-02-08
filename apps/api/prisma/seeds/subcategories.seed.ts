/**
 * Seed script: reads config.seed.json and upserts categories and subcategories.
 * Run from apps/api: pnpm db:seed
 */
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { Prisma, PrismaClient } from "../generated/prisma/client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const configPath = join(__dirname, "config.seed.json");
const config = JSON.parse(readFileSync(configPath, "utf-8")) as {
  categories: Array<{
    key: string;
    name: string;
    slug: string;
    sort_order: number;
    is_active: boolean;
    pricing_mode: string;
    payment_strategy: string;
    config_json: Record<string, unknown> | null;
    subcategories: Array<{
      key: string;
      name: string;
      slug: string;
      sort_order: number;
      is_active: boolean;
      config_json: Record<string, unknown> | null;
    }>;
  }>;
};

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
});

function mapPricingMode(value: string): "hourly" | "fixed" {
  if (value === "fixed") return "fixed";
  return "hourly";
}

function mapPaymentStrategy(value: string): "single_capture" {
  if (value === "single_capture") return "single_capture";
  return "single_capture";
}

async function main() {
  console.log("Seeding categories and subcategories from config.seed.json...");

  for (const cat of config.categories) {
    const existingCategory = await prisma.category.findFirst({
      where: { key: cat.key },
    });
    const category = existingCategory
      ? await prisma.category.update({
          where: { id: existingCategory.id },
          data: {
            name: cat.name,
            slug: cat.slug,
            sortOrder: cat.sort_order ?? 0,
            isActive: cat.is_active !== false,
            pricingMode: mapPricingMode(cat.pricing_mode ?? "hourly"),
            paymentStrategy: mapPaymentStrategy(
              cat.payment_strategy ?? "single_capture"
            ),
            configJson: (cat.config_json ?? undefined) as
              | Prisma.InputJsonValue
              | undefined,
          },
        })
      : await (async () => {
          const id = randomUUID();
          const configJson =
            cat.config_json != null ? JSON.stringify(cat.config_json) : null;
          await prisma.$executeRawUnsafe(
            `INSERT INTO categories (id, key, name, slug, "iconName", description, "sortOrder", "pricingMode", "paymentStrategy", "isActive", "configJson")
             VALUES ($1, $2, $3, $4, NULL, NULL, $5, $6, $7, $8, $9::jsonb)`,
            id,
            cat.key,
            cat.name,
            cat.slug,
            cat.sort_order ?? 0,
            mapPricingMode(cat.pricing_mode ?? "hourly"),
            mapPaymentStrategy(cat.payment_strategy ?? "single_capture"),
            cat.is_active !== false,
            configJson
          );
          const rows = await prisma.$queryRawUnsafe<
            Array<{ id: string; key: string; name: string; slug: string }>
          >(`SELECT id, key, name, slug FROM categories WHERE id = $1`, id);
          return rows[0]!;
        })();

    const categoryId = category.id;

    for (const sub of cat.subcategories ?? []) {
      const existing = await prisma.subcategory.findFirst({
        where: {
          categoryId,
          key: sub.key,
        },
      });
      if (existing) {
        await prisma.subcategory.update({
          where: { id: existing.id },
          data: {
            name: sub.name,
            slug: sub.slug,
            displayOrder: sub.sort_order ?? 0,
            isActive: sub.is_active !== false,
            configJson: (sub.config_json ?? undefined) as
              | Prisma.InputJsonValue
              | undefined,
          },
        });
      } else {
        const id = randomUUID();
        const configJson =
          sub.config_json != null ? JSON.stringify(sub.config_json) : null;
        await prisma.$executeRawUnsafe(
          `INSERT INTO subcategories (id, name, slug, "categoryId", key, imageUrl, description, "displayOrder", "isActive", "configJson", "searchKeywords")
           VALUES ($1, $2, $3, $4, $5, NULL, NULL, $6, $7, $8::jsonb, $9::text[])`,
          id,
          sub.name,
          sub.slug,
          categoryId,
          sub.key,
          sub.sort_order ?? 0,
          sub.is_active !== false,
          configJson,
          []
        );
      }
    }
  }

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
