'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useReviewModal } from '@/context/ReviewContext';
import { useAuth } from '@/context/authContext';
import { useFirestore } from '@/firebase';
import { collection, serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { Input } from '../ui/input';

const reviewSchema = z.object({
  rating: z.number().min(1, 'Please select a rating.'),
  title: z.string().optional(),
  comment: z.string().min(10, 'Please write at least 10 characters.'),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

export function ReviewModal() {
  const { isReviewModalOpen, closeReviewModal, productToReview } = useReviewModal();
  const { user } = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const [hoverRating, setHoverRating] = useState(0);

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      title: '',
      comment: '',
    },
  });

  const onSubmit = async (data: ReviewFormValues) => {
    if (!productToReview || !user) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not submit review. User or product not found.' });
      return;
    }

    const reviewData = {
      userId: user.uid,
      userName: user.name || 'Anonymous',
      productId: productToReview.productId,
      productName: productToReview.productName,
      productImageId: productToReview.productImageId,
      rating: data.rating,
      title: data.title,
      comment: data.comment,
      createdAt: serverTimestamp(),
    };
    
    const batch = writeBatch(db);
    
    // Write to products/{productId}/reviews/{reviewId}
    const productReviewRef = doc(collection(db, 'products', productToReview.productId, 'reviews'));
    batch.set(productReviewRef, reviewData);
    
    // Write to users/{userId}/reviews/{reviewId}
    const userReviewRef = doc(collection(db, 'users', user.uid, 'reviews'), productReviewRef.id);
    batch.set(userReviewRef, reviewData);

    try {
      await batch.commit();
      toast({ title: 'Review Submitted!', description: 'Thank you for your feedback.' });
      form.reset();
      closeReviewModal();
    } catch (e: any) {
        const permissionError = new FirestorePermissionError({
            path: `products/${productToReview.productId}/reviews`,
            operation: 'create',
            requestResourceData: reviewData,
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({ variant: 'destructive', title: 'Submission Failed', description: 'Could not save your review.' });
    }
  };
  
  const handleModalClose = (open: boolean) => {
      if (!open) {
          form.reset();
          closeReviewModal();
      }
  }

  const image = productToReview ? PlaceHolderImages.find(img => img.id === productToReview.productImageId) : null;
  const rating = form.watch('rating');

  return (
    <Dialog open={isReviewModalOpen} onOpenChange={handleModalClose}>
      <DialogContent className="sm:max-w-lg p-0 max-h-[90vh] flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b shrink-0">
          <DialogTitle>Write a Review</DialogTitle>
          <DialogDescription>Share your thoughts on the product you purchased.</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-6">
            {productToReview && (
                <div className="flex items-center gap-4 mb-6">
                     {image && <Image src={image.imageUrl} alt={productToReview.productName} width={80} height={80} className="rounded-md border object-cover" />}
                    <div>
                        <p className="text-sm text-muted-foreground">You are reviewing:</p>
                        <p className="font-semibold">{productToReview.productName}</p>
                    </div>
                </div>
            )}
            <Form {...form}>
              <form id="review-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                 <FormField
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Overall Rating</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={cn(
                                'h-8 w-8 cursor-pointer transition-colors',
                                (hoverRating >= star || rating >= star)
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-muted-foreground/30'
                              )}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                              onClick={() => field.onChange(star)}
                            />
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Review Title (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Excellent Product!" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="comment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Review</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Tell us more about your experience..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
        </div>
        <DialogFooter className="p-6 pt-4 border-t shrink-0">
            <Button type="submit" form="review-form" loading={form.formState.isSubmitting}>Submit Review</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
