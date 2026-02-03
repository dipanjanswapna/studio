'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PackageCheck, Package, Truck, CheckCircle, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import Link from 'next/link';
import { useAuth } from '@/context/authContext';
import { useFirestore } from '@/firebase';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { type Order } from '@/data/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
type OrderHistoryItem = { status: OrderStatus; date: string | null };
type TrackedOrderData = { status: OrderStatus; history: OrderHistoryItem[] };


const statusIcons: { [key in OrderStatus]: React.ElementType } = {
  'Pending': Package,
  'Processing': PackageCheck,
  'Shipped': Truck,
  'Delivered': CheckCircle,
  'Cancelled': XCircle,
};

const statusDescriptions: { [key in OrderStatus]: string } = {
    'Pending': 'Your order has been placed and is waiting to be processed.',
    'Processing': 'Your order is being processed and will be shipped soon.',
    'Shipped': 'Your order has been shipped and is on its way to you.',
    'Delivered': 'Your order has been delivered. Thank you for shopping with us!',
    'Cancelled': 'Your order has been cancelled.',
}

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<TrackedOrderData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const db = useFirestore();

  const handleTrackOrder = async () => {
    if (!user) {
        setError('Please log in to track your orders.');
        return;
    }
    setError(null);
    setTrackedOrder(null);
    setIsLoading(true);

    const ordersRef = collection(db, 'orders');
    const q = query(
        ordersRef, 
        where('shortId', '==', orderId.toUpperCase()), 
        where('userId', '==', user.uid), 
        limit(1)
    );

    try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            setError('Order ID not found or does not belong to you.');
        } else {
            const orderDoc = querySnapshot.docs[0].data() as Order;
            const allStatuses: OrderStatus[] = ['Pending', 'Processing', 'Shipped', 'Delivered'];
            
            if (orderDoc.status === 'Cancelled') {
                 setTrackedOrder({
                    status: 'Cancelled',
                    history: [{ status: 'Cancelled', date: new Date(orderDoc.createdAt.seconds * 1000).toLocaleDateString() }]
                });
                setIsLoading(false);
                return;
            }

            const currentStatusIndexInFlow = allStatuses.indexOf(orderDoc.status);

            const history: OrderHistoryItem[] = allStatuses.map((status, index) => {
                const isPastStatus = index <= currentStatusIndexInFlow;
                // A real app would have timestamps for each status change. This is a simplification.
                return {
                    status: status,
                    date: isPastStatus ? new Date(orderDoc.createdAt.seconds * 1000).toLocaleDateString() : null
                };
            });
            
            setTrackedOrder({
                status: orderDoc.status as OrderStatus,
                history: history.reverse()
            });
        }
    } catch (e) {
        console.error(e);
        setError('An error occurred while fetching your order.');
    } finally {
        setIsLoading(false);
    }
  };
  
  if (authLoading) {
    return (
      <div className="container py-8 md:py-12">
        <Skeleton className="h-8 w-1/2 mx-auto" />
        <Card className="mt-8 max-w-2xl mx-auto">
            <CardHeader><Skeleton className="h-10 w-3/4 mx-auto" /></CardHeader>
            <CardContent><Skeleton className="h-12 w-full" /></CardContent>
        </Card>
      </div>
    );
  }

  const currentStatusIndex = trackedOrder && trackedOrder.status !== 'Cancelled' ? trackedOrder.history.findIndex(h => h.date !== null) : -1;
  
  return (
    <div className="container py-8 md:py-12">
        <Breadcrumb className="mb-8">
          <BreadcrumbList>
              <BreadcrumbItem>
                  <BreadcrumbLink asChild><Link href="/">Home</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                  <BreadcrumbPage>Track Order</BreadcrumbPage>
              </BreadcrumbItem>
          </BreadcrumbList>
      </Breadcrumb>
      <div className="max-w-2xl mx-auto">
        {!user ? (
            <Alert>
                <LogIn className="h-4 w-4" />
                <AlertTitle>Please Log In</AlertTitle>
                <AlertDescription>
                    You need to be logged in to track your orders. Please log in or create an account.
                </AlertDescription>
                <div className="mt-4 flex gap-4">
                    <Button asChild><Link href="/auth/login">Login</Link></Button>
                    <Button asChild variant="outline"><Link href="/auth/register">Register</Link></Button>
                </div>
            </Alert>
        ) : (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl md:text-3xl">Track Your Order</CardTitle>
              <CardDescription>
                Enter your order ID below to see its current status.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex w-full items-center space-x-2">
                <Input
                  type="text"
                  placeholder="e.g. #AV-123ABC"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTrackOrder()}
                />
                <Button type="submit" onClick={handleTrackOrder} loading={isLoading}>Track</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <AnimatePresence>
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="mt-6 text-center text-destructive font-medium"
                >
                    {error}
                </motion.div>
            )}
            {trackedOrder && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card className="mt-8">
                        <CardHeader>
                            <CardTitle>Order Status for {orderId.toUpperCase()}</CardTitle>
                            <CardDescription>{statusDescriptions[trackedOrder.status]}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-center relative">
                                {trackedOrder.history.map((item, index) => {
                                    const Icon = statusIcons[item.status as OrderStatus];
                                    const isCompleted = trackedOrder.status === 'Cancelled' ? item.status === 'Cancelled' : index >= currentStatusIndex && currentStatusIndex !== -1;
                                    
                                    return (
                                        <div key={item.status} className="flex flex-col items-center z-10 w-1/4">
                                            <div className={cn(
                                                "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                                                isCompleted ? "bg-primary border-primary text-primary-foreground" : "bg-muted border-border"
                                            )}>
                                                <Icon className="w-5 h-5 md:w-6 md:h-6" />
                                            </div>
                                            <p className="text-xs md:text-sm text-center mt-2 font-medium">{item.status}</p>
                                             <p className="text-xs text-muted-foreground text-center">{isCompleted ? item.date : 'Pending'}</p>
                                        </div>
                                    )
                                })}
                                {trackedOrder.status !== 'Cancelled' && (
                                    <div className="absolute top-5 md:top-6 left-0 w-full h-0.5 bg-border -z-0">
                                        <motion.div 
                                            className="h-full bg-primary" 
                                            initial={{ width: '0%' }}
                                            animate={{ width: `${(3 - Math.max(0, currentStatusIndex)) / 3 * 100}%` }}
                                            transition={{ duration: 0.8, ease: "easeOut" }}
                                        />
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
}
