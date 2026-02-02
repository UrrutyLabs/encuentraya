/**
 * Seed script: reads config.seed.json and upserts categories and subcategories.
 * Run from apps/api: pnpm db:seed
 */
import "dotenv/config";
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
      : await prisma.category.create({
          data: {
            key: cat.key,
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
        });

    const categoryId = category.id;

    for (const sub of cat.subcategories ?? []) {
      await prisma.subcategory
        .upsert({
          where: {
            categoryId_key: {
              categoryId,
              key: sub.key,
            },
          },
          create: {
            categoryId,
            key: sub.key,
            name: sub.name,
            slug: sub.slug,
            displayOrder: sub.sort_order ?? 0,
            isActive: sub.is_active !== false,
            configJson: (sub.config_json ?? undefined) as
              | Prisma.InputJsonValue
              | undefined,
          },
          update: {
            name: sub.name,
            slug: sub.slug,
            displayOrder: sub.sort_order ?? 0,
            isActive: sub.is_active !== false,
            configJson: (sub.config_json ?? undefined) as
              | Prisma.InputJsonValue
              | undefined,
          },
        })
        .catch(async () => {
          const existing = await prisma.subcategory.findFirst({
            where: {
              categoryId,
              key: sub.key,
            },
          });
          if (existing) {
            return prisma.subcategory.update({
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
          }
          return prisma.subcategory.create({
            data: {
              categoryId,
              key: sub.key,
              name: sub.name,
              slug: sub.slug,
              displayOrder: sub.sort_order ?? 0,
              isActive: sub.is_active !== false,
              configJson: (sub.config_json ?? undefined) as
                | Prisma.InputJsonValue
                | undefined,
            },
          });
        });
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
