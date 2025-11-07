/**
 * Teams Overview Panel
 * 
 * Panel for viewing and managing all teams in the game.
 * Integrates with state events and API client.
 */

import React, { useState, useEffect } from 'react';
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
}

export default function TeamsOverviewPanel() {
  const { gameState } = useGameState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  // Load teams on mount
  useEffect(() => {
    loadTeams();
  }, []);

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

      // Load game state to get teams
      const data: any = await apiClient.gameState.load('default');
      
      // Transform teams data
      const teamsData: Team[] = Object.entries(data.teams || {}).map(
        ([playerCode, team]: [string, any]) => {
          const totalSalary = team.athletes?.reduce((sum: number, a: any) => sum + (a.salary || 0), 0) || 0;
          
          return {
            playerCode,
            teamName: team.teamName || playerCode,
            athletes: team.athletes || [],
            totalSalary,
            score: calculateTeamScore(team.athletes, data.results || {}),
          };
        }
      );

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

  function handleViewTeam(team: Team) {
    setSelectedTeam(team);
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

      <div className="teams-summary" style={{ marginBottom: '1rem' }}>
        <div className="stats-row" style={{ display: 'flex', gap: '1rem' }}>
          <div className="stat-card" style={{ flex: 1, padding: '1rem', border: '1px solid #ddd', borderRadius: '4px' }}>
            <div className="stat-label" style={{ fontSize: '0.875rem', color: '#666' }}>Total Teams</div>
            <div className="stat-value" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{teams.length}</div>
          </div>
          <div className="stat-card" style={{ flex: 1, padding: '1rem', border: '1px solid #ddd', borderRadius: '4px' }}>
            <div className="stat-label" style={{ fontSize: '0.875rem', color: '#666' }}>Total Players</div>
            <div className="stat-value" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{gameState.players.length}</div>
          </div>
          <div className="stat-card" style={{ flex: 1, padding: '1rem', border: '1px solid #ddd', borderRadius: '4px' }}>
            <div className="stat-label" style={{ fontSize: '0.875rem', color: '#666' }}>Draft Status</div>
            <div className="stat-value" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              {gameState.draftComplete ? '✅ Complete' : '⏳ Pending'}
            </div>
          </div>
        </div>
      </div>

      <div className="teams-list">
        {teams.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666' }}>No teams yet</p>
        ) : (
          <table className="teams-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Team Name</th>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Player Code</th>
                <th style={{ padding: '0.5rem', textAlign: 'center' }}>Athletes</th>
                <th style={{ padding: '0.5rem', textAlign: 'right' }}>Total Salary</th>
                <th style={{ padding: '0.5rem', textAlign: 'right' }}>Score</th>
                <th style={{ padding: '0.5rem', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <tr key={team.playerCode} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '0.5rem' }}>{team.teamName}</td>
                  <td style={{ padding: '0.5rem' }}>{team.playerCode}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'center' }}>{team.athletes.length}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                    ${team.totalSalary.toLocaleString()}
                  </td>
                  <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                    {team.score?.toFixed(1) || '-'}
                  </td>
                  <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleViewTeam(team)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Team Detail Modal */}
      {selectedTeam && (
        <div className="modal" style={{ display: 'flex' }}>
          <div className="modal-overlay" onClick={() => setSelectedTeam(null)}></div>
          <div className="modal-content">
            <h3>{selectedTeam.teamName}</h3>
            
            <div className="team-details" style={{ marginBottom: '1rem' }}>
              <p><strong>Player Code:</strong> {selectedTeam.playerCode}</p>
              <p><strong>Total Salary:</strong> ${selectedTeam.totalSalary.toLocaleString()}</p>
              {selectedTeam.score !== undefined && (
                <p><strong>Current Score:</strong> {selectedTeam.score.toFixed(1)} points</p>
              )}
            </div>

            <h4>Team Roster</h4>
            <div className="roster-list">
              {selectedTeam.athletes.length === 0 ? (
                <p style={{ color: '#666' }}>No athletes selected</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Name</th>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Gender</th>
                      <th style={{ padding: '0.5rem', textAlign: 'right' }}>Salary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTeam.athletes.map((athlete) => (
                      <tr key={athlete.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '0.5rem' }}>{athlete.name}</td>
                        <td style={{ padding: '0.5rem' }}>{athlete.gender}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                          ${athlete.salary?.toLocaleString() || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="form-actions" style={{ marginTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedTeam(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
