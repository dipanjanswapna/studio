import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Trash2, ShoppingBag, Plus, Minus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";

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

export default function CartPage() {
  const { mainCartItems, removeFromMainCart, updateMainCartItemQuantity, clearMainCart, mainCartTotal } = useCart();
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center mb-6"
      >
        <h1 className="text-3xl font-bold">Your Shopping Cart</h1>
      </motion.div>

      {mainCartItems.length === 0 ? (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="text-center py-20 bg-muted rounded-lg"
        >
          <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground" />
          <h2 className="mt-6 text-xl font-semibold">Your cart is empty</h2>
          <p className="mt-2 text-muted-foreground">
            Looks like you haven't added anything to your cart yet.
          </p>
          <Button asChild className="mt-6">
            <Link href="/shop">Start Shopping</Link>
          </Button>
        </motion.div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          <motion.div 
            className="lg:col-span-2 space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence>
              {mainCartItems.map(({ product, quantity, variant }) => {
                const image = PlaceHolderImages.find(
                  (img) => img.id === (variant.imageIds?.[0] || product.imageIds[0])
                );
                const itemTotal = variant.price * quantity;
                const stock = variant.stock;
                return (
                  <motion.div 
                    key={variant.id} 
                    layout
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="flex items-start sm:items-center gap-4 p-4 border rounded-lg flex-col sm:flex-row bg-card"
                  >
                    <div className="flex items-start gap-4 w-full">
                      {image && (
                        <Link href={`/product/${product.id}?sku=${variant.id}`}>
                          <Image
                            src={image.imageUrl}
                            alt={product.name}
                            width={100}
                            height={100}
                            className="rounded-md object-cover border"
                            data-ai-hint={image.imageHint}
                          />
                        </Link>
                      )}
                      <div className="flex-grow">
                        <Link href={`/product/${product.id}?sku=${variant.id}`}>
                          <h3 className="font-semibold hover:text-primary transition-colors">{product.name}</h3>
                        </Link>
                        <p className="text-sm text-muted-foreground">{variant.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Unit Price: ৳{variant.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 w-full sm:w-auto">
                        <QuantityToggle
                            quantity={quantity}
                            stock={stock}
                            onIncrease={() => updateMainCartItemQuantity(variant.id, quantity + 1)}
                            onDecrease={() => updateMainCartItemQuantity(variant.id, quantity - 1)}
                        />
                        <p className="font-semibold text-lg w-24 text-right">৳{itemTotal.toFixed(2)}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromMainCart(variant.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
             <motion.div initial={{opacity: 0}} animate={{opacity: 1}} transition={{delay: mainCartItems.length * 0.1}}>
                <Button variant="outline" onClick={clearMainCart} className="mt-4">
                  Clear Cart
                </Button>
            </motion.div>
          </motion.div>
          <motion.div 
            className="lg:col-span-1 sticky top-36"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="p-6 bg-muted rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>৳{mainCartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>FREE</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>৳{mainCartTotal.toFixed(2)}</span>
                </div>
              </div>
              <Button asChild size="lg" className="w-full mt-6">
                <Link href="/checkout">Proceed to Checkout</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
