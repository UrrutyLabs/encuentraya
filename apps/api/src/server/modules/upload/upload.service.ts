import { injectable, inject } from "tsyringe";
import { randomUUID } from "crypto";
import type { Actor } from "@infra/auth/roles";
import { Role } from "@repo/domain";
import type { IStorageService } from "./storage.types";
import type { OrderService } from "@modules/order/order.service";
import type { ProRepository } from "@modules/pro/pro.repo";
import { authorizeProAction } from "@modules/order/order.helpers";
import {
  presignedUploadRequestSchema,
  type PresignedUploadRequest,
  type PresignedUploadResponse,
  isAllowedImageType,
} from "@repo/upload";
import { TOKENS } from "@/server/container";

const CONTENT_TYPE_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Upload service – provider-agnostic.
 * Builds paths, enforces auth, delegates presigned URL creation to IStorageService.
 */
@injectable()
export class UploadService {
  constructor(
    @inject(TOKENS.IStorageService)
    private readonly storageService: IStorageService,
    @inject(TOKENS.OrderService)
    private readonly orderService: OrderService,
    @inject(TOKENS.ProRepository)
    private readonly proRepository: ProRepository
  ) {}

  /**
   * Create a presigned upload URL for order_photo (client wizard) or work_proof (pro completion).
   * Validates input, authorizes by purpose, builds path, returns uploadUrl + storageUrl.
   */
  async createPresignedUploadUrl(
    actor: Actor,
    input: PresignedUploadRequest
  ): Promise<PresignedUploadResponse> {
    const parsed = presignedUploadRequestSchema.parse(input);

    if (!isAllowedImageType(parsed.contentType)) {
      throw new Error(
        `Invalid contentType: ${parsed.contentType}. Allowed: image/jpeg, image/png, image/webp`
      );
    }

    const ext =
      parsed.extension?.replace(/^\./, "") ??
      CONTENT_TYPE_TO_EXT[parsed.contentType] ??
      "jpg";
    const uploadId = randomUUID();
    const filename = `${uploadId}.${ext}`;

    let path: string;

    if (parsed.purpose === "order_photo") {
      if (actor.role !== Role.CLIENT) {
        throw new Error("Only clients can request order_photo upload URLs");
      }
      path = `order-photos/pending/${actor.id}/${filename}`;
    } else {
      // work_proof
      const order = await this.orderService.getOrderOrThrow(parsed.orderId);
      await authorizeProAction(
        actor,
        order,
        "upload work proof",
        this.proRepository
      );
      path = `work-proof/${parsed.orderId}/${filename}`;
    }

    const result = await this.storageService.createPresignedUploadUrl({
      path,
      contentType: parsed.contentType,
      expiresInSeconds: 3600,
    });

    return {
      uploadUrl: result.uploadUrl,
      storageUrl: result.storageUrl,
    };
  }
}
