'use client';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/context/authContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useRouter } from "next/router";
import { useEffect } from "react";

const storeSchema = z.object({
  name: z.string().min(3, "Store name must be at least 3 characters."),
  storeDescription: z.string().optional(),
});
type StoreFormValues = z.infer<typeof storeSchema>;

const payoutsSchema = z.object({
  bankName: z.string().min(2, "Bank name is required."),
  accountName: z.string().min(2, "Account holder name is required."),
  accountNumber: z.string().min(5, "A valid account number is required."),
});
type PayoutsFormValues = z.infer<typeof payoutsSchema>;

const profileSchema = z.object({
  phone: z.string().optional(),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

export default function VendorSettingsPage() {
    const { user, updateUser, loading } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const { tab } = router.query;

    const storeForm = useForm<StoreFormValues>({
        resolver: zodResolver(storeSchema),
        values: { name: user?.name || '', storeDescription: user?.storeDescription || '' },
    });

    const payoutsForm = useForm<PayoutsFormValues>({
        resolver: zodResolver(payoutsSchema),
        values: { bankName: user?.bankName || '', accountName: user?.accountName || '', accountNumber: user?.accountNumber || '' },
    });

    const profileForm = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        values: { phone: user?.phone || '' },
    });
    
    // Effect to sync form values if user data loads after form init
    useEffect(() => {
        if(user) {
            storeForm.reset({ name: user.name || '', storeDescription: user.storeDescription || '' });
            payoutsForm.reset({ bankName: user.bankName || '', accountName: user.accountName || '', accountNumber: user.accountNumber || '' });
            profileForm.reset({ phone: user.phone || '' });
        }
    }, [user, storeForm, payoutsForm, profileForm]);


    const handleUpdate = (data: Partial<StoreFormValues | PayoutsFormValues | ProfileFormValues>, message: string) => {
        updateUser(data);
        toast({
            title: "Success!",
            description: message,
        });
    };

    return (
        <Tabs defaultValue="store" value={typeof tab === 'string' ? tab : 'store'} onValueChange={(value) => router.push({ pathname: '/portal/vendor/settings', query: { tab: value } }, undefined, { shallow: true })} className="flex flex-col gap-6">
            <h1 className="text-2xl font-bold">Settings</h1>
            <TabsList className="w-full sm:w-auto self-start">
                <TabsTrigger value="store">Store</TabsTrigger>
                <TabsTrigger value="payouts">Payouts</TabsTrigger>
                <TabsTrigger value="profile">Profile</TabsTrigger>
            </TabsList>
            
            <TabsContent value="store">
                <Form {...storeForm}>
                    <form onSubmit={storeForm.handleSubmit((data) => handleUpdate(data, "Your store information has been updated."))}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Store Settings</CardTitle>
                                <CardDescription>Manage your public store information and policies.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={storeForm.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Store Name</FormLabel>
                                            <FormControl><Input placeholder="Your Store Name" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={storeForm.control}
                                    name="storeDescription"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Store Description</FormLabel>
                                            <FormControl><Textarea placeholder="Describe what your store sells..." {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="space-y-2">
                                    <Label>Store Logo</Label>
                                    <Input type="file" />
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" loading={storeForm.formState.isSubmitting}>Save Store Info</Button>
                            </CardFooter>
                        </Card>
                    </form>
                </Form>
            </TabsContent>
            <TabsContent value="payouts">
                 <Form {...payoutsForm}>
                    <form onSubmit={payoutsForm.handleSubmit((data) => handleUpdate(data, "Your payout information has been updated."))}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Payout Information</CardTitle>
                                <CardDescription>Manage your bank account for receiving payouts. This information is kept secure.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                 <FormField
                                    control={payoutsForm.control}
                                    name="bankName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Bank Name</FormLabel>
                                            <FormControl><Input placeholder="e.g. City Bank" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   <FormField
                                        control={payoutsForm.control}
                                        name="accountName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Account Holder Name</FormLabel>
                                                <FormControl><Input placeholder="As it appears on your bank statement" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={payoutsForm.control}
                                        name="accountNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Account Number</FormLabel>
                                                <FormControl><Input placeholder="Enter your bank account number" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" loading={payoutsForm.formState.isSubmitting}>Save Payout Info</Button>
                            </CardFooter>
                        </Card>
                    </form>
                </Form>
            </TabsContent>
             <TabsContent value="profile">
                <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit((data) => handleUpdate(data, "Your profile information has been updated."))}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Vendor Profile</CardTitle>
                                <CardDescription>Manage your personal vendor information.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Email Address</Label>
                                    <Input type="email" value={user?.email || ''} disabled />
                                </div>
                                <FormField
                                    control={profileForm.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Phone Number</FormLabel>
                                            <FormControl><Input placeholder="Your contact number" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" loading={profileForm.formState.isSubmitting}>Save Profile Info</Button>
                            </CardFooter>
                        </Card>
                    </form>
                </Form>
            </TabsContent>
        </Tabs>
    );
}
