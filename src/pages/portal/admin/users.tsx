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
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { User, UserRole } from '@/context/authContext';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/authContext';
import { UserModal } from '@/components/modals/UserModal';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


const USERS_PER_PAGE = 10;

export default function AdminUsersPage() {
    const db = useFirestore();
    const { user: adminUser } = useAuth();
    const { toast } = useToast();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    const usersQuery = useMemo(() => {
        if (!adminUser) return null;
        return query(collection(db, 'users'));
    }, [adminUser, db]);

    const { data: allUsers, loading } = useCollection<User>(usersQuery);

    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);

    const ROLES: UserRole[] = ['ADMIN', 'VENDOR', 'CUSTOMER', 'STAFF', 'OUTLET'];

    const filteredUsers = useMemo(() => {
        if (!allUsers) return [];
        return allUsers
        .filter(user => {
            const searchMatch = 
                (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (user.phone && user.phone.includes(searchQuery));
            
            const roleMatch = roleFilter.length === 0 || roleFilter.includes(user.role);
            
            return searchMatch && roleMatch;
        })
    }, [allUsers, searchQuery, roleFilter]);
    
    const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
    const paginatedUsers = useMemo(() => filteredUsers.slice(
        (currentPage - 1) * USERS_PER_PAGE,
        currentPage * USERS_PER_PAGE
    ), [filteredUsers, currentPage]);

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
        
        // For now, only support updating existing users.
        // User creation via client SDK with password is not possible for other users.
        if (userId) {
            try {
                const userRef = doc(db, 'users', userId);
                await updateDoc(userRef, userData as any);
                toast({ title: "User Updated", description: `Details for ${userData.name} have been updated.` });
            } catch (e: any) {
                const permissionError = new FirestorePermissionError({
                    path: `users/${userId}`,
                    operation: 'update',
                    requestResourceData: userData,
                });
                errorEmitter.emit('permission-error', permissionError);
                toast({ variant: 'destructive', title: "Update Failed", description: "Could not save user details." });
            }
        } else {
             toast({ variant: 'destructive', title: "Creation Not Supported", description: "Please create users via Firebase Authentication console first." });
        }
    };
    
    const handleDeleteConfirm = (user: User) => {
        setUserToDelete(user);
        setIsAlertOpen(true);
    };
  
    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        try {
            // Note: This only deletes the Firestore document, not the Firebase Auth user.
            // Deleting auth users requires admin privileges not available in client SDK.
            await deleteDoc(doc(db, 'users', userToDelete.uid));
            toast({ title: "User Data Deleted", description: `Firestore data for ${userToDelete.name} has been removed.` });
        } catch(e: any) {
            const permissionError = new FirestorePermissionError({
                path: `users/${userToDelete.uid}`,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({ variant: 'destructive', title: "Delete Failed", description: "Could not delete user data." });
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

    const toggleRoleFilter = (role: string) => {
        setRoleFilter(prev => 
            prev.includes(role) 
            ? prev.filter(r => r !== role) 
            : [...prev, role]
        );
        setCurrentPage(1);
    };

    const getRoleBadgeVariant = (role: UserRole) => {
        switch(role) {
            case 'ADMIN': return 'destructive';
            case 'VENDOR': return 'info';
            case 'CUSTOMER': return 'outline';
            case 'STAFF': return 'secondary';
            case 'OUTLET': return 'success';
            default: return 'outline';
        }
    }

  return (
    <>
    <Card>
      <CardHeader>
         <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                Manage all registered users in your system.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
                 <Button size="sm" onClick={() => handleOpenModal()}>
                    <UserPlus className="mr-2 h-4 w-4" /> Add User
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
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1 w-full sm:w-auto">
                    <span>Filter by Role</span>
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by Role</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {ROLES.map(role => (
                    <DropdownMenuCheckboxItem key={role} checked={roleFilter.includes(role)} onCheckedChange={() => toggleRoleFilter(role)}>
                        {role}
                    </DropdownMenuCheckboxItem>
                ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
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
              ) : paginatedUsers.length > 0 ? (
                paginatedUsers.map(user => (
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
                       <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">
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
                          <DropdownMenuItem onClick={() => handleOpenModal(user)}>Edit User</DropdownMenuItem>
                          <DropdownMenuItem>View Orders</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => handleDeleteConfirm(user)}>Delete User Data</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No users found.
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
              {Math.min(currentPage * USERS_PER_PAGE, filteredUsers.length)}
            </strong>{' '}
            of <strong>{filteredUsers.length}</strong> users
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
