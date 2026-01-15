import {
  User,
  Bell,
  Shield,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";
import type { ComponentType } from "react";
import type { PreferredContactMethod } from "@repo/domain";
import {
  SettingsProfileSection,
  SettingsNotificationsSection,
  SettingsSecuritySection,
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
  title: string;
  icon: LucideIcon;
  component: AnyComponent;
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
    title: "Información Personal",
    icon: User,
    component: asSectionComponent(SettingsProfileSection),
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
    title: "Preferencias de Notificación",
    icon: Bell,
    component: asSectionComponent(SettingsNotificationsSection),
    visible: () => true, // Always visible
    getProps: ({ formState, formHandlers }) => ({
      preferredContactMethod: formState.preferredContactMethod,
      onPreferredContactMethodChange: formHandlers.setPreferredContactMethod,
    }),
  },
  {
    id: "security",
    title: "Seguridad y Privacidad",
    icon: Shield,
    component: asSectionComponent(SettingsSecuritySection),
    visible: () => true, // Always visible (empty state handles no actions)
    getProps: ({ securityHandlers }) => ({
      onChangePasswordClick: securityHandlers?.onChangePasswordClick,
      onDeleteAccountClick: securityHandlers?.onDeleteAccountClick,
    }),
  },
  {
    id: "help",
    title: "Ayuda y Soporte",
    icon: HelpCircle,
    component: asSectionComponent(SettingsHelpSection),
    visible: () => true, // Always visible (empty state handles no actions)
    getProps: ({ helpHandlers }) => ({
      onHelpCenterClick: helpHandlers?.onHelpCenterClick,
      onContactSupportClick: helpHandlers?.onContactSupportClick,
      onReportProblemClick: helpHandlers?.onReportProblemClick,
    }),
  },
];
