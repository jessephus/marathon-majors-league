/**
 * Leaderboard Page (New Implementation)
 * 
 * Display fantasy standings and race results.
 * Phase 1: Stub data with client-side hydration.
 */

import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { AppStateProvider, useGameState } from '@/lib/state-provider';
import { apiClient } from '@/lib/api-client';

interface LeaderboardPageProps {
  gameId: string;
}

function LeaderboardPageContent({ gameId }: LeaderboardPageProps) {
  const { gameState, setGameState } = useGameState();
  const [activeTab, setActiveTab] = useState<'fantasy' | 'race'>('fantasy');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load results on mount
  useEffect(() => {
    loadResults();
    
    // Set up auto-refresh every 60 seconds
    const interval = setInterval(loadResults, 60000);
    return () => clearInterval(interval);
  }, [gameId]);

  async function loadResults() {
    try {
      const results = await apiClient.results.fetch(gameId);
      setGameState({ results: (results as Record<string, any>) || {} });
      setLoading(false);
    } catch (err) {
      console.error('Failed to load results:', err);
      setError('Failed to load leaderboard data');
      setLoading(false);
    }
  }

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
            >
              Fantasy Standings
            </button>
            <button
              className={`leaderboard-tab ${activeTab === 'race' ? 'active' : ''}`}
              onClick={() => setActiveTab('race')}
            >
              Race Results
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="loading-state">
              <p>Loading leaderboard...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="error-state" style={{ color: 'red', padding: '1rem' }}>
              {error}
            </div>
          )}

          {/* Fantasy Standings Tab */}
          {!loading && activeTab === 'fantasy' && (
            <div id="fantasy-leaderboard">
              <div className="leaderboard-container">
                {Object.keys(gameState.teams).length === 0 ? (
                  <p className="empty-state">No teams yet. Create a team to get started!</p>
                ) : (
                  <table className="leaderboard-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Team</th>
                        <th>Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Placeholder for team standings */}
                      <tr>
                        <td colSpan={3} className="empty-state">
                          Fantasy standings will appear here once the race begins
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Race Results Tab */}
          {!loading && activeTab === 'race' && (
            <div id="race-results-leaderboard">
              <div className="leaderboard-container">
                {Object.keys(gameState.results).length === 0 ? (
                  <p className="empty-state">Race results will appear here once the race begins</p>
                ) : (
                  <table className="leaderboard-table">
                    <thead>
                      <tr>
                        <th>Place</th>
                        <th>Athlete</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Placeholder for race results */}
                      <tr>
                        <td colSpan={3} className="empty-state">
                          Race results will appear here
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Auto-refresh indicator */}
          <div className="auto-refresh-info" style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#666' }}>
            {!loading && '🔄 Auto-refreshing every 60 seconds'}
          </div>
        </main>

        {/* Footer Navigation */}
        <footer>
          <button className="btn btn-secondary" onClick={() => window.history.back()}>
            ← Back
          </button>
        </footer>
      </div>
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

export async function getServerSideProps(context: any) {
  const gameId = context.query.gameId || 'default';
  
  // Phase 1: Return stub data
  // Phase 2+: Fetch actual results for SSR
  return {
    props: {
      gameId,
    },
  };
}
