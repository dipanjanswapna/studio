import {
  LayoutDashboard,
  Users2,
  ShoppingCart,
  Settings,
  Package,
  LineChart,
} from "lucide-react";
import type { NavItem } from "./PortalLayout";
import { PortalLayout } from "./PortalLayout";

const outletNavItems: NavItem[] = [
  { href: "/portal/outlet", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portal/outlet/inventory", label: "Inventory", icon: Package },
  { href: "/portal/outlet/orders", label: "Orders", icon: ShoppingCart },
  { href: "/portal/outlet/staff", label: "Staff", icon: Users2 },
  { href: "/portal/outlet/reports", label: "Reports", icon: LineChart },
  { href: "/portal/outlet/settings", label: "Settings", icon: Settings },
];

export function OutletLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalLayout
      navItems={outletNavItems}
      portalName="Outlet Portal"
      portalHome="/portal/outlet"
    >
      {children}
    </PortalLayout>
  );
}
