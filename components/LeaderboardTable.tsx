/**
 * LeaderboardTable Component
 * 
 * Displays fantasy standings with sticky behavior for current player.
 * Replaces manual DOM manipulation from displayLeaderboard() in app.js
 */

import React, { useEffect, useRef, useState } from 'react';

interface Standing {
  rank: number;
  player_code: string;
  total_points: number;
  wins: number;
  top3: number;
}

interface LeaderboardTableProps {
  standings: Standing[];
  currentPlayerCode: string | null;
  isTemporary?: boolean;
  hasFinishTimes?: boolean;
  hasResults?: boolean;
  projectionInfo?: {
    mostCommonSplit: string;
  } | null;
  resultsFinalized?: boolean;
  onPlayerClick?: (playerCode: string) => void;
}

export default function LeaderboardTable({
  standings,
  currentPlayerCode,
  isTemporary = false,
  hasFinishTimes = false,
  hasResults = false,
  projectionInfo = null,
  resultsFinalized = false,
  onPlayerClick,
}: LeaderboardTableProps) {
  const highlightedRowRef = useRef<HTMLDivElement>(null);
  const [stickyMode, setStickyMode] = useState<'top' | 'bottom' | null>(null);

  // Format split label for display
  const formatSplitLabel = (splitName: string): string => {
    const labels: Record<string, string> = {
      split_5k: '5K',
      split_10k: '10K',
      split_half: 'Half Marathon',
      split_30k: '30K',
      split_35k: '35K',
      split_40k: '40K',
    };
    return labels[splitName] || splitName;
  };

  // Initialize bidirectional sticky behavior for highlighted row
  useEffect(() => {
    const highlightedRow = highlightedRowRef.current;
    if (!highlightedRow) return;

    let ticking = false;

    const updateStickyBehavior = () => {
      if (!highlightedRow.isConnected) return;

      // Temporarily remove sticky classes to get natural position
      const wasTop = highlightedRow.classList.contains('sticky-top');
      const wasBottom = highlightedRow.classList.contains('sticky-bottom');
      if (wasTop || wasBottom) {
        highlightedRow.classList.remove('sticky-top', 'sticky-bottom');
      }

      const rowNaturalTop = highlightedRow.offsetTop;
      const rowNaturalHeight = highlightedRow.offsetHeight;

      // Restore previous state temporarily
      if (wasTop) highlightedRow.classList.add('sticky-top');
      if (wasBottom) highlightedRow.classList.add('sticky-bottom');

      const viewportHeight = window.innerHeight;
      const scrollTop = window.scrollY;

      // Header and footer offsets
      const headerOffset = 80;
      const bottomOffset = 20;

      // Calculate viewport boundaries
      const viewportTop = scrollTop + headerOffset;
      const viewportBottom = scrollTop + viewportHeight - bottomOffset;

      // Determine sticky mode
      let newStickyMode: 'top' | 'bottom' | null = null;
      if (rowNaturalTop < viewportTop) {
        newStickyMode = 'top';
      } else if (rowNaturalTop + rowNaturalHeight > viewportBottom) {
        newStickyMode = 'bottom';
      }

      setStickyMode(newStickyMode);
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(() => {
          try {
            if (highlightedRow.isConnected) {
              updateStickyBehavior();
            }
          } finally {
            ticking = false;
          }
        });
      }
    };

    const onResize = () => {
      if (highlightedRow.isConnected) {
        setStickyMode(null); // Force recalculation
        updateStickyBehavior();
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });

    // Initial update
    updateStickyBehavior();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [standings, currentPlayerCode]);

  if (standings.length === 0) {
    return <p className="empty-state">No standings available yet.</p>;
  }

  // Determine banner state
  const raceFinishedNotFinalized = hasFinishTimes && !resultsFinalized && standings.length > 0;
  const preRaceState = !hasResults && standings.length > 0;

  return (
    <div className="leaderboard-container">
      {/* Pre-race banner */}
      {preRaceState && (
        <div className="temporary-scores-banner" style={{ background: 'linear-gradient(135deg, #2C39A2 0%, #1e2870 100%)', boxShadow: '0 3px 12px rgba(44, 57, 162, 0.3)' }}>
          <span className="banner-icon">🏁</span>
          <div className="banner-content">
            <strong>Pre-Race Standings</strong>
            <span className="banner-detail">
              The race will start at [game.lockTime]. Teams will earn points once results are entered.
            </span>
          </div>
        </div>
      )}

      {/* Banners for temporary scores or manual review */}
      {raceFinishedNotFinalized && (
        <div className="temporary-scores-banner review-state">
          <span className="banner-icon">⏳</span>
          <div className="banner-content">
            <strong>Race Finished - Results Being Manually Reviewed</strong>
            <span className="banner-detail">
              This could take a while. Check back tomorrow for final official results.
            </span>
          </div>
        </div>
      )}

      {isTemporary && projectionInfo && !raceFinishedNotFinalized && (
        <div className="temporary-scores-banner">
          <span className="banner-icon">⚡</span>
          <div className="banner-content">
            <strong>Live Projections</strong>
            <span className="banner-detail">
              Based on {formatSplitLabel(projectionInfo.mostCommonSplit)} times • Scores will
              update as race progresses
            </span>
          </div>
        </div>
      )}

      {/* Leaderboard rows */}
      {standings.map((standing) => {
        const isCurrentPlayer = standing.player_code === currentPlayerCode;
        const rank = standing.rank;
        const displayRank = rank <= 3 ? '' : `#${rank}`;
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
        const stats = `${standing.wins} wins, ${standing.top3} top-3`;

        const rowClasses = [
          'leaderboard-row',
          isCurrentPlayer ? 'leaderboard-row-highlight' : '',
          isCurrentPlayer && stickyMode === 'top' ? 'sticky-top' : '',
          isCurrentPlayer && stickyMode === 'bottom' ? 'sticky-bottom' : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <div
            key={standing.player_code}
            ref={isCurrentPlayer ? highlightedRowRef : null}
            className={rowClasses}
            data-player-code={standing.player_code}
            onClick={() => onPlayerClick?.(standing.player_code)}
            role="button"
            tabIndex={0}
            aria-label={`${standing.player_code}, rank ${rank}, ${standing.total_points} points`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onPlayerClick?.(standing.player_code);
              }
            }}
          >
            <div className="leaderboard-rank-section">
              <span className="rank-medal" aria-hidden={!medal}>
                {medal}
              </span>
              <span className="rank-number">{displayRank}</span>
            </div>
            <div className="leaderboard-team-section">
              <div className="leaderboard-team-name">{standing.player_code}</div>
              <div className="leaderboard-team-stats">{stats}</div>
            </div>
            <div className="leaderboard-score-section">
              <div className="leaderboard-total-points">{standing.total_points}</div>
              <div className="leaderboard-points-label">pts</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
