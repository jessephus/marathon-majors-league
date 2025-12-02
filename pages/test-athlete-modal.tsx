/**
 * AthleteModal Test Page
 * 
 * Manual testing page for the AthleteModal component.
 * Navigate to /test-athlete-modal to test the modal.
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { AppStateProvider, useGameState, Athlete } from '@/lib/state-provider';
import { apiClient } from '@/lib/api-client';
import { dynamicImport, CHUNK_NAMES } from '@/lib/dynamic-import';
import { FeatureFlag } from '@/lib/feature-flags';
import { Button } from '@/components/chakra';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';

// Dynamic import AthleteModal with performance tracking
const AthleteModal = dynamicImport(
  () => import(/* webpackChunkName: "chunk-athlete-modal" */ '@/components/AthleteModal'),
  {
    chunkName: CHUNK_NAMES.ATHLETE_MODAL,
    featureFlag: FeatureFlag.DYNAMIC_ATHLETE_MODAL,
    loading: () => (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div>Loading athlete details...</div>
      </div>
    ),
    ssr: false,
  }
);

function AthleteModalTestContent() {
  const { gameState, setGameState } = useGameState();
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mock athlete data for testing when API is unavailable
  const mockAthletes = {
    men: [
      { id: 1, name: 'Kelvin Kiptum', country: 'KEN', pb: '2:00:35', gender: 'men', salary: 14000, marathonRank: 1, overallRank: 1, headshotUrl: null },
      { id: 2, name: 'Eliud Kipchoge', country: 'KEN', pb: '2:01:09', gender: 'men', salary: 12000, marathonRank: 2, overallRank: 2, headshotUrl: null },
      { id: 3, name: 'Kenenisa Bekele', country: 'ETH', pb: '2:01:41', gender: 'men', salary: 10000, marathonRank: 3, overallRank: 5, headshotUrl: null },
      { id: 4, name: 'Tamirat Tola', country: 'ETH', pb: '2:03:39', gender: 'men', salary: 8000, marathonRank: 4, overallRank: 8, headshotUrl: null },
      { id: 5, name: 'Marius Kipserem', country: 'KEN', pb: '2:04:11', gender: 'men', salary: 7000, marathonRank: 5, overallRank: 12, headshotUrl: null },
      { id: 6, name: 'Mohamed Reda El Aaraby', country: 'MAR', pb: '2:05:42', gender: 'men', salary: 5000, marathonRank: 10, overallRank: 25, headshotUrl: null },
    ] as Athlete[],
    women: [
      { id: 101, name: 'Tigst Assefa', country: 'ETH', pb: '2:11:53', gender: 'women', salary: 14000, marathonRank: 1, overallRank: 1, headshotUrl: null },
      { id: 102, name: 'Sifan Hassan', country: 'NED', pb: '2:13:44', gender: 'women', salary: 12000, marathonRank: 2, overallRank: 2, headshotUrl: null },
      { id: 103, name: 'Brigid Kosgei', country: 'KEN', pb: '2:14:04', gender: 'women', salary: 10000, marathonRank: 3, overallRank: 3, headshotUrl: null },
      { id: 104, name: 'Ruth Chepngetich', country: 'KEN', pb: '2:14:18', gender: 'women', salary: 9000, marathonRank: 4, overallRank: 5, headshotUrl: null },
      { id: 105, name: 'Amane Beriso', country: 'ETH', pb: '2:14:58', gender: 'women', salary: 8000, marathonRank: 5, overallRank: 8, headshotUrl: null },
      { id: 106, name: 'Hellen Obiri', country: 'KEN', pb: '2:18:38', gender: 'women', salary: 7000, marathonRank: 8, overallRank: 15, headshotUrl: null },
    ] as Athlete[],
  };

  // Load athletes on mount - fallback to mock data if API fails
  useEffect(() => {
    async function loadAthletes() {
      try {
        const data = await apiClient.athletes.list();
        setGameState({ 
          athletes: {
            men: data.men || [],
            women: data.women || []
          }
        });
        setLoading(false);
      } catch (err) {
        console.error('Failed to load athletes, using mock data:', err);
        // Use mock data when API fails (e.g., no database connection)
        setGameState({ athletes: mockAthletes });
        setLoading(false);
      }
    }
    loadAthletes();
  }, [setGameState]);

  function openModal(athlete: Athlete) {
    setSelectedAthlete(athlete);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    // Keep selectedAthlete for a moment to prevent flash
    setTimeout(() => setSelectedAthlete(null), 300);
  }

  const menAthletes = gameState.athletes.men || [];
  const womenAthletes = gameState.athletes.women || [];

  return (
    <>
      <Head>
        <title>AthleteModal Test - Marathon Majors Fantasy League</title>
        <meta name="description" content="Test page for AthleteModal component" />
      </Head>

      <div className="container">
        <main className="page active">
          {loading ? (
            <div className="loading-state">
              <p>Loading athletes...</p>
            </div>
          ) : (
            <>
              {/* Test Instructions */}
              <div className="test-instructions" style={{ 
                background: '#f0f7ff', 
                padding: '1.5rem', 
                borderRadius: '8px',
                marginBottom: '2rem',
                border: '2px solid #2C39A2'
              }}>
                <h3 style={{ marginTop: 0 }}>Testing Checklist:</h3>
                <ul style={{ marginBottom: 0 }}>
                  <li>✓ Click any athlete card to open modal</li>
                  <li>✓ Modal should render as React portal (outside parent DOM)</li>
                  <li>✓ Close button (×) should work</li>
                  <li>✓ Press Escape key to close modal</li>
                  <li>✓ Click overlay (dark background) to close modal</li>
                  <li>✓ Athlete info should display in header</li>
                  <li>✓ Four tabs should render: Bio, Race Log, Progression, News</li>
                  <li>✓ Tab switching should work</li>
                  <li>✓ Bio tab should show athlete stats</li>
                  <li>✓ Other tabs should show "coming soon" placeholders</li>
                  <li>✓ Modal should prevent body scroll when open</li>
                  <li>✓ Modal should restore scroll when closed</li>
                </ul>
              </div>

              {/* Men's Athletes */}
              <section style={{ marginBottom: '2rem' }}>
                <h2>Men's Athletes ({menAthletes.length})</h2>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: '1rem',
                  marginTop: '1rem'
                }}>
                  {menAthletes.slice(0, 6).map((athlete) => (
                    <div
                      key={athlete.id}
                      onClick={() => openModal(athlete)}
                      style={{
                        border: '2px solid #e0e0e0',
                        borderRadius: '8px',
                        padding: '1rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: 'white'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#6c757d';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 105, 0, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e0e0e0';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>
                        {athlete.name}
                      </h3>
                      <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#666' }}>
                        {athlete.country} • PB: {athlete.pb || 'N/A'}
                      </p>
                      {athlete.salary && (
                        <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#2C39A2', fontWeight: 'bold' }}>
                          ${athlete.salary.toLocaleString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Women's Athletes */}
              <section>
                <h2>Women's Athletes ({womenAthletes.length})</h2>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: '1rem',
                  marginTop: '1rem'
                }}>
                  {womenAthletes.slice(0, 6).map((athlete) => (
                    <div
                      key={athlete.id}
                      onClick={() => openModal(athlete)}
                      style={{
                        border: '2px solid #e0e0e0',
                        borderRadius: '8px',
                        padding: '1rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: 'white'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#6c757d';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 105, 0, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e0e0e0';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>
                        {athlete.name}
                      </h3>
                      <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#666' }}>
                        {athlete.country} • PB: {athlete.pb || 'N/A'}
                      </p>
                      {athlete.salary && (
                        <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#6c757d', fontWeight: 'bold' }}>
                          ${athlete.salary.toLocaleString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </main>

        <footer style={{ marginTop: '2rem', paddingBottom: '2rem' }}>
          <Button 
            variant="outline"
            colorPalette="secondary"
            leftIcon={<ArrowLeftIcon style={{ width: '16px', height: '16px' }} />}
            onClick={() => window.history.back()}
          >
            Back
          </Button>
        </footer>
      </div>

      {/* AthleteModal Component */}
      <AthleteModal
        athlete={selectedAthlete}
        isOpen={isModalOpen}
        onClose={closeModal}
        showScoring={false}
      />
    </>
  );
}

export default function AthleteModalTestPage() {
  return (
    <AppStateProvider>
      <AthleteModalTestContent />
    </AppStateProvider>
  );
}

// Prevent static export - this is a test page that needs runtime data
export const getServerSideProps = () => {
  return { props: {} };
};
