'use client';
import { useState, useMemo } from 'react';
import {
  File,
  ListFilter,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Search
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, where } from 'firebase/firestore';
import type { Order, Product } from '@/data/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/authContext';

const ORDERS_PER_PAGE = 10;

export default function VendorOrdersPage() {
    const db = useFirestore();
    const { user } = useAuth();

    const vendorProductsQuery = useMemo(() => {
        if (!user) return null;
        return query(collection(db, 'products'), where('vendorId', '==', user.uid));
    }, [user, db]);
    const { data: vendorProducts, loading: productsLoading } = useCollection<Product>(vendorProductsQuery);
    
    const allOrdersQuery = useMemo(() => {
      if (!user) return null;
      return query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    }, [user, db]);
    const { data: allOrders, loading: ordersLoading } = useCollection<Order>(allOrdersQuery);
    
    const loading = productsLoading || ordersLoading;

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);

    const vendorOrders = useMemo(() => {
        if (!vendorProducts || !allOrders) return [];
        
        const vendorProductIds = new Set(vendorProducts.map(p => p.id));
        if (vendorProductIds.size === 0) return [];
        
        return allOrders.map(order => {
            const vendorItems = order.items.filter(item => vendorProductIds.has(item.productId));
            if (vendorItems.length > 0) {
                return {
                    ...order,
                    items: vendorItems,
                    total: vendorItems.reduce((acc, item) => acc + item.price * item.quantity, 0)
                };
            }
            return null;
        }).filter((o): o is Order => o !== null);
    }, [vendorProducts, allOrders]);


    const filteredOrders = useMemo(() => {
        return vendorOrders
        .filter(order => {
            const searchMatch = 
                (order.shortId && order.shortId.toLowerCase().includes(searchQuery.toLowerCase())) ||
                order.customerInfo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.customerInfo.email.toLowerCase().includes(searchQuery.toLowerCase());
            
            const statusMatch = statusFilter.length === 0 || statusFilter.includes(order.status);
            
            return searchMatch && statusMatch;
        })
    }, [vendorOrders, searchQuery, statusFilter]);
    
    const totalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE);
    const paginatedOrders = filteredOrders.slice(
        (currentPage - 1) * ORDERS_PER_PAGE,
        currentPage * ORDERS_PER_PAGE
    );

    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    };

    const handlePreviousPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };

    const toggleStatusFilter = (status: string) => {
        setStatusFilter(prev => 
            prev.includes(status) 
            ? prev.filter(s => s !== status) 
            : [...prev, status]
        );
        setCurrentPage(1);
    };

  return (
    <Card>
      <CardHeader>
         <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>My Orders</CardTitle>
              <CardDescription>
                View orders containing your products.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                    <File className="h-3.5 w-3.5 mr-2" />
                    Export
                </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
            <div className="relative w-full sm:flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search by Order ID, Name, or Email..."
                    className="w-full rounded-lg bg-background pl-8"
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                    }}
                />
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1 w-full sm:w-auto">
                    <ListFilter className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Filter</span>
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked={statusFilter.includes('Pending')} onCheckedChange={() => toggleStatusFilter('Pending')}>
                    Pending
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter.includes('Processing')} onCheckedChange={() => toggleStatusFilter('Processing')}>
                    Processing
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter.includes('Shipped')} onCheckedChange={() => toggleStatusFilter('Shipped')}>
                    Shipped
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter.includes('Delivered')} onCheckedChange={() => toggleStatusFilter('Delivered')}>
                    Delivered
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter.includes('Cancelled')} onCheckedChange={() => toggleStatusFilter('Cancelled')}>
                    Cancelled
                </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="text-right">Your Revenue</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(ORDERS_PER_PAGE)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : paginatedOrders.length > 0 ? (
                paginatedOrders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.shortId || `#${order.id.slice(-6).toUpperCase()}`}</TableCell>
                    <TableCell>
                      <div className="font-medium">{order.customerInfo.name}</div>
                      <div className="text-sm text-muted-foreground">{order.customerInfo.email}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{new Date(order.createdAt.seconds * 1000).toLocaleDateString()}</TableCell>
                    <TableCell className="hidden md:table-cell">
                       <Badge
                        variant={
                            order.status === 'Delivered' ? 'success' :
                            order.status === 'Shipped' ? 'info' :
                            order.status === 'Processing' ? 'warning' :
                            order.status === 'Cancelled' ? 'destructive' :
                            'outline'
                        }
                        className="capitalize"
                        >
                        {order.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">৳{order.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Mark as Shipped</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No orders found for your products.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
       <CardFooter>
        <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
          <div>
            Showing{' '}
            <strong>
              {(currentPage - 1) * ORDERS_PER_PAGE + 1}-
              {Math.min(currentPage * ORDERS_PER_PAGE, filteredOrders.length)}
            </strong>{' '}
            of <strong>{filteredOrders.length}</strong> orders
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
