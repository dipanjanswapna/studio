'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Product, Deal, Category } from '@/data/types';

import { CompactProductCard } from '@/components/cards/CompactProductCard';
import { FlashSaleProductCard } from '@/components/cards/FlashSaleProductCard';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { SlidersHorizontal, ChevronRight, ChevronLeft, Flame, Tags } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCountdown } from '@/hooks/use-countdown';
import { ProductCardSkeleton } from '@/components/cards/ProductCardSkeleton';

const slugify = (text: string) => text.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and');

function CountdownTimer({ endTime }: { endTime: string }) {
    const { hours, minutes, seconds, isTimeUp } = useCountdown(endTime);
    
    if (isTimeUp) {
        return null;
    }

    return (
        <div className="flex items-center gap-1">
            <div className="text-center">
                <span className="text-xs font-bold bg-destructive/10 text-destructive p-1 rounded-md tabular-nums">{String(hours).padStart(2, '0')}</span>
            </div>
            <span className="text-xs font-bold text-destructive">:</span>
            <div className="text-center">
                <span className="text-xs font-bold bg-destructive/10 text-destructive p-1 rounded-md tabular-nums">{String(minutes).padStart(2, '0')}</span>
            </div>
            <span className="text-xs font-bold text-destructive">:</span>
            <div className="text-center">
                <span className="text-xs font-bold bg-destructive/10 text-destructive p-1 rounded-md tabular-nums">{String(seconds).padStart(2, '0')}</span>
            </div>
        </div>
    );
}

function BannerCountdownTimer({ endTime }: { endTime: string }) {
    const { hours, minutes, seconds, isTimeUp } = useCountdown(endTime);
    
    if (isTimeUp) {
        return <span className="text-xl font-bold">Sale has ended!</span>;
    }

    return (
        <div className="flex items-center gap-1 sm:gap-2 text-destructive-foreground">
            <div className="text-center">
                <span className="text-lg sm:text-xl font-bold bg-white/20 p-2 sm:p-2.5 rounded-md tabular-nums">{String(hours).padStart(2, '0')}</span>
                <span className="text-xs mt-1 block">Hrs</span>
            </div>
            <span className="text-lg sm:text-xl font-bold">:</span>
            <div className="text-center">
                <span className="text-lg sm:text-xl font-bold bg-white/20 p-2 sm:p-2.5 rounded-md tabular-nums">{String(minutes).padStart(2, '0')}</span>
                 <span className="text-xs mt-1 block">Min</span>
            </div>
            <span className="text-lg sm:text-xl font-bold">:</span>
            <div className="text-center">
                <span className="text-lg sm:text-xl font-bold bg-white/20 p-2 sm:p-2.5 rounded-md tabular-nums">{String(seconds).padStart(2, '0')}</span>
                 <span className="text-xs mt-1 block">Sec</span>
            </div>
        </div>
    );
}


function ShopBreadcrumb({ deals, categories }: { deals: Deal[], categories: Category[] }) {
    const router = useRouter();
    const { category, subcategory, deal } = router.query;

    const categoryData = category ? categories.find(c => slugify(c.name) === category) : undefined;
    
    let subcategoryData = null;
    let groupData = null;
    if (categoryData && subcategory && categoryData.groups) {
        for (const grp of categoryData.groups) {
            const sub = grp.subcategories.find(s => slugify(s.name) === subcategory);
            if (sub) {
                subcategoryData = sub;
                groupData = grp;
                break;
            }
        }
    }
    const dealData = deal ? deals.find(d => d.slug === deal) : undefined;


    return (
        <Breadcrumb className="mb-6">
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    {category || deal ? (
                        <BreadcrumbLink href="/shop">Shop</BreadcrumbLink>
                    ) : (
                        <BreadcrumbPage>Shop</BreadcrumbPage>
                    )}
                </BreadcrumbItem>
                {categoryData && (
                    <>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            {groupData ? (
                                <BreadcrumbLink href={{ pathname: '/shop', query: { category: category } }}>{categoryData.name}</BreadcrumbLink>
                            ) : (
                                <BreadcrumbPage>{categoryData.name}</BreadcrumbPage>
                            )}
                        </BreadcrumbItem>
                    </>
                )}
                 {dealData && (
                    <>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                           <BreadcrumbPage>{dealData.name}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </>
                )}
                {groupData && subcategoryData && (
                    <>
                        <BreadcrumbSeparator />
                         <BreadcrumbItem>
                            <BreadcrumbPage>{subcategoryData.name}</BreadcrumbPage>
                         </BreadcrumbItem>
                    </>
                )}
            </BreadcrumbList>
        </Breadcrumb>
    );
}

function ShopFilters({ brands, activeDeals, maxPrice, categories }: { brands: string[], activeDeals: Deal[], maxPrice: number, categories: Category[] }) {
    const router = useRouter();
    const { query } = router;
    const { category: categorySlug, subcategory: subcategorySlug, brands: activeBrandsQuery, priceRange: priceRangeQuery, onSale, deal: dealSlug } = query;

    const allCategories = useMemo(() => categories.filter(c => c.name !== 'Home' && c.name !== 'Shop'), [categories]);
    
    const activeCategoryData = useMemo(() => {
        if (categorySlug && typeof categorySlug === 'string') {
            return allCategories.find(c => slugify(c.name) === categorySlug);
        }
        return null;
    }, [categorySlug, allCategories]);

    const [price, setPrice] = useState(() => {
        if (typeof priceRangeQuery === 'string') {
            const [min, max] = priceRangeQuery.split(',').map(Number);
            if (!isNaN(min) && !isNaN(max)) return [min, max];
        }
        return [0, maxPrice];
    });

    const activeBrands = useMemo(() => {
        const queryBrands = activeBrandsQuery || [];
        return Array.isArray(queryBrands) ? queryBrands : [queryBrands];
    }, [activeBrandsQuery]);

    const onSaleQuery = onSale === 'true';
    
    const handlePriceCommit = (value: number[]) => {
        const newQuery = { ...router.query, priceRange: value.join(',') };
        router.push({ pathname: '/shop', query: newQuery }, undefined, { shallow: true, scroll: false });
    };

    const handleBrandChange = (brand: string) => {
        const newBrands = activeBrands.includes(brand)
            ? activeBrands.filter((b: string) => b !== brand)
            : [...activeBrands, brand];
        const newQuery = { ...router.query, brands: newBrands };
         if (newBrands.length === 0) {
            delete newQuery.brands;
        }
        router.push({ pathname: '/shop', query: newQuery }, undefined, { shallow: true, scroll: false });
    };
    
    const handleOnSaleChange = (checked: boolean | 'indeterminate') => {
        const newQuery = { ...router.query };
        if (checked) {
            newQuery.onSale = 'true';
        } else {
            delete newQuery.onSale;
        }
        router.push({ pathname: '/shop', query: newQuery }, undefined, { shallow: true, scroll: false });
    };

    const getQueryFromHref = (href: string) => {
        const url = new URL(href, 'http://localhost');
        const query: { [key: string]: string | string[] } = {};
        url.searchParams.forEach((value, key) => {
            query[key] = value;
        });
        return query;
    };
    
    const renderCategoryFilters = () => {
        if (activeCategoryData && activeCategoryData.groups) {
            return (
                <div className="space-y-4">
                    <Button variant="ghost" size="sm" asChild className="pl-0 text-muted-foreground hover:text-foreground">
                        <Link href={{pathname: '/shop', query: {sort: query.sort}}} scroll={false}>
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            All Categories
                        </Link>
                    </Button>
                    <h3 className="font-semibold text-base px-2">{activeCategoryData.name}</h3>
                    <div className="space-y-3">
                        {activeCategoryData.groups.map(group => (
                            <div key={group.name} className="space-y-2">
                                <h4 className="font-medium text-sm text-muted-foreground px-2">{group.name}</h4>
                                <ul className="space-y-1">
                                    {group.subcategories.map(sub => (
                                        <li key={sub.name}>
                                            <Link 
                                                href={{pathname: '/shop', query: {...getQueryFromHref(sub.href), sort: query.sort }}} 
                                                scroll={false}
                                                className={cn(
                                                    "block text-sm text-foreground rounded-md p-2 hover:bg-accent",
                                                    slugify(sub.name) === subcategorySlug && "bg-accent font-semibold text-primary"
                                                )}
                                            >
                                                {sub.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-1">
                {allCategories.map(cat => (
                    <Link
                        href={{ pathname: '/shop', query: { ...getQueryFromHref(cat.href), sort: query.sort } }}
                        key={cat.id}
                        scroll={false}
                        className={cn(
                            "flex items-center justify-between p-2 rounded-md hover:bg-accent text-sm",
                            slugify(cat.name) === categorySlug ? "bg-accent font-semibold text-primary" : ""
                        )}
                    >
                        <span>{cat.name}</span>
                        {cat.groups && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    </Link>
                ))}
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <Accordion type="multiple" defaultValue={['deals', 'category', 'price', 'brands']} className="w-full">
                 <AccordionItem value="deals">
                    <AccordionTrigger className="text-base font-semibold">Special Deals</AccordionTrigger>
                    <AccordionContent className="pt-2">
                         <div className="space-y-2 p-2">
                             <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="on-sale"
                                        checked={onSaleQuery}
                                        onCheckedChange={handleOnSaleChange}
                                    />
                                    <label
                                        htmlFor="on-sale"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                                    >
                                        <Flame className="w-4 h-4 text-destructive" />
                                        Flash Sale
                                    </label>
                                </div>
                            </div>
                        </div>
                        {activeDeals.map(deal => (
                            <Link 
                                href={{pathname: '/shop', query: { deal: deal.slug }}} 
                                key={deal.id}
                                className={cn(
                                    "flex items-center justify-between p-2 rounded-md hover:bg-accent text-sm w-full",
                                    dealSlug === deal.slug && "bg-accent font-semibold text-primary"
                                )}
                            >
                                <span className="flex items-center gap-2"><Tags className="w-4 h-4 text-green-600"/>{deal.name}</span>
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </Link>
                        ))}
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="category">
                    <AccordionTrigger className="text-base font-semibold">Category</AccordionTrigger>
                    <AccordionContent className="pt-2">
                        <ScrollArea className="h-[300px] pr-2">
                          {renderCategoryFilters()}
                        </ScrollArea>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="price">
                    <AccordionTrigger className="text-base font-semibold">Price Range</AccordionTrigger>
                    <AccordionContent>
                        <div className="p-2">
                            <Slider
                                min={0}
                                max={maxPrice}
                                step={10}
                                value={price}
                                onValueChange={setPrice}
                                onValueCommit={handlePriceCommit}
                            />
                            <div className="flex justify-between text-sm text-muted-foreground mt-2">
                                <span>৳{price[0]}</span>
                                <span>৳{price[1]}</span>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="brands">
                    <AccordionTrigger className="text-base font-semibold">Brand</AccordionTrigger>
                    <AccordionContent>
                        <ScrollArea className="h-60">
                            <div className="space-y-2 pr-4">
                                {brands.map((brand) => (
                                    <div key={brand} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={brand}
                                            checked={activeBrands.includes(brand)}
                                            onCheckedChange={() => handleBrandChange(brand)}
                                        />
                                        <label
                                            htmlFor={brand}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            {brand}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}

export default function ShopPage() {
    const router = useRouter();
    const { query } = router;
    const { sort: sortByQuery, category, subcategory, brands: activeBrandsQuery, priceRange: priceRangeQuery, q, onSale, deal: dealSlug } = query;
    const [sortBy, setSortBy] = useState('newest');
    const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

    const db = useFirestore();
    const { data: allProducts, loading: productsLoading } = useCollection<Product>(query(collection(db, 'products')));
    const { data: allDealsData } = useCollection<Deal>(query(collection(db, 'deals')));
    const { data: allCategoriesData, loading: categoriesLoading } = useCollection<Category>(
        query(collection(db, 'categories'), orderBy('order'))
    );
    
    const maxPrice = useMemo(() => allProducts ? Math.max(...allProducts.flatMap(p => p.variants.map(v => v.price))) : 0, [allProducts]);
    
    const activeDeals = useMemo(() => {
        if (!allDealsData) return [];
        return allDealsData.filter(deal => new Date(deal.endTime) > new Date())
    }, [allDealsData]);

    const currentDeal = useMemo(() => activeDeals.find(d => d.slug === dealSlug), [activeDeals, dealSlug]);
    const isFlashSalePage = onSale === 'true';

    const soonestFlashSaleEndTime = useMemo(() => {
        if (!allProducts) return null;
        const flashSaleProducts = allProducts.filter(p => p.flashSale && new Date(p.flashSale.endTime) > new Date());
        if (flashSaleProducts.length === 0) return null;

        return flashSaleProducts.reduce((soonest: string | null, product) => {
            const endTime = product.flashSale?.endTime;
            if (!endTime) return soonest;
            if (!soonest || new Date(endTime) < new Date(soonest)) {
                return endTime;
            }
            return soonest;
        }, null);
    }, [allProducts]);

    useEffect(() => {
        if(sortByQuery && typeof sortByQuery === 'string') {
            setSortBy(sortByQuery);
        }
    }, [sortByQuery]);

    const handleSortChange = (value: string) => {
        setSortBy(value);
        const newQuery = { ...router.query, sort: value };
        router.push({ pathname: router.pathname, query: newQuery }, undefined, { shallow: true, scroll: false });
    };
    
    const brands = useMemo(() => {
        if (!allProducts) return [];
        return Array.from(new Set(allProducts.map(p => p.brand).filter((b): b is string => !!b)));
    }, [allProducts]);

    const priceRange = useMemo(() => {
        if (typeof priceRangeQuery === 'string') {
            const [min, max] = priceRangeQuery.split(',').map(Number);
            if (!isNaN(min) && !isNaN(max)) {
                return [min, max];
            }
        }
        return [0, maxPrice];
    }, [priceRangeQuery, maxPrice]);

    const activeBrands = useMemo(() => {
        const queryBrands = activeBrandsQuery || [];
        return Array.isArray(queryBrands) ? queryBrands : [queryBrands];
    }, [activeBrandsQuery]);

    const clearFilters = () => {
        const { sort } = router.query;
        router.push({ pathname: '/shop', query: { ...(sort && { sort }) } }, undefined, { scroll: false });
    };

    const hasActiveFilters = !!(q || category || dealSlug || activeBrands.length > 0 || priceRange[0] !== 0 || priceRange[1] !== maxPrice || onSale);

    const filteredProducts = useMemo(() => {
        let tempProducts = allProducts ? [...allProducts] : [];

        if (q && typeof q === 'string') {
            const lowercasedQuery = q.toLowerCase();
            tempProducts = tempProducts.filter(p => 
                p.name.toLowerCase().includes(lowercasedQuery) ||
                p.category.toLowerCase().includes(lowercasedQuery) ||
                p.description.toLowerCase().includes(lowercasedQuery)
            );
        }

        if (dealSlug && typeof dealSlug === 'string') {
            const deal = allDealsData?.find(d => d.slug === dealSlug);
            if (deal) {
                tempProducts = tempProducts.filter(p => deal.productIds.includes(p.id));
            }
        }

        if (category && typeof category === 'string' && allCategoriesData) {
             const categoryData = allCategoriesData.find(c => slugify(c.name) === category);
             if (categoryData) {
                if (subcategory && typeof subcategory === 'string') {
                    // This is a simplistic match. A real app might need a more robust subcategory mapping.
                    const normalizedSubcategoryName = subcategory.replace(/-/g, ' ');
                    tempProducts = tempProducts.filter(p => p.name.toLowerCase().includes(normalizedSubcategoryName) || p.description.toLowerCase().includes(normalizedSubcategoryName) || p.category.toLowerCase() === categoryData.name.toLowerCase());
                } else {
                    tempProducts = tempProducts.filter(p => p.category === categoryData.name);
                }
             }
        }

        if (onSale === 'true') {
            tempProducts = tempProducts.filter(p => p.flashSale && new Date(p.flashSale.endTime) > new Date());
        }

        if (priceRange[0] !== 0 || priceRange[1] !== maxPrice) {
            tempProducts = tempProducts.filter(p => p.variants.some(v => v.price >= priceRange[0] && v.price <= priceRange[1]));
        }

        if (activeBrands.length > 0) {
            tempProducts = tempProducts.filter(p => p.brand && activeBrands.includes(p.brand));
        }

        switch (sortBy) {
            case 'price-asc':
                tempProducts.sort((a, b) => a.variants[0].price - b.variants[0].price);
                break;
            case 'price-desc':
                tempProducts.sort((a, b) => b.variants[0].price - a.variants[0].price);
                break;
            case 'rating':
                tempProducts.sort((a, b) => b.rating - a.rating);
                break;
            case 'best-selling':
                tempProducts.sort((a, b) => b.reviews - a.reviews);
                break;
            case 'featured':
                tempProducts.sort((a, b) => {
                    const aFeatured = a.isFeatured ? 1 : 0;
                    const bFeatured = b.isFeatured ? 1 : 0;
                    return bFeatured - aFeatured;
                });
                break;
            case 'newest':
            default:
                tempProducts.sort((a, b) => {
                    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return dateB - dateA;
                });
                break;
        }

        return tempProducts;
    }, [allProducts, allDealsData, allCategoriesData, query, sortBy]);

    return (
        <div className="container py-8">
            <ShopBreadcrumb deals={activeDeals} categories={allCategoriesData || []} />
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                <aside className="hidden lg:block lg:col-span-1">
                    <div className="sticky top-28 space-y-6">
                        <div className="p-6 bg-card rounded-xl shadow-sm border">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-semibold">Filters</h3>
                                {hasActiveFilters && (
                                    <Button variant="ghost" size="sm" onClick={clearFilters}>Clear All</Button>
                                )}
                            </div>
                            <ShopFilters brands={brands} activeDeals={activeDeals} maxPrice={maxPrice} categories={allCategoriesData || []} />
                        </div>
                    </div>
                </aside>

                <main className="lg:col-span-3">
                    <div className="bg-card rounded-xl shadow-sm border p-4 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            {q && typeof q === 'string' && q.trim() !== '' && (
                                <p className="text-lg mb-1">Search results for: <span className="font-bold text-primary">"{q}"</span></p>
                            )}
                            <p className="text-muted-foreground text-sm">
                                Showing <span className="font-bold text-foreground">{filteredProducts.length}</span> products
                            </p>
                        </div>
                        <div className="flex items-center gap-4 w-full md:w-auto self-end md:self-center">
                            <Button
                                variant="outline"
                                className="lg:hidden w-full md:w-auto flex items-center gap-2"
                                onClick={() => setIsFilterSheetOpen(true)}
                            >
                                <SlidersHorizontal className="h-4 w-4" />
                                <span>Filters</span>
                            </Button>
                            <Select value={sortBy} onValueChange={handleSortChange}>
                                <SelectTrigger className="w-full md:w-[180px]">
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="newest">Newest</SelectItem>
                                    <SelectItem value="featured">Featured</SelectItem>
                                    <SelectItem value="best-selling">Best Selling</SelectItem>
                                    <SelectItem value="price-asc">Price: Low to High</SelectItem>
                                    <SelectItem value="price-desc">Price: High to Low</SelectItem>
                                    <SelectItem value="rating">Top Rated</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    {currentDeal && (
                        <div className="bg-green-600 text-white rounded-lg p-6 mb-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="text-center sm:text-left">
                                <h2 className="text-2xl font-bold flex items-center justify-center sm:justify-start gap-2">
                                    <Tags className="w-7 h-7" />
                                    <span>{currentDeal.name}</span>
                                </h2>
                                <p className="mt-1 opacity-90">{currentDeal.description}</p>
                            </div>
                            <div className="flex flex-col items-center gap-2 shrink-0">
                                <span className="font-semibold">Ending in</span>
                                <BannerCountdownTimer endTime={currentDeal.endTime} />
                            </div>
                        </div>
                    )}
                    
                    {isFlashSalePage && !currentDeal && soonestFlashSaleEndTime && (
                        <div className="bg-destructive text-destructive-foreground rounded-lg p-6 mb-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="text-center sm:text-left">
                                <h2 className="text-2xl font-bold flex items-center justify-center sm:justify-start gap-2">
                                    <Flame className="w-7 h-7" />
                                    <span>Flash Sale</span>
                                </h2>
                                <p className="mt-1 opacity-90">Don't miss out on these amazing limited-time offers!</p>
                            </div>
                            <div className="flex flex-col items-center gap-2 shrink-0">
                                <span className="font-semibold">Ending soon</span>
                                <BannerCountdownTimer endTime={soonestFlashSaleEndTime} />
                            </div>
                        </div>
                    )}


                     {productsLoading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {[...Array(12)].map((_, i) => <ProductCardSkeleton key={i} />)}
                        </div>
                     ) : filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {filteredProducts.map((product, index) =>
                                product.flashSale && new Date(product.flashSale.endTime) > new Date() ? (
                                    <FlashSaleProductCard
                                        key={product.id}
                                        product={product as Product & { flashSale: NonNullable<Product['flashSale']> }}
                                    />
                                ) : (
                                    <CompactProductCard 
                                        key={product.id} 
                                        product={product}
                                        rank={sortBy === 'best-selling' && index < 12 ? index + 1 : undefined}
                                    />
                                )
                            )}
                        </div>
                     ) : (
                        <div className="flex flex-col items-center justify-center text-center py-20 bg-card rounded-xl border">
                             <h2 className="text-2xl font-bold">No Products Found</h2>
                             <p className="text-muted-foreground mt-2 max-w-sm">
                                We couldn't find any products matching your filters. Try clearing some filters to see more results.
                             </p>
                             <Button onClick={clearFilters} className="mt-6">Clear All Filters</Button>
                        </div>
                     )}
                </main>
            </div>
            
            <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
                <SheetContent className="w-[320px] sm:w-[380px] p-0 flex flex-col">
                    <div className="flex items-center justify-between p-4 border-b">
                         <h3 className="text-lg font-semibold">Filters</h3>
                         {hasActiveFilters && (
                            <Button variant="ghost" size="sm" onClick={() => {
                                clearFilters();
                                setIsFilterSheetOpen(false);
                            }}>
                                Clear All
                            </Button>
                        )}
                    </div>
                    <ScrollArea className="flex-1">
                        <div className="p-4">
                          <ShopFilters brands={brands} activeDeals={activeDeals} maxPrice={maxPrice} categories={allCategoriesData || []} />
                        </div>
                    </ScrollArea>
                </SheetContent>
            </Sheet>
        </div>
    );
}
