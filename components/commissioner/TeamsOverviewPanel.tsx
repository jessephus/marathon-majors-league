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

interface Athlete {
  id: number;
  name?: string;
  athlete_name?: string;
  gender: string;
  pb?: string;
  personal_best?: string;
  salary?: number;
  country?: string;
}

interface Team {
  playerCode: string;
  teamName: string;
  sessionToken: string | null;
  athletes: Athlete[];
  totalSalary: number;
  score: number;
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
      console.log(`[TeamsOverview] Raw teamDetails response:`, teamDetails);
      
      // Load race results for scoring
      const resultsData: any = await apiClient.results.fetch(currentGameId);
      console.log(`[TeamsOverview] Raw resultsData response:`, resultsData);
      
      // Transform teams object into array - SHOW ALL TEAMS
      const teamsData: Team[] = Object.entries(teamDetails || {}).map(
        ([playerCode, team]: [string, any]) => {
          console.log(`[TeamsOverview] Processing team:`, {
            playerCode,
            displayName: team.displayName,
            sessionToken: team.sessionToken,
            totalSpent: team.totalSpent,
            hasSubmittedRoster: team.hasSubmittedRoster,
            menCount: team.men?.length || 0,
            womenCount: team.women?.length || 0
          });

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

          console.log(`[TeamsOverview] Athletes for ${playerCode}:`, athletes.map(a => ({
            id: a.id,
            name: a.name || a.athlete_name,
            gender: a.gender
          })));

          const score = calculateTeamScore(athletes, resultsData || {});
          console.log(`[TeamsOverview] Calculated score for ${playerCode}:`, score);

          return {
            playerCode,
            teamName: team.displayName || playerCode,
            sessionToken: team.sessionToken || null,
            athletes,
            totalSalary: team.totalSpent || 0,
            score,
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

  function calculateTeamScore(athletes: any[], resultsData: any): number {
    if (!athletes || athletes.length === 0) {
      console.log('[TeamsOverview] calculateTeamScore: No athletes provided');
      return 0;
    }

    // Results structure: { results: {...}, scored: [{athlete_id, points, ...}, ...] }
    const scoredArray = resultsData?.scored || [];
    console.log('[TeamsOverview] calculateTeamScore: Scored array length:', scoredArray.length);
    
    const score = athletes.reduce((total, athlete) => {
      // Find this athlete's scoring data in the scored array
      const athleteScore = scoredArray.find((s: any) => s.athlete_id === athlete.id);
      console.log(`[TeamsOverview] calculateTeamScore: Athlete ${athlete.id} (${athlete.name || athlete.athlete_name}):`, {
        hasScore: !!athleteScore,
        points: athleteScore?.points || 0,
        finishTime: athleteScore?.finish_time
      });
      
      if (!athleteScore || !athleteScore.points) return total;
      return total + athleteScore.points;
    }, 0);

    console.log('[TeamsOverview] calculateTeamScore: Final score:', score);
    return score;
  }

  async function handleCopyPlayerLink(sessionToken: string | null) {
    if (!sessionToken) {
      console.error('No session token available');
      return;
    }

    const currentGameId = gameState.gameId || 'default';
    const playerUrl = `${window.location.origin}/?session=${sessionToken}&game=${currentGameId}`;
    
    try {
      await navigator.clipboard.writeText(playerUrl);
      setCopySuccess(sessionToken);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  function handleViewTeam(sessionToken: string | null) {
    if (!sessionToken) {
      console.error('No session token available');
      return;
    }

    const currentGameId = gameState.gameId || 'default';
    const playerUrl = `${window.location.origin}/?session=${sessionToken}&game=${currentGameId}`;
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
                <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: '600', fontSize: '12px', whiteSpace: 'nowrap' }}>Player Session</th>
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
                      <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>
                        {team.sessionToken?.substring(0, 8) || 'N/A'}
                      </span>
                      <button
                        onClick={() => handleCopyPlayerLink(team.sessionToken)}
                        className="btn btn-sm btn-secondary"
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '11px',
                          minWidth: 'auto'
                        }}
                        title="Copy player link"
                        disabled={!team.sessionToken}
                      >
                        {copySuccess === team.sessionToken ? '✓ Copied' : '📋 Copy Link'}
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
                        onClick={() => handleViewTeam(team.sessionToken)}
                        style={{ padding: '0.25rem 0.5rem', fontSize: '11px' }}
                        disabled={!team.sessionToken}
                      >
                        View
                      </button>
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteTeam(team.playerCode, team.teamName)}
                        style={{ 
                          fontSize: '0.7rem',
                          padding: '0.2rem 0.4rem'
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
