/**
 * Dependency injection tokens
 * Used to register and resolve dependencies in TSyringe container
 */

// Repository tokens
export const TOKENS = {
  // Repositories
  BookingRepository: "BookingRepository",
  PaymentRepository: "PaymentRepository",
  PaymentEventRepository: "PaymentEventRepository",
  ProRepository: "ProRepository",
  ReviewRepository: "ReviewRepository",
  UserRepository: "UserRepository",
  ClientProfileRepository: "ClientProfileRepository",
  AvailabilityRepository: "AvailabilityRepository",
  NotificationDeliveryRepository: "NotificationDeliveryRepository",
  DevicePushTokenRepository: "DevicePushTokenRepository",
  EarningRepository: "EarningRepository",
  PayoutRepository: "PayoutRepository",
  PayoutItemRepository: "PayoutItemRepository",
  ProPayoutProfileRepository: "ProPayoutProfileRepository",
  AuditLogRepository: "AuditLogRepository",
  CategoryMetadataRepository: "CategoryMetadataRepository",
  SubcategoryRepository: "SubcategoryRepository",

  // Services
  AuthService: "AuthService",
  BookingService: "BookingService", // Legacy - kept for backward compatibility
  BookingCreationService: "BookingCreationService",
  BookingLifecycleService: "BookingLifecycleService",
  BookingCompletionService: "BookingCompletionService",
  BookingQueryService: "BookingQueryService",
  BookingAdminService: "BookingAdminService",
  PaymentService: "PaymentService",
  PaymentServiceFactory: "PaymentServiceFactory",
  ProService: "ProService",
  ReviewService: "ReviewService",
  ClientProfileService: "ClientProfileService",
  NotificationService: "NotificationService",
  PushTokenService: "PushTokenService",
  PushDeliveryResolver: "PushDeliveryResolver",
  EarningService: "EarningService",
  PayoutService: "PayoutService",
  ProPayoutProfileService: "ProPayoutProfileService",
  AuditService: "AuditService",
  SearchService: "SearchService",
  AvailabilityService: "AvailabilityService",
  ContactService: "ContactService",
  CategoryService: "CategoryService",
  SubcategoryService: "SubcategoryService",

  // Infrastructure
  Logger: "Logger",
  AuthProvider: "AuthProvider",
} as const;
