/**
 * Commissioner Page (New Implementation)
 * 
 * Administrative dashboard for game management with dynamic panel loading.
 * Implements modularization with state event integration.
 */

import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { GetServerSidePropsContext } from 'next';
import dynamic from 'next/dynamic';
import { AppStateProvider, useCommissionerState, useGameState } from '@/lib/state-provider';
import { apiClient } from '@/lib/api-client';
import SkeletonLoader from '@/components/commissioner/SkeletonLoader';
import Footer from '@/components/Footer';

// Dynamic imports for panels with skeleton loaders
const ResultsManagementPanel = dynamic(
  () => import('@/components/commissioner/ResultsManagementPanel'),
  {
    loading: () => <SkeletonLoader lines={5} />,
    ssr: false,
  }
);

const AthleteManagementPanel = dynamic(
  () => import('@/components/commissioner/AthleteManagementPanel'),
  {
    loading: () => <SkeletonLoader lines={5} />,
    ssr: false,
  }
);

const TeamsOverviewPanel = dynamic(
  () => import('@/components/commissioner/TeamsOverviewPanel'),
  {
    loading: () => <SkeletonLoader lines={5} />,
    ssr: false,
  }
);

interface CommissionerPageProps {
  isAuthenticated: boolean;
}

type ActivePanel = 'dashboard' | 'results' | 'athletes' | 'teams';

function CommissionerPageContent({ isAuthenticated: initialAuth }: CommissionerPageProps) {
  const router = useRouter();
  const { commissionerState, setCommissionerState } = useCommissionerState();
  const { gameState, setGameState } = useGameState();
  const [showTOTPModal, setShowTOTPModal] = useState(!initialAuth);
  const [totpCode, setTotpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<ActivePanel>('dashboard');
  const [hasLoggedOut, setHasLoggedOut] = useState(false);

  // Initialize gameId from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedGameId = localStorage.getItem('current_game_id') || 'default';
      if (gameState.gameId !== savedGameId) {
        setGameState({ gameId: savedGameId });
      }
    }
  }, []);

  // Sync SSR authentication state with React state
  // BUT skip this if user has explicitly logged out
  useEffect(() => {
    if (initialAuth && !commissionerState.isCommissioner && !hasLoggedOut) {
      setCommissionerState({
        isCommissioner: true,
        loginTime: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
  }, [initialAuth, commissionerState.isCommissioner, hasLoggedOut]);

  useEffect(() => {
    if (!commissionerState.isCommissioner && !initialAuth) {
      setShowTOTPModal(true);
    }
  }, [commissionerState.isCommissioner, initialAuth]);

  // Handle Escape key to close modal
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape' && showTOTPModal) {
        router.push('/');
      }
    }

    if (showTOTPModal) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showTOTPModal, router]);

  async function handleTOTPLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await apiClient.commissioner.verifyTOTP(totpCode);
      if (result.success) {
        setCommissionerState({
          isCommissioner: true,
          loginTime: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        });
        setShowTOTPModal(false);
      } else {
        setError('Invalid TOTP code');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    // Set logout flag FIRST to prevent SSR sync from re-enabling session
    setHasLoggedOut(true);
    
    // Clear client-side storage FIRST (synchronously, before any async operations)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('marathon_fantasy_commissioner');
      localStorage.removeItem('commissioner_state'); // Legacy cleanup
    }
    
    // Then call logout endpoint to clear server-side cookie
    try {
      await apiClient.commissioner.logout();
      console.log('[Commissioner Logout] Server-side cookie cleared');
    } catch (err) {
      console.error('Logout API error:', err);
      // Continue with logout even if API fails
    }
    
    // Update React state (this will also try to remove localStorage, but it's already gone)
    setCommissionerState({
      isCommissioner: false,
      loginTime: null,
      expiresAt: null,
    });
    
    // Navigate to home page
    router.push('/');
  }

  async function handleResetGame() {
    if (!confirm('Are you sure you want to reset the entire game? This action cannot be undone.')) {
      return;
    }

    try {
      await apiClient.commissioner.resetGame('default');
      alert('Game reset successfully!');
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reset game');
    }
  }

  async function handleLoadDemoData() {
    if (!confirm('Load demo data? This will populate the game with sample data.')) {
      return;
    }

    try {
      await apiClient.commissioner.loadDemoData('default');
      alert('Demo data loaded successfully!');
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load demo data');
    }
  }

  if (!commissionerState.isCommissioner && showTOTPModal) {
    return (
      <>
        <Head>
          <title>Commissioner Login - Fantasy NY Marathon</title>
        </Head>

        <div className="container">
          <header>
            <h1>🗽 Fantasy NY Marathon</h1>
          </header>

          <main className="page active">
            <div className="modal" style={{ display: 'flex' }}>
              <div className="modal-overlay" onClick={() => router.push('/')}></div>
              <div className="modal-content">
                <h2>Commissioner Login</h2>
                <p>Enter your TOTP code to access commissioner tools:</p>
                
                <form onSubmit={handleTOTPLogin}>
                  <div className="form-group">
                    <label htmlFor="totp-code">TOTP Code</label>
                    <input
                      type="text"
                      id="totp-code"
                      placeholder="000000"
                      value={totpCode}
                      onChange={(e) => {
                        // Only allow digits, max 6 characters
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setTotpCode(value);
                      }}
                      maxLength={6}
                      pattern="[0-9]{6}"
                      required
                      autoFocus
                    />
                  </div>

                  {error && (
                    <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
                      {error}
                    </div>
                  )}
                  
                  <div className="form-actions">
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => router.push('/')}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? 'Verifying...' : 'Login'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Commissioner Dashboard - Fantasy NY Marathon</title>
        <meta name="description" content="Manage your fantasy marathon game" />
      </Head>

      <div className="container">
        <header>
          <h1>🗽 Fantasy NY Marathon</h1>
        </header>

        <main className="page active" id="commissioner-page">
          <h2>Commissioner Dashboard</h2>

          {/* Panel Navigation */}
          {activePanel !== 'dashboard' && (
            <div style={{ marginBottom: '1rem' }}>
              <button 
                className="btn btn-secondary"
                onClick={() => setActivePanel('dashboard')}
              >
                ← Back to Dashboard
              </button>
            </div>
          )}

          {/* Dashboard View */}
          {activePanel === 'dashboard' && (
            <div className="commissioner-dashboard">
              <div className="dashboard-section">
                <h3>Game Management</h3>
                <div className="button-group">
                  <button 
                    className="btn btn-primary"
                    onClick={() => setActivePanel('results')}
                  >
                    📊 Manage Results
                  </button>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setActivePanel('teams')}
                  >
                    👥 View Teams
                  </button>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setActivePanel('athletes')}
                  >
                    🏃 Manage Athletes
                  </button>
                </div>
              </div>

              <div className="dashboard-section">
                <h3>Game Statistics</h3>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-label">Teams</div>
                    <div className="stat-value">{Object.keys(gameState.teams).length}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Players</div>
                    <div className="stat-value">{gameState.players.length}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Draft Status</div>
                    <div className="stat-value">{gameState.draftComplete ? 'Complete' : 'Pending'}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Results Status</div>
                    <div className="stat-value">{gameState.resultsFinalized ? 'Final' : 'In Progress'}</div>
                  </div>
                </div>
              </div>

              <div className="dashboard-section">
                <h3>Administrative Actions</h3>
                <div className="button-group">
                  <button 
                    className="btn btn-warning"
                    onClick={handleResetGame}
                  >
                    🔄 Reset Game
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={handleLoadDemoData}
                  >
                    📥 Load Demo Data
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Panels - Load on demand */}
          {activePanel === 'results' && <ResultsManagementPanel />}
          {activePanel === 'athletes' && <AthleteManagementPanel />}
          {activePanel === 'teams' && <TeamsOverviewPanel />}
        </main>

        <Footer 
          mode="commissioner"
          showGameSwitcher
          onLogout={handleLogout}
        />
      </div>
    </>
  );
}

export default function NewCommissionerPage(props: CommissionerPageProps) {
  return (
    <AppStateProvider>
      <CommissionerPageContent {...props} />
    </AppStateProvider>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  // Check commissioner authentication from cookies
  // Cookie name matches what's set in /api/auth/totp/verify.js
  const commissionerCookie = context.req.cookies.marathon_fantasy_commissioner || null;
  
  let isAuthenticated = false;
  
  if (commissionerCookie) {
    try {
      const sessionData = JSON.parse(decodeURIComponent(commissionerCookie));
      // Verify session has required fields and user is commissioner
      isAuthenticated = !!(sessionData.userId && sessionData.isCommissioner);
    } catch (err) {
      // Invalid cookie format, treat as not authenticated
      console.error('Failed to parse commissioner cookie:', err);
    }
  }
  
  return {
    props: {
      isAuthenticated,
    },
  };
}
