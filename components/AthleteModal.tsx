/**
 * AthleteModal Component (Portal-based)
 * 
 * Reusable modal for displaying detailed athlete information.
 * Uses React Portal to render at document root level.
 * Phase 1: Placeholder component structure.
 */

import React, { useEffect, useState, useCallback } from 'react';
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
    if (!isOpen || !athlete) return;
    
    async function fetchDetailedData() {
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
    
    fetchDetailedData();
  }, [isOpen, athlete]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

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

  if (!isOpen || !athlete) {
    return null;
  }

  return (
    <div className="modal athlete-modal active">
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="athlete-card-container">
        <button className="modal-close" onClick={onClose}>
          &times;
        </button>

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
                <button
                  className={`tab-button ${activeTab === 'bio' ? 'active' : ''}`}
                  onClick={() => setActiveTab('bio')}
                >
                  Overview
                </button>
                <button
                  className={`tab-button ${activeTab === 'raceLog' ? 'active' : ''}`}
                  onClick={() => setActiveTab('raceLog')}
                >
                  Race Log
                </button>
                <button
                  className={`tab-button ${activeTab === 'progression' ? 'active' : ''}`}
                  onClick={() => setActiveTab('progression')}
                >
                  Progression
                </button>
                <button
                  className={`tab-button ${activeTab === 'news' ? 'active' : ''}`}
                  onClick={() => setActiveTab('news')}
                >
                  News
                </button>
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
                  <p className="empty-state-message">Race history will be available in a future update</p>
                </div>
              )}

              {activeTab === 'progression' && (
                <div className="tab-panel">
                  <p className="empty-state-message">Performance progression chart coming soon</p>
                </div>
              )}

              {activeTab === 'news' && (
                <div className="tab-panel">
                  <p className="empty-state-message">Recent news will be available in a future update</p>
                </div>
              )}
            </div>

            {showScoring && (
              <div className="athlete-scoring-info">
                <h3>Points Breakdown</h3>
                <p className="empty-state-message">Scoring details will appear during the race</p>
              </div>
            )}
          </>
        )}
      </div>
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
  
  const colors = flagColors[countryCode] || ['#2C39A2', '#ff6900']; // Default to app colors
  
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
