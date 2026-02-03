'use client';

import { useCart } from "@/context/CartContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Image from "next/image";
import Link from "next/link";
import { Trash2, ShoppingBag, AlertTriangle, Plus, Minus } from "lucide-react";
import type { CartItem } from "@/data/types";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
    exit: { opacity: 0, x: -50, transition: { duration: 0.2 } },
};

function QuantityToggle({ quantity, stock, onIncrease, onDecrease }: { quantity: number, stock: number, onIncrease: () => void, onDecrease: () => void }) {
  return (
    <div className="flex items-center border rounded-md">
      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-r-none" onClick={onDecrease} aria-label="Decrease quantity">
        <Minus className="w-3 h-3" />
      </Button>
      <span className="w-8 text-center font-bold text-sm tabular-nums">{quantity}</span>
      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-l-none" onClick={onIncrease} aria-label="Increase quantity" disabled={quantity >= stock}>
        <Plus className="w-3 h-3" />
      </Button>
    </div>
  );
}


function QuickBuyItemCard({ item }: { item: CartItem }) {
    const { updateQuickBuyItemQuantity, clearQuickBuyItem } = useCart();
    const image = PlaceHolderImages.find(
      (img) => img.id === (item.variant.imageIds?.[0] || item.product.imageIds[0])
    );
    const isStockLow = item.variant.stock > 0 && item.variant.stock <= 5;
    const itemTotal = item.variant.price * item.quantity;
    const stock = item.variant.stock;

    return (
        <motion.div layout variants={itemVariants} initial="hidden" animate="visible" exit="exit" className="flex items-start gap-4 py-4">
            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border">
                {image ? (
                    <Image
                        src={image.imageUrl}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-secondary"/>
                )}
            </div>
            <div className="flex flex-1 flex-col gap-1 min-w-0">
                 <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0 pr-2">
                        <Link href={`/product/${item.product.id}?sku=${item.variant.id}`} className="hover:text-primary group">
                            <h3 className="font-semibold text-sm leading-tight line-clamp-2">{item.product.name}</h3>
                        </Link>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.variant.name}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 -mr-2 flex-shrink-0 text-muted-foreground hover:text-destructive" onClick={clearQuickBuyItem}>
                        <Trash2 className="h-4 w-4"/>
                    </Button>
                </div>

                {isStockLow && 
                    <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Only {item.variant.stock} left in stock!
                    </p>
                }
                
                <div className="flex items-center justify-between text-sm mt-2">
                    <QuantityToggle
                        quantity={item.quantity}
                        stock={stock}
                        onIncrease={() => updateQuickBuyItemQuantity(item.quantity + 1)}
                        onDecrease={() => updateQuickBuyItemQuantity(item.quantity - 1)}
                    />
                    <p className="font-bold text-base text-primary">৳{itemTotal.toFixed(2)}</p>
                </div>
            </div>
        </motion.div>
    )
}

export function CartDrawer() {
  const { isQuickBuyDrawerOpen, closeQuickBuyDrawer, quickBuyItem, clearQuickBuyItem } = useCart();
  
  const quickBuyTotal = quickBuyItem ? quickBuyItem.variant.price * quickBuyItem.quantity : 0;

  return (
    <Sheet open={isQuickBuyDrawerOpen} onOpenChange={(open) => !open && closeQuickBuyDrawer()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md bg-background/95 backdrop-blur-xl">
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-3 text-lg font-semibold">
            <ShoppingBag className="h-6 w-6"/>
            <span>Quick Buy</span>
          </SheetTitle>
        </SheetHeader>
        
        {quickBuyItem ? (
          <div className='flex flex-col flex-1 min-h-0'>
            <ScrollArea className="flex-1">
                <div className="px-6 divide-y">
                    <AnimatePresence>
                        <QuickBuyItemCard item={quickBuyItem} />
                    </AnimatePresence>
                </div>
            </ScrollArea>
            <div className="p-6 border-t bg-background/80 space-y-4 shrink-0">
                <div className="space-y-2 text-sm pt-2">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium">৳{quickBuyTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Shipping</span>
                        <span className="font-medium text-green-600">FREE</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Taxes</span>
                        <span className="text-sm text-muted-foreground">Calculated at checkout</span>
                    </div>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>৳{quickBuyTotal.toFixed(2)}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <Button asChild variant="outline" size="lg">
                        <Link href="/cart">View Main Cart</Link>
                    </Button>
                    <Button asChild size="lg" onClick={closeQuickBuyDrawer}>
                        <Link href="/checkout">Checkout</Link>
                    </Button>
                </div>
                 <div className="flex justify-center text-sm pt-2">
                    <Button variant="link" className="p-0 text-destructive h-auto text-xs" onClick={clearQuickBuyItem}>Clear Quick Buy</Button>
                </div>
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="flex flex-1 flex-col items-center justify-center gap-4 text-center p-8"
          >
            <div className="bg-primary/10 text-primary rounded-full p-5">
                 <ShoppingBag className="h-12 w-12" />
            </div>
            <h3 className="text-xl font-bold">Quick Buy is Empty</h3>
            <p className="text-muted-foreground max-w-xs text-sm">Use the "Buy Now" option on a product to add it here for a fast checkout.</p>
            <Button size="lg" className="mt-4" onClick={closeQuickBuyDrawer}>
                Continue Shopping
            </Button>
          </motion.div>
        )}
      </SheetContent>
    </Sheet>
  );
}
