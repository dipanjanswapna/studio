'use client';
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Menu,
  Search,
  ShoppingCart,
  User,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  ChevronRight,
  ChevronLeft,
  Tags,
  Flame,
  Truck,
  Building,
  Store,
  Briefcase,
  Home,
  TrendingUp,
  Package,
  FileText,
  Heart,
  Moon,
  Sun,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/context/authContext";
import type { Category as MegaMenuCategory } from "@/data/types";
import { useScroll } from "@/hooks/use-scroll";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Logo } from "@/components/Logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSearch } from "@/context/SearchContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/router";
import { AnimatePresence, motion } from "framer-motion";
import React from 'react';
import { useTheme } from "next-themes";
import { ThemeToggle } from "../ThemeToggle";
import { useCollection, useFirestore } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { Skeleton } from "../ui/skeleton";


export default function Header() {
  const { mainCartItemCount } = useCart();
  const { wishlistItemCount } = useWishlist();
  const { user, logout } = useAuth();
  const { openSearch } = useSearch();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const db = useFirestore();
  const categoriesQuery = useMemo(() => 
    query(collection(db, 'categories'), orderBy('order'))
  , [db]);
  const { data: megaMenuData, loading: menuLoading } = useCollection<MegaMenuCategory>(categoriesQuery);

  const isScrolled = useScroll(10);
  const [showNav, setShowNav] = useState(true);
  const lastScrollY = useRef(0);
  
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [viewedCategory, setViewedCategory] = useState<MegaMenuCategory | null>(null);

  const [activeMenu, setActiveMenu] = useState<MegaMenuCategory | null>(null);
  const menuRef = useRef<HTMLElement>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null); // For mega menu scroll
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  let leaveTimeout: NodeJS.Timeout;
  
  const handleMouseEnter = (category: MegaMenuCategory) => {
    clearTimeout(leaveTimeout);
    if (category.groups) {
      setActiveMenu(category);
    }
  };

  const handleMouseLeave = () => {
    leaveTimeout = setTimeout(() => {
      setActiveMenu(null);
    }, 200);
  };
  
  // --- Mega Menu Scroll Logic ---
  const checkMegaMenuScroll = useCallback(() => {
    const el = megaMenuRef.current;
    if (el) {
      const isScrollable = el.scrollWidth > el.clientWidth;
      setCanScrollLeft(el.scrollLeft > 0);
      // Check if scroll is at the end with a small tolerance
      setCanScrollRight(isScrollable && el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
    }
  }, []);

  useEffect(() => {
    const el = megaMenuRef.current;
    if (el) {
      checkMegaMenuScroll();
      window.addEventListener('resize', checkMegaMenuScroll);
      el.addEventListener('scroll', checkMegaMenuScroll);

      const timer = setTimeout(checkMegaMenuScroll, 100);

      return () => {
        if (el) {
          el.removeEventListener('scroll', checkMegaMenuScroll);
        }
        window.removeEventListener('resize', checkMegaMenuScroll);
        clearTimeout(timer);
      };
    }
  }, [megaMenuRef, checkMegaMenuScroll, megaMenuData]);
  
  const handleMegaMenuScroll = (direction: 'left' | 'right') => {
    const el = megaMenuRef.current;
    if (el) {
      const scrollAmount = direction === 'left' ? -el.clientWidth * 0.8 : el.clientWidth * 0.8;
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };
  
  useEffect(() => {
    const menuElement = menuRef.current;
    if (menuElement) {
        menuElement.addEventListener('mouseleave', handleMouseLeave);
    }
    return () => {
      if (menuElement) {
        menuElement.removeEventListener('mouseleave', handleMouseLeave);
      }
      clearTimeout(leaveTimeout);
    };
  }, []);

  // Reset drill-down view when sheet is closed
  useEffect(() => {
    if (!isSheetOpen) {
        const timer = setTimeout(() => setViewedCategory(null), 300);
        return () => clearTimeout(timer);
    }
  }, [isSheetOpen]);
  
  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== 'undefined') {
        if (window.scrollY < lastScrollY.current || window.scrollY < 80) {
          setShowNav(true);
        } else { 
          setShowNav(false);
          setActiveMenu(null); // Hide mega menu on scroll down
        }
        lastScrollY.current = window.scrollY;
      }
    };
    window.addEventListener('scroll', controlNavbar, { passive: true });
    return () => {
      window.removeEventListener('scroll', controlNavbar);
    };
  }, []);


  const getPortalLink = () => {
    if (!user) return "/profile";
    switch (user.role) {
        case "ADMIN": return "/portal/admin";
        case "VENDOR": return "/portal/vendor";
        case "OUTLET": return "/portal/outlet";
        case "STAFF": return "/portal/staff";
        case "CUSTOMER":
        default: return "/profile";
    }
  }

  const portalIcon = () => {
    if (!user) return LayoutDashboard;
    switch (user.role) {
        case "ADMIN": return Building;
        case "VENDOR": return Briefcase;
        case "OUTLET": return Store;
        case "STAFF": return User;
        case "CUSTOMER":
        default: return LayoutDashboard;
    }
  }

  const mainMenuItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/shop", label: "Shop", icon: Store },
    { href: "/shop?sort=best-selling", label: "Best Selling", icon: TrendingUp },
    { href: "/shop?sort=newest", label: "New Arrivals", icon: Package },
    { href: "/track-order", label: "Track Order", icon: Truck },
    { href: "/shop/brands", label: "Brands", icon: Tags },
    { href: "/shop?onSale=true", label: "Flash Sale", icon: Flame, special: true },
    { href: "/blog", label: "Blog", icon: FileText },
    { href: "/pre-order", label: "Pre Order", icon: ShoppingCart },
  ];
  
  return (
    <header 
      id="navbar" 
      ref={menuRef}
      className={cn(
        "fixed top-0 left-0 w-full z-50 bg-background/90 transition-transform duration-300 flex flex-col",
        isScrolled ? 'shadow-md backdrop-blur-sm' : '',
        !showNav ? '-translate-y-full' : ''
    )}>
      {/* --- Main Header --- */}
      <div className="container flex h-16 items-center">
        {/* Mobile/Tablet Hamburger Menu */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden mr-2" aria-label="Toggle Menu">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] p-0 bg-background flex flex-col overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <SheetClose asChild>
                <Link href="/" aria-label="AVERzO Home">
                  <Logo />
                </Link>
              </SheetClose>
            </div>
            
             <Tabs defaultValue="menu" className="flex flex-col flex-1 overflow-hidden">
                <TabsList className="grid w-full grid-cols-2 h-auto rounded-none p-0">
                    <TabsTrigger value="menu" className="py-3 text-sm font-semibold rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent">MENU</TabsTrigger>
                    <TabsTrigger value="categories" className="py-3 text-sm font-semibold rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent">CATEGORIES</TabsTrigger>
                </TabsList>
                 <TabsContent value="menu" className="flex-1 overflow-y-auto mt-0">
                    <nav className="flex flex-col text-base font-medium">
                        <ul className="space-y-1 p-4">
                            {mainMenuItems.map((item) => (
                                <li key={item.label}>
                                    <SheetClose asChild>
                                    <Link 
                                        href={item.href} 
                                        className={cn(
                                            "flex items-center gap-3 rounded-md p-3 transition-colors hover:bg-accent text-foreground/80",
                                            item.special && "text-primary font-semibold"
                                        )}
                                    >
                                        <item.icon className="h-5 w-5" />
                                        <span>{item.label}</span>
                                    </Link>
                                    </SheetClose>
                                </li>
                            ))}
                        </ul>
                        <div className="my-2 border-t"></div>
                        <ul className="space-y-1 p-4">
                             <li>
                                <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="flex w-full items-center gap-3 rounded-md p-3 transition-colors hover:bg-accent text-foreground/80">
                                  {theme === 'dark' ? <Sun className="h-5 w-5"/> : <Moon className="h-5 w-5"/>}
                                  <span>Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
                                </button>
                              </li>
                            {user ? (
                                user.role !== 'CUSTOMER' ? (
                                    <li>
                                        <SheetClose asChild>
                                        <Link href={getPortalLink()} className="flex items-center gap-3 rounded-md p-3 transition-colors hover:bg-accent text-primary">
                                            {React.createElement(portalIcon(), { className: "h-5 w-5" })}
                                            <span>My Portal</span>
                                        </Link>
                                        </SheetClose>
                                    </li>
                                ) : (
                                    <li>
                                        <SheetClose asChild>
                                        <Link href="/profile" className="flex items-center gap-3 rounded-md p-3 transition-colors hover:bg-accent text-foreground/80">
                                            <LayoutDashboard className="h-5 w-5" />
                                            <span>My Account</span>
                                        </Link>
                                        </SheetClose>
                                    </li>
                                )
                            ) : (
                                <li>
                                    <SheetClose asChild>
                                        <Link href="/auth/login" className="flex items-center gap-3 rounded-md p-3 transition-colors hover:bg-accent text-foreground/80">
                                            <User className="h-5 w-5" />
                                            <span>Login / Register</span>
                                        </Link>
                                    </SheetClose>
                                </li>
                            )}
                             {user && (
                                <li>
                                    <button onClick={() => { logout(); setIsSheetOpen(false); }} className="flex w-full items-center gap-3 rounded-md p-3 transition-colors text-destructive hover:bg-destructive/10">
                                    <LogOut className="h-5 w-5"/>
                                    <span>Logout</span>
                                    </button>
                                </li>
                            )}
                        </ul>
                    </nav>
                </TabsContent>
                 <TabsContent value="categories" className="flex-1 overflow-y-auto mt-0 relative">
                    <AnimatePresence initial={false}>
                        {viewedCategory ? (
                             <motion.div
                                key="sub-category-view"
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
                                className="absolute top-0 left-0 w-full h-full bg-background p-4"
                            >
                                <button onClick={() => setViewedCategory(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 font-medium">
                                    <ChevronLeft className="h-4 w-4" />
                                    <span>All Categories</span>
                                </button>
                                <h3 className="font-semibold px-2 mb-2 text-lg">{viewedCategory.name}</h3>
                                <ScrollArea className="h-[calc(100%-4rem)]">
                                    {viewedCategory.groups?.map((group) => (
                                        <div key={group.name} className="mb-4">
                                        <h4 className="font-semibold text-sm text-muted-foreground px-2 mb-2">{group.name}</h4>
                                        <ul className="space-y-1">
                                            {group.subcategories.map((subcategory) => (
                                            <li key={subcategory.href}>
                                                <SheetClose asChild>
                                                    <Link href={subcategory.href} className="block text-base text-foreground/80 hover:text-primary py-2 px-2 rounded-md hover:bg-accent">
                                                        <span>{subcategory.name}</span>
                                                    </Link>
                                                </SheetClose>
                                            </li>
                                            ))}
                                        </ul>
                                        </div>
                                    ))}
                                </ScrollArea>
                            </motion.div>
                        ) : (
                             <motion.div 
                                key="main-category-view"
                                initial={{ x: '-100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '-100%' }}
                                transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
                                className="p-4"
                            >
                                {menuLoading ? (
                                     <div className="space-y-2">
                                        <Skeleton className="h-10 w-full" />
                                        <Skeleton className="h-10 w-full" />
                                        <Skeleton className="h-10 w-full" />
                                        <Skeleton className="h-10 w-full" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                ) : (
                                <ul className="space-y-1">
                                    {megaMenuData?.map((category) => (
                                        <li key={category.name}>
                                            <Link 
                                                href={category.href} 
                                                onClick={(e) => {
                                                    if(category.groups) {
                                                        e.preventDefault();
                                                        setViewedCategory(category);
                                                    } else {
                                                        setIsSheetOpen(false);
                                                    }
                                                }}
                                                className="flex w-full items-center justify-between p-3 rounded-md transition-colors hover:bg-accent text-foreground/80 text-left"
                                            >
                                                <span>{category.name}</span>
                                                {category.groups && <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                 </TabsContent>
             </Tabs>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <div className="flex-shrink-0 mr-auto">
          <Link href="/" aria-label="AVERzO Home">
            <Logo />
          </Link>
        </div>
        
        {/* Right side Icons */}
        <div className="flex items-center justify-end space-x-0 sm:space-x-1 flex-shrink-0 ml-4">
          <Button variant="ghost" size="icon" aria-label="Search" onClick={openSearch}>
            <Search className="h-6 w-6" />
          </Button>
          <ThemeToggle />
          {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="User Profile">
                      <User className="h-6 w-6" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account ({user.role})</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><Link href={getPortalLink()}>My Portal</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/profile/orders">My Orders</Link></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
          ) : (
              <div className="hidden sm:flex">
                <Button asChild variant="ghost">
                  <Link href="/auth/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/register">Register</Link>
                </Button>
              </div>
          )}

          <div className="relative">
            <Button variant="ghost" size="icon" aria-label="My Wishlist" onClick={() => router.push('/profile/wishlist')}>
              <Heart className="h-6 w-6" />
            </Button>
            {wishlistItemCount > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-2 flex h-5 w-5 items-center justify-center rounded-full p-2 text-xs pointer-events-none">
                {wishlistItemCount}
              </Badge>
            )}
          </div>
          
          <div className="relative">
            <Button variant="ghost" size="icon" aria-label="Shopping Cart" onClick={() => router.push('/cart')}>
              <ShoppingCart className="h-6 w-6" />
            </Button>
            {mainCartItemCount > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-2 flex h-5 w-5 items-center justify-center rounded-full p-2 text-xs pointer-events-none">
                {mainCartItemCount}
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      {/* --- Category / Mega Bar --- */}
       <nav className="hidden lg:flex h-12 items-center bg-card border-y">
          <div className="container relative">
            <AnimatePresence>
              {canScrollLeft && (
                  <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      exit={{ opacity: 0 }} 
                      className="absolute left-0 top-0 bottom-0 z-10 flex items-center bg-gradient-to-r from-card via-card/90 to-transparent pr-12"
                  >
                      <Button variant="outline" size="icon" className="h-8 w-8 rounded-full shadow-md bg-background/80 hover:bg-background" onClick={() => handleMegaMenuScroll('left')}>
                          <ChevronLeft className="w-5 h-5" />
                      </Button>
                  </motion.div>
              )}
            </AnimatePresence>

            <div ref={megaMenuRef} className="flex items-center gap-2 text-sm font-medium overflow-x-auto scrollbar-hide">
              {menuLoading ? (
                  <div className="flex items-center gap-4">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-8 w-28" />
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-24" />
                  </div>
              ) : (
                megaMenuData?.map((category) => (
                    <div key={category.name} onMouseEnter={() => handleMouseEnter(category)} className="flex items-center group/nav-item">
                        <Link
                        href={category.href}
                        className={cn(
                            "transition-colors h-10 flex items-center gap-1 text-foreground/80 relative px-3 whitespace-nowrap rounded-md hover:bg-accent",
                            (activeMenu?.name === category.name && activeMenu.groups) && "bg-accent"
                        )}
                        >
                        <>
                        {category.name}
                        {category.groups && <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", activeMenu?.name === category.name ? "rotate-180" : "group-hover/nav-item:rotate-180")} />}
                        </>
                        </Link>
                    </div>
                ))
              )}
            </div>

            <AnimatePresence>
            {canScrollRight && (
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    className="absolute right-0 top-0 bottom-0 z-10 flex items-center bg-gradient-to-l from-card via-card/90 to-transparent pl-12"
                >
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-full shadow-md bg-background/80 hover:bg-background" onClick={() => handleMegaMenuScroll('right')}>
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </motion.div>
            )}
            </AnimatePresence>
          </div>
        </nav>
      
      {/* Mega Menu */}
      <AnimatePresence>
        {activeMenu && activeMenu.groups && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="absolute top-full left-0 w-full bg-card/95 backdrop-blur-sm shadow-lg z-20"
              onMouseEnter={() => clearTimeout(leaveTimeout)}
            >
              <div className="container mx-auto py-8 px-4">
                <div className="grid grid-cols-5 gap-x-8 gap-y-6">
                  {activeMenu.groups.map((group) => (
                    <div key={group.name}>
                      <h3 className="font-semibold text-foreground mb-4 text-base">{group.name}</h3>
                      <ul className="space-y-3">
                        {group.subcategories.map((subcategory) => (
                          <li key={subcategory.name}>
                            <Link href={subcategory.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                              {subcategory.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
