/**
 * WelcomeCard Component
 * 
 * Landing page welcome card that adapts based on user session state.
 * Server-side rendered with session-aware CTA buttons.
 * 
 * For logged-out users: Shows the new LandingPage component with navy/gold branding
 * For logged-in users: Shows the existing team dashboard card
 * 
 * Props:
 * - sessionType: 'anonymous' | 'team' | 'commissioner'
 * - onCreateTeam: callback for creating a new team
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { SessionType } from '../lib/session-utils';
import { Button } from '@/components/chakra';
import { ArrowRightIcon, PlusIcon } from '@heroicons/react/24/solid';
import LandingPage from './LandingPage';

// Critical CSS for above-the-fold content (inlined for faster first paint)
// Used for logged-in user views (team dashboard card)
// Design colors aligned with CORE_DESIGN_GUIDELINES.md navy/gold palette
const criticalStyles = {
  card: {
    background: '#fff',
    borderRadius: '10px',
    padding: '40px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
    maxWidth: '500px',
    margin: '0 auto',
  },
  cardMultiple: {
    background: '#fff',
    borderRadius: '10px',
    padding: '40px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
    maxWidth: '600px',
    margin: '0 auto',
  },
  heading: {
    color: '#161C4F', // Navy from design guidelines
    marginBottom: '15px',
    fontSize: '1.875rem',
    fontWeight: 'bold',
  },
  description: {
    color: '#666',
    marginBottom: '30px',
    fontSize: '1rem',
    lineHeight: '1.6',
  },
  section: {
    marginBottom: '20px',
    padding: '30px',
    background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(22, 28, 79, 0.08) 100%)', // Gold to Navy gradient
    borderRadius: '12px',
    border: '2px solid #D4AF37', // Gold border
    textAlign: 'center',
  },
  sectionHeading: {
    color: '#161C4F', // Navy
    marginBottom: '10px',
    fontSize: '1.4rem',
    fontWeight: '600',
  },
  sectionText: {
    color: '#333',
    marginBottom: '20px',
    fontSize: '1rem',
  },
};

export default function WelcomeCard({ sessionType = SessionType.ANONYMOUS, onCreateTeam }) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [hasTeamSession, setHasTeamSession] = useState(false);
  const [hasCommissionerSession, setHasCommissionerSession] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamData, setTeamData] = useState(null);
  const [loadingTeamData, setLoadingTeamData] = useState(false);
  const [renderKey, setRenderKey] = useState(0); // Force re-render when sessions change

  // Fetch team data from API
  const fetchTeamData = async (sessionToken) => {
    if (loadingTeamData) return; // Prevent duplicate requests
    
    setLoadingTeamData(true);
    try {
      const response = await fetch('/api/session/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: sessionToken }) // API expects 'token', not 'sessionToken'
      });
      const data = await response.json();
      
      if (data.valid && data.session) {
        // Fetch roster data
        const rosterResponse = await fetch(`/api/salary-cap-draft?gameId=${data.session.gameId || 'default'}&sessionToken=${sessionToken}`);
        const rosterData = await rosterResponse.json();
        
        console.log('[WelcomeCard] Full roster data:', rosterData);
        console.log('[WelcomeCard] Session playerCode:', data.session.playerCode);
        
        // API returns all teams as object with playerCode keys
        // Find the team that matches this session's playerCode
        const myTeam = rosterData[data.session.playerCode];
        console.log('[WelcomeCard] My team:', myTeam);
        
        if (myTeam) {
          // Combine men and women arrays to get total roster
          const roster = [...(myTeam.men || []), ...(myTeam.women || [])];
          const totalSalary = roster.reduce((sum, athlete) => sum + (athlete.salary || 0), 0);
          
          console.log('[WelcomeCard] Roster count:', roster.length);
          console.log('[WelcomeCard] Total salary:', totalSalary);
          console.log('[WelcomeCard] isComplete:', myTeam.isComplete);
          
          const fetchedTeamName = data.session.displayName || data.session.teamName;
          setTeamData({
            teamName: fetchedTeamName,
            gameId: data.session.gameId || 'default',
            rosterCount: roster.length,
            totalSalary: totalSalary,
            isDraftComplete: myTeam.isComplete || false, // Use database flag instead of roster.length === 6
          });
          
          // Update the teamName state so it displays correctly
          setTeamName(fetchedTeamName);
        }
      }
    } catch (error) {
      console.error('[WelcomeCard] Error fetching team data:', error);
    } finally {
      setLoadingTeamData(false);
    }
  };

  // Check for both sessions on component mount (client-side)
  useEffect(() => {
    const checkSessions = () => {
      if (typeof window !== 'undefined') {
        // Initialize window objects from storage if they don't exist
        if (!window.anonymousSession) {
          // Try to restore from localStorage
          const storedSession = localStorage.getItem('marathon_fantasy_team');
          if (storedSession) {
            try {
              const parsed = JSON.parse(storedSession);
              window.anonymousSession = {
                token: parsed.token,
                displayName: parsed.displayName,
                teamName: parsed.displayName, // Alias for compatibility
                playerCode: parsed.playerCode,
                ownerName: parsed.ownerName,
                expiresAt: parsed.expiresAt
              };
            } catch (e) {
              console.error('[WelcomeCard] Failed to parse stored session:', e);
              window.anonymousSession = { token: null };
            }
          } else {
            window.anonymousSession = { token: null };
          }
        }
        
        if (!window.commissionerSession) {
          // Try to restore from cookie
          const cookies = document.cookie.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=');
            acc[key] = value;
            return acc;
          }, {});
          
          if (cookies.commissioner_token) {
            window.commissionerSession = {
              isCommissioner: true,
              token: cookies.commissioner_token,
              loginTime: Date.now(),
              expiresAt: null // Cookie expiry is handled server-side
            };
          } else {
            window.commissionerSession = { isCommissioner: false };
          }
        }
        
        const anonymousSession = window.anonymousSession;
        const commissionerSession = window.commissionerSession;
        
        // Check for truthy token (not just truthy object)
        const hasTeam = !!(anonymousSession && anonymousSession.token);
        const hasCommissioner = !!(commissionerSession && commissionerSession.isCommissioner);
        
        console.log('[WelcomeCard] Session check:', { 
          hasTeam, 
          hasCommissioner, 
          anonymousSession, 
          commissionerSession,
          sessionType 
        });
        
        setHasTeamSession(hasTeam);
        setHasCommissionerSession(hasCommissioner);
        
        // Get team name from session
        if (hasTeam) {
          if (anonymousSession.displayName) {
            setTeamName(anonymousSession.displayName);
          }
          // Fetch team data if we have a team session and haven't fetched yet
          if (anonymousSession.token && !teamData && !loadingTeamData) {
            console.log('[WelcomeCard] Fetching team data for token:', anonymousSession.token);
            fetchTeamData(anonymousSession.token);
          }
        } else {
          setTeamName(''); // Clear team name if no session
        }
        
        // Force re-render
        setRenderKey(prev => prev + 1);
      }
    };

    checkSessions();
    
    // Listen for session updates from app-bridge.js
    const handleSessionsUpdated = (event) => {
      console.log('[WelcomeCard] Received sessionsUpdated event:', event.detail);
      checkSessions();
    };
    
    window.addEventListener('sessionsUpdated', handleSessionsUpdated);
    
    return () => {
      window.removeEventListener('sessionsUpdated', handleSessionsUpdated);
    };
  }, []); // Empty dependency array - only run once on mount
  
  // Also re-check when sessionType prop changes (in case sessions load later)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const anonymousSession = window.anonymousSession;
      const commissionerSession = window.commissionerSession;
      
      // Check for truthy token (not just truthy object)
      const hasTeam = !!(anonymousSession && anonymousSession.token);
      const hasCommissioner = !!(commissionerSession && commissionerSession.isCommissioner);
      
      // console.log('[WelcomeCard] Session check on sessionType change:', { 
      //   hasTeam, 
      //   hasCommissioner,
      //   sessionType 
      // });
      
      setHasTeamSession(hasTeam);
      setHasCommissionerSession(hasCommissioner);
      
      if (hasTeam) {
        if (anonymousSession.displayName) {
          setTeamName(anonymousSession.displayName);
        }
        // Fetch team data if we have a team session
        if (anonymousSession.token && !teamData) {
          console.log('[WelcomeCard] Fetching team data on sessionType change for token:', anonymousSession.token);
          fetchTeamData(anonymousSession.token);
        }
      } else {
        setTeamName(''); // Clear team name if no session
      }
      
      setRenderKey(prev => prev + 1);
    }
  }, [sessionType, teamData]); // Re-run when sessionType changes or teamData is fetched

  
  // Session-aware content rendering - simplified to only handle team sessions
  // Commissioner mode is always accessible via the Footer button
  const renderContent = () => {
    console.log('[WelcomeCard] renderContent called with:', { 
      hasTeamSession, 
      hasCommissionerSession, 
      teamName,
      renderKey
    });
    
    // Team session active - show "View My Team" with enhanced details
    if (hasTeamSession) {
      console.log('[WelcomeCard] Rendering TEAM card');
      
      const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
      };
      
      const budgetRemaining = 30000 - (teamData?.totalSalary || 0);
      const budgetPercentUsed = ((teamData?.totalSalary || 0) / 30000) * 100;
      
      return (
        <div style={criticalStyles.card}>
          <h2 style={criticalStyles.heading}>Welcome Back!</h2>
          <p style={{...criticalStyles.description, fontSize: '1.2rem', fontWeight: '600', color: '#333'}}>
            {teamName || 'Your Fantasy Marathon Team'}
          </p>
          
          {/* Team Stats Grid */}
          {teamData && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '15px',
              marginBottom: '25px',
              padding: '20px',
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(22, 28, 79, 0.05) 100%)',
              borderRadius: '10px',
              border: '1px solid rgba(212, 175, 55, 0.2)'
            }}>
              <div style={{textAlign: 'center', padding: '10px'}}>
                <div style={{fontSize: '0.85rem', color: '#666', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Roster</div>
                <div style={{fontSize: '1.8rem', fontWeight: 'bold', color: teamData.isDraftComplete ? '#16A34A' : '#D4AF37'}}>
                  {teamData.rosterCount}/6
                </div>
                <div style={{fontSize: '0.75rem', color: teamData.isDraftComplete ? '#16A34A' : '#999'}}>
                  {teamData.isDraftComplete ? '✓ Complete' : 'In Progress'}
                </div>
              </div>
              
              <div style={{textAlign: 'center', padding: '10px'}}>
                <div style={{fontSize: '0.85rem', color: '#666', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Salary Used</div>
                <div style={{fontSize: '1.8rem', fontWeight: 'bold', color: budgetPercentUsed > 95 ? '#16A34A' : '#161C4F'}}>
                  {formatCurrency(teamData.totalSalary)}
                </div>
                <div style={{fontSize: '0.75rem', color: '#999'}}>
                  {formatCurrency(budgetRemaining)} left
                </div>
              </div>
            </div>
          )}
          
          {/* Loading state */}
          {!teamData && loadingTeamData && (
            <div style={{padding: '20px', color: '#999', fontSize: '0.9rem'}}>
              Loading team details...
            </div>
          )}
          
          {/* Budget progress bar */}
          {teamData && (
            <div style={{marginBottom: '25px'}}>
              <div style={{
                height: '8px',
                background: '#e9ecef',
                borderRadius: '10px',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{
                  height: '100%',
                  width: `${budgetPercentUsed}%`,
                  background: budgetPercentUsed > 95 ? 'linear-gradient(90deg, #16A34A 0%, #22C55E 100%)' : 'linear-gradient(90deg, #D4AF37 0%, #161C4F 100%)',
                  transition: 'width 0.3s ease',
                  borderRadius: '10px'
                }} />
              </div>
              <div style={{fontSize: '0.75rem', color: '#666', marginTop: '5px', textAlign: 'right'}}>
                {budgetPercentUsed.toFixed(0)}% of $30,000 budget used
              </div>
            </div>
          )}
          
          <div style={criticalStyles.section}>
            <Button 
              data-session-cta
              colorPalette="primary"
              size="md"
              width="auto"
              maxWidth="100%"
              rightIcon={<ArrowRightIcon style={{ width: '16px', height: '16px' }} />}
              onClick={() => {
                // Navigate to new React-based team session page
                if (typeof window !== 'undefined' && window.anonymousSession?.token) {
                  router.push(`/team/${window.anonymousSession.token}`);
                }
              }}
            >
              {teamData?.isDraftComplete ? 'View My Team' : 'Continue'}
            </Button>
          </div>
        </div>
      );
    }

    // No team session - show new LandingPage with navy/gold branding
    // The landing page fetches the active race from the API for the countdown timer
    console.log('[WelcomeCard] Rendering LANDING PAGE');
    return (
      <LandingPage 
        onGetStarted={onCreateTeam}
      />
    );
  };
  
  // Render directly - the renderContent function handles the layout
  return renderContent();
}
