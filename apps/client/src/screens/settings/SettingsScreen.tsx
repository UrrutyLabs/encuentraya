"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, Save, X, Loader2, AlertCircle } from "lucide-react";
import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import { Button } from "@repo/ui";
import { Navigation } from "@/components/presentational/Navigation";
import { useSettingsForm } from "@/hooks/useSettingsForm";
import { settingsSections } from "@/components/settings/settingsConfig";
import { SettingsSkeleton } from "@/components/settings/SettingsSkeleton";
import {
  ChangePasswordModal,
  DeleteAccountModal,
} from "@/components/settings";

export function SettingsScreen() {
  const router = useRouter();
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

  // Filter visible sections
  const visibleSections = useMemo(
    () =>
      settingsSections.filter((section) =>
        section.visible({ profile })
      ),
    [profile]
  );

  // Separate editable sections (in form) from read-only/action sections
  const editableSectionIds = ["profile", "notifications"];
  const editableSections = visibleSections.filter((section) =>
    editableSectionIds.includes(section.id)
  );
  const readOnlySections = visibleSections.filter(
    (section) => !editableSectionIds.includes(section.id)
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg">
        <Navigation showLogin={false} showProfile={true} />
        <div className="px-4 py-8">
          <div className="max-w-4xl mx-auto">
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

  return (
    <div className="min-h-screen bg-bg">
      <Navigation showLogin={false} showProfile={true} />
      <div className="px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Settings className="w-6 h-6 text-primary" />
            <Text variant="h1" className="text-primary">
              Configuración
            </Text>
          </div>

          <div className="space-y-6">
            {/* Editable sections (in form) */}
            {editableSections.length > 0 && (
              <form
                key={profile?.id || "new"}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {editableSections.map((section) => {
                  const SectionComponent = section.component;
                  const sectionProps = section.getProps({
                    profile,
                    formState,
                    formHandlers,
                    securityHandlers,
                    helpHandlers,
                  });

                  return (
                    <div key={section.id}>
                      <div className="flex items-center gap-2 mb-4">
                        <section.icon className="w-5 h-5 text-primary" />
                        <Text variant="h2" className="text-text">
                          {section.title}
                        </Text>
                      </div>
                      <SectionComponent {...sectionProps} />
                    </div>
                  );
                })}

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
            )}

            {/* Read-only/Action sections (outside form) */}
            {readOnlySections.map((section) => {
              const SectionComponent = section.component;
              const sectionProps = section.getProps({
                profile,
                formState,
                formHandlers,
                securityHandlers,
                helpHandlers,
              });

              return (
                <div key={section.id}>
                  <div className="flex items-center gap-2 mb-4">
                    <section.icon className="w-5 h-5 text-primary" />
                    <Text variant="h2" className="text-text">
                      {section.title}
                    </Text>
                  </div>
                  <SectionComponent {...sectionProps} />
                </div>
              );
            })}
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
