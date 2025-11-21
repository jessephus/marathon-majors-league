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
import dynamic from 'next/dynamic';
import { ChakraProvider } from '@chakra-ui/react';
import { initWebVitals } from '@/lib/web-vitals';
import { system } from '@/theme';
import '../public/style.css';

// Dynamically import PerformanceDashboard only in browser (no SSR)
// This prevents Next.js from analyzing it during build phase
const PerformanceDashboard = typeof window !== 'undefined' && process.env.NODE_ENV === 'development'
  ? dynamic(() => import('@/components/PerformanceDashboard'), { ssr: false })
  : null;

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
      <Component {...pageProps} />
      {PerformanceDashboard && showDashboard && (
        <PerformanceDashboard onClose={() => setShowDashboard(false)} />
      )}
    </ChakraProvider>
  );
}
