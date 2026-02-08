import type { PreferredContactMethod } from "@repo/domain";
import { SettingsProfileSection } from "./SettingsProfileSection";
import { SettingsNotificationsSection } from "./SettingsNotificationsSection";

export interface SettingsAccountSectionProps {
  // Profile
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone: string;
  createdAt?: Date;
  onPhoneChange: (value: string) => void;
  // Notification preferences (in profile + dedicated card)
  preferredContactMethod: PreferredContactMethod | "";
  onPreferredContactMethodChange: (value: PreferredContactMethod | "") => void;
}

/**
 * Combined tab: Personal Information + Notification Preferences + Activity.
 * Renders the three sub-sections in order in one tab.
 */
export function SettingsAccountSection({
  email,
  firstName,
  lastName,
  phone,
  createdAt,
  onPhoneChange,
  preferredContactMethod,
  onPreferredContactMethodChange,
}: SettingsAccountSectionProps) {
  return (
    <div className="space-y-6">
      <SettingsProfileSection
        email={email}
        firstName={firstName}
        lastName={lastName}
        phone={phone}
        preferredContactMethod={preferredContactMethod}
        onPhoneChange={onPhoneChange}
        onPreferredContactMethodChange={onPreferredContactMethodChange}
        createdAt={createdAt}
      />
      <SettingsNotificationsSection
        preferredContactMethod={preferredContactMethod}
        onPreferredContactMethodChange={onPreferredContactMethodChange}
      />
    </div>
  );
}
