/**
 * Race Detail Modal
 * 
 * Modal component that displays race details, athletes, and information
 * Used in commissioner dashboard for quick race viewing
 * 
 * UI Migration: Migrated to Chakra UI buttons (Phase 4)
 */

import React, { useState, useEffect } from 'react';
import { Box, Heading, SimpleGrid, VStack } from '@chakra-ui/react';
import { apiClient } from '@/lib/api-client';
import { IconButton, AthleteCard } from '@/components/chakra';

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
                <Box className="race-section" mt={6}>
                  <Heading as="h3" size="md" mb={4} color="navy.800">
                    Confirmed Athletes
                  </Heading>
                  
                  {/* Men */}
                  {race.athletes.men.length > 0 && (
                    <VStack align="stretch" gap={4} mb={6}>
                      <Heading as="h4" size="sm" color="navy.700">
                        Men ({race.athletes.men.length})
                      </Heading>
                      <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
                        {race.athletes.men.map((athlete) => (
                          <AthleteCard
                            key={athlete.id}
                            athlete={{
                              id: athlete.id,
                              name: athlete.name,
                              country: athlete.country,
                              gender: 'M',
                              pb: athlete.pb,
                              rank: athlete.marathonRank || null,
                              salary: null,
                              photoUrl: athlete.headshotUrl || null,
                            }}
                            variant="compact"
                            showPrice={false}
                            showStats={true}
                          />
                        ))}
                      </SimpleGrid>
                    </VStack>
                  )}

                  {/* Women */}
                  {race.athletes.women.length > 0 && (
                    <VStack align="stretch" gap={4}>
                      <Heading as="h4" size="sm" color="navy.700">
                        Women ({race.athletes.women.length})
                      </Heading>
                      <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
                        {race.athletes.women.map((athlete) => (
                          <AthleteCard
                            key={athlete.id}
                            athlete={{
                              id: athlete.id,
                              name: athlete.name,
                              country: athlete.country,
                              gender: 'F',
                              pb: athlete.pb,
                              rank: athlete.marathonRank || null,
                              salary: null,
                              photoUrl: athlete.headshotUrl || null,
                            }}
                            variant="compact"
                            showPrice={false}
                            showStats={true}
                          />
                        ))}
                      </SimpleGrid>
                    </VStack>
                  )}
                </Box>
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
