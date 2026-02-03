'use client';

import Link from "next/link";
import Image from "next/image";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTransition } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Facebook, Youtube, Instagram, Linkedin } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Logo } from "@/components/Logo";
import { Card } from "@/components/ui/card";
import { PlaceHolderImages } from "@/data/placeholder-images";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";


const footerLinks = {
  company: [
    { label: "About Us", href: "/about" },
    { label: "Contact Us", href: "/contact" },
    { label: "Careers", href: "/careers" },
    { label: "Blog", href: "/blog" },
  ],
  support: [
    { label: "FAQ", href: "/faq" },
    { label: "Track Order", href: "/track-order" },
    { label: "Return Policy", href: "/refund-policy" },
    { label: "Warranty", href: "/warranty-policy" },
  ],
  legal: [
    { label: "Terms of Service", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Shipping Policy", href: "/shipping" },
  ],
};

const newsletterSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

type NewsletterFormValues = z.infer<typeof newsletterSchema>;

function SubscriptionForm({ isMobile = false }: { isMobile?: boolean }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<NewsletterFormValues>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = (data: NewsletterFormValues) => {
    startTransition(async () => {
      try {
        const response = await fetch('/api/flows/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: data.email }),
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to subscribe.');
        }

        console.log(result.message);
        toast({
          title: "Subscribed!",
          description: "Thank you for subscribing to our newsletter.",
        });
        form.reset();
      } catch (error: any) {
        console.error(error);
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: error.message || "Could not subscribe. Please try again later.",
        });
      }
    });
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
        <div className={`flex w-full items-start space-x-2 ${isMobile ? 'flex-col space-y-2' : 'max-w-sm'}`}>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="flex-1 w-full">
                <FormControl>
                  <Input type="email" placeholder="Your email address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" loading={isPending}>Subscribe</Button>
        </div>
      </form>
    </Form>
  )
}

function DesktopFooter() {
   const promoBanner = PlaceHolderImages.find((img) => img.id === 'promo-banner-1');
   return (
     <footer className="bg-card border-t">
      <div className="container pt-12 pb-8">
        {promoBanner && (
            <div className="mb-12">
              <Link href="/shop" className="block w-full">
                <Card className="overflow-hidden border shadow-sm">
                  <Image
                    src={promoBanner.imageUrl}
                    alt={promoBanner.description}
                    width={1200}
                    height={300}
                    className="w-full h-auto object-cover"
                    data-ai-hint={promoBanner.imageHint}
                    sizes="100vw"
                  />
                </Card>
              </Link>
            </div>
          )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-foreground mb-4">Stay updated</h3>
            <p className="mb-4 text-sm text-muted-foreground">Get the latest deals and new products right in your inbox.</p>
            <SubscriptionForm />
             <div className="flex space-x-4 mt-8">
                 <Link href="#" aria-label="Facebook" className="text-muted-foreground hover:text-primary transition-colors"><Facebook className="h-5 w-5" /></Link>
                 <Link href="#" aria-label="Youtube" className="text-muted-foreground hover:text-primary transition-colors"><Youtube className="h-5 w-5" /></Link>
                 <Link href="#" aria-label="Instagram" className="text-muted-foreground hover:text-primary transition-colors"><Instagram className="h-5 w-5" /></Link>
                 <Link href="#" aria-label="LinkedIn" className="text-muted-foreground hover:text-primary transition-colors"><Linkedin className="h-5 w-5" /></Link>
              </div>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-3 text-sm">
              {footerLinks.company.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-muted-foreground hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Support</h4>
            <ul className="space-y-3 text-sm">
              {footerLinks.support.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-muted-foreground hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
           <div>
            <h4 className="font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-3 text-sm">
              {footerLinks.legal.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-muted-foreground hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t flex flex-col sm:flex-row items-center justify-between text-sm text-muted-foreground">
            <Logo />
          <p className="mt-4 sm:mt-0">&copy; {new Date().getFullYear()} AVERzO. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}


function MobileFooter() {
  const promoBanner = PlaceHolderImages.find((img) => img.id === 'promo-banner-1');
  return (
    <footer className="bg-card border-t py-6">
      <div className="container">
        {promoBanner && (
          <div className="mb-6">
            <Link href="/shop" className="block w-full">
              <Card className="overflow-hidden border shadow-sm">
                <Image
                  src={promoBanner.imageUrl}
                  alt={promoBanner.description}
                  width={1200}
                  height={300}
                  className="w-full h-auto object-cover"
                  data-ai-hint={promoBanner.imageHint}
                  sizes="100vw"
                />
              </Card>
            </Link>
          </div>
        )}
        <div className="border rounded-xl p-4 mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-2 text-center">Stay updated</h3>
            <p className="mb-4 text-sm text-muted-foreground text-center">Get the latest deals and new products.</p>
            <SubscriptionForm isMobile={true}/>
        </div>
        <Accordion type="multiple" className="w-full" >
          <AccordionItem value="company">
            <AccordionTrigger className="font-semibold text-foreground hover:no-underline">Company</AccordionTrigger>
            <AccordionContent>
               <ul className="space-y-3 pt-2 text-sm">
                  {footerLinks.company.map(link => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-muted-foreground hover:text-primary transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="support">
            <AccordionTrigger className="font-semibold text-foreground hover:no-underline">Support</AccordionTrigger>
            <AccordionContent>
               <ul className="space-y-3 pt-2 text-sm">
                  {footerLinks.support.map(link => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-muted-foreground hover:text-primary transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="legal" className="border-b-0">
            <AccordionTrigger className="font-semibold text-foreground hover:no-underline">Legal</AccordionTrigger>
            <AccordionContent>
               <ul className="space-y-3 pt-2 text-sm">
                  {footerLinks.legal.map(link => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-muted-foreground hover:text-primary transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <div className="mt-8 pt-8 border-t flex flex-col items-center">
            <div className="mb-4">
               <Logo />
            </div>
            <div className="flex space-x-6 mb-6">
                <Link href="#" aria-label="Facebook" className="text-muted-foreground hover:text-primary transition-colors"><Facebook className="h-6 w-6" /></Link>
                <Link href="#" aria-label="Youtube" className="text-muted-foreground hover:text-primary transition-colors"><Youtube className="h-6 w-6" /></Link>
                <Link href="#" aria-label="Instagram" className="text-muted-foreground hover:text-primary transition-colors"><Instagram className="h-6 w-6" /></Link>
            </div>
            <p className="text-sm text-center text-muted-foreground">&copy; {new Date().getFullYear()} AVERzO. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export function Footer() {
  const isMobile = useIsMobile();
  return isMobile ? <MobileFooter /> : <DesktopFooter />;
}
