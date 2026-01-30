"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { WizardProvider } from "./WizardContext";
import type { WizardProps } from "./types";

/**
 * Generic Wizard Component
 *
 * A flexible, reusable wizard component that:
 * - Supports multiple steps with different option types
 * - Validates on change
 * - Persists state to URL (optional)
 * - Supports step skipping
 * - Preserves answers when navigating back
 */
export function Wizard({
  steps,
  initialAnswers = {},
  onComplete,
  persistToUrl = false,
  urlParamPrefix = "wizard_",
  header,
  footer,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showProgress: _showProgress = true,
  className = "",
  children,
}: WizardProps & { children?: ReactNode }) {
  const pathname = usePathname();

  return (
    <WizardProvider
      steps={steps}
      initialAnswers={initialAnswers}
      onComplete={onComplete}
      persistToUrl={persistToUrl}
      urlParamPrefix={urlParamPrefix}
      pathname={pathname}
    >
      <div className={className}>
        {header}
        {children}
        {footer}
      </div>
    </WizardProvider>
  );
}
