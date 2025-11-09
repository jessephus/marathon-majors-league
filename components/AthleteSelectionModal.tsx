/**
 * Athlete Selection Modal Component
 * 
 * Modal for selecting athletes to add to roster slots.
 * Filters by gender, shows salary, and prevents duplicates.
 */

import React, { useState, useMemo } from 'react';
import { canAffordAthlete, isAthleteInRoster } from '@/lib/budget-utils';

interface Athlete {
  id: number;
  name: string;
  country: string;
  gender: string;
  pb: string;
  salary: number;
  headshotUrl?: string;
  marathonRank?: number;
  age?: number;
  sponsor?: string;
}

interface RosterSlot {
  slotId: string;
  athleteId: number | null;
  salary: number | null;
}

interface AthleteSelectionModalProps {
  isOpen: boolean;
  slotId: string | null;
  gender: 'men' | 'women';
  athletes: Athlete[];
  currentRoster: RosterSlot[];
  totalBudget?: number;
  onSelect: (athlete: Athlete) => void;
  onClose: () => void;
}

export default function AthleteSelectionModal({
  isOpen,
  slotId,
  gender,
  athletes,
  currentRoster,
  totalBudget = 30000,
  onSelect,
  onClose,
}: AthleteSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'rank' | 'name' | 'salary' | 'pb'>('rank');

  // Filter and sort athletes
  const filteredAthletes = useMemo(() => {
    let filtered = athletes.filter(athlete => {
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          athlete.name.toLowerCase().includes(query) ||
          athlete.country.toLowerCase().includes(query)
        );
      }
      return true;
    });

    // Sort athletes
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rank':
          return (a.marathonRank || 999) - (b.marathonRank || 999);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'salary':
          return b.salary - a.salary; // Descending
        case 'pb':
          return a.pb.localeCompare(b.pb);
        default:
          return 0;
      }
    });

    return filtered;
  }, [athletes, searchQuery, sortBy]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  // Get country flag
  const getCountryFlag = (countryCode: string) => {
    const flagMap: Record<string, string> = {
      'USA': '🇺🇸', 'KEN': '🇰🇪', 'ETH': '🇪🇹', 'GBR': '🇬🇧',
      'JPN': '🇯🇵', 'ITA': '🇮🇹', 'GER': '🇩🇪', 'FRA': '🇫🇷',
      'ESP': '🇪🇸', 'NED': '🇳🇱', 'BEL': '🇧🇪', 'NOR': '🇳🇴',
      'SWE': '🇸🇪', 'UGA': '🇺🇬', 'ERI': '🇪🇷', 'MEX': '🇲🇽',
    };
    return flagMap[countryCode] || countryCode;
  };

  // Check if athlete can be selected
  const canSelectAthlete = (athlete: Athlete): { canSelect: boolean; reason?: string } => {
    // Check if already in roster
    if (isAthleteInRoster(currentRoster, athlete.id)) {
      return { canSelect: false, reason: 'Already in roster' };
    }

    // Check if can afford (exclude current slot from budget calculation)
    const rosterWithoutCurrentSlot = currentRoster.filter(s => s.slotId !== slotId);
    if (!canAffordAthlete(rosterWithoutCurrentSlot, athlete, totalBudget)) {
      return { canSelect: false, reason: 'Cannot afford' };
    }

    return { canSelect: true };
  };

  // Handle athlete selection
  const handleSelectAthlete = (athlete: Athlete) => {
    const { canSelect } = canSelectAthlete(athlete);
    if (canSelect) {
      onSelect(athlete);
      setSearchQuery(''); // Reset search
    }
  };

  // Handle close
  const handleClose = () => {
    setSearchQuery(''); // Reset search
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content athlete-selection-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Select {gender === 'men' ? 'Male' : 'Female'} Athlete</h2>
          <span className="modal-slot-label">for slot {slotId}</span>
          <button className="modal-close-btn" onClick={handleClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* Search and Sort Controls */}
          <div className="athlete-controls">
            <input
              type="text"
              className="athlete-search"
              placeholder="Search by name or country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select
              className="athlete-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="rank">Sort by Rank</option>
              <option value="name">Sort by Name</option>
              <option value="salary">Sort by Salary</option>
              <option value="pb">Sort by PB</option>
            </select>
          </div>

          {/* Athlete List */}
          <div className="athlete-list">
            {filteredAthletes.length === 0 ? (
              <div className="athlete-list-empty">
                No athletes found matching "{searchQuery}"
              </div>
            ) : (
              filteredAthletes.map((athlete) => {
                const { canSelect, reason } = canSelectAthlete(athlete);
                
                return (
                  <div
                    key={athlete.id}
                    className={`athlete-card ${!canSelect ? 'disabled' : ''}`}
                    onClick={() => handleSelectAthlete(athlete)}
                    style={{ cursor: canSelect ? 'pointer' : 'not-allowed' }}
                  >
                    <div className="athlete-card-main">
                      <div className="athlete-card-info">
                        <div className="athlete-card-name">{athlete.name}</div>
                        <div className="athlete-card-details">
                          <span>{getCountryFlag(athlete.country)}</span>
                          {athlete.marathonRank && (
                            <span className="athlete-rank">#{athlete.marathonRank}</span>
                          )}
                          <span className="athlete-pb">PB: {athlete.pb}</span>
                          {athlete.age && <span>Age: {athlete.age}</span>}
                        </div>
                        {athlete.sponsor && (
                          <div className="athlete-card-sponsor">{athlete.sponsor}</div>
                        )}
                      </div>
                      <div className="athlete-card-salary">
                        {formatCurrency(athlete.salary)}
                      </div>
                    </div>
                    {!canSelect && reason && (
                      <div className="athlete-card-restriction">
                        {reason}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
