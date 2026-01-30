"use client";

import { type ReactNode } from "react";
import { MobileNavigation } from "./MobileNavigation";
import { DesktopNavigation } from "./DesktopNavigation";

interface NavigationProps {
  showLogin?: boolean;
  showProfile?: boolean;
  /** Content to render in the center of the navigation (e.g., search bar) */
  centerContent?: ReactNode;
}

export function Navigation({
  showLogin = true,
  centerContent,
}: NavigationProps) {
  return (
    <>
      <MobileNavigation showLogin={showLogin} centerContent={centerContent} />
      <DesktopNavigation showLogin={showLogin} centerContent={centerContent} />
    </>
  );
}
