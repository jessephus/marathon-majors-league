import Head from 'next/head'
import Script from 'next/script'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { AppStateProvider } from '../lib/state-provider'
import WelcomeCard from '../components/WelcomeCard'
import TeamCreationModal from '../components/TeamCreationModal'
import CommissionerTOTPModal from '../components/CommissionerTOTPModal'
import Footer from '../components/Footer'
import { detectSessionType, getSessionFromURL, SessionType } from '../lib/session-utils'
import { getCurrentGameId, hasActiveCommissionerSession } from '../lib/session-manager'
import { DEFAULT_GAME_ID } from '../config/constants'

export async function getServerSideProps(context) {
  const { req, query } = context;
  
  // Check for session token in URL
  const sessionToken = getSessionFromURL(query);
  
  // Detect session type from cookies (server-side)
  // Note: localStorage is not available server-side, so session detection
  // will be re-run client-side after hydration to check localStorage as well
  const cookies = req.headers.cookie || '';
  const sessionType = detectSessionType(cookies);
  
  // Get game ID: only honor cookie when a commissioner session is active.
  // Otherwise, force DEFAULT_GAME_ID for regular users.
  let gameId = DEFAULT_GAME_ID;
  const isCommissioner = hasActiveCommissionerSession(cookies);
  if (isCommissioner) {
    const cookieMatch = cookies.match(/current_game_id=([^;]+)/);
    if (cookieMatch) {
      gameId = cookieMatch[1];
    }
  }
  
  // Fetch next active race for the landing page countdown
  // This ensures SSR includes the race data without client-side fetching
  let nextRace = null;
  
  // Only attempt database fetch if DATABASE_URL is set
  // During build time, this may not be available
  if (process.env.DATABASE_URL) {
    try {
      // Dynamic import to avoid build-time errors when DATABASE_URL is not set
      const { getActiveRaces } = await import('./api/db');
      const races = await getActiveRaces();
      if (races && races.length > 0) {
        const now = new Date();
        // Find the next upcoming race with a lock time
        const upcomingRace = races
          .filter(race => race.lockTime && new Date(race.lockTime) > now)
          .sort((a, b) => new Date(a.lockTime).getTime() - new Date(b.lockTime).getTime())[0];
        
        if (upcomingRace) {
          nextRace = {
            name: upcomingRace.name,
            // Serialize date as ISO string for SSR (JSON serialization)
            date: new Date(upcomingRace.lockTime).toISOString(),
          };
        }
      }
    } catch (error) {
      console.error('[SSR] Error fetching active races:', error.message);
      // Fallback to null - component will use its default
    }
  } else {
    console.log('[SSR] DATABASE_URL not set, skipping race fetch');
  }
  
  return {
    props: {
      serverSessionType: sessionType,
      hasURLSession: !!sessionToken,
      initialGameId: gameId,
      nextRace, // Pass race data to client
    },
  };
}

export default function Home({ serverSessionType, hasURLSession, initialGameId, nextRace }) {
  const router = useRouter();
  const [clientSessionType, setClientSessionType] = useState(serverSessionType);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isCommissionerModalOpen, setIsCommissionerModalOpen] = useState(false);
  // Initialize with SSR game ID (from cookie) to ensure correct game context
  const [gameId, setGameId] = useState(initialGameId || DEFAULT_GAME_ID);
  
  // Handle action query parameter (works for both initial load and client-side navigation)
  useEffect(() => {
    const handleActionParam = () => {
      const action = router.query.action;
      
      if (action === 'create-team') {
        // Small delay to ensure modal renders after page is ready
        setTimeout(() => {
          setIsTeamModalOpen(true);
        }, 100);
        
        // Clean up URL without reloading
        router.replace('/', undefined, { shallow: true });
      }
    };
    
    // Check on mount and whenever query changes
    if (router.isReady) {
      handleActionParam();
    }
  }, [router.isReady, router.query.action]);
  
  // Client-side session detection (after hydration)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Get current game ID from localStorage (commissioner context)
      // For regular users, this should be empty (cleared on logout)
      // and we'll keep using the SSR initialGameId (DEFAULT_GAME_ID)
      const currentGameId = getCurrentGameId();
      
      // Only update gameId from localStorage when the client is truly in commissioner mode.
      // Regular users must continue to use the SSR initialGameId (DEFAULT_GAME_ID).
      if (clientSessionType === SessionType.COMMISSIONER && currentGameId && currentGameId !== DEFAULT_GAME_ID) {
        setGameId(currentGameId);
      }
      
      // Check if there's a session token in the URL
      const sessionToken = router.query.session;
      
      if (sessionToken) {
        // URL session will be handled by initSSRLandingPage() in the Script tag
        // Just update the UI state for now
        setClientSessionType(SessionType.TEAM);
      } else {
        // Regular session detection from cookies/localStorage
        const detected = detectSessionType(document.cookie);
        setClientSessionType(detected);
      }
    }
  }, [router.query.session]);

  // Hide loading overlay on component mount (handles both initial load and client-side navigation)
  useEffect(() => {
    const loadingOverlay = document.getElementById('app-loading-overlay');
    if (loadingOverlay) {
      // Small delay to ensure smooth transition
      setTimeout(() => {
        loadingOverlay.style.display = 'none';
        console.log('[React] Loading overlay hidden on mount');
      }, 100);
    }
  }, []);
  
  const handleCreateTeam = () => {
    setIsTeamModalOpen(true);
  };
  
  const handleCommissionerMode = () => {
    setIsCommissionerModalOpen(true);
  };
  
  return (
    <AppStateProvider>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Marathon Majors Fantasy League</title>
        <meta name="description" content="Turn marathon watching into the ultimate competitive experience! Build your dream team of elite runners within a $30,000 salary cap, then watch them compete for glory." />
        
        {/* Critical CSS for faster first paint */}
        <style dangerouslySetInnerHTML={{ __html: `
          body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
          .container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
          header { background: linear-gradient(135deg, var(--dark-gray) 0%, var(--primary-blue) 100%); color: white; padding: 1rem; text-align: center; }
          header h1 { margin: 0; font-size: 2rem; }
          .loading-spinner { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; text-align: center; color: #D4AF37; font-size: 16px; font-weight: 600; }
          .loading-spinner::before { content: ''; display: block; width: 40px; height: 40px; margin-bottom: 20px; border: 4px solid rgba(212, 175, 55, 0.2); border-top-color: #D4AF37; border-radius: 50%; animation: spin 1s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://marathonmajorsfantasy.com/" />
        <meta property="og:title" content="Marathon Majors Fantasy League - Daily Fantasy Marathon League" />
        <meta property="og:description" content="Turn marathon watching into the ultimate competitive experience! Build your dream team of elite runners within a $30,000 salary cap, then watch them compete for glory." />
        <meta property="og:image" content="https://marathonmajorsfantasy.com/images/preview-image.png" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://marathonmajorsfantasy.com/" />
        <meta property="twitter:title" content="Marathon Majors Fantasy League - Daily Fantasy Marathon League" />
        <meta property="twitter:description" content="Turn marathon watching into the ultimate competitive experience! Build your dream team of elite runners within a $30,000 salary cap, then watch them compete for glory." />
        <meta property="twitter:image" content="https://marathonmajorsfantasy.com/images/preview-image.png" />
      </Head>

      {/* Inline utilities - no external dependencies needed */}
      <Script id="init-ssr-handlers" type="module" strategy="afterInteractive">
        {`
              // ============================================================================
              // INLINE UTILITIES (no external dependencies)
              // ============================================================================
              
              // ============================================================================
              // INITIALIZATION
              // ============================================================================
              
              // Initialize SSR landing page - handles URL-based session restoration
              async function initSSRLandingPage() {
                
                // Restore session from URL if present (for ?session=TOKEN links)
                const urlParams = new URLSearchParams(window.location.search);
                const sessionToken = urlParams.get('session');
                const gameId = urlParams.get('game');
                
                if (sessionToken) {
                  // Session in URL - validate and restore it (overwrite existing if present)
                  console.log('[SSR] Validating and restoring session from URL');
                  
                  // Show loading state on the CTA button
                  const ctaButton = document.querySelector('[data-session-cta]');
                  if (ctaButton) {
                    ctaButton.disabled = true;
                    ctaButton.textContent = 'Restoring session...';
                  }
                  
                  try {
                    // Validate the session with the server
                    const response = await fetch('/api/session/validate', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ token: sessionToken })
                    });
                    
                    const data = await response.json();
                    
                    if (data.valid && data.session) {
                      // Store the validated session with full details
                      const sessionData = {
                        token: data.session.sessionToken,
                        expiresAt: data.session.expiresAt,
                        sessionType: data.session.sessionType,
                        displayName: data.session.displayName,
                        gameId: data.session.gameId,
                        playerCode: data.session.playerCode
                      };
                      
                      localStorage.setItem('marathon_fantasy_team', JSON.stringify(sessionData));
                      
                      if (data.session.gameId) {
                        localStorage.setItem('current_game_id', data.session.gameId);
                      }
                      
                      console.log('[SSR] Session restored from URL:', data.session.displayName);
                      
                      // Re-enable button and update text
                      if (ctaButton) {
                        ctaButton.disabled = false;
                        ctaButton.textContent = 'View My Team';
                      }
                    } else {
                      console.warn('[SSR] Session token from URL is invalid or expired');
                      
                      // Show error state
                      if (ctaButton) {
                        ctaButton.disabled = false;
                        ctaButton.textContent = 'Session expired - Create New Team';
                      }
                    }
                  } catch (error) {
                    console.error('[SSR] Failed to validate session:', error);
                    
                    // Show error state
                    if (ctaButton) {
                      ctaButton.disabled = false;
                      ctaButton.textContent = 'Error - Create New Team';
                    }
                  }
                }
                
                // Note: Modal handlers and footer are now managed by React components
                // Footer.tsx handles all button logic and session awareness
                // Loading overlay is hidden by React useEffect in the Home component (lines 56-65)
              }
              
              // Run when DOM is ready
              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initSSRLandingPage);
              } else {
                initSSRLandingPage();
              }
            `}
          </Script>

      <div className="container">
        {/* Initial Loading Overlay */}
        <div id="app-loading-overlay" style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: '#fff', 
          zIndex: 9999, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
            <img src="/assets/mmfl-logo.png" alt="MMFL Logo" style={{ width: '60px', height: '60px' }} />
            <h1 style={{ color: '#161C4F', margin: 0 }}>Marathon Majors Fantasy League</h1>
          </div>
          <div className="loading-spinner">Loading your experience...</div>
        </div>
        
        <main id="app">
          {/* Landing Page with new WelcomeCard component */}
          <div id="landing-page" className="page active">
            <WelcomeCard 
              sessionType={clientSessionType} 
              onCreateTeam={handleCreateTeam}
              nextRace={nextRace}
            />
          </div>
        </main>
        
        {/* React Modal Components */}
        <TeamCreationModal 
          isOpen={isTeamModalOpen}
          onClose={() => setIsTeamModalOpen(false)}
          gameId={gameId}
        />
        <CommissionerTOTPModal 
          isOpen={isCommissionerModalOpen}
          onClose={() => setIsCommissionerModalOpen(false)}
        />
        
        {/* React Footer Component - replaces static HTML footer */}
        <Footer mode="home" />
      </div>
    </AppStateProvider>
  )
}
