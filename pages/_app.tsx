/**
 * Custom App component with global providers and optimizations
 */

import type { AppProps } from 'next/app';
import { SWRConfig } from 'swr';
import { GameStateProvider } from '../lib/state/GameStateContext';
import '../public/style.css';

// Global SWR configuration
const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  shouldRetryOnError: true,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  dedupingInterval: 2000,
  // Custom fetcher is handled by individual hooks
};

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SWRConfig value={swrConfig}>
      <GameStateProvider>
        <Component {...pageProps} />
      </GameStateProvider>
    </SWRConfig>
  );
}
