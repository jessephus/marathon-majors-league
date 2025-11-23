/**
 * Race Detail Modal
 * 
 * Modal component that displays race details, athletes, and information
 * Used in commissioner dashboard for quick race viewing
 * 
 * UI Migration: Migrated to Chakra UI buttons (Phase 4)
 */

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { IconButton } from '@/components/chakra';

interface Race {
  id: number;
  name: string;
  date: string;
  location: string;
  distance: string;
  eventType: string;
  worldAthleticsEventId?: string;
  description?: string;
  isActive: boolean;
  athletes?: {
    men: Athlete[];
    women: Athlete[];
  };
}

interface Athlete {
  id: number;
  name: string;
  country: string;
  gender: string;
  pb: string;
  headshotUrl?: string;
  marathonRank?: number;
  bibNumber?: string;
}

interface RaceDetailModalProps {
  raceId: number;
  onClose: () => void;
}

export default function RaceDetailModal({ raceId, onClose }: RaceDetailModalProps) {
  const [race, setRace] = useState<Race | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('🎯 RaceDetailModal rendered with raceId:', raceId);

  useEffect(() => {
    loadRaceDetails();
  }, [raceId]);

  const loadRaceDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch race with athletes
      // NOTE: When an ID is provided, the API returns a single race object, not an array
      const raceData = await apiClient.races.list({ 
        id: raceId, 
        includeAthletes: true 
      });
      
      // Check if we received a race object (API returns single object when id is specified)
      if (raceData && typeof raceData === 'object' && !Array.isArray(raceData)) {
        setRace(raceData);
      } else {
        setError('Race not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load race details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content race-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Race Details</h2>
          <IconButton
            className="close-btn"
            onClick={onClose}
            aria-label="Close race detail modal"
            variant="ghost"
            colorPalette="navy"
            size="sm"
          >
            ×
          </IconButton>
        </div>

        <div className="modal-body">
          {loading && (
            <div className="loading-state">
              <p>Loading race details...</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && race && (
            <>
              {/* Race Header */}
              <div className="race-header">
                <div className="race-title">
                  <h1>{race.name}</h1>
                  <div className="race-meta">
                    <span className="race-location">📍 {race.location}</span>
                    <span className="race-date">📅 {formatDate(race.date)}</span>
                    <span className="race-distance">🏃 {race.distance}</span>
                  </div>
                </div>
                
                {race.isActive && (
                  <div className="race-status active">
                    Active Race
                  </div>
                )}
              </div>

              {/* Race Description */}
              {race.description && (
                <div className="race-section">
                  <h3>About the Race</h3>
                  <div className="race-description">
                    {race.description.split('\n').map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Race Details */}
              <div className="race-section">
                <h3>Race Information</h3>
                <div className="race-details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Date:</span>
                    <span className="detail-value">{formatDate(race.date)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Location:</span>
                    <span className="detail-value">{race.location}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Distance:</span>
                    <span className="detail-value">{race.distance}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Event Type:</span>
                    <span className="detail-value">{race.eventType}</span>
                  </div>
                  {race.worldAthleticsEventId && (
                    <div className="detail-item">
                      <span className="detail-label">World Athletics ID:</span>
                      <span className="detail-value">{race.worldAthleticsEventId}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Confirmed Athletes */}
              {race.athletes && (race.athletes.men.length > 0 || race.athletes.women.length > 0) && (
                <div className="race-section">
                  <h3>Confirmed Athletes</h3>
                  
                  {/* Men */}
                  {race.athletes.men.length > 0 && (
                    <div className="athletes-category">
                      <h4>Men ({race.athletes.men.length})</h4>
                      <div className="athletes-grid">
                        {race.athletes.men.map((athlete) => (
                          <div key={athlete.id} className="athlete-card">
                            {athlete.headshotUrl && (
                              <img 
                                src={athlete.headshotUrl} 
                                alt={athlete.name}
                                className="athlete-photo"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            )}
                            <div className="athlete-info">
                              <div className="athlete-name">{athlete.name}</div>
                              <div className="athlete-details">
                                <span className="athlete-country">{athlete.country}</span>
                                {athlete.pb && <span className="athlete-pb">PB: {athlete.pb}</span>}
                                {athlete.marathonRank && (
                                  <span className="athlete-rank">Rank: #{athlete.marathonRank}</span>
                                )}
                                {athlete.bibNumber && (
                                  <span className="athlete-bib">Bib: {athlete.bibNumber}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Women */}
                  {race.athletes.women.length > 0 && (
                    <div className="athletes-category">
                      <h4>Women ({race.athletes.women.length})</h4>
                      <div className="athletes-grid">
                        {race.athletes.women.map((athlete) => (
                          <div key={athlete.id} className="athlete-card">
                            {athlete.headshotUrl && (
                              <img 
                                src={athlete.headshotUrl} 
                                alt={athlete.name}
                                className="athlete-photo"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            )}
                            <div className="athlete-info">
                              <div className="athlete-name">{athlete.name}</div>
                              <div className="athlete-details">
                                <span className="athlete-country">{athlete.country}</span>
                                {athlete.pb && <span className="athlete-pb">PB: {athlete.pb}</span>}
                                {athlete.marathonRank && (
                                  <span className="athlete-rank">Rank: #{athlete.marathonRank}</span>
                                )}
                                {athlete.bibNumber && (
                                  <span className="athlete-bib">Bib: {athlete.bibNumber}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .race-detail-modal {
          max-width: 900px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #ddd;
          position: sticky;
          top: 0;
          background: white;
          z-index: 10;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 24px;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 28px;
          cursor: pointer;
          color: #666;
          padding: 0;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
        }

        .close-btn:hover {
          background: #f0f0f0;
          color: #000;
        }

        .modal-body {
          padding: 20px;
        }

        .loading-state,
        .error-state {
          text-align: center;
          padding: 40px 20px;
          color: #666;
        }

        .error-state {
          color: #c00;
        }

        .race-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #eee;
        }

        .race-title h1 {
          margin: 0 0 15px 0;
          font-size: 28px;
          color: #333;
        }

        .race-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          color: #666;
          font-size: 14px;
        }

        .race-status {
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
        }

        .race-status.active {
          background-color: #d4edda;
          color: #155724;
        }

        .race-section {
          margin-bottom: 30px;
        }

        .race-section h3 {
          font-size: 20px;
          margin: 0 0 15px 0;
          color: #333;
        }

        .race-section h4 {
          font-size: 18px;
          margin: 20px 0 10px 0;
          color: #555;
        }

        .race-description p {
          margin: 0 0 10px 0;
          line-height: 1.6;
          color: #555;
        }

        .race-details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .detail-label {
          font-weight: 600;
          color: #666;
          font-size: 14px;
        }

        .detail-value {
          color: #333;
          font-size: 16px;
        }

        .athletes-category {
          margin-bottom: 20px;
        }

        .athletes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 15px;
          margin-top: 10px;
        }

        .athlete-card {
          display: flex;
          gap: 12px;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          background: #fafafa;
          transition: all 0.2s;
        }

        .athlete-card:hover {
          border-color: #007bff;
          background: #f0f8ff;
        }

        .athlete-photo {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
        }

        .athlete-info {
          flex: 1;
          min-width: 0;
        }

        .athlete-name {
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 5px;
          color: #333;
        }

        .athlete-details {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          font-size: 12px;
          color: #666;
        }

        .athlete-details span {
          white-space: nowrap;
        }

        .athlete-country {
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .race-detail-modal {
            max-width: 100%;
            height: 100vh;
            border-radius: 0;
          }

          .modal-header h2 {
            font-size: 20px;
          }

          .race-title h1 {
            font-size: 24px;
          }

          .race-meta {
            gap: 10px;
            font-size: 13px;
          }

          .athletes-grid {
            grid-template-columns: 1fr;
          }

          .race-details-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
