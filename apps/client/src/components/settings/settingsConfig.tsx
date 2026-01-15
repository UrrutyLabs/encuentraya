import {
  User,
  Bell,
  Shield,
  CreditCard,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";
import type { ComponentType } from "react";
import type { PreferredContactMethod } from "@repo/domain";
import {
  SettingsProfileSection,
  SettingsNotificationsSection,
  SettingsSecuritySection,
  SettingsPaymentsSection,
  SettingsHelpSection,
} from "./index";

// Types for section configuration
// ProfileData matches the client profile type from the API
type ProfileData = {
  id?: string;
  userId?: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  preferredContactMethod?: "EMAIL" | "WHATSAPP" | "PHONE" | null;
  createdAt?: Date;
  updatedAt?: Date;
};

type FormState = {
  phone: string;
  preferredContactMethod: PreferredContactMethod | "";
};

type FormHandlers = {
  setPhone: (value: string) => void;
  setPreferredContactMethod: (value: PreferredContactMethod | "") => void;
};


type SecurityHandlers = {
  onChangePasswordClick?: () => void;
  onDeleteAccountClick?: () => void;
};

type HelpHandlers = {
  onHelpCenterClick?: () => void;
  onContactSupportClick?: () => void;
  onReportProblemClick?: () => void;
};

// Helper type to allow any component props in configuration
// This is safe because getProps() ensures correct props are passed at runtime
type AnyComponent = ComponentType<Record<string, unknown>>;

type SettingsSectionConfig = {
  id: string;
  tabId: string; // Tab identifier for tab-based navigation
  title: string;
  icon: LucideIcon;
  component: AnyComponent;
  isEditable: boolean; // Whether this section requires form submission
  visible: (data: {
    profile?: ProfileData | null;
  }) => boolean;
  getProps: (data: {
    profile?: ProfileData | null;
    formState: FormState;
    formHandlers: FormHandlers;
    securityHandlers?: SecurityHandlers;
    helpHandlers?: HelpHandlers;
  }) => Record<string, unknown>;
};

// Helper function to safely cast components to configuration type
// Type assertion is safe because getProps() ensures correct props at runtime
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function asSectionComponent(component: any): AnyComponent {
  return component;
}

/**
 * Configuration for all settings sections
 * Reorder this array to change section order
 * Modify visible() to conditionally show/hide sections
 * Update getProps() to map data to component props
 */
export const settingsSections: SettingsSectionConfig[] = [
  {
    id: "profile",
    tabId: "personalData",
    title: "Información Personal",
    icon: User,
    component: asSectionComponent(SettingsProfileSection),
    isEditable: true,
    visible: ({ profile }) => !!profile,
    getProps: ({ profile, formState, formHandlers }) => ({
      email: profile?.email,
      firstName: profile?.firstName,
      lastName: profile?.lastName,
      phone: formState.phone || "",
      createdAt: profile?.createdAt,
      onPhoneChange: formHandlers.setPhone,
    }),
  },
  {
    id: "notifications",
    tabId: "notifications",
    title: "Preferencias de Notificación",
    icon: Bell,
    component: asSectionComponent(SettingsNotificationsSection),
    isEditable: true,
    visible: () => true, // Always visible
    getProps: ({ formState, formHandlers }) => ({
      preferredContactMethod: formState.preferredContactMethod,
      onPreferredContactMethodChange: formHandlers.setPreferredContactMethod,
    }),
  },
  {
    id: "security",
    tabId: "security",
    title: "Seguridad y Privacidad",
    icon: Shield,
    component: asSectionComponent(SettingsSecuritySection),
    isEditable: false,
    visible: () => true, // Always visible (empty state handles no actions)
    getProps: ({ securityHandlers }) => ({
      onChangePasswordClick: securityHandlers?.onChangePasswordClick,
      onDeleteAccountClick: securityHandlers?.onDeleteAccountClick,
    }),
  },
  {
    id: "payments",
    tabId: "payments",
    title: "Pagos",
    icon: CreditCard,
    component: asSectionComponent(SettingsPaymentsSection),
    isEditable: false,
    visible: () => true, // Always visible (placeholder for now)
    getProps: () => ({}), // No props needed for placeholder
  },
  {
    id: "help",
    tabId: "help",
    title: "Ayuda y Soporte",
    icon: HelpCircle,
    component: asSectionComponent(SettingsHelpSection),
    isEditable: false,
    visible: () => true, // Always visible (empty state handles no actions)
    getProps: ({ helpHandlers }) => ({
      onHelpCenterClick: helpHandlers?.onHelpCenterClick,
      onContactSupportClick: helpHandlers?.onContactSupportClick,
      onReportProblemClick: helpHandlers?.onReportProblemClick,
    }),
  },
];

/**
 * Get tabs configuration from sections
 * Filters visible sections and maps them to tab format
 */
export function getSettingsTabs(
  sections: SettingsSectionConfig[],
  profile?: ProfileData | null
): Array<{ id: string; label: string; icon: LucideIcon }> {
  return sections
    .filter((section) => section.visible({ profile }))
    .map((section) => ({
      id: section.tabId,
      label: section.title,
      icon: section.icon,
    }));
}

/**
 * Find section by tabId
 */
export function getSectionByTabId(
  sections: SettingsSectionConfig[],
  tabId: string,
  profile?: ProfileData | null
): SettingsSectionConfig | undefined {
  return sections.find(
    (section) => section.tabId === tabId && section.visible({ profile })
  );
}
