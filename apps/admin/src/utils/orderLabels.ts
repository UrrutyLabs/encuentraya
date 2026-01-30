/**
 * Centralized labels for Order terminology in Spanish
 * Used throughout the admin UI to display "Pedido"/"Pedidos" terminology
 */
export const ORDER_LABELS = {
  // Basic terminology
  singular: "Pedido",
  plural: "Pedidos",
  orderDetails: "Detalles del Pedido",
  orderNumber: "Número de Pedido",

  // Property labels
  id: "ID",
  displayId: "Número",
  status: "Estado",
  scheduledAt: "Fecha Programada",
  scheduledDate: "Fecha",
  scheduledTime: "Hora",
  address: "Dirección",
  category: "Categoría",
  description: "Descripción",
  estimatedHours: "Horas Estimadas",
  finalHours: "Horas Finales",
  approvedHours: "Horas Aprobadas",

  // Action labels
  cancelOrder: "Cancelar Pedido",
  viewOrder: "Ver Pedido",
  forceStatus: "Forzar Estado",

  // Status-related labels
  orderStatus: "Estado del Pedido",
  orderCompleted: "Pedido Completado",
  orderCanceled: "Pedido Cancelado",
  orderInProgress: "Pedido en Progreso",
  orderDisputed: "Pedido en Disputa",

  // Empty states
  noOrders: "No hay pedidos",
  noOrdersDescription: "Los pedidos aparecerán aquí cuando se creen",

  // Admin-specific labels
  ordersList: "Lista de Pedidos",
  ordersToday: "Pedidos de hoy",
  ordersThisWeek: "Pedidos de esta semana",
  ordersThisMonth: "Pedidos de este mes",
  totalOrders: "Total de pedidos",
} as const;
