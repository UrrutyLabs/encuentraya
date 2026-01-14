"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Calendar, User, Settings, LogOut } from "lucide-react";
import { Button } from "@repo/ui";
import { Text } from "@repo/ui";
import { useAuth } from "@/hooks/useAuth";

interface NavigationProps {
  showLogin?: boolean;
  showProfile?: boolean;
}

export function Navigation({ showLogin = true, showProfile = false }: NavigationProps) {
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
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <nav className="px-4 py-4 border-b border-border bg-surface">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link href="/">
          <Text variant="h2" className="text-primary">
            Arreglatodo
          </Text>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/search">
            <Button variant="ghost" className="px-4 flex items-center gap-2">
              <Search className="w-4 h-4" />
              Buscar
            </Button>
          </Link>
          <Link href="/my-bookings">
            <Button variant="ghost" className="px-4 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Mis reservas
            </Button>
          </Link>
          {showLogin && (
            <Link href="/login">
              <Button variant="ghost" className="px-4">
                Login
              </Button>
            </Link>
          )}
          {showProfile && (
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
      </div>
    </nav>
  );
}
