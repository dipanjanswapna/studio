import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Users2 } from "lucide-react";

export default function StaffCustomersPage() {
  return (
      <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <Users2 className="w-6 h-6" />
                  Customer Management
              </CardTitle>
              <CardDescription>
                  View customer information and purchase history.
              </CardDescription>
          </CardHeader>
          <CardContent>
              <div className="min-h-[300px] flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-lg bg-secondary/50">
                  <Users2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <div className="mt-4">
                      <h2 className="text-xl font-semibold">Customer Database Coming Soon</h2>
                      <p className="mt-1 text-muted-foreground">
                          This section will allow you to look up customers and view their details.
                      </p>
                  </div>
              </div>
          </CardContent>
      </Card>
  );
}
