import Head from 'next/head'
import Script from 'next/script'
import { useState, useEffect } from 'react'
import { AppStateProvider } from '../lib/state-provider'
import WelcomeCard from '../components/WelcomeCard'
import TeamCreationModal from '../components/TeamCreationModal'
import CommissionerTOTPModal from '../components/CommissionerTOTPModal'
import Footer from '../components/Footer'
import { detectSessionType, getSessionFromURL, SessionType } from '../lib/session-utils'

export async function getServerSideProps(context) {
  const { req, query } = context;
  
  // Check for session token in URL
  const sessionToken = getSessionFromURL(query);
  
  // Detect session type from cookies (server-side)
  // Note: localStorage is not available server-side, so session detection
  // will be re-run client-side after hydration to check localStorage as well
  const cookies = req.headers.cookie || '';
  const sessionType = detectSessionType(cookies);
  
  return {
    props: {
      serverSessionType: sessionType,
      hasURLSession: !!sessionToken,
    },
  };
}

export default function Home({ serverSessionType, hasURLSession }) {
  const [clientSessionType, setClientSessionType] = useState(serverSessionType);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isCommissionerModalOpen, setIsCommissionerModalOpen] = useState(false);
  
  // Client-side session detection (after hydration)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if there's a session token in the URL
      const urlParams = new URLSearchParams(window.location.search);
      const sessionToken = urlParams.get('session');
      
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
  }, []);

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
            <img src="/images/MMFL-logo.png" alt="MMFL Logo" style={{ width: '60px', height: '60px' }} />
            <h1 style={{ color: '#161C4F', margin: 0 }}>Marathon Majors Fantasy League</h1>
          </div>
          <div className="loading-spinner">Loading your experience...</div>
        </div>
        
        <header>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
            <img src="/images/MMFL-logo.png" alt="MMFL Logo" style={{ width: '50px', height: '50px' }} />
            <h1>Marathon Majors Fantasy League</h1>
          </div>
        </header>
        
        <main id="app">
          {/* Landing Page with new WelcomeCard component */}
          <div id="landing-page" className="page active">
            <WelcomeCard 
              sessionType={clientSessionType} 
              onCreateTeam={handleCreateTeam}
            />
          </div>
        </main>
        
        {/* React Modal Components */}
        <TeamCreationModal 
          isOpen={isTeamModalOpen}
          onClose={() => setIsTeamModalOpen(false)}
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
