import "dotenv/config";
import { PrismaClient, Category } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
});

/**
 * Seed subcategories data
 * Migrates data from frontend mock to database
 */
export async function seedSubcategories() {
  console.log("Seeding subcategories...");

  const subcategoriesData = [
    // Plumbing
    {
      name: "Fugas y goteras",
      slug: "fugas-goteras",
      category: Category.plumbing,
      imageUrl: "/images/subcategories/plumbing-leak.jpg",
      displayOrder: 0,
    },
    {
      name: "Instalaciones",
      slug: "instalaciones",
      category: Category.plumbing,
      imageUrl: "/images/subcategories/plumbing-installation.jpg",
      displayOrder: 1,
    },
    {
      name: "Destapaciones",
      slug: "destapaciones",
      category: Category.plumbing,
      imageUrl: "/images/subcategories/plumbing-unclog.jpg",
      displayOrder: 2,
    },
    {
      name: "Calentadores",
      slug: "calentadores",
      category: Category.plumbing,
      imageUrl: "/images/subcategories/plumbing-water-heater.jpg",
      displayOrder: 3,
    },
    // Electrical
    {
      name: "Instalaciones eléctricas",
      slug: "instalaciones-electricas",
      category: Category.electrical,
      imageUrl: "/images/subcategories/electrical-installation.jpg",
      displayOrder: 0,
    },
    {
      name: "Reparaciones",
      slug: "reparaciones",
      category: Category.electrical,
      imageUrl: "/images/subcategories/electrical-repair.jpg",
      displayOrder: 1,
    },
    {
      name: "Tomas y enchufes",
      slug: "tomas-enchufes",
      category: Category.electrical,
      imageUrl: "/images/subcategories/electrical-outlets.jpg",
      displayOrder: 2,
    },
    {
      name: "Iluminación",
      slug: "iluminacion",
      category: Category.electrical,
      imageUrl: "/images/subcategories/electrical-lighting.jpg",
      displayOrder: 3,
    },
    // Cleaning
    {
      name: "Limpieza profunda",
      slug: "limpieza-profunda",
      category: Category.cleaning,
      imageUrl: "/images/subcategories/cleaning-deep.jpg",
      displayOrder: 0,
    },
    {
      name: "Limpieza regular",
      slug: "limpieza-regular",
      category: Category.cleaning,
      imageUrl: "/images/subcategories/cleaning-regular.jpg",
      displayOrder: 1,
    },
    {
      name: "Limpieza de ventanas",
      slug: "limpieza-ventanas",
      category: Category.cleaning,
      imageUrl: "/images/subcategories/cleaning-windows.jpg",
      displayOrder: 2,
    },
    {
      name: "Limpieza post-obra",
      slug: "limpieza-post-obra",
      category: Category.cleaning,
      imageUrl: "/images/subcategories/cleaning-post-construction.jpg",
      displayOrder: 3,
    },
    // Handyman
    {
      name: "Ensamblaje de muebles",
      slug: "ensamblaje-muebles",
      category: Category.handyman,
      imageUrl: "/images/subcategories/handyman-assembly.jpg",
      displayOrder: 0,
    },
    {
      name: "Colgar cuadros y estantes",
      slug: "colgar-cuadros",
      category: Category.handyman,
      imageUrl: "/images/subcategories/handyman-hanging.jpg",
      displayOrder: 1,
    },
    {
      name: "Reparaciones generales",
      slug: "reparaciones-generales",
      category: Category.handyman,
      imageUrl: "/images/subcategories/handyman-repair.jpg",
      displayOrder: 2,
    },
    {
      name: "Instalaciones varias",
      slug: "instalaciones-varias",
      category: Category.handyman,
      imageUrl: "/images/subcategories/handyman-installation.jpg",
      displayOrder: 3,
    },
    // Painting
    {
      name: "Pintura interior",
      slug: "pintura-interior",
      category: Category.painting,
      imageUrl: "/images/subcategories/painting-interior.jpg",
      displayOrder: 0,
    },
    {
      name: "Pintura exterior",
      slug: "pintura-exterior",
      category: Category.painting,
      imageUrl: "/images/subcategories/painting-exterior.jpg",
      displayOrder: 1,
    },
    {
      name: "Pintura de techos",
      slug: "pintura-techos",
      category: Category.painting,
      imageUrl: "/images/subcategories/painting-ceiling.jpg",
      displayOrder: 2,
    },
    {
      name: "Retoques",
      slug: "retoques",
      category: Category.painting,
      imageUrl: "/images/subcategories/painting-touch-up.jpg",
      displayOrder: 3,
    },
  ];

  for (const subcategory of subcategoriesData) {
    await prisma.subcategory.upsert({
      where: {
        slug_category: {
          slug: subcategory.slug,
          category: subcategory.category,
        },
      },
      update: {
        name: subcategory.name,
        imageUrl: subcategory.imageUrl,
        displayOrder: subcategory.displayOrder,
        isActive: true,
      },
      create: {
        name: subcategory.name,
        slug: subcategory.slug,
        category: subcategory.category,
        imageUrl: subcategory.imageUrl,
        displayOrder: subcategory.displayOrder,
        isActive: true,
      },
    });
  }

  console.log(`Seeded ${subcategoriesData.length} subcategories`);
}

/**
 * Seed category metadata
 * Migrates data from frontend mock to database
 */
export async function seedCategoryMetadata() {
  console.log("Seeding category metadata...");

  const categoryMetadataData = [
    {
      category: Category.plumbing,
      displayName: "Plomería",
      iconName: "Wrench",
      displayOrder: 0,
    },
    {
      category: Category.electrical,
      displayName: "Electricidad",
      iconName: "Zap",
      displayOrder: 1,
    },
    {
      category: Category.cleaning,
      displayName: "Limpieza",
      iconName: "Sparkles",
      displayOrder: 2,
    },
    {
      category: Category.handyman,
      displayName: "Arreglos generales",
      iconName: "Hammer",
      displayOrder: 3,
    },
    {
      category: Category.painting,
      displayName: "Pintura",
      iconName: "Palette",
      displayOrder: 4,
    },
  ];

  for (const metadata of categoryMetadataData) {
    await prisma.categoryMetadata.upsert({
      where: {
        category: metadata.category,
      },
      update: {
        displayName: metadata.displayName,
        iconName: metadata.iconName,
        displayOrder: metadata.displayOrder,
        isActive: true,
      },
      create: {
        category: metadata.category,
        displayName: metadata.displayName,
        iconName: metadata.iconName,
        displayOrder: metadata.displayOrder,
        isActive: true,
      },
    });
  }

  console.log(
    `Seeded ${categoryMetadataData.length} category metadata entries`
  );
}

/**
 * Main seed function
 */
export async function seed() {
  try {
    await seedCategoryMetadata();
    await seedSubcategories();
    console.log("Seeding completed successfully");
  } catch (error) {
    console.error("Error seeding data:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

// Run seed if called directly
if (require.main === module) {
  seed()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
