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
import type { User, UserRole } from '@/context/authContext';

const userSchema = z.object({
  name: z.string().min(2, 'Name is required.'),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'VENDOR', 'OUTLET', 'STAFF', 'CUSTOMER', 'B2B_CUSTOMER']),
  companyName: z.string().optional(),
  vatNumber: z.string().optional(),
}).refine(data => {
    if (data.role === 'B2B_CUSTOMER') {
        return !!data.companyName && data.companyName.length > 0;
    }
    return true;
}, {
    message: "Company name is required for B2B Clients.",
    path: ["companyName"],
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: Omit<User, 'uid' | 'membershipId' | 'membershipTier' | 'dob' | 'gender'>, userId?: string) => void;
  userToEdit?: User | null;
  defaultRoleForCreate?: UserRole;
}

const ROLES: UserRole[] = ['ADMIN', 'VENDOR', 'OUTLET', 'STAFF', 'CUSTOMER', 'B2B_CUSTOMER'];

export function UserModal({ isOpen, onClose, onSave, userToEdit, defaultRoleForCreate = 'CUSTOMER' }: UserModalProps) {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      role: defaultRoleForCreate,
      companyName: '',
      vatNumber: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
        if (userToEdit) {
            form.reset({
                name: userToEdit.name || '',
                email: userToEdit.email || '',
                phone: userToEdit.phone || '',
                role: userToEdit.role,
                companyName: userToEdit.companyName || '',
                vatNumber: userToEdit.vatNumber || '',
            });
        } else {
            form.reset({
                name: '',
                email: '',
                phone: '',
                role: defaultRoleForCreate,
                companyName: '',
                vatNumber: '',
            });
        }
    }
  }, [userToEdit, form, isOpen, defaultRoleForCreate]);

  const onSubmit = (data: UserFormValues) => {
    onSave(data, userToEdit?.uid);
    onClose();
  };
  
  const role = form.watch('role');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{userToEdit ? 'Edit User' : 'Create New User'}</DialogTitle>
          <DialogDescription>
            {userToEdit ? 'Update the user details below.' : 'Enter details for the new user. Note: Password must be set separately via Firebase Authentication.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="e.g., John Doe" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
             <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input placeholder="user@example.com" {...field} disabled={!!userToEdit} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
                 <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>Phone (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ROLES.map(role => (
                                <SelectItem key={role} value={role}>{role.replace('_', ' ')}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
            </div>
            {role === 'B2B_CUSTOMER' && (
                <>
                    <FormField control={form.control} name="companyName" render={({ field }) => (
                        <FormItem><FormLabel>Company Name</FormLabel><FormControl><Input placeholder="e.g., Averzo Inc." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField control={form.control} name="vatNumber" render={({ field }) => (
                        <FormItem><FormLabel>VAT Number (Optional)</FormLabel><FormControl><Input placeholder="Enter VAT/TIN" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">Save User</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
