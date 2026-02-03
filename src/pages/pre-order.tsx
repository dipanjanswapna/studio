'use client';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import Link from 'next/link';
import { CompactProductCard } from '@/components/cards/CompactProductCard';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, PackageSearch } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Product } from '@/data/types';
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

export default function PreOrderPage() {
  const db = useFirestore();
  const preOrderQuery = query(collection(db, 'products'), where('preOrder', '==', true));
  const { data: preOrderProducts, loading } = useCollection<Product>(preOrderQuery);

  return (
    <div className="container py-8 md:py-12">
      <Breadcrumb className="mb-8">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/shop">Shop</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Pre-Order</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-3xl">Pre-Order Upcoming Products</CardTitle>
          <CardDescription>
            Be the first to get your hands on our latest and greatest products.
          </CardDescription>
        </CardHeader>
      </Card>
      
      <Alert className="mb-8 bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-700/50 dark:text-blue-300">
        <Info className="h-4 w-4 !text-blue-600 dark:!text-blue-400" />
        <AlertTitle className="font-semibold">How Pre-Orders Work</AlertTitle>
        <AlertDescription>
          Pre-ordering guarantees you'll receive the product as soon as it's available. Payment will be processed upon shipping. Estimated delivery dates are mentioned on the product page.
        </AlertDescription>
      </Alert>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
                 <ProductCardSkeleton key={i} />
            ))}
        </div>
      ) : preOrderProducts && preOrderProducts.length > 0 ? (
        <motion.div 
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {preOrderProducts.map(product => (
                <motion.div key={product.id} variants={itemVariants}>
                    <CompactProductCard product={product} />
                </motion.div>
            ))}
        </motion.div>
        ) : (
            <div className="text-center py-16 bg-muted rounded-xl">
                <PackageSearch className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h2 className="text-2xl font-bold mt-4">No Pre-Order Products Available</h2>
                <p className="text-muted-foreground mt-2">Please check back later for upcoming products.</p>
            </div>
        )}
    </div>
  );
}
