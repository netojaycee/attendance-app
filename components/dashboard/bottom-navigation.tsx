"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, BarChart3, User, Settings2 } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Role } from "@/prisma/generated/enums";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export function BottomNavigation() {
  const pathname = usePathname();
  const { user, isInitialized } = useAuthStore();

  // Base navigation items available to all users
  const baseNavItems: NavItem[] = [
    {
      label: "Home",
      href: "/dashboard",
      icon: <Home className="w-6 h-6" />,
    },
    {
      label: "Events",
      href: "/events",
      icon: <Calendar className="w-6 h-6" />,
    },
    {
      label: "Profile",
      href: "/profile",
      icon: <User className="w-6 h-6" />,
    },
  ];

  // Admin-only items
  const adminNavItems: NavItem[] = [
    {
      label: "Management",
      href: "/management",
      icon: <Settings2 className="w-6 h-6" />,
    },
    {
      label: "Stats",
      href: "/stats",
      icon: <BarChart3 className="w-6 h-6" />,
    },
  ];

  // Determine which items to show based on role
  const getNavItems = (): NavItem[] => {
    if (!user?.role) return baseNavItems;

    const isAdminOrLeader =
      user.role === Role.ADMIN || user.role === Role.DISTRICT_LEADER;

    if (isAdminOrLeader) {
      return [
        baseNavItems[0], // Home
        baseNavItems[1], // Events
        adminNavItems[0], // Management
        adminNavItems[1], // Stats
        baseNavItems[2], // Profile
      ];
    }

    return baseNavItems;
  };

  const navItems = getNavItems();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  if (!isInitialized) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex justify-between items-center max-w-5xl mx-auto">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-3 px-2 transition-colors ${
                active
                  ? "text-primary"
                  : "text-text-secondary hover:text-foreground"
              } hover:bg-muted/50`}
            >
              <div className="mb-1">{item.icon}</div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
