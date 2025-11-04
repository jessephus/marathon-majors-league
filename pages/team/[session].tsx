/**
 * Team Session Page (New Implementation)
 * 
 * Team drafting and roster management with salary cap system.
 * Phase 1: Stub data with client-side hydration.
 */

import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { AppStateProvider, useSessionState, useGameState } from '@/lib/state-provider';
import { apiClient } from '@/lib/api-client';

interface TeamSessionPageProps {
  sessionToken: string;
}

function TeamSessionPageContent({ sessionToken }: TeamSessionPageProps) {
  const router = useRouter();
  const { sessionState, setSessionState } = useSessionState();
  const { gameState, setGameState } = useGameState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionValid, setSessionValid] = useState(false);

  // Verify session on mount
  useEffect(() => {
    verifySession();
  }, [sessionToken]);

  // Load athletes after session is verified
  useEffect(() => {
    if (sessionValid) {
      loadAthletes();
    }
  }, [sessionValid]);

  async function verifySession() {
    try {
      const result = await apiClient.session.verify(sessionToken);
      if (result.valid && result.session) {
        setSessionState(result.session);
        setSessionValid(true);
      } else {
        setError('Invalid or expired session');
        setLoading(false);
      }
    } catch (err) {
      console.error('Session verification failed:', err);
      setError('Failed to verify session');
      setLoading(false);
    }
  }

  async function loadAthletes() {
    try {
      const athletes = await apiClient.athletes.list();
      setGameState({ athletes });
      setLoading(false);
    } catch (err) {
      console.error('Failed to load athletes:', err);
      setError('Failed to load athlete data');
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading Team - Fantasy NY Marathon</title>
        </Head>
        <div className="container">
          <div className="loading-overlay">
            <h2>Verifying your session...</h2>
            <div className="loading-spinner"></div>
          </div>
        </div>
      </>
    );
  }

  if (error || !sessionValid) {
    return (
      <>
        <Head>
          <title>Session Error - Fantasy NY Marathon</title>
        </Head>
        <div className="container">
          <header>
            <h1>🗽 Fantasy NY Marathon</h1>
          </header>
          <main className="page active">
            <div className="error-card">
              <h2>Session Error</h2>
              <p>{error || 'Invalid session'}</p>
              <button 
                className="btn btn-primary"
                onClick={() => router.push('/')}
              >
                Return to Home
              </button>
            </div>
          </main>
        </div>
      </>
    );
  }

  const menAthletes = gameState.athletes.men || [];
  const womenAthletes = gameState.athletes.women || [];
  const totalAthletes = menAthletes.length + womenAthletes.length;

  return (
    <>
      <Head>
        <title>{sessionState.teamName} - Fantasy NY Marathon</title>
        <meta name="description" content="Build your fantasy marathon team with salary cap draft" />
      </Head>

      <div className="container">
        <header>
          <h1>🗽 Fantasy NY Marathon</h1>
        </header>

        <main className="page active" id="salary-cap-draft-page">
          <div className="team-header">
            <h2>{sessionState.teamName}</h2>
            {sessionState.ownerName && (
              <p className="team-owner">Owner: {sessionState.ownerName}</p>
            )}
            <p className="player-code">Player Code: {sessionState.playerCode}</p>
          </div>

          <div className="draft-interface">
            <div className="budget-tracker">
              <h3>Salary Cap Budget</h3>
              <div className="budget-display">
                <span className="budget-label">Remaining:</span>
                <span className="budget-amount" id="budget-remaining">$30,000</span>
              </div>
            </div>

            <div className="roster-section">
              <h3>Your Roster (0/6 filled)</h3>
              
              <div className="roster-slots">
                <div className="gender-group">
                  <h4>Men's Team (3 slots)</h4>
                  <div className="slot-container">
                    {[1, 2, 3].map((slot) => (
                      <div key={`M${slot}`} className="roster-slot empty" data-slot-id={`M${slot}`}>
                        <div className="slot-label">M{slot}</div>
                        <div className="slot-content">
                          <span className="empty-text">Click to select athlete</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="gender-group">
                  <h4>Women's Team (3 slots)</h4>
                  <div className="slot-container">
                    {[1, 2, 3].map((slot) => (
                      <div key={`W${slot}`} className="roster-slot empty" data-slot-id={`W${slot}`}>
                        <div className="slot-label">W{slot}</div>
                        <div className="slot-content">
                          <span className="empty-text">Click to select athlete</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="athlete-pool-info">
              <p>
                {totalAthletes > 0 
                  ? `${totalAthletes} elite athletes available (${menAthletes.length} men, ${womenAthletes.length} women)`
                  : 'Loading athlete database...'
                }
              </p>
            </div>

            <div className="draft-actions">
              <button className="btn btn-primary btn-large" disabled>
                Submit Team (fill all slots first)
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => router.push('/leaderboard')}
              >
                View Leaderboard
              </button>
            </div>
          </div>

          <div className="session-info" style={{ marginTop: '2rem', fontSize: '0.875rem', color: '#666' }}>
            <p>💡 Tip: Share your player code with friends to join the same game!</p>
            <p>🔗 Session link: {typeof window !== 'undefined' ? window.location.href : ''}</p>
          </div>
        </main>

        <footer>
          <button className="btn btn-secondary" onClick={() => router.push('/')}>
            ← Back to Home
          </button>
        </footer>
      </div>
    </>
  );
}

export default function NewTeamSessionPage(props: TeamSessionPageProps) {
  return (
    <AppStateProvider>
      <TeamSessionPageContent {...props} />
    </AppStateProvider>
  );
}

export async function getServerSideProps(context: any) {
  const sessionToken = context.params.session;
  
  // Phase 1: Return stub with session token
  // Phase 2+: Verify session and fetch team data on server
  return {
    props: {
      sessionToken,
    },
  };
}
