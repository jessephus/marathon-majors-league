/**
 * Athlete Selection Modal Component
 * 
 * Modal for selecting athletes to add to roster slots.
 * Filters by gender, shows salary, and prevents duplicates.
 * Matches legacy vanilla JS implementation styling.
 * 
 * UI Migration: Migrated to Chakra UI buttons (Phase 4)
 */

import React, { useState, useMemo, useEffect } from 'react';
import { canAffordAthlete, isAthleteInRoster } from '@/lib/budget-utils';
import { getRunnerSvg } from '@/lib/ui-helpers';
import { dynamicImport, CHUNK_NAMES, prefetchChunk } from '@/lib/dynamic-import';
import { FeatureFlag } from '@/lib/feature-flags';
import { Button, IconButton } from '@/components/chakra';

// Dynamic import AthleteModal with performance tracking
const AthleteModal = dynamicImport(
  () => import('./AthleteModal'),
  {
    chunkName: CHUNK_NAMES.ATHLETE_MODAL,
    featureFlag: FeatureFlag.DYNAMIC_ATHLETE_MODAL,
    loading: () => null, // No loading state needed here as modal opens when clicked
    ssr: false,
  }
);

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
  nycConfirmed?: boolean;
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
  const [sortBy, setSortBy] = useState<'salary' | 'pb' | 'rank'>('salary');
  const [detailAthlete, setDetailAthlete] = useState<Athlete | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showConfirmedOnly, setShowConfirmedOnly] = useState(true);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !isDetailModalOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, isDetailModalOpen, onClose]);

  // Helper function to convert time string to seconds for sorting
  const convertTimeToSeconds = (timeStr: string | null | undefined): number => {
    // Handle null/undefined values - sort to end
    if (!timeStr) {
      return 999999;
    }
    
    const parts = timeStr.split(':');
    if (parts.length === 3) {
      const hours = parseInt(parts[0]);
      const minutes = parseInt(parts[1]);
      const seconds = parseFloat(parts[2]); // Use parseFloat for sub-second precision
      return hours * 3600 + minutes * 60 + seconds;
    }
    return 999999; // Invalid time, sort to end
  };

  // Filter and sort athletes
  const sortedAthletes = useMemo(() => {
    let sorted = [...athletes];

    // Filter by NYC confirmation status
    if (showConfirmedOnly) {
      sorted = sorted.filter(athlete => athlete.nycConfirmed === true);
    }

    // Sort athletes
    sorted.sort((a, b) => {
      switch (sortBy) {
        case 'salary':
          return b.salary - a.salary; // Descending (highest first)
        case 'pb':
          return convertTimeToSeconds(a.pb) - convertTimeToSeconds(b.pb); // Ascending (fastest first)
        case 'rank':
          return (a.marathonRank || 999) - (b.marathonRank || 999); // Ascending (best rank first)
        default:
          return 0;
      }
    });

    return sorted;
  }, [athletes, sortBy, showConfirmedOnly]);

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

  // Handle athlete selection (only when clicking + button)
  const handleSelectAthlete = (athlete: Athlete) => {
    const { canSelect } = canSelectAthlete(athlete);
    if (canSelect) {
      onSelect(athlete);
    }
  };

  // Handle showing athlete detail modal
  const handleShowAthleteDetail = (athlete: Athlete) => {
    setDetailAthlete(athlete);
    setIsDetailModalOpen(true);
  };

  // Handle closing athlete detail modal
  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setTimeout(() => setDetailAthlete(null), 300);
  };

  // Handle closing selection modal with animation
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 400); // Match CSS transition duration (increased to 0.4s for smoother feel)
  };

  if (!isOpen) return null;

  // Get current slot athlete if any
  const currentSlotAthlete = currentRoster.find(s => s.slotId === slotId);

  return (
    <>
      {/* Modal Overlay */}
      <div className="modal-overlay" onClick={handleClose} style={{ display: 'block', zIndex: 10000 }}></div>
      
      {/* Selection Modal (slides in from right, full screen height) */}
      <div className={`selection-modal ${!isClosing ? 'active' : ''}`} id="athlete-selection-modal" style={{ zIndex: 10001 }}>
        {/* Modal Header */}
        <div className="modal-header">
          <IconButton
            className="modal-back-btn"
            onClick={handleClose}
            aria-label="Back"
            variant="ghost"
            colorPalette="navy"
            size="sm"
          >
            <span className="back-arrow">←</span>
          </IconButton>
          <h3 id="selection-modal-title">
            Select {gender === 'men' ? 'Male' : 'Female'} Athlete ({slotId})
          </h3>
        </div>

        {/* Sort Tabs */}
        <div className="modal-sort-tabs">
          <Button
            className={`sort-tab ${sortBy === 'salary' ? 'active' : ''}`}
            onClick={() => setSortBy('salary')}
            variant={sortBy === 'salary' ? 'solid' : 'ghost'}
            colorPalette="navy"
            size="sm"
          >
            Salary
          </Button>
          <Button
            className={`sort-tab ${sortBy === 'pb' ? 'active' : ''}`}
            onClick={() => setSortBy('pb')}
            variant={sortBy === 'pb' ? 'solid' : 'ghost'}
            colorPalette="navy"
            size="sm"
          >
            PB
          </Button>
          <Button
            className={`sort-tab ${sortBy === 'rank' ? 'active' : ''}`}
            onClick={() => setSortBy('rank')}
            variant={sortBy === 'rank' ? 'solid' : 'ghost'}
            colorPalette="navy"
            size="sm"
          >
            Rank
          </Button>
        </div>

        {/* Filter Options */}
        <div style={{ 
          padding: '12px 16px', 
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb'
        }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#374151'
          }}>
            <input
              type="checkbox"
              checked={showConfirmedOnly}
              onChange={(e) => setShowConfirmedOnly(e.target.checked)}
              style={{ 
                width: '16px', 
                height: '16px',
                cursor: 'pointer'
              }}
            />
            <span>Show only confirmed for NYC Marathon</span>
          </label>
        </div>

        {/* Athlete List */}
        <div className="modal-athlete-list" id="modal-athlete-list">
          {sortedAthletes.length === 0 ? (
            <div className="athlete-list-empty">
              No {gender === 'men' ? 'male' : 'female'} athletes available
            </div>
          ) : (
            sortedAthletes.map((athlete) => {
              const { canSelect } = canSelectAthlete(athlete);
              const isInRoster = isAthleteInRoster(currentRoster, athlete.id);
              const isInCurrentSlot = currentSlotAthlete?.athleteId === athlete.id;
              
              // Get headshot URL or fallback to runner SVG
              const headshotUrl = athlete.headshotUrl || getRunnerSvg(gender);
              
              // Get rank display
              const rankDisplay = athlete.marathonRank ? `Rank: #${athlete.marathonRank}` : 'Unranked';
              
              return (
                <div
                  key={athlete.id}
                  className={`modal-athlete-item ${
                    isInRoster && !isInCurrentSlot ? 'selected' : ''
                  } ${!canSelect ? 'disabled' : ''}`}
                  onClick={() => handleShowAthleteDetail(athlete)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Athlete Headshot */}
                  <div className="modal-athlete-headshot">
                    <img 
                      src={headshotUrl} 
                      alt={athlete.name}
                      onError={(e) => {
                        e.currentTarget.src = getRunnerSvg(gender);
                      }}
                    />
                  </div>

                  {/* Athlete Info */}
                  <div className="modal-athlete-info">
                    <div className="modal-athlete-name">{athlete.name}</div>
                    <div className="modal-athlete-stats">
                      {getCountryFlag(athlete.country)} {athlete.country} • {athlete.pb} • {rankDisplay}
                    </div>
                  </div>

                  {/* Salary */}
                  <div className="modal-athlete-salary">
                    {formatCurrency(athlete.salary)}
                  </div>

                  {/* Add Button */}
                  <IconButton
                    className="modal-add-btn" 
                    disabled={!canSelect}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectAthlete(athlete);
                    }}
                    aria-label={isInCurrentSlot ? 'Selected' : 'Add athlete'}
                    variant="solid"
                    colorPalette={isInCurrentSlot ? 'success' : 'primary'}
                    size="sm"
                    borderRadius="full"
                  >
                    {isInCurrentSlot ? '✓' : '+'}
                  </IconButton>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Athlete Detail Modal */}
      <AthleteModal
        athlete={detailAthlete}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        showScoring={false}
      />
    </>
  );
}
