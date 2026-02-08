"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, Calendar, User, Settings, LogOut } from "lucide-react";
import { Button } from "@repo/ui";
import { Text } from "@repo/ui";
import { useAuth } from "@/hooks/auth";
import { useUserRole } from "@/hooks/auth";
import { useClientProfile } from "@/hooks/client";
import { Role } from "@repo/domain";
import { JOB_LABELS } from "@/utils/jobLabels";
import { logger } from "@/lib/logger";
import { MobileDrawer } from "./MobileDrawer";

interface MobileNavigationProps {
  showLogin?: boolean;
  onNavigate?: () => void;
  centerContent?: ReactNode;
}

export function MobileNavigation({
  showLogin = true,
  onNavigate,
  centerContent,
}: MobileNavigationProps) {
  const router = useRouter();
  const { signOut, user } = useAuth();
  const { role } = useUserRole();
  const { profile: clientProfile } = useClientProfile({
    enabled: !!user && role === Role.CLIENT,
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const isAuthenticated = !!user;
  const avatarUrl = role === Role.CLIENT ? clientProfile?.avatarUrl : null;

  const homeLink = !isAuthenticated
    ? "/"
    : role === Role.PRO
      ? "/pro/download-app"
      : "/";

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        logger.error(
          "Error signing out",
          error instanceof Error ? error : new Error(String(error))
        );
      }
      setIsDrawerOpen(false);
      router.push("/");
    } catch (error) {
      logger.error(
        "Error signing out",
        error instanceof Error ? error : new Error(String(error))
      );
      setIsDrawerOpen(false);
      router.push("/");
    }
  };

  const handleLinkClick = () => {
    setIsDrawerOpen(false);
    onNavigate?.();
  };

  return (
    <>
      <nav className="px-4 py-4 border-b border-border bg-surface md:hidden">
        <div className="flex justify-between items-center">
          <Link href={homeLink} onClick={handleLinkClick}>
            <Text variant="h2">EncuentraYa</Text>
          </Link>

          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <Link href="/my-jobs" onClick={handleLinkClick}>
                <button
                  className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-lg hover:bg-surface/80 active:bg-surface/60 transition-colors touch-manipulation"
                  aria-label={JOB_LABELS.myJobs}
                >
                  <Calendar className="w-5 h-5 text-text" />
                </button>
              </Link>
            )}

            <button
              onClick={() => setIsDrawerOpen(true)}
              className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-full overflow-hidden bg-primary/10 hover:bg-primary/20 active:bg-primary/30 transition-colors touch-manipulation"
              aria-label="Abrir menú"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <Menu className="w-5 h-5 text-text" />
              )}
            </button>
          </div>
        </div>
      </nav>

      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      >
        <div className="py-4">
          {/* Search Bar (if provided) */}
          {centerContent && (
            <div className="px-4 pb-4 border-b border-border animate-[fadeIn_0.2s_ease-out_both]">
              {centerContent}
            </div>
          )}

          {isAuthenticated && user && (
            <>
              {/* User Info */}
              <div className="px-4 py-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Text variant="body" className="font-medium">
                      {user.email}
                    </Text>
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="py-2">
                {!isAuthenticated && (
                  <Link
                    href="/pro"
                    onClick={handleLinkClick}
                    className="flex items-center gap-3 px-4 py-4 min-h-[44px] text-muted no-underline hover:no-underline hover:text-muted hover:bg-surface/80 active:bg-surface/60 transition-colors touch-manipulation"
                  >
                    <Text variant="body">Registrarme como Profesional</Text>
                  </Link>
                )}

                <Link
                  href="/my-jobs"
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 px-4 py-4 min-h-[44px] hover:bg-surface/80 active:bg-surface/60 transition-colors touch-manipulation"
                >
                  <Calendar className="w-5 h-5 text-muted" />
                  <Text variant="body">{JOB_LABELS.myJobs}</Text>
                </Link>

                <Link
                  href="/settings"
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 px-4 py-4 min-h-[44px] hover:bg-surface/80 active:bg-surface/60 transition-colors touch-manipulation"
                >
                  <Settings className="w-5 h-5 text-muted" />
                  <Text variant="body">Configuración</Text>
                </Link>
              </div>

              {/* Sign Out */}
              <div className="px-4 py-2 border-t border-border">
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 w-full px-4 py-4 min-h-[44px] hover:bg-surface/80 active:bg-surface/60 transition-colors rounded-lg touch-manipulation"
                >
                  <LogOut className="w-5 h-5 text-muted" />
                  <Text variant="body">Cerrar sesión</Text>
                </button>
              </div>
            </>
          )}

          {!isAuthenticated && (
            <div className="px-4 py-2 space-y-2">
              <Link
                href="/pro"
                onClick={handleLinkClick}
                className="flex items-center justify-center px-4 py-4 min-h-[44px] text-muted no-underline hover:no-underline hover:text-muted transition-colors touch-manipulation"
              >
                <Text variant="body">Registrarme como Profesional</Text>
              </Link>
              {showLogin && (
                <Link href="/login" onClick={handleLinkClick}>
                  <Button variant="primary" className="w-full">
                    Iniciar sesión
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </MobileDrawer>
    </>
  );
}
