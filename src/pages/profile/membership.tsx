import { ProfileLayout } from '@/components/layouts/ProfileLayout';
import { motion } from 'framer-motion';
import { MembershipCard } from '@/components/cards/MembershipCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Gift, Truck, Gem, Crown, Check } from 'lucide-react';
import { useAuth } from '@/context/authContext';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Order } from '@/data/types';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';


const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: {type: 'spring', stiffness: 100} },
};

const benefits = [
    { title: "Exclusive Discounts", description: "Get up to 15% off on selected items.", icon: Award, tiers: ["Gold", "Platinum", "Diamond"] },
    { title: "Free Shipping", description: "Enjoy free shipping on all orders above ৳2000.", icon: Truck, tiers: ["Platinum", "Diamond"] },
    { title: "Birthday Gift", description: "Receive a special gift during your birthday month.", icon: Gift, tiers: ["Diamond"] },
];

const tiersData = [
    { name: "Gold", requirement: 0, spend_next: 25000, icon: Award, description: "Start your journey with exclusive member-only deals." },
    { name: "Platinum", requirement: 25000, spend_next: 100000, icon: Gem, description: "Unlock priority support and early access to sales." },
    { name: "Diamond", requirement: 100000, spend_next: null, icon: Crown, description: "Enjoy top-tier benefits including dedicated support." },
] as const;

export default function MembershipPage() {
    const { user } = useAuth();
    const db = useFirestore();

    const ordersQuery = useMemo(() => {
        if (!user) return null;
        return query(
            collection(db, 'orders'),
            where('userId', '==', user.uid),
            where('status', '==', 'Delivered')
        );
    }, [user, db]);
    const { data: deliveredOrders, loading: ordersLoading } = useCollection<Order>(ordersQuery);

    const userSpend = useMemo(() => {
        if (!deliveredOrders) return 0;
        return deliveredOrders.reduce((acc, order) => acc + order.total, 0);
    }, [deliveredOrders]);
  
    if (!user || !user.membershipId || !user.membershipTier) {
        return (
            <ProfileLayout>
                <div>Loading membership details...</div>
            </ProfileLayout>
        );
    }
    
    const currentTierName = user.membershipTier;
    const currentTierIndex = tiersData.findIndex(t => t.name === currentTierName);
    const nextTier = currentTierIndex < tiersData.length - 1 ? tiersData[currentTierIndex + 1] : null;

    const progressToNextTier = nextTier 
        ? Math.round(((userSpend - tiersData[currentTierIndex].requirement) / (nextTier.requirement - tiersData[currentTierIndex].requirement)) * 100)
        : 100;
    
    return (
        <ProfileLayout>
            <div className="space-y-8">
                 <motion.div variants={itemVariants}>
                    <MembershipCard
                        name={user.name || 'Averzo Member'}
                        tier={user.membershipTier}
                        memberId={user.membershipId}
                    />
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Membership Progress</CardTitle>
                            <CardDescription>Track your progress to the next membership tier.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           {ordersLoading ? (
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-1/4" />
                                <Skeleton className="h-3 w-1/2" />
                                <Skeleton className="h-3 w-full" />
                            </div>
                           ) : nextTier ? (
                                <div>
                                    <h3 className="font-semibold text-center md:text-left">Progress to {nextTier.name}</h3>
                                    <p className="text-sm text-muted-foreground mt-1 text-center md:text-left">
                                        You are <span className="font-bold text-primary">৳{(nextTier.requirement - userSpend).toLocaleString()}</span> away from unlocking new benefits!
                                    </p>
                                    <Progress value={progressToNextTier} className="mt-3 h-3" />
                                </div>
                            ) : (
                                 <p className="text-center font-medium text-green-600">You have reached the highest membership tier! 🎉</p>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                 <motion.div variants={itemVariants}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Membership Tiers & Benefits</CardTitle>
                            <CardDescription>Explore the benefits and rewards of each membership tier.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {tiersData.map((tier) => {
                                const isCurrent = tier.name === currentTierName;
                                return (
                                    <div key={tier.name} className={cn("border rounded-xl flex flex-col gap-4 p-4", isCurrent && "border-2 border-primary bg-primary/5")}>
                                        <MembershipCard name={tier.name + " Member"} tier={tier.name} memberId="AVZ-XXX-XXX" />
                                        <div className="text-center">
                                            {isCurrent && <Badge>Your Tier</Badge>}
                                        </div>
                                        <div className="flex-grow flex flex-col">
                                            <p className="text-sm text-center text-muted-foreground">{tier.description}</p>
                                            <p className="text-sm font-semibold text-center mt-3">
                                                Requirement: <span className="font-bold">Spend ৳{tier.requirement.toLocaleString()}</span>
                                            </p>
                                            <Separator className="my-4" />
                                            <h4 className="font-semibold text-sm mb-2">Benefits:</h4>
                                            <ul className="space-y-2 text-sm flex-grow">
                                                {benefits.filter(b => b.tiers.includes(tier.name)).map(b => (
                                                    <li key={b.title} className="flex items-start gap-2">
                                                        <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                                        <span className="text-muted-foreground">{b.title}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </ProfileLayout>
    );
}
