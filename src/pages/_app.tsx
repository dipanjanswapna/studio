import type { AppProps } from 'next/app';
import Head from 'next/head';
import '@/styles/globals.css';
import Header from '@/components/navbar/Header';
import { AuthProvider } from '@/context/authContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { RouteGuard } from '@/components/RouteGuard';
import { cn } from '@/lib/utils';
import { Inter } from 'next/font/google';
import { Footer } from '@/components/Footer';
import { BottomNav } from '@/components/navbar/BottomNav';
import { useRouter } from 'next/router';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { VendorLayout } from '@/components/layouts/VendorLayout';
import { StaffLayout } from '@/components/layouts/StaffLayout';
import { OutletLayout } from '@/components/layouts/OutletLayout';
import { B2BLayout } from '@/components/layouts/B2BLayout';
import { ProfileLayout } from '@/components/layouts/ProfileLayout';
import { SearchProvider } from '@/context/SearchContext';
import { SearchOverlay } from '@/components/search/SearchOverlay';
import { useEffect } from 'react';
import NProgress from 'nprogress';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { ProductActionProvider } from '@/context/ProductActionContext';
import { ProductActionModal } from '@/components/modals/ProductActionModal';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider } from '@/context/ThemeProvider';
import { RequiredActionProvider } from '@/context/RequiredActionContext';
import { AddPhoneNumberModal } from '@/components/modals/AddPhoneNumberModal';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Toaster as SonnerToaster } from 'sonner';
import { ReviewProvider } from '@/context/ReviewContext';
import { ReviewModal } from '@/components/modals/ReviewModal';
import { CartProvider } from '@/context/CartContext';


const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});


function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { pathname } = router;

  useEffect(() => {
    const handleStart = (url: string) => {
      if (url !== router.asPath) {
        NProgress.start();
      }
    };
    const handleStop = () => {
      NProgress.done();
    };

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleStop);
    router.events.on('routeChangeError', handleStop);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleStop);
      router.events.off('routeChangeError', handleStop);
    };
  }, [router]);


  const isAdminRoute = pathname.startsWith('/portal/admin');
  const isVendorRoute = pathname.startsWith('/portal/vendor');
  const isOutletRoute = pathname.startsWith('/portal/outlet');
  const isStaffRoute = pathname.startsWith('/portal/staff');
  const isB2BRoute = pathname.startsWith('/portal/b2b');
  const isProfileRoute = pathname.startsWith('/profile');
  const isPortalRoute = isAdminRoute || isVendorRoute || isOutletRoute || isStaffRoute || isB2BRoute;
  const isAuthRoute = pathname.startsWith('/auth');


  let title = "AVERzO - Unified Shopping Experience";
  let description = "AVERzO is a next-generation Omnichannel Super Marketplace designed to bridge the gap between online and offline retail.";
  
  if (isPortalRoute) {
    title = "Averzo Portal";
    description = "Averzo Management Portal";
    if (isAdminRoute) title = "Averzo Admin Portal";
    if (isVendorRoute) title = "Averzo Vendor Portal";
    if (isOutletRoute) title = "Averzo Outlet Portal";
    if (isStaffRoute) title = "Averzo Staff Portal";
    if (isB2BRoute) title = "Averzo B2B Portal";
  }


  const getLayout = () => {
     if (isAdminRoute) {
      return (
        <AdminLayout>
          <Component {...pageProps} />
        </AdminLayout>
      );
    }
    if (isVendorRoute) {
      return (
        <VendorLayout>
          <Component {...pageProps} />
        </VendorLayout>
      );
    }
    if (isOutletRoute) {
      return (
        <OutletLayout>
          <Component {...pageProps} />
        </OutletLayout>
      );
    }
    if (isStaffRoute) {
      return (
        <StaffLayout>
          <Component {...pageProps} />
        </StaffLayout>
      );
    }
    if (isB2BRoute) {
      return (
        <B2BLayout>
          <Component {...pageProps} />
        </B2BLayout>
      );
    }
    
    if (isProfileRoute) {
        return (
            <div className={cn("relative flex min-h-screen flex-col bg-background font-sans", inter.variable)}>
                <Header />
                <div className="h-16 lg:h-28 w-full shrink-0" />
                <main className="flex-1 pb-24 md:pb-0">
                    <ProfileLayout>
                        <Component {...pageProps} />
                    </ProfileLayout>
                </main>
                <Footer />
                <BottomNav />
            </div>
        )
    }

    // Auth routes and other public pages have a minimal layout
    if (isAuthRoute) {
      return <Component {...pageProps} />;
    }

    // Default layout for customer-facing pages
    return (
      <div className={cn("relative flex min-h-screen flex-col bg-background font-sans", inter.variable)}>
        <Header />
        {/* Spacer for fixed header. h-16 (mobile) / h-28 (desktop) */}
        <div className="h-16 lg:h-28 w-full shrink-0" />
        <main className="flex-1 pb-24 md:pb-0">
          <AnimatePresence mode="wait" initial={false}>
            <Component {...pageProps} key={router.route} />
          </AnimatePresence>
        </main>
        <Footer />
        <BottomNav />
      </div>
    );
  }

  return (
    <>
      <Head>
        <meta name="description" content={description} />
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, user-scalable=no, viewport-fit=cover" />
        <title>{title}</title>
      </Head>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <FirebaseClientProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <SearchProvider>
                  <ProductActionProvider>
                    <RequiredActionProvider>
                      <ReviewProvider>
                        <RouteGuard>
                          {getLayout()}
                          <SonnerToaster
                            richColors
                            position="top-right"
                            toastOptions={{
                              classNames: {
                                toast: 'font-sans',
                              },
                            }}
                          />
                          <SearchOverlay />
                          <CartDrawer />
                          <ProductActionModal />
                          <AddPhoneNumberModal />
                          <ReviewModal />
                        </RouteGuard>
                      </ReviewProvider>
                    </RequiredActionProvider>
                  </ProductActionProvider>
                </SearchProvider>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </FirebaseClientProvider>
      </ThemeProvider>
    </>
  );
}

export default MyApp;
