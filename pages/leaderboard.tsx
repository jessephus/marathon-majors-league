/**
 * Leaderboard Page (Migration Phase 4 Pilot)
 * 
 * SSR: Fetch standings + results once, embed cache timestamp.
 * Client hydration: Start refresh interval only when page active and window focused.
 * Replace manual DOM manipulation with declarative components.
 * Cache invalidation integrated with state manager events.
 * Accessibility refinements for sticky header.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Head from 'next/head';
import { GetServerSidePropsContext } from 'next';
import { AppStateProvider, useGameState, useSessionState } from '@/lib/state-provider';
import { useStateManagerEvent } from '@/lib/use-state-manager';
import { apiClient } from '@/lib/api-client';
import LeaderboardTable from '@/components/LeaderboardTable';
import ResultsTable from '@/components/ResultsTable';
import Footer from '@/components/Footer';
import { dynamicImport, CHUNK_NAMES, prefetchChunk } from '@/lib/dynamic-import';
import { FeatureFlag } from '@/lib/feature-flags';

// Dynamic import AthleteModal with performance tracking
const AthleteModal = dynamicImport(
  () => import('@/components/AthleteModal'),
  {
    chunkName: CHUNK_NAMES.ATHLETE_MODAL,
    featureFlag: FeatureFlag.DYNAMIC_ATHLETE_MODAL,
    loading: () => (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ 
          display: 'inline-block', 
          width: '40px', 
          height: '40px', 
          border: '4px solid rgba(255, 105, 0, 0.2)', 
          borderTopColor: '#ff6900', 
          borderRadius: '50%', 
          animation: 'spin 1s linear infinite' 
        }} />
      </div>
    ),
    ssr: false,
  }
);

interface LeaderboardPageProps {
  gameId: string;
  initialStandings: any;
  initialResults: any;
  cacheTimestamp: number;
}

function LeaderboardPageContent({ 
  gameId, 
  initialStandings,
  initialResults,
  cacheTimestamp 
}: LeaderboardPageProps) {
  const { gameState, setGameState } = useGameState();
  const { sessionState } = useSessionState();
  const [activeTab, setActiveTab] = useState<'fantasy' | 'race'>('fantasy');
  const [loading, setLoading] = useState(!initialStandings && !initialResults); // Show loading if no initial data
  const [error, setError] = useState<string | null>(null);
  const [standings, setStandings] = useState(initialStandings);
  const [results, setResults] = useState(initialResults);
  const [lastUpdate, setLastUpdate] = useState(cacheTimestamp);
  
  // Points modal state - using AthleteModal instead of simple modal
  const [selectedAthlete, setSelectedAthlete] = useState<{
    athlete: any;
    scoringData: any;
  } | null>(null);

  // Visibility tracking
  const [isVisible, setIsVisible] = useState(true);
  const [isFocused, setIsFocused] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to state manager events for cache invalidation
  useStateManagerEvent('results:updated', () => {
    console.log('📢 Results updated event received - refreshing leaderboard');
    fetchData();
  });

  useStateManagerEvent('results:invalidated', () => {
    console.log('📢 Results cache invalidated - refreshing leaderboard');
    fetchData();
  });

  // Track page visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Fetch standings and results
  const fetchData = useCallback(async () => {
    if (!isVisible || !isFocused) {
      console.log('⏸️ Auto-refresh paused (tab hidden or not focused)');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch standings, results, and game state in parallel using API client
      const [standingsData, resultsData, gameStateData] = await Promise.all([
        apiClient.standings.fetch(gameId),
        apiClient.results.fetch(gameId),
        apiClient.gameState.load(gameId)
      ]);

      console.log('📊 Standings data received:', standingsData);
      console.log('📊 Has standings array?', !!standingsData.standings);
      console.log('📊 Standings length:', standingsData.standings?.length || 0);
      setStandings(standingsData);

      // Results and game state already fetched via API client
      setResults(resultsData);

      const isFinalized = (gameStateData as any)?.resultsFinalized || false;

      setLastUpdate(Date.now());
      setGameState({ 
        results: (resultsData as any)?.results || {},
        resultsFinalized: isFinalized
      });

    } catch (err) {
      console.error('Failed to fetch leaderboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  }, [gameId, setGameState, isVisible, isFocused]);

  // Fetch data on mount if we don't have initial data
  useEffect(() => {
    if (!initialStandings && !initialResults) {
      console.log('🔄 Initial data fetch on mount');
      fetchData();
    }
  }, []); // Empty deps - run once on mount

  // Set up auto-refresh only when page is visible and focused
  useEffect(() => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Only set up interval if page is visible and focused
    if (isVisible && isFocused) {
      console.log('▶️ Auto-refresh started (60s interval)');
      
      // Set up 60-second refresh interval
      intervalRef.current = setInterval(() => {
        console.log('🔄 Auto-refreshing leaderboard...');
        fetchData();
      }, 60000);
    } else {
      console.log('⏸️ Auto-refresh paused');
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isVisible, isFocused, fetchData]);

  // Handle player click
  const handlePlayerClick = (playerCode: string) => {
    // Future: Open team details modal
    console.log('Clicked player:', playerCode);
  };

  // Handle athlete click - show athlete modal with scoring
  const handleAthleteClick = (result: any) => {
    // Convert result data to athlete format
    const athleteData = {
      id: result.athlete_id,
      name: result.athlete_name,
      country: result.country || '',
      gender: result.gender || 'men',
      pb: result.personal_best || result.pb || '',
      headshotUrl: result.headshot_url,
      worldAthleticsId: result.world_athletics_id,
      marathonRank: result.marathon_rank,
      roadRunningRank: result.road_running_rank,
      overallRank: result.overall_rank,
      age: result.age,
      dateOfBirth: result.date_of_birth,
      sponsor: result.sponsor,
      seasonBest: result.season_best,
    };

    setSelectedAthlete({
      athlete: athleteData,
      scoringData: {
        totalPoints: result.total_points || 0,
        breakdown: result.breakdown,
        finishTime: result.finish_time,
        placement: result.placement,
        splits: {
          split_5k: result.split_5k,
          split_10k: result.split_10k,
          split_half: result.split_half,
          split_30k: result.split_30k,
          split_35k: result.split_35k,
          split_40k: result.split_40k,
        },
      },
    });
  };

  // Current player code - prefer playerCode, fallback to teamName for backwards compatibility
  const currentPlayerCode = sessionState.playerCode || sessionState.teamName || null;

  // Sort standings to put current player's team at top (if they have a session)
  const sortedStandings = React.useMemo(() => {
    if (!standings?.standings || !currentPlayerCode) {
      return standings?.standings || [];
    }

    const standingsCopy = [...standings.standings];
    const currentPlayerIndex = standingsCopy.findIndex(s => s.player_code === currentPlayerCode);
    
    if (currentPlayerIndex > 0) {
      // Move current player to top
      const [currentPlayer] = standingsCopy.splice(currentPlayerIndex, 1);
      standingsCopy.unshift(currentPlayer);
    }
    
    return standingsCopy;
  }, [standings, currentPlayerCode]);

  // Format time since last update
  const timeSinceUpdate = Math.floor((Date.now() - lastUpdate) / 1000);
  const updateTimeText = timeSinceUpdate < 60 
    ? 'Just now' 
    : `${Math.floor(timeSinceUpdate / 60)}m ago`;

  return (
    <>
      <Head>
        <title>Leaderboard - Fantasy NY Marathon</title>
        <meta name="description" content="Live fantasy standings and race results" />
      </Head>

      <div className="container">
        <header>
          <h1>🗽 Fantasy NY Marathon</h1>
        </header>

        <main className="page active" id="leaderboard-page">
          <h2>Leaderboard</h2>

          {/* Tab Navigation */}
          <div className="leaderboard-tabs">
            <button
              className={`leaderboard-tab ${activeTab === 'fantasy' ? 'active' : ''}`}
              onClick={() => setActiveTab('fantasy')}
              aria-selected={activeTab === 'fantasy'}
              role="tab"
            >
              Fantasy Standings
            </button>
            <button
              className={`leaderboard-tab ${activeTab === 'race' ? 'active' : ''}`}
              onClick={() => setActiveTab('race')}
              aria-selected={activeTab === 'race'}
              role="tab"
            >
              Race Results
            </button>
          </div>

          {/* Error State */}
          {error && (
            <div className="error-state" style={{ color: 'red', padding: '1rem', marginTop: '1rem' }}>
              {error}
              <button 
                onClick={fetchData} 
                className="btn btn-secondary" 
                style={{ marginLeft: '1rem' }}
              >
                Try Again
              </button>
            </div>
          )}

          {/* Fantasy Standings Tab */}
          {activeTab === 'fantasy' && (
            <div id="fantasy-leaderboard" role="tabpanel">
              <div id="leaderboard-display">
                {loading && !standings ? (
                  <div className="loading-spinner">Loading leaderboard...</div>
                ) : !standings || (!standings.standings || standings.standings.length === 0) ? (
                  <p>No teams have submitted rosters yet. Be the first to create a team!</p>
                ) : (
                  <LeaderboardTable
                    standings={sortedStandings}
                    currentPlayerCode={currentPlayerCode}
                    isTemporary={standings?.isTemporary || false}
                    hasFinishTimes={standings?.hasFinishTimes || false}
                    hasResults={standings?.hasResults}
                    projectionInfo={standings?.projectionInfo || null}
                    resultsFinalized={gameState.resultsFinalized}
                    onPlayerClick={handlePlayerClick}
                  />
                )}
              </div>
            </div>
          )}

          {/* Race Results Tab */}
          {activeTab === 'race' && (
            <div id="race-results-leaderboard" role="tabpanel">
              <div id="race-results-display">
                {loading && !results ? (
                  <div className="loading-spinner">Loading race results...</div>
                ) : !results?.scored || results.scored.length === 0 ? (
                  <p className="empty-state">Race results will appear here once the race begins</p>
                ) : (
                  <ResultsTable
                    results={results.scored}
                    onAthleteClick={handleAthleteClick}
                  />
                )}
              </div>
            </div>
          )}

          {/* Auto-refresh indicator */}
          <div 
            className="auto-refresh-info" 
            style={{ 
              marginTop: '1rem', 
              fontSize: '0.875rem', 
              color: '#666',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>
              {isVisible && isFocused ? (
                <>🔄 Auto-refreshing every 60 seconds</>
              ) : (
                <>⏸️ Auto-refresh paused (tab inactive)</>
              )}
            </span>
            <span>Last update: {updateTimeText}</span>
          </div>
        </main>

        <Footer mode="leaderboard" showCopyright={false} />
      </div>

      {/* Athlete Modal with Scoring */}
      <AthleteModal
        athlete={selectedAthlete?.athlete || null}
        isOpen={!!selectedAthlete}
        onClose={() => setSelectedAthlete(null)}
        showScoring={true}
        scoringData={selectedAthlete?.scoringData}
      />
    </>
  );
}

export default function NewLeaderboardPage(props: LeaderboardPageProps) {
  return (
    <AppStateProvider>
      <LeaderboardPageContent {...props} />
    </AppStateProvider>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  // Get gameId from cookie (set by game switcher in Footer component)
  // Falls back to query param, then 'default'
  const gameIdCookie = context.req.cookies.current_game_id;
  const gameIdQuery = context.query.gameId;
  const gameId = gameIdCookie || gameIdQuery || 'default';
  
  // Note: In serverless environments (Vercel), SSR can't fetch from localhost
  // Client-side hydration will fetch the actual data on mount
  const initialStandings = null;
  const initialResults = null;
  const cacheTimestamp = Date.now();

  return {
    props: {
      gameId: typeof gameId === 'string' ? gameId : 'default',
      initialStandings,
      initialResults,
      cacheTimestamp,
    },
  };
}
