import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/authContext';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useEffect } from 'react';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: {type: 'spring', stiffness: 100} },
};

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(11, 'Please enter a valid phone number.').max(14),
  dob: z.date({
    required_error: "A date of birth is required.",
  }).optional(),
  gender: z.enum(['male', 'female', 'other'], {required_error: "Please select a gender."}).optional(),
  companyName: z.string().optional(),
  vatNumber: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      dob: user?.dob ? new Date(user.dob) : undefined,
      gender: user?.gender,
      companyName: user?.companyName || '',
      vatNumber: user?.vatNumber || '',
    },
  });

  useEffect(() => {
    if(user) {
        form.reset({
            name: user.name || '',
            phone: user.phone || '',
            dob: user.dob ? new Date(user.dob) : undefined,
            gender: user.gender,
            companyName: user.companyName || '',
            vatNumber: user.vatNumber || '',
        });
    }
  }, [user, form]);


  const onProfileSubmit = (data: ProfileFormValues) => {
    const userData = { ...data, dob: data.dob ? data.dob.toISOString() : undefined };
    updateUser(userData);
    toast({ title: "Profile Updated", description: "Your personal information has been saved." });
  };

  return (
    <div className="grid gap-8">
      <motion.div variants={itemVariants}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onProfileSubmit)}>
            <Card>
              <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your personal details here.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                      />
                      <div className="space-y-2">
                          <Label>Email Address</Label>
                          <Input type="email" value={user?.email || ''} disabled />
                      </div>
                  </div>
                   <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                                <Input type="tel" placeholder="e.g., 01712345678" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                      )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <FormField
                        control={form.control}
                        name="dob"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Date of birth</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date > new Date() || date < new Date("1900-01-01")
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                       <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Gender</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex space-x-4"
                              >
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="male" />
                                  </FormControl>
                                  <FormLabel className="font-normal">Male</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="female" />
                                  </FormControl>
                                  <FormLabel className="font-normal">Female</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="other" />
                                  </FormControl>
                                  <FormLabel className="font-normal">Other</FormLabel>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  </div>
                  {user?.role === 'B2B_CUSTOMER' && (
                      <>
                          <Separator />
                          <div className="space-y-1">
                              <h4 className="font-medium">Company Details</h4>
                              <p className="text-sm text-muted-foreground">This information is only visible for B2B accounts.</p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FormField
                                  control={form.control}
                                  name="companyName"
                                  render={({ field }) => (
                                      <FormItem>
                                          <FormLabel>Company Name</FormLabel>
                                          <FormControl><Input placeholder="Your Company LLC" {...field} /></FormControl>
                                          <FormMessage />
                                      </FormItem>
                                  )}
                              />
                              <FormField
                                  control={form.control}
                                  name="vatNumber"
                                  render={({ field }) => (
                                      <FormItem>
                                          <FormLabel>VAT Number</FormLabel>
                                          <FormControl><Input placeholder="Your VAT/TIN" {...field} /></FormControl>
                                          <FormMessage />
                                      </FormItem>
                                  )}
                              />
                          </div>
                      </>
                  )}
              </CardContent>
              <CardFooter>
                <Button type="submit" loading={form.formState.isSubmitting}>Save Changes</Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </motion.div>

      <motion.div variants={itemVariants}>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input id="new-password" type="password" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input id="confirm-password" type="password" />
                    </div>
                </div>
            </CardContent>
             <CardFooter>
                <Button>Update Password</Button>
             </CardFooter>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="border-destructive">
            <CardHeader>
                <CardTitle className="text-destructive">Delete Account</CardTitle>
                <CardDescription>Permanently delete your account and all associated data. This action cannot be undone.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button variant="destructive">Delete My Account</Button>
            </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
