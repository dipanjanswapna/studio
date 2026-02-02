'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Loader2, Heart, Users } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { volunteerSignup } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

function VolunteerSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
      Sign Up to Volunteer
    </Button>
  );
}

const initialVolunteerState = {
  status: '',
  message: '',
  errors: null,
};

export function GetInvolved() {
  const [state, formAction] = useFormState(volunteerSignup, initialVolunteerState);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    if (state.status === 'success') {
      toast({
        title: 'Signup Successful!',
        description: state.message,
      });
      formRef.current?.reset();
    } else if (state.status === 'error') {
       toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: state.message,
      });
    }
  }, [state, toast]);

  return (
    <section id="get-involved" className="w-full bg-background py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="mx-auto max-w-4xl space-y-4 text-center">
          <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">
            Take Action
          </div>
          <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Your Support Makes a Difference
          </h2>
          <p className="text-muted-foreground md:text-xl/relaxed">
            Change requires collective action. Join the campaign as a volunteer or make a donation to fuel our movement for a better Barishal.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:gap-12">
          <Card className="flex flex-col">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                <Heart className="h-6 w-6 text-accent" />
              </div>
              <CardTitle className="font-headline text-2xl">Donate to the Campaign</CardTitle>
              <CardDescription>
                Every contribution, big or small, helps us reach more voters and spread our message of hope and progress.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 text-center">
              <p className="text-4xl font-bold text-primary">$5,750</p>
              <p className="text-sm text-muted-foreground">raised of $25,000 goal</p>
            </CardContent>
            <CardFooter>
              <Button size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                <Heart className="mr-2 h-4 w-4" />
                Donate Now
              </Button>
            </CardFooter>
          </Card>

          <Card className="flex flex-col">
            <form ref={formRef} action={formAction} className="flex flex-1 flex-col">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="font-headline text-2xl">Become a Volunteer</CardTitle>
                <CardDescription>
                  Join our passionate team of volunteers and be a part of the change. Your time and skills are invaluable.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" placeholder="Your Name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="you@example.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (Optional)</Label>
                  <Input id="phone" name="phone" type="tel" placeholder="Your Phone Number" />
                </div>
              </CardContent>
              <CardFooter>
                <VolunteerSubmitButton />
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </section>
  );
}
