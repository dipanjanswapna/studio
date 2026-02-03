'use client';
import { useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { useDoc, useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import type { Order } from '@/data/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

import {
  ArrowLeft,
  ChevronLeft,
  Copy,
  CreditCard,
  File,
  MoreVertical,
  Truck,
} from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@/components/ui/pagination';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function OrderDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const db = useFirestore();
  const { toast } = useToast();

  const orderRef = useMemo(() => id ? doc(db, 'orders', id as string) : null, [id, db]);
  const { data: order, loading } = useDoc<Order>(orderRef);
  
  const handleStatusChange = async (newStatus: Order['status']) => {
    if (!orderRef) return;
    try {
        await updateDoc(orderRef, { status: newStatus });
        toast({
            title: 'Status Updated',
            description: `Order status changed to ${newStatus}.`,
        });
    } catch(e) {
        const permissionError = new FirestorePermissionError({
            path: orderRef.path,
            operation: 'update',
            requestResourceData: { status: newStatus },
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({ variant: 'destructive', title: 'Update Failed' });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: `${text} copied to clipboard.`});
  };

  if (loading) {
    return (
        <div className="flex flex-col gap-6">
            <Skeleton className="h-8 w-1/4" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
            </div>
            <Skeleton className="h-96" />
        </div>
    );
  }

  if (!order) {
    return <div>Order not found.</div>;
  }

  return (
    <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                    <Link href="/portal/admin/orders">
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                    Order {order.shortId}
                </h1>
                <Badge variant="outline" className="sm:ml-auto">
                    {order.status}
                </Badge>
            </div>
            <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" size="sm">
                    <File className="h-4 w-4 mr-2" />
                    Invoice
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-3.5 w-3.5" />
                        <span className="sr-only">More</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Customer</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">Delete Order</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle>Order Details</CardTitle>
                    <Select onValueChange={(value: Order['status']) => handleStatusChange(value)} defaultValue={order.status}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Change status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Processing">Processing</SelectItem>
                            <SelectItem value="Shipped">Shipped</SelectItem>
                            <SelectItem value="Delivered">Delivered</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-muted-foreground">
                        <p>Order ID: {order.shortId}</p>
                        <p>Date: {new Date(order.createdAt.seconds * 1000).toLocaleString()}</p>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle>Customer</CardTitle>
                     <Button variant="outline" size="sm" asChild>
                        <Link href="#">View Profile</Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="font-medium">{order.customerInfo.name}</div>
                    <div className="text-sm text-muted-foreground">
                        <p>{order.customerInfo.email}</p>
                        <p>{order.customerInfo.phone}</p>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Shipping Address</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                    <address className="not-italic text-muted-foreground">
                        {order.customerInfo.address}, {order.customerInfo.city}
                    </address>
                </CardContent>
            </Card>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-16 hidden sm:table-cell">Image</TableHead>
                            <TableHead>Product</TableHead>
                            <TableHead className="text-center">Quantity</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {order.items.map(item => (
                            <TableRow key={item.variantId}>
                                <TableCell className="hidden sm:table-cell">
                                    <Image
                                        alt={item.productName}
                                        className="aspect-square rounded-md object-cover"
                                        height="64"
                                        src={item.imageUrl || PlaceHolderImages[0].imageUrl}
                                        width="64"
                                    />
                                </TableCell>
                                <TableCell>
                                    <p className="font-medium">{item.productName}</p>
                                    <p className="text-sm text-muted-foreground">{item.variantName}</p>
                                </TableCell>
                                <TableCell className="text-center">{item.quantity}</TableCell>
                                <TableCell className="text-right">৳{item.price.toFixed(2)}</TableCell>
                                <TableCell className="text-right">৳{(item.price * item.quantity).toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                 </Table>
            </CardContent>
            <CardFooter className="flex flex-col items-end gap-2 bg-muted/50 p-4">
                <div className="flex w-full max-w-xs justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>৳{order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex w-full max-w-xs justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>৳{order.shippingFee.toFixed(2)}</span>
                </div>
                 <Separator className="my-2 max-w-xs" />
                 <div className="flex w-full max-w-xs justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>৳{order.total.toFixed(2)}</span>
                </div>
            </CardFooter>
        </Card>
    </div>
  );
}
