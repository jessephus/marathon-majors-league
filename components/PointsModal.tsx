/**
 * PointsModal Component
 * 
 * Displays detailed points breakdown for an athlete.
 * Lazy-loads scoring details only on open.
 * Replaces showPointsBreakdownModal() from app.js
 * 
 * UI Migration: Migrated to Chakra UI buttons (Phase 4)
 */

import React from 'react';
import { Button } from '@/components/chakra';

interface PointsBreakdown {
  placement?: {
    position: number;
    points: number;
  };
  time_gap?: {
    gap_seconds: number;
    points: number;
    window?: {
      max_gap_seconds: number;
    };
  };
  performance_bonuses?: Array<{
    type: string;
    points: number;
  }>;
  record_bonuses?: Array<{
    type: string;
    points: number;
    status?: string;
  }>;
}

interface PointsModalProps {
  athleteName: string;
  totalPoints: number;
  breakdown: PointsBreakdown;
  onClose: () => void;
}

export default function PointsModal({
  athleteName,
  totalPoints,
  breakdown,
  onClose,
}: PointsModalProps) {
  const getOrdinal = (n: number): string => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const formatBonusName = (type: string): string => {
    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getBonusIcon = (type: string): string => {
    const icons: Record<string, string> = {
      NEGATIVE_SPLIT: '📈',
      EVEN_PACE: '⚖️',
      WORLD_RECORD: '🌎',
      COURSE_RECORD: '🏆',
      OLYMPIC_RECORD: '🥇',
    };
    return icons[type] || '🚀';
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div
      className="points-modal-backdrop"
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="points-modal-title"
    >
      <div
        className="points-modal-content"
        style={{
          background: 'white',
          borderRadius: '10px',
          padding: '20px',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          id="points-modal-title"
          style={{
            margin: '0 0 15px 0',
            color: 'var(--primary-blue)',
          }}
        >
          {athleteName} - Points Breakdown
        </h3>

        <div
          style={{
            borderBottom: '2px solid var(--light-gray)',
            marginBottom: '15px',
          }}
        />

        {/* Placement Points */}
        {breakdown.placement && breakdown.placement.points > 0 && (
          <div
            className="breakdown-item"
            style={{
              marginBottom: '12px',
              padding: '10px',
              background: '#f8f9fa',
              borderRadius: '5px',
            }}
          >
            <div style={{ fontWeight: 'bold', color: 'var(--dark-gray)' }}>
              🏁 Placement
            </div>
            <div>{getOrdinal(breakdown.placement.position)} place</div>
            <div style={{ color: 'var(--primary-blue)', fontWeight: 'bold' }}>
              +{breakdown.placement.points} points
            </div>
          </div>
        )}

        {/* Time Gap Points */}
        {breakdown.time_gap && breakdown.time_gap.points > 0 && (
          <div
            className="breakdown-item"
            style={{
              marginBottom: '12px',
              padding: '10px',
              background: '#f8f9fa',
              borderRadius: '5px',
            }}
          >
            <div style={{ fontWeight: 'bold', color: 'var(--dark-gray)' }}>
              ⏱️ Time Gap
            </div>
            <div>{breakdown.time_gap.gap_seconds} seconds behind winner</div>
            {breakdown.time_gap.window && (
              <div style={{ fontSize: '0.85em', color: '#666' }}>
                (Within {breakdown.time_gap.window.max_gap_seconds}s window)
              </div>
            )}
            <div style={{ color: 'var(--primary-blue)', fontWeight: 'bold' }}>
              +{breakdown.time_gap.points} points
            </div>
          </div>
        )}

        {/* Performance Bonuses */}
        {breakdown.performance_bonuses &&
          breakdown.performance_bonuses.length > 0 &&
          breakdown.performance_bonuses.map((bonus, idx) => (
            <div
              key={`perf-${idx}`}
              className="breakdown-item"
              style={{
                marginBottom: '12px',
                padding: '10px',
                background: '#f8f9fa',
                borderRadius: '5px',
              }}
            >
              <div style={{ fontWeight: 'bold', color: 'var(--dark-gray)' }}>
                {getBonusIcon(bonus.type)} {formatBonusName(bonus.type)}
              </div>
              <div style={{ color: 'var(--primary-blue)', fontWeight: 'bold' }}>
                +{bonus.points} points
              </div>
            </div>
          ))}

        {/* Record Bonuses */}
        {breakdown.record_bonuses &&
          breakdown.record_bonuses.length > 0 &&
          breakdown.record_bonuses.map((record, idx) => (
            <div
              key={`record-${idx}`}
              className="breakdown-item"
              style={{
                marginBottom: '12px',
                padding: '10px',
                background: '#fff3cd',
                borderRadius: '5px',
                border: '2px solid #ffc107',
              }}
            >
              <div style={{ fontWeight: 'bold', color: 'var(--dark-gray)' }}>
                {getBonusIcon(record.type)} {formatBonusName(record.type)}
                {record.status === 'provisional' && ' (Provisional - Pending)'}
              </div>
              <div style={{ color: 'var(--primary-blue)', fontWeight: 'bold' }}>
                +{record.points} points
              </div>
            </div>
          ))}

        {/* Total Points */}
        <div
          style={{
            marginTop: '15px',
            padding: '15px',
            background: 'var(--primary-blue)',
            color: 'white',
            borderRadius: '5px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '0.9em', opacity: 0.9 }}>TOTAL POINTS</div>
          <div style={{ fontSize: '2em', fontWeight: 'bold' }}>{totalPoints}</div>
        </div>

        {/* Close Button */}
        <Button
          onClick={onClose}
          variant="solid"
          colorPalette="navy"
          size="lg"
          style={{ marginTop: '15px', width: '100%' }}
          aria-label="Close points breakdown modal"
        >
          Close
        </Button>
      </div>
    </div>
  );
}
