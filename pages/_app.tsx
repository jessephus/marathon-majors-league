/**
 * Next.js App Component
 * 
 * Global application wrapper that applies across all pages.
 * Imports global CSS and provides app-wide context.
 * Includes performance dashboard in development mode.
 */

import type { AppProps } from 'next/app';
import { useState, useEffect } from 'react';
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

  // Register dashboard toggle in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      (window as any).__performanceDashboard?._register(setShowDashboard);
    }
  }, []);

  return (
    <>
      <Component {...pageProps} />
      {process.env.NODE_ENV === 'development' && showDashboard && PerformanceDashboard && (
        <PerformanceDashboard onClose={() => setShowDashboard(false)} />
      )}
    </>
  );
}
