'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import { useDoc, useCollection, useFirestore } from '@/firebase';
import { collection, doc, query, where, limit } from 'firebase/firestore';

import { PlaceHolderImages, type ImagePlaceholder } from '@/lib/placeholder-images';
import type { Product } from '@/data/types';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRequiredAction } from '@/context/RequiredActionContext';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import {
  Star,
  Minus,
  Plus,
  GitCompare,
  ShieldCheck,
  Truck,
  Share2,
  Flame,
  Tags,
} from 'lucide-react';
import { CompactProductCard } from '@/components/cards/CompactProductCard';
import { cn } from '@/lib/utils';
import { ProductIdentifier } from '@/components/product/ProductIdentifier';
import { ProductPageSkeleton } from '@/components/product/ProductPageSkeleton';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { motion } from 'framer-motion';


function MobileBuyBar({ onAddToCart, onBuyNow, disabled }: { onAddToCart: () => void; onBuyNow: () => void; disabled: boolean }) {
  return (
    <motion.div 
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: 'tween', ease: 'easeOut', duration: 0.3 }}
      className="md:hidden fixed bottom-[5.5rem] inset-x-4 bg-background/90 backdrop-blur-sm border rounded-full p-3 z-40 shadow-lg"
    >
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" size="lg" onClick={onAddToCart} disabled={disabled}>
           Add to Cart
        </Button>
        <Button size="lg" onClick={onBuyNow} disabled={disabled}>
           Buy Now
        </Button>
      </div>
    </motion.div>
  )
}

function ProductBreadcrumb({ product }: { product: Product }) {
    const categorySlug = product.category.toLowerCase().replace(/\s+/g, '-');
    return (
        <Breadcrumb className="mb-6">
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink asChild><Link href="/">Home</Link></BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbLink asChild><Link href="/shop">Shop</Link></BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbLink asChild><Link href={`/shop?category=${categorySlug}`}>{product.category}</Link></BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbPage>{product.name}</BreadcrumbPage>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
    );
}


function ProductDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const db = useFirestore();

  const { addToMainCart, addOrReplaceQuickBuyItem } = useCart();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { checkPhoneNumber } = useRequiredAction();

  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<{[key: string]: string}>({});
  
  const productRef = useMemo(() => (id ? doc(db, 'products', id as string) : null), [id, db]);
  const { data: product, loading: productLoading } = useDoc<Product>(productRef);
  
  const { deal, flashSale, discountPercentage } = product || {};
  const isFlashSale = !!flashSale;
  const isDeal = !!deal;

  const relatedProductsQuery = useMemo(() => {
    if (!product) return null;
    return query(
      collection(db, 'products'),
      where('category', '==', product.category),
      limit(6)
    );
  }, [product, db]);

  const { data: relatedProductsData } = useCollection<Product>(relatedProductsQuery);

  const relatedProducts = useMemo(() => {
    if (!relatedProductsData || !product) return [];
    return relatedProductsData.filter(p => p.id !== product.id).slice(0, 5);
  }, [relatedProductsData, product]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [emblaMainRef, emblaMainApi] = useEmblaCarousel();
  const [emblaThumbsRef, emblaThumbsApi] = useEmblaCarousel({
      containScroll: 'keepSnaps',
      dragFree: true,
  });

  const onThumbClick = useCallback((index: number) => {
      if (!emblaMainApi || !emblaThumbsApi) return;
      emblaMainApi.scrollTo(index);
  }, [emblaMainApi, emblaThumbsApi]);

  const onSelect = useCallback(() => {
      if (!emblaMainApi || !emblaThumbsApi) return;
      setSelectedIndex(emblaMainApi.selectedScrollSnap());
      emblaThumbsApi.scrollTo(emblaMainApi.selectedScrollSnap());
  }, [emblaMainApi, emblaThumbsApi]);

  useEffect(() => {
      if (!emblaMainApi) return;
      onSelect();
      emblaMainApi.on('select', onSelect);
      emblaMainApi.on('reInit', onSelect);
  }, [emblaMainApi, onSelect]);
  
  useEffect(() => {
    if (router.isReady && product) {
      const skuFromUrl = router.query.sku as string;
      const variantFromUrl = skuFromUrl
        ? product.variants.find((v) => v.id === skuFromUrl)
        : null;

      if (variantFromUrl) {
        setSelectedOptions(variantFromUrl.attributes);
      } else {
        const firstAvailableVariant = product.variants.find(v => v.stock > 0) || product.variants[0];
        if (firstAvailableVariant) {
            setSelectedOptions(firstAvailableVariant.attributes);
        }
      }
    }
  }, [router.isReady, product, router.query.sku]);

  const selectedVariant = useMemo(() => {
    if (!product || !product.variants) return null;
    
    if (!product.variantAttributes || product.variantAttributes.length === 0) {
        return product.variants[0];
    }

    const allOptionsSelected = product.variantAttributes.every(attr => selectedOptions[attr]);
    if (!allOptionsSelected) {
        return null;
    }

    return product.variants.find(v => 
        product.variantAttributes?.every(
            (attr) => v.attributes[attr] === selectedOptions[attr]
        )
    ) || null;
  }, [product, selectedOptions]);
  
  useEffect(() => {
    setQuantity(1);
  }, [selectedVariant?.id]);

  useEffect(() => {
    if (selectedVariant && router.isReady) {
        const currentSkuInUrl = router.query.sku;
        if (currentSkuInUrl !== selectedVariant.id) {
            router.replace(
                {
                    pathname: router.pathname,
                    query: { ...router.query, sku: selectedVariant.id },
                },
                undefined,
                { shallow: true, scroll: false }
            );
        }
    }
  }, [selectedVariant, router]);


  const galleryImageIds = useMemo(() => selectedVariant?.imageIds || product?.imageIds || [], [selectedVariant, product]);

  const galleryImages = useMemo(() => 
      galleryImageIds.map(id => PlaceHolderImages.find(img => img.id === id)).filter((p): p is ImagePlaceholder => p !== undefined),
      [galleryImageIds]
  );
  
  useEffect(() => {
    if(emblaMainApi) {
        emblaMainApi.reInit();
        onSelect();
    }
  }, [galleryImages, emblaMainApi, onSelect]);


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

  const getAvailableOptions = useCallback((attribute: string) => {
    if (!product) return new Set<string>();

    const availableValues = new Set<string>();

    product.variants.forEach(variant => {
        let isCompatible = true;
        for (const key in selectedOptions) {
            if (key !== attribute && selectedOptions[key] && selectedOptions[key] !== variant.attributes[key]) {
                isCompatible = false;
                break;
            }
        }

        if (isCompatible && variant.stock > 0) {
            const value = variant.attributes[attribute];
            if(value) availableValues.add(value);
        }
    });

    return availableValues;
  }, [product, selectedOptions]);
  
  const displayPrice = useMemo(() => {
    if (!selectedVariant) return { final: null, original: null };

    if (isFlashSale) {
        return {
            final: flashSale!.price,
            original: selectedVariant.price,
        };
    }
    if (isDeal) {
        return {
            final: selectedVariant.price * (1 - deal!.discountPercentage / 100),
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

  const pricePerUnit = useMemo(() => {
    if (product?.category !== 'Medicine' || !selectedVariant?.attributes.packSize || !displayPrice.final) {
      return null;
    }
    const packSize = parseInt(selectedVariant.attributes.packSize, 10);
    if (isNaN(packSize) || packSize === 0) {
      return null;
    }
    const unitPrice = displayPrice.final / packSize;
    return unitPrice.toFixed(2);
  }, [product, selectedVariant, displayPrice.final]);

  if (productLoading || !router.isReady) {
    return <ProductPageSkeleton />;
  }

  if (!product) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <p className="text-muted-foreground mt-2">
          The product you're looking for doesn't exist or has been moved.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Go back to Home</Link>
        </Button>
      </div>
    );
  }
  
  const getAttributeLabel = (attribute: string) => {
      const labels: { [key: string]: string } = {
          size: "Size", color: "Color", fabric: "Fabric", storage: "Storage", ram: "RAM", region: "Region", dosage: "Dosage", packSize: "Pack Size", weight: "Weight", packaging: "Packaging", material: "Material", finish: "Finish", volume: "Volume", skinType: "Skin Type", resolution: "Resolution", lens: "Lens", type: "Type"
      };
      return labels[attribute] || attribute.charAt(0).toUpperCase() + attribute.slice(1);
  }

  const handleOptionChange = (attribute: string, value: string) => {
      setSelectedOptions(prev => ({
          ...prev,
          [attribute]: value,
      }));
  };
  
  const handleAddToCart = () => {
    if (product && selectedVariant) {
        addToMainCart(product, selectedVariant, quantity);
    }
  };

  const handleBuyNow = () => {
    if (product && selectedVariant) {
        addOrReplaceQuickBuyItem(product, selectedVariant, quantity);
    }
  };

  const handleProtectedBuyNow = () => {
    checkPhoneNumber(handleBuyNow);
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
  
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Check out ${product.name}!`,
        url: window.location.href,
      })
      .catch((error) => console.log('Error sharing', error));
    } else {
        navigator.clipboard.writeText(window.location.href);
        toast({
            title: "Link Copied!",
            description: "Product link has been copied to your clipboard.",
        });
    }
  };
  
  const isActionDisabled = !selectedVariant || selectedVariant.stock === 0;

  return (
    <div className="bg-background">
      <div className="container py-8 md:py-12">
        <ProductBreadcrumb product={product} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          
          <div className="space-y-4">
             <div className="relative overflow-hidden rounded-xl border bg-card shadow-sm" ref={emblaMainRef}>
                <div className="flex">
                    {galleryImages.length > 0 ? (
                        galleryImages.map((image) => (
                            <div className="relative flex-[0_0_100%] aspect-square" key={image.id}>
                                <Image
                                    src={image.imageUrl}
                                    alt={product.name}
                                    fill
                                    className="object-contain p-4 md:p-8"
                                    data-ai-hint={image.imageHint}
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                />
                            </div>
                        ))
                    ) : (
                        <div className="relative flex-[0_0_100%] aspect-square">
                            <div className="w-full h-full bg-muted animate-pulse" />
                        </div>
                    )}
                </div>
                <div className="absolute top-3 left-3 z-10">
                    {isFlashSale ? (
                        <Badge variant="destructive" className="text-sm flex items-center gap-1.5">
                            <Flame className="w-4 h-4" />
                            Flash Sale
                        </Badge>
                    ) : isDeal ? (
                         <Badge variant="success" className="text-sm flex items-center gap-1.5">
                            <Tags className="w-4 h-4" />
                            DEAL
                        </Badge>
                    ) : discountPercentage && (
                        <Badge variant="destructive" className="text-sm">-{discountPercentage}%</Badge>
                    )}
                </div>
            </div>

            {galleryImages.length > 1 && (
                <div className="overflow-hidden" ref={emblaThumbsRef}>
                    <div className="flex gap-2">
                        {galleryImages.map((thumbImage, index) => (
                            <button
                                key={thumbImage.id}
                                onClick={() => onThumbClick(index)}
                                className={cn(
                                    "relative flex-[0_0_20%] aspect-square rounded-md overflow-hidden border-2 transition-colors",
                                    index === selectedIndex ? "border-primary" : "border-transparent hover:border-primary/50"
                                )}
                                aria-label={`View ${product.name} - ${thumbImage.id}`}
                            >
                                <Image 
                                    src={thumbImage.imageUrl} 
                                    alt={thumbImage.description} 
                                    fill 
                                    className="object-cover"
                                    sizes="20vw"
                                />
                            </button>
                        ))}
                    </div>
                </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold leading-tight">{product.name}</h1>
              <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Brand: <Link href="#" className="text-primary hover:underline">Averzo</Link></span>
                  <Separator orientation="vertical" className="h-4" />
                  <span>SKU: {selectedVariant ? selectedVariant.id.toUpperCase() : 'N/A'}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'w-5 h-5',
                      i < Math.floor(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground opacity-40'
                    )}
                  />
                ))}
                <span className="text-muted-foreground text-sm ml-2">({product.reviews} reviews)</span>
              </div>
               {selectedVariant && (
                <Badge variant={selectedVariant.stock > 0 ? 'success' : 'destructive'} className="ml-auto">
                    {selectedVariant.stock > 0 ? `In Stock: ${selectedVariant.stock}` : 'Out of Stock'}
                </Badge>
              )}
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                {displayPrice.final !== null ? (
                    <>
                        <span className={cn("text-3xl font-bold", (isFlashSale || isDeal) ? "text-destructive" : "text-primary")}>
                            ৳{displayPrice.final.toFixed(2)}
                        </span>
                        {displayPrice.original && (
                            <span className="text-xl text-muted-foreground line-through">
                                ৳{displayPrice.original.toFixed(2)}
                            </span>
                        )}
                    </>
                ) : (
                  <span className="text-2xl font-bold text-muted-foreground">Select options to see price</span>
                )}
              </div>
              {pricePerUnit && (
                <span className="text-sm text-muted-foreground mt-1">
                  (৳{pricePerUnit} per tablet)
                </span>
              )}
            </div>

            {isDeal && (
              <div className="border-2 border-dashed border-green-500 bg-green-500/10 rounded-lg p-3 text-center">
                <p className="font-semibold text-green-700 dark:text-green-400">This product is part of the <span className="font-bold">{deal.name}</span>! Get {deal.discountPercentage}% off.</p>
              </div>
            )}


            <p className="text-muted-foreground leading-relaxed">
              {product.description}
            </p>
            
            <Separator />

             {product.variantAttributes && product.variantAttributes.length > 0 && (
              <div className="space-y-4">
                  {Object.entries(attributeOptions).map(([attribute, values]) => {
                    const availableOptionsForAttr = getAvailableOptions(attribute);
                    return (
                        <div key={attribute}>
                            <Label className="text-base font-medium capitalize">{getAttributeLabel(attribute)}</Label>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {Array.from(values).map((value) => {
                                const isEnabled = availableOptionsForAttr.has(value);
                                return (
                                  <button
                                    key={value}
                                    onClick={() => handleOptionChange(attribute, value)}
                                    disabled={!isEnabled}
                                    className={cn(
                                      "px-4 py-2 border rounded-md transition-all text-sm font-medium relative",
                                      selectedOptions[attribute] === value
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-background text-foreground hover:bg-accent",
                                      !isEnabled && "bg-secondary text-muted-foreground/50 border-dashed cursor-not-allowed line-through"
                                    )}
                                  >
                                    {value}
                                  </button>
                                );
                              })}
                            </div>
                        </div>
                    );
                  })}
              </div>
            )}
            
             <div className="flex items-center gap-4">
              <span className="font-medium">Quantity:</span>
              <div className="flex items-center border rounded-lg">
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-r-none" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={isActionDisabled}>
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-l-none" onClick={handleIncreaseQuantity} disabled={isActionDisabled || (selectedVariant && quantity >= selectedVariant.stock)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
               {selectedVariant && <span className='text-sm text-muted-foreground'>{selectedVariant.stock} in stock</span>}
            </div>

            <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button size="lg" variant="outline" onClick={handleAddToCart} disabled={isActionDisabled}>
                  Add to Cart
                </Button>
                <Button size="lg" onClick={handleProtectedBuyNow} disabled={isActionDisabled}>
                  Buy Now
                </Button>
            </div>
            
            <div className="flex items-center gap-2">
                 <Button variant="ghost" size="sm" className="text-muted-foreground">
                   <GitCompare className="mr-2 h-4 w-4" />
                   <span>Compare</span>
                </Button>
                 <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={handleShare}>
                   <Share2 className="mr-2 h-4 w-4" />
                   <span>Share</span>
                </Button>
            </div>
            
            {selectedVariant ? (
              <ProductIdentifier 
                sku={selectedVariant.id} 
                barcodeValue={selectedVariant.id}
                productId={product.id}
                productName={product.name}
              />
            ) : (
              <div className="flex flex-col gap-4 p-4 border rounded-xl bg-secondary/30">
                <p className="text-sm text-center text-muted-foreground">Select a variant to see product identifiers.</p>
              </div>
            )}

            <Accordion type="single" collapsible defaultValue="description" className="w-full">
              <AccordionItem value="description">
                <AccordionTrigger>Full Description</AccordionTrigger>
                <AccordionContent className="prose prose-sm max-w-none text-muted-foreground">
                  <p>This is where a more detailed product description would go. It can include marketing copy, feature lists, and usage instructions. The current description is: {product.description}. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="specifications">
                <AccordionTrigger>Specifications</AccordionTrigger>
                <AccordionContent>
                  A table with product specifications would go here. For example: RAM, Storage, Display Size for electronics.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="reviews">
                <AccordionTrigger>Customer Reviews ({product.reviews})</AccordionTrigger>
                <AccordionContent>
                  A list of customer reviews would be displayed here.
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="border rounded-lg p-4 space-y-3 text-sm bg-secondary/50">
              <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <span className="text-muted-foreground">
                      <span className="font-semibold text-foreground">1 Year Official Warranty</span> from Averzo
                  </span>
              </div>
               <div className="flex items-center gap-3">
                  <Truck className="w-5 h-5 text-primary" />
                  <span className="text-muted-foreground">
                      <span className="font-semibold text-foreground">Free & Fast Delivery</span> across the country
                  </span>
              </div>
            </div>
          </div>
        </div>
        
        {relatedProducts.length > 0 && (
          <section className="mt-16 pt-12 border-t lg:col-span-2">
            <h2 className="text-2xl md:text-3xl font-bold mb-8">Related Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {relatedProducts.map((p) => (
                <CompactProductCard key={p.id} product={p as Product} />
              ))}
            </div>
          </section>
        )}
      </div>
      {isMobile && (
        <MobileBuyBar 
            onAddToCart={handleAddToCart}
            onBuyNow={handleProtectedBuyNow}
            disabled={isActionDisabled}
        />
      )}
    </div>
  );
}

export default ProductDetailPage;
