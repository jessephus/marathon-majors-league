/**
 * Next.js App Component
 * 
 * Global application wrapper that applies across all pages.
 * Imports global CSS and provides app-wide context.
 * Includes performance dashboard in development mode.
 * Initializes Web Vitals monitoring.
 * 
 * Phase 1 Update (Nov 2025): Added ChakraProvider for Chakra UI v3 integration.
 * Theme configured in /theme/index.ts with navy/gold palette.
 * 
 * Phase 3 Update (Nov 2025): Added NavigationWrapper for feature flag-based navigation.
 * Enables gradual rollout of new Chakra UI navigation components.
 */

import type { AppProps } from 'next/app';
import { useState, useEffect } from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { initWebVitals } from '@/lib/web-vitals';
import { system } from '@/theme';
import { NavigationWrapper } from '@/components/navigation';
import '../public/style.css';

// Dynamic import of PerformanceDashboard only in development
let PerformanceDashboard: any = null;
if (process.env.NODE_ENV === 'development') {
  import('@/components/PerformanceDashboard').then((mod) => {
    PerformanceDashboard = mod.default;
  });
}

export default function App({ Component, pageProps }: AppProps) {
  const [showDashboard, setShowDashboard] = useState(false);

  // Initialize Web Vitals monitoring
  useEffect(() => {
    initWebVitals();
  }, []);

  // Register dashboard toggle in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      (window as any).__performanceDashboard?._register(setShowDashboard);
    }
  }, []);

  return (
    <ChakraProvider value={system}>
      <NavigationWrapper>
        <Component {...pageProps} />
      </NavigationWrapper>
      {process.env.NODE_ENV === 'development' && showDashboard && PerformanceDashboard && (
        <PerformanceDashboard onClose={() => setShowDashboard(false)} />
      )}
    </ChakraProvider>
  );
}
