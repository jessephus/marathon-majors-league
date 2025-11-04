/**
 * AthleteModal Component (Portal-based)
 * 
 * Reusable modal for displaying detailed athlete information.
 * Uses React Portal to render at document root level.
 * Phase 1: Placeholder component structure.
 */

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Athlete } from '@/lib/state-provider';

interface AthleteModalProps {
  athlete: Athlete | null;
  isOpen: boolean;
  onClose: () => void;
  showScoring?: boolean;
}

interface AthleteDetailedData extends Athlete {
  raceLog?: Array<{
    date: string;
    race: string;
    time: string;
    place: number;
  }>;
  progression?: Array<{
    year: number;
    bestTime: string;
  }>;
  news?: Array<{
    date: string;
    headline: string;
    source: string;
  }>;
}

function AthleteModalContent({ athlete, isOpen, onClose, showScoring = false }: AthleteModalProps) {
  const [activeTab, setActiveTab] = useState<'bio' | 'raceLog' | 'progression' | 'news'>('bio');
  const [detailedData, setDetailedData] = useState<AthleteDetailedData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && athlete) {
      loadDetailedData();
    }
  }, [isOpen, athlete]);

  async function loadDetailedData() {
    if (!athlete) return;
    
    setLoading(true);
    // Phase 1: Just use the athlete data we have
    // Phase 2+: Fetch extended data from API
    setDetailedData({
      ...athlete,
      raceLog: [],
      progression: [],
      news: [],
    });
    setLoading(false);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose();
    }
  }

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !athlete) {
    return null;
  }

  return (
    <div className="modal athlete-modal" style={{ display: 'block' }}>
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="modal-content athlete-modal-content">
        <button className="modal-close" onClick={onClose}>
          &times;
        </button>

        {loading ? (
          <div className="loading-state">
            <p>Loading athlete details...</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="athlete-modal-header">
              <div className="athlete-headshot">
                {athlete.headshot_url ? (
                  <img src={athlete.headshot_url} alt={athlete.name} />
                ) : (
                  <div className="headshot-placeholder">
                    {athlete.gender === 'men' ? '🏃‍♂️' : '🏃‍♀️'}
                  </div>
                )}
              </div>
              <div className="athlete-basic-info">
                <h2>{athlete.name}</h2>
                <p className="athlete-country">{athlete.country}</p>
                {athlete.personal_best && (
                  <p className="athlete-pb">PB: {athlete.personal_best}</p>
                )}
                {athlete.salary && (
                  <p className="athlete-salary">Salary: ${athlete.salary.toLocaleString()}</p>
                )}
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="modal-tabs">
              <button
                className={`modal-tab ${activeTab === 'bio' ? 'active' : ''}`}
                onClick={() => setActiveTab('bio')}
              >
                Bio
              </button>
              <button
                className={`modal-tab ${activeTab === 'raceLog' ? 'active' : ''}`}
                onClick={() => setActiveTab('raceLog')}
              >
                Race Log
              </button>
              <button
                className={`modal-tab ${activeTab === 'progression' ? 'active' : ''}`}
                onClick={() => setActiveTab('progression')}
              >
                Progression
              </button>
              <button
                className={`modal-tab ${activeTab === 'news' ? 'active' : ''}`}
                onClick={() => setActiveTab('news')}
              >
                News
              </button>
            </div>

            {/* Tab Content */}
            <div className="modal-tab-content">
              {activeTab === 'bio' && (
                <div className="tab-content-bio">
                  <div className="bio-stats">
                    {athlete.age && (
                      <div className="stat-item">
                        <span className="stat-label">Age:</span>
                        <span className="stat-value">{athlete.age}</span>
                      </div>
                    )}
                    {athlete.sponsor && (
                      <div className="stat-item">
                        <span className="stat-label">Sponsor:</span>
                        <span className="stat-value">{athlete.sponsor}</span>
                      </div>
                    )}
                    {athlete.marathon_rank && (
                      <div className="stat-item">
                        <span className="stat-label">World Ranking:</span>
                        <span className="stat-value">#{athlete.marathon_rank}</span>
                      </div>
                    )}
                    {athlete.world_athletics_id && (
                      <div className="stat-item">
                        <span className="stat-label">World Athletics ID:</span>
                        <span className="stat-value">{athlete.world_athletics_id}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'raceLog' && (
                <div className="tab-content-race-log">
                  <p className="empty-state">Race history will be available in a future update</p>
                </div>
              )}

              {activeTab === 'progression' && (
                <div className="tab-content-progression">
                  <p className="empty-state">Performance progression chart coming soon</p>
                </div>
              )}

              {activeTab === 'news' && (
                <div className="tab-content-news">
                  <p className="empty-state">Recent news will be available in a future update</p>
                </div>
              )}
            </div>

            {showScoring && (
              <div className="athlete-scoring-info">
                <h3>Points Breakdown</h3>
                <p className="empty-state">Scoring details will appear during the race</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
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
