'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListOrdered, Package, Truck, XCircle, Hourglass } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { Order } from '@/data/types';
import { Separator } from '@/components/ui/separator';
import { useMemo } from 'react';
import { useAuth } from '@/context/authContext';
import { useReviewModal } from '@/context/ReviewContext';
import { Skeleton } from '@/components/ui/skeleton';

const getStatusInfo = (status: string) => {
    switch (status) {
        case 'Delivered':
            return { icon: Package, color: 'success' as const };
        case 'Shipped':
            return { icon: Truck, color: 'info' as const };
        case 'Cancelled':
            return { icon: XCircle, color: 'destructive' as const };
         case 'Processing':
            return { icon: Hourglass, color: 'warning' as const };
        default: // Pending
            return { icon: ListOrdered, color: 'outline' as const };
    }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: {type: 'spring', stiffness: 100} },
};

export default function OrdersPage() {
    const { user } = useAuth();
    const db = useFirestore();
    const { openReviewModal } = useReviewModal();

    const ordersQuery = useMemo(() => {
        if (!user) return null;
        return query(collection(db, 'orders'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    }, [user, db]);

    const { data: orders, loading } = useCollection<Order>(ordersQuery);

    const handleReviewClick = (item: Order['items'][0]) => {
        openReviewModal({
            productId: item.productId,
            productName: item.productName,
            productImageId: item.productImageId || '',
        });
    };

  return (
    <motion.div variants={itemVariants}>
      <Card>
          <CardHeader>
              <CardTitle>My Orders</CardTitle>
              <CardDescription>View your order history and track current orders.</CardDescription>
          </CardHeader>
          <CardContent>
              {loading ? (
                <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
              ) : !orders || orders.length === 0 ? (
                  <div className="min-h-[300px] flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-lg bg-secondary/50">
                      <ListOrdered className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <div className="mt-4">
                          <h2 className="text-xl font-semibold">No Orders Yet</h2>
                          <p className="mt-1 text-muted-foreground">
                              You haven't placed any orders. Let's change that!
                          </p>
                          <Button asChild className="mt-6">
                              <Link href="/shop">Start Shopping</Link>
                          </Button>
                      </div>
                  </div>
              ) : (
                  <Accordion type="multiple" className="space-y-4">
                      {orders.map((order) => {
                            const statusInfo = getStatusInfo(order.status);
                            const StatusIcon = statusInfo.icon;
                          return (
                          <AccordionItem value={order.id} key={order.id} className="border-none">
                              <Card className="overflow-hidden">
                                  <AccordionTrigger className="p-4 hover:no-underline hover:bg-accent/50 [&[data-state=open]]:border-b">
                                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-left w-full">
                                          <div className="flex items-center gap-4">
                                              <StatusIcon className="w-6 h-6 text-muted-foreground" />
                                              <div>
                                                  <p className="font-bold text-base">{order.shortId || `#${order.id.slice(-6).toUpperCase()}`}</p>
                                                  <p className="text-sm text-muted-foreground">Ordered on: {new Date(order.createdAt.seconds * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                              </div>
                                          </div>
                                          <div className="sm:ml-auto flex items-center gap-6">
                                            <Badge variant={statusInfo.color}>{order.status}</Badge>
                                            <p className="font-bold text-lg">৳{order.total.toFixed(2)}</p>
                                          </div>
                                      </div>
                                  </AccordionTrigger>
                                  <AccordionContent className="p-4">
                                      <h4 className="font-semibold mb-4">Items in this order:</h4>
                                      <div className="space-y-4">
                                          {order.items.map(item => (
                                              <div key={item.variantId}>
                                                  <div className="flex items-start gap-4">
                                                      {item.imageUrl && <Image src={item.imageUrl} alt={item.productName} width={64} height={64} className="rounded-md border object-cover" />}
                                                      <div className="flex-grow">
                                                          <p className="font-medium">{item.productName}</p>
                                                          <p className="text-sm text-muted-foreground">{item.variantName}</p>
                                                          <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                                      </div>
                                                      <div className="text-right">
                                                          <p className="font-semibold">৳{(item.price * item.quantity).toFixed(2)}</p>
                                                          {order.status === 'Delivered' && (
                                                              <Button variant="link" size="sm" className="p-0 h-auto mt-2" onClick={() => handleReviewClick(item)}>Write a review</Button>
                                                          )}
                                                      </div>
                                                  </div>
                                              </div>
                                          ))}
                                          <Separator />
                                           <div className="flex justify-end gap-3">
                                                <Button variant="outline">View Invoice</Button>
                                                <Button>Track Order</Button>
                                           </div>
                                      </div>
                                  </AccordionContent>
                              </Card>
                          </AccordionItem>
                      )})}
                  </Accordion>
              )}
          </CardContent>
      </Card>
    </motion.div>
  );
}
