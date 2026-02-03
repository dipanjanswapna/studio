'use client';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users2,
  FolderKanban,
  Building2,
  Settings,
  Tags,
  Briefcase,
  Banknote,
  LifeBuoy,
  Award,
} from "lucide-react";
import { PortalLayout, type NavItem } from "./PortalLayout";

const adminNavItems: NavItem[] = [
  { href: "/portal/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portal/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/portal/admin/products", label: "Products", icon: Package },
  { href: "/portal/admin/deals", label: "Deals", icon: Tags },
  { href: "/portal/admin/categories", label: "Categories", icon: FolderKanban },
  { href: "/portal/admin/brands", label: "Brands", icon: Award },
  { href: "/portal/admin/vendors", label: "Vendors", icon: Building2 },
  { href: "/portal/admin/users", label: "Users", icon: Users2 },
  { href: "/portal/admin/finance", label: "Finance", icon: Banknote },
  { href: "/portal/admin/b2b", label: "B2B Clients", icon: Briefcase },
  { href: "/portal/admin/support", label: "Support", icon: LifeBuoy },
  { href: "/portal/admin/settings", label: "Settings", icon: Settings },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalLayout
      navItems={adminNavItems}
      portalName="Admin Portal"
      portalHome="/portal/admin"
    >
      {children}
    </PortalLayout>
  );
}
