import { DependencyContainer } from "tsyringe";
import { TOKENS } from "../tokens";
import type { IStorageService } from "@modules/upload/storage.types";
import { SupabaseStorageService } from "@modules/upload/supabase-storage.service";
import { UploadService } from "@modules/upload/upload.service";
import { AvatarUrlService } from "@modules/avatar/avatar-url.service";

/**
 * Register Upload module dependencies.
 * Depends on: OrderService, ProRepository (for work_proof authorization).
 * IStorageService is implemented by SupabaseStorageService; swap here to use S3/R2 later.
 * Use factory so SupabaseStorageService is constructed with env (no DI constructor).
 */
export function registerUploadModule(container: DependencyContainer): void {
  container.register<IStorageService>(TOKENS.IStorageService, {
    useFactory: () => new SupabaseStorageService(),
  });

  container.register<UploadService>(TOKENS.UploadService, {
    useClass: UploadService,
  });

  container.register<AvatarUrlService>(TOKENS.AvatarUrlService, {
    useClass: AvatarUrlService,
  });
}
