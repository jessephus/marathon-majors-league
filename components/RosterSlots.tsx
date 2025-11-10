/**
 * Roster Slots Component
 * 
 * Displays the 6 roster slots (M1-M3, W1-W3) with selected athletes.
 * Handles slot interactions and athlete removal.
 */

import React from 'react';
import { SLOT_CONFIG } from '@/lib/budget-utils';

interface Athlete {
  id: number;
  name: string;
  country: string;
  gender: string;
  pb: string;
  salary: number;
  headshotUrl?: string;
}

interface RosterSlot {
  slotId: string;
  athleteId: number | null;
  salary: number | null;
}

interface RosterSlotsProps {
  roster: RosterSlot[];
  athletes: {
    men: Athlete[];
    women: Athlete[];
  };
  isLocked: boolean;
  onSlotClick: (slotId: string, currentAthleteId: number | null) => void;
  onRemoveAthlete: (slotId: string) => void;
}

export default function RosterSlots({
  roster,
  athletes,
  isLocked,
  onSlotClick,
  onRemoveAthlete,
}: RosterSlotsProps) {
  // Get athlete data by ID
  const getAthleteById = (athleteId: number | null): Athlete | null => {
    if (!athleteId) return null;
    
    const allAthletes = [...athletes.men, ...athletes.women];
    return allAthletes.find(a => a.id === athleteId) || null;
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  // Get country flag
  const getCountryFlag = (countryCode: string) => {
    // Simple flag emoji mapping - can be enhanced
    const flagMap: Record<string, string> = {
      'USA': '🇺🇸',
      'KEN': '🇰🇪',
      'ETH': '🇪🇹',
      'GBR': '🇬🇧',
      'JPN': '🇯🇵',
      'ITA': '🇮🇹',
      'GER': '🇩🇪',
      'FRA': '🇫🇷',
      'ESP': '🇪🇸',
      'NED': '🇳🇱',
      'BEL': '🇧🇪',
      'NOR': '🇳🇴',
      'SWE': '🇸🇪',
      'UGA': '🇺🇬',
      'ERI': '🇪🇷',
      'MEX': '🇲🇽',
    };
    return flagMap[countryCode] || countryCode;
  };

  // Render a single slot
  const renderSlot = (slotId: string) => {
    const slot = roster.find(s => s.slotId === slotId);
    const athlete = getAthleteById(slot?.athleteId || null);
    const isEmpty = !athlete;

    return (
      <div
        key={slotId}
        className={`draft-slot ${isEmpty ? 'empty' : 'filled'} ${isLocked ? 'locked' : ''}`}
        data-slot-id={slotId}
        onClick={() => !isLocked && onSlotClick(slotId, athlete?.id || null)}
        style={{ cursor: isLocked ? 'default' : 'pointer' }}
      >
        <div className="slot-label">{slotId}</div>
        
        {isEmpty ? (
          <div className="slot-content">
            <span className="slot-placeholder">
              {isLocked ? 'Empty' : 'Tap to select athlete'}
            </span>
          </div>
        ) : (
          <div className="slot-content filled">
            <div className="slot-athlete-info">
              <div className="athlete-name">{athlete.name}</div>
              <div className="athlete-details">
                <span className="athlete-country">{getCountryFlag(athlete.country)}</span>
                <span className="athlete-pb">PB: {athlete.pb}</span>
              </div>
            </div>
            <div className="slot-athlete-salary">
              {formatCurrency(athlete.salary)}
            </div>
            {!isLocked && (
              <button
                className="slot-remove-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveAthlete(slotId);
                }}
                aria-label="Remove athlete"
              >
                ×
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="draft-slots-container">
      {/* Men's Slots */}
      <div className="slot-gender-section">
        <h3 className="slot-gender-label">Men</h3>
        <div className="slot-gender-slots">
          {SLOT_CONFIG.men.map(slotId => renderSlot(slotId))}
        </div>
      </div>

      {/* Women's Slots */}
      <div className="slot-gender-section">
        <h3 className="slot-gender-label">Women</h3>
        <div className="slot-gender-slots">
          {SLOT_CONFIG.women.map(slotId => renderSlot(slotId))}
        </div>
      </div>

      {/* Lock Notice */}
      {isLocked && (
        <div className="roster-lock-notice">
          🔒 Roster is locked - no changes allowed
        </div>
      )}
    </div>
  );
}
