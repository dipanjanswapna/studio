'use client';
import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Download, ArrowRight, Banknote, Landmark } from "lucide-react";
import Link from 'next/link';
import { useAuth } from "@/context/authContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Order, Product } from '@/data/types';

export default function VendorPayoutsPage() {
    const { user, loading: authLoading } = useAuth();
    const db = useFirestore();

    const vendorProductsQuery = useMemo(() => {
        if (!user) return null;
        return query(collection(db, 'products'), where('vendorId', '==', user.uid));
    }, [user, db]);
    const { data: vendorProducts, loading: productsLoading } = useCollection<Product>(vendorProductsQuery);

    const allDeliveredOrdersQuery = useMemo(() => {
      if (!user) return null;
      return query(collection(db, 'orders'), where('status', '==', 'Delivered'));
    }, [user, db]);
    const { data: allDeliveredOrders, loading: ordersLoading } = useCollection<Order>(allDeliveredOrdersQuery);

    const loading = authLoading || productsLoading || ordersLoading;

    const { lifetimeEarnings, availableForPayout } = useMemo(() => {
        if (!vendorProducts || !allDeliveredOrders) {
            return { lifetimeEarnings: 0, availableForPayout: 0 };
        }
        
        const vendorProductIds = new Set(vendorProducts.map(p => p.id));
        if (vendorProductIds.size === 0) {
            return { lifetimeEarnings: 0, availableForPayout: 0 };
        }

        let lifetimeEarnings = 0;
        let availableForPayout = 0;

        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        allDeliveredOrders.forEach(order => {
             const orderDate = new Date(order.createdAt.seconds * 1000);
             const vendorItemsValue = order.items
                .filter(item => vendorProductIds.has(item.productId))
                .reduce((acc, item) => acc + item.price * item.quantity, 0);
            
            lifetimeEarnings += vendorItemsValue;

            if (orderDate >= thisMonthStart) {
                availableForPayout += vendorItemsValue;
            }
        });

        return { lifetimeEarnings, availableForPayout };

    }, [vendorProducts, allDeliveredOrders]);
    
    // Payout history is static for now as it requires complex backend logic.
    const payouts = [
        { id: 'PAY-J7D3', date: 'July 15, 2024', amount: 45200.50, status: 'Paid' },
        { id: 'PAY-F4E8', date: 'June 15, 2024', amount: 38750.00, status: 'Paid' },
        { id: 'PAY-A9C1', date: 'May 15, 2024', amount: 51300.75, status: 'Paid' },
        { id: 'PAY-B2A5', date: 'April 15, 2024', amount: 42100.00, status: 'Paid' },
    ];

    const PayoutMethodContent = () => {
        if (loading) {
            return (
                <>
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-32 mt-1" />
                </>
            );
        }
        if (user?.bankName && user?.accountNumber) {
            return (
                <>
                    <div className="font-semibold">{user.bankName}</div>
                    <div className="text-xs text-muted-foreground">**** **** **** {user.accountNumber.slice(-4)}</div>
                </>
            );
        }
        return (
            <>
                <div className="font-semibold text-muted-foreground">Not Configured</div>
                <div className="text-xs text-muted-foreground">Please add your bank details.</div>
            </>
        );
    };

    return (
        <div className="grid gap-6">
            <div className="grid md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available for Payout</CardTitle>
                        <Banknote className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <>
                                <Skeleton className="h-8 w-3/4" />
                                <Skeleton className="h-3 w-1/2 mt-2" />
                            </>
                        ) : (
                            <>
                                <div className="text-2xl font-bold">৳{availableForPayout.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground">Earnings this month</p>
                            </>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Lifetime Earnings</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                         {loading ? (
                             <>
                                <Skeleton className="h-8 w-3/4" />
                                <Skeleton className="h-3 w-1/2 mt-2" />
                             </>
                        ) : (
                            <>
                                <div className="text-2xl font-bold">৳{lifetimeEarnings.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground">Total earnings from all time</p>
                            </>
                        )}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Payout Method</CardTitle>
                        <Landmark className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                       <PayoutMethodContent />
                        <Button variant="link" asChild className="p-0 h-auto mt-1 text-xs">
                           <Link href="/portal/vendor/settings?tab=payouts">Change</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Payout History</CardTitle>
                        <CardDescription>View your past payout records.</CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                        <Download className="h-3.5 w-3.5 mr-2" />
                        Download Reports
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Reference ID</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="w-16"><span className="sr-only">Details</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payouts.map((payout) => (
                                    <TableRow key={payout.id}>
                                        <TableCell className="font-mono">{payout.id}</TableCell>
                                        <TableCell>{payout.date}</TableCell>
                                        <TableCell>
                                            <Badge variant={payout.status === 'Paid' ? 'success' : 'outline'}>{payout.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">৳{payout.amount.toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon">
                                                <ArrowRight className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
