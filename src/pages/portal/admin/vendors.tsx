'use client';
import { useState, useMemo } from 'react';
import {
  MoreHorizontal,
  Search,
  UserPlus
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { User, UserRole } from '@/context/authContext';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/authContext';
import { UserModal } from '@/components/modals/UserModal';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


const USERS_PER_PAGE = 10;

export default function AdminVendorsPage() {
    const db = useFirestore();
    const { user: adminUser } = useAuth();
    const { toast } = useToast();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    const vendorsQuery = useMemo(() => {
        if (!adminUser) return null;
        return query(collection(db, 'users'), where('role', '==', 'VENDOR'));
    }, [adminUser, db]);

    const { data: allVendors, loading } = useCollection<User>(vendorsQuery);

    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const filteredVendors = useMemo(() => {
        if (!allVendors) return [];
        return allVendors
        .filter(user => {
            const searchMatch = 
                (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (user.phone && user.phone.includes(searchQuery));
            
            return searchMatch;
        })
    }, [allVendors, searchQuery]);
    
    const totalPages = Math.ceil(filteredVendors.length / USERS_PER_PAGE);
    const paginatedVendors = useMemo(() => filteredVendors.slice(
        (currentPage - 1) * USERS_PER_PAGE,
        currentPage * USERS_PER_PAGE
    ), [filteredVendors, currentPage]);

    const handleOpenModal = (user: User | null = null) => {
        setUserToEdit(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setUserToEdit(null);
    };

    const handleSaveUser = async (userData: Omit<User, 'uid' | 'membershipId' | 'membershipTier' | 'dob' | 'gender'>, userId?: string) => {
        if (!adminUser) return;
        
        if (userId) {
            try {
                const userRef = doc(db, 'users', userId);
                await updateDoc(userRef, userData as any);
                toast({ title: "Vendor Updated", description: `Details for ${userData.name} have been updated.` });
            } catch (e: any) {
                const permissionError = new FirestorePermissionError({
                    path: `users/${userId}`,
                    operation: 'update',
                    requestResourceData: userData,
                });
                errorEmitter.emit('permission-error', permissionError);
                toast({ variant: 'destructive', title: "Update Failed", description: "Could not save vendor details." });
            }
        } else {
             toast({ variant: 'destructive', title: "Creation Not Supported", description: "Vendors should register via the main registration page." });
        }
    };

    const handleDeleteConfirm = (user: User) => {
        setUserToDelete(user);
        setIsAlertOpen(true);
    };
  
    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        try {
            await deleteDoc(doc(db, 'users', userToDelete.uid));
            toast({ title: "Vendor Data Deleted", description: `Firestore data for ${userToDelete.name} has been removed.` });
        } catch(e: any) {
            const permissionError = new FirestorePermissionError({
                path: `users/${userToDelete.uid}`,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({ variant: 'destructive', title: "Delete Failed", description: "Could not delete vendor data." });
        } finally {
            setIsAlertOpen(false);
            setUserToDelete(null);
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
              <CardTitle>Vendors</CardTitle>
              <CardDescription>
                Manage all registered vendors in your system.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
                 <Button size="sm" onClick={() => handleOpenModal()}>
                    <UserPlus className="mr-2 h-4 w-4" /> Add Vendor
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
                    placeholder="Search by name, email, or phone..."
                    className="w-full rounded-lg bg-background pl-8"
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                    }}
                />
            </div>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead className="hidden md:table-cell">Role</TableHead>
                <TableHead className="hidden md:table-cell">Membership</TableHead>
                <TableHead className="hidden sm:table-cell">Contact</TableHead>
                <TableHead className="text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(USERS_PER_PAGE)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-1">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-40" />
                          </div>
                        </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : paginatedVendors.length > 0 ? (
                paginatedVendors.map(user => (
                  <TableRow key={user.uid}>
                     <TableCell>
                      <div className="flex items-center gap-4">
                        <Avatar>
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name || user.email}`} alt={user.name || 'User'} />
                            <AvatarFallback>{user.name?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="font-medium">{user.name || 'N/A'}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                       <Badge variant="info" className="capitalize">
                        {user.role.toLowerCase()}
                        </Badge>
                    </TableCell>
                     <TableCell className="hidden md:table-cell">
                      {user.membershipTier ? `${user.membershipTier} Tier` : 'N/A'}
                    </TableCell>
                     <TableCell className="hidden sm:table-cell">{user.phone || 'N/A'}</TableCell>
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
                          <DropdownMenuItem onClick={() => handleOpenModal(user)}>Edit Vendor</DropdownMenuItem>
                          <DropdownMenuItem>View Products</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => handleDeleteConfirm(user)}>Delete Vendor Data</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No vendors found.
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
              {(currentPage - 1) * USERS_PER_PAGE + 1}-
              {Math.min(currentPage * USERS_PER_PAGE, filteredVendors.length)}
            </strong>{' '}
            of <strong>{filteredVendors.length}</strong> vendors
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Next
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
    <UserModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        onSave={handleSaveUser}
        userToEdit={userToEdit}
        defaultRoleForCreate="VENDOR"
    />
     <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the Firestore data for "{userToDelete?.name}". The user's authentication account will not be affected.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
                onClick={handleDeleteUser}
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
