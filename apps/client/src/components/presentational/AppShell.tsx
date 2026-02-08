"use client";

import type { ReactNode } from "react";
import { DesktopNavigation } from "./DesktopNavigation";
import { MobileHeader } from "./MobileHeader";
import { ClientMobileTabBar } from "./ClientMobileTabBar";
import { MOBILE_SHELL } from "@/config/clientMobileTabs";

interface AppShellProps {
  children: ReactNode;
  /** Desktop: show login in nav. Mobile: ignored (no hamburger). */
  showLogin?: boolean;
  /** Desktop: center slot (e.g. search bar). Mobile: ignored. */
  centerContent?: ReactNode;
}

/**
 * App chrome: desktop = top nav only; mobile = header (back + title) + content + tab bar.
 * Tab bar only when authenticated client.
 */
export function AppShell({
  children,
  showLogin = true,
  centerContent,
}: AppShellProps) {
  return (
    <>
      <div className="hidden md:block">
        <DesktopNavigation
          showLogin={showLogin}
          centerContent={centerContent}
        />
      </div>

      <div className="md:hidden">
        <MobileHeader />
      </div>

      <main className="min-h-screen bg-bg pt-14 md:pt-0 pb-[max(env(safe-area-inset-bottom,0px),64px)] md:pb-0">
        <div className="md:pt-0 md:pb-0 md:min-h-0">{children}</div>
      </main>

      <div className="md:hidden">
        <ClientMobileTabBar />
      </div>
    </>
  );
}
