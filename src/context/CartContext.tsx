import { createContext, ReactNode, useState, useContext, useEffect, useCallback, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import type { CartItem, Product, ProductVariant, FirestoreCartItem } from "@/data/types";
import { useAuth } from "./authContext";
import { useCollection, useFirestore } from "@/firebase";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  writeBatch,
  limit,
} from 'firebase/firestore';


// 1. Context Type
export interface CartContextType {
  mainCartItems: CartItem[];
  addToMainCart: (product: Product, variant: ProductVariant, quantity: number) => void;
  removeFromMainCart: (variantId: string) => void;
  updateMainCartItemQuantity: (variantId: string, newQuantity: number) => void;
  clearMainCart: () => void;
  mainCartItemCount: number;
  mainCartTotal: number;
  cartLoading: boolean;

  quickBuyItem: CartItem | null;
  addOrReplaceQuickBuyItem: (product: Product, variant: ProductVariant, quantity: number) => void;
  updateQuickBuyItemQuantity: (newQuantity: number) => void;
  clearQuickBuyItem: () => void;
  isQuickBuyDrawerOpen: boolean;
  closeQuickBuyDrawer: () => void;
}

// 2. Create Context
export const CartContext = createContext<CartContextType | undefined>(undefined);

// 3. Provider Component
export function CartProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const db = useFirestore();
  const { toast } = useToast();

  const [mainCartItems, setMainCartItems] = useState<CartItem[]>([]);
  const [cartLoading, setCartLoading] = useState(true);

  // Firestore listeners
  const userCartCollectionRef = useMemo(() => user ? collection(db, 'users', user.uid, 'cart') : null, [user, db]);
  const { data: firestoreCart, loading: firestoreCartLoading } = useCollection<FirestoreCartItem>(userCartCollectionRef);
  
  const allProductsQuery = useMemo(() => collection(db, 'products'), [db]);
  const { data: allProducts, loading: productsLoading } = useCollection<Product>(allProductsQuery);
  
  // QuickBuy logic remains client-side
  const [quickBuyItem, setQuickBuyItem] = useState<CartItem | null>(null);
  const [isQuickBuyDrawerOpen, setIsQuickBuyDrawerOpen] = useState(false);

   useEffect(() => {
      const storedItem = localStorage.getItem('averzo_quick_buy_item');
      if (storedItem) setQuickBuyItem(JSON.parse(storedItem));
  }, []);

  useEffect(() => {
    if (quickBuyItem) {
        localStorage.setItem('averzo_quick_buy_item', JSON.stringify(quickBuyItem));
    } else {
        localStorage.removeItem('averzo_quick_buy_item');
    }
  }, [quickBuyItem]);


  // Effect for LOGGED-OUT users (localStorage)
  useEffect(() => {
    if (!user && !authLoading) {
      setCartLoading(true);
      try {
        const storedItems = localStorage.getItem('averzo_main_cart');
        setMainCartItems(storedItems ? JSON.parse(storedItems) : []);
      } catch (e) {
        console.error("Failed to parse main cart from localStorage", e);
        localStorage.removeItem('averzo_main_cart');
        setMainCartItems([]);
      }
      setCartLoading(false);
    }
  }, [user, authLoading]);

  // Effect to hydrate cart for LOGGED-IN users
  useEffect(() => {
    if (user && !firestoreCartLoading && !productsLoading) {
      if (firestoreCart && allProducts) {
        const hydratedCart: CartItem[] = firestoreCart
          .map(item => {
            const product = allProducts.find(p => p.id === item.productId);
            if (!product) return null;
            const variant = product.variants.find(v => v.id === item.variantId);
            if (!variant) return null;
            
            return {
              id: item.id, // Firestore document ID
              product,
              variant,
              quantity: item.quantity,
            };
          })
          .filter((i): i is CartItem => i !== null);
        
        setMainCartItems(hydratedCart);
      }
      setCartLoading(false);
    }
  }, [user, firestoreCart, allProducts, firestoreCartLoading, productsLoading]);

  // Effect to merge local cart to Firestore on login
  useEffect(() => {
    const mergeCart = async () => {
        if (user && userCartCollectionRef && !authLoading && !firestoreCartLoading) {
            const localCartString = localStorage.getItem('averzo_main_cart');
            if (!localCartString) return;

            localStorage.removeItem('averzo_main_cart'); // Remove immediately to prevent race conditions
            
            const localCart: CartItem[] = JSON.parse(localCartString);
            if (localCart.length === 0) return;
            
            toast({ title: 'Syncing your cart...', description: 'Please wait a moment.'});
            
            const batch = writeBatch(db);
            const serverCartItems = firestoreCart || [];

            localCart.forEach(localItem => {
                const serverItem = serverCartItems.find(si => si.variantId === localItem.variant.id);
                if (serverItem) {
                    const newQuantity = serverItem.quantity + localItem.quantity;
                    const serverItemRef = doc(db, 'users', user.uid, 'cart', serverItem.id);
                    batch.update(serverItemRef, { quantity: newQuantity });
                } else {
                    const newItemRef = doc(userCartCollectionRef);
                    batch.set(newItemRef, {
                        productId: localItem.product.id,
                        variantId: localItem.variant.id,
                        quantity: localItem.quantity,
                        addedAt: serverTimestamp(),
                    });
                }
            });

            try {
                await batch.commit();
                toast({ title: 'Cart Synced!', description: 'Your items are now saved to your account.' });
            } catch (e) {
                console.error('Failed to merge cart:', e);
                toast({ title: 'Cart Sync Failed', variant: 'destructive' });
                // If merge fails, put cart back in local storage? For now, we assume it succeeds.
            }
        }
    };
    
    mergeCart();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, firestoreCartLoading]);
  
  // Effect to persist cart to localStorage for LOGGED-OUT users
  useEffect(() => {
    if (!user && !authLoading && !cartLoading) {
      localStorage.setItem('averzo_main_cart', JSON.stringify(mainCartItems));
    }
  }, [mainCartItems, user, authLoading, cartLoading]);

  const closeQuickBuyDrawer = () => setIsQuickBuyDrawerOpen(false);

  // --- Main Cart Functions ---
  const addToMainCart = useCallback(async (product: Product, variant: ProductVariant, quantity: number) => {
    if (user && userCartCollectionRef) {
        // Firestore logic
        try {
            const q = query(userCartCollectionRef, where("variantId", "==", variant.id), limit(1));
            const existingItemSnapshot = await getDocs(q);

            if (!existingItemSnapshot.empty) {
                const itemDoc = existingItemSnapshot.docs[0];
                const newQuantity = itemDoc.data().quantity + quantity;
                if (newQuantity > variant.stock) {
                    toast({ variant: "destructive", title: "Stock Limit Reached" });
                    await updateDoc(doc(userCartCollectionRef, itemDoc.id), { quantity: variant.stock });
                } else {
                    await updateDoc(doc(userCartCollectionRef, itemDoc.id), { quantity: newQuantity });
                }
            } else {
                 if (quantity > variant.stock) {
                     toast({ variant: "destructive", title: "Stock Limit Reached" });
                     await addDoc(userCartCollectionRef, { productId: product.id, variantId: variant.id, quantity: variant.stock, addedAt: serverTimestamp() });
                 } else {
                    await addDoc(userCartCollectionRef, { productId: product.id, variantId: variant.id, quantity, addedAt: serverTimestamp() });
                 }
            }
            toast({ title: "Added to Cart", description: `${quantity} x ${product.name} added.` });
        } catch (e) {
            console.error("Error adding to cart:", e);
            toast({ variant: 'destructive', title: "Could not add to cart" });
        }
    } else {
        // LocalStorage logic
        setMainCartItems(prevItems => {
            const existingItem = prevItems.find(item => item.variant.id === variant.id);
            if (existingItem) {
                const newQuantity = existingItem.quantity + quantity;
                if (newQuantity > variant.stock) {
                    toast({ variant: "destructive", title: "Stock Limit Reached" });
                    return prevItems.map(item => item.variant.id === variant.id ? { ...item, quantity: variant.stock } : item);
                }
                return prevItems.map(item => item.variant.id === variant.id ? { ...item, quantity: newQuantity } : item);
            }
            if (quantity > variant.stock) {
                toast({ variant: "destructive", title: "Stock Limit Reached" });
                return [...prevItems, { product, variant, quantity: variant.stock }];
            }
            return [...prevItems, { product, variant, quantity }];
        });
        toast({ title: "Added to Cart", description: `${quantity} x ${product.name} added.` });
    }
  }, [user, toast, userCartCollectionRef]);
  
  const updateMainCartItemQuantity = useCallback(async (variantId: string, newQuantity: number) => {
    if (user && userCartCollectionRef) {
        const itemToUpdate = mainCartItems.find(item => item.variant.id === variantId);
        if (!itemToUpdate || !itemToUpdate.id) return;
        
        if (newQuantity > itemToUpdate.variant.stock) {
            toast({ variant: "destructive", title: "Stock Limit Reached" });
            await updateDoc(doc(userCartCollectionRef, itemToUpdate.id), { quantity: itemToUpdate.variant.stock });
        } else if (newQuantity <= 0) {
            await deleteDoc(doc(userCartCollectionRef, itemToUpdate.id));
        } else {
            await updateDoc(doc(userCartCollectionRef, itemToUpdate.id), { quantity: newQuantity });
        }
    } else {
        setMainCartItems(prevItems => {
            if (newQuantity <= 0) {
                return prevItems.filter(item => item.variant.id !== variantId);
            }
            return prevItems.map(item =>
                item.variant.id === variantId ? { ...item, quantity: newQuantity } : item
            );
        });
    }
  }, [user, mainCartItems, toast, userCartCollectionRef]);

  const removeFromMainCart = useCallback(async (variantId: string) => {
      const itemToRemove = mainCartItems.find(item => item.variant.id === variantId);
      if (!itemToRemove) return;

      if (user && userCartCollectionRef && itemToRemove.id) {
          await deleteDoc(doc(userCartCollectionRef, itemToRemove.id));
      } else {
          setMainCartItems(prevItems => prevItems.filter(item => item.variant.id !== variantId));
      }
      toast({ title: "Item removed", description: `${itemToRemove.product.name} removed from cart.` });
  }, [user, mainCartItems, toast, userCartCollectionRef]);

  const clearMainCart = useCallback(async () => {
    if (user && userCartCollectionRef) {
        const batch = writeBatch(db);
        mainCartItems.forEach(item => {
            if (item.id) {
                batch.delete(doc(userCartCollectionRef, item.id));
            }
        });
        await batch.commit();
    } else {
        setMainCartItems([]);
    }
    toast({ title: "Cart Cleared" });
  }, [user, db, mainCartItems, userCartCollectionRef, toast]);
  
  const mainCartItemCount = mainCartItems.reduce((sum, item) => sum + item.quantity, 0);
  const mainCartTotal = mainCartItems.reduce((sum, item) => sum + (item.product.flashSale ? item.product.flashSale.price : item.variant.price) * item.quantity, 0);

  // --- Quick Buy Functions ---
  const addOrReplaceQuickBuyItem = (product: Product, variant: ProductVariant, quantity: number) => {
    let finalQuantity = quantity;
    if (quantity > variant.stock) {
        finalQuantity = variant.stock;
        toast({
            variant: "destructive",
            title: "Stock Limit Reached",
            description: `Only ${variant.stock} units available.`,
        });
    }
    setQuickBuyItem({ product, variant, quantity: finalQuantity });
    setIsQuickBuyDrawerOpen(true);
    toast({
      title: "Ready to Buy",
      description: `${product.name} has been added to the quick buy drawer.`,
    });
  };

  const updateQuickBuyItemQuantity = useCallback((newQuantity: number) => {
    setQuickBuyItem(prev => {
        if (!prev) return null;
        if (newQuantity > prev.variant.stock) {
            toast({ variant: "destructive", title: "Stock Limit Reached" });
            return { ...prev, quantity: prev.variant.stock };
        }
        if (newQuantity <= 0) return null;
        return { ...prev, quantity: newQuantity };
    });
  }, [toast]);

  const clearQuickBuyItem = () => {
    if (quickBuyItem) toast({ title: "Quick Buy Cleared" });
    setQuickBuyItem(null);
    closeQuickBuyDrawer();
  };

  const value = {
    mainCartItems,
    addToMainCart,
    removeFromMainCart,
    updateMainCartItemQuantity,
    clearMainCart,
    mainCartItemCount,
    mainCartTotal,
    cartLoading,
    quickBuyItem,
    addOrReplaceQuickBuyItem,
    updateQuickBuyItemQuantity,
    clearQuickBuyItem,
    isQuickBuyDrawerOpen,
    closeQuickBuyDrawer,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// 4. Custom Hook
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

    
