'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/data/placeholder-images';
import { ArrowRight } from 'lucide-react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { Brand } from '@/data/types';
import { Skeleton } from '../ui/skeleton';
import { useMemo } from 'react';

export function ShopByBrand() {
    const db = useFirestore();
    const brandsQuery = useMemo(() => 
        query(collection(db, 'brands'), where('isFeatured', '==', true), orderBy('order', 'asc'))
    , [db]);

    const { data: brands, loading } = useCollection<Brand>(brandsQuery);

    return (
        <div className="relative">
            <div className="absolute left-1/2 -translate-x-1/2 -top-[1.35rem] z-10">
                <div className="bg-destructive text-destructive-foreground rounded-full px-6 py-2 shadow-lg">
                    <h2 className="text-base font-bold tracking-tight whitespace-nowrap">SHOP BY BRANDS</h2>
                </div>
            </div>
            <Card className="p-6 md:p-8 pt-12 border-4 border-destructive shadow-lg bg-muted/20">
                {loading ? (
                    <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-4 items-center">
                        {[...Array(16)].map((_, i) => (
                             <Card key={i} className="p-3 flex items-center justify-center aspect-square bg-background">
                                <Skeleton className="w-full h-full" />
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-4 items-center">
                        {brands?.map(brand => {
                            const logo = PlaceHolderImages.find(img => img.id === brand.logoImageId);
                            if (!logo) return null;
                            return (
                                <Link href={`/shop?brands=${brand.name}`} key={brand.id} className="group">
                                    <Card className="p-3 flex items-center justify-center aspect-square transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-background hover:bg-white border-2 border-transparent hover:border-primary/20">
                                        <div className="relative w-full h-full">
                                            <Image
                                                src={logo.imageUrl}
                                                alt={brand.name}
                                                fill
                                                sizes="(max-width: 640px) 25vw, 12.5vw"
                                                className="object-contain group-hover:scale-105 transition-transform"
                                                data-ai-hint={logo.imageHint}
                                            />
                                        </div>
                                    </Card>
                                </Link>
                            )
                        })}
                    </div>
                )}
                 <div className="mt-8 flex justify-center">
                    <Button asChild variant="outline" className="rounded-full shadow-sm hover:shadow-md hover:bg-accent">
                        <Link href="/shop/brands">
                            See all brands
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </Card>
        </div>
    );
}
