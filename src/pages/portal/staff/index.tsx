import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  DollarSign,
  ShoppingCart,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function StaffDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Sales Today</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳125,075</div>
            <p className="text-xs text-muted-foreground flex items-center">
                5 transactions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground flex items-center">
                2 pending pickup
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers Served</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">9</div>
             <p className="text-xs text-muted-foreground">
                Today
            </p>
          </CardContent>
        </Card>
        <Card className="flex flex-col items-center justify-center bg-primary text-primary-foreground">
          <CardContent className="p-4 text-center">
            <Link href="/portal/staff/pos">
              <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                Start New Sale (POS)
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

       <Card>
        <CardHeader>
          <CardTitle>Welcome to your Staff Portal</CardTitle>
          <CardDescription>
            Use the POS system to create new sales and manage customer orders.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>This is a placeholder for more staff-specific components like recent transactions.</p>
        </CardContent>
      </Card>
    </div>
  );
}
