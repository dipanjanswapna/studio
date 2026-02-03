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
import { collection, query, where } from 'firebase/firestore';
import type { User } from '@/context/authContext';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/authContext';

const USERS_PER_PAGE = 10;

export default function OutletStaffPage() {
    const db = useFirestore();
    const { user: outletManager } = useAuth();

    const staffQuery = useMemo(() => {
        if (!outletManager) return null;
        // In a real app, this might be filtered by staff assigned to this specific outlet.
        return query(collection(db, 'users'), where('role', '==', 'STAFF'));
    }, [outletManager, db]);

    const { data: allStaff, loading } = useCollection<User>(staffQuery);

    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const filteredStaff = useMemo(() => {
        if (!allStaff) return [];
        return allStaff
        .filter(user => {
            const searchMatch = 
                (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (user.phone && user.phone.includes(searchQuery));
            
            return searchMatch;
        })
    }, [allStaff, searchQuery]);
    
    const totalPages = Math.ceil(filteredStaff.length / USERS_PER_PAGE);
    const paginatedStaff = useMemo(() => filteredStaff.slice(
        (currentPage - 1) * USERS_PER_PAGE,
        currentPage * USERS_PER_PAGE
    ), [filteredStaff, currentPage]);

    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    };

    const handlePreviousPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };

  return (
    <Card>
      <CardHeader>
         <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Manage Staff</CardTitle>
              <CardDescription>
                View and manage staff members for your outlet.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
                 <Button size="sm">
                    <UserPlus className="mr-2 h-4 w-4" /> Add Staff Member
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
                <TableHead>Staff Member</TableHead>
                <TableHead className="hidden md:table-cell">Role</TableHead>
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
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : paginatedStaff.length > 0 ? (
                paginatedStaff.map(user => (
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
                       <Badge variant="secondary" className="capitalize">
                        {user.role.toLowerCase()}
                        </Badge>
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
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>View Schedule</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">Deactivate</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No staff members found.
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
              {Math.min(currentPage * USERS_PER_PAGE, filteredStaff.length)}
            </strong>{' '}
            of <strong>{filteredStaff.length}</strong> staff members
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
  );
}
