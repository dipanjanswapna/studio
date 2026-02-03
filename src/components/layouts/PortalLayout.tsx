import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Bell, Search, LogOut, type LucideIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/authContext";
import { Logo } from "@/components/Logo";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "../ThemeToggle";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  children?: NavItem[]; // for submenus
};

type PortalHeaderProps = {
  pageTitle: string;
};

function PortalHeader({ pageTitle }: PortalHeaderProps) {
  const { user, logout } = useAuth();

  const getPortalHome = () => {
    if (!user) return "/";
    switch (user.role) {
      case "ADMIN":
        return "/portal/admin";
      case "VENDOR":
        return "/portal/vendor";
      case "OUTLET":
        return "/portal/outlet";
      case "STAFF":
        return "/portal/staff";
      default:
        return "/";
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card px-4 sm:px-6">
      <SidebarTrigger className="md:hidden" />

      <div className="hidden md:block">
        <h1 className="text-xl font-semibold shrink-0">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] bg-background"
          />
        </div>
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Toggle notifications</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src={user?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${
                    user?.name || user?.email
                  }`}
                  alt={user?.name || ''}
                />
                <AvatarFallback>
                  {user?.name?.charAt(0) || "A"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <p className="font-medium">{user?.name || "User"}</p>
              <p className="text-xs text-muted-foreground font-normal">
                {user?.email}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`${getPortalHome()}/settings`}>Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

type PortalLayoutProps = {
  children: React.ReactNode;
  navItems: NavItem[];
  portalName: string;
  portalHome: string;
};

export function PortalLayout({
  children,
  navItems,
  portalName,
  portalHome,
}: PortalLayoutProps) {
  const router = useRouter();
  const { pathname, query } = router;

  const currentPage = useMemo(() => {
    const navItem = navItems.find(
      (item) =>
        pathname.startsWith(item.href) &&
        (item.href !== portalHome || pathname === portalHome)
    );

    if (navItem) {
      if (pathname.includes('/orders/') && query.id) {
        return `Order Details`;
      }
      return navItem.label;
    }

    return "Dashboard";
  }, [pathname, query, navItems, portalHome]);


  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b border-sidebar-border">
          <Link href={portalHome}>
             <Logo
              iconClassName="text-primary-foreground"
              textClassName="text-lg text-primary-foreground"
            />
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={
                    router.pathname === item.href ||
                    (item.href !== portalHome &&
                      router.pathname.startsWith(item.href))
                  }
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="flex h-screen min-w-0 flex-col overflow-hidden">
        <PortalHeader pageTitle={currentPage} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 dark:bg-background">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
