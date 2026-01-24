import { DependencyContainer } from "tsyringe";
import { TOKENS } from "../tokens";
import {
  BookingRepository,
  BookingRepositoryImpl,
} from "@modules/booking/booking.repo";
import { BookingCreationService } from "@modules/booking/booking.creation.service";
import { BookingLifecycleService } from "@modules/booking/booking.lifecycle.service";
import { BookingCompletionService } from "@modules/booking/booking.completion.service";
import { BookingQueryService } from "@modules/booking/booking.query.service";
import { BookingAdminService } from "@modules/booking/booking.admin.service";

/**
 * Register Booking module dependencies
 * Depends on: ProRepository, PaymentServiceFactory, ClientProfileService (injected via container)
 */
export function registerBookingModule(container: DependencyContainer): void {
  // Register repository
  container.register<BookingRepository>(TOKENS.BookingRepository, {
    useClass: BookingRepositoryImpl,
  });

  // Register services (split by domain use cases)
  container.register<BookingCreationService>(TOKENS.BookingCreationService, {
    useClass: BookingCreationService,
  });

  container.register<BookingLifecycleService>(TOKENS.BookingLifecycleService, {
    useClass: BookingLifecycleService,
  });

  container.register<BookingCompletionService>(
    TOKENS.BookingCompletionService,
    {
      useClass: BookingCompletionService,
    }
  );

  container.register<BookingQueryService>(TOKENS.BookingQueryService, {
    useClass: BookingQueryService,
  });

  container.register<BookingAdminService>(TOKENS.BookingAdminService, {
    useClass: BookingAdminService,
  });
}
