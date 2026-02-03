'use client';
import { useMemo, useState } from 'react';
import Image from 'next/image';
import {
  File,
  MoreHorizontal,
  PlusCircle,
  Award,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import type { Brand } from '@/data/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/authContext';
import { BrandModal } from '@/components/modals/BrandModal';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { PlaceHolderImages } from '@/data/placeholder-images';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function AdminBrandsPage() {
    const db = useFirestore();
    const { user } = useAuth();
    const { toast } = useToast();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [brandToEdit, setBrandToEdit] = useState<Brand | null>(null);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);


    const brandsQuery = useMemo(() => {
        if (!user) return null;
        return query(collection(db, 'brands'), orderBy('order'));
    }, [user, db]);

    const { data: brands, loading } = useCollection<Brand>(brandsQuery);
    
    const handleOpenModal = (brand: Brand | null = null) => {
        setBrandToEdit(brand);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setBrandToEdit(null);
    };

    const handleSaveBrand = async (brandData: Omit<Brand, 'id'>) => {
        if (!user) return;

        try {
            if (brandToEdit) {
                const brandRef = doc(db, 'brands', brandToEdit.id);
                await updateDoc(brandRef, brandData);
                toast({ title: "Brand Updated", description: `"${brandData.name}" has been updated.` });
            } else {
                await addDoc(collection(db, 'brands'), brandData);
                toast({ title: "Brand Created", description: `"${brandData.name}" has been added.` });
            }
        } catch (e: any) {
            const permissionError = new FirestorePermissionError({
                path: `brands/${brandToEdit?.id || ''}`,
                operation: brandToEdit ? 'update' : 'create',
                requestResourceData: brandData,
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({ variant: 'destructive', title: "Operation Failed", description: "Could not save the brand." });
        }
    };
    
    const handleDeleteConfirm = (brand: Brand) => {
        setBrandToDelete(brand);
        setIsAlertOpen(true);
    };

    const handleDeleteBrand = async () => {
        if (!brandToDelete) return;
        try {
            await deleteDoc(doc(db, 'brands', brandToDelete.id));
            toast({ title: "Brand Deleted", description: "The brand has been successfully removed." });
        } catch(e: any) {
             const permissionError = new FirestorePermissionError({
                path: `brands/${brandToDelete.id}`,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({ variant: 'destructive', title: "Delete Failed", description: "Could not delete the brand." });
        } finally {
            setIsAlertOpen(false);
            setBrandToDelete(null);
        }
    };

  return (
    <>
      <Card>
        <CardHeader>
           <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>Manage Brands</CardTitle>
                <CardDescription>
                  Add, edit, and organize your product brands.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                      <File className="h-3.5 w-3.5 mr-2" />
                      Export
                  </Button>
                   <Button size="sm" onClick={() => handleOpenModal()}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Create New Brand
                  </Button>
              </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Logo</TableHead>
                  <TableHead>Brand Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Order</TableHead>
                  <TableHead className="hidden md:table-cell">Featured</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-10 w-10 rounded-md" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : brands && brands.length > 0 ? (
                  brands.map(brand => {
                      const logo = PlaceHolderImages.find(img => img.id === brand.logoImageId);
                    return (
                    <TableRow key={brand.id}>
                      <TableCell>
                          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted p-1">
                              {logo ? <Image src={logo.imageUrl} alt={brand.name} width={40} height={40} className="object-contain"/> : null}
                          </div>
                      </TableCell>
                      <TableCell className="font-medium">
                          {brand.name}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                          {brand.order}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                          {brand.isFeatured ? <Badge>Yes</Badge> : <Badge variant="secondary">No</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleOpenModal(brand)}>Edit</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteConfirm(brand)}>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center gap-4">
                          <Award className="w-12 h-12 text-muted-foreground/30" />
                          <div className="space-y-1">
                              <h3 className="font-semibold">No Brands Found</h3>
                              <p className="text-sm text-muted-foreground">You haven't created any brands yet.</p>
                          </div>
                          <Button onClick={() => handleOpenModal()}>Create Your First Brand</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <BrandModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveBrand} brandToEdit={brandToEdit} />
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the brand "{brandToDelete?.name}".
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
                onClick={handleDeleteBrand}
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
