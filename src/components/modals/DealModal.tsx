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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useEffect } from 'react';
import type { Deal } from '@/data/types';

const dealSchema = z.object({
  name: z.string().min(2, 'Deal name is required.'),
  slug: z.string().min(1, 'Slug is required.'),
  description: z.string().optional(),
  endTime: z.date({ required_error: "End date is required."}),
  discountPercentage: z.coerce.number().min(1, 'Discount must be at least 1%').max(99, 'Discount cannot exceed 99%'),
  productIds: z.string().min(1, 'At least one product ID is required.'),
  bannerImageUrl: z.string().url('Must be a valid URL.').optional(),
});

type DealFormValues = z.infer<typeof dealSchema>;

interface DealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (deal: Omit<Deal, 'id'>) => void;
  dealToEdit?: Deal | null;
}

export function DealModal({ isOpen, onClose, onSave, dealToEdit }: DealModalProps) {
  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
        name: '',
        slug: '',
        description: '',
        endTime: new Date(),
        discountPercentage: 10,
        productIds: '',
        bannerImageUrl: '',
    },
  });

  useEffect(() => {
    if (dealToEdit) {
      form.reset({
          name: dealToEdit.name,
          slug: dealToEdit.slug,
          description: dealToEdit.description,
          endTime: new Date(dealToEdit.endTime),
          discountPercentage: dealToEdit.discountPercentage,
          productIds: dealToEdit.productIds.join(', '),
          bannerImageUrl: dealToEdit.bannerImageUrl
      });
    } else {
      form.reset({
        name: '',
        slug: '',
        description: '',
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        discountPercentage: 10,
        productIds: '',
        bannerImageUrl: '',
      });
    }
  }, [dealToEdit, form, isOpen]);

  const onSubmit = (data: DealFormValues) => {
    const saveData = {
        ...data,
        endTime: data.endTime.toISOString(),
        productIds: data.productIds.split(',').map(id => id.trim()).filter(id => id),
    };
    onSave(saveData);
    onClose();
  };
  
  const currentName = form.watch('name');
  useEffect(() => {
    if (currentName && !dealToEdit) {
        const slug = currentName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        form.setValue('slug', slug);
    }
  }, [currentName, form, dealToEdit]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 max-h-[90vh] flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b shrink-0">
          <DialogTitle>{dealToEdit ? 'Edit Deal' : 'Create New Deal'}</DialogTitle>
          <DialogDescription>
            Enter the details for your promotional deal.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          <Form {...form}>
            <form id="deal-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-6">
              <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Deal Name</FormLabel><FormControl><Input placeholder="e.g., Eid Mega Sale" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="slug" render={({ field }) => (
                  <FormItem><FormLabel>URL Path (slug)</FormLabel><FormControl><Input placeholder="eid-mega-sale" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Describe the deal..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem className="flex flex-col"><FormLabel>End Date</FormLabel>
                        <Popover><PopoverTrigger asChild>
                            <FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                {field.value ? format(field.value, "PPP") : (<span>Pick a date</span>)}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button></FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus/>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField control={form.control} name="discountPercentage" render={({ field }) => (
                      <FormItem><FormLabel>Discount (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
              </div>
               <FormField control={form.control} name="productIds" render={({ field }) => (
                  <FormItem><FormLabel>Product IDs</FormLabel><FormControl><Textarea placeholder="p1, p2, p3..." {...field} /></FormControl><FormDescription>Comma-separated list of product IDs in this deal.</FormDescription><FormMessage /></FormItem>
              )} />
               <FormField control={form.control} name="bannerImageUrl" render={({ field }) => (
                  <FormItem><FormLabel>Banner Image URL (Optional)</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </form>
          </Form>
        </div>
        <DialogFooter className="p-6 pt-4 border-t shrink-0">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" form="deal-form">Save Deal</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
