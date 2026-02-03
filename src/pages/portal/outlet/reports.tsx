import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { LineChart } from "lucide-react";

export default function OutletReportsPage() {
  return (
      <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <LineChart className="w-6 h-6" />
                  Sales Reports
              </CardTitle>
              <CardDescription>
                  Analyze sales data and performance for this outlet.
              </CardDescription>
          </CardHeader>
          <CardContent>
              <div className="min-h-[300px] flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-lg bg-secondary/50">
                  <LineChart className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <div className="mt-4">
                      <h2 className="text-xl font-semibold">Reporting Module Coming Soon</h2>
                      <p className="mt-1 text-muted-foreground">
                          This section will provide detailed sales reports and analytics.
                      </p>
                  </div>
              </div>
          </CardContent>
      </Card>
  );
}
