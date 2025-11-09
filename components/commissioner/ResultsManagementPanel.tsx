/**
 * Results Management Panel
 * 
 * Panel for managing race results and finalization.
 * Integrates with state events and API client.
 */

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useGameState } from '@/lib/state-provider';
import SkeletonLoader from './SkeletonLoader';

interface AthleteResult {
  athleteId: number;
  athleteName: string;
  country: string;
  gender: string;
  finishTime: string;
  position: number;
  split5k?: string;
  split10k?: string;
  splitHalf?: string;
  split30k?: string;
  split35k?: string;
  split40k?: string;
}

export default function ResultsManagementPanel() {
  const { gameState, setGameState } = useGameState();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<AthleteResult[]>([]);
  const [editedTimes, setEditedTimes] = useState<Record<number, string>>({});

  // Load results on mount
  useEffect(() => {
    loadResults();
  }, []);

  // Listen for resultsUpdated events
  useEffect(() => {
    const handleResultsUpdate = () => {
      loadResults();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resultsUpdated', handleResultsUpdate);
      return () => window.removeEventListener('resultsUpdated', handleResultsUpdate);
    }
  }, []);

  async function loadResults() {
    try {
      setLoading(true);
      setError(null);
      
      // Use gameId from state manager
      const gameId = gameState.gameId || 'default';
      
      const data: any = await apiClient.results.fetch(gameId);
      
      // Use the scored array which has full athlete info (matches legacy behavior)
      const scoredResults = data.scored || [];
      
      // Filter to only athletes with ANY results
      const athletesWithResults = scoredResults.filter((result: any) => {
        return result.finish_time || result.split_5k || result.split_10k || 
               result.split_half || result.split_30k || result.split_35k || result.split_40k;
      });
      
      // Handle empty results gracefully
      if (athletesWithResults.length === 0) {
        setResults([]);
        return;
      }
      
      // Transform to our interface
      const transformedResults: AthleteResult[] = athletesWithResults.map((result: any) => ({
        athleteId: result.athlete_id,
        athleteName: result.athlete_name || `Athlete ${result.athlete_id}`,
        country: result.country || '-',
        gender: result.gender ? result.gender.charAt(0).toUpperCase() + result.gender.slice(1) : 'Unknown',
        finishTime: result.finish_time || '',
        position: result.placement || 0,
        split5k: result.split_5k,
        split10k: result.split_10k,
        splitHalf: result.split_half,
        split30k: result.split_30k,
        split35k: result.split_35k,
        split40k: result.split_40k,
      }));

      setResults(transformedResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load results');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateResults() {
    try {
      setSaving(true);
      setError(null);

      // Use gameId from state manager
      const gameId = gameState.gameId || 'default';

      const resultsData = results.reduce((acc, result) => {
        acc[result.athleteId] = {
          finishTime: result.finishTime,
          position: result.position,
          split5k: result.split5k,
          split10k: result.split10k,
          splitHalf: result.splitHalf,
          split30k: result.split30k,
          split35k: result.split35k,
          split40k: result.split40k,
        };
        return acc;
      }, {} as Record<number, any>);

      await apiClient.results.update(gameId, resultsData);

      // Emit resultsUpdated event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('resultsUpdated', { detail: { results: resultsData } }));
      }

      // Invalidate leaderboard cache
      invalidateLeaderboardCache();

      alert('Results updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update results');
    } finally {
      setSaving(false);
    }
  }

  async function handleFinalizeResults() {
    if (!confirm('Are you sure you want to finalize results? This action cannot be undone.')) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Use gameId from state manager
      const gameId = gameState.gameId || 'default';

      // Update game state with finalized flag
      await apiClient.gameState.save(gameId, {
        ...gameState,
        resultsFinalized: true,
      });

      setGameState({ resultsFinalized: true });

      // Emit resultsUpdated event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('resultsUpdated', { 
          detail: { finalized: true } 
        }));
      }

      // Invalidate leaderboard cache
      invalidateLeaderboardCache();

      alert('Results finalized successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to finalize results');
    } finally {
      setSaving(false);
    }
  }

  function invalidateLeaderboardCache() {
    // Clear localStorage cache
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('leaderboard_cache_') || key.startsWith('results_cache_')) {
          localStorage.removeItem(key);
        }
      });
    }
  }

  // Handle inline time edit
  function handleTimeChange(athleteId: number, newTime: string) {
    setEditedTimes(prev => ({
      ...prev,
      [athleteId]: newTime
    }));
  }

  // Save individual result
  async function handleSaveResult(athleteId: number) {
    try {
      const newTime = editedTimes[athleteId];
      if (!newTime || !newTime.trim()) {
        alert('Please enter a valid time');
        return;
      }

      // Validate time format (H:MM:SS or HH:MM:SS)
      const timePattern = /^[0-9]{1,2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,3})?$/;
      if (!timePattern.test(newTime)) {
        alert('Invalid time format. Use H:MM:SS or HH:MM:SS (e.g., 2:05:30)');
        return;
      }

      setSaving(true);

      // Get current results from API
      const gameId = gameState.gameId || 'default';
      const data: any = await apiClient.results.fetch(gameId);
      const currentResults = data.results || {};

      // Update the specific athlete's time
      const resultsData = {
        ...currentResults,
        [athleteId]: {
          ...currentResults[athleteId],
          finishTime: newTime,
          finish_time: newTime
        }
      };

      await apiClient.results.update(gameId, resultsData);

      // Update local state
      setResults(prev => prev.map(r => 
        r.athleteId === athleteId 
          ? { ...r, finishTime: newTime }
          : r
      ));

      // Clear the edited time
      setEditedTimes(prev => {
        const updated = { ...prev };
        delete updated[athleteId];
        return updated;
      });

      // Emit resultsUpdated event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('resultsUpdated'));
      }

      // Invalidate cache
      invalidateLeaderboardCache();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save result');
    } finally {
      setSaving(false);
    }
  }

  // Delete individual result
  async function handleDeleteResult(athleteId: number) {
    if (!confirm('Are you sure you want to delete this result?')) {
      return;
    }

    try {
      setSaving(true);

      // Get current results from API
      const gameId = gameState.gameId || 'default';
      const data: any = await apiClient.results.fetch(gameId);
      const currentResults = data.results || {};

      // Remove the athlete's result
      const resultsData = { ...currentResults };
      delete resultsData[athleteId];

      await apiClient.results.update(gameId, resultsData);

      // Update local state
      setResults(prev => prev.filter(r => r.athleteId !== athleteId));

      // Clear any edited time
      setEditedTimes(prev => {
        const updated = { ...prev };
        delete updated[athleteId];
        return updated;
      });

      // Emit resultsUpdated event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('resultsUpdated'));
      }

      // Invalidate cache
      invalidateLeaderboardCache();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete result');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <SkeletonLoader lines={5} />;
  }

  return (
    <div className="results-management-panel">
      <h3>Results Management</h3>

      {error && (
        <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div className="panel-actions" style={{ marginBottom: '1rem' }}>
        <button 
          className="btn btn-primary" 
          onClick={handleUpdateResults}
          disabled={saving || gameState.resultsFinalized}
        >
          {saving ? 'Saving...' : 'Save Results'}
        </button>
        &nbsp;
        <button 
          className="btn btn-warning" 
          onClick={handleFinalizeResults}
          disabled={saving || gameState.resultsFinalized}
        >
          {gameState.resultsFinalized ? 'Results Finalized' : '🔒 Finalize Results'}
        </button>
      </div>

      <div className="results-list">
        {results.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666' }}>No results yet. Add results to get started.</p>
        ) : (
          <table className="results-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '0.5rem', textAlign: 'center' }}>Position</th>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Athlete</th>
                <th style={{ padding: '0.5rem', textAlign: 'center' }}>Country</th>
                <th style={{ padding: '0.5rem', textAlign: 'center' }}>Gender</th>
                <th style={{ padding: '0.5rem', textAlign: 'center' }}>Finish Time</th>
                <th style={{ padding: '0.5rem', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, idx) => (
                <tr key={result.athleteId} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '0.5rem', textAlign: 'center' }}>{result.position || '-'}</td>
                  <td style={{ padding: '0.5rem' }}>{result.athleteName}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'center' }}>{result.country}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'center' }}>{result.gender}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                    <input
                      type="text"
                      placeholder="H:MM:SS"
                      value={editedTimes[result.athleteId] ?? result.finishTime}
                      onChange={(e) => handleTimeChange(result.athleteId, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0',
                        border: 'none',
                        borderRadius: '0',
                        background: 'transparent',
                        fontFamily: 'inherit',
                        fontSize: 'inherit',
                        color: 'inherit',
                        outline: 'none',
                        textAlign: 'center'
                      }}
                    />
                  </td>
                  <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => handleSaveResult(result.athleteId)}
                      disabled={saving}
                      style={{ 
                        marginRight: '0.5rem',
                        fontSize: '0.7rem',
                        padding: '0.2rem 0.4rem'
                      }}
                    >
                      Save
                    </button>
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteResult(result.athleteId)}
                      disabled={saving}
                      style={{
                        fontSize: '0.7rem',
                        padding: '0.2rem 0.4rem'
                      }}
                    >
                      Delete
                    </button>
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
