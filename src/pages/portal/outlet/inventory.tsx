import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Package } from "lucide-react";

export default function OutletInventoryPage() {
  return (
      <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <Package className="w-6 h-6" />
                  Outlet Inventory
              </CardTitle>
              <CardDescription>
                  View and manage product stock for this outlet.
              </CardDescription>
          </CardHeader>
          <CardContent>
              <div className="min-h-[300px] flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-lg bg-secondary/50">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <div className="mt-4">
                      <h2 className="text-xl font-semibold">Outlet-Specific Inventory Coming Soon</h2>
                      <p className="mt-1 text-muted-foreground">
                          This section will allow you to manage stock levels for each product at this specific outlet.
                      </p>
                  </div>
              </div>
          </CardContent>
      </Card>
  );
}
