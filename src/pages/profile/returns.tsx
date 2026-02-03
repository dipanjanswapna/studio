import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Undo2, Truck, CheckCircle, XCircle, Plus, Hourglass, PackageCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/authContext';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { ReturnRequest } from '@/data/types';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

const getStatusInfo = (status: string) => {
    switch (status) {
        case 'Completed':
            return { icon: CheckCircle, color: 'success' as const, label: 'Completed' };
        case 'Pending Approval':
            return { icon: Hourglass, color: 'warning' as const, label: 'Pending' };
        case 'Rejected':
            return { icon: XCircle, color: 'destructive' as const, label: 'Rejected' };
        case 'Shipped by you':
            return { icon: Truck, color: 'info' as const, label: 'Shipped' };
        case 'Approved':
             return { icon: CheckCircle, color: 'info' as const, label: 'Approved' };
        case 'Received':
            return { icon: PackageCheck, color: 'info' as const, label: 'Received' };
        default:
            return { icon: Undo2, color: 'outline' as const, label: status };
    }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: {type: 'spring', stiffness: 100} },
};

export default function ReturnsPage() {
    const { user } = useAuth();
    const db = useFirestore();

    const returnsQuery = useMemo(() => {
        if (!user) return null;
        return query(collection(db, 'users', user.uid, 'returns'), orderBy('createdAt', 'desc'));
    }, [user, db]);

    const { data: returns, loading } = useCollection<ReturnRequest>(returnsQuery);

    const totalReturnAmount = (returnRequest: ReturnRequest) => {
      return returnRequest.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    }

  return (
    <motion.div variants={itemVariants}>
      <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
             <div>
                <CardTitle>My Returns</CardTitle>
                <CardDescription>Manage your return requests and track their status.</CardDescription>
             </div>
             <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" /> Start a New Return
             </Button>
          </CardHeader>
          <CardContent>
              {loading ? (
                <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
              ) : !returns || returns.length === 0 ? (
                  <div className="min-h-[300px] flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-lg bg-secondary/50">
                      <Undo2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <div className="mt-4">
                          <h2 className="text-xl font-semibold">No Return Requests</h2>
                          <p className="mt-1 text-muted-foreground">
                              You haven't made any return requests yet.
                          </p>
                      </div>
                  </div>
              ) : (
                  <Accordion type="multiple" className="space-y-4">
                      {returns.map((ret) => {
                            const statusInfo = getStatusInfo(ret.status);
                            const StatusIcon = statusInfo.icon;
                          return (
                          <AccordionItem value={ret.id} key={ret.id} className="border-none">
                              <Card className="overflow-hidden">
                                  <AccordionTrigger className="p-4 hover:no-underline hover:bg-accent/50 [&[data-state=open]]:border-b">
                                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-left w-full">
                                          <div className="flex items-center gap-4">
                                              <StatusIcon className="w-6 h-6 text-muted-foreground" />
                                              <div>
                                                  <p className="font-bold text-base">#{ret.id.slice(-6).toUpperCase()}</p>
                                                  <p className="text-sm text-muted-foreground">For Order: <Link href="/profile/orders" className="text-primary hover:underline" onClick={e => e.stopPropagation()}>{ret.orderId.slice(-6).toUpperCase()}</Link></p>
                                                  <p className="text-sm text-muted-foreground">Requested on: {new Date(ret.createdAt.seconds * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                              </div>
                                          </div>
                                          <div className="sm:ml-auto flex items-center gap-6">
                                            <Badge variant={statusInfo.color}>{statusInfo.label}</Badge>
                                            <p className="font-bold text-lg">৳{totalReturnAmount(ret).toFixed(2)}</p>
                                          </div>
                                      </div>
                                  </AccordionTrigger>
                                  <AccordionContent className="p-4">
                                      <h4 className="font-semibold mb-2">Returned Items:</h4>
                                      <div className="space-y-4">
                                          {ret.items.map((item, index) => (
                                              <div key={index} className="flex items-start gap-4">
                                                  {item.imageUrl && <Image src={item.imageUrl} alt={item.productName} width={64} height={64} className="rounded-md border object-cover" />}
                                                  <div className="flex-grow">
                                                      <p className="font-medium">{item.productName}</p>
                                                      <p className="text-sm text-muted-foreground">{item.variantName}</p>
                                                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                                  </div>
                                                  <p className="font-semibold text-right">৳{(item.price * item.quantity).toFixed(2)}</p>
                                              </div>
                                          ))}
                                          {ret.reason && (
                                            <>
                                                <Separator />
                                                <div className="pt-4">
                                                    <h4 className="font-semibold text-sm mb-1">Reason for Return:</h4>
                                                    <p className="text-sm text-muted-foreground">{ret.reason}</p>
                                                </div>
                                            </>
                                          )}
                                      </div>
                                  </AccordionContent>
                              </Card>
                          </AccordionItem>
                      )})}
                  </Accordion>
              )}
          </CardContent>
      </Card>
    </motion.div>
  );
}
