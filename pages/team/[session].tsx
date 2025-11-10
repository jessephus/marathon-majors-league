/**
 * Team Session Page (SSR Implementation)
 * 
 * Team drafting and roster management with salary cap system.
 * SSR: Fetches athlete pool, team roster, game state with roster lock.
 */

import React, { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import Script from 'next/script';
import { useRouter } from 'next/router';
import { GetServerSidePropsContext } from 'next';
import { AppStateProvider, useSessionState, useGameState } from '@/lib/state-provider';
import { apiClient } from '@/lib/api-client';
import { createTeamAvatarSVG } from '@/lib/ui-helpers';
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
    // Debug: Log roster lock time data
    console.log('[Team Session] Roster Lock Debug:', {
      rosterLockTime: gameStateData.rosterLockTime,
      resultsFinalized: gameStateData.resultsFinalized,
      locked: isRosterLocked(gameStateData.rosterLockTime) || gameStateData.resultsFinalized,
      gameId: sessionData.session?.gameId
    });
    
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
  
  // Calculate total spent from roster
  const totalSpent = roster.reduce((sum, slot) => sum + (slot.salary || 0), 0);
  
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

      {/* Load Chart.js for athlete progression charts */}
      <Script 
        src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js" 
        strategy="beforeInteractive" 
      />

      <div className="container">
        <header>
          <h1>🗽 Fantasy NY Marathon</h1>
        </header>

        <main className="page active" id="salary-cap-draft-page">
          {/* Team Header - Legacy Style */}
          <div className="team-header-orange">
            <div className="team-avatar-wrapper">
              {createTeamAvatarSVG(sessionState.teamName || 'My Team', 48)}
            </div>
            <div className="team-header-info">
              <div className="team-label">TEAM</div>
              <h2 className="team-name-heading">{sessionState.teamName || 'My Team'}</h2>
            </div>
            <div className="team-budget-stats">
              <div className="budget-stat">
                <div className="budget-label">CAP</div>
                <div className="budget-value">${DEFAULT_BUDGET.toLocaleString()}</div>
              </div>
              <div className="budget-stat">
                <div className="budget-label">SPENT</div>
                <div className="budget-value">${totalSpent.toLocaleString()}</div>
              </div>
              <div className="budget-stat">
                <div className="budget-label">LEFT</div>
                <div className="budget-value">${(DEFAULT_BUDGET - totalSpent).toLocaleString()}</div>
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

          {/* Roster Slots - Legacy Style (No Gender Sections) */}
          <div className="roster-slots-container-legacy">
            {roster.map(slot => {
              const athlete = slot.athleteId 
                ? (slot.slotId.startsWith('M') ? menAthletes : womenAthletes).find(a => a.id === slot.athleteId)
                : null;

              return (
                <div 
                  key={slot.slotId}
                  className={`roster-slot-legacy ${athlete ? 'filled' : 'empty'} ${locked ? 'locked' : ''}`}
                  onClick={() => !locked && handleSlotClick(slot.slotId, slot.athleteId)}
                  style={{ cursor: locked ? 'not-allowed' : 'pointer' }}
                >
                  <div className="slot-label-legacy">{slot.slotId}</div>
                  <div className="slot-content-legacy">
                    {athlete ? (
                      <>
                        <div className="slot-headshot-legacy">
                          <img 
                            src={athlete.headshotUrl || (slot.slotId.startsWith('M') ? '/images/man-runner.png' : '/images/woman-runner.png')} 
                            alt={athlete.name}
                            className="slot-headshot-img-legacy"
                            onError={(e) => {
                              e.currentTarget.src = slot.slotId.startsWith('M') ? '/images/man-runner.png' : '/images/woman-runner.png';
                            }}
                          />
                        </div>
                        <div className="slot-athlete-info-legacy">
                          <div className="slot-athlete-name-legacy">{athlete.name}</div>
                          <div className="slot-athlete-details-legacy">
                            {athlete.country} • {athlete.pb} • #{athlete.marathonRank || 'N/A'}
                          </div>
                        </div>
                        <div className="slot-athlete-salary-legacy">
                          ${(athlete.salary || 5000).toLocaleString()}
                        </div>
                        {!locked && (
                          <button 
                            className="slot-remove-btn-legacy"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveAthlete(slot.slotId);
                            }}
                          >
                            ×
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="slot-placeholder-legacy">Tap to select</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submit Container */}
          <div className="draft-submit-container">
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
            <p>🔗 Session: /team/{sessionToken}</p>
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

        <Footer mode="team" showGameSwitcher={true} showCopyright={true} />
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
