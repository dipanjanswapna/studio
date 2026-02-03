'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Banknote } from "lucide-react";

export default function FinancePage() {
    return (
      <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <Banknote className="w-6 h-6" />
                  Finance & Accounting
              </CardTitle>
              <CardDescription>
                  View financial reports, manage payouts, and oversee transactions.
              </CardDescription>
          </CardHeader>
          <CardContent>
               <div className="min-h-[300px] flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-lg bg-secondary/50">
                  <Banknote className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <div className="mt-4">
                      <h2 className="text-xl font-semibold">Finance Module Coming Soon</h2>
                      <p className="mt-1 text-muted-foreground">
                          This section will provide detailed financial analytics and reporting tools.
                      </p>
                  </div>
              </div>
          </CardContent>
      </Card>
  );
}
