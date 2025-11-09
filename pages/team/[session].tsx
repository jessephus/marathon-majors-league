/**
 * Team Session Page (SSR Implementation)
 * 
 * Team drafting and roster management with salary cap system.
 * SSR: Fetches athlete pool, team roster, game state with roster lock.
 */

import React, { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { GetServerSidePropsContext } from 'next';
import { AppStateProvider, useSessionState, useGameState } from '@/lib/state-provider';
import { apiClient } from '@/lib/api-client';
import Footer from '@/components/Footer';
import RosterSlots from '@/components/RosterSlots';
import BudgetTracker from '@/components/BudgetTracker';
import AthleteSelectionModal from '@/components/AthleteSelectionModal';
import { isRosterLocked, formatLockTime, getTimeUntilLock, DEFAULT_BUDGET } from '@/lib/budget-utils';

interface Athlete {
  id: number;
  name: string;
  country: string;
  gender: string;
  pb: string;
  salary: number;
  headshotUrl?: string;
  marathonRank?: number;
  age?: number;
  sponsor?: string;
}

interface TeamRoster {
  M1: Athlete | null;
  M2: Athlete | null;
  M3: Athlete | null;
  W1: Athlete | null;
  W2: Athlete | null;
  W3: Athlete | null;
}

interface TeamSessionPageProps {
  sessionToken: string;
  sessionData: {
    valid: boolean;
    session?: {
      id: string;
      type: string;
      gameId: string;
      playerCode: string | null;
      displayName: string | null;
      expiresAt: string;
    };
  };
  athletesData: {
    men: Athlete[];
    women: Athlete[];
  };
  gameStateData: {
    rosterLockTime: string | null;
    resultsFinalized: boolean;
    draftComplete: boolean;
  };
  existingRoster: TeamRoster | null;
}

function TeamSessionPageContent({ 
  sessionToken, 
  sessionData, 
  athletesData, 
  gameStateData,
  existingRoster 
}: TeamSessionPageProps) {
  const router = useRouter();
  const { sessionState, setSessionState } = useSessionState();
  const { gameState, setGameState } = useGameState();
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState<'men' | 'women'>('men');
  
  // Roster state (convert from TeamRoster to RosterSlot[] format)
  const [roster, setRoster] = useState(() => {
    const initialRoster = [
      { slotId: 'M1', athleteId: existingRoster?.M1?.id || null, salary: existingRoster?.M1?.salary || null },
      { slotId: 'M2', athleteId: existingRoster?.M2?.id || null, salary: existingRoster?.M2?.salary || null },
      { slotId: 'M3', athleteId: existingRoster?.M3?.id || null, salary: existingRoster?.M3?.salary || null },
      { slotId: 'W1', athleteId: existingRoster?.W1?.id || null, salary: existingRoster?.W1?.salary || null },
      { slotId: 'W2', athleteId: existingRoster?.W2?.id || null, salary: existingRoster?.W2?.salary || null },
      { slotId: 'W3', athleteId: existingRoster?.W3?.id || null, salary: existingRoster?.W3?.salary || null },
    ];
    return initialRoster;
  });

  // Initialize state from SSR props
  useEffect(() => {
    if (sessionData.valid && sessionData.session) {
      setSessionState({
        token: sessionToken,
        teamName: sessionData.session.displayName || 'My Team',
        playerCode: sessionData.session.playerCode || null,
        ownerName: null,
        expiresAt: sessionData.session.expiresAt,
      });
      
      setGameState({
        athletes: athletesData,
        rosterLockTime: gameStateData.rosterLockTime,
        resultsFinalized: gameStateData.resultsFinalized,
        draftComplete: gameStateData.draftComplete,
        gameId: sessionData.session.gameId,
      });
    }
  }, [sessionData, athletesData, gameStateData, sessionToken, setSessionState, setGameState]);

  // Check if roster is locked
  const locked = isRosterLocked(gameStateData.rosterLockTime) || gameStateData.resultsFinalized;
  
  // Handle slot click (open athlete selection modal)
  const handleSlotClick = useCallback((slotId: string, currentAthleteId: number | null) => {
    const gender = slotId.startsWith('M') ? 'men' : 'women';
    setSelectedSlot(slotId);
    setSelectedGender(gender);
    setIsModalOpen(true);
  }, []);

  // Handle athlete selection
  const handleAthleteSelect = useCallback((athlete: Athlete) => {
    if (!selectedSlot) return;
    
    setRoster(prev => prev.map(slot => 
      slot.slotId === selectedSlot
        ? { slotId: slot.slotId, athleteId: athlete.id, salary: athlete.salary }
        : slot
    ));
    
    setIsModalOpen(false);
    setSelectedSlot(null);
  }, [selectedSlot]);

  // Handle athlete removal
  const handleRemoveAthlete = useCallback((slotId: string) => {
    setRoster(prev => prev.map(slot =>
      slot.slotId === slotId
        ? { slotId: slot.slotId, athleteId: null, salary: null }
        : slot
    ));
  }, []);

  // Handle roster submission
  const handleSubmitRoster = useCallback(async () => {
    if (!sessionData.session?.playerCode) {
      alert('Session error: No player code found');
      return;
    }

    try {
      // Convert roster to API format
      const team = roster.reduce((acc, slot) => {
        if (slot.athleteId) {
          acc[slot.slotId] = slot.athleteId;
        }
        return acc;
      }, {} as Record<string, number>);

      await apiClient.salaryCapDraft.submitTeam(
        sessionData.session.gameId,
        sessionData.session.playerCode,
        team
      );

      alert('Team submitted successfully!');
      router.push('/leaderboard');
    } catch (err) {
      console.error('Failed to submit team:', err);
      alert('Failed to submit team. Please try again.');
    }
  }, [roster, sessionData, router]);

  // Error state
  if (!sessionData.valid) {
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
              <p>Invalid or expired session</p>
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

  const menAthletes = athletesData.men || [];
  const womenAthletes = athletesData.women || [];
  const totalAthletes = menAthletes.length + womenAthletes.length;
  const allFilledSlots = roster.every(slot => slot.athleteId !== null);

  // Format lock time display
  const lockTimeDisplay = formatLockTime(gameStateData.rosterLockTime);
  const timeUntilLock = getTimeUntilLock(gameStateData.rosterLockTime);
  return (
    <>
      <Head>
        <title>{sessionState.teamName || 'My Team'} - Fantasy NY Marathon</title>
        <meta name="description" content="Build your fantasy marathon team with salary cap draft" />
      </Head>

      <div className="container">
        <header>
          <h1>🗽 Fantasy NY Marathon</h1>
        </header>

        <main className="page active" id="salary-cap-draft-page">
          {/* Draft Header with Team Info */}
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
                <div className="team-name-value">{sessionState.teamName || 'My Team'}</div>
              </div>
            </div>
          </div>

          {/* Roster Lock Notice */}
          {gameStateData.rosterLockTime && (
            <div className={`roster-lock-notice ${locked ? 'locked' : 'warning'}`}>
              {locked ? (
                <>🔒 Roster locked as of {lockTimeDisplay}</>
              ) : timeUntilLock && !timeUntilLock.isPast ? (
                <>⏰ Roster locks at {lockTimeDisplay}</>
              ) : (
                <>⏰ Roster lock: {lockTimeDisplay}</>
              )}
            </div>
          )}

          {/* Budget Tracker */}
          <BudgetTracker roster={roster} totalBudget={DEFAULT_BUDGET} />

          {/* Roster Slots */}
          <RosterSlots
            roster={roster}
            athletes={athletesData}
            isLocked={locked}
            onSlotClick={handleSlotClick}
            onRemoveAthlete={handleRemoveAthlete}
          />

          {/* Submit Container */}
          <div className="draft-submit-container">
            <p className="athlete-pool-info">
              {totalAthletes > 0 
                ? `${totalAthletes} elite athletes available (${menAthletes.length} men, ${womenAthletes.length} women)`
                : 'Loading athlete database...'
              }
            </p>
            
            <button 
              className="btn btn-primary btn-large" 
              disabled={!allFilledSlots || locked}
              onClick={handleSubmitRoster}
            >
              {locked ? 'Roster Locked' : allFilledSlots ? 'Submit Team' : 'Fill all slots first'}
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
            <p>💡 Tip: Share your session link with friends to join the same game!</p>
            <p>🔗 Session: {typeof window !== 'undefined' ? window.location.href : ''}</p>
          </div>
        </main>

        {/* Athlete Selection Modal */}
        <AthleteSelectionModal
          isOpen={isModalOpen}
          slotId={selectedSlot}
          gender={selectedGender}
          athletes={selectedGender === 'men' ? menAthletes : womenAthletes}
          currentRoster={roster}
          totalBudget={DEFAULT_BUDGET}
          onSelect={handleAthleteSelect}
          onClose={() => setIsModalOpen(false)}
        />

        <Footer mode="team" showCopyright={false} />
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
  
  if (typeof sessionToken !== 'string') {
    return {
      props: {
        sessionToken: '',
        sessionData: { valid: false },
        athletesData: { men: [], women: [] },
        gameStateData: {
          rosterLockTime: null,
          resultsFinalized: false,
          draftComplete: false,
        },
        existingRoster: null,
      },
    };
  }

  try {
    // Verify session token
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    const sessionResponse = await fetch(
      `${baseUrl}/api/session/verify?token=${encodeURIComponent(sessionToken)}`
    );
    const sessionData = await sessionResponse.json();

    if (!sessionData.valid || !sessionData.session) {
      return {
        props: {
          sessionToken,
          sessionData: { valid: false },
          athletesData: { men: [], women: [] },
          gameStateData: {
            rosterLockTime: null,
            resultsFinalized: false,
            draftComplete: false,
          },
          existingRoster: null,
        },
      };
    }

    // Fetch athletes
    const athletesResponse = await fetch(`${baseUrl}/api/athletes?confirmedOnly=false`);
    const athletesData = await athletesResponse.json();

    // Fetch game state
    const gameId = sessionData.session.gameId || 'default';
    const gameStateResponse = await fetch(`${baseUrl}/api/game-state?gameId=${gameId}`);
    const gameStateData = await gameStateResponse.json();

    // Fetch existing roster (if any)
    let existingRoster = null;
    if (sessionData.session.playerCode) {
      try {
        const rosterResponse = await fetch(
          `${baseUrl}/api/salary-cap-draft?gameId=${gameId}&playerCode=${sessionData.session.playerCode}`
        );
        const rosterData = await rosterResponse.json();
        
        if (rosterData.team) {
          // Convert roster to TeamRoster format
          existingRoster = {
            M1: athletesData.men.find((a: Athlete) => a.id === rosterData.team.M1) || null,
            M2: athletesData.men.find((a: Athlete) => a.id === rosterData.team.M2) || null,
            M3: athletesData.men.find((a: Athlete) => a.id === rosterData.team.M3) || null,
            W1: athletesData.women.find((a: Athlete) => a.id === rosterData.team.W1) || null,
            W2: athletesData.women.find((a: Athlete) => a.id === rosterData.team.W2) || null,
            W3: athletesData.women.find((a: Athlete) => a.id === rosterData.team.W3) || null,
          };
        }
      } catch (err) {
        console.error('Failed to fetch existing roster:', err);
        // Continue without existing roster
      }
    }

    return {
      props: {
        sessionToken,
        sessionData,
        athletesData,
        gameStateData: {
          rosterLockTime: gameStateData.rosterLockTime || null,
          resultsFinalized: gameStateData.resultsFinalized || false,
          draftComplete: gameStateData.draftComplete || false,
        },
        existingRoster,
      },
    };
  } catch (error) {
    console.error('SSR error:', error);
    
    return {
      props: {
        sessionToken: typeof sessionToken === 'string' ? sessionToken : '',
        sessionData: { valid: false },
        athletesData: { men: [], women: [] },
        gameStateData: {
          rosterLockTime: null,
          resultsFinalized: false,
          draftComplete: false,
        },
        existingRoster: null,
      },
    };
  }
}
