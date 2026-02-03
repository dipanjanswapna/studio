'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ProfileLayout } from '@/components/layouts/ProfileLayout';
import { motion } from 'framer-motion';
import { Tag, Package, Newspaper, Mail, Bell, Truck } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/authContext';
import { useFirestore, useDoc } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: {type: 'spring', stiffness: 100} },
};

type NotificationSettings = {
    email: {
        promotionalOffers: boolean;
        newProducts: boolean;
        newsletter: boolean;
    };
    push: {
        orderStatus: boolean;
        promotionalOffers: boolean;
    };
};

const defaultSettings: NotificationSettings = {
    email: {
        promotionalOffers: true,
        newProducts: false,
        newsletter: true,
    },
    push: {
        orderStatus: true,
        promotionalOffers: true,
    },
};

export default function NotificationsPage() {
    const { user } = useAuth();
    const db = useFirestore();
    const { toast } = useToast();

    const settingsRef = useMemo(() => user ? doc(db, `users/${user.uid}/settings`, 'notifications') : null, [user, db]);

    const { data: settingsData, loading } = useDoc<NotificationSettings>(settingsRef);
    const [settings, setSettings] = useState<NotificationSettings | null>(null);
    
    useEffect(() => {
        if (settingsData) {
            setSettings(settingsData);
        } else if (!loading && user && !settingsData) {
            // If no settings exist in DB, initialize with defaults
            setSettings(defaultSettings);
        }
    }, [settingsData, loading, user]);

    const handleSettingChange = async (category: keyof NotificationSettings, key: string, value: boolean) => {
        if (!settingsRef || !settings) return;

        const newSettings = {
            ...settings,
            [category]: {
                ...settings[category],
                [key]: value,
            },
        };
        setSettings(newSettings); // Optimistic update

        try {
            await setDoc(settingsRef, newSettings, { merge: true });
            toast({
              title: "Settings Updated",
              description: "Your notification preferences have been saved.",
            });
        } catch (e: any) {
            const permissionError = new FirestorePermissionError({
                path: settingsRef.path,
                operation: 'update',
                requestResourceData: newSettings
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({
              variant: "destructive",
              title: "Update Failed",
              description: "Could not save your preferences. Please try again.",
            });
            setSettings(settingsData || defaultSettings); // Revert on failure
        }
    };
    
    const renderSkeleton = () => (
        <div className="space-y-6">
            <div>
                <Skeleton className="h-5 w-24 mb-3" />
                <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                </div>
            </div>
            <Separator />
            <div>
                <Skeleton className="h-5 w-24 mb-3" />
                <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                </div>
            </div>
        </div>
    );

    return (
        <ProfileLayout>
            <motion.div variants={itemVariants}>
                <Card>
                    <CardHeader>
                        <CardTitle>Notification Settings</CardTitle>
                        <CardDescription>Choose how and what you want to be notified about.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       {loading || !settings ? renderSkeleton() : (
                         <div className="space-y-6">
                            <div>
                                <h4 className="font-medium text-lg mb-4">By Content</h4>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 rounded-lg border bg-secondary/30">
                                        <div className="flex items-center gap-4">
                                            <Tag className="w-5 h-5 text-muted-foreground" />
                                            <div>
                                                <Label htmlFor="promo-offers" className="font-semibold cursor-pointer">Email - Promotional Offers</Label>
                                                <p className="text-sm text-muted-foreground">Receive special deals and discounts.</p>
                                            </div>
                                        </div>
                                        <Switch id="promo-offers" checked={settings.email.promotionalOffers} onCheckedChange={(c) => handleSettingChange('email', 'promotionalOffers', c)} />
                                    </div>
                                    <div className="flex items-center justify-between p-4 rounded-lg border bg-secondary/30">
                                        <div className="flex items-center gap-4">
                                            <Package className="w-5 h-5 text-muted-foreground" />
                                            <div>
                                                <Label htmlFor="new-products" className="font-semibold cursor-pointer">Email - New Product Announcements</Label>
                                                <p className="text-sm text-muted-foreground">Be the first to know about new arrivals.</p>
                                            </div>
                                        </div>
                                        <Switch id="new-products" checked={settings.email.newProducts} onCheckedChange={(c) => handleSettingChange('email', 'newProducts', c)} />
                                    </div>
                                    <div className="flex items-center justify-between p-4 rounded-lg border bg-secondary/30">
                                        <div className="flex items-center gap-4">
                                            <Newspaper className="w-5 h-5 text-muted-foreground" />
                                            <div>
                                                <Label htmlFor="newsletter" className="font-semibold cursor-pointer">Email - Weekly Newsletter</Label>
                                                <p className="text-sm text-muted-foreground">Get our weekly roundup of top products and articles.</p>
                                            </div>
                                        </div>
                                        <Switch id="newsletter" checked={settings.email.newsletter} onCheckedChange={(c) => handleSettingChange('email', 'newsletter', c)} />
                                    </div>
                                    <div className="flex items-center justify-between p-4 rounded-lg border bg-secondary/30">
                                        <div className="flex items-center gap-4">
                                            <Truck className="w-5 h-5 text-muted-foreground" />
                                            <div>
                                                <Label htmlFor="order-status" className="font-semibold cursor-pointer">Push - Order Status Updates</Label>
                                                <p className="text-sm text-muted-foreground">Get push notifications about your order status.</p>
                                            </div>
                                        </div>
                                        <Switch id="order-status" checked={settings.push.orderStatus} onCheckedChange={(c) => handleSettingChange('push', 'orderStatus', c)} />
                                    </div>
                                </div>
                            </div>
                        </div>
                       )}
                    </CardContent>
                </Card>
            </motion.div>
        </ProfileLayout>
    );
}
