'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { LifeBuoy } from "lucide-react";

export default function SupportPage() {
    return (
      <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <LifeBuoy className="w-6 h-6" />
                  Support & Helpdesk
              </CardTitle>
              <CardDescription>
                  Manage customer support tickets, FAQs, and help resources.
              </CardDescription>
          </CardHeader>
          <CardContent>
               <div className="min-h-[300px] flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-lg bg-secondary/50">
                  <LifeBuoy className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <div className="mt-4">
                      <h2 className="text-xl font-semibold">Support Module Coming Soon</h2>
                      <p className="mt-1 text-muted-foreground">
                          This section will integrate a helpdesk for managing customer inquiries.
                      </p>
                  </div>
              </div>
          </CardContent>
      </Card>
  );
}
