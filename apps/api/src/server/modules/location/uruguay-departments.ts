/**
 * Uruguay's 19 departments (departamentos).
 * Used for pro service area (Option A) and validation.
 * @see docs/PLAN_LOCATION_PRO_SEARCH.md
 */

export interface UruguayDepartment {
  code: string;
  name: string;
}

/** Official 19 departments of Uruguay (name as used by IDE and common usage) */
export const UY_DEPARTMENTS: readonly UruguayDepartment[] = [
  { code: "AR", name: "Artigas" },
  { code: "CA", name: "Canelones" },
  { code: "CL", name: "Cerro Largo" },
  { code: "CO", name: "Colonia" },
  { code: "DU", name: "Durazno" },
  { code: "FS", name: "Flores" },
  { code: "FD", name: "Florida" },
  { code: "LA", name: "Lavalleja" },
  { code: "MA", name: "Maldonado" },
  { code: "MO", name: "Montevideo" },
  { code: "PA", name: "Paysandú" },
  { code: "RN", name: "Río Negro" },
  { code: "RV", name: "Rivera" },
  { code: "RO", name: "Rocha" },
  { code: "SA", name: "Salto" },
  { code: "SJ", name: "San José" },
  { code: "SO", name: "Soriano" },
  { code: "TA", name: "Tacuarembó" },
  { code: "TT", name: "Treinta y Tres" },
] as const;

const UY_DEPARTMENT_NAMES = new Set(
  UY_DEPARTMENTS.map((d) => d.name.toLowerCase())
);
const UY_DEPARTMENT_CODES = new Set(
  UY_DEPARTMENTS.map((d) => d.code.toUpperCase())
);

/**
 * Returns the list of Uruguay departments (readonly).
 */
export function getUyDepartments(): readonly UruguayDepartment[] {
  return UY_DEPARTMENTS;
}

/**
 * Returns true if the value is a valid Uruguay department name or code (case-insensitive).
 */
export function isValidUyDepartment(nameOrCode: string): boolean {
  if (!nameOrCode || typeof nameOrCode !== "string") return false;
  const normalized = nameOrCode.trim();
  if (!normalized) return false;
  return (
    UY_DEPARTMENT_NAMES.has(normalized.toLowerCase()) ||
    UY_DEPARTMENT_CODES.has(normalized.toUpperCase())
  );
}
