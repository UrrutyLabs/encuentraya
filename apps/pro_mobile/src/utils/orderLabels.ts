/**
 * Centralized labels for Job terminology in Spanish
 * Used throughout the pro mobile UI to display "Trabajo"/"Trabajos" terminology
 * Note: Backend uses "Order" entity, but UI displays as "Job" (Trabajo) to users
 */
export const JOB_LABELS = {
  // Basic terminology
  singular: "Trabajo",
  plural: "Trabajos",
  jobDetails: "Detalles del Trabajo",
  jobNumber: "Número de Trabajo",

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
  totalAmount: "Total",

  // Action labels
  acceptJob: "Aceptar Trabajo",
  rejectJob: "Rechazar Trabajo",
  markOnMyWay: "Marcar en camino",
  markArrived: "Marcar llegada",
  completeJob: "Completar Trabajo",
  viewJob: "Ver Trabajo",

  // Status-related labels
  jobStatus: "Estado del Trabajo",
  jobCompleted: "Trabajo Completado",
  jobCanceled: "Trabajo Cancelado",
  jobInProgress: "Trabajo en Progreso",
  jobDisputed: "Trabajo en Disputa",
  jobPending: "Trabajo Pendiente",

  // Empty states
  noJobs: "No hay trabajos",
  noJobsDescription: "Los trabajos aparecerán aquí cuando se creen",
  noPendingJobs: "No hay trabajos pendientes",
  noUpcomingJobs: "No hay trabajos próximos",
  noCompletedJobs: "No hay trabajos completados",

  // Screen titles
  inbox: "Bandeja de Entrada",
  jobs: "Trabajos",
  newRequests: "Solicitudes nuevas",
  upcomingJobs: "Próximos trabajos",
  completedJobs: "Completados",

  // Error messages
  errorLoadingJobs: "Error al cargar trabajos",
  errorAcceptingJob: "Error al aceptar el trabajo",
  errorRejectingJob: "Error al rechazar el trabajo",
  errorCompletingJob: "Error al completar el trabajo",
} as const;
