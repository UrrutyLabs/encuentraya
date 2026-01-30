"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, Save, X, Loader2, AlertCircle } from "lucide-react";
import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import { Button } from "@repo/ui";
import { Tabs } from "@repo/ui";
import { SidebarMenu } from "@repo/ui";
import { Navigation } from "@/components/presentational/Navigation";
import { useSettingsForm } from "@/hooks/client";
import {
  settingsSections,
  getSettingsTabs,
  getSectionByTabId,
} from "@/components/settings/settingsConfig";
import { SettingsSkeleton } from "@/components/settings/SettingsSkeleton";
import { ChangePasswordModal, DeleteAccountModal } from "@/components/settings";

export function SettingsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("personalData");
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] =
    useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] =
    useState(false);

  // Use settings form hook for all form logic
  const {
    profile,
    isLoading: isLoadingProfile,
    phone,
    preferredContactMethod,
    setPhone,
    setPreferredContactMethod,
    handleSubmit,
    isPending,
    error,
  } = useSettingsForm();

  const isLoading = isLoadingProfile;

  // Prepare data for section configuration
  const formState = useMemo(
    () => ({
      phone,
      preferredContactMethod,
    }),
    [phone, preferredContactMethod]
  );

  const formHandlers = useMemo(
    () => ({
      setPhone,
      setPreferredContactMethod,
    }),
    [setPhone, setPreferredContactMethod]
  );

  // Security handlers
  const securityHandlers = useMemo(
    () => ({
      onChangePasswordClick: () => {
        setIsChangePasswordModalOpen(true);
      },
      onDeleteAccountClick: () => {
        setIsDeleteAccountModalOpen(true);
      },
    }),
    []
  );

  // Help handlers (MVP - basic implementations)
  const helpHandlers = useMemo(
    () => ({
      onHelpCenterClick: () => {
        // MVP: Open help center (external link or show message)
        alert(
          "El centro de ayuda estará disponible próximamente. Por favor, contactá soporte si necesitás ayuda."
        );
      },
      onContactSupportClick: () => {
        // MVP: Open mailto link
        const email = "soporte@arreglatodo.com";
        const subject = encodeURIComponent("Consulta de soporte");
        window.location.href = `mailto:${email}?subject=${subject}`;
      },
      onReportProblemClick: () => {
        // MVP: Open mailto link for bug reports
        const email = "soporte@arreglatodo.com";
        const subject = encodeURIComponent("Reporte de problema");
        window.location.href = `mailto:${email}?subject=${subject}`;
      },
    }),
    []
  );

  // Get tabs configuration
  const tabs = useMemo(
    () => getSettingsTabs(settingsSections, profile),
    [profile]
  );

  // Get active section based on selected tab
  const activeSection = useMemo(
    () => getSectionByTabId(settingsSections, activeTab, profile),
    [activeTab, profile]
  );

  // Ensure activeTab is valid, default to first tab if not
  const validActiveTab = useMemo(() => {
    const section = getSectionByTabId(settingsSections, activeTab, profile);
    if (section) return activeTab;
    return tabs[0]?.id || "personalData";
  }, [activeTab, profile, tabs]);

  const sidebarItems = useMemo(
    () =>
      tabs.map((tab) => ({
        id: tab.id,
        label: tab.label,
        icon: tab.icon,
      })),
    [tabs]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg">
        <Navigation showLogin={false} showProfile={true} />
        <div className="px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <Settings className="w-6 h-6 text-primary" />
              <Text variant="h1" className="text-primary">
                Configuración
              </Text>
            </div>
            <SettingsSkeleton />
          </div>
        </div>
      </div>
    );
  }

  const currentSection =
    activeSection ||
    getSectionByTabId(settingsSections, validActiveTab, profile);

  if (!currentSection) {
    return (
      <div className="min-h-screen bg-bg">
        <Navigation showLogin={false} showProfile={true} />
        <div className="px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Text variant="h1" className="text-primary">
              Configuración no disponible
            </Text>
          </div>
        </div>
      </div>
    );
  }

  const SectionComponent = currentSection.component;
  const sectionProps = currentSection.getProps({
    profile,
    formState,
    formHandlers,
    securityHandlers,
    helpHandlers,
  });

  const isEditableTab = currentSection.isEditable;

  const renderContent = () => (
    <>
      {isEditableTab ? (
        <form
          key={profile?.id || "new"}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <SectionComponent {...sectionProps} />

          {error && (
            <Card className="p-4 bg-danger/10 border-danger/20">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-danger shrink-0" />
                <Text variant="body" className="text-danger">
                  {error.message || "No se pudo guardar. Probá de nuevo."}
                </Text>
              </div>
            </Card>
          )}

          <div className="flex gap-4">
            <Button
              type="submit"
              variant="primary"
              disabled={isPending}
              className="flex items-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar cambios
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <SectionComponent {...sectionProps} />
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-bg">
      <Navigation showLogin={false} showProfile={true} />
      <div className="px-4 py-4 md:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-2 mb-4 md:mb-6">
            <Settings className="w-6 h-6 text-primary" />
            <Text variant="h1" className="text-primary">
              Configuración
            </Text>
          </div>

          {/* Mobile: Tabs at top */}
          <div className="md:hidden mb-6">
            <Tabs
              tabs={tabs}
              activeTab={validActiveTab}
              onTabChange={setActiveTab}
            />
          </div>

          {/* Desktop: Sidebar + Content Layout */}
          <div className="md:flex md:gap-8">
            {/* Sidebar (Desktop only) */}
            <aside className="hidden md:block md:w-64 md:shrink-0">
              <SidebarMenu
                items={sidebarItems}
                activeItem={validActiveTab}
                onItemChange={setActiveTab}
              />
            </aside>

            {/* Content Area */}
            <main className="flex-1 min-w-0">{renderContent()}</main>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />
      <DeleteAccountModal
        isOpen={isDeleteAccountModalOpen}
        onClose={() => setIsDeleteAccountModalOpen(false)}
      />
    </div>
  );
}
