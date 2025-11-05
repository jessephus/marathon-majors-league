/**
 * Team Session Page (New Implementation)
 * 
 * Team drafting and roster management with salary cap system.
 * Phase 1: Stub data with client-side hydration.
 */

import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { GetServerSidePropsContext } from 'next';
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
    async function verify() {
      try {
        const result = await apiClient.session.verify(sessionToken);
        if (result.valid && result.session) {
          // Transform API response to match SessionState interface
          setSessionState({
            token: sessionToken,
            teamName: result.session.displayName || 'My Team',
            playerCode: result.session.playerCode || null,
            ownerName: null, // Not provided by API yet
            expiresAt: result.session.expiresAt,
          });
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
    verify();
  }, [sessionToken, setSessionState]);

  // Load athletes after session is verified
  useEffect(() => {
    async function loadData() {
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
    if (sessionValid) {
      loadData();
    }
  }, [sessionValid, setGameState]);

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
          {/* Draft Header with Team Info and Budget */}
          <div className="draft-header">
            <div className="team-info">
              <div className="team-avatar-placeholder">
                <div className="avatar-circle">
                  <div className="avatar-initials">
                    {sessionState.teamName ? sessionState.teamName.charAt(0).toUpperCase() : 'T'}
                  </div>
                </div>
              </div>
              <div className="team-name-display">
                <div className="team-name-label">Your Team</div>
                <div className="team-name-value">{sessionState.teamName}</div>
              </div>
            </div>
            
            <div className="draft-budget-compact">
              <div className="budget-metric">
                <div className="metric-value budget-remaining" id="budget-remaining">$30,000</div>
                <div className="metric-label">Remaining</div>
              </div>
            </div>
          </div>

          {/* Draft Slots */}
          <div className="draft-slots-container">
            {/* Men's Slots */}
            {[1, 2, 3].map((slot) => (
              <div key={`M${slot}`} className="draft-slot empty" data-slot-id={`M${slot}`}>
                <div className="slot-label">M{slot}</div>
                <div className="slot-content">
                  <span className="slot-placeholder">Tap to select athlete</span>
                </div>
              </div>
            ))}

            {/* Women's Slots */}
            {[1, 2, 3].map((slot) => (
              <div key={`W${slot}`} className="draft-slot empty" data-slot-id={`W${slot}`}>
                <div className="slot-label">W{slot}</div>
                <div className="slot-content">
                  <span className="slot-placeholder">Tap to select athlete</span>
                </div>
              </div>
            ))}
          </div>

          {/* Submit Container */}
          <div className="draft-submit-container">
            <p className="athlete-pool-info">
              {totalAthletes > 0 
                ? `${totalAthletes} elite athletes available (${menAthletes.length} men, ${womenAthletes.length} women)`
                : 'Loading athlete database...'
              }
            </p>
            <button className="btn btn-primary btn-large" disabled>
              Submit Team (fill all slots first)
            </button>
            <button 
              className="btn btn-secondary"
              style={{ marginTop: '12px' }}
              onClick={() => router.push('/leaderboard')}
            >
              View Leaderboard
            </button>
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

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const sessionToken = context.params?.session;
  
  // Phase 1: Return stub with session token
  // Phase 2+: Verify session and fetch team data on server
  return {
    props: {
      sessionToken: typeof sessionToken === 'string' ? sessionToken : '',
    },
  };
}
