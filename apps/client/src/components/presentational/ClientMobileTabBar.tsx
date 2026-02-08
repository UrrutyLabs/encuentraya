"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, Search, User } from "lucide-react";
import { Text } from "@repo/ui";
import { CLIENT_MOBILE_TABS, MOBILE_SHELL } from "@/config/clientMobileTabs";
import { useAuth } from "@/hooks/auth";
import { useUserRole } from "@/hooks/auth";
import { Role } from "@repo/domain";

const ICONS = { Briefcase, Search, User } as const;

function isTabActive(pathname: string, tabPath: string): boolean {
  const normalized = pathname.replace(/\/$/, "") || "/";
  if (tabPath === "/") return normalized === "/";
  return normalized === tabPath || normalized.startsWith(tabPath + "/");
}

export function ClientMobileTabBar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { role } = useUserRole();
  const isClient = role === Role.CLIENT;
  const showTabs = !!user && isClient;

  if (!showTabs) return null;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Navegación principal"
    >
      <div
        className="flex items-center justify-around h-14 min-h-[56px]"
        style={{ minHeight: MOBILE_SHELL.tabBarHeight }}
      >
        {CLIENT_MOBILE_TABS.map((tab) => {
          const Icon = ICONS[tab.icon];
          const active = isTabActive(pathname, tab.path);
          return (
            <Link
              key={tab.id}
              href={tab.path}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 min-h-[44px] touch-manipulation text-muted hover:text-primary transition-colors"
              aria-current={active ? "page" : undefined}
            >
              <Icon
                className="w-6 h-6 shrink-0"
                aria-hidden
                strokeWidth={active ? 2.5 : 2}
              />
              <Text
                variant="xs"
                className={active ? "text-primary font-medium" : "text-muted"}
              >
                {tab.label}
              </Text>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
