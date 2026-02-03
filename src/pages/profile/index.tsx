'use client';
import { useAuth } from '@/context/authContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ListOrdered, Heart, Star, Undo2, Truck, Package, Hourglass, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import PersonalizedRecommendations from '@/components/features/PersonalizedRecommendations';
import { useMemo } from 'react';
import { MembershipCard } from '@/components/cards/MembershipCard';
import { useWishlist } from '@/hooks/useWishlist';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, collectionGroup, orderBy, limit } from 'firebase/firestore';
import type { Order, ReturnRequest, Review } from '@/data/types';
import { Skeleton } from '@/components/ui/skeleton';

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
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
};

const getOrderStatusProgress = (status: Order['status']) => {
    switch (status) {
      case 'Pending': return 10;
      case 'Processing': return 40;
      case 'Shipped': return 70;
      case 'Delivered': return 100;
      case 'Cancelled': return 0;
      default: return 0;
    }
};

const getOrderStatusDescription = (status: Order['status']) => {
    switch (status) {
        case 'Pending': return 'Your order is awaiting processing.';
        case 'Processing': return 'Your order is being prepared for shipment.';
        case 'Shipped': return 'Your order is on its way to you.';
        case 'Delivered': return 'Your order has been delivered.';
        case 'Cancelled': return 'This order has been cancelled.';
        default: return 'Track your order for more details.';
    }
};

const getOrderStatusIcon = (status: Order['status']) => {
    switch (status) {
        case 'Pending': return Hourglass;
        case 'Processing': return Package;
        case 'Shipped': return Truck;
        case 'Delivered': return CheckCircle;
        case 'Cancelled': return XCircle;
        default: return Truck;
    }
};


export default function ProfileDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { wishlistItemCount } = useWishlist();
  const db = useFirestore();

  const ordersQuery = useMemo(() => {
    if (authLoading || !user) return null;
    return query(collection(db, 'orders'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
  }, [user, db, authLoading]);
  const { data: orders, loading: ordersLoading } = useCollection<Order>(ordersQuery);

  const returnsQuery = useMemo(() => {
    if(authLoading || !user) return null;
    return query(
        collection(db, 'users', user.uid, 'returns'), 
        where('status', 'in', ['Pending Approval', 'Approved', 'Shipped by you', 'Received'])
    );
  }, [user, db, authLoading]);
  const { data: pendingReturnsData, loading: returnsLoading } = useCollection<ReturnRequest>(returnsQuery);

  const reviewsQuery = useMemo(() => {
    if (authLoading || !user) return null;
    return query(collectionGroup(db, 'reviews'), where('userId', '==', user.uid));
  }, [user, db, authLoading]);
  const { data: reviewsData, loading: reviewsLoading } = useCollection<Review>(reviewsQuery);

  const totalOrders = orders?.length || 0;
  const pendingReturns = pendingReturnsData?.length || 0;
  const submittedReviews = reviewsData?.length || 0;
  const mostRecentOrder = useMemo(() => orders && orders.length > 0 ? orders[0] : null, [orders]);


  if (authLoading || !user) {
    return (
      <div className="space-y-8">
         <Skeleton className="h-10 w-1/2" />
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
         </div>
      </div>
    ); 
  }

  const StatusIcon = mostRecentOrder ? getOrderStatusIcon(mostRecentOrder.status) : Truck;

  return (
    <div className="space-y-8">
      <motion.div variants={itemVariants}>
          <h1 className="text-2xl sm:text-3xl font-bold">Welcome, {user.name || user.email}!</h1>
          <p className="text-muted-foreground">Here's your account at a glance.</p>
      </motion.div>

      {/* Summary Cards */}
      <motion.div 
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
          <motion.div variants={itemVariants}>
            <Link href="/profile/orders">
                <Card className="hover:bg-accent transition-colors h-full">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                        <ListOrdered className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {ordersLoading ? <Skeleton className="h-7 w-1/2" /> : <div className="text-2xl font-bold">{totalOrders}</div>}
                    </CardContent>
                </Card>
            </Link>
          </motion.div>
           <motion.div variants={itemVariants}>
             <Link href="/profile/wishlist">
                <Card className="hover:bg-accent transition-colors h-full">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Wishlist</CardTitle>
                        <Heart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{wishlistItemCount}</div>
                    </CardContent>
                </Card>
             </Link>
          </motion.div>
           <motion.div variants={itemVariants}>
              <Link href="/profile/returns">
                  <Card className="hover:bg-accent transition-colors h-full">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-sm font-medium">Pending Returns</CardTitle>
                          <Undo2 className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                          {returnsLoading ? <Skeleton className="h-7 w-1/2" /> : <div className="text-2xl font-bold">{pendingReturns}</div>}
                      </CardContent>
                  </Card>
              </Link>
          </motion.div>
           <motion.div variants={itemVariants}>
              <Link href="/profile/reviews">
                  <Card className="hover:bg-accent transition-colors h-full">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-sm font-medium">Reviews</CardTitle>
                          <Star className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                          {reviewsLoading ? <Skeleton className="h-7 w-1/2" /> : <div className="text-2xl font-bold">{submittedReviews}</div>}
                      </CardContent>
                  </Card>
              </Link>
          </motion.div>
      </motion.div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left/Main Column */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>Current Order</CardTitle>
                <CardDescription>Your most recent order's status.</CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                    <Skeleton className="h-24 w-full" />
                ) : mostRecentOrder ? (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="bg-primary/10 text-primary p-3 rounded-full">
                            <StatusIcon className="w-8 h-8" />
                        </div>
                        <div className="flex-grow">
                            <h3 className="font-semibold">Order {mostRecentOrder.shortId} is {mostRecentOrder.status}</h3>
                            <p className="text-sm text-muted-foreground">{getOrderStatusDescription(mostRecentOrder.status)}</p>
                            {mostRecentOrder.status !== 'Cancelled' && (
                              <div className="flex items-center gap-2 mt-2">
                                  <Progress value={getOrderStatusProgress(mostRecentOrder.status)} className="w-full h-2" />
                                  <span className="text-xs font-medium text-muted-foreground">{getOrderStatusProgress(mostRecentOrder.status)}%</span>
                              </div>
                            )}
                        </div>
                        <Button asChild variant="outline" className="shrink-0">
                            <Link href={`/profile/orders`}>View Order</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground">You have no recent orders.</p>
                        <Button asChild className="mt-4"><Link href="/shop">Start Shopping</Link></Button>
                    </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                  <CardTitle>Just For You</CardTitle>
                  <CardDescription>AI-powered recommendations based on your activity.</CardDescription>
              </CardHeader>
              <CardContent>
                  <PersonalizedRecommendations />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          <motion.div variants={itemVariants}>
             {user.membershipId && user.membershipTier && (
               <MembershipCard
                  name={user.name || "Averzo Member"}
                  tier={user.membershipTier}
                  memberId={user.membershipId}
               />
             )}
          </motion.div>
          {user.role === 'B2B_CUSTOMER' && (
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Company Information</CardTitle>
                  <CardDescription>Your registered business details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Company Name</p>
                    <p className="font-semibold">{user.companyName || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">VAT Number</p>
                    <p className="font-semibold">{user.vatNumber || 'Not set'}</p>
                  </div>
                </CardContent>
                 <CardFooter>
                    <Button variant="outline" asChild size="sm">
                        <Link href="/profile/settings">Edit Company Details</Link>
                    </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
