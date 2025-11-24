/**
 * ResultsTable Component
 * 
 * Displays race results with filtering by gender and split type.
 * Replaces displayRaceResultsLeaderboard() and renderFilteredRaceResults() from app.js
 */

import React, { useState } from 'react';
import { Select, SelectOption } from '@/components/chakra';

interface AthleteResult {
  athlete_id: number;
  athlete_name: string;
  placement?: number;
  finish_time?: string;
  split_5k?: string;
  split_10k?: string;
  split_half?: string;
  split_30k?: string;
  split_35k?: string;
  split_40k?: string;
  total_points: number;
  gender: string;
  country?: string;
  personal_best?: string;
  headshot_url?: string;
  breakdown?: {
    placement?: { position: number; points: number };
    time_gap?: { gap_seconds: number; points: number; window?: { max_gap_seconds: number } };
    performance_bonuses?: Array<{ type: string; points: number }>;
    record_bonuses?: Array<{ type: string; points: number; status?: string }>;
  };
}

interface ResultsTableProps {
  results: AthleteResult[];
  onAthleteClick?: (result: AthleteResult) => void;
}

export default function ResultsTable({ results, onAthleteClick }: ResultsTableProps) {
  const [selectedGender, setSelectedGender] = useState<'men' | 'women'>('men');
  const [selectedSplit, setSelectedSplit] = useState<string>('finish');

  const splitOptions: SelectOption[] = [
    { value: 'finish', label: 'Finish Time' },
    { value: '5k', label: '5K Split' },
    { value: '10k', label: '10K Split' },
    { value: 'half', label: 'Half Marathon' },
    { value: '30k', label: '30K Split' },
    { value: '35k', label: '35K Split' },
    { value: '40k', label: '40K Split' }
  ];

  // Helper functions
  const roundTimeToSecond = (timeStr: string | undefined): string => {
    if (!timeStr || timeStr === 'DNF' || timeStr === 'DNS' || timeStr === 'N/A') {
      return timeStr || 'N/A';
    }

    const parts = timeStr.split(':');
    if (parts.length !== 3) return timeStr;

    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    const secondsWithDecimal = parseFloat(parts[2]);
    const roundedSeconds = Math.round(secondsWithDecimal);

    if (roundedSeconds >= 60) {
      const newMinutes = minutes + 1;
      if (newMinutes >= 60) {
        return `${hours + 1}:00:00`;
      }
      return `${hours}:${newMinutes.toString().padStart(2, '0')}:00`;
    }

    return `${hours}:${minutes.toString().padStart(2, '0')}:${roundedSeconds.toString().padStart(2, '0')}`;
  };

  const formatTimeGap = (gapSeconds: number): string => {
    if (gapSeconds <= 0) return '';

    const minutes = Math.floor(gapSeconds / 60);
    const seconds = gapSeconds % 60;

    if (gapSeconds < 1) {
      return `+0:00.${Math.round(seconds * 100).toString().padStart(2, '0')}`;
    }

    const wholeSec = Math.floor(seconds);
    const decimal = seconds - wholeSec;

    if (decimal > 0) {
      const decimalStr = Math.round(decimal * 100).toString().padStart(2, '0');
      return `+${minutes}:${wholeSec.toString().padStart(2, '0')}.${decimalStr}`;
    }

    return `+${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getRunnerSvg = (gender: string): string => {
    // Use PNG image paths to match legacy implementation
    return gender === 'men' || gender === 'male'
      ? '/images/man-runner.png'
      : '/images/woman-runner.png';
  };

  const getCountryFlagEmoji = (countryCode: string): string => {
    const isoMap: Record<string, string> = {
      AUS: 'AU', CAN: 'CA', ERI: 'ER', ETH: 'ET', FRA: 'FR', GBR: 'GB',
      IRE: 'IE', ITA: 'IT', JPN: 'JP', KEN: 'KE', MEX: 'MX', NED: 'NL',
      NOR: 'NO', SUI: 'CH', TAN: 'TZ', USA: 'US', BEL: 'BE', UGA: 'UG',
      MAR: 'MA', CHN: 'CN', ARG: 'AR', ESP: 'ES',
    };

    const iso = isoMap[countryCode];
    if (!iso) return '🏁';

    const codePoints = iso.split('').map((char) => 0x1f1e6 + char.charCodeAt(0) - 65);
    return String.fromCodePoint(...codePoints);
  };

  // Filter results by gender
  const filteredResults = results
    .filter((r) => r.gender === selectedGender)
    .sort((a, b) => (a.placement || 999) - (b.placement || 999));

  // Get display time based on split type
  const getDisplayTime = (result: AthleteResult): { time: string; label: string } => {
    const hasSomeSplits =
      result.split_5k || result.split_10k || result.split_half ||
      result.split_30k || result.split_35k || result.split_40k;
    const isDNS = !result.finish_time && !hasSomeSplits;
    const isDNF = !result.finish_time && hasSomeSplits;

    const splitMap: Record<string, { time: string | undefined; label: string }> = {
      finish: { time: result.finish_time, label: 'Finish' },
      '5k': { time: result.split_5k, label: '5K' },
      '10k': { time: result.split_10k, label: '10K' },
      half: { time: result.split_half, label: 'Half' },
      '30k': { time: result.split_30k, label: '30K' },
      '35k': { time: result.split_35k, label: '35K' },
      '40k': { time: result.split_40k, label: '40K' },
    };

    const split = splitMap[selectedSplit] || splitMap.finish;

    if (selectedSplit === 'finish') {
      if (isDNS) return { time: 'DNS', label: split.label };
      if (isDNF) return { time: 'DNF', label: split.label };
      return { time: roundTimeToSecond(split.time), label: split.label };
    }

    return { time: split.time || 'N/A', label: split.label };
  };

  // Calculate points breakdown shorthand
  const getPointsShorthand = (result: AthleteResult): string => {
    if (!result.breakdown) return '-';

    const parts: string[] = [];
    if (result.breakdown.placement && result.breakdown.placement.points > 0) {
      parts.push(`P${result.breakdown.placement.points}`);
    }
    if (result.breakdown.time_gap && result.breakdown.time_gap.points > 0) {
      parts.push(`G${result.breakdown.time_gap.points}`);
    }

    const perfBonus = result.breakdown.performance_bonuses?.reduce((sum, b) => sum + b.points, 0) || 0;
    const recBonus = result.breakdown.record_bonuses?.reduce((sum, b) => sum + b.points, 0) || 0;
    const totalBonus = perfBonus + recBonus;

    if (totalBonus > 0) {
      parts.push(`B${totalBonus}`);
    }

    return parts.length > 0 ? parts.join('+') : '-';
  };

  if (filteredResults.length === 0) {
    return <p className="empty-state">No race results available yet. Check back once the race begins!</p>;
  }

  return (
    <div className="race-results-container">
      {/* Filter Controls */}
      <div className="race-results-controls" style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {/* Gender Toggle */}
        <div className="gender-toggle" style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`gender-toggle-btn ${selectedGender === 'men' ? 'active' : ''}`}
            onClick={() => setSelectedGender('men')}
            data-gender="men"
          >
            Men
          </button>
          <button
            className={`gender-toggle-btn ${selectedGender === 'women' ? 'active' : ''}`}
            onClick={() => setSelectedGender('women')}
            data-gender="women"
          >
            Women
          </button>
        </div>

        {/* Split Selector */}
        <Select
          id="split-select"
          options={splitOptions}
          value={selectedSplit}
          onChange={(e) => setSelectedSplit(e.target.value)}
          variant="outline"
          size="md"
          style={{ maxWidth: '200px' }}
        />
      </div>

      {/* Results Header */}
      <div className="race-gender-section">
        <h3 className="gender-header">{selectedGender === 'men' ? 'Men' : 'Women'}'s Results</h3>

        {/* Results List */}
        <div className="race-results-list">
          {filteredResults.map((result) => {
            const placement = result.placement || '-';
            const medal = placement === 1 ? '🥇' : placement === 2 ? '🥈' : placement === 3 ? '🥉' : '';
            const { time: displayTime, label: timeLabel } = getDisplayTime(result);
            const hasSomeSplits =
              result.split_5k || result.split_10k || result.split_half ||
              result.split_30k || result.split_35k || result.split_40k;
            const isDNS = !result.finish_time && !hasSomeSplits;
            const isDNF = !result.finish_time && hasSomeSplits;
            const statusClass = isDNS ? 'status-dns' : isDNF ? 'status-dnf' : '';

            // Gap from first place
            let gapFromFirst = '';
            if (selectedSplit === 'finish' && result.breakdown?.time_gap) {
              const gapSeconds = result.breakdown.time_gap.gap_seconds || 0;
              if (gapSeconds > 0) {
                gapFromFirst = formatTimeGap(gapSeconds);
              }
            }

            const shorthand = getPointsShorthand(result);
            const headshotUrl = result.headshot_url || getRunnerSvg(result.gender);
            const countryCode = (result.country || '').toUpperCase();
            const personalBest = result.personal_best || '';

            return (
              <div
                key={result.athlete_id}
                className={`race-result-row ${statusClass}`}
                onClick={() => onAthleteClick?.(result)}
                role="button"
                tabIndex={0}
                aria-label={`${result.athlete_name}, place ${placement}, ${displayTime}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onAthleteClick?.(result);
                  }
                }}
              >
                <div className="race-result-placement">
                  {medal ? (
                    <span className="placement-medal" aria-label={`${placement} place`}>
                      {medal}
                    </span>
                  ) : (
                    <span className="placement-number">#{placement}</span>
                  )}
                </div>
                <div className="race-result-athlete">
                  <img
                    src={headshotUrl}
                    alt={result.athlete_name}
                    className="race-result-headshot"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = getRunnerSvg(result.gender);
                    }}
                  />
                  <div className="athlete-details">
                    <div className="athlete-name">{result.athlete_name}</div>
                    <div className="athlete-meta">
                      <span className="athlete-country">
                        {getCountryFlagEmoji(countryCode)} {countryCode || 'N/A'}
                      </span>
                      {personalBest && <span className="athlete-pb">PB: {personalBest}</span>}
                    </div>
                  </div>
                </div>
                <div className="race-result-performance">
                  <div className={`finish-time ${isDNS || isDNF ? 'status-label' : ''}`}>
                    {displayTime}
                  </div>
                  {gapFromFirst ? (
                    <div className="time-gap">{gapFromFirst}</div>
                  ) : selectedSplit !== 'finish' ? (
                    <div className="time-gap">{timeLabel} Split</div>
                  ) : null}
                </div>
                <div className="race-result-points">
                  <div className="points-value">{result.total_points} pts</div>
                  <div className="points-breakdown">{shorthand}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
