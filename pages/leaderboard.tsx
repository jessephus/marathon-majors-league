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
import LeaderboardTable from '@/components/LeaderboardTable';
import ResultsTable from '@/components/ResultsTable';
import AthleteModal from '@/components/AthleteModal';
import Footer from '@/components/Footer';

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

      // Fetch standings, results, and game state in parallel
      const [standingsResponse, resultsResponse, gameStateResponse] = await Promise.all([
        fetch(`/api/standings?gameId=${gameId}`),
        fetch(`/api/results?gameId=${gameId}`),
        fetch(`/api/game-state?gameId=${gameId}`)
      ]);

      if (!standingsResponse.ok) {
        throw new Error('Failed to fetch standings');
      }
      const standingsData = await standingsResponse.json();
      setStandings(standingsData);

      if (!resultsResponse.ok) {
        throw new Error('Failed to fetch results');
      }
      const resultsData = await resultsResponse.json();
      setResults(resultsData);

      // Get game state for resultsFinalized flag
      let isFinalized = false;
      if (gameStateResponse.ok) {
        const gameStateData = await gameStateResponse.json();
        isFinalized = gameStateData.resultsFinalized || false;
      }

      setLastUpdate(Date.now());
      setGameState({ 
        results: resultsData.results || {},
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
                ) : !standings || (standings.hasResults === false && (!standings.standings || standings.standings.length === 0)) ? (
                  <p>No race results available yet. Check back once the race begins!</p>
                ) : (
                  <LeaderboardTable
                    standings={standings?.standings || []}
                    currentPlayerCode={currentPlayerCode}
                    isTemporary={standings?.isTemporary || false}
                    hasFinishTimes={standings?.hasFinishTimes || false}
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
  const gameId = context.query.gameId || 'default';
  
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
