/**
 * Centralized labels for Job terminology in Spanish
 * Used throughout the UI to display "Trabajo"/"Trabajos" terminology
 * while the backend uses Order entity
 */
export const JOB_LABELS = {
  // Basic terminology
  singular: "Trabajo",
  plural: "Trabajos",
  myJobs: "Mis Trabajos",
  createJob: "Crear Trabajo",
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

  // Action labels
  cancelJob: "Cancelar Trabajo",
  viewJob: "Ver Trabajo",
  payJob: "Pagar",
  reviewJob: "Calificar",
  rebookJob: "Reagendar",

  // Status-related labels
  jobStatus: "Estado del Trabajo",
  jobCompleted: "Trabajo Completado",
  jobCanceled: "Trabajo Cancelado",
  jobInProgress: "Trabajo en Progreso",

  // Empty states
  noJobs: "No tienes trabajos",
  noJobsDescription: "Cuando crees un trabajo, aparecerá aquí",
  noUpcomingJobs: "No tienes trabajos próximos",
  noPastJobs: "No tienes trabajos anteriores",

  // Stats
  jobsCompleted: "Trabajos realizados",
  jobsCompletedLabel: "Completados",

  // Navigation
  backToJobs: "Volver a mis trabajos",
  viewAllJobs: "Ver todos los trabajos",
} as const;
