'use client';

import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import { useCollection, useFirestore } from "@/firebase";
import { collection, query, where, orderBy, limit } from "firebase/firestore";
import type { Product, Category } from "@/data/types";
import { getIcon } from "@/lib/icons";

import { ChevronRight, ArrowRight } from "lucide-react";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { CategoryCard } from "@/components/cards/CategoryCard";
import { CompactProductCard } from "@/components/cards/CompactProductCard";
import { FlashSaleSection } from "@/components/home/FlashSaleSection";
import { Card, CardContent } from "@/components/ui/card";
import { ShopByBrand } from "@/components/home/ShopByBrand";
import { ProductCardSkeleton } from "@/components/cards/ProductCardSkeleton";
import { CategoryCardSkeleton } from "@/components/cards/CategoryCardSkeleton";

export default function Home() {
  const db = useFirestore();
  const productsRef = collection(db, 'products');

  const { data: featuredProductsData, loading: featuredLoading } = useCollection<Product>(
    query(productsRef, where('isFeatured', '==', true), limit(10))
  );
  const featuredProducts = useMemo(() => featuredProductsData || [], [featuredProductsData]);

  const { data: newArrivalsData, loading: newArrivalsLoading } = useCollection<Product>(
    query(productsRef, orderBy('createdAt', 'desc'), limit(10))
  );
  const newArrivals = useMemo(() => newArrivalsData || [], [newArrivalsData]);

  const { data: bestSellersData, loading: bestSellersLoading } = useCollection<Product>(
    query(productsRef, orderBy('reviews', 'desc'), limit(12))
  );
  const bestSellers = useMemo(() => bestSellersData || [], [bestSellersData]);

  const { data: categoriesData, loading: categoriesLoading } = useCollection<Category>(
    query(collection(db, 'categories'), orderBy('order'), limit(16))
  );
  
  const categoriesWithIcons = useMemo(() => {
    if (!categoriesData) return [];
    return categoriesData.map(cat => ({ ...cat, icon: getIcon(cat.iconName || 'HelpCircle') }));
  }, [categoriesData]);

  const categoryColors = [
    "bg-sky-100 dark:bg-sky-900/30",
    "bg-green-100 dark:bg-green-900/30",
    "bg-amber-100 dark:bg-amber-900/30",
    "bg-rose-100 dark:bg-rose-900/30",
    "bg-indigo-100 dark:bg-indigo-900/30",
    "bg-pink-100 dark:bg-pink-900/30",
    "bg-teal-100 dark:bg-teal-900/30",
    "bg-fuchsia-100 dark:bg-fuchsia-900/30",
  ];

  return (
     <div className="space-y-8">
      <HeroCarousel />
      <div className="container space-y-8 pb-8">
        <section id="top-categories">
            <Carousel
                opts={{ align: 'start', dragFree: true }}
                className="w-full"
            >
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                      <div className="inline-flex items-center gap-2 md:gap-4 bg-destructive text-destructive-foreground rounded-full px-3 py-1.5 md:px-4 md:py-2 whitespace-nowrap">
                          <h2 className="text-sm md:text-base font-bold tracking-tight">Top Categories</h2>
                          <Link href="/shop" className="flex items-center text-xs md:text-sm opacity-80 hover:opacity-100 transition-opacity">
                              See All
                              <ChevronRight className="w-4 h-4 ml-1" />
                          </Link>
                      </div>
                  </div>
                  <div className="flex-grow border-t-4 border-destructive mx-2 animate-blink"></div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <CarouselPrevious className="relative h-7 w-7 sm:h-8 sm:w-8 translate-y-0 left-auto top-auto right-auto bottom-auto md:flex" />
                    <CarouselNext className="relative h-7 w-7 sm:h-8 sm:w-8 translate-y-0 left-auto top-auto right-auto bottom-auto md:flex" />
                  </div>
                </div>
                <CarouselContent className="-ml-3">
                    {categoriesLoading ? (
                      [...Array(8)].map((_, index) => (
                        <CarouselItem key={index} className="basis-2/3 sm:basis-1/3 md:basis-1/4 lg:basis-1/6 pl-3 h-full">
                            <CategoryCardSkeleton />
                        </CarouselItem>
                      ))
                    ) : (
                      categoriesWithIcons.map((category, index) => (
                        <CarouselItem key={category.id} className="basis-2/3 sm:basis-1/3 md:basis-1/4 lg:basis-1/6 pl-3 h-full">
                            <CategoryCard category={category} colorClass={categoryColors[index % categoryColors.length]} />
                        </CarouselItem>
                      ))
                    )}
                </CarouselContent>
            </Carousel>
        </section>

        <FlashSaleSection />

        <section>
            <Link href="/shop" className="block w-full">
              <Card className="overflow-hidden border shadow-sm">
                <Image
                  src="https://picsum.photos/seed/new-collection/1200/300"
                  alt="New Collection"
                  width={1200}
                  height={300}
                  className="w-full h-auto object-cover"
                  data-ai-hint="new collection"
                  sizes="100vw"
                />
              </Card>
            </Link>
        </section>

        <section id="best-selling">
           <Carousel
                opts={{ align: 'start', dragFree: true }}
                className="w-full"
            >
                <div className="mb-6 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                        <div className="inline-flex items-center gap-2 md:gap-4 bg-destructive text-destructive-foreground rounded-full px-3 py-1.5 md:px-4 md:py-2 whitespace-nowrap">
                            <h2 className="text-sm md:text-base font-bold tracking-tight">Best Selling</h2>
                            <Link href="/shop?sort=best-selling" className="flex items-center text-xs md:text-sm opacity-80 hover:opacity-100 transition-opacity">
                                See All
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Link>
                        </div>
                    </div>
                    <div className="flex-grow border-t-4 border-destructive mx-2 animate-blink"></div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <CarouselPrevious className="relative h-7 w-7 sm:h-8 sm:w-8 translate-y-0 left-auto top-auto right-auto bottom-auto md:flex" />
                        <CarouselNext className="relative h-7 w-7 sm:h-8 sm:w-8 translate-y-0 left-auto top-auto right-auto bottom-auto md:flex" />
                    </div>
                </div>
                <CarouselContent className="-ml-3">
                    {bestSellersLoading ? (
                      [...Array(5)].map((_, i) => (
                          <CarouselItem key={i} className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 pl-3">
                              <ProductCardSkeleton />
                          </CarouselItem>
                      ))
                    ) : (
                      bestSellers.map((product, index) => (
                          <CarouselItem key={product.id} className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 pl-3">
                              <CompactProductCard product={product} rank={index + 1} />
                          </CarouselItem>
                      ))
                    )}
                    <CarouselItem className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 pl-3">
                        <Link href="/shop?sort=best-selling" className="group block h-full">
                            <Card className="h-full flex flex-col items-center justify-center bg-muted/50 hover:bg-muted transition-colors">
                                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                    <div className="bg-primary/10 text-primary rounded-full p-3 mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                    <ArrowRight className="h-6 w-6" />
                                    </div>
                                    <h3 className="font-semibold text-foreground">See More</h3>
                                    <p className="text-sm text-muted-foreground mt-1">View all best sellers</p>
                                </CardContent>
                            </Card>
                        </Link>
                    </CarouselItem>
                </CarouselContent>
            </Carousel>
        </section>
        
        <section id="new-arrivals">
           <Carousel
                opts={{ align: 'start', dragFree: true }}
                className="w-full"
            >
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                      <div className="inline-flex items-center gap-2 md:gap-4 bg-destructive text-destructive-foreground rounded-full px-3 py-1.5 md:px-4 md:py-2 whitespace-nowrap">
                          <h2 className="text-sm md:text-base font-bold tracking-tight">New Arrivals</h2>
                          <Link href="/shop?sort=newest" className="flex items-center text-xs md:text-sm opacity-80 hover:opacity-100 transition-opacity">
                              See All
                              <ChevronRight className="w-4 h-4 ml-1" />
                          </Link>
                      </div>
                  </div>
                  <div className="flex-grow border-t-4 border-destructive mx-2 animate-blink"></div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <CarouselPrevious className="relative h-7 w-7 sm:h-8 sm:w-8 translate-y-0 left-auto top-auto right-auto bottom-auto md:flex" />
                    <CarouselNext className="relative h-7 w-7 sm:h-8 sm:w-8 translate-y-0 left-auto top-auto right-auto bottom-auto md:flex" />
                  </div>
                </div>
                <CarouselContent className="-ml-3">
                    {newArrivalsLoading ? (
                      [...Array(5)].map((_, i) => (
                        <CarouselItem key={i} className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 pl-3">
                            <ProductCardSkeleton />
                        </CarouselItem>
                      ))
                    ) : (
                      newArrivals.map((product) => (
                        <CarouselItem key={product.id} className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 pl-3">
                          <CompactProductCard product={product} />
                        </CarouselItem>
                      ))
                    )}
                      <CarouselItem className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 pl-3">
                          <Link href="/shop?sort=newest" className="group block h-full">
                              <Card className="h-full flex flex-col items-center justify-center bg-muted/50 hover:bg-muted transition-colors">
                                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                      <div className="bg-primary/10 text-primary rounded-full p-3 mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        <ArrowRight className="h-6 w-6" />
                                      </div>
                                      <h3 className="font-semibold text-foreground">See More</h3>
                                      <p className="text-sm text-muted-foreground mt-1">View all new products</p>
                                  </CardContent>
                              </Card>
                          </Link>
                      </CarouselItem>
                </CarouselContent>
            </Carousel>
        </section>
        
        <section id="featured">
           <Carousel
                opts={{ align: 'start', dragFree: true }}
                className="w-full"
            >
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                      <div className="inline-flex items-center gap-2 md:gap-4 bg-destructive text-destructive-foreground rounded-full px-3 py-1.5 md:px-4 md:py-2 whitespace-nowrap">
                          <h2 className="text-sm md:text-base font-bold tracking-tight">Featured Products</h2>
                          <Link href="/shop?sort=featured" className="flex items-center text-xs md:text-sm opacity-80 hover:opacity-100 transition-opacity">
                              See All
                              <ChevronRight className="w-4 h-4 ml-1" />
                          </Link>
                      </div>
                  </div>
                  <div className="flex-grow border-t-4 border-destructive mx-2 animate-blink"></div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <CarouselPrevious className="relative h-7 w-7 sm:h-8 sm:w-8 translate-y-0 left-auto top-auto right-auto bottom-auto md:flex" />
                    <CarouselNext className="relative h-7 w-7 sm:h-8 sm:w-8 translate-y-0 left-auto top-auto right-auto bottom-auto md:flex" />
                  </div>
                </div>

                <CarouselContent className="-ml-3">
                    {featuredLoading ? (
                      [...Array(5)].map((_, i) => (
                        <CarouselItem key={i} className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 pl-3">
                            <ProductCardSkeleton />
                        </CarouselItem>
                      ))
                    ) : (
                      featuredProducts.map((product) => (
                          <CarouselItem key={product.id} className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 pl-3">
                              <CompactProductCard product={product} />
                          </CarouselItem>
                      ))
                    )}
                    <CarouselItem className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 pl-3">
                        <Link href="/shop?sort=featured" className="group block h-full">
                            <Card className="h-full flex flex-col items-center justify-center bg-muted/50 hover:bg-muted transition-colors">
                                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                    <div className="bg-primary/10 text-primary rounded-full p-3 mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                    <ArrowRight className="h-6 w-6" />
                                    </div>
                                    <h3 className="font-semibold text-foreground">See More</h3>
                                    <p className="text-sm text-muted-foreground mt-1">View all featured</p>
                                </CardContent>
                            </Card>
                        </Link>
                    </CarouselItem>
                </CarouselContent>
            </Carousel>
        </section>

        <ShopByBrand />
      </div>
    </div>
  );
}
