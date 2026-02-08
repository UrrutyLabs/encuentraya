/**
 * Client mobile tab bar configuration.
 * Used by ClientMobileTabBar (web) and can drive a future native client app.
 * Breakpoint: Tailwind md (768px) — tabs shown below that.
 */

export const CLIENT_MOBILE_TABS = [
  {
    id: "my-jobs",
    label: "Mis Trabajos",
    path: "/my-jobs",
    icon: "Briefcase",
  },
  {
    id: "search",
    label: "Buscar",
    path: "/",
    icon: "Search",
  },
  {
    id: "profile",
    label: "Perfil",
    path: "/settings",
    icon: "User",
  },
] as const;

export type ClientMobileTabId = (typeof CLIENT_MOBILE_TABS)[number]["id"];

/** Mobile shell heights (px) for layout padding. Match these in CSS. */
export const MOBILE_SHELL = {
  headerHeight: 56,
  tabBarHeight: 64,
} as const;
