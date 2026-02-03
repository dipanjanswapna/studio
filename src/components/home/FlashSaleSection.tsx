'use client';

import { useMemo } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useCountdown } from '@/hooks/use-countdown';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { FlashSaleProductCard } from '../cards/FlashSaleProductCard';
import type { Product } from '@/data/types';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ProductCardSkeleton } from '../cards/ProductCardSkeleton';

function CountdownTimer({ endTime }: { endTime: string }) {
    const { hours, minutes, seconds, isTimeUp } = useCountdown(endTime);
    
    if (isTimeUp) {
        return <span className="text-xl font-bold">Sale has ended!</span>
    }

    return (
        <div className="flex items-center gap-1 sm:gap-2">
            <div className="text-center">
                <span className="text-base sm:text-lg font-bold bg-destructive-foreground/20 p-1.5 sm:p-2 rounded-md tabular-nums">{String(hours).padStart(2, '0')}</span>
                <span className="text-xs mt-1 block">Hrs</span>
            </div>
            <span className="text-base sm:text-lg font-bold">:</span>
            <div className="text-center">
                <span className="text-base sm:text-lg font-bold bg-destructive-foreground/20 p-1.5 sm:p-2 rounded-md tabular-nums">{String(minutes).padStart(2, '0')}</span>
                 <span className="text-xs mt-1 block">Min</span>
            </div>
            <span className="text-base sm:text-lg font-bold">:</span>
            <div className="text-center">
                <span className="text-base sm:text-lg font-bold bg-destructive-foreground/20 p-1.5 sm:p-2 rounded-md tabular-nums">{String(seconds).padStart(2, '0')}</span>
                 <span className="text-xs mt-1 block">Sec</span>
            </div>
        </div>
    );
}


export function FlashSaleSection() {
    const db = useFirestore();
    
    const flashSaleQuery = useMemo(() => {
        // A simple way to check for existence of a field.
        return query(collection(db, 'products'), where('flashSale', '!=', null));
    }, [db]);
    
    const { data: flashSaleProductsData, loading } = useCollection<Product>(flashSaleQuery);
    
    const flashSaleProducts = useMemo(() => {
        if (!flashSaleProductsData) return [];
        return flashSaleProductsData.filter(p => p.flashSale && new Date(p.flashSale.endTime) > new Date());
    }, [flashSaleProductsData]);

    const soonestEndTime = useMemo(() => {
        if (flashSaleProducts.length === 0) return null;
        
        return flashSaleProducts.reduce((soonest: string | null, product) => {
            const endTime = product.flashSale?.endTime;
            if (!endTime) return soonest;
            if (!soonest || new Date(endTime) < new Date(soonest)) {
                return endTime;
            }
            return soonest;
        }, null);
    }, [flashSaleProducts]);

    if (loading) {
         return (
            <section id="flash-sale" className="bg-gradient-to-r from-red-500 to-orange-500 -mx-4 sm:-mx-6 md:-mx-8 lg:-mx-12 px-4 sm:px-6 md:px-8 lg:px-12 text-destructive-foreground shadow-lg overflow-hidden">
                <div className="container p-0 py-8">
                     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {[...Array(5)].map((_, i) => <ProductCardSkeleton key={i} />)}
                    </div>
                </div>
            </section>
        );
    }
    
    if (flashSaleProducts.length === 0) {
        return null;
    }

    return (
        <section id="flash-sale" className="bg-gradient-to-r from-red-500 to-orange-500 -mx-4 sm:-mx-6 md:-mx-8 lg:-mx-12 px-4 sm:px-6 md:px-8 lg:px-12 text-destructive-foreground shadow-lg overflow-hidden">
             <div className="container p-0 py-8">
                <Carousel 
                    opts={{ align: "start", loop: false, dragFree: true }}
                    className="w-full"
                >
                    <motion.div 
                        className="flex flex-row items-center justify-between gap-4 mb-8"
                        initial={{ opacity: 0, y: -20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="flex items-center gap-2 sm:gap-4">
                            <h2 className="text-2xl sm:text-3xl font-bold text-shadow">Flash Sale</h2>
                            <Link href="/shop?onSale=true" className="flex items-center text-xs sm:text-sm font-semibold opacity-90 hover:opacity-100 transition-opacity bg-destructive-foreground/20 px-3 py-1 rounded-full whitespace-nowrap">
                                See All
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Link>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4">
                            <span className="font-semibold hidden sm:inline">Ending in</span>
                            {soonestEndTime && <CountdownTimer endTime={soonestEndTime} />}
                            <div className="hidden sm:flex items-center gap-1">
                                <CarouselPrevious className="relative h-8 w-8 translate-y-0 border-destructive-foreground/50 text-destructive-foreground bg-destructive-foreground/20 hover:bg-destructive-foreground/30" />
                                <CarouselNext className="relative h-8 w-8 translate-y-0 border-destructive-foreground/50 text-destructive-foreground bg-destructive-foreground/20 hover:bg-destructive-foreground/30" />
                            </div>
                        </div>
                    </motion.div>

                    <CarouselContent className="-ml-4">
                        {flashSaleProducts.map((product) => (
                            <CarouselItem key={product.id} className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 pl-4">
                                <FlashSaleProductCard product={product as Product & { flashSale: NonNullable<Product['flashSale']> }} />
                            </CarouselItem>
                        ))}
                        <CarouselItem className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 pl-4">
                            <Link href="/shop?onSale=true" className="group block h-full">
                                <Card className="h-full flex flex-col items-center justify-center bg-destructive-foreground/10 hover:bg-destructive-foreground/20 transition-colors text-destructive-foreground">
                                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                        <div className="bg-destructive-foreground/20 text-destructive-foreground rounded-full p-3 mb-4 group-hover:bg-destructive-foreground/30 transition-colors">
                                        <ArrowRight className="h-6 w-6" />
                                        </div>
                                        <h3 className="font-semibold">See More</h3>
                                        <p className="text-sm opacity-80 mt-1">View all flash deals</p>
                                    </CardContent>
                                </Card>
                            </Link>
                        </CarouselItem>
                    </CarouselContent>
                </Carousel>
             </div>
        </section>
    );
}
