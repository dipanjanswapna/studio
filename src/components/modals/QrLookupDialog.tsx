import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { products } from "@/data/products";
import type { DialogProps } from "@radix-ui/react-dialog";

interface QrLookupDialogProps extends DialogProps {
    onProductFound?: (productId: string) => void;
}


export function QrLookupDialog({ onProductFound, ...props }: QrLookupDialogProps) {
  const [productId, setProductId] = useState("");
  const { toast } = useToast();

  const handleLookup = () => {
    if (onProductFound) {
        onProductFound(productId);
    } else {
        // Fallback to original toast behavior if no callback is provided
        const foundProduct = products.find((p) => p.id === productId);
        if (foundProduct) {
          const price = foundProduct.variants.length > 0 ? foundProduct.variants[0].price : 0;
          toast({
            title: "Product Found!",
            description: `${foundProduct.name} - starting from ৳${price.toFixed(2)}`,
          });
        } else {
          toast({
            variant: "destructive",
            title: "Product Not Found",
            description: "The entered Product ID does not exist.",
          });
        }
    }
    setProductId("");
    // We don't close the dialog from here, the parent component does.
  };

  return (
    <Dialog {...props}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>QR Code Product Lookup</DialogTitle>
          <DialogDescription>
            Simulate scanning a QR code by entering the product ID below.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            id="productId"
            placeholder="e.g., p1, p2, ..."
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
          />
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleLookup}
            disabled={!productId}
          >
            Find Product
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
