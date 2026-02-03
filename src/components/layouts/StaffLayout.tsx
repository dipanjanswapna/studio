import {
  LayoutDashboard,
  Users2,
  ShoppingCart,
  Settings,
  PlusCircle,
} from "lucide-react";
import type { NavItem } from "./PortalLayout";
import { PortalLayout } from "./PortalLayout";

const staffNavItems: NavItem[] = [
  { href: "/portal/staff", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portal/staff/pos", label: "New Sale", icon: PlusCircle },
  { href: "/portal/staff/orders", label: "Orders", icon: ShoppingCart },
  { href: "/portal/staff/customers", label: "Customers", icon: Users2 },
  { href: "/portal/staff/settings", label: "Settings", icon: Settings },
];

export function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalLayout
      navItems={staffNavItems}
      portalName="Staff Portal"
      portalHome="/portal/staff"
    >
      {children}
    </PortalLayout>
  );
}
