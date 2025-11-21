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
 */

import type { AppProps } from 'next/app';
import { useState, useEffect } from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { initWebVitals } from '@/lib/web-vitals';
import { system } from '@/theme';
import '../public/style.css';

export default function App({ Component, pageProps }: AppProps) {
  const [showDashboard, setShowDashboard] = useState(false);
  const [PerformanceDashboard, setPerformanceDashboard] = useState<any>(null);

  // Initialize Web Vitals monitoring and load PerformanceDashboard in browser only
  useEffect(() => {
    initWebVitals();
    
    // Load PerformanceDashboard only in development AND in browser
    if (process.env.NODE_ENV === 'development') {
      import('@/components/PerformanceDashboard').then((mod) => {
        setPerformanceDashboard(() => mod.default);
        (window as any).__performanceDashboard?._register(setShowDashboard);
      });
    }
  }, []);

  return (
    <ChakraProvider value={system}>
      <Component {...pageProps} />
      {process.env.NODE_ENV === 'development' && showDashboard && PerformanceDashboard && (
        <PerformanceDashboard onClose={() => setShowDashboard(false)} />
      )}
    </ChakraProvider>
  );
}
