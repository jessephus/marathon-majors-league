import Head from 'next/head'
import Script from 'next/script'
import { useState, useEffect } from 'react'
import WelcomeCard from '../components/WelcomeCard'
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
    // Trigger the team creation modal
    const modal = document.getElementById('team-creation-modal');
    if (modal) {
      modal.style.display = 'flex';
    }
  };
  
  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Fantasy NY Marathon</title>
        <meta name="description" content="Turn marathon watching into the ultimate competitive experience! Build your dream team of elite runners within a $30,000 salary cap, then watch them compete for glory." />
        
        {/* Critical CSS for faster first paint */}
        <style dangerouslySetInnerHTML={{ __html: `
          body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
          .container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
          header { background: linear-gradient(135deg, #ff6900 0%, #2C39A2 100%); color: white; padding: 1rem; text-align: center; }
          header h1 { margin: 0; font-size: 2rem; }
          .loading-spinner { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; text-align: center; color: #ff6900; font-size: 16px; font-weight: 600; }
          .loading-spinner::before { content: ''; display: block; width: 40px; height: 40px; margin-bottom: 20px; border: 4px solid rgba(255, 105, 0, 0.2); border-top-color: #ff6900; border-radius: 50%; animation: spin 1s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}} />
        
        {/* Favicons */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://marathonmajorsfantasy.com/" />
        <meta property="og:title" content="Fantasy NY Marathon - Daily Fantasy Marathon League" />
        <meta property="og:description" content="Turn marathon watching into the ultimate competitive experience! Build your dream team of elite runners within a $30,000 salary cap, then watch them compete for glory." />
        <meta property="og:image" content="https://marathonmajorsfantasy.com/images/preview-image.png" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://marathonmajorsfantasy.com/" />
        <meta property="twitter:title" content="Fantasy NY Marathon - Daily Fantasy Marathon League" />
        <meta property="twitter:description" content="Turn marathon watching into the ultimate competitive experience! Build your dream team of elite runners within a $30,000 salary cap, then watch them compete for glory." />
        <meta property="twitter:image" content="https://marathonmajorsfantasy.com/images/preview-image.png" />
      </Head>

      {/* Load app-bridge.js for SSR mode - shared utilities without monolith */}
      <Script src="/app-bridge.js" type="module" strategy="afterInteractive" />
      <Script id="init-ssr-handlers" type="module" strategy="afterInteractive">
        {`
              import { 
                showPage, 
                closeModal,
                openModal,
                setupModalCloseHandlers,
                removeLoadingOverlay,
                handleTeamCreation
              } from '/app-bridge.js';
              
              // Initialize SSR landing page
              async function initSSRLandingPage() {
                // Remove loading overlay after hydration
                removeLoadingOverlay();
                
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
                      
                      // Update session and footer buttons
                      if (typeof window.restoreSession === 'function') {
                        await window.restoreSession();
                        console.log('[SSR] Called window.restoreSession() to update session state');
                      } else {
                        // Fallback: Use app-bridge.js to update session and footer buttons
                        // Initialize sessions from localStorage (which now has the restored session)
                        if (typeof window.initializeSessions === 'function') {
                          window.initializeSessions();
                          console.log('[SSR] Called initializeSessions() after URL session restore');
                        }
                        
                        // Update footer buttons
                        if (typeof window.updateFooterButtons === 'function') {
                          window.updateFooterButtons();
                          console.log('[SSR] Called updateFooterButtons() after URL session restore');
                        }
                        
                        // Initialize game switcher
                        if (typeof window.initializeGameSwitcher === 'function') {
                          window.initializeGameSwitcher();
                          console.log('[SSR] Called initializeGameSwitcher() after URL session restore');
                        }
                      }
                      
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
                
                // Setup modal close handlers
                setupModalCloseHandlers('team-creation-modal', 'close-team-modal', 'cancel-team-creation');
                setupModalCloseHandlers('commissioner-totp-modal', 'close-totp-modal', 'cancel-totp-login');
                
                // Setup team creation form handler
                const teamForm = document.getElementById('team-creation-form');
                if (teamForm) {
                  teamForm.addEventListener('submit', handleTeamCreation);
                }
                
                // Setup commissioner TOTP form handler
                const totpForm = document.getElementById('commissioner-totp-form');
                if (totpForm && typeof window.handleCommissionerTOTPLogin === 'function') {
                  totpForm.addEventListener('submit', window.handleCommissionerTOTPLogin);
                  console.log('[SSR] Attached commissioner TOTP form handler');
                }
                
                // Setup commissioner mode button
                const commissionerModeBtn = document.getElementById('commissioner-mode');
                if (commissionerModeBtn && typeof window.handleCommissionerMode === 'function') {
                  commissionerModeBtn.addEventListener('click', window.handleCommissionerMode);
                  console.log('[SSR] Attached commissioner mode handler');
                }
                
                // Setup home button - navigate to root
                const homeButton = document.getElementById('home-button');
                if (homeButton) {
                  homeButton.addEventListener('click', () => {
                    console.log('[SSR] Home button clicked, navigating to /');
                    window.location.href = '/';
                  });
                }
                
                // Initialize sessions and update footer buttons (for existing sessions from localStorage)
                // This handles the case where user already has a session but didn't come from URL
                if (typeof window.initializeSessions === 'function') {
                  window.initializeSessions();
                  console.log('[SSR] Initialized sessions from localStorage');
                }
                if (typeof window.updateFooterButtons === 'function') {
                  window.updateFooterButtons();
                  console.log('[SSR] Updated footer buttons after initialization');
                }
                
                // Initialize game switcher dropdown (for commissioners)
                if (typeof window.initializeGameSwitcher === 'function') {
                  window.initializeGameSwitcher();
                  console.log('[SSR] Initialized game switcher');
                }
                
                // Note: Loading overlay is hidden by React useEffect in the Home component
                // This ensures it works for both initial page loads and client-side navigations
                
                // Expose functions globally for React components and other scripts
                window.showPage = showPage;
                window.closeModal = closeModal;
                window.openModal = openModal;
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
          <h1 style={{ color: '#ff6900', marginBottom: '20px' }}>🗽 Fantasy NY Marathon</h1>
          <div className="loading-spinner">Loading your experience...</div>
        </div>
        
        <header>
          <h1>🗽 Fantasy NY Marathon</h1>
        </header>
        
        <main id="app">
          {/* Landing Page with new WelcomeCard component */}
          <div id="landing-page" className="page active">
            <WelcomeCard 
              sessionType={clientSessionType} 
              onCreateTeam={handleCreateTeam}
            />
          </div>
          
          {/* Keep all other legacy pages/modals via dangerouslySetInnerHTML */}
          <div dangerouslySetInnerHTML={{ __html: getLegacyPagesHTML() }} />
        </main>
        
        <footer>
          <div className="footer-actions">
            <button id="home-button" className="btn btn-secondary">Home</button>
            <button id="commissioner-mode" className="btn btn-secondary">Commissioner Mode</button>
            <div className="game-switcher">
              <label htmlFor="game-select">Game: </label>
              <select id="game-select" className="game-select">
                <option value="default">Default Game</option>
                <option value="NY2025">NY 2025</option>
                <option value="demo-game">Demo Game</option>
              </select>
            </div>
          </div>
          <p className="footer-copyright">Marathon Majors League &copy; 2025</p>
        </footer>
      </div>
    </>
  )
}

/**
 * Returns all legacy pages and modals (excluding landing page)
 * Note: This function returns ONLY the inner content (modals and pages)
 * It does NOT include <main>, <header>, or <footer> tags
 * Those are provided by the parent function (getMainHTML)
 */
function getLegacyPagesHTML() {
  return `
            <!-- Team Creation Modal -->
            <div id="team-creation-modal" class="modal" style="display: none;">
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <button class="modal-close" id="close-team-modal">&times;</button>
                    <h2>Create Your Team</h2>
                    <p>Enter your team name to get started:</p>
                    <form id="team-creation-form">
                        <div class="form-group">
                            <label for="team-name">Team Name</label>
                            <input type="text" id="team-name" placeholder="e.g., The Fast Finishers" required maxlength="50">
                        </div>
                        <div class="form-group">
                            <label for="team-owner">Your Name (optional)</label>
                            <input type="text" id="team-owner" placeholder="e.g., John Smith" maxlength="50">
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" id="cancel-team-creation">Cancel</button>
                            <button type="submit" class="btn btn-primary">Create Team & Start Drafting</button>
                        </div>
                    </form>
                </div>
            </div>
            
            <!-- Commissioner TOTP Modal -->
            <div id="commissioner-totp-modal" class="modal" style="display: none;">
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <button class="modal-close" id="close-totp-modal">&times;</button>
                    <h2>Commissioner Login</h2>
                    <p>Enter the 6-digit code from your authenticator app:</p>
                    <form id="commissioner-totp-form">
                        <div class="form-group">
                            <label for="totp-code">TOTP Code</label>
                            <input type="text" id="totp-code" placeholder="000000" required pattern="[0-9]{6}" maxlength="6" inputmode="numeric" autocomplete="off">
                            <small>Code changes every 30 seconds</small>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" id="cancel-totp-login">Cancel</button>
                            <button type="submit" class="btn btn-primary">Login</button>
                        </div>
                    </form>
                </div>
            </div>

  `;
}
// Now about those two little stray HTML modals left in index.js. This doesn't seem like a logical place for these modals to live. And I think their associated handlers are maybe in app-bridge.js? Wouldn't it be consistent with the overall migration we are wrapping up to have those modals exist as their own React components and finish cleaning up index.js and app-bridge.js?


// Note: This function previously contained ~800 lines of legacy page HTML for the pre-React SPA
// (salary-cap-draft-page, leaderboard-page, commissioner-page, etc.)
// All of that functionality has been migrated to React pages:
//   - /team/[session].tsx (replaces salary-cap-draft-page)
//   - /leaderboard.tsx (replaces leaderboard-page)  
//   - /commissioner.tsx (replaces commissioner-page)
// The public/app.js and public/salary-cap-draft.js files that navigated to those pages
// have been deleted. Only the modals above remain for landing page interaction.

// Note: getMainHTML() function removed - was dead code never called
// The actual render uses React JSX with getLegacyPagesHTML() injected via dangerouslySetInnerHTML
// See lines 280-350 for the active render implementation
