'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useReview } from '@/context/ReviewContext';
import { useAuth } from '@/context/authContext';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Star } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Textarea } from '../ui/textarea';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const reviewSchema = z.object({
  rating: z.number().min(1, 'Please select a rating.'),
  title: z.string().optional(),
  comment: z.string().optional(),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

export function ReviewModal() {
  const { isModalOpen, closeReviewModal, productToReview } = useReview();
  const { user } = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const [hoverRating, setHoverRating] = useState(0);

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, title: '', comment: '' },
  });
  
  const ratingValue = form.watch('rating');

  const onSubmit = async (data: ReviewFormValues) => {
    if (!productToReview || !user) return;

    try {
        const reviewData = {
            ...data,
            userId: user.uid,
            userName: user.name || 'Anonymous',
            productId: productToReview.productId,
            orderId: productToReview.orderId,
            productName: productToReview.productName,
            productImageId: productToReview.productImageId || '',
            createdAt: serverTimestamp(),
        };
        const reviewsRef = collection(db, `users/${user.uid}/reviews`);
        await addDoc(reviewsRef, reviewData);
        
        toast({
            title: 'Review Submitted!',
            description: 'Thank you for your feedback.',
        });
        form.reset();
        closeReviewModal();
    } catch (e: any) {
        const permissionError = new FirestorePermissionError({
            path: `users/${user.uid}/reviews`,
            operation: 'create',
            requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({ variant: 'destructive', title: 'Submission Failed' });
    }
  };
  
  const image = productToReview ? PlaceHolderImages.find(i => i.id === productToReview.productImageId) : null;

  return (
    <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeReviewModal()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Write a Review</DialogTitle>
          {productToReview && (
              <DialogDescription className="flex items-center gap-4 pt-2">
                 {image && <Image src={image.imageUrl} alt={productToReview.productName} width={48} height={48} className="rounded-md border"/>}
                 <span>You are reviewing: <strong>{productToReview.productName}</strong></span>
              </DialogDescription>
          )}
        </DialogHeader>
        <Form {...form}>
          <form id="review-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
             <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Rating</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          className="h-8 w-8 cursor-pointer"
                          fill={(hoverRating || ratingValue) >= star ? '#FBBF24' : 'none'}
                          stroke={(hoverRating || ratingValue) >= star ? '#FBBF24' : 'currentColor'}
                          onClick={() => form.setValue('rating', star, { shouldValidate: true })}
                          onMouseEnter={() => setHoverRating(star)}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>Review Title</FormLabel><FormControl><Input placeholder="e.g., Great product!" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="comment" render={({ field }) => (
                <FormItem><FormLabel>Your Review</FormLabel><FormControl><Textarea placeholder="Share your thoughts..." {...field} rows={5} /></FormControl><FormMessage /></FormItem>
            )} />
          </form>
        </Form>
        <DialogFooter>
            <Button type="button" variant="outline" onClick={closeReviewModal}>Cancel</Button>
            <Button type="submit" form="review-form" loading={form.formState.isSubmitting}>Submit Review</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
