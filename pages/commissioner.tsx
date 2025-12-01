/**
 * Commissioner Page (New Implementation)
 * 
 * Administrative dashboard for game management with dynamic panel loading.
 * Implements modularization with state event integration.
 * 
 * UI Migration: Migrated to Chakra UI buttons (Phase 4)
 */

import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { GetServerSidePropsContext } from 'next';
import { SimpleGrid } from '@chakra-ui/react';
import { AppStateProvider, useCommissionerState, useGameState } from '@/lib/state-provider';
import { DEFAULT_GAME_ID } from '@/config/constants';
import { apiClient } from '@/lib/api-client';
import SkeletonLoader from '@/components/commissioner/SkeletonLoader';
import Footer from '@/components/Footer';
import { dynamicImport, CHUNK_NAMES } from '@/lib/dynamic-import';
import { FeatureFlag } from '@/lib/feature-flags';
import { Button, StatsCard, Input, FormControl, FormLabel, FormErrorMessage } from '@/components/chakra';

// Dynamic imports for commissioner panels with performance tracking and feature flags
// Using webpack magic comments to force separate chunks
const ResultsManagementPanel = dynamicImport(
  () => import(/* webpackChunkName: "chunk-commissioner-results" */ '@/components/commissioner/ResultsManagementPanel'),
  {
    chunkName: CHUNK_NAMES.COMMISSIONER_RESULTS,
    featureFlag: FeatureFlag.DYNAMIC_COMMISSIONER_PANELS,
    loading: () => <SkeletonLoader lines={5} />,
    ssr: false,
  }
);

const AthleteManagementPanel = dynamicImport(
  () => import(/* webpackChunkName: "chunk-commissioner-athletes" */ '@/components/commissioner/AthleteManagementPanel'),
  {
    chunkName: CHUNK_NAMES.COMMISSIONER_ATHLETES,
    featureFlag: FeatureFlag.DYNAMIC_COMMISSIONER_PANELS,
    loading: () => <SkeletonLoader lines={5} />,
    ssr: false,
  }
);

const TeamsOverviewPanel = dynamicImport(
  () => import(/* webpackChunkName: "chunk-commissioner-teams" */ '@/components/commissioner/TeamsOverviewPanel'),
  {
    chunkName: CHUNK_NAMES.COMMISSIONER_TEAMS,
    featureFlag: FeatureFlag.DYNAMIC_COMMISSIONER_PANELS,
    loading: () => <SkeletonLoader lines={5} />,
    ssr: false,
  }
);

const RaceManagementPanel = dynamicImport(
  () => import(/* webpackChunkName: "chunk-commissioner-races" */ '@/components/commissioner/RaceManagementPanel'),
  {
    chunkName: CHUNK_NAMES.COMMISSIONER_RACES,
    featureFlag: FeatureFlag.DYNAMIC_COMMISSIONER_PANELS,
    loading: () => <SkeletonLoader lines={5} />,
    ssr: false,
  }
);

interface CommissionerPageProps {
  isAuthenticated: boolean;
  initialGameId?: string;
}

type ActivePanel = 'dashboard' | 'results' | 'athletes' | 'teams' | 'races';

function CommissionerPageContent({ isAuthenticated: initialAuth, initialGameId = 'default' }: CommissionerPageProps) {
  const router = useRouter();
  const { commissionerState, setCommissionerState } = useCommissionerState();
  const { gameState, setGameState } = useGameState();
  const [showTOTPModal, setShowTOTPModal] = useState(!initialAuth);
  const [totpCode, setTotpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<ActivePanel>('dashboard');
  const [hasLoggedOut, setHasLoggedOut] = useState(false);
  
  // Game statistics state
  const [teamCount, setTeamCount] = useState(0);
  const [confirmedAthletesCount, setConfirmedAthletesCount] = useState(0);
  const [rosterLockTime, setRosterLockTime] = useState<string | null>(null);
  const [resultsStatus, setResultsStatus] = useState<'Pre-Race' | 'In Progress' | 'Finished' | 'Certified'>('Pre-Race');
  
  // Active race state
  const [activeRaceId, setActiveRaceId] = useState<number | null>(null);
  const [activeRace, setActiveRace] = useState<{ id: number; name: string; date: string; location: string } | null>(null);
  const [availableRaces, setAvailableRaces] = useState<Array<{ id: number; name: string; date: string; isActive: boolean }>>([]);
  const [savingActiveRace, setSavingActiveRace] = useState(false);

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

  // Fetch game statistics
  useEffect(() => {
    async function fetchGameStats() {
      if (!commissionerState.isCommissioner) return;
      
      try {
        // Fetch team count, confirmed athletes, game state, results, and races in parallel using API client
        // Note: confirmedOnly with gameId will filter athletes for the game's active race.
        // If no active race is set for the game, getAllAthletes falls back to the first active race in the system.
        const [teamsData, athletesData, gameStateData, resultsData, racesData] = await Promise.all([
          apiClient.salaryCapDraft.getTeam(gameState.gameId),
          apiClient.athletes.list({ confirmedOnly: true, gameId: gameState.gameId }),
          apiClient.gameState.load(gameState.gameId),
          apiClient.results.fetch(gameState.gameId),
          apiClient.races.list()
        ]);
        
        // Calculate team count
        const teams = Object.keys(teamsData).filter(key => teamsData[key]?.hasSubmittedRoster);
        setTeamCount(teams.length);
        
        // Calculate confirmed athletes count
        const totalConfirmed = (athletesData.men?.length || 0) + (athletesData.women?.length || 0);
        setConfirmedAthletesCount(totalConfirmed);
        
        // Set roster lock time
        setRosterLockTime((gameStateData as any)?.rosterLockTime || null);
        
        // Set active race info
        setActiveRaceId((gameStateData as any)?.activeRaceId || null);
        setActiveRace((gameStateData as any)?.activeRace || null);
        
        // Set available races for dropdown
        setAvailableRaces(racesData.map((r: any) => ({
          id: r.id,
          name: r.name,
          date: r.date,
          isActive: r.isActive
        })));
        
        // Determine results status
        if ((gameStateData as any)?.resultsFinalized) {
          setResultsStatus('Certified');
        } else {
          const resultsArray = Object.values((resultsData as any)?.results || {});
          const hasFinishTimes = resultsArray.some((r: any) => r?.finishTime);
          const hasSplits = resultsArray.some((r: any) => 
            r?.split5k || r?.split10k || r?.splitHalf || r?.split30k || r?.split35k || r?.split40k
          );
          
          if (hasFinishTimes) {
            setResultsStatus('Finished');
          } else if (hasSplits) {
            setResultsStatus('In Progress');
          } else {
            setResultsStatus('Pre-Race');
          }
        }
      } catch (err) {
        console.error('Failed to fetch game statistics:', err);
      }
    }
    
    fetchGameStats();
    
    // Listen for updates
    const handleResultsUpdated = () => fetchGameStats();
    const handleAthleteUpdated = () => fetchGameStats();
    
    window.addEventListener('resultsUpdated', handleResultsUpdated);
    window.addEventListener('athleteUpdated', handleAthleteUpdated);
    
    return () => {
      window.removeEventListener('resultsUpdated', handleResultsUpdated);
      window.removeEventListener('athleteUpdated', handleAthleteUpdated);
    };
  }, [commissionerState.isCommissioner, gameState.gameId]);

  // Handle changing the active race for the game
  async function handleChangeActiveRace(newRaceId: number | null) {
    if (savingActiveRace) return;
    
    try {
      setSavingActiveRace(true);
      setError(null);
      
      await apiClient.gameState.save(gameState.gameId, {
        activeRaceId: newRaceId
      });
      
      setActiveRaceId(newRaceId);
      
      // Find the race details
      const race = availableRaces.find(r => r.id === newRaceId);
      setActiveRace(race ? { id: race.id, name: race.name, date: race.date, location: '' } : null);
      
      // Dispatch event to notify other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gameStateUpdated', {
          detail: { gameId: gameState.gameId, activeRaceId: newRaceId }
        }));
      }
    } catch (err) {
      console.error('Failed to update active race:', err);
      setError(err instanceof Error ? err.message : 'Failed to update active race');
    } finally {
      setSavingActiveRace(false);
    }
  }

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
      
      // Clear commissioner session global (for app.js compatibility)
      if (window.commissionerSession) {
        window.commissionerSession = { isCommissioner: false, loginTime: null, expiresAt: null };
      }
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
    
    // Dispatch custom event to notify other components (like WelcomeCard)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sessionsUpdated', {
        detail: { 
          commissionerSession: window.commissionerSession,
          teamSession: window.anonymousSession 
        }
      }));
    }
    
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

  function handleShowPerformanceDashboard() {
    // Use the existing PerformanceDashboard component
    if (typeof window !== 'undefined' && (window as any).__performanceDashboard) {
      (window as any).__performanceDashboard.show();
    } else {
      alert('Performance dashboard not available.\n\nThis feature is only available in development mode.');
    }
  }

  if (!commissionerState.isCommissioner && showTOTPModal) {
    return (
      <>
        <Head>
          <title>Commissioner Login - Marathon Majors Fantasy League</title>
        </Head>

        <div className="container">
          <main className="page active">
            <div className="modal" style={{ display: 'flex' }}>
              <div className="modal-overlay" onClick={() => router.push('/')}></div>
              <div className="modal-content">
                <h2>Commissioner Login</h2>
                <p>Enter your TOTP code to access commissioner tools:</p>
                
                <form onSubmit={handleTOTPLogin}>
                  <FormControl isRequired isInvalid={!!error} style={{ marginBottom: '24px' }}>
                    <FormLabel htmlFor="totp-code">TOTP Code</FormLabel>
                    <Input
                      id="totp-code"
                      type="text"
                      placeholder="000000"
                      value={totpCode}
                      onChange={(e) => {
                        // Only allow digits, max 6 characters
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setTotpCode(value);
                      }}
                      maxLength={6}
                      inputMode="numeric"
                      autoComplete="off"
                      autoFocus
                      isDisabled={loading}
                      variant="outline"
                      size="md"
                    />
                    {error && <FormErrorMessage>{error}</FormErrorMessage>}
                  </FormControl>
                  
                  <div className="form-actions">
                    <Button
                      type="button"
                      variant="outline"
                      colorPalette="navy"
                      onClick={() => router.push('/')}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="solid"
                      colorPalette="primary"
                      disabled={loading}
                      isLoading={loading}
                      loadingText="Verifying..."
                    >
                      {loading ? 'Verifying...' : 'Login'}
                    </Button>
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
        <title>Commissioner Dashboard - Marathon Majors Fantasy League</title>
        <meta name="description" content="Manage your fantasy marathon game" />
      </Head>

      <div className="container">
        <main className="page active" id="commissioner-page">
          <h2>Commissioner Dashboard</h2>

          {/* Panel Navigation */}
          {activePanel !== 'dashboard' && (
            <div style={{ marginBottom: '1rem' }}>
              <Button
                variant="outline"
                colorPalette="navy"
                onClick={() => setActivePanel('dashboard')}
              >
                ← Back to Dashboard
              </Button>
            </div>
          )}

          {/* Dashboard View */}
          {activePanel === 'dashboard' && (
            <div className="commissioner-dashboard">
              <div className="dashboard-section">
                <h3>Game Statistics</h3>
                <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
                  <StatsCard
                    label="Game ID"
                    value={gameState.gameId}
                    type="custom"
                    size="md"
                    colorPalette="navy"
                    description={rosterLockTime ? `Lock: ${new Date(rosterLockTime).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      timeZoneName: 'short'
                    })}` : undefined}
                  />
                  <StatsCard
                    label="Teams"
                    value={teamCount}
                    type="number"
                    size="md"
                    colorPalette="info"
                    onClick={() => setActivePanel('teams')}
                    style={{ cursor: 'pointer' }}
                  />
                  <StatsCard
                    label="Confirmed Athletes"
                    value={confirmedAthletesCount}
                    type="number"
                    size="md"
                    colorPalette="success"
                    onClick={() => setActivePanel('athletes')}
                    style={{ cursor: 'pointer' }}
                  />
                  <StatsCard
                    label="Results Status"
                    value={resultsStatus}
                    type="custom"
                    size="md"
                    colorPalette="warning"
                    onClick={() => setActivePanel('results')}
                    style={{ cursor: 'pointer' }}
                  />
                </SimpleGrid>
              </div>

              {/* Active Race Settings */}
              <div className="dashboard-section">
                <h3>Active Race for This Game</h3>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '1rem' }}>
                  Set which race this game is associated with. Athletes confirmed for this race will be available for drafting.
                </p>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <FormControl style={{ maxWidth: '400px' }}>
                    <FormLabel htmlFor="active-race-select">Select Race</FormLabel>
                    <select
                      id="active-race-select"
                      value={activeRaceId || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        handleChangeActiveRace(value ? parseInt(value, 10) : null);
                      }}
                      disabled={savingActiveRace}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #E2E8F0',
                        fontSize: '16px',
                        backgroundColor: 'white',
                        cursor: savingActiveRace ? 'wait' : 'pointer'
                      }}
                    >
                      <option value="">-- No race selected --</option>
                      {availableRaces.map(race => (
                        <option key={race.id} value={race.id}>
                          {race.name} ({new Date(race.date).toLocaleDateString()})
                          {race.isActive ? ' [Active]' : ''}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  {savingActiveRace && (
                    <span style={{ color: '#666', fontSize: '14px' }}>Saving...</span>
                  )}
                  {activeRace && !savingActiveRace && (
                    <span style={{ color: '#28a745', fontSize: '14px' }}>
                      Current: {activeRace.name}
                    </span>
                  )}
                </div>
                {error && (
                  <div style={{ color: 'red', marginTop: '0.5rem', fontSize: '14px' }}>
                    {error}
                  </div>
                )}
              </div>

              <div className="dashboard-section">
                <h3>Game Management</h3>
                <div className="button-group">
                  <Button
                    variant="solid"
                    colorPalette="primary"
                    onClick={() => setActivePanel('results')}
                  >
                    📊 Manage Results
                  </Button>
                  <Button
                    variant="solid"
                    colorPalette="primary"
                    onClick={() => setActivePanel('teams')}
                  >
                    👥 View Teams
                  </Button>
                  <Button
                    variant="solid"
                    colorPalette="primary"
                    onClick={() => setActivePanel('athletes')}
                  >
                    🏃 Manage Athletes
                  </Button>
                  <Button
                    variant="solid"
                    colorPalette="primary"
                    onClick={() => setActivePanel('races')}
                  >
                    🏁 Manage Races
                  </Button>
                </div>
              </div>

              <div className="dashboard-section">
                <h3>Administrative Actions</h3>
                <div className="button-group">
                  <Button
                    variant="outline"
                    colorPalette="navy"
                    onClick={handleShowPerformanceDashboard}
                    title="View dynamic import performance metrics"
                  >
                    📊 Performance Dashboard
                  </Button>
                  <Button
                    variant="solid"
                    colorPalette="warning"
                    onClick={handleResetGame}
                  >
                    🔄 Reset Game
                  </Button>
                  <Button
                    variant="outline"
                    colorPalette="navy"
                    onClick={handleLoadDemoData}
                  >
                    📥 Load Demo Data
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Panels - Load on demand */}
          {activePanel === 'results' && <ResultsManagementPanel />}
          {activePanel === 'athletes' && <AthleteManagementPanel />}
          {activePanel === 'teams' && <TeamsOverviewPanel />}
          {activePanel === 'races' && <RaceManagementPanel />}
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
    <AppStateProvider initialGameId={props.initialGameId}>
      <CommissionerPageContent {...props} />
    </AppStateProvider>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  // Check commissioner authentication from cookies
  // Cookie name matches what's set in /api/auth/totp/verify.js
  const commissionerCookie = context.req.cookies.marathon_fantasy_commissioner || null;
  
  // Get gameId from cookie (set by game selector in app.js)
  const gameIdCookie = context.req.cookies.current_game_id || DEFAULT_GAME_ID;
  
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
      initialGameId: gameIdCookie,
    },
  };
}
