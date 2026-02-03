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
import dynamic from 'next/dynamic';
import { Skeleton } from '../ui/skeleton';

const DynamicLocationSelector = dynamic(
    () => import('@/components/LocationSelector').then(mod => mod.LocationSelector),
    { 
        ssr: false,
        loading: () => <Skeleton className="h-full w-full min-h-[300px] rounded-lg" />
    }
);

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
  
  const handleLocationSelect = ({ lat, lng, address }: { lat: number; lng: number; address: string }) => {
    form.setValue('latitude', lat);
    form.setValue('longitude', lng);
    
    const addressParts = address.split(', ');
    const city = addressParts.length > 2 ? addressParts.slice(-3, -1).join(', ') : '';
    
    form.setValue('address', address);
    form.setValue('city', city);
  };

  const initialPosition: [number, number] | undefined = addressToEdit?.latitude && addressToEdit.longitude 
    ? [addressToEdit.latitude, addressToEdit.longitude]
    : undefined;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl p-0 max-h-[90vh] flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b shrink-0">
          <DialogTitle>{addressToEdit ? 'Edit Address' : 'Add a New Address'}</DialogTitle>
          <DialogDescription>
            Enter your address details or select a location on the map for accuracy.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          <Form {...form}>
            <form id="address-form" onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2">
              {/* Column 1: Form Fields */}
              <div className="p-6 space-y-6 border-b md:border-r md:border-b-0">
                 <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
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
                
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">Contact Information</h3>
                    <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="e.g. John Doe" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="e.g. 01712345678" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">Location Details</h3>
                    <FormField control={form.control} name="address" render={({ field }) => (
                        <FormItem><FormLabel>Full Address (Street, Area)</FormLabel><FormControl><Input placeholder="e.g. House 123, Road 45, Gulshan 2" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="city" render={({ field }) => (
                        <FormItem><FormLabel>City / District</FormLabel><FormControl><Input placeholder="e.g. Dhaka" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>

                 <FormField
                  control={form.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-3 space-y-0 rounded-lg border p-3 bg-background">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="leading-none !mt-0">
                        Set as default shipping address
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              {/* Column 2: Map */}
              <div className="p-6 h-full flex flex-col min-h-[400px] md:min-h-0">
                <FormLabel>Pin Location on Map</FormLabel>
                <p className="text-xs text-muted-foreground mt-1 mb-2">Search for a location or click on the map to set your address automatically.</p>
                <div className="flex-grow rounded-lg overflow-hidden">
                    <DynamicLocationSelector onLocationSelect={handleLocationSelect} initialPosition={initialPosition} />
                </div>
              </div>
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
