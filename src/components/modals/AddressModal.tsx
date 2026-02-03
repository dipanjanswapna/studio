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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import type { Address } from '@/pages/profile/addresses';
import { useEffect } from 'react';

const addressSchema = z.object({
  type: z.enum(['Home', 'Office']),
  name: z.string().min(2, 'Name is required.'),
  address: z.string().min(5, 'A valid address is required.'),
  city: z.string().min(2, 'City is required.'),
  phone: z.string().min(11, 'A valid 11-digit phone number is required.'),
  isDefault: z.boolean().default(false),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
});

type AddressFormValues = z.infer<typeof addressSchema>;

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: Omit<Address, 'id'>) => void;
  addressToEdit?: Address | null;
}

export function AddressModal({ isOpen, onClose, onSave, addressToEdit }: AddressModalProps) {
  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      type: 'Home',
      name: '',
      address: '',
      city: '',
      phone: '',
      isDefault: false,
      latitude: undefined,
      longitude: undefined,
    },
  });

  useEffect(() => {
    if (isOpen) {
        if (addressToEdit) {
          form.reset({
            ...addressToEdit,
            latitude: addressToEdit.latitude ?? undefined,
            longitude: addressToEdit.longitude ?? undefined,
          });
        } else {
          form.reset({
            type: 'Home',
            name: '',
            address: '',
            city: '',
            phone: '',
            isDefault: false,
            latitude: undefined,
            longitude: undefined,
          });
        }
    }
  }, [addressToEdit, form, isOpen]);

  const onSubmit = (data: AddressFormValues) => {
    onSave(data);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 max-h-[90vh] flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b shrink-0">
          <DialogTitle>{addressToEdit ? 'Edit Address' : 'Add a New Address'}</DialogTitle>
          <DialogDescription>
            Enter your address details below. This will be used for shipping.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          <Form {...form}>
            <form id="address-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Address Type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl><RadioGroupItem value="Home" /></FormControl>
                          <FormLabel className="font-normal">Home</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl><RadioGroupItem value="Office" /></FormControl>
                          <FormLabel className="font-normal">Office</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="01712345678" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem><FormLabel>Address Line</FormLabel><FormControl><Input placeholder="House 123, Road 45, Dhanmondi" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem><FormLabel>City / District</FormLabel><FormControl><Input placeholder="Dhaka - 1205" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="latitude" render={({ field }) => (
                    <FormItem><FormLabel>Latitude (Optional)</FormLabel><FormControl><Input type="number" step="any" placeholder="e.g. 23.777176" {...field} onChange={event => field.onChange(+event.target.value)} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="longitude" render={({ field }) => (
                    <FormItem><FormLabel>Longitude (Optional)</FormLabel><FormControl><Input type="number" step="any" placeholder="e.g. 90.399452" {...field} onChange={event => field.onChange(+event.target.value)} /></FormControl><FormMessage /></FormItem>
                )} />
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
                        Set as default shipping address
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        <DialogFooter className="p-6 pt-4 border-t shrink-0">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" form="address-form">Save Address</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}