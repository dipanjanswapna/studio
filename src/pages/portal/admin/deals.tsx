'use client';
import { useMemo, useState } from 'react';
import {
  File,
  MoreHorizontal,
  PlusCircle,
  Tags,
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
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import type { Deal } from '@/data/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/authContext';
import { DealModal } from '@/components/modals/DealModal';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


export default function AdminDealsPage() {
    const db = useFirestore();
    const { user } = useAuth();
    const { toast } = useToast();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [dealToEdit, setDealToEdit] = useState<Deal | null>(null);

    const dealsQuery = useMemo(() => {
      if (!user) return null;
      return query(collection(db, 'deals'), orderBy('endTime', 'desc'));
    }, [user, db]);

    const { data: deals, loading } = useCollection<Deal>(dealsQuery);
    
    const handleOpenModal = (deal: Deal | null = null) => {
        setDealToEdit(deal);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setDealToEdit(null);
    };

    const handleSaveDeal = async (dealData: Omit<Deal, 'id'>) => {
        if (!user) return;

        try {
            if (dealToEdit) {
                const dealRef = doc(db, 'deals', dealToEdit.id);
                await updateDoc(dealRef, { ...dealData });
                toast({ title: "Deal Updated", description: `"${dealData.name}" has been updated.` });
            } else {
                await addDoc(collection(db, 'deals'), dealData);
                toast({ title: "Deal Created", description: `"${dealData.name}" has been added.` });
            }
        } catch (e: any) {
            const permissionError = new FirestorePermissionError({
                path: `deals/${dealToEdit?.id || ''}`,
                operation: dealToEdit ? 'update' : 'create',
                requestResourceData: dealData,
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({ variant: 'destructive', title: "Operation Failed", description: "Could not save the deal." });
        }
    };
    
    const handleDeleteDeal = async (dealId: string) => {
        try {
            await deleteDoc(doc(db, 'deals', dealId));
            toast({ title: "Deal Deleted", description: "The deal has been successfully removed." });
        } catch(e: any) {
            const permissionError = new FirestorePermissionError({
                path: `deals/${dealId}`,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({ variant: 'destructive', title: "Delete Failed", description: "Could not delete the deal." });
        }
    };

  return (
    <>
        <Card>
          <CardHeader>
             <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>Manage Deals</CardTitle>
                  <CardDescription>
                    Create and manage promotional deals like Eid Deal, 11.11, etc.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <File className="h-3.5 w-3.5 mr-2" />
                        Export
                    </Button>
                     <Button size="sm" onClick={() => handleOpenModal()}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Create New Deal
                    </Button>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deal Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Discount</TableHead>
                    <TableHead className="hidden md:table-cell">Products</TableHead>
                    <TableHead className="hidden md:table-cell">End Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-12" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-10" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : deals && deals.length > 0 ? (
                    deals.map(deal => {
                        const isExpired = new Date(deal.endTime) < new Date();
                      return (
                      <TableRow key={deal.id}>
                        <TableCell className="font-medium">
                            <div className="font-medium">{deal.name}</div>
                            <div className="text-xs text-muted-foreground">/{deal.slug}</div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                            {deal.discountPercentage ? `${deal.discountPercentage}%` : 'N/A'}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{deal.productIds.length}</TableCell>
                        <TableCell className="hidden md:table-cell">{new Date(deal.endTime).toLocaleString()}</TableCell>
                        <TableCell>
                            <Badge variant={isExpired ? 'secondary' : 'success'}>
                                {isExpired ? 'Expired' : 'Active'}
                            </Badge>
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
                              <DropdownMenuItem onClick={() => handleOpenModal(deal)}>Edit</DropdownMenuItem>
                              <DropdownMenuItem>Duplicate</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteDeal(deal.id)}>Delete</DropdownMenuItem>
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
                            <Tags className="w-12 h-12 text-muted-foreground/30" />
                            <div className="space-y-1">
                                <h3 className="font-semibold">No Deals Found</h3>
                                <p className="text-sm text-muted-foreground">You haven't created any promotional deals yet.</p>
                            </div>
                            <Button onClick={() => handleOpenModal()}>Create Your First Deal</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        <DealModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveDeal} dealToEdit={dealToEdit} />
    </>
  );
}
