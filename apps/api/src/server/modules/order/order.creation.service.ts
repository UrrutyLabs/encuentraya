import { injectable, inject } from "tsyringe";
import type { OrderRepository } from "./order.repo";
import type { ProRepository } from "@modules/pro/pro.repo";
import type { ProProfileCategoryRepository } from "@modules/pro/proProfileCategory.repo";
import type { OrderCreateInput, Order } from "@repo/domain";
import { toMinorUnits, PricingMode } from "@repo/domain";
import type { Actor } from "@infra/auth/roles";
import { TOKENS } from "@/server/container";
import type { ClientProfileService } from "@modules/user/clientProfile.service";
import { OrderService } from "./order.service";
import type { CategoryRepository } from "../category/category.repo";
import type { SubcategoryService } from "../subcategory/subcategory.service";

/**
 * Order creation service
 * Handles order creation workflow including pro validation and hourly rate snapshot
 */
@injectable()
export class OrderCreationService {
  constructor(
    @inject(TOKENS.OrderRepository)
    private readonly orderRepository: OrderRepository,
    @inject(TOKENS.ProRepository)
    private readonly proRepository: ProRepository,
    @inject(TOKENS.ProProfileCategoryRepository)
    private readonly proProfileCategoryRepository: ProProfileCategoryRepository,
    @inject(TOKENS.ClientProfileService)
    private readonly clientProfileService: ClientProfileService,
    @inject(TOKENS.OrderService)
    private readonly orderService: OrderService,
    @inject(TOKENS.CategoryRepository)
    private readonly categoryRepository: CategoryRepository,
    @inject(TOKENS.SubcategoryService)
    private readonly subcategoryService: SubcategoryService
  ) {}

  /**
   * Create a new order request
   * Business rules:
   * - Pro must exist and be active
   * - Set initial status to PENDING_PRO_CONFIRMATION
   * - Snapshot hourly rate at creation time
   * - Scheduled window start must be in the future
   */
  async createOrderRequest(
    actor: Actor,
    input: OrderCreateInput
  ): Promise<Order> {
    // Validate scheduled window start is in the future
    const now = new Date();
    if (input.scheduledWindowStartAt <= now) {
      throw new Error("Scheduled window start must be in the future");
    }

    // Ensure client profile exists (lazy creation)
    await this.clientProfileService.ensureClientProfileExists(actor.id);

    // Validate pro exists and get hourly rate
    let hourlyRateSnapshot: number;
    if (input.proProfileId) {
      const pro = await this.proRepository.findById(input.proProfileId);
      if (!pro) {
        throw new Error("Pro not found");
      }

      if (pro.status === "suspended") {
        throw new Error("Pro is suspended");
      }

      hourlyRateSnapshot = pro.hourlyRate;
    } else {
      // If no pro is specified, we need to get it from somewhere
      // For now, throw an error - in the future this might be a search-based flow
      throw new Error("Pro profile ID is required");
    }

    const hourlyRateFromPro = hourlyRateSnapshot; // minor units

    if (!input.categoryId) {
      throw new Error("categoryId is required");
    }

    const category = await this.categoryRepository.findById(input.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    const pricingMode = (category.pricingMode ?? "hourly") as
      | "hourly"
      | "fixed";
    const isFixed = pricingMode === PricingMode.FIXED;

    let hourlyRateSnapshotMinor: number;
    let estimatedHours: number | null;

    if (isFixed) {
      hourlyRateSnapshotMinor = 0;
      estimatedHours = input.estimatedHours ?? null;
    } else {
      if (input.proProfileId) {
        const junction =
          await this.proProfileCategoryRepository.findByProProfileAndCategory(
            input.proProfileId,
            input.categoryId
          );
        const junctionRateCents = junction?.hourlyRateCents ?? null;
        hourlyRateSnapshotMinor =
          junctionRateCents != null ? junctionRateCents : hourlyRateFromPro;
      } else {
        hourlyRateSnapshotMinor = hourlyRateFromPro;
      }
      estimatedHours = input.estimatedHours ?? 0;
      if (estimatedHours <= 0) {
        throw new Error(
          "Estimated hours must be greater than 0 for hourly-priced categories"
        );
      }
    }

    // Validate subcategory belongs to category if both provided
    if (input.subcategoryId) {
      await this.subcategoryService.validateSubcategoryBelongsToCategory(
        input.subcategoryId,
        input.categoryId
      );
    }

    // Build categoryMetadataJson if not provided
    let categoryMetadataJson: Record<string, unknown> | undefined =
      input.categoryMetadataJson;
    if (!categoryMetadataJson) {
      categoryMetadataJson = {
        categoryId: category.id,
        categoryKey: category.key,
        categoryName: category.name,
      };

      if (input.subcategoryId) {
        const subcategory = await this.subcategoryService.getSubcategoryById(
          input.subcategoryId
        );
        if (subcategory) {
          categoryMetadataJson.subcategoryId = subcategory.id;
          categoryMetadataJson.subcategoryName = subcategory.name;
        }
      }
    }

    const existingOrders = await this.orderRepository.findByClientUserId(
      actor.id
    );
    const isFirstOrder = existingOrders.length === 0;

    const orderEntity = await this.orderRepository.create({
      clientUserId: actor.id,
      proProfileId: input.proProfileId,
      categoryId: input.categoryId,
      categoryMetadataJson: categoryMetadataJson,
      subcategoryId: input.subcategoryId,
      title: input.title,
      description: input.description,
      addressText: input.addressText,
      addressLat: input.addressLat,
      addressLng: input.addressLng,
      scheduledWindowStartAt: input.scheduledWindowStartAt,
      scheduledWindowEndAt: input.scheduledWindowEndAt,
      estimatedHours,
      pricingMode: isFixed ? "fixed" : "hourly",
      hourlyRateSnapshotAmount: hourlyRateSnapshotMinor,
      currency: "UYU",
      minHoursSnapshot: undefined,
      isFirstOrder,
    });

    // Return domain object
    return this.orderService.getOrderById(orderEntity.id) as Promise<Order>;
  }
}
