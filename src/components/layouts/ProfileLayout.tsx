import Link from 'next/link';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/authContext';
import {
  LayoutDashboard,
  ListOrdered,
  MapPin,
  CreditCard,
  Settings,
  LogOut,
  type LucideIcon,
  ChevronDown,
  Heart,
  Award,
  Ticket,
  Bell,
  Trophy,
  Star,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const profileNavItems: { href: string; label: string; icon: LucideIcon }[] = [
    { href: '/profile', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/profile/orders', label: 'My Orders', icon: ListOrdered },
    { href: '/profile/reviews', label: 'My Reviews', icon: Star },
    { href: '/profile/wishlist', label: 'My Wishlist', icon: Heart },
    { href: '/profile/membership', label: 'Membership', icon: Award },
    { href: '/profile/loyalty', label: 'Loyalty Program', icon: Trophy },
    { href: '/profile/vouchers', label: 'My Vouchers', icon: Ticket },
    { href: '/profile/addresses', label: 'Manage Addresses', icon: MapPin },
    { href: '/profile/payments', label: 'Payment Methods', icon: CreditCard },
    { href: '/profile/notifications', label: 'Notifications', icon: Bell },
    { href: '/profile/settings', label: 'Account Settings', icon: Settings },
];

function ProfileSidebar() {
    const router = useRouter();
    const { user, logout } = useAuth();

    return (
        <Card className="p-4 h-full">
            <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-16 w-16 border-2 border-primary">
                    <AvatarImage src={user?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || user?.email}`} alt={user?.name || ''} />
                    <AvatarFallback>{user?.name?.charAt(0) || 'A'}</AvatarFallback>
                </Avatar>
                <div className="overflow-hidden">
                    <h3 className="font-bold text-lg truncate">{user?.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                </div>
            </div>
            <Separator />
            <nav className="flex flex-col gap-1 mt-4">
                {profileNavItems.map((item) => {
                    const isActive = router.pathname === item.href || (router.pathname.startsWith(item.href) && item.href !== '/profile');
                    return (
                        <Button
                            key={item.href}
                            variant={isActive ? "secondary" : "ghost"}
                            asChild
                            className="justify-start gap-3"
                        >
                            <Link href={item.href} >
                                <item.icon className="h-5 w-5" />
                                <span>{item.label}</span>
                            </Link>
                        </Button>
                    )
                })}
                 <Button
                    variant="ghost"
                    className="justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10 mt-4"
                    onClick={logout}
                >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                </Button>
            </nav>
        </Card>
    );
}

function MobileProfileNav() {
    const router = useRouter();
    const currentPage = [...profileNavItems].reverse().find(item => router.pathname.startsWith(item.href));

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between md:hidden mb-6">
                    <span>{currentPage?.label || 'Profile Navigation'}</span>
                    <ChevronDown className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[calc(100vw-2rem)]" align="start">
                {profileNavItems.map(item => (
                     <DropdownMenuItem key={item.href} asChild>
                        <Link href={item.href}>
                           <item.icon className="mr-2 h-4 w-4" />
                           {item.label}
                        </Link>
                     </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}


export function ProfileLayout({ children }: { children: React.ReactNode }) {
    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1,
            },
        },
    };

    return (
        <motion.div 
            className="container py-8 md:py-12"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <MobileProfileNav />
            <div className="flex flex-col md:flex-row gap-8">
                <aside className="hidden md:block md:w-1/4 lg:w-1/5 shrink-0">
                    <div className="sticky top-28">
                        <ProfileSidebar />
                    </div>
                </aside>
                <main className="flex-grow">
                    {children}
                </main>
            </div>
        </motion.div>
    );
}
