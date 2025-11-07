import Head from 'next/head'
import Script from 'next/script'
import { useState, useEffect } from 'react'
import WelcomeCard from '../components/WelcomeCard'
import { detectSessionType, getSessionFromURL, SessionType } from '../lib/session-utils'

// Feature flag for new SSR WelcomeCard component
const USE_NEW_WELCOME_CARD = process.env.NEXT_PUBLIC_USE_NEW_WELCOME_CARD === 'true';

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
  
  const handleCreateTeam = () => {
    // Trigger the team creation modal (compatibility with existing app.js)
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
          header { background: linear-gradient(135deg, #ff6900 0%, #e05500 100%); color: white; padding: 1rem; text-align: center; }
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
        
        <link rel="stylesheet" href="/style.css" />
      </Head>

      {/* External scripts */}
      <Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js" strategy="beforeInteractive" />
      
      {/* Load app.js only in legacy mode - it expects specific DOM structure */}
      {!USE_NEW_WELCOME_CARD && <Script src="/app.js" strategy="afterInteractive" />}
      
      {/* Always load salary-cap-draft.js */}
      <Script src="/salary-cap-draft.js" strategy="afterInteractive" />

      {/* Load app-bridge.js for SSR mode - shared utilities without monolith */}
      {USE_NEW_WELCOME_CARD && (
        <>
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
                      
                      // Trigger app.js to reload the session from localStorage
                      // This will update anonymousSession and footer buttons
                      if (typeof window.restoreSession === 'function') {
                        await window.restoreSession();
                        console.log('[SSR] Called window.restoreSession() to update app.js state');
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
        </>
      )}

      {/* Conditionally render new WelcomeCard component or legacy HTML */}
      {USE_NEW_WELCOME_CARD ? (
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
                  <option value="demo-game">Demo Game</option>
                </select>
              </div>
            </div>
            <p className="footer-copyright">Marathon Majors League &copy; 2025</p>
          </footer>
        </div>
      ) : (
        <div dangerouslySetInnerHTML={{ __html: getMainHTML() }} />
      )}
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

            <!-- Ranking Page -->
            <div id="ranking-page" class="page">
                <div class="player-info">
                    <h2>Welcome, <span id="player-name"></span>!</h2>
                    <p>Rank all athletes by dragging rows or editing rank numbers. Your top 10 will be selected for the draft.</p>
                </div>

                <div class="athlete-selection">
                    <div class="athlete-selection-header">
                        <h3>Rank Athletes</h3>
                    </div>
                    <div class="tabs">
                        <button class="tab active" data-gender="men">Men</button>
                        <button class="tab" data-gender="women">Women</button>
                    </div>
                    <div id="athlete-table-container" class="athlete-table-container">
                        <table id="athlete-table" class="athlete-table">
                            <thead>
                                <tr>
                                    <th class="drag-handle-header"></th>
                                    <th class="rank-column">Rank</th>
                                    <th>Name</th>
                                    <th>Country</th>
                                    <th>PB</th>
                                    <th>Season Best</th>
                                    <th>Marathon Rank</th>
                                    <th>Overall Rank</th>
                                    <th>Age</th>
                                </tr>
                            </thead>
                            <tbody id="athlete-table-body">
                            </tbody>
                        </table>
                    </div>
                </div>

                <button id="submit-rankings" class="btn btn-primary">Submit Rankings</button>
            </div>

            <!-- Salary Cap Draft Page -->
            <div id="salary-cap-draft-page" class="page">
                <!-- Header with Team Info and Budget -->
                <div class="draft-header">
                    <div class="team-info">
                        <div class="team-avatar-placeholder">
                            <!-- Avatar will go here eventually -->
                            <div class="avatar-circle">
                                <span class="avatar-initials" id="team-avatar-initials"></span>
                            </div>
                        </div>
                        <div class="team-name-display">
                            <div class="team-name-label">Team</div>
                            <div class="team-name-value" id="header-team-name">Your Team</div>
                        </div>
                    </div>
                    <div class="draft-budget-compact">
                        <div class="budget-metric">
                            <span class="metric-label">Cap</span>
                            <span class="metric-value">$30K</span>
                        </div>
                        <div class="budget-metric">
                            <span class="metric-label">Spent</span>
                            <span class="metric-value" id="header-budget-spent">$0</span>
                        </div>
                        <div class="budget-metric">
                            <span class="metric-label">Left</span>
                            <span class="metric-value budget-remaining" id="header-budget-remaining">$30K</span>
                        </div>
                    </div>
                </div>

                <!-- Six Slot Boxes -->
                <div class="draft-slots-container">
                    <div class="draft-slot empty" data-slot="M1" data-gender="men" data-index="0">
                        <div class="slot-label">M1</div>
                        <div class="slot-content">
                            <div class="slot-placeholder">Tap to select</div>
                        </div>
                    </div>
                    
                    <div class="draft-slot empty" data-slot="M2" data-gender="men" data-index="1">
                        <div class="slot-label">M2</div>
                        <div class="slot-content">
                            <div class="slot-placeholder">Tap to select</div>
                        </div>
                    </div>
                    
                    <div class="draft-slot empty" data-slot="M3" data-gender="men" data-index="2">
                        <div class="slot-label">M3</div>
                        <div class="slot-content">
                            <div class="slot-placeholder">Tap to select</div>
                        </div>
                    </div>
                    
                    <div class="draft-slot empty" data-slot="W1" data-gender="women" data-index="0">
                        <div class="slot-label">W1</div>
                        <div class="slot-content">
                            <div class="slot-placeholder">Tap to select</div>
                        </div>
                    </div>
                    
                    <div class="draft-slot empty" data-slot="W2" data-gender="women" data-index="1">
                        <div class="slot-label">W2</div>
                        <div class="slot-content">
                            <div class="slot-placeholder">Tap to select</div>
                        </div>
                    </div>
                    
                    <div class="draft-slot empty" data-slot="W3" data-gender="women" data-index="2">
                        <div class="slot-label">W3</div>
                        <div class="slot-content">
                            <div class="slot-placeholder">Tap to select</div>
                        </div>
                    </div>
                </div>

                <!-- Roster Lock Time Notice (shown if lock time is set) -->
                <div id="roster-lock-notice" class="info-notice" style="display: none; margin: 16px 0;">
                    <strong>⏰ Roster Lock:</strong> <span id="roster-lock-time-display"></span>
                </div>

                <!-- Submit Button -->
                <div class="draft-submit-container">
                    <button id="submit-salary-cap-team" class="btn btn-primary btn-large" disabled>Submit Team</button>
                    <button id="view-game-recap-btn" class="btn btn-primary btn-large" style="display: none;">🎉 View Game Recap</button>
                    <button id="edit-salary-cap-team" class="btn btn-secondary btn-large" onclick="unlockRoster()" style="display: none; margin-left: 12px;">Edit Roster</button>
                </div>

                <!-- Navigation Buttons (shown after roster is locked) -->
                <div id="roster-navigation" class="page-actions" style="display: none; margin-top: 20px;">
                    <button id="view-leaderboard-from-roster" class="btn btn-primary">View Leaderboard</button>
                </div>

                <!-- Athlete Selection Modal (slides in from right) -->
                <div id="athlete-selection-modal" class="selection-modal">
                    <div class="modal-header">
                        <button class="modal-back-btn" id="close-selection-modal">
                            <span class="back-arrow">←</span>
                        </button>
                        <h3 id="selection-modal-title">Select Athlete</h3>
                    </div>
                    
                    <div class="modal-sort-tabs">
                        <button class="sort-tab active" data-sort="salary">Salary</button>
                        <button class="sort-tab" data-sort="pb">PB</button>
                        <button class="sort-tab" data-sort="rank">Rank</button>
                    </div>
                    
                    <div class="modal-athlete-list" id="modal-athlete-list">
                        <!-- Populated by JavaScript -->
                    </div>
                </div>

                <!-- Athlete Detail Modal (full featured modal) -->
                <div id="athlete-detail-modal" class="modal">
                    <div class="modal-overlay" onclick="closeDetailModal()"></div>
                    <div class="athlete-card-container detail-athlete-card" onclick="event.stopPropagation()">
                        <button class="modal-close" aria-label="Close" id="close-detail-modal">&times;</button>
                        
                        <div id="detail-card-masthead" class="card-masthead">
                            <div class="masthead-content">
                                <div class="masthead-photo-section">
                                    <div class="masthead-photo-wrapper">
                                        <img id="detail-modal-athlete-photo" src="" alt="Athlete photo" class="masthead-photo">
                                        <div class="masthead-flag">
                                            <span id="detail-modal-athlete-country" class="flag-emoji"></span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="masthead-bio-section">
                                    <h2 id="detail-modal-athlete-name" class="athlete-name"></h2>
                                    <div class="bio-details">
                                        <div class="bio-item">
                                            <span id="detail-modal-athlete-gender" class="bio-value"></span>
                                        </div>
                                        <div class="bio-item">
                                            <span id="detail-modal-athlete-age" class="bio-value"></span>
                                        </div>
                                    </div>
                                    <div class="masthead-stats-grid">
                                        <div class="masthead-stat">
                                            <div class="masthead-stat-label">Marathon Rank</div>
                                            <div id="detail-modal-athlete-marathon-rank" class="masthead-stat-value"></div>
                                        </div>
                                        <div class="masthead-stat">
                                            <div class="masthead-stat-label">Personal Best</div>
                                            <div id="detail-modal-athlete-pb" class="masthead-stat-value"></div>
                                        </div>
                                        <div class="masthead-stat">
                                            <div class="masthead-stat-label">Salary</div>
                                            <div id="detail-modal-athlete-salary" class="masthead-stat-value"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="tabs-container">
                            <nav class="tabs-nav">
                                <button class="tab-button active" data-tab="detail-overview">Overview</button>
                                <button class="tab-button" data-tab="detail-results">Race Log</button>
                                <button class="tab-button" data-tab="detail-progression">Progression</button>
                                <button class="tab-button" data-tab="detail-news">News</button>
                            </nav>
                        </div>

                        <div class="tab-content-container">
                            <div id="tab-detail-overview" class="tab-panel active">
                                <div class="overview-section">
                                    <h3 class="section-title">Key Statistics</h3>
                                    <div class="stats-grid">
                                        <div class="stat-card">
                                            <div class="stat-label">Personal Best</div>
                                            <div id="detail-overview-pb" class="stat-value-large"></div>
                                        </div>
                                        <div class="stat-card">
                                            <div class="stat-label">Season Best</div>
                                            <div id="detail-modal-athlete-sb" class="stat-value-large"></div>
                                        </div>
                                        <div class="stat-card">
                                            <div class="stat-label">Marathon Rank</div>
                                            <div id="detail-overview-marathon-rank" class="stat-value-large"></div>
                                        </div>
                                        <div class="stat-card">
                                            <div class="stat-label">Overall Rank</div>
                                            <div id="detail-modal-athlete-overall-rank" class="stat-value-large"></div>
                                        </div>
                                    </div>
                                </div>

                                <div class="overview-section">
                                    <h3 class="section-title">Profile Information</h3>
                                    <div class="profile-grid">
                                        <div class="profile-row">
                                            <span class="profile-label">Date of Birth</span>
                                            <span id="detail-modal-athlete-dob" class="profile-value">N/A</span>
                                        </div>
                                        <div class="profile-row">
                                            <span class="profile-label">World Athletics ID</span>
                                            <span id="detail-modal-athlete-wa-id" class="profile-value">N/A</span>
                                        </div>
                                        <div class="profile-row">
                                            <span class="profile-label">Road Running Rank</span>
                                            <span id="detail-modal-athlete-road-rank" class="profile-value">N/A</span>
                                        </div>
                                        <div id="detail-modal-athlete-sponsor-section" class="profile-row" style="display: none;">
                                            <span class="profile-label">Sponsor</span>
                                            <span id="detail-modal-athlete-sponsor" class="profile-value">N/A</span>
                                        </div>
                                    </div>
                                </div>

                                <div class="overview-section">
                                    <a id="detail-modal-wa-link" href="#" target="_blank" rel="noopener noreferrer" class="wa-link-button">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                                        </svg>
                                        View Full World Athletics Profile
                                    </a>
                                </div>
                            </div>

                            <div id="tab-detail-results" class="tab-panel">
                                <div class="tab-content-header">
                                    <h3 class="tab-content-title">2025 Race Results</h3>
                                    <div id="detail-results-loading" class="loading-indicator">Loading...</div>
                                </div>
                                <div id="detail-results-list" class="results-list"></div>
                                <div id="detail-results-empty" class="empty-state" style="display: none;">
                                    <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                                    </svg>
                                    <p>No 2025 race results available</p>
                                </div>
                            </div>

                            <div id="tab-detail-progression" class="tab-panel">
                                <div class="tab-content-header">
                                    <h3 id="detail-progression-title" class="tab-content-title">Season's Best: Marathon</h3>
                                    <div id="detail-progression-loading" class="loading-indicator">Loading...</div>
                                </div>
                                <div class="chart-container">
                                    <canvas id="detail-progression-chart-canvas"></canvas>
                                </div>
                                <select id="detail-discipline-selector" class="discipline-selector" style="display: none;">
                                    <option value="Marathon">Marathon</option>
                                </select>
                                <div id="detail-selected-race-info" class="selected-race-info" style="display: none;">
                                    <h4 class="race-info-title">Race Details</h4>
                                    <div id="detail-race-info-content"></div>
                                </div>
                                <div id="detail-progression-empty" class="empty-state" style="display: none;">
                                    <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                    <p>No progression data available</p>
                                </div>
                            </div>

                            <div id="tab-detail-news" class="tab-panel">
                                <div class="tab-content-header">
                                    <h3 class="tab-content-title">Latest News</h3>
                                </div>
                                <div class="empty-state">
                                    <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path>
                                    </svg>
                                    <p>News feed coming soon</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Draft Page -->
            <div id="draft-page" class="page">
                <h2>Draft Results</h2>
                <p class="draft-info">The snake draft has been completed! Here are the teams:</p>
                <div id="draft-results"></div>
                <button id="view-teams" class="btn btn-primary">View Teams</button>
            </div>

            <!-- Teams Page -->
            <div id="teams-page" class="page">
                <h2>Team Rosters</h2>
                <div id="teams-display"></div>
                <div class="page-actions">
                    <button id="view-leaderboard-btn" class="btn btn-primary">View Leaderboard</button>
                    <button id="back-to-landing" class="btn btn-secondary">Back to Home</button>
                </div>
            </div>

            <!-- Leaderboard Page -->
            <div id="leaderboard-page" class="page">
                <h2>Leaderboard</h2>
                
                <!-- Leaderboard Tabs -->
                <div class="leaderboard-tabs">
                    <button class="leaderboard-tab active" data-tab="fantasy">Fantasy Results</button>
                    <button class="leaderboard-tab" data-tab="race">Race Results</button>
                </div>
                
                <!-- Fantasy Results Tab Content (default) -->
                <div id="fantasy-results-tab" class="leaderboard-tab-content active">
                    <div id="leaderboard-display"></div>
                </div>
                
                <!-- Race Results Tab Content -->
                <div id="race-results-tab" class="leaderboard-tab-content">
                    <div class="race-results-controls">
                        <div class="gender-toggle">
                            <button class="gender-toggle-btn active" data-gender="men">Men</button>
                            <button class="gender-toggle-btn" data-gender="women">Women</button>
                        </div>
                        <div class="split-selector">
                            <label for="split-select">Show:</label>
                            <select id="split-select" class="split-select">
                                <option value="finish">Finish Time</option>
                                <option value="5k">5K Split</option>
                                <option value="10k">10K Split</option>
                                <option value="half">Half Marathon</option>
                                <option value="30k">30K Split</option>
                                <option value="35k">35K Split</option>
                                <option value="40k">40K Split</option>
                            </select>
                        </div>
                    </div>
                    <div id="race-results-display"></div>
                </div>
                
                <div class="page-actions">
                    <button id="back-to-roster" class="btn btn-secondary">Back to Roster</button>
                </div>
            </div>

            <!-- Commissioner Page -->
            <div id="commissioner-page" class="page">
                <h2>Commissioner Dashboard</h2>
                <div class="commissioner-actions">
                    <div class="action-card">
                        <h3>Player Links</h3>
                        <div id="player-codes-display"></div>
                        <button id="manage-teams-btn" class="btn btn-primary" style="margin-top: 16px;">Manage Players/Teams</button>
                    </div>

                    <div class="action-card">
                        <h3>Draft Control</h3>
                        <button id="run-draft" class="btn btn-primary">Run Snake Draft</button>
                        <div id="draft-status"></div>
                    </div>

                    <div class="action-card">
                        <h3>Results Management</h3>
                        <button id="manage-results-btn" class="btn btn-primary">Manage Live Results</button>
                        <button id="finalize-results" class="btn btn-success" style="display: none;">Finalize Results & Crown Winner</button>
                        <button id="reset-results" class="btn btn-warning">Reset Live Results</button>
                        <div id="live-standings"></div>
                        <div id="winner-display"></div>
                    </div>

                    <div class="action-card">
                        <h3>Athlete Management</h3>
                        <button id="view-athletes" class="btn btn-primary">View All Athletes</button>
                    </div>

                    <div class="action-card">
                        <h3>Development Tools</h3>
                        <button id="load-demo-data" class="btn btn-primary">🎭 Load Demo Data</button>
                        <p style="font-size: 0.85em; color: #666; margin-top: 10px;">
                            Creates 3 fake teams with rosters and optional results for testing
                        </p>
                    </div>

                    <div class="action-card">
                        <h3>Game State</h3>
                        <button id="reset-game" class="btn btn-danger">Reset Game</button>
                    </div>
                </div>
                <button id="back-from-commissioner" class="btn btn-secondary">Back to Home</button>
            </div>

            <!-- Manage Players/Teams Page -->
            <div id="manage-teams-page" class="page">
                <h2>Manage Players/Teams</h2>
                <p class="page-description">View and manage all players and their team status</p>
                
                <div class="manage-teams-container">
                    <table id="teams-status-table" class="teams-status-table">
                        <thead>
                            <tr>
                                <th>Status</th>
                                <th>Team Name</th>
                                <th>Player Link</th>
                                <th>Rankings</th>
                                <th class="draft-status-column">Draft Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="teams-status-table-body">
                            <!-- Populated by JavaScript -->
                        </tbody>
                    </table>
                </div>
                
                <button id="back-to-commissioner-from-teams" class="btn btn-secondary">Back to Dashboard</button>
            </div>

            <!-- Athlete Management Page -->
            <div id="athlete-management-page" class="page">
                <h2>Athlete Management</h2>
                <p class="page-description">View and manage all athletes in the database</p>
                
                <div class="action-buttons">
                    <button id="add-athlete-btn" class="btn btn-primary">Add New Athlete</button>
                </div>
                
                <div class="athlete-filters">
                    <label>
                        <input type="checkbox" id="filter-confirmed" checked> Show only confirmed for NYC Marathon
                    </label>
                    <label>
                        <input type="checkbox" id="filter-missing-wa-id"> Show only missing World Athletics ID
                    </label>
                    <label>
                        Gender:
                        <select id="filter-gender">
                            <option value="all">All</option>
                            <option value="men">Men</option>
                            <option value="women">Women</option>
                        </select>
                    </label>
                    <label>
                        Sort by:
                        <select id="sort-athletes">
                            <option value="id">ID</option>
                            <option value="name">Name</option>
                            <option value="marathon_rank">Marathon Rank</option>
                            <option value="pb">Personal Best</option>
                        </select>
                    </label>
                </div>
                
                <div id="athlete-management-container"></div>
                
                <button id="back-to-commissioner" class="btn btn-secondary">Back to Dashboard</button>
            </div>

            <!-- Results Management Page -->
            <div id="results-management-page" class="page">
                <h2>Manage Live Results</h2>
                <p class="page-description">View and edit all race results entered so far</p>
                
                <!-- View Selector -->
                <div class="results-view-controls">
                    <label for="results-view-select">Show:</label>
                    <select id="results-view-select" class="view-selector">
                        <option value="finish">Finish Time</option>
                        <option value="5k">5K Split</option>
                        <option value="10k">10K Split</option>
                        <option value="half">Half Marathon Split</option>
                        <option value="30k">30K Split</option>
                        <option value="35k">35K Split</option>
                        <option value="40k">40K Split</option>
                        <option value="bonuses">Bonus Points</option>
                    </select>
                </div>
                
                <div id="results-management-container">
                    <table id="results-table" class="results-table">
                        <thead>
                            <tr>
                                <th>Athlete</th>
                                <th>Country</th>
                                <th>Gender</th>
                                <th id="time-column-header">Finish Time</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="results-table-body">
                            <!-- Populated by JavaScript -->
                        </tbody>
                    </table>
                    <div id="no-results-message" style="display: none; text-align: center; padding: 40px; color: var(--dark-gray);">
                        <p>No results have been entered yet.</p>
                        <p>Results will appear here once you start entering athlete finish times.</p>
                    </div>
                </div>
                
                <div class="results-actions">
                    <button id="add-result-btn" class="btn btn-primary">Add New Result</button>
                    <button id="back-to-commissioner-from-results" class="btn btn-secondary">Back to Dashboard</button>
                </div>
            </div>
            
            <!-- Add Result Modal -->
            <div id="add-result-modal" class="modal" style="display: none;">
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <button class="modal-close" id="add-result-modal-close">&times;</button>
                    <h2>Add New Athlete Result</h2>
                    <p style="color: var(--dark-gray); margin-bottom: 20px;">Select an athlete and enter their result</p>
                    <form id="add-result-form">
                        <div class="form-group">
                            <label for="result-athlete-select">Athlete *</label>
                            <select id="result-athlete-select" required>
                                <option value="">Select athlete...</option>
                                <!-- Populated by JavaScript -->
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="result-finish-time">Finish Time *</label>
                            <input type="text" id="result-finish-time" required placeholder="2:05:30" pattern="[0-9]{1,2}:[0-9]{2}:[0-9]{2}">
                            <small>Format: HH:MM:SS (e.g., 2:05:30)</small>
                        </div>
                        <div class="form-group">
                            <label for="result-split-5k">5K Split</label>
                            <input type="text" id="result-split-5k" placeholder="0:14:30" pattern="[0-9]{1,2}:[0-9]{2}:[0-9]{2}">
                        </div>
                        <div class="form-group">
                            <label for="result-split-10k">10K Split</label>
                            <input type="text" id="result-split-10k" placeholder="0:29:00" pattern="[0-9]{1,2}:[0-9]{2}:[0-9]{2}">
                        </div>
                        <div class="form-group">
                            <label for="result-split-half">Half Marathon Split</label>
                            <input type="text" id="result-split-half" placeholder="1:02:00" pattern="[0-9]{1,2}:[0-9]{2}:[0-9]{2}">
                        </div>
                        <div class="form-group">
                            <label for="result-split-30k">30K Split</label>
                            <input type="text" id="result-split-30k" placeholder="1:28:00" pattern="[0-9]{1,2}:[0-9]{2}:[0-9]{2}">
                        </div>
                        <div class="form-group">
                            <label for="result-split-35k">35K Split</label>
                            <input type="text" id="result-split-35k" placeholder="1:42:00" pattern="[0-9]{1,2}:[0-9]{2}:[0-9]{2}">
                        </div>
                        <div class="form-group">
                            <label for="result-split-40k">40K Split</label>
                            <input type="text" id="result-split-40k" placeholder="1:56:00" pattern="[0-9]{1,2}:[0-9]{2}:[0-9]{2}">
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Add Result</button>
                            <button type="button" class="btn btn-secondary" id="cancel-add-result">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
            
            <!-- Add Athlete Modal -->
            <div id="add-athlete-modal" class="modal" style="display: none;">
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <button class="modal-close" id="add-athlete-modal-close">&times;</button>
                    <h2>Add New Athlete</h2>
                    <form id="add-athlete-form">
                        <div class="form-group">
                            <label for="athlete-name">Name *</label>
                            <input type="text" id="athlete-name" required placeholder="First LAST">
                        </div>
                        <div class="form-group">
                            <label for="athlete-country">Country Code *</label>
                            <input type="text" id="athlete-country" required placeholder="USA" maxlength="3" pattern="[A-Z]{3}">
                        </div>
                        <div class="form-group">
                            <label for="athlete-gender">Gender *</label>
                            <select id="athlete-gender" required>
                                <option value="">Select...</option>
                                <option value="men">Men</option>
                                <option value="women">Women</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="athlete-pb">Personal Best *</label>
                            <input type="text" id="athlete-pb" required placeholder="2:05:30" pattern="[0-9]:[0-9]{2}:[0-9]{2}">
                        </div>
                        <div class="form-group">
                            <label for="athlete-season-best">Season Best</label>
                            <input type="text" id="athlete-season-best" placeholder="2:06:00" pattern="[0-9]:[0-9]{2}:[0-9]{2}">
                        </div>
                        <div class="form-group">
                            <label for="athlete-marathon-rank">Marathon Rank</label>
                            <input type="number" id="athlete-marathon-rank" placeholder="42" min="1">
                        </div>
                        <div class="form-group">
                            <label for="athlete-age">Age</label>
                            <input type="number" id="athlete-age" placeholder="28" min="18" max="60">
                        </div>
                        <div class="form-group">
                            <label for="athlete-sponsor">Sponsor</label>
                            <input type="text" id="athlete-sponsor" placeholder="Nike">
                        </div>
                        <div class="form-group">
                            <label for="athlete-wa-id">World Athletics ID</label>
                            <input type="text" id="athlete-wa-id" placeholder="14208500">
                        </div>
                        <div class="form-group">
                            <label for="athlete-headshot">Headshot URL</label>
                            <input type="url" id="athlete-headshot" placeholder="https://...">
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="athlete-confirm-nyc">
                                Confirm for NYC Marathon
                            </label>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Add Athlete</button>
                            <button type="button" class="btn btn-secondary" id="cancel-add-athlete">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>

        <!-- Athlete Card Modal -->
        <div id="athlete-modal" class="modal">
            <div class="modal-overlay"></div>
            <div class="athlete-card-container">
                <button class="modal-close" aria-label="Close">&times;</button>
                
                <div id="card-masthead" class="card-masthead">
                    <div class="masthead-content">
                        <div class="masthead-photo-section">
                            <div class="masthead-photo-wrapper">
                                <img id="modal-athlete-photo" src="" alt="Athlete photo" class="masthead-photo">
                                <div class="masthead-flag">
                                    <span id="modal-athlete-country" class="flag-emoji"></span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="masthead-bio-section">
                            <h2 id="modal-athlete-name" class="athlete-name"></h2>
                            <div class="bio-details">
                                <div class="bio-item">
                                    <span id="modal-athlete-gender" class="bio-value"></span>
                                </div>
                                <div class="bio-item">
                                    <span id="modal-athlete-age" class="bio-value"></span>
                                </div>
                            </div>
                            <div class="masthead-stats-grid">
                                <div class="masthead-stat">
                                    <div class="masthead-stat-label">Marathon Rank</div>
                                    <div id="modal-athlete-marathon-rank" class="masthead-stat-value"></div>
                                </div>
                                <div class="masthead-stat">
                                    <div class="masthead-stat-label">Personal Best</div>
                                    <div id="modal-athlete-pb" class="masthead-stat-value"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="tabs-container">
                    <nav class="tabs-nav">
                        <button class="tab-button active" data-tab="overview">Overview</button>
                        <button class="tab-button" data-tab="results">Race Log</button>
                        <button class="tab-button" data-tab="progression">Progression</button>
                        <button class="tab-button" data-tab="news">News</button>
                    </nav>
                </div>

                <div class="tab-content-container">
                    <div id="tab-overview" class="tab-panel active">
                        <div class="overview-section">
                            <h3 class="section-title">Key Statistics</h3>
                            <div class="stats-grid">
                                <div class="stat-card">
                                    <div class="stat-label">Personal Best</div>
                                    <div id="overview-pb" class="stat-value-large"></div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-label">Season Best</div>
                                    <div id="modal-athlete-sb" class="stat-value-large"></div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-label">Marathon Rank</div>
                                    <div id="overview-marathon-rank" class="stat-value-large"></div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-label">Overall Rank</div>
                                    <div id="modal-athlete-overall-rank" class="stat-value-large"></div>
                                </div>
                            </div>
                        </div>

                        <div class="overview-section">
                            <h3 class="section-title">Profile Information</h3>
                            <div class="profile-grid">
                                <div class="profile-row">
                                    <span class="profile-label">Date of Birth</span>
                                    <span id="modal-athlete-dob" class="profile-value">N/A</span>
                                </div>
                                <div class="profile-row">
                                    <span class="profile-label">World Athletics ID</span>
                                    <span id="modal-athlete-wa-id" class="profile-value">N/A</span>
                                </div>
                                <div class="profile-row">
                                    <span class="profile-label">Road Running Rank</span>
                                    <span id="modal-athlete-road-rank" class="profile-value">N/A</span>
                                </div>
                                <div id="modal-athlete-sponsor-section" class="profile-row" style="display: none;">
                                    <span class="profile-label">Sponsor</span>
                                    <span id="modal-athlete-sponsor" class="profile-value">N/A</span>
                                </div>
                            </div>
                        </div>

                        <div class="overview-section">
                            <a id="modal-wa-link" href="#" target="_blank" rel="noopener noreferrer" class="wa-link-button">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                                </svg>
                                View Full World Athletics Profile
                            </a>
                        </div>
                    </div>

                    <div id="tab-results" class="tab-panel">
                        <div class="tab-content-header">
                            <h3 class="tab-content-title">2025 Race Results</h3>
                            <div id="results-loading" class="loading-indicator">Loading...</div>
                        </div>
                        <div id="results-list" class="results-list"></div>
                        <div id="results-empty" class="empty-state" style="display: none;">
                            <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                            </svg>
                            <p>No 2025 race results available</p>
                        </div>
                    </div>

                    <div id="tab-progression" class="tab-panel">
                        <div class="tab-content-header">
                            <h3 id="progression-title" class="tab-content-title">Season's Best: Marathon</h3>
                            <div id="progression-loading" class="loading-indicator">Loading...</div>
                        </div>
                        <div class="chart-container">
                            <canvas id="progression-chart-canvas"></canvas>
                        </div>
                        <select id="discipline-selector" class="discipline-selector" style="display: none;">
                            <option value="Marathon">Marathon</option>
                        </select>
                        <div id="selected-race-info" class="selected-race-info" style="display: none;">
                            <h4 class="race-info-title">Race Details</h4>
                            <div id="race-info-content"></div>
                        </div>
                        <div id="progression-empty" class="empty-state" style="display: none;">
                            <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            <p>No progression data available</p>
                        </div>
                    </div>

                    <div id="tab-news" class="tab-panel">
                        <div class="tab-content-header">
                            <h3 class="tab-content-title">Latest News</h3>
                        </div>
                        <div class="empty-state">
                            <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path>
                            </svg>
                            <p>News feed coming soon</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Game Recap Modal -->
        <div id="game-recap-modal" class="modal" style="display: none;">
            <div class="modal-overlay"></div>
            <div class="modal-content" style="max-width: 600px; width: 90%; max-height: 85vh; text-align: center; position: relative; z-index: 1001; margin: auto;">
                <canvas id="confetti-canvas" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1000;"></canvas>
                
                <div style="background: white; padding: 32px 24px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); overflow-y: auto; max-height: 85vh;">
                    <h2 style="font-size: 28px; margin: 0 0 16px 0; color: var(--primary-blue);">
                        Thanks for Playing! 🎉
                    </h2>
                    
                    <div id="recap-placement" style="margin: 20px 0;">
                        <!-- Placement will be inserted here -->
                    </div>
                    
                    <div id="recap-stats" style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <!-- Stats will be inserted here -->
                    </div>
                    
                    <div id="recap-highlights" style="text-align: left; margin: 20px 0;">
                        <!-- Highlights will be inserted here -->
                    </div>
                    
                    <button id="close-recap" class="btn btn-primary" style="margin-top: 20px; padding: 12px 32px; font-size: 16px; width: 100%;">
                        View Final Standings
                    </button>
                </div>
            </div>
        </div>
  `;
}

// Original HTML with landing page (used when feature flag is false)
function getMainHTML() {
  return `
    <div class="container">
        <!-- Initial Loading Overlay -->
        <div id="app-loading-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: #fff; z-index: 9999; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <h1 style="color: #ff6900; margin-bottom: 20px;">🗽 Fantasy NY Marathon</h1>
            <div class="loading-spinner">Loading your experience...</div>
        </div>
        
        <header>
            <h1>🗽 Fantasy NY Marathon</h1>
        </header>

        <main id="app">
            <!-- Landing Page -->
            <div id="landing-page" class="page active">
                <div class="welcome-card">
                    <h2>Welcome to the Fantasy NY Marathon!</h2>
                    <p>Compete with friends by drafting elite marathon runners.</p>
                    
                    <!-- Team Creation for Visitors -->
                    <div class="create-team-section">
                        <h3>🏃‍♂️ Join the Competition</h3>
                        <p>Create your team and draft elite runners - no registration required!</p>
                        <button id="create-team-btn" class="btn btn-primary btn-large">Create a New Team</button>
                    </div>
                </div>
            </div>
            
            ${getLegacyPagesHTML()}
        </main>
        
        <footer>
            <div class="footer-actions">
                <button id="home-button" class="btn btn-secondary">Home</button>
                <button id="commissioner-mode" class="btn btn-secondary">Commissioner Mode</button>
                <div class="game-switcher">
                    <label for="game-select">Game: </label>
                    <select id="game-select" class="game-select">
                        <option value="default">Default Game</option>
                        <option value="demo-game">Demo Game</option>
                    </select>
                </div>
            </div>
            <p class="footer-copyright">Marathon Majors League &copy; 2025</p>
        </footer>
    </div>
  `;
}
