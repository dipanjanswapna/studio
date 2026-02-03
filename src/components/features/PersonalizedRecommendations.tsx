'use client';

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import type { Product, Order } from "@/data/types";
import { CompactProductCard } from "../cards/CompactProductCard";
import { useToast } from "@/hooks/use-toast";
import { ProductCardSkeleton } from "../cards/ProductCardSkeleton";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Wand2 } from "lucide-react";
import { useFirestore } from "@/firebase";
import { collection, query, where, getDocs, documentId } from "firebase/firestore";
import { useAuth } from "@/context/authContext";

export default function PersonalizedRecommendations() {
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useAuth();

  const handleGetRecommendations = () => {
    if (typeof window !== 'undefined' && !navigator.onLine) {
        toast({
            variant: "destructive",
            title: "You are offline",
            description: "Please check your internet connection to get recommendations.",
        });
        return;
    }

    if (!user) {
        toast({
            variant: "destructive",
            title: "Please log in",
            description: "You need to be logged in to get personalized recommendations.",
        });
        return;
    }

    startTransition(async () => {
      try {
        // Fetch user's orders to build purchase history
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, where('userId', '==', user.uid), where('status', '==', 'Delivered'));
        const querySnapshot = await getDocs(q);
        
        const userOrders: Order[] = [];
        querySnapshot.forEach(doc => {
            userOrders.push({ id: doc.id, ...doc.data() } as Order);
        });

        // Extract product IDs from orders
        const purchaseHistory = Array.from(new Set(userOrders.flatMap(order => order.items.map(item => item.productId))));

        if (purchaseHistory.length === 0) {
             toast({
                title: "No purchase history found",
                description: "We'll base recommendations on some popular items for now.",
            });
        }

        // Browsing history is complex to track and is kept static for this example.
        // In a real app, this would come from a tracking service.
        const browsingHistory = ["p2", "p4", "p5", "p7"];
        
        const response = await fetch('/api/flows/recommendations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                purchaseHistory: purchaseHistory.length > 0 ? purchaseHistory : ['p1', 'p3'], // Fallback if no history
                browsingHistory,
                numberOfRecommendations: 5,
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Could not get recommendations.');
        }

        if (!result.productRecommendations || result.productRecommendations.length === 0) {
           toast({
            variant: "destructive",
            title: "Could not get recommendations",
            description: "The AI couldn't find any products for you. Try browsing some more!",
          });
           setRecommendations([]);
           return;
        }

        const productsRef = collection(db, 'products');
        const productsQuery = query(productsRef, where(documentId(), 'in', result.productRecommendations));
        const productsSnapshot = await getDocs(productsQuery);
        
        const recommendedProducts: Product[] = [];
        productsSnapshot.forEach((doc) => {
            recommendedProducts.push({ id: doc.id, ...doc.data() } as Product);
        });

        setRecommendations(recommendedProducts);
        
        if (recommendedProducts.length > 0) {
          toast({
            title: "Here are your recommendations!",
            description: "We've tailored these products just for you.",
          });
        }
      } catch (e: any) {
        console.error(e);
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: e.message || "There was a problem with your request.",
        });
      }
    });
  };
  
  const gridContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.07,
      },
    },
  };

  const gridItemVariants = {
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

  const renderInitialState = () => {
    if (!user) {
        return (
            <div className="p-8 md:p-12 text-center md:text-left">
                <Wand2 className="h-10 w-10 text-primary bg-primary/10 p-2 rounded-lg mb-4 mx-auto md:mx-0" />
                <h3 className="text-2xl font-bold mb-2">Unlock Your Personal Store</h3>
                <p className="text-muted-foreground mb-6">
                    Log in to get personalized recommendations based on your shopping activity.
                </p>
                <Button asChild size="lg">
                  <Link href="/auth/login">Log In to Get Recommendations</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="p-8 md:p-12 text-center md:text-left">
            <Wand2 className="h-10 w-10 text-primary bg-primary/10 p-2 rounded-lg mb-4 mx-auto md:mx-0" />
            <h3 className="text-2xl font-bold mb-2">Unlock Your Personal Store</h3>
            <p className="text-muted-foreground mb-6">
                Click the button to let our AI find products that perfectly match your style and interests based on your recent activity.
            </p>
            <Button
              size="lg"
              onClick={handleGetRecommendations}
              loading={isPending}
            >
              Get My Recommendations
            </Button>
        </div>
    )
  }


  return (
    <div>
      {recommendations.length === 0 && !isPending ? (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
        >
            <Card className="overflow-hidden">
                 <div className="grid grid-cols-1 md:grid-cols-2 items-center">
                    {renderInitialState()}
                    <div className="relative h-64 md:h-full w-full min-h-[250px] hidden md:block">
                        <Image
                            src="https://images.unsplash.com/photo-1677442135703-1787eea5ce01?q=80&w=1932&auto=format&fit=crop"
                            alt="AI Recommendations"
                            fill
                            className="object-cover"
                            data-ai-hint="AI personalization"
                        />
                         <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-card via-card/50 to-transparent"></div>
                    </div>
                 </div>
            </Card>
        </motion.div>
      ) : (
        <motion.div 
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 text-left"
            variants={gridContainerVariants}
            initial="hidden"
            animate="visible"
          >
            {isPending ? (
              [...Array(5)].map((_, i) => (
                <motion.div key={`rec-skeleton-${i}`} variants={gridItemVariants}>
                  <ProductCardSkeleton />
                </motion.div>
              ))
            ) : (
              recommendations.map((product) => (
                <motion.div key={product.id} variants={gridItemVariants}>
                  <CompactProductCard product={product} />
                </motion.div>
              ))
            )}
        </motion.div>
      )}
    </div>
  );
}
