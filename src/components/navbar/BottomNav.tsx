'use client';
import Link from "next/link";
import { Home, LayoutGrid, Search, ShoppingCart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearch } from "@/context/SearchContext";
import { motion } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/router";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/shop", label: "Shop", icon: LayoutGrid },
  { href: "#search", label: "Search", icon: Search },
  { href: "/cart", label: "Cart", icon: ShoppingCart },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const router = useRouter();
  const { pathname } = router;
  const { openSearch } = useSearch();
  const { mainCartItemCount } = useCart();
  const isProductPage = pathname.startsWith('/product/');

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 350, damping: 40, delay: 0.2 }}
      className="md:hidden fixed bottom-4 inset-x-4 bg-background/80 backdrop-blur-lg border rounded-full z-40 shadow-lg"
    >
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          let isActive = (item.href === "/" && pathname === "/") || (item.href !== "/" && !!pathname && pathname.startsWith(item.href));
          if (isProductPage && item.href === '/shop') {
              isActive = true;
          }
          const isCart = item.label === 'Cart';

          const handleClick = (e: React.MouseEvent) => {
            if (item.href === "#search") {
                e.preventDefault();
                openSearch();
            } else if (item.href === "/cart") {
                e.preventDefault();
                router.push('/cart');
            }
          };

          const Wrapper = item.href.startsWith("#") ? 'button' : Link;
          
          return (
            <Wrapper 
              href={item.href}
              key={item.label}
              onClick={handleClick}
              className="relative flex-1 h-full flex flex-col justify-center items-center text-sm gap-1"
            >
                <div className={cn("relative z-10 transition-colors", isActive ? "text-primary" : "text-muted-foreground")}>
                  <item.icon className="w-6 h-6" />
                </div>
                 <span className={cn("text-xs font-medium z-10", isActive ? "text-primary" : "text-muted-foreground")}>{item.label}</span>
                 {isCart && mainCartItemCount > 0 && (
                    <Badge variant="destructive" className="absolute top-1 right-1/2 translate-x-[24px] flex h-5 w-5 items-center justify-center rounded-full p-2 text-xs pointer-events-none">
                        {mainCartItemCount}
                    </Badge>
                )}
                 {isActive && (
                  <motion.div
                    layoutId="active-bottom-nav-pill"
                    className="absolute inset-0 bg-primary/10 rounded-full"
                    style={{ borderRadius: 9999 }}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
            </Wrapper>
          );
        })}
      </div>
    </motion.nav>
  );
}
