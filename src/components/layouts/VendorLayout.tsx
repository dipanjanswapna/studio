import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Settings,
  CreditCard,
} from "lucide-react";
import type { NavItem } from "./PortalLayout";
import { PortalLayout } from "./PortalLayout";

const vendorNavItems: NavItem[] = [
  { href: "/portal/vendor", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portal/vendor/products", label: "Products", icon: Package },
  { href: "/portal/vendor/orders", label: "Orders", icon: ShoppingCart },
  { href: "/portal/vendor/payouts", label: "Payouts", icon: CreditCard },
  { href: "/portal/vendor/settings", label: "Settings", icon: Settings },
];

export function VendorLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalLayout
      navItems={vendorNavItems}
      portalName="Vendor Portal"
      portalHome="/portal/vendor"
    >
      {children}
    </PortalLayout>
  );
}
