"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  CreditCard,
  Wallet,
  Users,
  Bell,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      router.push("/login");
    }
  };

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/bookings", label: "Reservas", icon: Calendar },
    { href: "/admin/payments", label: "Pagos", icon: CreditCard },
    { href: "/admin/payouts", label: "Cobros", icon: Wallet },
    { href: "/admin/pros", label: "Profesionales", icon: Users },
    { href: "/admin/notifications", label: "Notificaciones", icon: Bell },
  ];

  return (
    <div className="min-h-screen flex bg-bg">
      {/* Left Navigation */}
      <aside className="w-64 bg-surface border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <Link href="/admin" className="flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-primary" />
            <Text variant="h2" className="text-text">
              Admin
            </Text>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href === "/admin" && pathname === "/admin");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-text hover:bg-surface/80"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full justify-start flex items-center gap-3"
          >
            <LogOut className="w-5 h-5 text-muted" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
