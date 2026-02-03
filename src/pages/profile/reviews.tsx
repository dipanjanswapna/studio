'use client';
import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Review } from '@/data/types';
import { useAuth } from '@/context/authContext';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: {type: 'spring', stiffness: 100} },
};

export default function MyReviewsPage() {
    const { user } = useAuth();
    const db = useFirestore();

    const reviewsQuery = useMemo(() => {
        if (!user) return null;
        return query(collection(db, 'users', user.uid, 'reviews'), orderBy('createdAt', 'desc'));
    }, [user, db]);

    const { data: reviews, loading } = useCollection<Review>(reviewsQuery);

  return (
    <motion.div variants={itemVariants}>
      <Card>
          <CardHeader>
              <CardTitle>My Reviews</CardTitle>
              <CardDescription>Here are all the reviews you have submitted.</CardDescription>
          </CardHeader>
          <CardContent>
              {loading ? (
                <div className="space-y-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
              ) : !reviews || reviews.length === 0 ? (
                  <div className="min-h-[300px] flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-lg bg-secondary/50">
                      <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <div className="mt-4">
                          <h2 className="text-xl font-semibold">No Reviews Yet</h2>
                          <p className="mt-1 text-muted-foreground">
                              You haven't written any reviews. Share your thoughts on purchased products!
                          </p>
                          <Button asChild className="mt-6">
                              <Link href="/profile/orders">Review Products</Link>
                          </Button>
                      </div>
                  </div>
              ) : (
                  <div className="space-y-6">
                      {reviews.map((review) => {
                           const image = PlaceHolderImages.find(i => i.id === review.productImageId);
                          return (
                          <Card key={review.id} className="overflow-hidden">
                            <div className="p-4 flex flex-col sm:flex-row gap-4">
                                {image && (
                                    <div className="shrink-0">
                                        <Image src={image.imageUrl} alt={review.productName} width={100} height={100} className="rounded-lg border object-cover"/>
                                    </div>
                                )}
                                <div className="flex-grow">
                                    <div className="flex items-center gap-2">
                                        {[...Array(5)].map((_, i) => (
                                          <Star
                                            key={i}
                                            className="w-5 h-5"
                                            fill={i < review.rating ? '#FBBF24' : 'none'}
                                            stroke={i < review.rating ? '#FBBF24' : 'currentColor'}
                                          />
                                        ))}
                                    </div>
                                    <h3 className="font-semibold text-lg mt-1">{review.title || review.productName}</h3>
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{review.comment}</p>
                                </div>
                            </div>
                            <div className="bg-muted/50 px-4 py-2 text-xs text-muted-foreground flex justify-between items-center">
                                 <span>Reviewed on: {new Date(review.createdAt.seconds * 1000).toLocaleDateString()}</span>
                                 <Link href={`/product/${review.productId}`} className="font-semibold text-primary hover:underline">
                                    View Product
                                 </Link>
                            </div>
                          </Card>
                      )})}
                  </div>
              )}
          </CardContent>
      </Card>
    </motion.div>
  );
}
