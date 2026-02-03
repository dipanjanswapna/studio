'use client';
import { useMemo, useState } from 'react';
import {
  File,
  MoreHorizontal,
  PlusCircle,
  FolderKanban,
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
import type { Category } from '@/data/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getIcon } from '@/lib/icons';
import { useAuth } from '@/context/authContext';
import { CategoryModal } from '@/components/modals/CategoryModal';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function AdminCategoriesPage() {
    const db = useFirestore();
    const { user } = useAuth();
    const { toast } = useToast();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);

    const categoriesQuery = useMemo(() => {
        if (!user) return null;
        return query(collection(db, 'categories'), orderBy('order'));
    }, [user, db]);

    const { data: categories, loading } = useCollection<Category>(categoriesQuery);
    
    const handleOpenModal = (category: Category | null = null) => {
        setCategoryToEdit(category);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCategoryToEdit(null);
    };

    const handleSaveCategory = async (categoryData: Omit<Category, 'id' | 'groups'>) => {
        if (!user) return;

        try {
            if (categoryToEdit) {
                const categoryRef = doc(db, 'categories', categoryToEdit.id);
                await updateDoc(categoryRef, categoryData);
                toast({ title: "Category Updated", description: `"${categoryData.name}" has been updated.` });
            } else {
                await addDoc(collection(db, 'categories'), categoryData);
                toast({ title: "Category Created", description: `"${categoryData.name}" has been added.` });
            }
        } catch (e: any) {
            const permissionError = new FirestorePermissionError({
                path: `categories/${categoryToEdit?.id || ''}`,
                operation: categoryToEdit ? 'update' : 'create',
                requestResourceData: categoryData,
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({ variant: 'destructive', title: "Operation Failed", description: "Could not save the category." });
        }
    };
    
    const handleDeleteCategory = async (categoryId: string) => {
        try {
            await deleteDoc(doc(db, 'categories', categoryId));
            toast({ title: "Category Deleted", description: "The category has been successfully removed." });
        } catch(e: any) {
             const permissionError = new FirestorePermissionError({
                path: `categories/${categoryId}`,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({ variant: 'destructive', title: "Delete Failed", description: "Could not delete the category." });
        }
    };

  return (
    <>
      <Card>
        <CardHeader>
           <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>Manage Categories</CardTitle>
                <CardDescription>
                  Organize your products into categories for the mega menu and shop page.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                      <File className="h-3.5 w-3.5 mr-2" />
                      Export
                  </Button>
                   <Button size="sm" onClick={() => handleOpenModal()}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Create New Category
                  </Button>
              </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Icon</TableHead>
                  <TableHead>Category Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Order</TableHead>
                  <TableHead className="hidden md:table-cell">Groups</TableHead>
                  <TableHead className="hidden md:table-cell">Subcategories</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-10" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-10" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : categories && categories.length > 0 ? (
                  categories.map(category => {
                      const Icon = getIcon(category.iconName || 'HelpCircle');
                      const totalSubcategories = category.groups?.reduce((acc, group) => acc + group.subcategories.length, 0) || 0;
                    return (
                    <TableRow key={category.id}>
                      <TableCell>
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                              <Icon className="h-5 w-5 text-muted-foreground" />
                          </div>
                      </TableCell>
                      <TableCell className="font-medium">
                          {category.name}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                          {category.order}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{category.groups?.length || 0}</TableCell>
                      <TableCell className="hidden md:table-cell">{totalSubcategories}</TableCell>
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
                            <DropdownMenuItem onClick={() => handleOpenModal(category)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem>Duplicate</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteCategory(category.id)}>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center gap-4">
                          <FolderKanban className="w-12 h-12 text-muted-foreground/30" />
                          <div className="space-y-1">
                              <h3 className="font-semibold">No Categories Found</h3>
                              <p className="text-sm text-muted-foreground">You haven't created any product categories yet.</p>
                          </div>
                          <Button onClick={() => handleOpenModal()}>Create Your First Category</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <CategoryModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveCategory} categoryToEdit={categoryToEdit} />
    </>
  );
}
