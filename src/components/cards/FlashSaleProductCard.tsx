import Image from 'next/image';
import Link from 'next/link';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { Product } from '@/data/types';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Flame, Heart, Star } from 'lucide-react';
import { useProductAction } from '@/context/ProductActionContext';
import { useWishlist } from '@/hooks/useWishlist';
import { cn } from '@/lib/utils';

type FlashSaleProductCardProps = {
    product: Product & { flashSale: NonNullable<Product['flashSale']> };
};

export function FlashSaleProductCard({ product }: FlashSaleProductCardProps) {
    const { openModal } = useProductAction();
    const { wishlistItems, addToWishlist, removeFromWishlist } = useWishlist();
    
    const { flashSale } = product;
    const isSoldOut = flashSale.sold >= flashSale.initialStock;
    const percentageSold = (flashSale.sold / flashSale.initialStock) * 100;

    const image = PlaceHolderImages.find((img) => img.id === product.imageIds[0]);
    const displayVariant = product.variants[0];
    const discountPercentage = displayVariant.price > 0 ? Math.round(((displayVariant.price - flashSale.price) / displayVariant.price) * 100) : 0;

    const isWishlisted = wishlistItems.some(item => item.id === product.id);

    const handleWishlistToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isWishlisted) {
            removeFromWishlist(product.id);
        } else {
            addToWishlist(product);
        }
    };
    
    const handleProductAction = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Always open modal for flash sale items to show details, even for simple products
        openModal(product);
    }

    return (
        <Link 
            href={`/product/${product.id}`} 
            className={cn(
                "group relative bg-card border border-destructive/30 rounded-lg p-2 transition-all duration-300 flex flex-col h-full shadow-sm hover:shadow-lg hover:-translate-y-1",
                isSoldOut && "pointer-events-none opacity-60"
            )}
        >
            {/* 1. Media Layer - Square Shape */}
            <div className="relative aspect-square overflow-hidden rounded-md bg-secondary">
                {image && (
                    <Image 
                        src={image.imageUrl}
                        alt={product.name} 
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        data-ai-hint={image.imageHint}
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                    />
                )}
                {isSoldOut && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white font-bold text-base bg-destructive/80 px-3 py-1.5 rounded-lg">SOLD OUT</span>
                    </div>
                )}
                {/* Discount Badge */}
                {!isSoldOut && discountPercentage > 0 && (
                    <span className="absolute top-1 left-1 bg-destructive text-destructive-foreground text-[9px] font-bold px-1.5 py-0.5 rounded">
                        -{discountPercentage}%
                    </span>
                )}
                
                <Button 
                    size="icon" 
                    className="absolute top-1 right-1 h-7 w-7 bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={handleWishlistToggle}
                >
                    <Heart className={cn("h-4 w-4 transition-all", isWishlisted && "fill-destructive text-destructive")} />
                </Button>
            </div>

            {/* 2. Info & Pricing Layer */}
            <div className="mt-2 flex-grow flex flex-col">
                <h3 className="text-foreground text-[13px] font-semibold line-clamp-2 leading-tight min-h-[32px]">
                    {product.name}
                </h3>
                
                <div className="flex-grow"></div>

                <div className="mt-1 flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-destructive font-bold text-sm">৳{flashSale.price.toFixed(2)}</span>
                        <span className="text-muted-foreground text-[10px] line-through">৳{displayVariant.price.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center text-[11px] text-muted-foreground">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-muted-foreground ml-0.5">{product.rating}</span>
                    </div>
                </div>
            </div>
            
            {/* 3. Flash Sale Progress */}
             <div className="mt-2 space-y-1">
                 <Progress value={percentageSold} className={cn("h-2", percentageSold > 80 ? "bg-red-200 [&>div]:bg-red-500" : "bg-destructive/30 [&>div]:bg-destructive")} />
                 <p className="text-xs font-semibold text-destructive flex items-center gap-1">
                    <Flame className="w-3 h-3"/>
                    {isSoldOut ? `All ${flashSale.initialStock} sold!` : `${flashSale.sold} sold`}
                </p>
             </div>

            {/* 4. Action Layer */}
            <div className="mt-2">
                <Button 
                    variant={isSoldOut ? "secondary" : "destructive"}
                    className="w-full h-auto text-[11px] font-bold py-1.5 rounded"
                    onClick={handleProductAction}
                    disabled={isSoldOut}
                >
                    {isSoldOut ? 'Sold Out' : 'Grab Now'}
                </Button>
            </div>
        </Link>
    );
}
