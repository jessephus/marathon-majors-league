/**
 * Athletes Browser Page
 * 
 * Browse and explore all elite marathon athletes in the database.
 * Features filtering, sorting, and detailed athlete information.
 * 
 * Based on AthleteSelectionModal component but adapted for standalone page use.
 * 
 * UI Migration: Migrated to Chakra UI buttons (Phase 4)
 */

import React, { useState, useMemo, useEffect } from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { getRunnerSvg } from '@/lib/ui-helpers';
import { dynamicImport, CHUNK_NAMES } from '@/lib/dynamic-import';
import { FeatureFlag } from '@/lib/feature-flags';
import { Button } from '@/components/chakra';

// Dynamic import AthleteModal
const AthleteModal = dynamicImport(
  () => import('../components/AthleteModal'),
  {
    chunkName: CHUNK_NAMES.ATHLETE_MODAL,
    featureFlag: FeatureFlag.DYNAMIC_ATHLETE_MODAL,
    loading: () => null,
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

interface AthletesPageProps {
  athletes: {
    men: Athlete[];
    women: Athlete[];
  };
}

export default function AthletesPage({ athletes }: AthletesPageProps) {
  const [gender, setGender] = useState<'men' | 'women'>('men');
  const [sortBy, setSortBy] = useState<'salary' | 'pb' | 'rank'>('salary');
  const [showConfirmedOnly, setShowConfirmedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [detailAthlete, setDetailAthlete] = useState<Athlete | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Helper function to convert time string to seconds for sorting
  const convertTimeToSeconds = (timeStr: string): number => {
    const parts = timeStr.split(':');
    if (parts.length === 3) {
      const hours = parseInt(parts[0]);
      const minutes = parseInt(parts[1]);
      const seconds = parseFloat(parts[2]);
      return hours * 3600 + minutes * 60 + seconds;
    }
    return 999999;
  };

  // Get athletes for current gender
  const currentAthletes = gender === 'men' ? athletes.men : athletes.women;

  // Filter and sort athletes
  const sortedAthletes = useMemo(() => {
    let sorted = [...currentAthletes];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      sorted = sorted.filter(athlete => 
        athlete.name.toLowerCase().includes(query) ||
        athlete.country.toLowerCase().includes(query)
      );
    }

    // Filter by NYC confirmation status
    if (showConfirmedOnly) {
      sorted = sorted.filter(athlete => athlete.nycConfirmed === true);
    }

    // Sort athletes
    sorted.sort((a, b) => {
      switch (sortBy) {
        case 'salary':
          return b.salary - a.salary;
        case 'pb':
          return convertTimeToSeconds(a.pb) - convertTimeToSeconds(b.pb);
        case 'rank':
          return (a.marathonRank || 999) - (b.marathonRank || 999);
        default:
          return 0;
      }
    });

    return sorted;
  }, [currentAthletes, sortBy, showConfirmedOnly, searchQuery]);

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

  return (
    <>
      <Head>
        <title>Athletes - Marathon Majors Fantasy League</title>
        <meta name="description" content="Browse elite marathon athletes" />
      </Head>

      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '20px',
        minHeight: '100vh'
      }}>
        {/* Page Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            color: '#161C4F',
            marginBottom: '8px'
          }}>
            Elite Marathon Athletes
          </h1>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>
            Browse and explore the world's top marathon runners
          </p>
        </div>

        {/* Gender Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '16px',
          borderBottom: '2px solid #e5e7eb'
        }}>
          <Button
            onClick={() => setGender('men')}
            variant={gender === 'men' ? 'solid' : 'ghost'}
            colorPalette="navy"
            size="md"
            style={{
              borderBottom: gender === 'men' ? '3px solid #161C4F' : '3px solid transparent',
              borderRadius: '0',
              marginBottom: '-2px'
            }}
          >
            Men ({athletes.men.length})
          </Button>
          <Button
            onClick={() => setGender('women')}
            variant={gender === 'women' ? 'solid' : 'ghost'}
            colorPalette="navy"
            size="md"
            style={{
              borderBottom: gender === 'women' ? '3px solid #161C4F' : '3px solid transparent',
              borderRadius: '0',
              marginBottom: '-2px'
            }}
          >
            Women ({athletes.women.length})
          </Button>
        </div>

        {/* Search and Filters */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '12px',
          marginBottom: '20px',
          padding: '16px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          {/* Search Bar */}
          <input
            type="text"
            placeholder="Search by name or country..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '10px 16px',
              fontSize: '16px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#161C4F'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />

          {/* Sort Tabs */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ 
              color: '#6b7280', 
              fontSize: '14px',
              alignSelf: 'center',
              marginRight: '8px'
            }}>
              Sort by:
            </span>
            <Button
              onClick={() => setSortBy('salary')}
              variant={sortBy === 'salary' ? 'solid' : 'outline'}
              colorPalette="navy"
              size="sm"
            >
              Salary
            </Button>
            <Button
              onClick={() => setSortBy('pb')}
              variant={sortBy === 'pb' ? 'solid' : 'outline'}
              colorPalette="navy"
              size="sm"
            >
              Personal Best
            </Button>
            <Button
              onClick={() => setSortBy('rank')}
              variant={sortBy === 'rank' ? 'solid' : 'outline'}
              colorPalette="navy"
              size="sm"
            >
              World Rank
            </Button>
          </div>

          {/* Filter Checkbox */}
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

        {/* Results Count */}
        <div style={{ 
          marginBottom: '16px',
          color: '#6b7280',
          fontSize: '14px'
        }}>
          Showing {sortedAthletes.length} athlete{sortedAthletes.length !== 1 ? 's' : ''}
        </div>

        {/* Athlete Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
          marginBottom: '40px'
        }}>
          {sortedAthletes.length === 0 ? (
            <div style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '40px',
              color: '#6b7280',
              fontSize: '16px'
            }}>
              No athletes found matching your criteria
            </div>
          ) : (
            sortedAthletes.map((athlete) => {
              const headshotUrl = athlete.headshotUrl || getRunnerSvg(gender);
              const rankDisplay = athlete.marathonRank ? `#${athlete.marathonRank}` : 'Unranked';
              
              return (
                <div
                  key={athlete.id}
                  onClick={() => handleShowAthleteDetail(athlete)}
                  style={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/* Athlete Headshot */}
                  <div style={{ 
                    width: '100%',
                    aspectRatio: '1',
                    marginBottom: '12px',
                    overflow: 'hidden',
                    borderRadius: '8px',
                    backgroundColor: '#f3f4f6'
                  }}>
                    <img 
                      src={headshotUrl} 
                      alt={athlete.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        e.currentTarget.src = getRunnerSvg(gender);
                      }}
                    />
                  </div>

                  {/* Athlete Info */}
                  <div>
                    <div style={{ 
                      fontSize: '18px', 
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: '4px'
                    }}>
                      {athlete.name}
                    </div>
                    
                    <div style={{ 
                      fontSize: '14px', 
                      color: '#6b7280',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span>{getCountryFlag(athlete.country)}</span>
                      <span>{athlete.country}</span>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '4px'
                    }}>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>PB:</span>
                      <span style={{ 
                        fontSize: '14px', 
                        fontWeight: '600',
                        color: '#111827'
                      }}>
                        {athlete.pb}
                      </span>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '4px'
                    }}>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>Rank:</span>
                      <span style={{ 
                        fontSize: '14px', 
                        fontWeight: '600',
                        color: '#111827'
                      }}>
                        {rankDisplay}
                      </span>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      paddingTop: '8px',
                      borderTop: '1px solid #e5e7eb',
                      marginTop: '8px'
                    }}>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>Salary:</span>
                      <span style={{ 
                        fontSize: '16px', 
                        fontWeight: '700',
                        color: '#D4AF37'
                      }}>
                        {formatCurrency(athlete.salary)}
                      </span>
                    </div>

                    {athlete.nycConfirmed && (
                      <div style={{
                        marginTop: '8px',
                        padding: '4px 8px',
                        backgroundColor: '#dcfce7',
                        color: '#166534',
                        fontSize: '12px',
                        fontWeight: '600',
                        borderRadius: '4px',
                        textAlign: 'center'
                      }}>
                        NYC Confirmed
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Athlete Detail Modal */}
      {isDetailModalOpen && detailAthlete && (
        <AthleteModal
          isOpen={isDetailModalOpen}
          athlete={detailAthlete}
          onClose={handleCloseDetailModal}
        />
      )}
    </>
  );
}

// Server-side data fetching
export const getServerSideProps: GetServerSideProps = async () => {
  try {
    // Fetch athletes from API
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/athletes`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch athletes');
    }

    const athletes = await response.json();

    return {
      props: {
        athletes,
      },
    };
  } catch (error) {
    console.error('Error fetching athletes:', error);
    
    // Return empty data on error
    return {
      props: {
        athletes: {
          men: [],
          women: [],
        },
      },
    };
  }
};
