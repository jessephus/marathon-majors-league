import React from 'react';
import { useRouter } from 'next/router';
import { useGameState, useSessionState, useCommissionerState } from '@/lib/state-provider';
import { Button, Select, SelectOption } from '@/components/chakra';

// Extend Window interface for app.js globals
declare global {
  interface Window {
    anonymousSession?: {
      token: string | null;
      teamName: string | null;
      playerCode: string | null;
      ownerName: string | null;
      expiresAt: string | null;
    };
    commissionerSession?: {
      isCommissioner: boolean;
      loginTime: string | null;
      expiresAt: string | null;
    };
    handleCommissionerMode?: () => void;
  }
}

interface FooterProps {
  mode?: 'home' | 'commissioner' | 'team' | 'leaderboard' | 'minimal';
  showGameSwitcher?: boolean;
  onLogout?: () => void;
  showCopyright?: boolean;
  className?: string;
}

/**
 * Shared Footer Component
 * 
 * Provides consistent footer across all pages with configurable buttons and game switcher.
 * Uses Phase 3 state manager for centralized game state management.
 * Eliminates code duplication across 5+ pages.
 * 
 * Game Switcher Display Logic:
 * - Shows ONLY when commissionerState.isCommissioner is true
 * - The showGameSwitcher prop is deprecated and no longer affects display
 * 
 * @example
 * // Commissioner page
 * <Footer 
 *   mode="commissioner" 
 *   onLogout={handleLogout}
 * />
 * 
 * @example
 * // Team page
 * <Footer mode="team" />
 * 
 * @example
 * // Leaderboard page
 * <Footer mode="leaderboard" />
 */
export default function Footer({
  mode = 'home',
  showGameSwitcher = false, // Deprecated: no longer used
  onLogout,
  showCopyright = true,
  className = ''
}: FooterProps) {
  const router = useRouter();
  const { gameState, setGameState } = useGameState();
  const { sessionState } = useSessionState();
  const { commissionerState } = useCommissionerState();
  
  // Fix hydration mismatch: only render session-dependent buttons after mount
  const [isMounted, setIsMounted] = React.useState(false);
  
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleGameSwitcherChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newGameId = e.target.value;
    const currentGameId = gameState.gameId || 'default';
    const gameNames: Record<string, string> = {
      'default': 'Default Game',
      'NY2025': 'NY 2025',
      'Valencia-25': 'Valencia 2025',
      'demo-game': 'Demo Game'
    };

    if (newGameId !== currentGameId) {
      if (confirm(`Switch to ${gameNames[newGameId] || newGameId}? This will reload the page.`)) {
        // Update localStorage, cookie, and state manager, then reload
        localStorage.setItem('current_game_id', newGameId);
        
        // Set cookie for SSR pages (prevents hydration mismatch on reload)
        document.cookie = `current_game_id=${newGameId}; path=/; max-age=31536000; SameSite=Lax`;
        
        setGameState({ gameId: newGameId });
        window.location.reload();
      } else {
        // Reset select to current value if user cancels
        e.target.value = currentGameId;
      }
    }
  };

  const gameOptions: SelectOption[] = [
    { value: 'default', label: 'Default Game' },
    { value: 'NY2025', label: 'NY 2025' },
    { value: 'Valencia-25', label: 'Valencia 2025'},
    { value: 'demo-game', label: 'Demo Game' }
  ];

  const handleCopyURL = () => {
    const currentURL = window.location.href;
    navigator.clipboard.writeText(currentURL).then(() => {
      alert('Team URL copied to clipboard! Bookmark this link to return to your team.');
    }).catch(err => {
      console.error('Failed to copy URL:', err);
      // Fallback: show URL in prompt for manual copy
      prompt('Copy this URL to return to your team:', currentURL);
    });
  };

  const handleLogout = () => {
    // Check if we're in a commissioner session or team session
    // Note: We check the raw state here (not the isMounted-guarded version)
    // because this handler is only called from buttons that are already rendered
    const isInCommissionerSession = commissionerState.isCommissioner;
    const isInTeamSession = !!sessionState.token;
    
    // PRIORITY: If both sessions are active, always logout the team session first
    // Only logout commissioner session if it's the only active session
    if (isInTeamSession) {
      // Team session logout (takes priority when both sessions exist)
      if (confirm('Are you sure you want to log out? You will need your unique URL to return to your team.')) {
        console.log('[Footer Logout] Team session logout initiated');
        
        // Clear team session from both sessionStorage and localStorage
        sessionStorage.removeItem('sessionToken');
        sessionStorage.removeItem('teamName');
        sessionStorage.removeItem('playerCode');
        sessionStorage.removeItem('ownerName');
        
        localStorage.removeItem('marathon_fantasy_team');
        
        // Clear anonymous session global (for app.js compatibility)
        if (typeof window !== 'undefined' && window.anonymousSession) {
          window.anonymousSession = { 
            token: null, 
            teamName: null, 
            playerCode: null, 
            ownerName: null, 
            expiresAt: null 
          };
        }
        
        // Dispatch custom event to notify other components
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('sessionsUpdated', {
            detail: { 
              teamSession: null, 
              commissionerSession: window.commissionerSession 
            }
          }));
        }
        
        // Navigate to home - should show commissioner card if still logged in as commissioner
        router.push('/');
      }
    } else if (isInCommissionerSession) {
      // Commissioner logout (only if no team session)
      if (onLogout) {
        // Use the provided logout handler from parent component (e.g., commissioner.tsx)
        onLogout();
      } else {
        // Default commissioner logout behavior
        if (confirm('Are you sure you want to logout from Commissioner mode?')) {
          console.log('[Footer Logout] Commissioner logout initiated');
          
          // Clear all commissioner session keys from localStorage
          localStorage.removeItem('marathon_fantasy_commissioner'); // Primary key
          localStorage.removeItem('commissioner_state'); // Legacy cleanup
          localStorage.removeItem('commissionerLoginTime');
          localStorage.removeItem('commissionerExpiresAt');
          
          // Clear commissioner session global (for app.js compatibility)
          if (typeof window !== 'undefined' && window.commissionerSession) {
            window.commissionerSession = { isCommissioner: false, loginTime: null, expiresAt: null };
          }
          
          // Call logout API to clear the HttpOnly cookie
          fetch('/api/auth/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          }).then(response => {
            if (response.ok) {
              console.log('[Footer Logout] Commissioner cookie cleared via API');
            } else {
              console.warn('[Footer Logout] Failed to clear commissioner cookie via API');
            }
          }).catch(error => {
            console.error('[Footer Logout] Error calling logout API:', error);
          });
          
          // Dispatch custom event to notify other components (like WelcomeCard)
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('sessionsUpdated', {
              detail: { 
                commissionerSession: window.commissionerSession,
                teamSession: window.anonymousSession 
              }
            }));
          }
          
          // Navigate to home - should show commissioner card if still has team session
          router.push('/');
        }
      }
    }
  };

  // Session-aware button rendering
  const renderButtons = () => {
    const buttons = [];

    // Determine if we're in a team session or commissioner session
    // Only check these AFTER component has mounted to avoid hydration mismatch
    const isTeamSession = isMounted && !!sessionState.token;
    const isCommissioner = isMounted && commissionerState.isCommissioner;

    // 1. Home button (always show except in minimal mode)
    if (mode !== 'minimal') {
      buttons.push(
        <Button
          key="home"
          id="home-button"
          variant="outline"
          colorPalette="navy"
          size="sm"
          minW="100px"
          onClick={() => router.push('/')}
        >
          Home
        </Button>
      );
    }

    // 2. Copy URL button (only show when in team session)
    if (isTeamSession && mode === 'team') {
      buttons.push(
        <Button
          key="copy-url"
          id="copy-url-button"
          variant="outline"
          colorPalette="navy"
          size="sm"
          minW="100px"
          onClick={handleCopyURL}
          title="Copy your unique team URL"
        >
          📋 Copy URL
        </Button>
      );
    }

    // 3. Commissioner Mode button
    // Show on all pages EXCEPT commissioner page itself
    // Behavior depends on whether there's an active commissioner session:
    // - If no session: Launch auth modal
    // - If session: Navigate to /commissioner page
    if (mode !== 'commissioner') {
      const handleCommissionerModeClick = () => {
        if (isCommissioner) {
          // Already logged in as commissioner - navigate to commissioner page
          router.push('/commissioner');
        } else {
          // Not logged in - trigger the commissioner auth modal
          // Use the global function from app-bridge.js if available
          if (typeof window !== 'undefined' && window.handleCommissionerMode) {
            window.handleCommissionerMode();
          } else {
            // Fallback: navigate to commissioner page which will show auth modal
            router.push('/commissioner');
          }
        }
      };

      buttons.push(
        <Button
          key="commissioner-mode"
          id="commissioner-mode"
          variant="outline"
          colorPalette="navy"
          size="sm"
          minW="140px"
          onClick={handleCommissionerModeClick}
        >
          Commissioner Mode
        </Button>
      );
    }

    // 4. Game Selector (only show when commissioner OR explicitly requested)
    // This is handled separately below as a <select> element

    // 5. Logout button (show when commissioner OR in team session)
    if (isCommissioner || isTeamSession) {
      buttons.push(
        <Button
          key="logout"
          id="logout-button"
          variant="outline"
          colorPalette="navy"
          size="sm"
          minW="100px"
          onClick={handleLogout}
        >
          Logout
        </Button>
      );
    }

    return buttons.length > 0 ? buttons : null;
  };

  return (
    <footer className={className}>
      <div className="footer-actions">
        {renderButtons()}
        
        {/* Game switcher shows ONLY when commissioner session is active */}
        {/* Guard with isMounted to prevent hydration mismatch */}
        {isMounted && commissionerState.isCommissioner && (
          <div className={`game-switcher visible`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label htmlFor="game-select" style={{ fontSize: '14px', color: '#374151' }}>Game: </label>
            <Select
              id="game-select"
              options={gameOptions}
              value={gameState.gameId || 'default'}
              onChange={handleGameSwitcherChange}
              variant="outline"
              size="sm"
              style={{ minWidth: '150px' }}
            />
          </div>
        )}
      </div>
      
      {showCopyright && (
        <p className="footer-copyright">Marathon Majors League &copy; 2025</p>
      )}
    </footer>
  );
}
