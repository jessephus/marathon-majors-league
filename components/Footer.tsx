import React from 'react';
import { useRouter } from 'next/router';
import { useGameState, useSessionState, useCommissionerState } from '@/lib/state-provider';

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
 * @example
 * // Commissioner page
 * <Footer 
 *   mode="commissioner" 
 *   showGameSwitcher 
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
  showGameSwitcher = false,
  onLogout,
  showCopyright = true,
  className = ''
}: FooterProps) {
  const router = useRouter();
  const { gameState, setGameState } = useGameState();
  const { sessionState } = useSessionState();
  const { commissionerState } = useCommissionerState();

  const handleGameSwitcherChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newGameId = e.target.value;
    const currentGameId = gameState.gameId || 'default';
    const gameNames: Record<string, string> = {
      'default': 'Default Game',
      'NY2025': 'NY 2025',
      'demo-game': 'Demo Game'
    };

    if (newGameId !== currentGameId) {
      if (confirm(`Switch to ${gameNames[newGameId] || newGameId}? This will reload the page.`)) {
        // Update state manager and localStorage, then reload
        localStorage.setItem('current_game_id', newGameId);
        setGameState({ gameId: newGameId });
        window.location.reload();
      } else {
        // Reset select to current value if user cancels
        e.target.value = currentGameId;
      }
    }
  };

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
    if (commissionerState.isCommissioner) {
      // Commissioner logout
      if (onLogout) {
        onLogout();
      } else {
        // Default commissioner logout behavior
        if (confirm('Are you sure you want to logout from Commissioner mode?')) {
          console.log('[Footer Logout] Commissioner logout initiated');
          
          // Clear commissioner session from localStorage
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
          
          // Navigate to home - should show commissioner card if still has team session
          router.push('/');
        }
      }
    } else if (sessionState.token) {
      // Team session logout
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
        
        // Navigate to home - should show anonymous card or commissioner card
        router.push('/');
      }
    }
  };

  // Session-aware button rendering
  const renderButtons = () => {
    const buttons = [];

    // Determine if we're in a team session or commissioner session
    const isTeamSession = !!sessionState.token;
    const isCommissioner = commissionerState.isCommissioner;

    // 1. Home button (always show except in minimal mode)
    if (mode !== 'minimal') {
      buttons.push(
        <button 
          key="home"
          id="home-button" 
          className="btn btn-secondary"
          onClick={() => router.push('/')}
        >
          Home
        </button>
      );
    }

    // 2. Copy URL button (only show when in team session)
    if (isTeamSession && mode === 'team') {
      buttons.push(
        <button 
          key="copy-url"
          id="copy-url-button" 
          className="btn btn-secondary"
          onClick={handleCopyURL}
          title="Copy your unique team URL"
        >
          📋 Copy URL
        </button>
      );
    }

    // 3. Commissioner Mode button (only show when NOT commissioner AND NOT in team session)
    if (!isCommissioner && !isTeamSession && mode === 'home') {
      buttons.push(
        <button 
          key="commissioner-mode"
          id="commissioner-mode" 
          className="btn btn-secondary"
          onClick={() => router.push('/commissioner')}
        >
          Commissioner Mode
        </button>
      );
    }

    // 4. Game Selector (only show when commissioner OR explicitly requested)
    // This is handled separately below as a <select> element

    // 5. Logout button (show when commissioner OR in team session)
    if (isCommissioner || isTeamSession) {
      buttons.push(
        <button 
          key="logout"
          id="logout-button" 
          className="btn btn-secondary"
          onClick={handleLogout}
        >
          Logout
        </button>
      );
    }

    return buttons.length > 0 ? buttons : null;
  };

  return (
    <footer className={className}>
      <div className="footer-actions">
        {renderButtons()}
        
        {/* Game switcher shows when commissioner OR explicitly requested */}
        {(showGameSwitcher || commissionerState.isCommissioner) && (
          <div className={`game-switcher visible`}>
            <label htmlFor="game-select">Game: </label>
            <select 
              id="game-select" 
              className="game-select"
              value={gameState.gameId || 'default'}
              onChange={handleGameSwitcherChange}
            >
              <option value="default">Default Game</option>
              <option value="NY2025">NY 2025</option>
              <option value="demo-game">Demo Game</option>
            </select>
          </div>
        )}
      </div>
      
      {showCopyright && (
        <p className="footer-copyright">Marathon Majors League &copy; 2025</p>
      )}
    </footer>
  );
}
