'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { QrCode, Barcode as BarcodeIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTheme } from 'next-themes';

type ProductIdentifierProps = {
  sku: string;
  barcodeValue: string;
  productId: string;
  productName: string;
};

export function ProductIdentifier({ sku, barcodeValue, productId, productName }: ProductIdentifierProps) {
  const [productUrl, setProductUrl] = useState('');
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    // Ensure this runs only on the client to safely access window.location
    // Now includes the SKU for a direct link to the selected variant.
    const url = new URL(`${window.location.origin}/product/${productId}`);
    if (sku) {
      url.searchParams.set('sku', sku);
    }
    setProductUrl(url.toString());
  }, [productId, sku]);

  const isDark = resolvedTheme === 'dark';
  const barColor = isDark ? 'F5F5F5' : '0A0A0A';
  const bgColor = isDark ? '0A0A0A' : 'FAFAFA';
  const textColor = isDark ? 'F5F5F5' : '0A0A0A';

  const qrCodeApiUrl = productUrl 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(productUrl)}`
    : '';

  const barcodeApiUrl = barcodeValue
    ? `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(barcodeValue)}&scale=3&includetext&barcolor=${barColor}&backgroundcolor=${bgColor}&textcolor=${textColor}`
    : '';

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-xl bg-secondary/30">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-muted-foreground">SKU:</span>
        <span className="text-sm font-bold font-mono">{sku.toUpperCase()}</span>
      </div>

      <div className="grid grid-cols-2 gap-4 items-center">
        {/* Barcode Section */}
        <Dialog>
          <DialogTrigger asChild>
            <button className="flex flex-col items-center justify-center bg-card p-3 rounded-lg border h-full text-center hover:bg-accent transition-colors w-full" disabled={!barcodeApiUrl}>
              <div className="p-1 border-2 border-foreground rounded-md">
                  <BarcodeIcon className="w-10 h-10 text-foreground" />
              </div>
              <p className="text-[9px] mt-1.5 text-muted-foreground tracking-wide">View Barcode</p>
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Barcode for {productName}</DialogTitle>
            </DialogHeader>
            <div className="mt-4 flex flex-col items-center justify-center text-center">
              {barcodeApiUrl ? (
                 <Image
                    src={barcodeApiUrl}
                    alt={`Barcode for ${productName}`}
                    width={300}
                    height={100}
                    className="object-contain rounded"
                  />
              ) : <div className="w-64 h-24 bg-muted animate-pulse rounded-lg" />}
              <p className="mt-4 text-sm text-muted-foreground">
                This barcode can be used for inventory management.
              </p>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* QR Code Section */}
        <Dialog>
          <DialogTrigger asChild>
            <button className="flex flex-col items-center justify-center bg-card p-3 rounded-lg border h-full text-center hover:bg-accent transition-colors w-full" disabled={!qrCodeApiUrl}>
              <div className="p-1 border-2 border-foreground rounded-md">
                  <QrCode className="w-10 h-10 text-foreground" />
              </div>
              <p className="text-[9px] mt-1.5 text-muted-foreground tracking-wide">Scan for Product Details</p>
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Scan QR Code for {productName}</DialogTitle>
            </DialogHeader>
            <div className="mt-4 flex flex-col items-center justify-center text-center">
              {qrCodeApiUrl ? (
                <Image
                  src={qrCodeApiUrl}
                  alt={`QR Code for ${productName}`}
                  width={256}
                  height={256}
                  className="rounded-lg border bg-white p-2"
                />
              ) : (
                 <div className="w-64 h-64 bg-muted animate-pulse rounded-lg" />
              )}
              <p className="mt-4 text-sm text-muted-foreground">
                Scan this code with your phone's camera to open the product page.
              </p>
              {productUrl && (
                <p className="mt-2 text-xs text-muted-foreground break-all">{productUrl}</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
