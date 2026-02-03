'use client';

import { createContext, ReactNode, useState, useContext, useEffect, useCallback, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@/data/types";
import { useAuth } from './authContext';
import { useCollection, useFirestore } from '@/firebase';
import { collection, addDoc, deleteDoc, serverTimestamp, query, where, getDocs, doc } from 'firebase/firestore';

export interface WishlistContextType {
  wishlistItems: Product[];
  wishlistItemIds: string[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isProductInWishlist: (productId: string) => boolean;
  wishlistItemCount: number;
  loading: boolean;
}

export const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  
  const wishlistRef = user ? collection(db, 'users', user.uid, 'wishlist') : null;
  const { data: rawWishlistItems, loading: wishlistLoading } = useCollection<{id: string, productId: string}>(wishlistRef);

  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  const wishlistItemIds = useMemo(() => rawWishlistItems?.map(item => item.productId) || [], [rawWishlistItems]);

  useEffect(() => {
    if (!wishlistLoading && wishlistItemIds.length > 0) {
      setProductsLoading(true);
      const productsRef = collection(db, 'products');
      
      // Firestore 'in' query is limited to 30 items. For a larger wishlist, this needs pagination.
      const chunks = [];
      for (let i = 0; i < wishlistItemIds.length; i += 30) {
        chunks.push(wishlistItemIds.slice(i, i + 30));
      }

      const fetchPromises = chunks.map(chunk => {
        const q = query(productsRef, where('id', 'in', chunk));
        return getDocs(q);
      });

      Promise.all(fetchPromises).then(snapshots => {
        const products = snapshots.flatMap(snapshot => 
          snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product))
        );
        setWishlistItems(products);
        setProductsLoading(false);
      });

    } else if (!wishlistLoading) {
      setWishlistItems([]);
      setProductsLoading(false);
    }
  }, [wishlistItemIds, db, wishlistLoading]);


  const addToWishlist = useCallback(async (product: Product) => {
    if (!wishlistRef || !user) {
        toast({ variant: 'destructive', title: "Please log in to save to wishlist."});
        return;
    }
    if (wishlistItemIds.includes(product.id)) return;

    await addDoc(wishlistRef, {
        productId: product.id,
        addedAt: serverTimestamp(),
    });
    toast({ title: "Added to Wishlist", description: `${product.name} has been saved for later.` });

  }, [wishlistRef, user, toast, wishlistItemIds]);

  const removeFromWishlist = useCallback(async (productId: string) => {
    if (!wishlistRef) return;
    
    const itemToRemove = rawWishlistItems?.find(item => item.productId === productId);
    if (itemToRemove) {
      await deleteDoc(doc(wishlistRef, itemToRemove.id));
      const product = wishlistItems.find(p => p.id === productId);
      if(product) {
        toast({ title: "Removed from Wishlist", description: `${product.name} has been removed.` });
      }
    }
  }, [wishlistRef, rawWishlistItems, wishlistItems, toast]);

  const isProductInWishlist = useCallback((productId: string) => {
    return wishlistItemIds.includes(productId);
  }, [wishlistItemIds]);

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        wishlistItemIds,
        addToWishlist,
        removeFromWishlist,
        isProductInWishlist,
        wishlistItemCount: wishlistItemIds.length,
        loading: wishlistLoading || productsLoading,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}
