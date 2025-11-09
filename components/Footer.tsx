import React from 'react';
import { useRouter } from 'next/router';
import { useGameState } from '@/lib/state-provider';

export interface FooterProps {
  /** Display mode for footer buttons */
  mode?: 'home' | 'commissioner' | 'team' | 'leaderboard' | 'minimal';
  /** Show the game switcher dropdown */
  showGameSwitcher?: boolean;
  /** Callback for logout button (commissioner mode) */
  onLogout?: () => void;
  /** Show copyright text */
  showCopyright?: boolean;
  /** Additional CSS classes */
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

  const renderButtons = () => {
    switch (mode) {
      case 'commissioner':
        return (
          <>
            <button 
              className="btn btn-secondary"
              onClick={() => router.push('/')}
            >
              Home
            </button>
            <button 
              className="btn btn-secondary"
              onClick={onLogout}
            >
              Logout
            </button>
          </>
        );

      case 'team':
        return (
          <button 
            className="btn btn-secondary" 
            onClick={() => router.push('/')}
          >
            ← Back to Home
          </button>
        );

      case 'leaderboard':
        return (
          <button 
            className="btn btn-secondary" 
            onClick={() => window.history.back()}
          >
            ← Back
          </button>
        );

      case 'home':
        return (
          <>
            <button 
              id="home-button" 
              className="btn btn-secondary"
              onClick={() => router.push('/')}
            >
              Home
            </button>
            <button 
              id="commissioner-mode" 
              className="btn btn-secondary"
              onClick={() => router.push('/commissioner')}
            >
              Commissioner Mode
            </button>
          </>
        );

      case 'minimal':
        return null;

      default:
        return null;
    }
  };

  return (
    <footer className={className}>
      <div className="footer-actions">
        {renderButtons()}
        
        {showGameSwitcher && (
          <div className={`game-switcher ${showGameSwitcher ? 'visible' : ''}`}>
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
