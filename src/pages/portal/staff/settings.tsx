import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/authContext";

export default function StaffSettingsPage() {
    const { user } = useAuth();
    return (
        <div className="grid gap-6">
            <h1 className="text-2xl font-bold">Staff Settings</h1>
             <Card>
                <CardHeader>
                    <CardTitle>My Profile</CardTitle>
                    <CardDescription>Manage your personal information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="staff-name">Full Name</Label>
                        <Input id="staff-name" defaultValue={user?.name || ''} />
                    </div>
                    <div className="space-y-2">
                        <Label>Email Address</Label>
                        <Input type="email" value={user?.email || ''} disabled />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="staff-phone">Phone Number</Label>
                        <Input id="staff-phone" defaultValue={user?.phone || ''} />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button>Save Changes</Button>
                </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>It's a good idea to use a strong password that you're not using elsewhere.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input id="current-password" type="password" />
                  </div>
                   <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input id="new-password" type="password" />
                  </div>
              </CardContent>
               <CardFooter>
                  <Button>Update Password</Button>
               </CardFooter>
          </Card>
        </div>
    );
}
