'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { PlaceHolderImages } from '@/data/placeholder-images';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Brand } from '@/data/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';


export default function AllBrandsPage() {
    const db = useFirestore();
    const brandsQuery = useMemo(() => 
        query(collection(db, 'brands'), orderBy('order', 'asc'))
    , [db]);
    const { data: brands, loading } = useCollection<Brand>(brandsQuery);

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
                        <BreadcrumbPage>All Brands</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            
            <Card className="p-6 md:p-8">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold">All Brands</h1>
                    {!loading && <p className="text-muted-foreground">{brands?.length || 0} brands available</p>}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 items-center">
                    {loading ? (
                         [...Array(16)].map((_, i) => (
                             <Card key={i} className="p-4 flex items-center justify-center aspect-square bg-background">
                                <Skeleton className="w-full h-full" />
                            </Card>
                        ))
                    ) : (
                        brands?.map(brand => {
                            const logo = PlaceHolderImages.find(img => img.id === brand.logoImageId);
                            if (!logo) return null;
                            return (
                                <Link href={`/shop?brands=${brand.name}`} key={brand.id} className="group">
                                    <Card className="p-4 flex items-center justify-center aspect-square transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-background hover:bg-white border-2 border-transparent hover:border-primary/20">
                                        <div className="relative w-full h-full">
                                            <Image
                                                src={logo.imageUrl}
                                                alt={brand.name}
                                                fill
                                                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 16vw, 12.5vw"
                                                className="object-contain group-hover:scale-105 transition-transform"
                                                data-ai-hint={logo.imageHint}
                                            />
                                        </div>
                                    </Card>
                                </Link>
                            )
                        })
                    )}
                </div>
            </Card>
        </div>
    );
}
