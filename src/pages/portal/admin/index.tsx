'use client';
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
  Users,
  Zap,
  ArrowUp,
  ArrowDown,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { useMemo } from 'react';
import type { Order, User, Product } from '@/data/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from "@/context/authContext";
import Link from "next/link";

const salesChartConfig = {
  sales: {
    label: "Sales",
    color: "hsl(var(--primary))",
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12,
    },
  },
};

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

export default function AdminDashboardPage() {
    const db = useFirestore();
    const { user } = useAuth();

    const ordersQuery = useMemo(() => user ? query(collection(db, 'orders')) : null, [user, db]);
    const { data: orders, loading: ordersLoading } = useCollection<Order>(ordersQuery);

    const usersQuery = useMemo(() => user ? query(collection(db, 'users')) : null, [user, db]);
    const { data: users, loading: usersLoading } = useCollection<User>(usersQuery);

    const flashSaleProductsQuery = useMemo(() => user ? query(collection(db, 'products'), where('flashSale', '!=', null)) : null, [user, db]);
    const { data: flashSaleProducts, loading: flashSalesLoading } = useCollection<Product>(flashSaleProductsQuery);

    const recentOrdersQuery = useMemo(() => user ? query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(5)) : null, [user, db]);
    const { data: recentOrders, loading: recentOrdersLoading } = useCollection<Order>(recentOrdersQuery);

    const { totalRevenue, revenuePercentageChange } = useMemo(() => {
        if (!orders) return { totalRevenue: 0, revenuePercentageChange: 0 };
        const now = new Date();
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const twoMonthsAgoStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);

        let lastMonthRevenue = 0;
        let previousMonthRevenue = 0;

        const totalRevenue = orders.reduce((acc, order) => {
            if (!order.createdAt) return acc;
            const orderDate = new Date(order.createdAt.seconds * 1000);
            if (orderDate >= thisMonthStart) {
                // Current month - not used for percentage change from *last* month
            } else if (orderDate >= lastMonthStart) {
                lastMonthRevenue += order.total;
            } else if (orderDate >= twoMonthsAgoStart) {
                previousMonthRevenue += order.total;
            }
            return acc + order.total;
        }, 0);

        const percentageChange = previousMonthRevenue > 0
            ? ((lastMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
            : lastMonthRevenue > 0 ? 100 : 0;

        return { totalRevenue, revenuePercentageChange: percentageChange };
    }, [orders]);

    const totalOrders = useMemo(() => orders?.length || 0, [orders]);
    const totalUsers = useMemo(() => users?.length || 0, [users]);

    const activeFlashSales = useMemo(() => {
        if (!flashSaleProducts) return 0;
        return flashSaleProducts.filter(p => p.flashSale && new Date(p.flashSale.endTime) > new Date()).length;
    }, [flashSaleProducts]);

    const salesChartData = useMemo(() => {
        if (!orders) return [];
        const salesByMonth: { [key: string]: number } = {};
        const monthLabels: string[] = [];
        
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setMonth(today.getMonth() - i);
            const monthKey = d.toLocaleString('default', { month: 'short', year: '2-digit' });
            monthLabels.push(monthKey);
            salesByMonth[monthKey] = 0;
        }

        orders.forEach(order => {
             if (!order.createdAt) return;
            const date = new Date(order.createdAt.seconds * 1000);
            const monthKey = date.toLocaleString('default', { month: 'short', year: '2-digit' });
            if (monthKey in salesByMonth) {
                salesByMonth[monthKey] += order.total;
            }
        });

        return monthLabels.map(month => ({
            date: month,
            sales: salesByMonth[month] || 0,
        }));
    }, [orders]);
  
  return (
    <div className="flex flex-col gap-6">
      <motion.div 
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
            <KpiCard
                title="Total Revenue"
                icon={DollarSign}
                loading={ordersLoading}
                value={`৳${Math.round(totalRevenue).toLocaleString()}`}
                subtext={
                    revenuePercentageChange >= 0 ? (
                        <span className="flex items-center"><ArrowUp className="h-3 w-3 mr-1 text-success"/> +{revenuePercentageChange.toFixed(1)}% from last month</span>
                    ) : (
                        <span className="flex items-center"><ArrowDown className="h-3 w-3 mr-1 text-destructive"/> {revenuePercentageChange.toFixed(1)}% from last month</span>
                    )
                }
            />
        </motion.div>
        <motion.div variants={itemVariants}>
             <KpiCard
                title="Orders"
                icon={ShoppingCart}
                loading={ordersLoading}
                value={`+${totalOrders.toLocaleString()}`}
                subtext="Total orders processed"
            />
        </motion.div>
        <motion.div variants={itemVariants}>
             <KpiCard
                title="Total Users"
                icon={Users}
                loading={usersLoading}
                value={totalUsers.toLocaleString()}
                subtext="All registered users"
            />
        </motion.div>
         <motion.div variants={itemVariants}>
            <KpiCard
                title="Active Flash Sales"
                icon={Zap}
                loading={flashSalesLoading}
                value={`${activeFlashSales} Active`}
                subtext="Currently running flash sales"
            />
        </motion.div>
      </motion.div>

      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
            className="lg:col-span-2"
            variants={itemVariants}
        >
            <Card className="overflow-hidden h-full">
              <CardHeader>
                <CardTitle>Sales Overview</CardTitle>
                <CardDescription>
                  Your sales performance over the last 7 months.
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                 {ordersLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                 ) : (
                    <ChartContainer config={salesChartConfig} className="h-[300px] w-full">
                        <LineChart
                            accessibilityLayer
                            data={salesChartData}
                            margin={{ left: 12, right: 12, top: 10, bottom: 10 }}
                        >
                            <CartesianGrid vertical={false} />
                            <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            />
                            <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => `৳${Number(value) / 1000}k`}
                            />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                            <Line
                            dataKey="sales"
                            type="monotone"
                            stroke="var(--color-sales)"
                            strokeWidth={2}
                            dot={{
                                fill: "var(--color-sales)",
                                r: 3
                            }}
                            activeDot={{
                                r: 6,
                            }}
                            isAnimationActive={true}
                            animationDuration={1000}
                            />
                        </LineChart>
                    </ChartContainer>
                )}
              </CardContent>
            </Card>
        </motion.div>
        
        <motion.div
            variants={itemVariants}
        >
            <Card>
                <CardHeader>
                    <CardTitle>Recent Orders</CardTitle>
                    <CardDescription>Your 5 most recent orders.</CardDescription>
                </CardHeader>
                <CardContent className="px-0 pt-2">
                  <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead>
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentOrdersLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8 rounded-full ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                recentOrders?.map((order) => (
                                    <TableRow key={order.id} className="hover:bg-muted/50">
                                        <TableCell>
                                            <div className="font-medium">{order.customerInfo.name}</div>
                                            <div className="text-sm text-muted-foreground">{order.shortId || `#${order.id.slice(-6).toUpperCase()}`}</div>
                                        </TableCell>
                                        <TableCell>
                                        <Badge
                                            variant={
                                            order.status === 'Delivered' ? 'success' :
                                            order.status === 'Shipped' ? 'info' :
                                            order.status === 'Processing' ? 'warning' :
                                            order.status === 'Cancelled' ? 'destructive' :
                                            'outline'
                                            }
                                            className="capitalize"
                                        >
                                            {order.status}
                                        </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">৳{order.total.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                            <Button aria-haspopup="true" size="icon" variant="ghost">
                                                <MoreHorizontal className="h-4 w-4" />
                                                <span className="sr-only">Toggle menu</span>
                                            </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem asChild>
                                                <Link href={`/portal/admin/orders/${order.id}`}>View Order</Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>View Customer</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                  </div>
                </CardContent>
            </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
