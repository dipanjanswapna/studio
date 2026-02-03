'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Briefcase } from "lucide-react";

export default function B2BPage() {
  return (
      <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-6 h-6" />
                  B2B Management
              </CardTitle>
              <CardDescription>
                  Manage business-to-business clients, bulk orders, and corporate accounts.
              </CardDescription>
          </CardHeader>
          <CardContent>
              <div className="min-h-[300px] flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-lg bg-secondary/50">
                  <Briefcase className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <div className="mt-4">
                      <h2 className="text-xl font-semibold">B2B Module Coming Soon</h2>
                      <p className="mt-1 text-muted-foreground">
                          This section will allow you to manage corporate clients and bulk purchasing.
                      </p>
                  </div>
              </div>
          </CardContent>
      </Card>
  );
}
