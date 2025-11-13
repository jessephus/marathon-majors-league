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
import { apiClient, createServerApiClient } from '@/lib/api-client';
import { createTeamAvatarSVG, getRunnerSvg, getCountryFlag } from '@/lib/ui-helpers';
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
  salary?: number; // Make salary optional to match state-provider type
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
  isRosterComplete: boolean;  // Whether roster has been fully submitted
}

function TeamSessionPageContent({ 
  sessionToken, 
  sessionData, 
  athletesData, 
  gameStateData,
  existingRoster,
  isRosterComplete
}: TeamSessionPageProps) {
  const router = useRouter();
  const { sessionState, setSessionState } = useSessionState();
  const { gameState, setGameState } = useGameState();
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState<'men' | 'women'>('men');
  
  // Track if roster has been submitted (complete roster, not auto-saved partial)
  const [hasSubmittedRoster, setHasSubmittedRoster] = useState<boolean>(isRosterComplete);
  const [isEditingRoster, setIsEditingRoster] = useState(false);
  
  // Track if full athlete list has been loaded (for edit mode)
  const [fullAthletesLoaded, setFullAthletesLoaded] = useState(false);
  const [loadingFullAthletes, setLoadingFullAthletes] = useState(false);
  
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
    
    // Check if we received full athlete list in SSR (for non-locked rosters)
    // If athletesData has more than 10 athletes, it's the full list
    const totalAthletes = (athletesData.men?.length || 0) + (athletesData.women?.length || 0);
    if (totalAthletes > 6) {
      setFullAthletesLoaded(true);
    }
  }, [sessionData, athletesData, gameStateData, sessionToken, setSessionState, setGameState]);

  // Check if roster is locked
  const locked = isRosterLocked(gameStateData.rosterLockTime) || gameStateData.resultsFinalized;
  
  // Load full athlete list when entering edit mode (if not already loaded)
  const loadFullAthleteList = useCallback(async () => {
    if (fullAthletesLoaded || loadingFullAthletes) return;
    
    setLoadingFullAthletes(true);
    try {
      const athletes = await apiClient.athletes.list({ confirmedOnly: false });
      
      // Update game state with full athlete list
      setGameState({
        athletes: athletes
      });
      
      setFullAthletesLoaded(true);
    } catch (error) {
      console.error('Failed to load full athlete list:', error);
      alert('Failed to load athletes. Please try again.');
    } finally {
      setLoadingFullAthletes(false);
    }
  }, [fullAthletesLoaded, loadingFullAthletes, setGameState]);
  
  // Auto-load athletes for new teams (no existing roster)
  useEffect(() => {
    const totalAthletes = (athletesData.men?.length || 0) + (athletesData.women?.length || 0);
    
    // If SSR passed empty arrays (new team, no roster yet), load all athletes
    if (totalAthletes === 0 && !existingRoster && !fullAthletesLoaded && !loadingFullAthletes) {
      loadFullAthleteList();
    }
  }, [athletesData, existingRoster, fullAthletesLoaded, loadingFullAthletes, loadFullAthleteList, gameState.athletes]);
  
  // Handle entering edit mode
  const handleEnterEditMode = useCallback(async () => {
    // Load full athlete list if not already loaded
    if (!fullAthletesLoaded) {
      await loadFullAthleteList();
    }
    setIsEditingRoster(true);
  }, [fullAthletesLoaded, loadFullAthleteList]);
  
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

  // Auto-save partial roster (only if team hasn't been submitted yet)
  const autoSaveRoster = useCallback(async (currentRoster: typeof roster) => {
    // Don't auto-save if:
    // 1. Team has already been submitted (hasSubmittedRoster is true)
    // 2. User is editing an already submitted roster (isEditingRoster is true)
    // 3. Roster is locked
    // 4. No session token
    if (hasSubmittedRoster || isEditingRoster || locked || !sessionToken) {
      return;
    }

    try {
      const response = await fetch(`/api/teams/partial-save?gameId=${sessionData.session?.gameId || 'default'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({ roster: currentRoster })
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('Auto-save failed:', result.error);
      } else {
        console.log('Auto-save successful:', result.message);
      }
    } catch (error) {
      console.error('Auto-save error:', error);
      // Silently fail - auto-save is a convenience feature
    }
  }, [hasSubmittedRoster, isEditingRoster, locked, sessionToken, sessionData]);

  // Auto-save when roster changes (debounced)
  useEffect(() => {
    // Don't auto-save on initial mount
    const isInitialMount = roster.every(slot => slot.athleteId === null);
    if (isInitialMount) return;

    // Debounce auto-save to avoid too many requests
    const timer = setTimeout(() => {
      autoSaveRoster(roster);
    }, 1000); // Wait 1 second after last change before auto-saving

    return () => clearTimeout(timer);
  }, [roster, autoSaveRoster]);

  // Handle roster submission
  const handleSubmitRoster = useCallback(async () => {
    if (!sessionToken) {
      alert('Session error: No session token found');
      return;
    }

    try {
      // Convert roster to API format
      const team = {
        men: [] as { id: number }[],
        women: [] as { id: number }[]
      };

      roster.forEach(slot => {
        if (slot.athleteId) {
          if (slot.slotId.startsWith('M')) {
            team.men.push({ id: slot.athleteId });
          } else if (slot.slotId.startsWith('W')) {
            team.women.push({ id: slot.athleteId });
          }
        }
      });

      // Calculate total spent
      const totalSpent = roster.reduce((sum, slot) => sum + (slot.salary || 0), 0);

      // Make API call with session token in Authorization header
      const response = await fetch('/api/salary-cap-draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          gameId: sessionData.session?.gameId || 'default',
          team,
          totalSpent,
          teamName: sessionData.session?.displayName || 'My Team'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit team');
      }

      // Mark roster as submitted
      setHasSubmittedRoster(true);
      setIsEditingRoster(false);

      alert('Team submitted successfully!');
      router.push('/leaderboard');
    } catch (err) {
      console.error('Failed to submit team:', err);
      alert(`Failed to submit team: ${err instanceof Error ? err.message : 'Please try again.'}`);
    }
  }, [roster, sessionData, sessionToken, router]);

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

  // Use gameState.athletes (which gets updated by loadFullAthleteList) instead of athletesData (SSR prop)
  // Ensure all athletes have required salary field (fallback to 5000 if missing)
  const menAthletes = (gameState.athletes?.men || athletesData.men || []).map(a => ({
    ...a,
    salary: a.salary || 5000
  }));
  const womenAthletes = (gameState.athletes?.women || athletesData.women || []).map(a => ({
    ...a,
    salary: a.salary || 5000
  }));
  const totalAthletes = menAthletes.length + womenAthletes.length;
  
  // Calculate total spent from roster
  const totalSpent = roster.reduce((sum, slot) => sum + (slot.salary || 0), 0);
  
  const allFilledSlots = roster.every(slot => slot.athleteId !== null);
  
  // Determine roster editing state
  const isRosterLocked_computed = isRosterLocked(gameStateData.rosterLockTime);
  const isRosterEditable = !isRosterLocked_computed && (!hasSubmittedRoster || isEditingRoster);

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
            <div 
              className="team-avatar-wrapper"
              dangerouslySetInnerHTML={{ 
                __html: createTeamAvatarSVG(sessionData.session?.displayName || sessionState.teamName || 'My Team', 48) 
              }}
            />
            <div className="team-header-info">
              <div className="team-label">TEAM</div>
              <h2 className="team-name-heading">{sessionData.session?.displayName || sessionState.teamName || 'My Team'}</h2>
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
            <div className={`roster-lock-notice ${isRosterLocked_computed ? 'locked' : 'warning'}`}>
              {isRosterLocked_computed ? (
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

              // Get gender for fallback images
              const gender = slot.slotId.startsWith('M') ? 'men' : 'women';
              
              // Use headshot URL with fallback to placeholder
              const athleteHeadshotUrl = athlete?.headshotUrl || getRunnerSvg(gender);

              return (
                <div 
                  key={slot.slotId}
                  className={`roster-slot-legacy ${athlete ? 'filled' : 'empty'} ${!isRosterEditable ? 'locked' : ''}`}
                  onClick={() => isRosterEditable && handleSlotClick(slot.slotId, slot.athleteId)}
                  style={{ cursor: !isRosterEditable ? 'not-allowed' : 'pointer' }}
                >
                  <div className="slot-label-legacy">{slot.slotId}</div>
                  <div className="slot-content-legacy">
                    {athlete ? (
                      <>
                        <div className="slot-headshot-legacy">
                          <img 
                            src={athleteHeadshotUrl}
                            alt={athlete.name}
                            className="slot-headshot-img-legacy"
                            onError={(e) => {
                              // Set fallback image on error (same as modal pattern)
                              e.currentTarget.src = getRunnerSvg(gender);
                            }}
                          />
                        </div>
                        <div className="slot-athlete-info-legacy">
                          <div className="slot-athlete-name-legacy">{athlete.name}</div>
                          <div className="slot-athlete-details-legacy">
                            {getCountryFlag(athlete.country)} {athlete.country} • {athlete.pb} • #{athlete.marathonRank || 'N/A'}
                          </div>
                        </div>
                        <div className="slot-athlete-salary-legacy">
                          ${(athlete.salary || 5000).toLocaleString()}
                        </div>
                        {isRosterEditable && (
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
            {/* Show Edit button when roster is submitted but not locked */}
            {hasSubmittedRoster && !isEditingRoster && !isRosterLocked_computed ? (
              <button 
                className="btn btn-secondary btn-large" 
                onClick={handleEnterEditMode}
                disabled={loadingFullAthletes}
              >
                {loadingFullAthletes ? 'Loading athletes...' : 'Edit Roster'}
              </button>
            ) : (
              <button 
                className="btn btn-primary btn-large" 
                disabled={!allFilledSlots || isRosterLocked_computed}
                onClick={handleSubmitRoster}
              >
                {isRosterLocked_computed ? 'Roster Locked' : allFilledSlots ? 'Submit Team' : 'Fill all slots first'}
              </button>
            )}
            
            <button 
              className="btn btn-secondary"
              style={{ marginTop: '12px' }}
              onClick={() => router.push('/leaderboard')}
            >
              View Leaderboard
            </button>
          </div>

          <div className="session-info" style={{ marginTop: '2rem', fontSize: '0.875rem', color: '#666' }}>
            <p>🔗 Session ID: {sessionToken}</p>
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

        <Footer mode="team" showCopyright={true} />
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
        isRosterComplete: false,
      },
    };
  }

  try {
    // Construct base URL for server-side API requests
    const protocol = process.env.VERCEL_ENV === 'production' ? 'https' : 'http';
    const baseUrl = process.env.VERCEL_URL 
      ? `${protocol}://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    // Create server-side API client with explicit baseUrl
    const serverApi = createServerApiClient(baseUrl);
    
    // Verify session token using API client (benefits from retry logic)
    const sessionData = await serverApi.session.verify(sessionToken);

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
          isRosterComplete: false,
        },
      };
    }

    const gameId = sessionData.session.gameId || 'default';

    // Fetch game state using API client (benefits from caching headers and retry logic)
    const gameStateData = await serverApi.gameState.load(gameId);

    // Fetch existing roster (if any)
    let existingRoster = null;
    let athleteIds: number[] = [];
    let isRosterComplete = false;
    
    try {
      // Fetch roster using API client with Authorization header
      const rosterData = await serverApi.salaryCapDraft.get(gameId, sessionToken);
      
      // Find the roster using displayName (which equals playerCode)
      const playerCode = sessionData.session.displayName; // displayName = playerCode
      
      if (playerCode && rosterData[playerCode]) {
        const teamData = rosterData[playerCode];
        
        // Check if roster is complete (fully submitted, not just auto-saved partial)
        isRosterComplete = teamData.isComplete || false;
        
        // Load roster (both partial and complete rosters)
        if (teamData.men.length > 0 || teamData.women.length > 0) {
          // Convert roster arrays to slot-based format
          existingRoster = {
            M1: teamData.men[0] || null,
            M2: teamData.men[1] || null,
            M3: teamData.men[2] || null,
            W1: teamData.women[0] || null,
            W2: teamData.women[1] || null,
            W3: teamData.women[2] || null,
          };
          
          // Extract athlete IDs for minimal fetch
          athleteIds = [
            teamData.men[0]?.id,
            teamData.men[1]?.id,
            teamData.men[2]?.id,
            teamData.women[0]?.id,
            teamData.women[1]?.id,
            teamData.women[2]?.id,
          ].filter((id): id is number => id != null);
        }
      }
    } catch (err) {
      console.error('Failed to fetch existing roster:', err);
      // Continue without existing roster
    }

    // Only fetch athletes if we have a roster (for locked view)
    // If no roster yet, pass empty arrays (client will fetch all when editing)
    let athletesData = { men: [], women: [] };
    
    if (existingRoster && athleteIds.length > 0) {
      // Fetch only the specific athletes in the roster using API client
      const athletes = await serverApi.athletes.list({ confirmedOnly: false });
      
      // Filter to only the athletes in the roster
      const rosterAthletes = [...athletes.men, ...athletes.women]
        .filter((a: any) => athleteIds.includes(a.id));
      
      // Organize by gender
      athletesData = {
        men: rosterAthletes.filter((a: any) => a.gender === 'men'),
        women: rosterAthletes.filter((a: any) => a.gender === 'women')
      };
    }

    return {
      props: {
        sessionToken,
        sessionData,
        athletesData, // SSR optimization: 6 athletes if roster exists, empty if no roster (client fetches all on demand)
        gameStateData: {
          rosterLockTime: gameStateData.rosterLockTime || null,
          resultsFinalized: gameStateData.resultsFinalized || false,
          draftComplete: gameStateData.draftComplete || false,
        },
        existingRoster,
        isRosterComplete,
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
        isRosterComplete: false,
      },
    };
  }
}
