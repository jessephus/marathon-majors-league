/**
 * Next.js App Component
 * 
 * Global application wrapper that applies across all pages.
 * Imports global CSS and provides app-wide context.
 */

import type { AppProps } from 'next/app';
import '../public/style.css';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
