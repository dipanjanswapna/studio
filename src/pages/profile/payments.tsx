'use client';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Plus, MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PaymentMethodModal } from '@/components/modals/PaymentMethodModal';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/authContext';
import { useCollection, useFirestore } from '@/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, writeBatch, query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { PaymentMethod } from '@/data/types';


const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: {type: 'spring', stiffness: 100} },
};

export default function PaymentsPage() {
  const { user } = useAuth();
  const db = useFirestore();
  const paymentsRef = user ? collection(db, 'users', user.uid, 'paymentMethods') : null;
  const { data: payments, loading } = useCollection<PaymentMethod>(paymentsRef ? query(paymentsRef) : undefined);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentToEdit, setPaymentToEdit] = useState<PaymentMethod | null>(null);
  const { toast } = useToast();

  const handleOpenModal = (payment: PaymentMethod | null = null) => {
    setPaymentToEdit(payment);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setPaymentToEdit(null);
  };

  const handleSavePayment = async (paymentData: Omit<PaymentMethod, 'id'>) => {
    if (!user || !paymentsRef || !payments) return;

    try {
        if (paymentData.isDefault) {
            const batch = writeBatch(db);
            const currentDefault = payments.find(p => p.isDefault);
            if (currentDefault) {
                const currentDefaultRef = doc(db, 'users', user.uid, 'paymentMethods', currentDefault.id);
                batch.update(currentDefaultRef, { isDefault: false });
            }
            await batch.commit();
        }

        if (paymentToEdit) {
            const paymentRef = doc(db, 'users', user.uid, 'paymentMethods', paymentToEdit.id);
            await updateDoc(paymentRef, paymentData);
            toast({ title: "Payment Method Updated", description: "Your card details have been successfully updated." });
        } else {
            await addDoc(paymentsRef, paymentData);
            toast({ title: "Card Added", description: "Your new card has been saved." });
        }
    } catch (e: any) {
        const permissionError = new FirestorePermissionError({
            path: `users/${user.uid}/paymentMethods/${paymentToEdit?.id || ''}`,
            operation: paymentToEdit ? 'update' : 'create',
            requestResourceData: paymentData,
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({ variant: 'destructive', title: "Operation Failed", description: "Could not save payment method." });
    }
  };

  const handleDeletePayment = async (paymentToDelete: PaymentMethod) => {
      if (!user || !payments) return;
      try {
          const paymentRef = doc(db, 'users', user.uid, 'paymentMethods', paymentToDelete.id);
          await deleteDoc(paymentRef);
          
          if (paymentToDelete.isDefault && payments.length > 1) {
              const nextPayment = payments.find(p => p.id !== paymentToDelete.id);
              if (nextPayment) {
                const nextPaymentRef = doc(db, 'users', user.uid, 'paymentMethods', nextPayment.id);
                await updateDoc(nextPaymentRef, { isDefault: true });
              }
          }
          toast({ title: "Card Removed", variant: "destructive", description: "The payment method has been removed." });
      } catch (e: any) {
            const permissionError = new FirestorePermissionError({
                path: `users/${user.uid}/paymentMethods/${paymentToDelete.id}`,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({ variant: 'destructive', title: "Delete Failed", description: "Could not delete payment method." });
      }
  };
  
  const handleSetAsDefault = async (paymentToMakeDefault: PaymentMethod) => {
      if (!user || !payments) return;
      const batch = writeBatch(db);
      
      const currentDefault = payments.find(p => p.isDefault);
      if (currentDefault && currentDefault.id !== paymentToMakeDefault.id) {
          const currentDefaultRef = doc(db, 'users', user.uid, 'paymentMethods', currentDefault.id);
          batch.update(currentDefaultRef, { isDefault: false });
      }

      const newDefaultRef = doc(db, 'users', user.uid, 'paymentMethods', paymentToMakeDefault.id);
      batch.update(newDefaultRef, { isDefault: true });
      
      try {
        await batch.commit();
        toast({ title: "Default Card Changed", description: "Your default payment method has been updated." });
      } catch (e: any) {
            const permissionError = new FirestorePermissionError({
                path: `users/${user.uid}/paymentMethods`,
                operation: 'update',
                requestResourceData: { isDefault: true },
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({ variant: 'destructive', title: "Operation Failed", description: "Could not set default payment method." });
      }
  };

  return (
    <>
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>Manage your saved payment methods for faster checkout.</CardDescription>
              </div>
              <Button className="w-full sm:w-auto" onClick={() => handleOpenModal()}>
                  <Plus className="mr-2 h-4 w-4" /> Add New Card
              </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : !payments || payments.length === 0 ? (
              <div className="min-h-[300px] flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-lg bg-secondary/50">
                  <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h2 className="mt-4 text-xl font-semibold">No payment methods saved</h2>
                  <p className="mt-1 text-muted-foreground">
                    Adding a card will make your checkout experience seamless.
                  </p>
              </div>
            ) : (
                <div className="space-y-4">
                    {payments.map((card) => (
                         <div key={card.id} className="flex items-center p-4 border rounded-lg">
                            <CreditCard className="mr-4 h-6 w-6 text-muted-foreground" />
                            <div className="flex-grow">
                                <p className="font-semibold capitalize">{card.type} ending in {card.last4}</p>
                                <p className="text-sm text-muted-foreground">Expires {card.expiry}</p>
                            </div>
                            {card.isDefault && <Badge variant="secondary" className="mr-4 hidden sm:block">Default</Badge>}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {!card.isDefault && <DropdownMenuItem onClick={() => handleSetAsDefault(card)}>Set as Default</DropdownMenuItem>}
                                    <DropdownMenuItem onClick={() => handleOpenModal(card)}>Edit</DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeletePayment(card)}>Remove</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                         </div>
                    ))}
                </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
      <PaymentMethodModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSavePayment} paymentToEdit={paymentToEdit} />
    </>
  );
}
