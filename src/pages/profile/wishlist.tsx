'use client';
import { useWishlist } from '@/hooks/useWishlist';
import { CompactProductCard } from '@/components/cards/CompactProductCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ProductCardSkeleton } from '@/components/cards/ProductCardSkeleton';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
    },
  },
};

export default function WishlistPage() {
  const { wishlistItems, loading } = useWishlist();

  return (
    <motion.div initial="hidden" animate="visible" variants={itemVariants}>
        <Card>
            <CardHeader>
                <CardTitle>My Wishlist</CardTitle>
                <CardDescription>Products you've saved for later.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                   <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <ProductCardSkeleton key={i} />
                        ))}
                    </div>
                ) : wishlistItems.length === 0 ? (
                    <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-lg bg-secondary/50">
                        <Heart className="mx-auto h-12 w-12 text-muted-foreground/50" />
                        <h2 className="mt-4 text-xl font-semibold">Your wishlist is empty</h2>
                        <p className="mt-1 text-muted-foreground">
                            Add items you love to your wishlist to keep track of them.
                        </p>
                        <Button asChild className="mt-6">
                            <Link href="/shop">Start Shopping</Link>
                        </Button>
                    </div>
                ) : (
                    <motion.div 
                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {wishlistItems.map(product => (
                            <motion.div key={product.id} variants={itemVariants}>
                                <CompactProductCard product={product} />
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </CardContent>
        </Card>
    </motion.div>
  );
}
