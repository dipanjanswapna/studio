'use client';

import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useToast } from '@/hooks/use-toast';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { CreditCard, Truck, Plus } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useRequiredAction } from '@/context/RequiredActionContext';
import { useAuth } from '@/context/authContext';
import { useFirestore, useCollection } from '@/firebase';
import { addDoc, collection, serverTimestamp, updateDoc, query } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { PaymentMethod } from '@/data/types';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';


const shippingSchema = z.object({
  name: z.string().min(2, "Name is required"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  phone: z.string().min(11, "A valid phone number is required"),
  paymentMethod: z.enum(['cod', 'online'], { required_error: 'Please select a payment method' }),
});

type ShippingFormValues = z.infer<typeof shippingSchema>;

export default function CheckoutPage() {
  const { mainCartItems, mainCartTotal, clearMainCart } = useCart();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const db = useFirestore();

  const paymentsRef = useMemo(() => user ? collection(db, 'users', user.uid, 'paymentMethods') : null, [user, db]);
  const paymentsQuery = useMemo(() => paymentsRef ? query(paymentsRef) : undefined, [paymentsRef]);
  const { data: paymentMethods, loading: paymentsLoading } = useCollection<PaymentMethod>(paymentsQuery);
  
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  
  const form = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      name: user?.name || "",
      address: "",
      city: "",
      phone: user?.phone || "",
      paymentMethod: "cod",
    },
  });
  
  useEffect(() => {
    if (paymentMethods && paymentMethods.length > 0) {
      const defaultCard = paymentMethods.find(p => p.isDefault) || paymentMethods[0];
      if (defaultCard) {
        setSelectedCardId(defaultCard.id);
      }
    }
  }, [paymentMethods]);
  
  useEffect(() => {
    if (mainCartItems.length === 0 && !router.isReady) {
       // Wait for router to be ready to avoid premature redirect
       return;
    }
    if (mainCartItems.length === 0) {
      router.replace('/shop');
    }
  }, [mainCartItems, router]);

  const paymentMethodWatcher = form.watch('paymentMethod');
  const deliveryFee = 60;
  const grandTotal = mainCartTotal + deliveryFee;

  const onSubmit = (data: ShippingFormValues) => {
     if (!user || mainCartItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "You must be logged in and have items in your cart.",
      });
      return;
    }
    
    if (data.paymentMethod === 'online' && !selectedCardId) {
        toast({
            variant: "destructive",
            title: "Payment method required",
            description: "Please select a card or add a new one to proceed.",
        });
        return;
    }

    let paymentMethodString = 'Cash on Delivery';
    if (data.paymentMethod === 'online' && selectedCardId) {
        const selectedCard = paymentMethods?.find(p => p.id === selectedCardId);
        if (selectedCard) {
            paymentMethodString = `${selectedCard.type} ending in ${selectedCard.last4}`;
        } else {
             // This case should ideally not happen if UI is correct
            toast({ variant: "destructive", title: "Invalid Card", description: "Selected card not found. Please try again." });
            return;
        }
    }


    const orderData = {
      userId: user.uid,
      customerInfo: {
        name: data.name,
        email: user.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
      },
      items: mainCartItems.map(item => ({
        productId: item.product.id,
        variantId: item.variant.id,
        productName: item.product.name,
        variantName: item.variant.name,
        quantity: item.quantity,
        price: item.product.flashSale ? item.product.flashSale.price : item.variant.price,
        imageUrl: PlaceHolderImages.find(img => img.id === (item.variant.imageIds?.[0] || item.product.imageIds[0]))?.imageUrl || '',
        productImageId: item.variant.imageIds?.[0] || item.product.imageIds[0] || '',
      })),
      subtotal: mainCartTotal,
      shippingFee: deliveryFee,
      total: grandTotal,
      status: 'Pending',
      paymentMethod: paymentMethodString,
      createdAt: serverTimestamp(),
      shortId: '',
    };

    const ordersRef = collection(db, 'orders');
    
    addDoc(ordersRef, orderData)
      .then(async (docRef) => {
        const shortId = `#AV-${docRef.id.slice(-6).toUpperCase()}`;
        await updateDoc(docRef, { shortId });
        
        toast({
          title: "Order Placed Successfully!",
          description: `Thank you for your purchase. Your order ${shortId} is being processed.`,
        });
        clearMainCart();
        router.push('/profile/orders');
      })
      .catch((serverError) => {
        console.error("Order submission failed: ", serverError);
        const permissionError = new FirestorePermissionError({
            path: 'orders',
            operation: 'create',
            requestResourceData: orderData,
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({
            variant: "destructive",
            title: "Order Failed",
            description: "Could not place your order. Please try again.",
        });
      });
  };
  
  if (mainCartItems.length === 0) {
    return (
        <div className="container py-12 text-center">
            <h1 className="text-xl font-semibold">Your cart is empty</h1>
            <p className="text-muted-foreground mt-2">Redirecting you to the shop to find some great products!</p>
        </div>
    );
  }

  return (
    <div className="container py-8 md:py-12">
      <Breadcrumb className="mb-8">
          <BreadcrumbList>
              <BreadcrumbItem>
                  <BreadcrumbLink asChild><Link href="/">Home</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                  <BreadcrumbLink asChild><Link href="/cart">Cart</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                  <BreadcrumbPage>Checkout</BreadcrumbPage>
              </BreadcrumbItem>
          </BreadcrumbList>
      </Breadcrumb>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2">
           <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Shipping Details</CardTitle>
                        <CardDescription>Enter the address where you want to receive your order.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl><Input placeholder="e.g. John Doe" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone Number</FormLabel>
                                    <FormControl><Input placeholder="e.g. 01712345678" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>City / District</FormLabel>
                                    <FormControl><Input placeholder="e.g. Dhaka" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                    <FormLabel>Street Address</FormLabel>
                                    <FormControl><Input placeholder="e.g. House 123, Road 45, Gulshan 2" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
                
                 <Card>
                    <CardHeader>
                        <CardTitle>Payment Method</CardTitle>
                        <CardDescription>Choose how you'd like to pay for your order.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <FormField
                            control={form.control}
                            name="paymentMethod"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                       <RadioGroup
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                        >
                                            <Label htmlFor="cod" className="flex flex-col items-start gap-3 rounded-lg border p-4 cursor-pointer hover:bg-accent has-[input:checked]:bg-primary/10 has-[input:checked]:border-primary transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <RadioGroupItem value="cod" id="cod" />
                                                    <Truck className="h-6 w-6 text-primary" />
                                                    <span className="font-semibold text-base">Cash on Delivery</span>
                                                </div>
                                                <p className="text-sm text-muted-foreground ml-8">Pay with cash when your order is delivered.</p>
                                            </Label>
                                             <Label htmlFor="online" className="flex flex-col items-start gap-3 rounded-lg border p-4 cursor-pointer hover:bg-accent has-[input:checked]:bg-primary/10 has-[input:checked]:border-primary transition-colors">
                                                 <div className="flex items-center gap-3">
                                                    <RadioGroupItem value="online" id="online" />
                                                    <CreditCard className="h-6 w-6 text-primary" />
                                                    <span className="font-semibold text-base">Online Payment</span>
                                                 </div>
                                                 <p className="text-sm text-muted-foreground ml-8">Pay with your saved card.</p>
                                            </Label>
                                       </RadioGroup>
                                    </FormControl>
                                    <FormMessage className="pt-2" />
                                </FormItem>
                            )}
                        />
                        {paymentMethodWatcher === 'online' && (
                            <div className="mt-6 space-y-4">
                                <Separator />
                                <h3 className="font-semibold">Select a Card</h3>
                                {paymentsLoading ? (
                                     <div className="space-y-2">
                                        <Skeleton className="h-16 w-full" />
                                        <Skeleton className="h-16 w-full" />
                                    </div>
                                ) : paymentMethods && paymentMethods.length > 0 ? (
                                    <RadioGroup value={selectedCardId || ''} onValueChange={setSelectedCardId} className="space-y-2">
                                        {paymentMethods.map(card => (
                                            <Label key={card.id} htmlFor={card.id} className={cn("flex items-center gap-4 rounded-lg border p-4 cursor-pointer hover:bg-accent has-[input:checked]:bg-primary/10 has-[input:checked]:border-primary transition-colors", card.isDefault && "border-primary/50")}>
                                                <RadioGroupItem value={card.id} id={card.id} />
                                                <CreditCard className="h-6 w-6 text-muted-foreground" />
                                                <div className="flex-grow">
                                                    <p className="font-semibold capitalize">{card.type} ending in {card.last4}</p>
                                                    <p className="text-sm text-muted-foreground">Expires {card.expiry}</p>
                                                </div>
                                                {card.isDefault && <Badge variant="secondary">Default</Badge>}
                                            </Label>
                                        ))}
                                    </RadioGroup>
                                ) : (
                                    <div className="text-center py-6 text-sm border-dashed border-2 rounded-lg">
                                        <p className="text-muted-foreground">You have no saved payment methods.</p>
                                        <Button variant="link" asChild><Link href="/profile/payments">Add a Card</Link></Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit" size="lg" className="w-full sm:w-auto" loading={form.formState.isSubmitting}>
                        Place Order for ৳{grandTotal.toFixed(2)}
                    </Button>
                </div>
            </form>
          </Form>
        </div>

        <aside className="lg:col-span-1 sticky top-36">
            <Card>
                <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                        {mainCartItems.map(item => {
                             const image = PlaceHolderImages.find((img) => img.id === (item.variant.imageIds?.[0] || item.product.imageIds[0]));
                             return (
                                <div key={item.variant.id} className="flex items-start gap-4">
                                     {image && (
                                        <div className="relative w-16 h-16 rounded-md border overflow-hidden flex-shrink-0">
                                            <Image
                                                src={image.imageUrl}
                                                alt={item.product.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                     )}
                                    <div className="flex-grow min-w-0">
                                        <p className="font-medium text-sm leading-tight line-clamp-2">{item.product.name}</p>
                                        <p className="text-xs text-muted-foreground">{item.variant.name}</p>
                                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                    </div>
                                    <p className="text-sm font-semibold whitespace-nowrap">৳{(item.variant.price * item.quantity).toFixed(2)}</p>
                                </div>
                             )
                        })}
                    </div>
                     <Separator className="my-4" />
                     <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="font-medium">৳{mainCartTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Delivery Fee</span>
                            <span className="font-medium">৳{deliveryFee.toFixed(2)}</span>
                        </div>
                     </div>
                     <Separator className="my-4" />
                     <div className="flex justify-between font-bold text-lg">
                        <span>Grand Total</span>
                        <span>৳{grandTotal.toFixed(2)}</span>
                     </div>
                </CardContent>
            </Card>
        </aside>
      </div>
    </div>
  );
}
