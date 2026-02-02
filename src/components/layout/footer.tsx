import { Facebook, Twitter, Youtube } from 'lucide-react';
import Link from 'next/link';

import { Logo } from '@/components/logo';

export function Footer() {
  return (
    <footer className="w-full border-t bg-background">
      <div className="container flex flex-col items-center justify-between gap-4 py-8 md:flex-row">
        <div className="flex flex-col items-center gap-4 md:items-start">
          <Link href="/">
            <Logo className="h-8 w-auto" />
            <span className="sr-only">Monisha's Mandate</span>
          </Link>
          <p className="text-center text-sm text-muted-foreground md:text-left">
            A movement for the people, by the people.
          </p>
        </div>
        <div className="flex flex-col items-center gap-4 md:items-end">
          <div className="flex items-center space-x-4">
            <a href="#" className="text-muted-foreground hover:text-primary">
              <Facebook className="h-6 w-6" />
              <span className="sr-only">Facebook</span>
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary">
              <Twitter className="h-6 w-6" />
              <span className="sr-only">Twitter</span>
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary">
              <Youtube className="h-6 w-6" />
              <span className="sr-only">YouTube</span>
            </a>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Monisha's Mandate. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
