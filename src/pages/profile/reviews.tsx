'use client';
import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, MoreVertical } from 'lucide-react';
import { ProfileLayout } from '@/components/layouts/ProfileLayout';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useAuth } from '@/context/authContext';
import { useCollection, useFirestore } from '@/firebase';
import { collectionGroup, query, where, orderBy } from 'firebase/firestore';
import type { Review } from '@/data/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: {type: 'spring', stiffness: 100} },
};

export default function ReviewsPage() {
    const { user, loading: authLoading } = useAuth();
    const db = useFirestore();

    const reviewsQuery = useMemo(() => {
        if (authLoading || !user) return null;
        return query(
            collectionGroup(db, 'reviews'), 
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );
    }, [user, db, authLoading]);

    const { data: reviews, loading: reviewsLoading } = useCollection<Review>(reviewsQuery);
    
    const loading = authLoading || reviewsLoading;

  return (
      <ProfileLayout>
        <motion.div variants={itemVariants}>
          <Card>
              <CardHeader>
                  <CardTitle>My Reviews</CardTitle>
                  <CardDescription>View and manage all the reviews you have submitted.</CardDescription>
              </CardHeader>
              <CardContent>
                  {loading ? (
                    <div className="space-y-6">
                        <Card className="overflow-hidden">
                            <div className="p-4 flex flex-col sm:flex-row gap-4">
                                <Skeleton className="h-24 w-24 rounded-md hidden sm:block" />
                                <div className="flex-grow space-y-3">
                                    <div className="flex justify-between">
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-64" />
                                            <Skeleton className="h-6 w-24" />
                                        </div>
                                        <Skeleton className="h-8 w-8" />
                                    </div>
                                    <Separator />
                                     <Skeleton className="h-4 w-48" />
                                     <Skeleton className="h-12 w-full" />
                                </div>
                            </div>
                            <div className="bg-muted/50 px-4 py-2 text-right">
                                <Skeleton className="h-4 w-32 ml-auto" />
                            </div>
                        </Card>
                    </div>
                  ) : !reviews || reviews.length === 0 ? (
                      <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-lg bg-secondary/50">
                          <Star className="mx-auto h-12 w-12 text-muted-foreground/50" />
                          <div className="mt-4">
                              <h2 className="text-xl font-semibold">No Reviews Yet</h2>
                              <p className="mt-1 text-muted-foreground">
                                  Share your thoughts on your purchases to help others.
                              </p>
                              <Button asChild className="mt-6">
                                  <Link href="/profile/orders">Review Your Products</Link>
                              </Button>
                          </div>
                      </div>
                  ) : (
                      <div className="space-y-6">
                          {reviews.map((review) => {
                                const image = PlaceHolderImages.find((img) => img.id === review.productImageId);
                              return (
                              <Card key={review.id} className="overflow-hidden">
                                <div className="p-4 flex flex-col sm:flex-row gap-4">
                                     {image && <Image src={image.imageUrl} alt={review.productName} width={100} height={100} className="rounded-md border object-cover hidden sm:block" />}
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                 {image && <Image src={image.imageUrl} alt={review.productName} width={64} height={64} className="rounded-md border object-cover float-left mr-4 sm:hidden" />}
                                                <p className="text-sm text-muted-foreground">Review for <Link href={`/product/${review.productId}`} className="text-primary font-medium hover:underline">{review.productName}</Link></p>
                                                <div className="flex items-center gap-1 mt-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} className={cn('w-5 h-5', i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30')} />
                                                    ))}
                                                </div>
                                            </div>
                                             <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-2 shrink-0">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem>Edit Review</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive focus:text-destructive">Delete Review</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <Separator className="my-3" />
                                        {review.title && <h4 className="font-semibold">{review.title}</h4>}
                                        <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>
                                    </div>
                                </div>
                                <div className="bg-muted/50 px-4 py-2 text-xs text-muted-foreground text-right">
                                    Posted on {new Date(review.createdAt.seconds * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </div>
                              </Card>
                          )})}
                      </div>
                  )}
              </CardContent>
          </Card>
        </motion.div>
    </ProfileLayout>
  );
}
