'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearch } from '@/context/SearchContext';
import type { Product, Category } from '@/data/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Search as SearchIcon, X, History, TrendingUp, CornerDownLeft } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRouter } from 'next/router';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query as firestoreQuery } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

const MAX_RECENT_SEARCHES = 5;

export function SearchOverlay() {
  const { isOpen, closeSearch } = useSearch();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  
  const db = useFirestore();
  const productsQuery = useMemo(() => firestoreQuery(collection(db, 'products')), [db]);
  const categoriesQuery = useMemo(() => firestoreQuery(collection(db, 'categories')), [db]);

  const { data: products, loading: productsLoading } = useCollection<Product>(productsQuery);
  const { data: categories, loading: categoriesLoading } = useCollection<Category>(categoriesQuery);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
        const storedSearches = localStorage.getItem('averzo_recent_searches');
        if (storedSearches) {
            setRecentSearches(JSON.parse(storedSearches));
        }
    } catch (e) {
        console.error("Failed to parse recent searches from localStorage", e);
        localStorage.removeItem('averzo_recent_searches');
    }
  }, []);

  // Effect to perform search when query changes
  useEffect(() => {
    if (query.length > 1 && products && categories) {
      const lowercasedQuery = query.toLowerCase();
      
      const productsResult = products.filter(p => 
        p.name.toLowerCase().includes(lowercasedQuery) ||
        p.category.toLowerCase().includes(lowercasedQuery) ||
        p.description.toLowerCase().includes(lowercasedQuery)
      ).slice(0, 5);
      
      const categoriesResult = categories.filter(c => 
        c.name.toLowerCase().includes(lowercasedQuery)
      ).slice(0, 4);

      setFilteredProducts(productsResult);
      setFilteredCategories(categoriesResult);
    } else {
      setFilteredProducts([]);
      setFilteredCategories([]);
    }
  }, [query, products, categories]);
  
  const handleResultClick = () => {
      setQuery('');
      closeSearch();
  }

  const executeSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return;

    const newQuery = searchTerm.trim();

    // Add to recent searches
    const updatedSearches = [newQuery, ...recentSearches.filter(s => s.toLowerCase() !== newQuery.toLowerCase())].slice(0, MAX_RECENT_SEARCHES);
    setRecentSearches(updatedSearches);
    localStorage.setItem('averzo_recent_searches', JSON.stringify(updatedSearches));

    router.push({ pathname: '/shop', query: { q: newQuery } });
    
    handleResultClick();
  };

  const trendingSearches = ["Smartphone", "T-Shirt", "Wireless Headphones", "Skincare", "Laptop"];

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && closeSearch()}>
      <DialogContent className="p-0 gap-0 max-w-lg w-[calc(100vw-2rem)] h-auto sm:h-auto sm:max-h-[80vh] flex flex-col top-8 translate-y-0 sm:top-1/2 sm:-translate-y-1/2 rounded-xl">
        {/* Header with Search Input */}
        <div className="flex items-center gap-2 p-4 border-b">
          <SearchIcon className="h-5 w-5 text-muted-foreground" />
          <input
            placeholder="Search for products, categories, or brands..."
            className="flex-1 bg-transparent text-base outline-none border-none placeholder:text-muted-foreground"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && executeSearch(query)}
            autoFocus
          />
        </div>

        <ScrollArea className="flex-1 min-h-0">
            <div className="p-6">
                {query.length > 1 ? (
                    // Search results view
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2">
                             <h3 className="text-sm font-semibold text-muted-foreground mb-4">Products</h3>
                             {productsLoading ? (
                                <div className="space-y-4">
                                  {[...Array(3)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <Skeleton className="w-16 h-16 rounded-md flex-shrink-0" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-40" />
                                            <Skeleton className="h-5 w-20" />
                                        </div>
                                    </div>
                                  ))}
                                </div>
                             ) : filteredProducts.length > 0 ? (
                                <div className="space-y-4">
                                {filteredProducts.map(product => {
                                    const image = PlaceHolderImages.find((img) => img.id === product.imageIds[0]);
                                    const variant = product.variants[0];
                                    return (
                                        <Link href={`/product/${product.id}`} key={product.id} onClick={handleResultClick} className="flex items-center gap-4 group p-2 -ml-2 rounded-md hover:bg-accent">
                                            <div className="relative w-16 h-16 rounded-md overflow-hidden bg-secondary flex-shrink-0">
                                                {image && <Image src={image.imageUrl} alt={product.name} fill className="object-cover" />}
                                            </div>
                                            <div>
                                                <p className="font-semibold group-hover:text-primary">{product.name}</p>
                                                <p className="text-sm text-primary font-bold">৳{variant.price.toFixed(2)}</p>
                                            </div>
                                        </Link>
                                    )
                                })}
                                </div>
                             ) : (
                                <p className="text-muted-foreground text-center py-8">No products found for "{query}"</p>
                             )}
                        </div>
                        <div>
                             <h3 className="text-sm font-semibold text-muted-foreground mb-4">Categories</h3>
                             {categoriesLoading ? (
                                 <div className="space-y-2">
                                    <Skeleton className="h-6 w-full" />
                                    <Skeleton className="h-6 w-full" />
                                    <Skeleton className="h-6 w-full" />
                                 </div>
                             ) : filteredCategories.length > 0 ? (
                                <div className="space-y-2">
                                    {filteredCategories.map(category => (
                                        <Link href={category.href} key={category.id} onClick={handleResultClick} className="flex items-center gap-2 p-2 -ml-2 rounded-md hover:bg-accent group">
                                            <p className="font-medium group-hover:text-primary">{category.name}</p>
                                            <CornerDownLeft className="w-4 h-4 text-muted-foreground ml-auto" />
                                        </Link>
                                    ))}
                                </div>
                             ): (
                                 <p className="text-muted-foreground">No categories found.</p>
                             )}
                        </div>
                     </div>
                ) : (
                    // Default discovery view
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {recentSearches.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <History className="w-4 h-4 text-muted-foreground" />
                                    <h3 className="text-sm font-semibold text-muted-foreground">Recent Searches</h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {recentSearches.map(search => (
                                        <button key={search} onClick={() => executeSearch(search)} className="px-3 py-1 bg-secondary hover:bg-accent rounded-full text-sm">{search}</button>
                                    ))}
                                </div>
                            </div>
                        )}
                         <div>
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                                <h3 className="text-sm font-semibold text-muted-foreground">Trending Now</h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {trendingSearches.map(search => (
                                    <button key={search} onClick={() => executeSearch(search)} className="px-3 py-1 bg-secondary hover:bg-accent rounded-full text-sm">{search}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
