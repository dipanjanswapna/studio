'use client';
import {
  LayoutDashboard,
  ShoppingCart,
  Settings,
  Building,
  Bolt,
  Users2,
} from "lucide-react";
import { PortalLayout, type NavItem } from "./PortalLayout";

const b2bNavItems: NavItem[] = [
  { href: "/portal/b2b", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portal/b2b/orders", label: "Company Orders", icon: ShoppingCart },
  { href: "/portal/b2b/quick-order", label: "Quick Order", icon: Bolt },
  { href: "/portal/b2b/users", label: "Manage Users", icon: Users2 },
  { href: "/portal/b2b/profile", label: "Company Profile", icon: Building },
  { href: "/portal/b2b/settings", label: "Settings", icon: Settings },
];

export function B2BLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalLayout
      navItems={b2bNavItems}
      portalName="B2B Portal"
      portalHome="/portal/b2b"
    >
      {children}
    </PortalLayout>
  );
}
