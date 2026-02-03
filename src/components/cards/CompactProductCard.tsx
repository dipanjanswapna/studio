import Image from "next/image";
import { Button } from "@/components/ui/button";
import type { Product } from "@/data/types";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Star, Heart, Trophy, Tags, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useProductAction } from "@/context/ProductActionContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/hooks/useWishlist";
import { ProductCardSkeleton } from "./ProductCardSkeleton";
import { Badge } from "@/components/ui/badge";

type CompactProductCardProps = {
  product: Product;
  rank?: number;
};

export function CompactProductCard({ product, rank }: CompactProductCardProps) {
  const { openModal } = useProductAction();
  const { addToMainCart } = useCart();
  const { wishlistItems, addToWishlist, removeFromWishlist } = useWishlist();

  if (!product || !product.variants || product.variants.length === 0 || !product.imageIds) {
    return <ProductCardSkeleton />;
  }
  
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
  
  const image = PlaceHolderImages.find((img) => img.id === product.imageIds?.[0]);
  const displayVariant = product.variants[0];

  const { deal, flashSale, discountPercentage } = product;

  let finalPrice = displayVariant.price;
  let originalPrice = null;
  let badgeElement = null;

  if (rank && rank <= 12) {
    badgeElement = (
      <div className="absolute top-1 left-1 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 z-10">
        <Trophy className="w-3 h-3"/>
        <span>#{rank}</span>
      </div>
    );
  } else if (flashSale) {
    const discount = Math.round(((displayVariant.price - flashSale.price) / displayVariant.price) * 100);
    badgeElement = (
      <Badge variant="destructive" className="absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded z-10">
        <Flame className="w-3 h-3 mr-1"/> -{discount}%
      </Badge>
    );
    finalPrice = flashSale.price;
    originalPrice = displayVariant.price;
  } else if (deal) {
     badgeElement = (
      <Badge variant="success" className="absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded z-10">
        <Tags className="w-3 h-3 mr-1"/> DEAL
      </Badge>
    );
    finalPrice = displayVariant.price * (1 - deal.discountPercentage / 100);
    originalPrice = displayVariant.price;
  } else if (discountPercentage) {
    badgeElement = (
      <Badge className="absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded z-10">
        -{discountPercentage}%
      </Badge>
    );
    finalPrice = displayVariant.price * (1 - discountPercentage / 100);
    originalPrice = displayVariant.price;
  }
  
  const handleProductAction = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const isSimpleProduct = product.variants.length === 1;
    const defaultVariant = product.variants[0];

    if (isSimpleProduct && defaultVariant.stock > 0) {
        addToMainCart(product, defaultVariant, 1);
    } else {
        openModal(product);
    }
  }

  return (
    <Link href={`/product/${product.id}`} className="group relative bg-card border rounded-lg p-2 transition-all duration-300 flex flex-col h-full shadow-sm hover:shadow-lg hover:-translate-y-1">
      
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
        
        {badgeElement}
        
        <Button 
            size="icon" 
            className="absolute top-1 right-1 h-7 w-7 bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleWishlistToggle}
        >
            <Heart className={cn("h-4 w-4 transition-all", isWishlisted && "fill-destructive text-destructive")} />
        </Button>

      </div>

      <div className="mt-2 flex-grow flex flex-col">
        <h3 className="text-foreground text-[13px] font-semibold line-clamp-2 leading-tight min-h-[32px]">
          {product.name}
        </h3>
        
        <div className="flex-grow"></div>

        <div className="mt-1 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-primary font-bold text-sm">৳{finalPrice.toFixed(2)}</span>
            {originalPrice && (
              <span className="text-muted-foreground text-[10px] line-through">৳{originalPrice.toFixed(2)}</span>
            )}
          </div>
          <div className="flex items-center text-[11px] text-muted-foreground">
             <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
             <span className="text-muted-foreground ml-0.5">{product.rating}</span>
          </div>
        </div>
      </div>

      <div className="mt-2">
        <Button 
          variant="default"
          className="w-full h-auto text-[11px] font-bold py-1.5 rounded hover:bg-primary/90"
          onClick={handleProductAction}
        >
          Add to Cart
        </Button>
      </div>
      
    </Link>
  );
}
