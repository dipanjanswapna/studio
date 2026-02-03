'use client';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useMemo } from 'react';
import type { Brand } from '@/data/types';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';
import { PlaceHolderImages } from '@/data/placeholder-images';

const brandSchema = z.object({
  name: z.string().min(2, 'Brand name is required.'),
  logoImageId: z.string().min(1, 'A logo image ID is required.'),
  order: z.coerce.number().min(0, 'Order must be a positive number.'),
  isFeatured: z.boolean().default(false),
});

type BrandFormValues = z.infer<typeof brandSchema>;

interface BrandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (brand: Omit<Brand, 'id'>) => void;
  brandToEdit?: Brand | null;
}

export function BrandModal({ isOpen, onClose, onSave, brandToEdit }: BrandModalProps) {
  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: '',
      logoImageId: '',
      order: 0,
      isFeatured: false,
    },
  });

  const brandLogos = useMemo(() => {
    return PlaceHolderImages.filter(img => img.id.startsWith('brand-'));
  }, []);

  useEffect(() => {
    if (isOpen) {
        if (brandToEdit) {
            form.reset({
                name: brandToEdit.name,
                logoImageId: brandToEdit.logoImageId,
                order: brandToEdit.order || 0,
                isFeatured: brandToEdit.isFeatured || false,
            });
        } else {
            form.reset({
                name: '',
                logoImageId: '',
                order: 0,
                isFeatured: false,
            });
        }
    }
  }, [brandToEdit, form, isOpen]);

  const onSubmit = (data: BrandFormValues) => {
    onSave(data);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{brandToEdit ? 'Edit Brand' : 'Create New Brand'}</DialogTitle>
          <DialogDescription>
            Enter the details for your brand below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form id="brand-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Brand Name</FormLabel><FormControl><Input placeholder="e.g., Apple" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField
                control={form.control}
                name="logoImageId"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Logo Image</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select a logo" /></SelectTrigger></FormControl>
                            <SelectContent><ScrollArea className="h-60">
                                {brandLogos.map(logo => <SelectItem key={logo.id} value={logo.id}>{logo.description}</SelectItem>)}
                            </ScrollArea></SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="order" render={({ field }) => (
                    <FormItem><FormLabel>Display Order</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="isFeatured" render={({ field }) => (
                    <FormItem className="flex items-center gap-2 pt-8"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Show on Homepage?</FormLabel></FormItem>
                )} />
            </div>
          </form>
        </Form>
        <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" form="brand-form">Save Brand</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
