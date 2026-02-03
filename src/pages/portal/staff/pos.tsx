'use client';

import { useState, useMemo } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { Product, ProductVariant } from '@/data/types';
import { useAuth } from '@/context/authContext';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, ShoppingCart, Trash2, Plus, Minus, ScanLine, UserPlus, X, Flame } from 'lucide-react';
import { QrLookupDialog } from '@/components/modals/QrLookupDialog';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

type POSCartItem = {
    product: Product;
    variant: ProductVariant;
    quantity: number;
};

export default function POSPage() {
    const db = useFirestore();
    const { user: staffUser } = useAuth();
    const { data: products, loading: productsLoading } = useCollection<Product>(query(collection(db, 'products')));

    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState<POSCartItem[]>([]);
    const [customer, setCustomer] = useState({ name: 'Walk-in Customer', id: null });
    const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
    const { toast } = useToast();

    // Filter products based on search query
    const filteredProducts = useMemo(() => {
        if (!products) return [];
        if (!searchQuery) {
            return products.slice(0, 20); // Show some products initially
        }
        return products.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, products]);

    const addToCart = (product: Product, variant: ProductVariant) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.variant.id === variant.id);
            if (existingItem) {
                // If item exists, increase quantity if stock allows
                if (existingItem.quantity < variant.stock) {
                    return prevCart.map(item =>
                        item.variant.id === variant.id ? { ...item, quantity: item.quantity + 1 } : item
                    );
                } else {
                    toast({ variant: 'destructive', title: 'Stock limit reached!' });
                    return prevCart;
                }
            } else {
                // If item doesn't exist, add it to cart
                 if (variant.stock > 0) {
                    return [...prevCart, { product, variant, quantity: 1 }];
                } else {
                     toast({ variant: 'destructive', title: 'Out of stock!' });
                     return prevCart;
                }
            }
        });
    };
    
    const onProductFoundByQr = (productId: string) => {
        if (!products) return;
        const product = products.find(p => p.id === productId);
        if (product) {
            // For simplicity, add the first variant. A real scenario might open a selection modal.
            const variant = product.variants[0];
            if (variant) {
                addToCart(product, variant);
                toast({ title: "Product Added", description: `${product.name} added to cart.` });
                setIsQrDialogOpen(false); // Close the dialog
            }
        } else {
            toast({ variant: 'destructive', title: "Product Not Found" });
        }
    };


    const updateQuantity = (variantId: string, change: number) => {
        setCart(prevCart => {
            const item = prevCart.find(i => i.variant.id === variantId);
            if (!item) return prevCart;

            const newQuantity = item.quantity + change;
            if (newQuantity > item.variant.stock) {
                toast({ variant: 'destructive', title: 'Stock limit reached!' });
                return prevCart;
            }
            if (newQuantity <= 0) {
                return prevCart.filter(i => i.variant.id !== variantId);
            }
            return prevCart.map(i => i.variant.id === variantId ? { ...i, quantity: newQuantity } : i);
        });
    };

    const removeFromCart = (variantId: string) => {
        setCart(prevCart => prevCart.filter(item => item.variant.id !== variantId));
    };

    const cartSubtotal = useMemo(() => {
        return cart.reduce((total, item) => total + (item.product.flashSale ? item.product.flashSale.price : item.variant.price) * item.quantity, 0);
    }, [cart]);
    
    const tax = cartSubtotal * 0.05; // 5% tax
    const cartTotal = cartSubtotal + tax;

    const completeSale = async () => {
        if (cart.length === 0) {
            toast({ variant: 'destructive', title: 'Cart is empty!' });
            return;
        }

        if (!staffUser) {
            toast({ variant: 'destructive', title: 'Authentication Error', description: 'Please log in again to complete the sale.' });
            return;
        }

        const orderData = {
            userId: staffUser.uid, // The staff member who made the sale
            customerInfo: {
                name: customer.name,
                email: "walk-in@averzo.com",
                phone: "00000000000",
                address: "In-Store Purchase",
                city: "In-Store",
            },
            items: cart.map(item => ({
                productId: item.product.id,
                variantId: item.variant.id,
                productName: item.product.name,
                variantName: item.variant.name,
                quantity: item.quantity,
                price: item.product.flashSale ? item.product.flashSale.price : item.variant.price,
                imageUrl: PlaceHolderImages.find(img => img.id === (item.variant.imageIds?.[0] || item.product.imageIds[0]))?.imageUrl || '',
                productImageId: item.variant.imageIds?.[0] || item.product.imageIds[0] || '',
            })),
            subtotal: cartSubtotal,
            shippingFee: 0,
            total: cartTotal,
            status: 'Delivered' as const, // POS sales are considered delivered immediately
            paymentMethod: 'cod' as const, // Represents in-store payment (cash/card)
            createdAt: serverTimestamp(),
            shortId: ''
        };

        try {
            const ordersRef = collection(db, 'orders');
            const docRef = await addDoc(ordersRef, orderData);
            const shortId = `#POS-${docRef.id.slice(-6).toUpperCase()}`;
            await updateDoc(docRef, { shortId });

            toast({ title: 'Sale Completed!', description: `Order ${shortId} created. Total: ৳${cartTotal.toFixed(2)}` });
            setCart([]);
            setCustomer({ name: 'Walk-in Customer', id: null });
        } catch (serverError) {
             console.error("Failed to complete sale: ", serverError);
             const permissionError = new FirestorePermissionError({
                path: 'orders',
                operation: 'create',
                requestResourceData: orderData,
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({ variant: 'destructive', title: 'Sale Failed', description: 'Could not save the order. Please try again.' });
        }
    };

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-50/50 dark:bg-background">
            <header className="p-4 border-b flex justify-between items-center bg-card shrink-0">
                 <h1 className="text-xl font-bold">Point of Sale (POS)</h1>
                 <Button variant="outline" onClick={() => setIsQrDialogOpen(true)}>
                    <ScanLine className="mr-2 h-4 w-4" />
                    Scan Product
                 </Button>
            </header>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 overflow-hidden">
                {/* Product Selection */}
                <Card className="lg:col-span-2 flex flex-col overflow-hidden">
                    <CardHeader>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                placeholder="Search products..."
                                className="pl-10 h-11 text-base"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <ScrollArea className="flex-1">
                        {productsLoading ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 px-6 pb-6">
                                {[...Array(10)].map((_, i) => (
                                    <Card key={i}>
                                        <Skeleton className="aspect-square w-full" />
                                        <div className="p-2 space-y-1">
                                            <Skeleton className="h-4 w-3/4" />
                                            <Skeleton className="h-5 w-1/2" />
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <motion.div
                                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 px-6 pb-6"
                                initial="hidden" animate="visible" variants={{
                                    visible: { transition: { staggerChildren: 0.05 } }
                                }}
                            >
                                {filteredProducts.map(product => {
                                    const isFlashSale = !!product.flashSale;
                                    return (
                                    <motion.div key={product.id} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                                    <Card
                                        onClick={() => addToCart(product, product.variants[0])}
                                        className={cn(
                                            "cursor-pointer hover:border-primary transition-colors group overflow-hidden",
                                            isFlashSale && "border-2 border-destructive hover:border-destructive/80 shadow-md shadow-destructive/20"
                                        )}
                                    >
                                        <div className="relative aspect-square bg-secondary">
                                            <Image
                                                src={PlaceHolderImages.find(i => i.id === product.imageIds[0])?.imageUrl || ''}
                                                alt={product.name}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform"
                                            />
                                            {isFlashSale && (
                                                <div className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1.5 z-10">
                                                    <Flame className="h-3 w-3" />
                                                </div>
                                            )}
                                            {product.variants[0].stock === 0 && (
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                    <span className="text-white font-bold bg-destructive px-2 py-1 rounded">Out of Stock</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-2 text-sm">
                                            <h4 className="font-semibold truncate">{product.name}</h4>
                                            <p className={cn("text-primary", isFlashSale && "font-bold text-destructive")}>
                                                {isFlashSale ? (
                                                    <span className="flex items-center gap-2">
                                                        <span>৳{product.flashSale!.price.toFixed(2)}</span>
                                                        <span className="text-xs text-muted-foreground line-through">৳{product.variants[0].price.toFixed(2)}</span>
                                                    </span>
                                                ) : (
                                                    `৳${product.variants[0].price.toFixed(2)}`
                                                )}
                                            </p>
                                        </div>
                                    </Card>
                                    </motion.div>
                                )})}
                            </motion.div>
                        )}
                    </ScrollArea>
                </Card>

                {/* Cart & Billing */}
                <Card className="flex flex-col overflow-hidden">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Current Order</span>
                            <div className="flex items-center gap-2 text-sm font-normal bg-secondary p-2 rounded-md">
                                <UserPlus className="h-4 w-4"/>
                                {customer.name}
                                <Button variant="ghost" size="icon" className="h-5 w-5 ml-1"><X className="h-3 w-3"/></Button>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <ScrollArea className="flex-1 px-6">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                                <ShoppingCart className="h-16 w-16" />
                                <p className="mt-4">Your cart is empty</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                 <AnimatePresence>
                                    {cart.map(item => (
                                        <motion.div
                                            key={item.variant.id}
                                            layout
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, x: -100 }}
                                            className="flex items-center gap-3"
                                        >
                                            <Image
                                                src={PlaceHolderImages.find(i => i.id === (item.variant.imageIds?.[0] || item.product.imageIds[0]))?.imageUrl || ''}
                                                alt={item.product.name}
                                                width={48}
                                                height={48}
                                                className="rounded-md border object-cover"
                                            />
                                            <div className="flex-1">
                                                <p className="font-medium text-sm truncate">{item.product.name}</p>
                                                <p className="text-xs text-muted-foreground">{item.variant.name}</p>
                                            </div>
                                            <div className="flex items-center gap-1 border rounded-md">
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.variant.id, -1)}><Minus className="h-3 w-3" /></Button>
                                                <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.variant.id, 1)}><Plus className="h-3 w-3" /></Button>
                                            </div>
                                            <p className="font-semibold text-sm w-16 text-right">৳{(item.product.flashSale ? item.product.flashSale.price : item.variant.price * item.quantity).toFixed(2)}</p>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeFromCart(item.variant.id)}><Trash2 className="h-4 w-4"/></Button>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </ScrollArea>
                    {cart.length > 0 && (
                         <div className="p-6 border-t mt-auto shrink-0">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>৳{cartSubtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Tax (5%)</span>
                                    <span>৳{tax.toFixed(2)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span>৳{cartTotal.toFixed(2)}</span>
                                </div>
                            </div>
                            <Button size="lg" className="w-full mt-4" onClick={completeSale}>Complete Sale</Button>
                        </div>
                    )}
                </Card>
            </div>
             <QrLookupDialog
                open={isQrDialogOpen}
                onOpenChange={setIsQrDialogOpen}
                onProductFound={onProductFoundByQr}
            />
        </div>
    );
}
