'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  File,
  PlusCircle,
  Search,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/context/authContext';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, addDoc, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { Product, Category } from '@/data/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ProductModal } from '@/components/modals/ProductModal';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


const PRODUCTS_PER_PAGE = 10;

export default function VendorProductsPage() {
  const { user } = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);


  const productsQuery = useMemo(() => {
    if (!user) return null;
    return query(collection(db, 'products'), where('vendorId', '==', user.uid));
  }, [user, db]);

  const { data: products, loading: productsLoading } = useCollection<Product>(productsQuery);

  const categoriesQuery = useMemo(() => user ? query(collection(db, 'categories')) : null, [user, db]);
  const { data: categories } = useCollection<Category>(categoriesQuery);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const uniqueCategories = useMemo(() => {
    if (!products) return [];
    const categories = new Set(products.map(p => p.category));
    return ['all', ...Array.from(categories)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products
      .filter(product => {
        const searchMatch =
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.id.toLowerCase().includes(searchQuery.toLowerCase());

        const categoryMatch =
          categoryFilter === 'all' || product.category === categoryFilter;

        const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
        const status = totalStock > 0 ? 'active' : 'archived';
        const statusMatch =
          statusFilter === 'all' || status === statusFilter;

        return searchMatch && categoryMatch && statusMatch;
      });
  }, [products, searchQuery, categoryFilter, statusFilter]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );
  
  const handleOpenModal = (product: Product | null = null) => {
    setProductToEdit(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setProductToEdit(null);
  };
  
  const handleSaveProduct = async (productData: Omit<Product, 'id'>) => {
    if (!user) return;

    const dataToSave = {
        ...productData,
        vendorId: user.uid
    };

    try {
        if (productToEdit) {
            const productRef = doc(db, 'products', productToEdit.id);
            await updateDoc(productRef, dataToSave);
            toast({ title: "Product Updated", description: `"${dataToSave.name}" has been updated.` });
        } else {
            await addDoc(collection(db, 'products'), {...dataToSave, createdAt: serverTimestamp()});
            toast({ title: "Product Created", description: `"${dataToSave.name}" has been added and is pending review.` });
        }
    } catch (e: any) {
        const permissionError = new FirestorePermissionError({
            path: `products/${productToEdit?.id || ''}`,
            operation: productToEdit ? 'update' : 'create',
            requestResourceData: dataToSave,
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({ variant: 'destructive', title: "Operation Failed", description: "Could not save the product." });
    }
  };

  const handleDeleteConfirm = (product: Product) => {
    setProductToDelete(product);
    setIsAlertOpen(true);
  };
  
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
        await deleteDoc(doc(db, 'products', productToDelete.id));
        toast({ title: "Product Deleted", description: `"${productToDelete.name}" has been permanently deleted.` });
    } catch(e: any) {
        const permissionError = new FirestorePermissionError({
            path: `products/${productToDelete.id}`,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({ variant: 'destructive', title: "Delete Failed", description: "Could not delete the product." });
    } finally {
        setIsAlertOpen(false);
        setProductToDelete(null);
    }
  };


  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };


  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>My Products</CardTitle>
              <CardDescription>
                Manage your products and view their sales performance.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                    <File className="h-3.5 w-3.5 mr-2" />
                    Export
                </Button>
                <Button size="sm" onClick={() => handleOpenModal()}>
                    <PlusCircle className="h-3.5 w-3.5 mr-2" />
                    Add Product
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
                    placeholder="Search products..."
                    className="w-full rounded-lg bg-background pl-8"
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                    }}
                />
            </div>
            <div className="grid grid-cols-2 sm:flex items-center gap-4 w-full sm:w-auto">
                <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setCurrentPage(1); }}>
                    <SelectTrigger className="w-full sm:w-[160px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                </Select>
                 <Select value={categoryFilter} onValueChange={(value) => { setCategoryFilter(value); setCurrentPage(1); }}>
                    <SelectTrigger className="w-full sm:w-[160px]">
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                        {uniqueCategories.map(category => (
                            <SelectItem key={category} value={category} className="capitalize">
                                {category === 'all' ? 'All Categories' : category}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px] hidden sm:table-cell">
                  Image
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Price</TableHead>
                <TableHead className="hidden md:table-cell">
                  Total Stock
                </TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productsLoading ? (
                [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                        <TableCell className="hidden sm:table-cell">
                            <Skeleton className="h-12 w-12 rounded-md" />
                        </TableCell>
                        <TableCell>
                            <Skeleton className="h-4 w-48" />
                        </TableCell>
                        <TableCell>
                            <Skeleton className="h-6 w-20 rounded-full" />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                            <Skeleton className="h-4 w-16" />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                            <Skeleton className="h-4 w-12" />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                             <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                            <Skeleton className="h-8 w-8 ml-auto" />
                        </TableCell>
                    </TableRow>
                ))
              ) : paginatedProducts.length > 0 ? (
                paginatedProducts.map(product => {
                  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
                  const price = product.variants[0].price;
                  const image = PlaceHolderImages.find(img => img.id === product.imageIds[0]);

                  return (
                    <TableRow key={product.id}>
                      <TableCell className="hidden sm:table-cell">
                        {image ? (
                           <Image
                            alt={product.name}
                            className="aspect-square rounded-md object-cover"
                            height="48"
                            src={image.imageUrl}
                            width="48"
                          />
                        ) : (
                            <div className="h-12 w-12 rounded-md bg-muted" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        <Link href={`/product/${product.id}`} className="hover:underline" target="_blank">{product.name}</Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant={totalStock > 0 ? 'outline' : 'secondary'} className={totalStock > 0 ? 'bg-green-100 text-green-800' : ''}>
                          {totalStock > 0 ? 'Active' : 'Archived'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        ৳{price.toFixed(2)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {totalStock}
                      </TableCell>
                      <TableCell className="hidden md:table-cell capitalize">
                        {product.category}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-haspopup="true"
                              size="icon"
                              variant="ghost"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleOpenModal(product)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem>Duplicate</DropdownMenuItem>
                             <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteConfirm(product)}>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center"
                  >
                    You have not added any products yet.
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
              {(currentPage - 1) * PRODUCTS_PER_PAGE + 1}-
              {Math.min(currentPage * PRODUCTS_PER_PAGE, filteredProducts.length)}
            </strong>{' '}
            of <strong>{filteredProducts.length}</strong> products
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
     <ProductModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveProduct}
        productToEdit={productToEdit}
        categories={categories || []}
        vendors={[]}
      />
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                product "{productToDelete?.name}".
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
                onClick={handleDeleteProduct}
                className="bg-destructive hover:bg-destructive/90"
            >
                Delete
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
