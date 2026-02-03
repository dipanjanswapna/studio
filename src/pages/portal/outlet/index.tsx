'use client';

import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  ArrowUp,
} from "lucide-react";
import { useAuth } from '@/context/authContext';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Order, User, Product } from '@/data/types';
import { Skeleton } from '@/components/ui/skeleton';

function KpiCard({ title, icon: Icon, value, subtext, loading }: { title: string; icon: React.ElementType; value: string; subtext: React.ReactNode; loading: boolean }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {loading ? (
                    <>
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-3 w-1/2 mt-2" />
                    </>
                ) : (
                    <>
                        <div className="text-2xl font-bold">{value}</div>
                        <p className="text-xs text-muted-foreground flex items-center">{subtext}</p>
                    </>
                )}
            </CardContent>
        </Card>
    )
}


export default function OutletDashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const db = useFirestore();

    const ordersQuery = useMemo(() => user ? query(collection(db, 'orders')) : null, [user, db]);
    const { data: allOrders, loading: ordersLoading } = useCollection<Order>(ordersQuery);

    const staffQuery = useMemo(() => user ? query(collection(db, 'users'), where('role', '==', 'STAFF')) : null, [user, db]);
    const { data: staffMembers, loading: staffLoading } = useCollection<User>(staffQuery);

    const productsQuery = useMemo(() => user ? query(collection(db, 'products')) : null, [user, db]);
    const { data: allProducts, loading: productsLoading } = useCollection<Product>(productsQuery);
    
    const isLoading = authLoading || ordersLoading || staffLoading || productsLoading;

    const { totalRevenue, revenueChange, ordersToday } = useMemo(() => {
        if (!allOrders) return { totalRevenue: 0, revenueChange: 0, ordersToday: 0 };
        const now = new Date();
        const todayStart = new Date(now.setHours(0, 0, 0, 0));
        const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
        
        let totalRevenue = 0;
        let ordersToday = 0;
        let revenueToday = 0;
        let revenueYesterday = 0;

        allOrders.forEach(order => {
            totalRevenue += order.total;
            const orderDate = new Date(order.createdAt.seconds * 1000);
            if (orderDate >= todayStart) {
                ordersToday++;
                revenueToday += order.total;
            } else if (orderDate >= yesterdayStart) {
                revenueYesterday += order.total;
            }
        });
        
        const revenueChange = revenueYesterday > 0 
            ? ((revenueToday - revenueYesterday) / revenueYesterday) * 100 
            : revenueToday > 0 ? 100 : 0;

        return { totalRevenue, revenueChange, ordersToday };
    }, [allOrders]);

    const activeStaff = useMemo(() => staffMembers?.length || 0, [staffMembers]);

    const lowStockItems = useMemo(() => {
        if (!allProducts) return 0;
        return allProducts.filter(p => p.variants.some(v => v.stock > 0 && v.stock < 10)).length;
    }, [allProducts]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
            title="Total Revenue"
            icon={DollarSign}
            loading={isLoading}
            value={`৳${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            subtext={
                <span className="flex items-center">
                    <ArrowUp className="h-3 w-3 mr-1 text-green-500"/>
                    +{revenueChange.toFixed(1)}% from yesterday
                </span>
            }
        />
        <KpiCard
            title="Orders Today"
            icon={ShoppingCart}
            loading={isLoading}
            value={`+${ordersToday}`}
            subtext={`${allOrders?.length || 0} total orders`}
        />
        <KpiCard
            title="Active Staff"
            icon={Users}
            loading={isLoading}
            value={`${activeStaff}`}
            subtext="Staff members in the system"
        />
        <KpiCard
            title="Low Stock Items"
            icon={Package}
            loading={isLoading}
            value={`${lowStockItems}`}
            subtext="Items needing restock"
        />
      </div>

       <Card>
        <CardHeader>
          <CardTitle>Welcome to your Outlet Portal</CardTitle>
          <CardDescription>
            Here you can manage your outlet's inventory, staff, and view reports.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>This is a placeholder for more outlet-specific components like charts and recent activities.</p>
        </CardContent>
      </Card>
    </div>
  );
}
