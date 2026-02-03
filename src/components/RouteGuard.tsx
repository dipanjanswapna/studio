import { useAuth } from '@/context/authContext';
import { useRouter } from 'next/router';
import { useEffect, type ReactNode } from 'react';

// Define which roles can access which route prefixes
const protectedRoutes: { [key: string]: string[] } = {
  '/portal/admin': ['ADMIN'],
  '/portal/vendor': ['VENDOR'],
  '/portal/outlet': ['OUTLET'],
  '/portal/staff': ['STAFF'],
  '/portal/b2b': ['B2B_CUSTOMER'],
  '/profile': ['CUSTOMER', 'ADMIN', 'VENDOR', 'OUTLET', 'STAFF', 'B2B_CUSTOMER'], // All logged in users can see profile
  '/cart': ['CUSTOMER', 'ADMIN', 'VENDOR', 'OUTLET', 'STAFF', 'B2B_CUSTOMER'], // All logged in users can see cart
  '/checkout': ['CUSTOMER', 'ADMIN', 'VENDOR', 'OUTLET', 'STAFF', 'B2B_CUSTOMER'],
};

export function RouteGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return; // Wait for user status to be loaded
    }

    const path = router.pathname;
    const pathIsProtected = Object.keys(protectedRoutes).some(r => path.startsWith(r));

    // If the user is not logged in and tries to access a protected route, redirect to login
    if (!user && pathIsProtected) {
      router.push('/auth/login');
    }

    // If the user is logged in and is on a protected route
    if (user && pathIsProtected) {
      let authorized = false;
      // Check if the user's role is authorized for the current path
      for (const route in protectedRoutes) {
        if (path.startsWith(route)) {
          if (protectedRoutes[route].includes(user.role)) {
            authorized = true;
            break;
          }
        }
      }

      // If not authorized, redirect them to their own portal or home
      if (!authorized) {
        switch (user.role) {
          case 'ADMIN': router.push('/portal/admin'); break;
          case 'VENDOR': router.push('/portal/vendor'); break;
          case 'OUTLET': router.push('/portal/outlet'); break;
          case 'STAFF': router.push('/portal/staff'); break;
          case 'B2B_CUSTOMER': router.push('/portal/b2b'); break;
          default: router.push('/');
        }
      }
    }
  }, [user, loading, router]);

  // While checking auth, you might want to show a loader or nothing
  // to prevent layout flashes.
  if (loading) {
    return null; // Or a global loader component
  }

  return <>{children}</>;
}
