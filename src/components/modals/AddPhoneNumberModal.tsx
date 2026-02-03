'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/authContext';
import { useRequiredAction } from '@/context/RequiredActionContext';
import { useToast } from '@/hooks/use-toast';
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
import { Phone } from 'lucide-react';

const phoneSchema = z.object({
  phone: z.string().min(11, 'Please enter a valid 11-digit phone number.').max(14),
});

type PhoneFormValues = z.infer<typeof phoneSchema>;

export function AddPhoneNumberModal() {
  const { isPhoneNumberModalOpen, closePhoneNumberModal } = useRequiredAction();
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  const form = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone: user?.phone || '',
    },
  });
  
  const onSubmit = (data: PhoneFormValues) => {
    updateUser({ phone: data.phone });
    toast({
      title: 'Phone Number Saved!',
      description: 'Your phone number has been updated successfully.',
    });
    closePhoneNumberModal();
    form.reset();
  };

  return (
    <Dialog open={isPhoneNumberModalOpen} onOpenChange={(open) => !open && closePhoneNumberModal()}>
      <DialogContent>
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
              <Phone className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">Phone Number Required</DialogTitle>
          <DialogDescription className="text-center">
            To proceed, please add and save your phone number.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 01712345678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" loading={form.formState.isSubmitting} className="w-full">
                Save and Continue
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
