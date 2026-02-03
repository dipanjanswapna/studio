import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { PaymentMethod } from '@/data/types';
import { useEffect } from 'react';

const addPaymentSchema = z.object({
  cardHolderName: z.string().min(2, 'Name is required.'),
  cardNumber: z.string().regex(/^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14})$/, 'Please enter a valid Visa or Mastercard number.'),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/, 'Please use MM/YY format.'),
  cvc: z.string().regex(/^\d{3,4}$/, 'Invalid CVC.'),
  isDefault: z.boolean().default(false),
});

const editPaymentSchema = z.object({
  cardHolderName: z.string().min(2, 'Name is required.'),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/, 'Please use MM/YY format.'),
  isDefault: z.boolean().default(false),
});

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (paymentMethod: Omit<PaymentMethod, 'id'>) => void;
  paymentToEdit?: PaymentMethod | null;
}

const getCardType = (cardNumber: string): 'Visa' | 'Mastercard' | 'Card' => {
    if (cardNumber.startsWith('4')) return 'Visa';
    if (cardNumber.startsWith('5')) return 'Mastercard';
    return 'Card';
};

export function PaymentMethodModal({ isOpen, onClose, onSave, paymentToEdit }: PaymentMethodModalProps) {
  const isEditing = !!paymentToEdit;
  
  const form = useForm({
    resolver: zodResolver(isEditing ? editPaymentSchema : addPaymentSchema),
    defaultValues: {
      cardHolderName: '',
      cardNumber: '',
      expiryDate: '',
      cvc: '',
      isDefault: false,
    },
  });

  useEffect(() => {
    if (isOpen) {
        if (paymentToEdit) {
            form.reset({
                cardHolderName: paymentToEdit.cardHolderName,
                expiryDate: paymentToEdit.expiry,
                isDefault: paymentToEdit.isDefault,
                cardNumber: '',
                cvc: '',
            });
        } else {
            form.reset({
                cardHolderName: '',
                cardNumber: '',
                expiryDate: '',
                cvc: '',
                isDefault: false,
            });
        }
    }
  }, [paymentToEdit, isOpen, form]);

  const onSubmit = (data: any) => {
    let saveData: Omit<PaymentMethod, 'id'>;

    if (isEditing && paymentToEdit) {
        saveData = {
            ...paymentToEdit,
            cardHolderName: data.cardHolderName,
            expiry: data.expiryDate,
            isDefault: data.isDefault,
        };
    } else {
        saveData = {
            cardHolderName: data.cardHolderName,
            last4: data.cardNumber.slice(-4),
            expiry: data.expiryDate,
            type: getCardType(data.cardNumber),
            isDefault: data.isDefault,
        };
    }
    
    onSave(saveData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Payment Method' : 'Add a New Card'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update your card details below.' : 'Your card information is secure.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField control={form.control} name="cardHolderName" render={({ field }) => (
                <FormItem><FormLabel>Card Holder Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            
            {!isEditing && (
              <FormField control={form.control} name="cardNumber" render={({ field }) => (
                <FormItem><FormLabel>Card Number</FormLabel><FormControl><Input placeholder="****************" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            )}
            
            <div className="grid grid-cols-2 gap-4">
                 <FormField control={form.control} name="expiryDate" render={({ field }) => (
                    <FormItem><FormLabel>Expiry Date</FormLabel><FormControl><Input placeholder="MM/YY" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                {!isEditing && (
                    <FormField control={form.control} name="cvc" render={({ field }) => (
                        <FormItem><FormLabel>CVC</FormLabel><FormControl><Input placeholder="123" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                )}
                 {isEditing && paymentToEdit && (
                    <div className="space-y-2">
                        <FormLabel>Card Number</FormLabel>
                        <Input disabled value={`**** **** **** ${paymentToEdit.last4}`} />
                    </div>
                 )}
            </div>
             <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Set as default payment method
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">Save Card</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
