"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Briefcase, User, LogOut } from "lucide-react";
import { Button } from "@repo/ui";
import { Text } from "@repo/ui";
import { useAuth } from "@/hooks/auth";
import { logger } from "@/lib/logger";

export function ProHeader() {
  const router = useRouter();
  const { signOut, user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
        // Even if signOut fails, redirect to pro landing (session might already be invalid)
      }
      router.push("/pro");
    } catch (error) {
      logger.error(
        "Error signing out",
        error instanceof Error ? error : new Error(String(error))
      );
      // Redirect anyway to ensure user is logged out from UI perspective
      router.push("/pro");
    }
  };

  return (
    <header className="px-4 py-4 border-b border-border bg-surface">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link href="/pro" className="flex items-center gap-2">
          <Briefcase className="w-8 h-8 text-primary" />
          <Text variant="h2" className="text-primary">
            EncuentraYa Pro
          </Text>
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
              >
                <User className="w-4 h-4 text-primary" />
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-md shadow-lg z-50">
                  <div className="py-1">
                    <div className="px-4 py-2 border-b border-border">
                      <Text variant="small" className="text-muted">
                        {user.email}
                      </Text>
                    </div>
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
          ) : (
            <Link href="/">
              <Button variant="ghost" className="px-6">
                Volver al sitio principal
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
