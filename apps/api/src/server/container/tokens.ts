/**
 * Dependency injection tokens
 * Used to register and resolve dependencies in TSyringe container
 */

// Repository tokens
export const TOKENS = {
  // Repositories
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
  CategoryRepository: "CategoryRepository",
  SubcategoryRepository: "SubcategoryRepository",
  ProProfileCategoryRepository: "ProProfileCategoryRepository",
  OrderRepository: "OrderRepository",
  OrderLineItemRepository: "OrderLineItemRepository",
  ChatRepository: "ChatRepository",

  // Services
  AuthService: "AuthService",
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
  ConfigService: "ConfigService",
  SubcategoryService: "SubcategoryService",
  OrderService: "OrderService",
  OrderCreationService: "OrderCreationService",
  OrderEstimationService: "OrderEstimationService",
  OrderFinalizationService: "OrderFinalizationService",
  OrderLifecycleService: "OrderLifecycleService",
  OrderAdminService: "OrderAdminService",
  ChatService: "ChatService",

  // Infrastructure
  Logger: "Logger",
  AuthProvider: "AuthProvider",
} as const;
