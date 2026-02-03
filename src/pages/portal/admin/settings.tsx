'use client';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirestore, useDoc } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useMemo } from "react";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

const generalSchema = z.object({
    siteName: z.string().min(3, "Site name is required."),
    siteDescription: z.string().optional(),
});

const integrationsSchema = z.object({
    googleAnalyticsId: z.string().optional(),
});

type GeneralFormValues = z.infer<typeof generalSchema>;
type IntegrationsFormValues = z.infer<typeof integrationsSchema>;

type SiteSettings = GeneralFormValues & IntegrationsFormValues;


export default function AdminSettingsPage() {
    const db = useFirestore();
    const { toast } = useToast();

    const settingsRef = useMemo(() => doc(db, 'settings', 'site'), [db]);
    const { data: settings, loading } = useDoc<SiteSettings>(settingsRef);
    
    const generalForm = useForm<GeneralFormValues>({
        resolver: zodResolver(generalSchema),
        defaultValues: { siteName: '', siteDescription: '' }
    });

    const integrationsForm = useForm<IntegrationsFormValues>({
        resolver: zodResolver(integrationsSchema),
        defaultValues: { googleAnalyticsId: '' }
    });

    useEffect(() => {
        if (settings) {
            generalForm.reset({
                siteName: settings.siteName || '',
                siteDescription: settings.siteDescription || '',
            });
            integrationsForm.reset({
                googleAnalyticsId: settings.googleAnalyticsId || '',
            });
        }
    }, [settings, generalForm, integrationsForm]);

    const handleSave = async (data: Partial<SiteSettings>) => {
        try {
            await setDoc(settingsRef, data, { merge: true });
            toast({ title: 'Settings Saved', description: 'Your changes have been saved successfully.' });
        } catch(e) {
            const permissionError = new FirestorePermissionError({
                path: settingsRef.path,
                operation: 'update',
                requestResourceData: data,
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save settings.' });
        }
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold">Settings</h1>
                <Skeleton className="h-10 w-72" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-4 w-64" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                           <Skeleton className="h-4 w-20" />
                           <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                           <Skeleton className="h-4 w-20" />
                           <Skeleton className="h-10 w-full" />
                        </div>
                    </CardContent>
                    <CardFooter>
                         <Skeleton className="h-10 w-24" />
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <Tabs defaultValue="general" className="flex flex-col gap-6">
            <h1 className="text-2xl font-bold">Settings</h1>
            <TabsList className="w-full sm:w-auto self-start">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="appearance">Appearance</TabsTrigger>
                <TabsTrigger value="integrations">Integrations</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general">
                 <Form {...generalForm}>
                    <form onSubmit={generalForm.handleSubmit(handleSave)}>
                        <Card>
                            <CardHeader>
                                <CardTitle>General Settings</CardTitle>
                                <CardDescription>Manage your application's basic information.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={generalForm.control}
                                    name="siteName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Site Name</FormLabel>
                                            <FormControl><Input placeholder="e.g., AVERzO" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={generalForm.control}
                                    name="siteDescription"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Site Description</FormLabel>
                                            <FormControl><Input placeholder="e.g., Unified Shopping Experience" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" loading={generalForm.formState.isSubmitting}>Save General</Button>
                            </CardFooter>
                        </Card>
                    </form>
                 </Form>
            </TabsContent>
            <TabsContent value="appearance">
                <Card>
                    <CardHeader>
                        <CardTitle>Appearance</CardTitle>
                        <CardDescription>Customize the look and feel of your application.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       <div className="space-y-2">
                            <Label>Theme</Label>
                            <p className="text-sm text-muted-foreground">Theme customization is handled through globals.css.</p>
                        </div>
                         <div className="space-y-2">
                            <Label>Logo</Label>
                            <Input type="file" />
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
             <TabsContent value="integrations">
                <Form {...integrationsForm}>
                    <form onSubmit={integrationsForm.handleSubmit(handleSave)}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Integrations</CardTitle>
                                <CardDescription>Manage third-party service integrations.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={integrationsForm.control}
                                    name="googleAnalyticsId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Google Analytics ID</FormLabel>
                                            <FormControl><Input placeholder="G-XXXXXXXXXX" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" loading={integrationsForm.formState.isSubmitting}>Save Integrations</Button>
                            </CardFooter>
                        </Card>
                    </form>
                </Form>
            </TabsContent>
            <TabsContent value="advanced">
                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="text-destructive">Advanced Settings</CardTitle>
                        <CardDescription>Handle with care. These settings can affect your application's stability.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="destructive">Flush Cache</Button>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
