'use client';
import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  DollarSign,
  ShoppingCart,
  Package,
  ArrowUp,
  Zap,
} from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/authContext';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Order, Product } from '@/data/types';

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


export default function VendorDashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const db = useFirestore();

    const vendorProductsQuery = useMemo(() => {
        if (!user) return null;
        return query(collection(db, 'products'), where('vendorId', '==', user.uid));
    }, [user, db]);
    const { data: vendorProducts, loading: productsLoading } = useCollection<Product>(vendorProductsQuery);

    const allOrdersQuery = useMemo(() => {
      if (!user) return null;
      return query(collection(db, 'orders'));
    }, [user, db]);
    const { data: allOrders, loading: ordersLoading } = useCollection<Order>(allOrdersQuery);
    
    const { totalSales, pendingOrders } = useMemo(() => {
        if (!vendorProducts || !allOrders) {
            return { totalSales: 0, pendingOrders: 0 };
        }
        
        const vendorProductIds = new Set(vendorProducts.map(p => p.id));
        let totalSales = 0;
        let pendingOrders = 0;

        const vendorOrders = allOrders.filter(order => 
            order.items.some(item => vendorProductIds.has(item.productId))
        );
        
        vendorOrders.forEach(order => {
             const vendorItemsValue = order.items
                .filter(item => vendorProductIds.has(item.productId))
                .reduce((acc, item) => acc + item.price * item.quantity, 0);
            
            totalSales += vendorItemsValue;

            if (order.status === 'Pending' || order.status === 'Processing') {
                pendingOrders++;
            }
        });

        return { totalSales, pendingOrders };

    }, [vendorProducts, allOrders]);

    const activeProducts = useMemo(() => vendorProducts?.length || 0, [vendorProducts]);
    
    const flashSalePerformance = useMemo(() => {
        if (!vendorProducts) return 0;
        return vendorProducts.filter(p => p.flashSale && new Date(p.flashSale.endTime) > new Date()).length;
    }, [vendorProducts]);
    
    const isLoading = authLoading || productsLoading || ordersLoading;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
            title="Total Sales"
            icon={DollarSign}
            loading={isLoading}
            value={`৳${totalSales.toLocaleString()}`}
            subtext={
                <span className="flex items-center"><ArrowUp className="h-3 w-3 mr-1 text-green-500"/>
                +25.5% from last month
            </span>
            }
        />
        <KpiCard
            title="Pending Orders"
            icon={ShoppingCart}
            loading={isLoading}
            value={`+${pendingOrders}`}
            subtext="+10 from yesterday"
        />
        <KpiCard
            title="Active Products"
            icon={Package}
            loading={isLoading}
            value={`${activeProducts}`}
            subtext="3 pending approval"
        />
        <KpiCard
            title="Flash Sale Performance"
            icon={Zap}
            loading={isLoading}
            value={`${flashSalePerformance} Active`}
            subtext="Products in active flash sales"
        />
      </div>

       <Card>
        <CardHeader>
          <CardTitle>Welcome to your Vendor Portal</CardTitle>
          <CardDescription>
            Here you can manage your products, orders, and view sales analytics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>This is a placeholder for more vendor-specific components like charts and recent activities.</p>
        </CardContent>
      </Card>
    </div>
  );
}
