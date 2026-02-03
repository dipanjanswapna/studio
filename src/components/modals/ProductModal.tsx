'use client';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useEffect } from 'react';
import type { Product, Category } from '@/data/types';
import type { User } from '@/context/authContext';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ScrollArea } from '../ui/scroll-area';
import { useAuth } from '@/context/authContext';

const variantSchema = z.object({
  id: z.string().min(1, "SKU is required."),
  name: z.string().min(1, "Variant name is required."),
  price: z.coerce.number().min(0, "Price must be a positive number."),
  stock: z.coerce.number().min(0, "Stock must be a positive number."),
  attributes: z.string().optional(), // Simple string for now, e.g., "Color:Red,Size:L"
  imageIds: z.string().optional(), // Comma-separated string
});

const productSchema = z.object({
  name: z.string().min(2, 'Product name is required.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  brand: z.string().optional(),
  category: z.string().min(1, 'Category is required.'),
  vendorId: z.string().optional(),
  imageIds: z.string().optional(), // Comma-separated string
  isFeatured: z.boolean().default(false),
  preOrder: z.boolean().default(false),
  discountPercentage: z.coerce.number().optional(),
  variantAttributes: z.string().optional(), // Comma-separated string
  variants: z.array(variantSchema).min(1, "At least one variant is required."),
  flashSaleEnabled: z.boolean().default(false),
  flashSale: z.object({
    price: z.coerce.number().optional(),
    endTime: z.date().optional(),
    initialStock: z.coerce.number().optional(),
  }).optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Omit<Product, 'id'>) => void;
  productToEdit?: Product | null;
  categories: Category[];
  vendors: User[];
}

export function ProductModal({ isOpen, onClose, onSave, productToEdit, categories, vendors }: ProductModalProps) {
  const { user } = useAuth();
  const isVendor = user?.role === 'VENDOR';

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "variants"
  });

  useEffect(() => {
    if (isOpen) {
      if (productToEdit) {
        form.reset({
          name: productToEdit.name,
          description: productToEdit.description,
          brand: productToEdit.brand || '',
          category: productToEdit.category,
          vendorId: isVendor ? user?.uid : (productToEdit.vendorId || 'no-vendor'),
          imageIds: productToEdit.imageIds?.join(', ') || '',
          isFeatured: productToEdit.isFeatured || false,
          preOrder: productToEdit.preOrder || false,
          discountPercentage: productToEdit.discountPercentage,
          variantAttributes: productToEdit.variantAttributes?.join(', ') || '',
          variants: productToEdit.variants.map(v => ({
              ...v,
              attributes: v.attributes ? Object.entries(v.attributes).map(([key, value]) => `${key}:${value}`).join(',') : '',
              imageIds: v.imageIds?.join(', ') || '',
          })),
          flashSaleEnabled: !!productToEdit.flashSale,
          flashSale: {
              price: productToEdit.flashSale?.price,
              endTime: productToEdit.flashSale?.endTime ? new Date(productToEdit.flashSale.endTime) : undefined,
              initialStock: productToEdit.flashSale?.initialStock,
          }
        });
      } else {
        form.reset({
          name: '',
          description: '',
          brand: '',
          category: '',
          vendorId: isVendor ? user?.uid : 'no-vendor',
          imageIds: '',
          isFeatured: false,
          preOrder: false,
          variantAttributes: '',
          variants: [{ id: '', name: 'Default', price: 0, stock: 0, attributes: '', imageIds: '' }],
          flashSaleEnabled: false,
          flashSale: {},
        });
      }
    }
  }, [productToEdit, form, isOpen, isVendor, user]);

  const onSubmit = (data: ProductFormValues) => {
    const finalProductData: Omit<Product, 'id'> = {
        name: data.name,
        description: data.description,
        brand: data.brand,
        category: data.category,
        vendorId: isVendor ? user?.uid : (data.vendorId === 'no-vendor' ? '' : data.vendorId),
        imageIds: data.imageIds ? data.imageIds.split(',').map(s => s.trim()).filter(s => s) : [],
        isFeatured: data.isFeatured,
        preOrder: data.preOrder,
        rating: productToEdit?.rating || 0,
        reviews: productToEdit?.reviews || 0,
        discountPercentage: data.discountPercentage,
        variantAttributes: data.variantAttributes ? data.variantAttributes.split(',').map(s => s.trim()).filter(s => s) : [],
        variants: data.variants.map(v => ({
            ...v,
            price: Number(v.price),
            stock: Number(v.stock),
            attributes: v.attributes ? Object.fromEntries(v.attributes.split(',').map(s => {
                const parts = s.split(':');
                return [parts[0].trim(), parts[1].trim()];
            })) : {},
            imageIds: v.imageIds ? v.imageIds.split(',').map(s => s.trim()).filter(s => s) : [],
        })),
        flashSale: data.flashSaleEnabled && data.flashSale && data.flashSale.price && data.flashSale.endTime && data.flashSale.initialStock ? {
            price: Number(data.flashSale.price),
            endTime: data.flashSale.endTime.toISOString(),
            initialStock: Number(data.flashSale.initialStock),
            sold: productToEdit?.flashSale?.sold || 0,
        } : undefined,
    };

    onSave(finalProductData);
    onClose();
  };
  
  const flashSaleEnabled = form.watch('flashSaleEnabled');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl p-0 max-h-[90vh] flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b shrink-0">
          <DialogTitle>{productToEdit ? 'Edit Product' : 'Create New Product'}</DialogTitle>
          <DialogDescription>
            Enter the product details below.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          <Form {...form}>
            <form id="product-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Product Name</FormLabel><FormControl><Input placeholder="e.g., Wireless Headphones" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Describe the product..." {...field} rows={4} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="brand" render={({ field }) => (
                        <FormItem><FormLabel>Brand</FormLabel><FormControl><Input placeholder="e.g., Averzo" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="category" render={({ field }) => (
                        <FormItem><FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                                <SelectContent><ScrollArea className="h-60">
                                    {categories.map(cat => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}
                                </ScrollArea></SelectContent>
                            </Select>
                        <FormMessage /></FormItem>
                    )} />
                </div>
                <FormField control={form.control} name="imageIds" render={({ field }) => (
                    <FormItem><FormLabel>Product Image IDs</FormLabel><FormControl><Input placeholder="e.g., product-1, product-2" {...field} /></FormControl><FormDescription>Comma-separated list of image IDs from placeholder-images.json.</FormDescription><FormMessage /></FormItem>
                )} />
                
                {!isVendor && (
                  <FormField control={form.control} name="vendorId" render={({ field }) => (
                      <FormItem><FormLabel>Vendor</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Assign a vendor" /></SelectTrigger></FormControl>
                              <SelectContent>
                                  <SelectItem value="no-vendor">None (Admin Product)</SelectItem>
                                  {vendors.map(ven => <SelectItem key={ven.uid} value={ven.uid}>{ven.name}</SelectItem>)}
                              </SelectContent>
                          </Select>
                      <FormMessage /></FormItem>
                  )} />
                )}


                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                    <FormField control={form.control} name="discountPercentage" render={({ field }) => (
                      <FormItem><FormLabel>Discount (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField control={form.control} name="isFeatured" render={({ field }) => (
                        <FormItem className="flex items-center gap-2 pt-8"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Featured?</FormLabel></FormItem>
                    )} />
                    <FormField control={form.control} name="preOrder" render={({ field }) => (
                        <FormItem className="flex items-center gap-2 pt-8"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Pre-Order?</FormLabel></FormItem>
                    )} />
                </div>

                {/* Variants Section */}
                <div className="space-y-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Variants</h3>
                        <Button type="button" variant="outline" size="sm" onClick={() => append({ id: '', name: '', price: 0, stock: 0, attributes: '', imageIds: '' })}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Variant
                        </Button>
                    </div>
                     <FormField control={form.control} name="variantAttributes" render={({ field }) => (
                        <FormItem><FormLabel>Variant Attributes</FormLabel><FormControl><Input placeholder="e.g., Size,Color" {...field} /></FormControl><FormDescription>Comma-separated list of attributes that define variants (e.g., Size, Color).</FormDescription><FormMessage /></FormItem>
                     )} />
                    
                    <ScrollArea className="max-h-80 w-full pr-4">
                      <div className="space-y-4">
                        {fields.map((field, index) => (
                            <div key={field.id} className="p-4 border rounded-lg space-y-3 relative">
                                <h4 className="font-medium">Variant #{index + 1}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <FormField control={form.control} name={`variants.${index}.id`} render={({ field }) => (
                                        <FormItem><FormLabel>SKU</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                     )} />
                                     <FormField control={form.control} name={`variants.${index}.name`} render={({ field }) => (
                                        <FormItem><FormLabel>Variant Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                     )} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                     <FormField control={form.control} name={`variants.${index}.price`} render={({ field }) => (
                                        <FormItem><FormLabel>Price</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                     )} />
                                     <FormField control={form.control} name={`variants.${index}.stock`} render={({ field }) => (
                                        <FormItem><FormLabel>Stock</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                     )} />
                                </div>
                                <FormField control={form.control} name={`variants.${index}.attributes`} render={({ field }) => (
                                    <FormItem><FormLabel>Attributes</FormLabel><FormControl><Input placeholder="Size:L,Color:Red" {...field} /></FormControl><FormDescription>Comma-separated key:value pairs.</FormDescription><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name={`variants.${index}.imageIds`} render={({ field }) => (
                                    <FormItem><FormLabel>Variant Image IDs</FormLabel><FormControl><Input placeholder="product-1-red, product-1-blue" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                {fields.length > 1 && (
                                    <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => remove(index)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                      </div>
                    </ScrollArea>
                </div>

                {/* Flash Sale Section */}
                <div className="space-y-4 pt-4 border-t">
                    <FormField control={form.control} name="flashSaleEnabled" render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5"><FormLabel>Enable Flash Sale</FormLabel><FormDescription>Add special flash sale pricing and duration for this product.</FormDescription></div>
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )} />
                    {flashSaleEnabled && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                           <FormField control={form.control} name="flashSale.price" render={({ field }) => (
                               <FormItem><FormLabel>Flash Sale Price</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                           )} />
                           <FormField control={form.control} name="flashSale.initialStock" render={({ field }) => (
                               <FormItem><FormLabel>Flash Sale Stock</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                           )} />
                            <FormField control={form.control} name="flashSale.endTime" render={({ field }) => (
                                <FormItem className="flex flex-col"><FormLabel>End Date</FormLabel>
                                    <Popover><PopoverTrigger asChild><FormControl>
                                        <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                            {field.value ? format(field.value, "PPP") : (<span>Pick a date</span>)}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl></PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus/></PopoverContent>
                                    </Popover><FormMessage />
                                </FormItem>
                           )} />
                        </div>
                    )}
                </div>

            </form>
          </Form>
        </div>
        <DialogFooter className="p-6 pt-4 border-t shrink-0">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" form="product-form" loading={form.formState.isSubmitting}>Save Product</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
