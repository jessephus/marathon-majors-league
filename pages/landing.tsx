/**
 * Landing Page (New Implementation)
 * 
 * Welcome screen and team creation entry point.
 * Phase 1: Stub data with client-side hydration.
 */

import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { AppStateProvider, useSessionState } from '@/lib/state-provider';
import { apiClient } from '@/lib/api-client';
import { featureFlags } from '@/lib/feature-flags';

interface LandingPageProps {
  hasSession: boolean;
  sessionToken: string | null;
}

function LandingPageContent({ hasSession, sessionToken }: LandingPageProps) {
  const router = useRouter();
  const { sessionState, setSessionState } = useSessionState();
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore session from token if present
  useEffect(() => {
    if (sessionToken && !sessionState.token) {
      verifySession(sessionToken);
    }
  }, [sessionToken]);

  async function verifySession(token: string) {
    try {
      const result = await apiClient.session.verify(token);
      if (result.valid && result.session) {
        setSessionState(result.session);
        // Redirect to draft page
        router.push(`/team/${token}`);
      }
    } catch (err) {
      console.error('Session verification failed:', err);
    }
  }

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const session = await apiClient.session.create(teamName, ownerName || undefined);
      setSessionState(session);
      
      // Redirect to team session page
      router.push(`/team/${session.token}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team');
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Fantasy NY Marathon - Welcome</title>
        <meta name="description" content="Join the Fantasy NY Marathon competition. Draft elite runners and compete with friends!" />
      </Head>

      <div className="container">
        <header>
          <h1>🗽 Fantasy NY Marathon</h1>
        </header>

        <main className="page active" id="landing-page">
          <div className="welcome-card">
            <h2>Welcome to the Fantasy NY Marathon!</h2>
            <p>Compete with friends by drafting elite marathon runners.</p>
            
            <div className="create-team-section">
              <h3>🏃‍♂️ Join the Competition</h3>
              <p>Create your team and draft elite runners - no registration required!</p>
              <button 
                className="btn btn-primary btn-large"
                onClick={() => setShowTeamModal(true)}
              >
                Create a New Team
              </button>
            </div>
          </div>
        </main>

        {/* Team Creation Modal */}
        {showTeamModal && (
          <div className="modal" style={{ display: 'block' }}>
            <div className="modal-overlay" onClick={() => setShowTeamModal(false)}></div>
            <div className="modal-content">
              <button className="modal-close" onClick={() => setShowTeamModal(false)}>
                &times;
              </button>
              <h2>Create Your Team</h2>
              <p>Enter your team name to get started:</p>
              
              <form onSubmit={handleCreateTeam}>
                <div className="form-group">
                  <label htmlFor="team-name">Team Name</label>
                  <input
                    type="text"
                    id="team-name"
                    placeholder="e.g., The Fast Finishers"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    required
                    maxLength={50}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="team-owner">Your Name (optional)</label>
                  <input
                    type="text"
                    id="team-owner"
                    placeholder="e.g., John Smith"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    maxLength={50}
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
                    onClick={() => setShowTeamModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create Team & Start Drafting'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function NewLandingPage(props: LandingPageProps) {
  // Wrap in state provider
  return (
    <AppStateProvider>
      <LandingPageContent {...props} />
    </AppStateProvider>
  );
}

export async function getServerSideProps(context: any) {
  // Check for session token in URL or cookies
  const sessionToken = context.query.token || context.req.cookies.sessionToken || null;
  
  return {
    props: {
      hasSession: !!sessionToken,
      sessionToken,
    },
  };
}
