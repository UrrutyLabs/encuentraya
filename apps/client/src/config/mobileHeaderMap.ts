/**
 * Centralized map: pathname pattern → mobile header title and back href.
 * Used by MobileHeader (and optionally AppShell).
 * For dynamic titles (job detail, pro profile), use MobileHeaderContext from the page.
 */

type PathRule = {
  title: string;
  /** Explicit parent path for back button. If undefined, use router.back(). */
  backHref?: string;
};

/** Path patterns (exact or prefix) to title and optional back. */
const PATH_MAP: Array<{ pattern: string | RegExp; rule: PathRule }> = [
  { pattern: "/", rule: { title: "Buscar" } },
  { pattern: "/my-jobs", rule: { title: "Mis Trabajos" } },
  {
    pattern: /^\/my-jobs\/[^/]+$/,
    rule: { title: "Trabajo", backHref: "/my-jobs" },
  },
  { pattern: /^\/my-jobs\/[^/]+\/chat$/, rule: { title: "Mensajes" } },
  { pattern: /^\/my-jobs\/[^/]+\/review$/, rule: { title: "Calificar" } },
  { pattern: "/search", rule: { title: "Buscar" } },
  { pattern: "/search/results", rule: { title: "Resultados", backHref: "/" } },
  { pattern: "/settings", rule: { title: "Configuración" } },
  { pattern: "/book", rule: { title: "Reservar", backHref: "/" } },
  { pattern: /^\/book\/wizard/, rule: { title: "Reservar", backHref: "/" } },
  { pattern: "/checkout", rule: { title: "Pagar", backHref: "/my-jobs" } },
  { pattern: /^\/pros\/[^/]+$/, rule: { title: "Perfil del profesional" } },
  {
    pattern: "/payment/success",
    rule: { title: "Pago exitoso", backHref: "/my-jobs" },
  },
  {
    pattern: "/payment/pending",
    rule: { title: "Pago pendiente", backHref: "/my-jobs" },
  },
  {
    pattern: "/payment/failure",
    rule: { title: "Error de pago", backHref: "/my-jobs" },
  },
  { pattern: "/contact", rule: { title: "Contacto" } },
  { pattern: "/faqs", rule: { title: "Preguntas frecuentes" } },
];

function matchPath(pathname: string): PathRule | null {
  const normalized = pathname.replace(/\/$/, "") || "/";
  for (const { pattern, rule } of PATH_MAP) {
    if (typeof pattern === "string") {
      if (normalized === pattern || normalized.startsWith(pattern + "/"))
        return rule;
    } else if (pattern.test(normalized)) {
      return rule;
    }
  }
  return null;
}

export function getMobileHeaderTitle(pathname: string): string {
  const rule = matchPath(pathname);
  return rule?.title ?? "EncuentraYa";
}

export function getMobileHeaderBackHref(pathname: string): string | undefined {
  const normalized = pathname.replace(/\/$/, "") || "/";
  // Job sub-routes: chat and review → back to job detail
  const jobSubMatch = normalized.match(/^(\/my-jobs\/[^/]+)\/(chat|review)$/);
  if (jobSubMatch) return jobSubMatch[1];
  const rule = matchPath(pathname);
  return rule?.backHref;
}

/** Paths that are tab roots: no back button. */
const TAB_ROOT_PATHS = ["/", "/my-jobs", "/settings"];

export function getMobileHeaderShowBack(pathname: string): boolean {
  const normalized = pathname.replace(/\/$/, "") || "/";
  if (TAB_ROOT_PATHS.includes(normalized)) return false;
  if (normalized.startsWith("/my-jobs") && normalized === "/my-jobs")
    return false;
  return true;
}
