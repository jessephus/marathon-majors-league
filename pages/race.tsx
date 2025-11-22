/**
 * Race Detail Page
 * 
 * Public page displaying information about a specific race:
 * - Race name, date, location
 * - Description and news updates
 * - List of confirmed athletes
 * - Race details (distance, event type)
 */

import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { GetServerSidePropsContext } from 'next';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import Footer from '@/components/Footer';

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

interface RacePageProps {
  raceId: string | null;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id } = context.query;
  
  return {
    props: {
      raceId: id ? String(id) : null,
    },
  };
}

export default function RacePage({ raceId }: RacePageProps) {
  const router = useRouter();
  const [race, setRace] = useState<Race | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRaceDetails();
  }, [raceId]);

  const loadRaceDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // If no race ID provided, fetch active races and use the first one
      if (!raceId) {
        const activeRaces = await apiClient.races.list({ active: true });
        
        // Handle both array and single object responses
        if (Array.isArray(activeRaces) && activeRaces.length > 0) {
          // Fetch the first active race with athletes
          const raceData = await apiClient.races.list({ 
            id: activeRaces[0].id, 
            includeAthletes: true 
          });
          
          // Handle response type - could be object or array
          if (Array.isArray(raceData) && raceData.length > 0) {
            setRace(raceData[0]);
          } else if (!Array.isArray(raceData) && raceData) {
            setRace(raceData);
          } else {
            setError('Race not found');
          }
        } else if (!Array.isArray(activeRaces) && activeRaces) {
          // If API returns a single object when active=true
          setRace(activeRaces);
        } else {
          setError('No active races found');
        }
        return;
      }
      
      // Fetch race with athletes
      // NOTE: When an ID is provided, the API returns a single race object, not an array
      const raceData = await apiClient.races.list({ 
        id: parseInt(raceId!), 
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading Race... | Marathon Majors Fantasy League</title>
        </Head>
        <div className="race-page">
          <div className="container">
            <p>Loading race details...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !race) {
    return (
      <>
        <Head>
          <title>Race Not Found | Marathon Majors Fantasy League</title>
        </Head>
        <div className="race-page">
          <div className="container">
            <div className="error-message">
              <h2>Race Not Found</h2>
              <p>{error || 'The requested race could not be found.'}</p>
              <Link href="/" className="btn btn-primary">
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{race.name} | Marathon Majors Fantasy League</title>
        <meta name="description" content={race.description || `${race.name} - ${race.location}`} />
      </Head>

      <div className="race-page">
        <div className="container">
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

          {/* Race Description / News */}
          {race.description && (
            <div className="race-section">
              <h2>About the Race</h2>
              <div className="race-description">
                {race.description.split('\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
          )}

          {/* Race Details */}
          <div className="race-section">
            <h2>Race Details</h2>
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
              <h2>Confirmed Athletes</h2>
              
              {/* Men */}
              {race.athletes.men.length > 0 && (
                <div className="athletes-category">
                  <h3>Men ({race.athletes.men.length})</h3>
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
                  <h3>Women ({race.athletes.women.length})</h3>
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

          {/* Call to Action */}
          <div className="race-cta">
            <Link href="/">
              <a className="btn btn-primary btn-lg">
                Create Your Fantasy Team
              </a>
            </Link>
          </div>
        </div>

        <Footer />
      </div>

      <style jsx>{`
        .race-page {
          min-height: 100vh;
          background: #f5f5f5;
          padding: 20px;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          background: white;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
          font-size: 32px;
          color: #333;
        }

        .race-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          color: #666;
          font-size: 16px;
        }

        .race-status {
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
        }

        .race-status.active {
          background: #e7f5e7;
          color: #2d7c2d;
        }

        .race-section {
          margin-bottom: 40px;
        }

        .race-section h2 {
          font-size: 24px;
          margin-bottom: 20px;
          color: #333;
        }

        .race-description {
          line-height: 1.6;
          color: #555;
        }

        .race-description p {
          margin-bottom: 15px;
        }

        .race-details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
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
          margin-bottom: 30px;
        }

        .athletes-category h3 {
          font-size: 20px;
          margin-bottom: 15px;
          color: #333;
        }

        .athletes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 15px;
        }

        .athlete-card {
          display: flex;
          gap: 12px;
          padding: 12px;
          background: #f9f9f9;
          border-radius: 8px;
          transition: background 0.2s;
        }

        .athlete-card:hover {
          background: #f0f0f0;
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
        }

        .athlete-name {
          font-weight: 600;
          color: #333;
          margin-bottom: 5px;
        }

        .athlete-details {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          font-size: 13px;
          color: #666;
        }

        .race-cta {
          text-align: center;
          padding: 40px 0 20px;
          border-top: 2px solid #eee;
        }

        .btn {
          display: inline-block;
          padding: 12px 24px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.2s;
          cursor: pointer;
          border: none;
        }

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .btn-primary:hover {
          background: #0056b3;
        }

        .btn-lg {
          padding: 16px 32px;
          font-size: 18px;
        }

        .error-message {
          text-align: center;
          padding: 60px 20px;
        }

        .error-message h2 {
          color: #c00;
          margin-bottom: 15px;
        }

        .error-message p {
          color: #666;
          margin-bottom: 25px;
        }

        @media (max-width: 768px) {
          .container {
            padding: 20px;
          }

          .race-header {
            flex-direction: column;
            gap: 15px;
          }

          .race-title h1 {
            font-size: 24px;
          }

          .race-meta {
            font-size: 14px;
            gap: 15px;
          }

          .athletes-grid {
            grid-template-columns: 1fr;
          }

          .race-details-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
