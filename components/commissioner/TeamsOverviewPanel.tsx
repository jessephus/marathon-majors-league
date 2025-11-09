/**
 * Teams Overview Panel
 * 
 * Panel for viewing and managing all teams in the game.
 * Integrates with state events and API client.
 */

import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api-client';
import { useGameState } from '@/lib/state-provider';
import SkeletonLoader from './SkeletonLoader';

interface Team {
  playerCode: string;
  teamName: string;
  athletes: {
    id: number;
    name: string;
    gender: string;
    salary?: number;
  }[];
  totalSalary: number;
  score?: number;
  hasSubmittedRoster: boolean;
}

export default function TeamsOverviewPanel() {
  const { gameState } = useGameState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  
  // Prevent duplicate loads on mount (React 18 double-render in dev mode)
  const hasLoadedRef = useRef(false);
  const lastGameIdRef = useRef<string | null>(null);

  // Load teams on mount and when gameId changes
  useEffect(() => {
    const currentGameId = gameState.gameId || 'default';
    
    // Skip if already loaded this gameId (prevents duplicate API calls)
    if (hasLoadedRef.current && lastGameIdRef.current === currentGameId) {
      return;
    }
    
    hasLoadedRef.current = true;
    lastGameIdRef.current = currentGameId;

    console.log(`[TeamsOverview] Loading teams for gameId: "${currentGameId}"`);
    loadTeams();
  }, [gameState.gameId]);

  // Listen for state updates
  useEffect(() => {
    const handleUpdate = () => {
      loadTeams();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resultsUpdated', handleUpdate);
      window.addEventListener('athleteUpdated', handleUpdate);
      return () => {
        window.removeEventListener('resultsUpdated', handleUpdate);
        window.removeEventListener('athleteUpdated', handleUpdate);
      };
    }
  }, []);

  async function loadTeams() {
    try {
      setLoading(true);
      setError(null);

      const currentGameId = gameState.gameId || 'default';

      // Load salary cap draft teams for all players
      const teamDetails: any = await apiClient.salaryCapDraft.getTeam(currentGameId);
      
      // Load race results for scoring
      const resultsData: any = await apiClient.results.fetch(currentGameId);
      
      // Transform teams object into array - SHOW ALL TEAMS
      const teamsData: Team[] = Object.entries(teamDetails || {}).map(
        ([playerCode, team]: [string, any]) => {
          const athletes = [
            ...(team.men || []).map((a: any) => ({ 
              ...a, 
              gender: 'men',
              pb: a.pb || a.personal_best 
            })),
            ...(team.women || []).map((a: any) => ({ 
              ...a, 
              gender: 'women',
              pb: a.pb || a.personal_best 
            }))
          ];

          return {
            playerCode,
            teamName: team.displayName || playerCode,
            athletes,
            totalSalary: team.totalSpent || 0,
            score: calculateTeamScore(athletes, resultsData || {}),
            hasSubmittedRoster: team.hasSubmittedRoster || false,
          };
        }
      );

      setTeams(teamsData);

      console.log(`[TeamsOverview] Final teams array:`, teamsData);
      console.log(`[TeamsOverview] Submitted teams count:`, teamsData.length);
      setTeams(teamsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  }

  function calculateTeamScore(athletes: any[], results: Record<string, any>): number {
    if (!athletes) return 0;
    
    return athletes.reduce((total, athlete) => {
      const result = results[athlete.id];
      if (!result || !result.points) return total;
      return total + result.points;
    }, 0);
  }

  async function handleCopyPlayerLink(playerCode: string) {
    const playerUrl = `${window.location.origin}/salary-cap-draft?session=${playerCode}`;
    
    try {
      await navigator.clipboard.writeText(playerUrl);
      setCopySuccess(playerCode);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  function handleViewTeam(playerCode: string) {
    const playerUrl = `${window.location.origin}/salary-cap-draft?session=${playerCode}`;
    window.open(playerUrl, '_blank');
  }

  async function handleDeleteTeam(playerCode: string, teamName: string) {
    if (!confirm(`Are you sure you want to delete team "${teamName}"? This will soft-delete the session.`)) {
      return;
    }

    try {
      const currentGameId = gameState.gameId || 'default';
      
      // Soft delete the anonymous session
      const response = await fetch(`/api/session/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: currentGameId,
          playerCode: playerCode
        })
      });

      if (!response.ok) {
        throw new Error('Failed to delete team');
      }

      // Reload teams list
      await loadTeams();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete team');
    }
  }

  if (loading) {
    return <SkeletonLoader lines={5} />;
  }

  return (
    <div className="teams-overview-panel">
      <h3>Teams Overview</h3>

      {error && (
        <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div className="teams-list">
        {teams.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666' }}>No teams yet</p>
        ) : (
          <table className="teams-table" style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            fontSize: '14px',
          }}>
            <thead>
              <tr style={{ 
                backgroundColor: '#2C39A2',
                color: 'white',
              }}>
                <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: '600', fontSize: '12px', whiteSpace: 'nowrap' }}>Team Name</th>
                <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: '600', fontSize: '12px', whiteSpace: 'nowrap' }}>Player Code</th>
                <th style={{ padding: '0.5rem', textAlign: 'center', fontWeight: '600', fontSize: '12px', whiteSpace: 'nowrap' }}>Roster Status</th>
                <th style={{ padding: '0.5rem', textAlign: 'right', fontWeight: '600', fontSize: '12px', whiteSpace: 'nowrap' }}>Total Salary</th>
                <th style={{ padding: '0.5rem', textAlign: 'right', fontWeight: '600', fontSize: '12px', whiteSpace: 'nowrap' }}>Score</th>
                <th style={{ padding: '0.5rem', textAlign: 'center', fontWeight: '600', fontSize: '12px', whiteSpace: 'nowrap' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, index) => (
                <tr 
                  key={team.playerCode} 
                  style={{ 
                    borderBottom: '1px solid #eee',
                    backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9',
                  }}
                >
                  <td style={{ padding: '0.5rem' }}>{team.teamName}</td>
                  <td style={{ padding: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>{team.playerCode}</span>
                      <button
                        onClick={() => handleCopyPlayerLink(team.playerCode)}
                        className="btn btn-sm btn-secondary"
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '11px',
                          minWidth: 'auto'
                        }}
                        title="Copy player link"
                      >
                        {copySuccess === team.playerCode ? '✓ Copied' : '📋 Copy Link'}
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                    {team.hasSubmittedRoster ? (
                      <span style={{ color: '#28a745', fontWeight: 'bold' }}>✓ Submitted</span>
                    ) : (
                      <span style={{ color: '#6c757d' }}>Pending</span>
                    )}
                  </td>
                  <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                    ${team.totalSalary.toLocaleString()}
                  </td>
                  <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                    {team.score?.toFixed(1) || '-'}
                  </td>
                  <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button 
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleViewTeam(team.playerCode)}
                        style={{ padding: '0.25rem 0.5rem', fontSize: '11px' }}
                      >
                        View
                      </button>
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteTeam(team.playerCode, team.teamName)}
                        style={{ 
                          padding: '0.25rem 0.5rem', 
                          fontSize: '11px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
