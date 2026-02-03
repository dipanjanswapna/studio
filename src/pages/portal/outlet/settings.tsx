'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/context/authContext";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

const outletSettingsSchema = z.object({
  name: z.string().min(3, "Outlet name must be at least 3 characters."),
  outletAddress: z.string().optional(),
});

type OutletSettingsFormValues = z.infer<typeof outletSettingsSchema>;

export default function OutletSettingsPage() {
    const { user, updateUser } = useAuth();
    const { toast } = useToast();

    const form = useForm<OutletSettingsFormValues>({
        resolver: zodResolver(outletSettingsSchema),
        values: {
            name: user?.name || '',
            outletAddress: user?.outletAddress || '',
        }
    });

    const onSubmit = (data: OutletSettingsFormValues) => {
        updateUser(data);
        toast({
            title: "Settings Saved",
            description: "Your outlet information has been updated.",
        });
    };
    
    return (
        <div className="grid gap-6">
            <h1 className="text-2xl font-bold">Outlet Settings</h1>
             <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Outlet Information</CardTitle>
                            <CardDescription>Manage your outlet's public information.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Outlet Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Your Outlet Name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="outletAddress"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Outlet Address</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Enter the physical address of the outlet..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" loading={form.formState.isSubmitting}>Save Changes</Button>
                        </CardFooter>
                    </Card>
                </form>
            </Form>
        </div>
    );
}

    