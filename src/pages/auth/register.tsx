import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth, UserRole } from '@/context/authContext';
import { Logo } from '@/components/Logo';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['VENDOR', 'CUSTOMER'], { required_error: 'Please select a role' }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 48 48" {...props}>
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L38.802 9.122C34.557 5.166 29.658 3 24 3C12.955 3 4 11.955 4 23s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691c-1.465 3.319-2.306 7.037-2.306 11.029c0 3.992.841 7.71 2.306 11.029L12.053 30.89c-1.07-2.828-1.703-5.916-1.703-9.179s.633-6.351 1.703-9.179L6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-5.657-5.657c-1.889 1.411-4.28 2.223-6.752 2.223c-5.221 0-9.61-3.337-11.28-7.946l-5.733 4.428C8.946 39.463 15.997 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l5.657 5.657C42.486 36.689 44 32.138 44 27c0-2.659-.408-5.166-1.19-7.461l-6.522-5.083z"
      />
    </svg>
  );

export default function RegisterPage() {
  const { register: registerUser, loginWithGoogle, loading } = useAuth();
  
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'CUSTOMER'
    }
  });

  const onSubmit = (data: RegisterFormValues) => {
    registerUser({email: data.email, pass: data.password, name: data.name, role: data.role as UserRole});
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="mx-auto mb-4">
             <Logo iconClassName="h-10 w-10" showText={false} />
          </Link>
          <CardTitle className="text-2xl">Create an Account</CardTitle>
          <CardDescription>Join Averzo to start your shopping journey</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                <Button variant="outline" className="w-full gap-2" onClick={loginWithGoogle} disabled={loading}>
                    <GoogleIcon className="h-5 w-5" />
                    Sign up with Google
                </Button>
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                            Or continue with email
                        </span>
                    </div>
                </div>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="you@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>I am a...</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="CUSTOMER">Customer</SelectItem>
                            <SelectItem value="VENDOR">Vendor (Approval Required)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" loading={form.formState.isSubmitting || loading}>
                    Create Account
                  </Button>
                </form>
              </Form>
            </div>
        </CardContent>
        <CardFooter>
            <div className="text-sm text-center text-muted-foreground w-full">
                Already have an account?{' '}
                <Link href="/auth/login" className="underline hover:text-primary">
                    Login
                </Link>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
