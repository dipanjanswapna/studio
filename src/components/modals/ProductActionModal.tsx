'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useProductAction } from '@/context/ProductActionContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/hooks/useWishlist';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { ProductVariant } from '@/data/types';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Minus, Plus, Heart, Flame, Tags } from 'lucide-react';
import { useRequiredAction } from '@/context/RequiredActionContext';

export function ProductActionModal() {
  const { product, isModalOpen, closeModal } = useProductAction();
  const { addToMainCart, addOrReplaceQuickBuyItem } = useCart();
  const { wishlistItems, addToWishlist, removeFromWishlist } = useWishlist();
  const { toast } = useToast();
  const { checkPhoneNumber } = useRequiredAction();
  
  const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: string }>({});
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  useEffect(() => {
    if (product) {
      const firstAvailableVariant = product.variants.find(v => v.stock > 0) || product.variants[0];
      if (firstAvailableVariant) {
        setSelectedOptions(firstAvailableVariant.attributes);
      } else {
        setSelectedOptions({});
      }
      setQuantity(1);
    }
  }, [product]);

  useEffect(() => {
    if (product) {
      const variant = product.variants.find(v =>
        Object.entries(selectedOptions).every(([key, value]) => v.attributes[key] === value)
      );
      setSelectedVariant(variant || null);
      setQuantity(1);
    } else {
        setSelectedVariant(null);
    }
  }, [selectedOptions, product]);
  
  const { deal, flashSale, discountPercentage } = product || {};
  const isFlashSale = !!flashSale;
  const isDeal = !!deal;

  const displayPrice = useMemo(() => {
    if (!selectedVariant) return { final: null, original: null };

    if (isFlashSale && flashSale) {
        return {
            final: flashSale.price,
            original: selectedVariant.price,
        };
    }
    if (isDeal && deal) {
        return {
            final: selectedVariant.price * (1 - deal.discountPercentage / 100),
            original: selectedVariant.price,
        };
    }
    if (discountPercentage) {
        return {
            final: selectedVariant.price * (1 - discountPercentage / 100),
            original: selectedVariant.price,
        };
    }
    return { final: selectedVariant.price, original: null };
  }, [selectedVariant, isFlashSale, isDeal, discountPercentage, flashSale, deal]);
  
  const attributeOptions = useMemo(() => {
    if (!product || !product.variantAttributes) return {};
    const options: { [key: string]: Set<string> } = {};
    product.variantAttributes.forEach(attr => {
        options[attr] = new Set();
    });
    product.variants.forEach(variant => {
        product.variantAttributes?.forEach(attr => {
            if (variant.attributes[attr]) {
                options[attr].add(variant.attributes[attr]);
            }
        });
    });
    return options;
  }, [product]);

  if (!product) {
    return null;
  }
  
  const isWishlisted = product ? wishlistItems.some(item => item.id === product.id) : false;
  
  const handleWishlistToggle = () => {
    if (!product) return;
    if (isWishlisted) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const handleOptionChange = (attribute: string, value: string) => {
    setSelectedOptions(prev => ({ ...prev, [attribute]: value }));
  };

  const handleAddToMainCart = () => {
    if (product && selectedVariant) {
      addToMainCart(product, selectedVariant, quantity);
      closeModal();
    }
  };

  const handleBuyNow = () => {
    if (product && selectedVariant) {
        checkPhoneNumber(() => {
            addOrReplaceQuickBuyItem(product, selectedVariant, quantity);
            closeModal();
        });
    }
  };

  const handleIncreaseQuantity = () => {
    if (selectedVariant && quantity < selectedVariant.stock) {
      setQuantity(quantity + 1);
    } else if (selectedVariant) {
      toast({
        variant: "destructive",
        title: "Stock Limit Reached",
        description: `Only ${selectedVariant.stock} units available.`,
      });
    }
  };

  const handleDecreaseQuantity = () => {
    setQuantity(q => Math.max(1, q - 1));
  };
  
  const mainImageId = selectedVariant?.imageIds?.[0] || product.imageIds[0];
  const image = PlaceHolderImages.find(img => img.id === mainImageId);
  
  const areAllOptionsSelected = product.variantAttributes ? product.variantAttributes.every(attr => selectedOptions[attr]) : true;
  const isActionDisabled = !selectedVariant || !areAllOptionsSelected || selectedVariant.stock === 0;

  return (
    <Dialog open={isModalOpen} onOpenChange={open => !open && closeModal()}>
      <DialogContent className="max-w-2xl p-0 flex flex-col md:flex-row max-h-[90vh] md:max-h-[600px]">
          <div className="relative w-full md:w-1/2 shrink-0 bg-secondary">
              <div className="aspect-square md:aspect-auto md:h-full">
                {image && (
                    <Image src={image.imageUrl} alt={product.name} fill className="object-contain p-4 md:p-8 md:rounded-l-lg" />
                )}
                 <div className="absolute top-3 left-3 z-10">
                    {isFlashSale ? (
                        <Badge variant="destructive" className="text-sm flex items-center gap-1.5">
                            <Flame className="w-4 h-4" />
                            Flash Sale
                        </Badge>
                    ) : isDeal ? (
                         <Badge variant="success" className="text-sm flex items-center gap-1.5">
                            <Tags className="w-4 h-4" />
                            {deal.name}
                        </Badge>
                    ) : discountPercentage && (
                        <Badge variant="destructive" className="text-sm">-{discountPercentage}%</Badge>
                    )}
                </div>
              </div>
          </div>

          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="p-6 pb-4 border-b shrink-0 flex justify-between items-start">
              <DialogHeader className="text-left">
                <DialogTitle className="text-2xl">{product.name}</DialogTitle>
                <DialogDescription>Select your preferred options and add to cart.</DialogDescription>
              </DialogHeader>
              <Button size="icon" variant="outline" className="h-10 w-10 shrink-0" onClick={handleWishlistToggle}>
                <Heart className={cn("h-5 w-5 transition-all", isWishlisted && "fill-destructive text-destructive")} />
              </Button>
            </div>

            <div className='flex-1 overflow-y-auto'>
              <div className="space-y-4 px-6 py-4">
                  {product.variantAttributes && product.variantAttributes.length > 0 && (
                      <div className="space-y-4">
                          {Object.entries(attributeOptions).map(([attribute, values]) => (
                              <div key={attribute}>
                                  <Label className="text-base font-medium capitalize">{attribute}</Label>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                      {Array.from(values).map(value => (
                                          <button
                                              key={value}
                                              onClick={() => handleOptionChange(attribute, value)}
                                              className={cn(
                                                  "px-4 py-2 border rounded-md transition-all text-sm font-medium",
                                                  selectedOptions[attribute] === value
                                                      ? "bg-primary text-primary-foreground border-primary"
                                                      : "bg-background text-foreground hover:bg-accent"
                                              )}
                                          >
                                              {value}
                                          </button>
                                      ))}
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}

                  <div className="flex items-center gap-4 pt-4">
                    <Label className="text-base font-medium">Quantity:</Label>
                    <div className="flex items-center border rounded-lg">
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-r-none" onClick={handleDecreaseQuantity} disabled={isActionDisabled}>
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-l-none" onClick={handleIncreaseQuantity} disabled={isActionDisabled || (selectedVariant && quantity >= selectedVariant.stock)}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {selectedVariant && <span className='text-sm text-muted-foreground'>{selectedVariant.stock} in stock</span>}
                  </div>
              </div>
            </div>

            <div className="p-6 pt-4 border-t bg-background/80 shrink-0">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-muted-foreground text-lg">Price</span>
                     {displayPrice.final !== null ? (
                        <div className="text-right">
                             <span className={cn("text-2xl font-bold", (isFlashSale || isDeal) ? "text-destructive" : "text-primary")}>
                                ৳{displayPrice.final.toFixed(2)}
                            </span>
                            {displayPrice.original && (
                                <span className="text-md text-muted-foreground line-through ml-2">
                                    ৳{displayPrice.original.toFixed(2)}
                                </span>
                            )}
                        </div>
                     ) : (
                        <span className="text-sm text-muted-foreground">Select options to see price</span>
                     )}
                </div>

                <DialogFooter className="grid grid-cols-2 gap-3 !mt-0">
                    <Button variant="outline" size="lg" onClick={handleAddToMainCart} disabled={isActionDisabled}>Add to Cart</Button>
                    <Button size="lg" onClick={handleBuyNow} disabled={isActionDisabled}>Buy Now</Button>
                </DialogFooter>
            </div>
          </div>
      </DialogContent>
    </Dialog>
  );
}
