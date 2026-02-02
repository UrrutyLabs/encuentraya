"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, User, Settings, LogOut } from "lucide-react";
import { Button } from "@repo/ui";
import { Text } from "@repo/ui";
import { Container } from "./Container";
import { useAuth } from "@/hooks/auth";
import { useUserRole } from "@/hooks/auth";
import { Role } from "@repo/domain";
import { JOB_LABELS } from "@/utils/jobLabels";
import { logger } from "@/lib/logger";

interface DesktopNavigationProps {
  showLogin?: boolean;
  centerContent?: ReactNode;
}

export function DesktopNavigation({
  showLogin = true,
  centerContent,
}: DesktopNavigationProps) {
  const router = useRouter();
  const { signOut, user } = useAuth();
  const { role } = useUserRole();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isAuthenticated = !!user;

  const homeLink = useMemo(() => {
    if (!isAuthenticated) {
      return "/";
    }
    if (role === Role.PRO) {
      return "/pro/download-app";
    }
    return "/";
  }, [isAuthenticated, role]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        logger.error(
          "Error signing out",
          error instanceof Error ? error : new Error(String(error))
        );
      }
      router.push("/");
    } catch (error) {
      logger.error(
        "Error signing out",
        error instanceof Error ? error : new Error(String(error))
      );
      router.push("/");
    }
  };

  return (
    <nav className="hidden md:block px-4 py-4 border-b border-border bg-surface">
      <Container maxWidth="full" className="flex items-center gap-4">
        {/* Left: Logo */}
        <Link href={homeLink} className="shrink-0">
          <Text variant="h2">EncuentraYa</Text>
        </Link>

        {/* Center: Search Bar (always reserve space) */}
        <div className="flex-1 flex justify-center px-4">
          {centerContent ? (
            <div className="w-full max-w-xl animate-[fadeIn_0.2s_ease-out_both]">
              {centerContent}
            </div>
          ) : null}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4 shrink-0">
          {!isAuthenticated && (
            <Link
              href="/pro"
              className="text-muted no-underline hover:no-underline hover:text-muted text-sm font-medium"
            >
              Registrarme como Profesional
            </Link>
          )}
          {isAuthenticated && (
            <Link href="/my-jobs">
              <Button variant="ghost" className="px-4 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {JOB_LABELS.myJobs}
              </Button>
            </Link>
          )}
          {!isAuthenticated && showLogin && (
            <Link href="/login">
              <Button variant="ghost" className="px-4">
                Iniciar sesión
              </Button>
            </Link>
          )}
          {isAuthenticated && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                aria-label="Menú de usuario"
              >
                <User className="w-4 h-4 text-primary" />
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-md shadow-lg z-50">
                  <div className="py-1">
                    <div className="px-4 py-2 border-b border-border">
                      <Text variant="small" className="text-muted">
                        {user?.email}
                      </Text>
                    </div>
                    <Link
                      href="/settings"
                      onClick={() => setShowMenu(false)}
                      className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-surface/80 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-muted" />
                      <Text variant="body" className="text-text">
                        Configuración
                      </Text>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-surface/80 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-muted" />
                      <Text variant="body" className="text-text">
                        Cerrar sesión
                      </Text>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Container>
    </nav>
  );
}
