/**
 * AthleteModal Component (Portal-based)
 * 
 * Reusable modal for displaying detailed athlete information.
 * Uses React Portal to render at document root level.
 * Phase 1: Placeholder component structure.
 * 
 * UI Migration: Migrated to Chakra UI buttons (Phase 4)
 */

import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { athleteApi } from '@/lib/api-client';
import { Athlete } from '@/lib/state-provider';
import { Button, IconButton } from '@/components/chakra';

interface AthleteModalProps {
  athlete: Athlete | null;
  isOpen: boolean;
  onClose: () => void;
  showScoring?: boolean;
  scoringData?: {
    totalPoints: number;
    breakdown: any;
    finishTime?: string;
    placement?: number;
    splits?: {
      split_5k?: string;
      split_10k?: string;
      split_half?: string;
      split_30k?: string;
      split_35k?: string;
      split_40k?: string;
    };
  };
}

interface AthleteDetailedData extends Athlete {
  raceResults?: Array<{
    id: number;
    athleteId: number;
    year: number;
    competitionDate: string;
    competitionName: string;
    venue: string;
    discipline: string;
    position: number | null;
    finishTime: string | null;
    racePoints: number | null;
  }>;
  progression?: Array<{
    id: number;
    athleteId: number;
    discipline: string;
    season: number;
    mark: string;
    venue: string;
    competitionDate: string | null;
    competitionName: string | null;
    resultScore: number | null;
  }>;
  news?: Array<{
    date: string;
    headline: string;
    source: string;
  }>;
}

function AthleteModalContent({ athlete, isOpen, onClose, showScoring = false, scoringData }: AthleteModalProps) {
  const [activeTab, setActiveTab] = useState<'bio' | 'raceLog' | 'progression' | 'news' | 'scoring'>('bio');
  const [detailedData, setDetailedData] = useState<AthleteDetailedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // If showScoring is true, default to scoring tab
  useEffect(() => {
    if (showScoring && scoringData) {
      setActiveTab('scoring');
    } else {
      setActiveTab('bio');
    }
  }, [showScoring, scoringData, isOpen]);

  useEffect(() => {
    if (!isOpen || !athlete) return;

    async function fetchDetailedData() {
      setLoading(true);
      try {
        // Fetch athlete profile with progression and race results (all disciplines)
        const data = await athleteApi.details(athlete.id, {
          progression: true,
          results: true,
        }) as AthleteDetailedData;
        
        setDetailedData({
          ...athlete,
          raceResults: data.raceResults || [],
          progression: data.progression || [],
          news: [], // News feed coming soon
        });
      } catch (error) {
        console.error('Error fetching athlete details:', error);
        // Fallback to basic athlete data
        setDetailedData({
          ...athlete,
          raceResults: [],
          progression: [],
          news: [],
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchDetailedData();
  }, [isOpen, athlete]);  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleKeyDown]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 400); // Match slideUp/slideDown animation duration
  };

  if (!isOpen || !athlete) {
    return null;
  }

  return (
    <div className="modal athlete-modal active" style={{ zIndex: 10002 }}>
      <div className="modal-overlay" onClick={handleClose} style={{ zIndex: 10002 }}></div>
      <div 
        className="athlete-card-container" 
        style={{ 
          zIndex: 10003,
          transform: isClosing ? 'translateY(100%)' : 'translateY(0)',
          transition: 'transform 0.4s ease-in-out'
        }}
      >
        <IconButton
          className="modal-close"
          onClick={handleClose}
          aria-label="Close athlete modal"
          variant="ghost"
          colorPalette="navy"
          size="sm"
          borderRadius="full"
        >
          &times;
        </IconButton>

        {loading ? (
          <div className="loading-state">
            <p>Loading athlete details...</p>
          </div>
        ) : (
          <>
            {/* Masthead Section with Gradient */}
            <div className="card-masthead country-gradient" style={{ background: getCountryGradient(athlete.country) }}>
              <div className="masthead-content">
                {/* Photo Section */}
                <div className="masthead-photo-section">
                  <div className="masthead-photo-wrapper">
                    <img 
                      src={athlete.headshotUrl || (athlete.gender === 'men' ? '/images/man-runner.png' : '/images/woman-runner.png')} 
                      alt={athlete.name} 
                      className="masthead-photo"
                      onError={(e) => {
                        const target = e.currentTarget;
                        console.log('Image failed to load:', target.src);
                        console.log('Athlete gender:', athlete.gender);
                        const fallback = athlete.gender === 'men' ? '/images/man-runner.png' : '/images/woman-runner.png';
                        console.log('Setting fallback to:', fallback);
                        // Prevent infinite loop if fallback also fails
                        if (target.src !== window.location.origin + fallback) {
                          target.src = fallback;
                        }
                      }}
                    />
                    <div className="masthead-flag">
                      <span className="flag-emoji">{getCountryFlag(athlete.country)}</span>
                    </div>
                  </div>
                </div>

                {/* Bio Section */}
                <div className="masthead-bio-section">
                  <h2 className="athlete-name">{athlete.name}</h2>
                  <div className="bio-details">
                    <div className="bio-item">
                      <span className="bio-value">{athlete.gender === 'men' ? 'Men' : 'Women'}</span>
                    </div>
                    {athlete.age && (
                      <div className="bio-item">
                        <span className="bio-value">{athlete.age}yo</span>
                      </div>
                    )}
                  </div>
                  <div className="masthead-stats-grid">
                    <div className="masthead-stat">
                      <div className="masthead-stat-label">Marathon Rank</div>
                      <div className="masthead-stat-value">
                        {athlete.marathonRank ? `#${athlete.marathonRank}` : 'N/A'}
                      </div>
                    </div>
                    <div className="masthead-stat">
                      <div className="masthead-stat-label">Personal Best</div>
                      <div className="masthead-stat-value">
                        {athlete.pb || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="tabs-container">
              <div className="tabs-nav">
                {showScoring && scoringData ? (
                  <Button
                    className={`tab-button ${activeTab === 'scoring' ? 'active' : ''}`}
                    onClick={() => setActiveTab('scoring')}
                    variant={activeTab === 'scoring' ? 'solid' : 'ghost'}
                    colorPalette="navy"
                    size="sm"
                  >
                    Scoring Breakdown
                  </Button>
                ) : (
                  <>
                    <Button
                      className={`tab-button ${activeTab === 'bio' ? 'active' : ''}`}
                      onClick={() => setActiveTab('bio')}
                      variant={activeTab === 'bio' ? 'solid' : 'ghost'}
                      colorPalette="navy"
                      size="sm"
                    >
                      Overview
                    </Button>
                    <Button
                      className={`tab-button ${activeTab === 'raceLog' ? 'active' : ''}`}
                      onClick={() => setActiveTab('raceLog')}
                      variant={activeTab === 'raceLog' ? 'solid' : 'ghost'}
                      colorPalette="navy"
                      size="sm"
                    >
                      Race Log
                    </Button>
                    <Button
                      className={`tab-button ${activeTab === 'progression' ? 'active' : ''}`}
                      onClick={() => setActiveTab('progression')}
                      variant={activeTab === 'progression' ? 'solid' : 'ghost'}
                      colorPalette="navy"
                      size="sm"
                    >
                      Progression
                    </Button>
                    <Button
                      className={`tab-button ${activeTab === 'news' ? 'active' : ''}`}
                      onClick={() => setActiveTab('news')}
                      variant={activeTab === 'news' ? 'solid' : 'ghost'}
                      colorPalette="navy"
                      size="sm"
                    >
                      News
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Tab Content */}
            <div className="tab-content-area">
              {activeTab === 'bio' && (
                <div className="tab-panel">
                  {/* Key Statistics */}
                  <div className="content-section">
                    <h3 className="section-heading">Key Statistics</h3>
                    <div className="stats-grid">
                      <div className="stat-card">
                        <div className="stat-card-label">Personal Best</div>
                        <div className="stat-card-value">{athlete.pb || 'N/A'}</div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-card-label">Season Best</div>
                        <div className="stat-card-value">{athlete.seasonBest || 'N/A'}</div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-card-label">Marathon Rank</div>
                        <div className="stat-card-value">
                          {athlete.marathonRank ? `#${athlete.marathonRank}` : 'N/A'}
                        </div>
                      </div>
                      <div className="stat-card highlighted">
                        <div className="stat-card-label">Overall Rank</div>
                        <div className="stat-card-value">
                          {athlete.overallRank ? `#${athlete.overallRank}` : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Profile Information */}
                  <div className="content-section">
                    <h3 className="section-heading">Profile Information</h3>
                    <div className="info-grid">
                      {athlete.dateOfBirth && (
                        <div className="info-row">
                          <span className="info-label">Date of Birth</span>
                          <span className="info-value">{new Date(athlete.dateOfBirth).toLocaleDateString()}</span>
                        </div>
                      )}
                      {athlete.sponsor && (
                        <div className="info-row">
                          <span className="info-label">Sponsor</span>
                          <span className="info-value">{athlete.sponsor}</span>
                        </div>
                      )}
                      {athlete.worldAthleticsId && (
                        <div className="info-row">
                          <span className="info-label">World Athletics ID</span>
                          <span className="info-value">{athlete.worldAthleticsId}</span>
                        </div>
                      )}
                      {athlete.roadRunningRank && (
                        <div className="info-row">
                          <span className="info-label">Road Running Rank</span>
                          <span className="info-value">#{athlete.roadRunningRank}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'raceLog' && (
                <div className="tab-panel">
                  {detailedData?.raceResults && detailedData.raceResults.length > 0 ? (
                    <div className="results-list">
                      {detailedData.raceResults.map((result) => {
                        const date = new Date(result.competitionDate);
                        const formattedDate = date.toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        });
                        
                        return (
                          <div key={result.id} className="result-item">
                            <div className="result-header">
                              <div className="result-competition">{result.competitionName}</div>
                              <div className="result-position">
                                {result.position ? `${result.position}.` : 'N/A'}
                              </div>
                            </div>
                            <div className="result-details">
                              <div className="result-time">{result.finishTime || 'N/A'}</div>
                              <div className="result-venue">{result.venue}</div>
                              <div className="result-date">{formattedDate}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-icon">📅</div>
                      <p>No race results available for this athlete yet</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'progression' && (
                <div className="tab-panel">
                  {detailedData?.progression && detailedData.progression.length > 0 ? (
                    <ProgressionChart progression={detailedData.progression} />
                  ) : (
                    <div className="empty-state">
                      <div className="empty-icon">📈</div>
                      <p>No progression data available for this athlete yet</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'news' && (
                <div className="tab-panel">
                  <div className="empty-state">
                    <div className="empty-icon">📰</div>
                    <p>News feed coming soon</p>
                  </div>
                </div>
              )}

              {activeTab === 'scoring' && scoringData && (
                <div className="tab-panel">
                  {renderScoringBreakdown(scoringData)}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Helper function to format time gap with sub-second precision
function formatTimeGap(gapSeconds: number): string {
  if (!gapSeconds || gapSeconds <= 0) return '0.00s';
  
  if (gapSeconds < 60) {
    return `${gapSeconds.toFixed(2)}s`;
  } else {
    const minutes = Math.floor(gapSeconds / 60);
    const seconds = (gapSeconds % 60).toFixed(2);
    return `${minutes}:${seconds.padStart(5, '0')}`;
  }
}

// Helper function to format time from milliseconds
function formatTimeFromMs(ms: number): string {
  if (!ms || ms <= 0) return '0:00:00';
  
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Helper function to convert pace from ms per meter to min/mile format
function formatPacePerMile(msPerMeter: number): string {
  if (!msPerMeter || msPerMeter <= 0) return 'N/A';
  
  // 1 mile = 1609.34 meters
  const msPerMile = msPerMeter * 1609.34;
  const totalSeconds = Math.floor(msPerMile / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}/mi pace`;
}

// Helper function to render scoring breakdown
function renderScoringBreakdown(scoringData: any) {
  const { totalPoints, breakdown, finishTime, placement, splits } = scoringData;

  // Check for DNS/DNF
  const hasSomeSplits = splits && (splits.split_5k || splits.split_10k || splits.split_half || 
                                   splits.split_30k || splits.split_35k || splits.split_40k);
  const isDNS = !finishTime && !hasSomeSplits;
  const isDNF = !finishTime && hasSomeSplits;

  const getOrdinal = (n: number): string => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const formatBonusName = (type: string): string => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
  };

  if (isDNS) {
    return (
      <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
          color: 'white', padding: '16px 24px', borderRadius: '8px', marginBottom: '24px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px'
        }}>
          <div style={{ fontSize: '32px' }}>⚠️</div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>DNS</div>
            <div style={{ fontSize: '14px', opacity: 0.95 }}>Did Not Start</div>
          </div>
        </div>
        <div style={{ background: '#fff5f5', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #e74c3c' }}>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px', lineHeight: 1.6 }}>
            This athlete was confirmed for the race but did not cross the starting line.
          </p>
        </div>
        <div style={{ marginTop: '24px', padding: '16px', background: '#f8fafc', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>Points Earned</div>
          <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#94a3b8' }}>0</div>
        </div>
      </div>
    );
  }

  if (isDNF) {
    return (
      <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: 'white', padding: '16px 24px', borderRadius: '8px', marginBottom: '24px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px'
        }}>
          <div style={{ fontSize: '32px' }}>🛑</div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>DNF</div>
            <div style={{ fontSize: '14px', opacity: 0.95 }}>Did Not Finish</div>
          </div>
        </div>
        <div style={{ background: '#fff5f5', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #e74c3c' }}>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px', lineHeight: 1.6 }}>
            This athlete started the race but did not cross the finish line.
          </p>
        </div>
        <div style={{ marginTop: '24px', padding: '16px', background: '#f8fafc', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>Points Earned</div>
          <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#94a3b8' }}>0</div>
        </div>
      </div>
    );
  }

  if (!breakdown || totalPoints === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p style={{ color: '#64748b', fontSize: '16px' }}>No scoring data available for this athlete yet.</p>
      </div>
    );
  }

  const medal = placement === 1 ? '🥇' : placement === 2 ? '🥈' : placement === 3 ? '🥉' : '';

  return (
    <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
      {/* Total Points */}
      <div style={{ 
        background: 'linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-orange) 100%)',
        color: 'white', padding: '24px', borderRadius: '12px', marginBottom: '24px', textAlign: 'center'
      }}>
        <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>TOTAL POINTS</div>
        <div style={{ fontSize: '48px', fontWeight: 'bold' }}>{totalPoints}</div>
      </div>

      {/* Placement Points */}
      {breakdown.placement && breakdown.placement.points > 0 && (
        <div style={{ 
          background: '#f8fafc', padding: '20px', borderRadius: '8px', marginBottom: '16px',
          borderLeft: '4px solid var(--primary-blue)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#334155' }}>
              Placement Points
            </h3>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary-blue)' }}>
              +{breakdown.placement.points}
            </span>
          </div>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
            Finished in <strong>{getOrdinal(breakdown.placement.position)}</strong> place
          </p>
        </div>
      )}

      {/* Time Gap Bonus */}
      {breakdown.time_gap && breakdown.time_gap.points > 0 && (
        <div style={{ 
          background: '#f8fafc', padding: '20px', borderRadius: '8px', marginBottom: '16px',
          borderLeft: '4px solid #10b981'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#334155' }}>Time Gap Bonus</h3>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
              +{breakdown.time_gap.points}
            </span>
          </div>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
            Finished <strong>{formatTimeGap(breakdown.time_gap.gap_seconds)}</strong> behind winner
            {breakdown.time_gap.window && (
              <><br /><em>Within {breakdown.time_gap.window.max_gap_seconds}s threshold</em></>
            )}
          </p>
        </div>
      )}

      {/* Performance Bonuses */}
      {breakdown.performance_bonuses && breakdown.performance_bonuses.length > 0 && (
        <div style={{ 
          background: '#f8fafc', padding: '20px', borderRadius: '8px', marginBottom: '16px',
          borderLeft: '4px solid #f59e0b'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#334155' }}>Performance Bonuses</h3>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
              +{breakdown.performance_bonuses.reduce((sum: number, b: any) => sum + b.points, 0)}
            </span>
          </div>
          {breakdown.performance_bonuses.map((bonus: any, idx: number) => {
            // Format bonus details based on type
            let detailsText = '';
            if (bonus.details) {
              if (bonus.type === 'NEGATIVE_SPLIT' && bonus.details.first_half_ms && bonus.details.second_half_ms) {
                const firstHalf = formatTimeFromMs(bonus.details.first_half_ms);
                const secondHalf = formatTimeFromMs(bonus.details.second_half_ms);
                detailsText = `1st half: ${firstHalf} | 2nd half: ${secondHalf}`;
              } else if (bonus.type === 'EVEN_PACE' && bonus.details.first_half_ms && bonus.details.second_half_ms) {
                const firstHalf = formatTimeFromMs(bonus.details.first_half_ms);
                const secondHalf = formatTimeFromMs(bonus.details.second_half_ms);
                const diff = Math.abs(bonus.details.second_half_ms - bonus.details.first_half_ms);
                const diffDisplay = formatTimeFromMs(diff);
                detailsText = `1st half: ${firstHalf} | 2nd half: ${secondHalf} (±${diffDisplay})`;
              } else if (bonus.type === 'FAST_FINISH_KICK') {
                const sprintPace = bonus.details.final_sprint_pace_ms_per_m || bonus.details.last_5k_pace_ms_per_m;
                const first40kPace = bonus.details.first_40k_pace_ms_per_m;
                
                if (sprintPace && first40kPace) {
                  const finalSprintDistance = bonus.details.final_sprint_distance_km || 2.195;
                  const finalSprintPace = formatPacePerMile(sprintPace);
                  const first40kPaceFormatted = formatPacePerMile(first40kPace);
                  detailsText = `Final ${finalSprintDistance.toFixed(2)}km: ${finalSprintPace} pace\nFirst 40km: ${first40kPaceFormatted} pace`;
                }
              }
            }

            return (
              <div key={idx} style={{ 
                padding: '8px 0',
                borderBottom: idx < breakdown.performance_bonuses.length - 1 ? '1px solid #e2e8f0' : 'none'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: detailsText ? '4px' : '0' }}>
                  <span style={{ color: '#475569', fontSize: '14px' }}>
                    {formatBonusName(bonus.type)}
                  </span>
                  <span style={{ color: '#f59e0b', fontWeight: '600', fontSize: '14px' }}>
                    +{bonus.points} pts
                  </span>
                </div>
                {detailsText && (
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', whiteSpace: 'pre-line' }}>
                    {detailsText}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Record Bonuses */}
      {breakdown.record_bonuses && breakdown.record_bonuses.length > 0 && (
        <div style={{ 
          background: '#fff3cd', padding: '20px', borderRadius: '8px', marginBottom: '16px',
          border: '2px solid #ffc107'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#334155' }}>Record Bonuses</h3>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
              +{breakdown.record_bonuses.reduce((sum: number, b: any) => sum + b.points, 0)}
            </span>
          </div>
          {breakdown.record_bonuses.map((record: any, idx: number) => (
            <div key={idx} style={{ 
              display: 'flex', justifyContent: 'space-between', padding: '8px 0',
              borderBottom: idx < breakdown.record_bonuses.length - 1 ? '1px solid #ffd966' : 'none'
            }}>
              <span style={{ color: '#475569', fontSize: '14px' }}>
                {formatBonusName(record.type)}
                {record.status === 'provisional' && ' (Provisional)'}
              </span>
              <span style={{ color: '#f59e0b', fontWeight: '600', fontSize: '14px' }}>
                +{record.points}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper function for country flag gradients based on flag colors
function getCountryGradient(countryCode: string): string {
  const flagColors: Record<string, string[]> = {
    'KEN': ['#BB0000', '#006600', '#000000'], // Kenya - Red, Green, Black
    'ETH': ['#009543', '#FCDD09', '#DA121A'], // Ethiopia - Green, Yellow, Red
    'USA': ['#B22234', '#FFFFFF', '#3C3B6E'], // USA - Red, White, Blue
    'GBR': ['#012169', '#FFFFFF', '#C8102E'], // UK - Blue, White, Red
    'JPN': ['#BC002D', '#FFFFFF'], // Japan - Red, White
    'UGA': ['#000000', '#FCDC04', '#D90000'], // Uganda - Black, Yellow, Red
    'TAN': ['#1EB53A', '#FCD116', '#00A3DD'], // Tanzania - Green, Yellow, Blue
    'GER': ['#000000', '#DD0000', '#FFCE00'], // Germany - Black, Red, Gold
    'FRA': ['#002395', '#FFFFFF', '#ED2939'], // France - Blue, White, Red
    'ESP': ['#AA151B', '#F1BF00'], // Spain - Red, Yellow
    'ITA': ['#009246', '#FFFFFF', '#CE2B37'], // Italy - Green, White, Red
    'NED': ['#21468B', '#FFFFFF', '#AE1C28'], // Netherlands - Blue, White, Red
    'BEL': ['#000000', '#FDDA24', '#EF3340'], // Belgium - Black, Yellow, Red
    'MAR': ['#C1272D', '#006233'], // Morocco - Red, Green
    'ERI': ['#12A2DD', '#EA0000', '#4CA64C'], // Eritrea - Blue, Red, Green
    'BRN': ['#CE1126', '#FFFFFF'], // Bahrain - Red, White
    'CHN': ['#DE2910', '#FFDE00'], // China - Red, Yellow
    'MEX': ['#006847', '#FFFFFF', '#CE1126'], // Mexico - Green, White, Red
    'BRA': ['#009B3A', '#FEDF00', '#002776'], // Brazil - Green, Yellow, Blue
    'CAN': ['#FF0000', '#FFFFFF'], // Canada - Red, White
    'AUS': ['#012169', '#FFFFFF', '#E4002B'], // Australia - Blue, White, Red
    'NOR': ['#BA0C2F', '#FFFFFF', '#00205B'], // Norway - Red, White, Blue
    'SWE': ['#006AA7', '#FECC00'], // Sweden - Blue, Yellow
    'FIN': ['#003580', '#FFFFFF'], // Finland - Blue, White
    'POL': ['#FFFFFF', '#DC143C'], // Poland - White, Red
    'RUS': ['#FFFFFF', '#0039A6', '#D52B1E'], // Russia - White, Blue, Red
    'UKR': ['#0057B7', '#FFD700'], // Ukraine - Blue, Yellow
    'RSA': ['#007A4D', '#FFB612', '#DE3831'], // South Africa - Green, Yellow, Red
    'POR': ['#006600', '#FF0000'], // Portugal - Green, Red
    'IRL': ['#169B62', '#FFFFFF', '#FF883E'], // Ireland - Green, White, Orange
    'BUL': ['#FFFFFF', '#00966E', '#D62612'], // Bulgaria - White, Green, Red
    'ROU': ['#002B7F', '#FCD116', '#CE1126'], // Romania - Blue, Yellow, Red
    'CZE': ['#11457E', '#FFFFFF', '#D7141A'], // Czech Republic - Blue, White, Red
    'HUN': ['#CD2A3E', '#FFFFFF', '#436F4D'], // Hungary - Red, White, Green
    'CRO': ['#FF0000', '#FFFFFF', '#171796'], // Croatia - Red, White, Blue
    'TUR': ['#E30A17', '#FFFFFF'], // Turkey - Red, White
  };
  
  const colors = flagColors[countryCode] || ['#2C39A2', '#6c757d']; // Default to app colors
  
  // Create gradient with 2-3 colors
  if (colors.length === 2) {
    return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`;
  } else if (colors.length === 3) {
    return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 50%, ${colors[2]} 100%)`;
  }
  
  return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 50%, ${colors[2]} 100%)`;
}

// Helper function for country flags
// Maps 3-letter country codes to 2-letter ISO codes for flag emojis
const countryCodeMap: Record<string, string> = {
  'KEN': 'KE', 'ETH': 'ET', 'USA': 'US', 'GBR': 'GB', 'JPN': 'JP',
  'CHN': 'CN', 'BRA': 'BR', 'AUS': 'AU', 'CAN': 'CA', 'DEU': 'DE',
  'FRA': 'FR', 'ITA': 'IT', 'ESP': 'ES', 'NED': 'NL', 'BEL': 'BE',
  'SUI': 'CH', 'AUT': 'AT', 'NOR': 'NO', 'SWE': 'SE', 'DEN': 'DK',
  'FIN': 'FI', 'POL': 'PL', 'CZE': 'CZ', 'HUN': 'HU', 'ROU': 'RO',
  'UKR': 'UA', 'RUS': 'RU', 'TUR': 'TR', 'ISR': 'IL', 'EGY': 'EG',
  'MAR': 'MA', 'ALG': 'DZ', 'TUN': 'TN', 'GHA': 'GH', 'NGR': 'NG',
  'UGA': 'UG', 'TAN': 'TZ', 'RSA': 'ZA', 'MEX': 'MX', 'ARG': 'AR',
  'CHI': 'CL', 'COL': 'CO', 'VEN': 'VE', 'PER': 'PE', 'IND': 'IN',
  'PAK': 'PK', 'BAN': 'BD', 'THA': 'TH', 'VIE': 'VN', 'PHI': 'PH',
  'INA': 'ID', 'MAS': 'MY', 'SIN': 'SG', 'KOR': 'KR', 'PRK': 'KP',
  'NZL': 'NZ', 'IRL': 'IE', 'POR': 'PT', 'GRE': 'GR', 'CRO': 'HR',
  'SRB': 'RS', 'SLO': 'SI', 'SVK': 'SK', 'BUL': 'BG', 'LTU': 'LT',
  'LAT': 'LV', 'EST': 'EE', 'BLR': 'BY', 'ISL': 'IS', 'LUX': 'LU',
  'MLT': 'MT', 'CYP': 'CY', 'ALB': 'AL', 'MKD': 'MK', 'BIH': 'BA',
  'MON': 'MC', 'ARM': 'AM', 'GEO': 'GE', 'KAZ': 'KZ', 'UZB': 'UZ',
  'BAH': 'BS', 'JAM': 'JM', 'TRI': 'TT', 'BAR': 'BB', 'GRN': 'GD',
  'KUW': 'KW', 'QAT': 'QA', 'UAE': 'AE', 'SAU': 'SA', 'BRN': 'BH',
  'OMA': 'OM', 'JOR': 'JO', 'LIB': 'LB', 'SYR': 'SY', 'IRQ': 'IQ',
  'IRI': 'IR', 'AFG': 'AF', 'NEP': 'NP', 'SRI': 'LK', 'MYA': 'MM'
};

// ProgressionChart component with Chart.js integration
interface ProgressionChartProps {
  progression: Array<{
    id: number;
    athleteId: number;
    discipline: string;
    season: number;
    mark: string;
    venue: string;
    competitionDate: string | null;
    competitionName: string | null;
    resultScore: number | null;
  }>;
}

function ProgressionChart({ progression }: ProgressionChartProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const chartRef = React.useRef<any>(null);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('Marathon');
  const [selectedRace, setSelectedRace] = useState<any>(null);

  // Get unique disciplines
  const disciplines = React.useMemo(() => {
    console.log('📊 ProgressionChart - progression data:', progression);
    return [...new Set(progression.map(item => item.discipline))].sort();
  }, [progression]);

  // Set default discipline
  useEffect(() => {
    console.log('📊 ProgressionChart - disciplines:', disciplines);
    if (disciplines.length > 0) {
      setSelectedDiscipline(disciplines.includes('Marathon') ? 'Marathon' : disciplines[0]);
    }
  }, [disciplines]);

  // Render chart when discipline changes or component mounts
  useEffect(() => {
    console.log('📊 ProgressionChart - render effect triggered');
    console.log('  - canvasRef.current:', !!canvasRef.current);
    console.log('  - window.Chart:', typeof (window as any).Chart);
    console.log('  - selectedDiscipline:', selectedDiscipline);
    console.log('  - progression length:', progression.length);
    
    if (!canvasRef.current || typeof window === 'undefined' || !(window as any).Chart) {
      console.warn('📊 ProgressionChart - Missing requirements:', {
        canvas: !!canvasRef.current,
        window: typeof window !== 'undefined',
        Chart: typeof (window as any).Chart
      });
      return;
    }

    const Chart = (window as any).Chart;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Filter by discipline and group by season (best mark per season)
    const filtered = progression.filter(item => item.discipline === selectedDiscipline);
    const grouped = filtered.reduce((acc, item) => {
      const season = item.season;
      if (!acc[season] || item.mark < acc[season].mark) {
        acc[season] = item;
      }
      return acc;
    }, {} as Record<number, any>);

    // Sort by season and limit to last 7 years
    const sorted = Object.values(grouped).sort((a: any, b: any) => 
      parseInt(a.season) - parseInt(b.season)
    );
    const limited = sorted.slice(-7);

    // Convert time strings to seconds for plotting
    const timeToSeconds = (timeStr: string): number | null => {
      if (!timeStr) return null;
      const parts = timeStr.split(':').map(Number);
      if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
      } else if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
      }
      return null;
    };

    const secondsToTime = (seconds: number): string => {
      if (!seconds) return 'N/A';
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      }
      return `${minutes}:${String(secs).padStart(2, '0')}`;
    };

    const chartData = limited.map(item => ({
      x: item.season,
      y: timeToSeconds(item.mark),
      ...item
    }));

    // Destroy previous chart if exists
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    // Create new chart
    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [{
          label: selectedDiscipline,
          data: chartData,
          borderColor: '#2C39A2',
          backgroundColor: 'rgba(2, 2, 2, 0.1)',
          borderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: '#2C39A2',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          tension: 0.2,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'nearest'
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: false
          }
        },
        scales: {
          x: {
            type: 'linear',
            title: {
              display: true,
              text: 'Year',
              font: {
                weight: 'bold',
                size: 13
              }
            },
            ticks: {
              callback: function(value: any) {
                return Math.floor(value);
              },
              stepSize: 1
            },
            grid: {
              display: false
            }
          },
          y: {
            reverse: true, // Lower times are better
            title: {
              display: true,
              text: 'Time',
              font: {
                weight: 'bold',
                size: 13
              }
            },
            ticks: {
              callback: function(value: any) {
                return secondsToTime(value);
              }
            }
          }
        },
        onClick: (event: any, elements: any) => {
          if (elements.length > 0) {
            const index = elements[0].index;
            const data = chartData[index];
            setSelectedRace(data);
          }
        }
      }
    });

    // Cleanup
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [progression, selectedDiscipline]);

  return (
    <>
      <div className="tab-content-header">
        <h3 className="tab-content-title">Season's Best: {selectedDiscipline}</h3>
        {disciplines.length > 1 && (
          <select 
            className="discipline-selector"
            value={selectedDiscipline}
            onChange={(e) => setSelectedDiscipline(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            {disciplines.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        )}
      </div>
      
      <div className="chart-container" style={{ 
        height: '300px', 
        marginBottom: '16px',
        padding: '16px',
        background: '#fff',
        borderRadius: '8px'
      }}>
        <canvas ref={canvasRef}></canvas>
      </div>

      {selectedRace && (
        <div 
          className="selected-race-info"
          style={{
            background: '#f8f9fa',
            padding: '16px',
            borderRadius: '8px',
            marginTop: '16px'
          }}
        >
          <h4 style={{ 
            marginTop: 0, 
            marginBottom: '12px',
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            Race Details
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Year</div>
              <div style={{ fontSize: '14px', fontWeight: '600' }}>{selectedRace.season}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Time</div>
              <div style={{ fontSize: '14px', fontWeight: '600' }}>{selectedRace.mark}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Venue</div>
              <div style={{ fontSize: '14px', fontWeight: '600' }}>{selectedRace.venue || 'Unknown'}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Discipline</div>
              <div style={{ fontSize: '14px', fontWeight: '600' }}>{selectedRace.discipline}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function getCountryFlag(countryCode: string): string {
  // Convert 3-letter code to 2-letter ISO code
  const isoCode = countryCodeMap[countryCode.toUpperCase()] || countryCode.substring(0, 2);
  
  const codePoints = isoCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export default function AthleteModal(props: AthleteModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Only render portal on client-side
  if (!mounted || typeof window === 'undefined') {
    return null;
  }

  return createPortal(
    <AthleteModalContent {...props} />,
    document.body
  );
}
