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
import { useEffect } from 'react';
import type { Category } from '@/data/types';

const categorySchema = z.object({
  name: z.string().min(2, 'Category name is required.'),
  href: z.string().min(1, 'URL path is required.').startsWith('/', { message: 'Path must start with /' }),
  order: z.coerce.number().min(0, 'Order must be a positive number.'),
  iconName: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: Omit<Category, 'id' | 'groups'>) => void;
  categoryToEdit?: Category | null;
}

const iconNames = ['Tablet', 'Shield', 'PersonStanding', 'Smile', 'Pill', 'Laptop', 'Pen', 'Milk', 'Microwave', 'Sofa', 'Dumbbell', 'Sparkles', 'Footprints', 'Briefcase', 'Gem', 'Baby', 'ToyBrick', 'BookOpen', 'Dog', 'Car', 'Sprout', 'CookingPot', 'SprayCan', 'Smartphone', 'Computer', 'Music', 'Luggage', 'Utensils', 'Castle', 'Gift', 'HeartPulse', 'HelpCircle'];

export function CategoryModal({ isOpen, onClose, onSave, categoryToEdit }: CategoryModalProps) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      href: '/',
      order: 0,
      iconName: '',
    },
  });

  useEffect(() => {
    if (categoryToEdit) {
      form.reset({
          name: categoryToEdit.name,
          href: categoryToEdit.href,
          order: categoryToEdit.order,
          iconName: categoryToEdit.iconName
      });
    } else {
      form.reset({
        name: '',
        href: '/',
        order: 0,
        iconName: '',
      });
    }
  }, [categoryToEdit, form, isOpen]);

  const onSubmit = (data: CategoryFormValues) => {
    onSave(data);
    onClose();
  };
  
  const currentName = form.watch('name');
  useEffect(() => {
    if (currentName && !categoryToEdit) {
        const slug = '/' + currentName.toLowerCase().replace(/\s+/g, '-');
        form.setValue('href', slug);
    }
  }, [currentName, form, categoryToEdit]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{categoryToEdit ? 'Edit Category' : 'Create New Category'}</DialogTitle>
          <DialogDescription>
            Enter the details for your category below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Category Name</FormLabel><FormControl><Input placeholder="e.g., Electronics" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
             <FormField control={form.control} name="href" render={({ field }) => (
                <FormItem><FormLabel>URL Path (slug)</FormLabel><FormControl><Input placeholder="/electronics" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="order" render={({ field }) => (
                    <FormItem><FormLabel>Display Order</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField
                    control={form.control}
                    name="iconName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Icon</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an icon" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {iconNames.map(icon => (
                                <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">Save Category</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
