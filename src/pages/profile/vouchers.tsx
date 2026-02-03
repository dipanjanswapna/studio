'use client';
import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Ticket, Copy } from 'lucide-react';
import { ProfileLayout } from '@/components/layouts/ProfileLayout';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/authContext';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Voucher } from '@/data/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: {type: 'spring', stiffness: 100} },
};

export default function VouchersPage() {
    const { user } = useAuth();
    const db = useFirestore();
    const { toast } = useToast();

    const vouchersQuery = useMemo(() => 
        user ? query(collection(db, 'users', user.uid, 'vouchers'), orderBy('createdAt', 'desc')) : null
    , [user, db]);
    const { data: vouchers, loading } = useCollection<Voucher>(vouchersQuery);
    
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: 'Code Copied!', description: `Voucher code copied to clipboard.`});
    };

    return (
        <ProfileLayout>
            <motion.div variants={itemVariants}>
                <Card>
                    <CardHeader>
                        <CardTitle>My Vouchers</CardTitle>
                        <CardDescription>Here are the vouchers you have redeemed with your loyalty points.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-4">
                                <Skeleton className="h-28 w-full" />
                                <Skeleton className="h-28 w-full" />
                            </div>
                        ) : !vouchers || vouchers.length === 0 ? (
                            <div className="min-h-[300px] flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-lg bg-secondary/50">
                                <Ticket className="mx-auto h-12 w-12 text-muted-foreground/50" />
                                <h2 className="mt-4 text-xl font-semibold">No Vouchers Yet</h2>
                                <p className="mt-1 text-muted-foreground">Redeem your loyalty points to get exciting vouchers.</p>
                                <Button asChild className="mt-6">
                                    <Link href="/profile/loyalty">Go to Loyalty Program</Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {vouchers.map(voucher => (
                                    <div key={voucher.id} className="border rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <Ticket className="w-8 h-8 text-primary shrink-0" />
                                            <div>
                                                <h3 className="font-semibold text-lg">{voucher.rewardDescription}</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Redeemed on: {new Date(voucher.createdAt.seconds * 1000).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                                            <div className="flex items-center gap-2 border-2 border-dashed rounded-md p-2 bg-secondary/50 sm:order-first">
                                                <span className="font-mono font-bold text-primary tracking-widest">{voucher.code}</span>
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(voucher.code)}>
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            {voucher.isUsed && <Badge variant="secondary">Used</Badge>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </ProfileLayout>
    );
}
