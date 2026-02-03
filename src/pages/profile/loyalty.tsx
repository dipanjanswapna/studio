import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/context/authContext';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, writeBatch, serverTimestamp, doc } from 'firebase/firestore';
import type { LoyaltyPointEntry, Reward, Voucher } from '@/data/types';
import { getIcon } from '@/lib/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: {type: 'spring', stiffness: 100} },
};

export default function LoyaltyPage() {
    const { user } = useAuth();
    const db = useFirestore();
    const { toast } = useToast();
    const [redeemingId, setRedeemingId] = useState<string | null>(null);

    const historyQuery = useMemo(() => 
        user ? query(collection(db, 'users', user.uid, 'loyaltyPoints'), orderBy('date', 'desc')) : null
    , [user, db]);
    const { data: loyaltyHistory, loading: historyLoading } = useCollection<LoyaltyPointEntry>(historyQuery);

    const rewardsQuery = useMemo(() => query(collection(db, 'rewards'), orderBy('points', 'asc')), [db]);
    const { data: rewards, loading: rewardsLoading } = useCollection<Reward>(rewardsQuery);
    
    const userPoints = useMemo(() => {
        if (!loyaltyHistory) return 0;
        return loyaltyHistory.reduce((acc, entry) => acc + entry.points, 0);
    }, [loyaltyHistory]);
    
    const handleRedeem = async (reward: Reward) => {
        if (!user || userPoints < reward.points) {
            toast({ variant: 'destructive', title: 'Not enough points' });
            return;
        }
        setRedeemingId(reward.id);

        try {
            const batch = writeBatch(db);

            // 1. Deduct points
            const pointsHistoryRef = collection(db, 'users', user.uid, 'loyaltyPoints');
            const pointsEntry: Omit<LoyaltyPointEntry, 'id' | 'date'> & { date: any } = {
                date: serverTimestamp(),
                description: `Redeemed: ${reward.reward}`,
                points: -reward.points,
                type: 'redeem'
            };
            batch.set(doc(pointsHistoryRef), pointsEntry);

            // 2. Create voucher
            const vouchersRef = collection(db, 'users', user.uid, 'vouchers');
            const voucherCode = `AVZ-${reward.id.slice(0,2).toUpperCase()}-${Date.now().toString().slice(-6)}`;
            const voucherEntry: Omit<Voucher, 'id' | 'createdAt'> & { createdAt: any } = {
                userId: user.uid,
                rewardId: reward.id,
                rewardDescription: reward.reward,
                code: voucherCode,
                createdAt: serverTimestamp(),
                isUsed: false
            };
            batch.set(doc(vouchersRef), voucherEntry);

            await batch.commit();

            toast({
                title: 'Reward Redeemed!',
                description: `Your voucher for "${reward.reward}" has been added to your account.`
            });

        } catch (e: any) {
            const permissionError = new FirestorePermissionError({
                path: `users/${user.uid}/vouchers`,
                operation: 'create',
                requestResourceData: { rewardId: reward.id },
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({ variant: 'destructive', title: 'Redemption Failed', description: 'Could not process your redemption.' });
        } finally {
            setRedeemingId(null);
        }
    }


  return (
    <div className="space-y-8">
      <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                      <Trophy className="w-8 h-8" />
                      <span>Loyalty Program</span>
                  </CardTitle>
                  <CardDescription className="text-amber-100">Your loyalty points & rewards.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                  <div>
                      <p className="text-sm uppercase tracking-wider text-amber-200">Current Balance</p>
                      {historyLoading ? (
                          <Skeleton className="h-12 w-48 mt-1 bg-white/20" />
                      ) : (
                          <p className="text-5xl font-bold">{userPoints.toLocaleString()} <span className="text-3xl font-normal">Points</span></p>
                      )}
                  </div>
                  <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                      How to Earn
                  </Button>
              </CardContent>
          </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
          <Card>
              <CardHeader>
                  <CardTitle>Redeem Rewards</CardTitle>
                  <CardDescription>Use your points to get exclusive rewards.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rewardsLoading ? (
                      [...Array(3)].map((_, i) => <Skeleton key={i} className="h-56 w-full" />)
                  ) : (
                      rewards?.map((reward) => {
                          const Icon = getIcon(reward.iconName);
                          return (
                              <Card key={reward.id} className="bg-secondary/50 flex flex-col justify-between">
                                  <CardContent className="pt-6 text-center">
                                      <div className="mx-auto w-fit bg-primary/10 text-primary p-4 rounded-full mb-4">
                                          <Icon className="w-8 h-8" />
                                      </div>
                                      <p className="text-lg font-semibold">{reward.reward}</p>
                                      <p className="text-2xl font-bold text-primary mt-2">{reward.points.toLocaleString()} Points</p>
                                  </CardContent>
                                  <div className="p-4 pt-0">
                                      <Button 
                                          className="w-full" 
                                          disabled={userPoints < reward.points || !!redeemingId}
                                          loading={redeemingId === reward.id}
                                          onClick={() => handleRedeem(reward)}
                                      >
                                          Redeem
                                      </Button>
                                  </div>
                              </Card>
                          )
                      })
                  )}
              </CardContent>
          </Card>
      </motion.div>
      
      <motion.div variants={itemVariants}>
          <Card>
              <CardHeader>
                  <CardTitle>Points History</CardTitle>
                  <CardDescription>Track your points earnings and redemptions.</CardDescription>
              </CardHeader>
              <CardContent>
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead className="text-right">Points</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {historyLoading ? (
                              [...Array(4)].map((_, i) => (
                                  <TableRow key={i}>
                                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                      <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                                  </TableRow>
                              ))
                          ) : loyaltyHistory && loyaltyHistory.length > 0 ? (
                              loyaltyHistory.map((entry) => (
                                  <TableRow key={entry.id}>
                                      <TableCell className="text-muted-foreground">
                                          {new Date(entry.date.seconds * 1000).toLocaleDateString()}
                                      </TableCell>
                                      <TableCell>{entry.description}</TableCell>
                                      <TableCell className={`text-right font-medium ${entry.type === 'earn' ? 'text-green-600' : 'text-destructive'}`}>
                                          {entry.points > 0 && entry.type === 'earn' ? '+' : ''}
                                          {entry.points.toLocaleString()}
                                      </TableCell>
                                  </TableRow>
                              ))
                          ) : (
                              <TableRow>
                                  <TableCell colSpan={3} className="text-center h-24">No points history found.</TableCell>
                              </TableRow>
                          )}
                      </TableBody>
                  </Table>
              </CardContent>
          </Card>
      </motion.div>
    </div>
  );
}
