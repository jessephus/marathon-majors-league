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
  const [editingResult, setEditingResult] = useState<Partial<AthleteResult> | null>(null);

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

  function handleAddResult() {
    setEditingResult({
      athleteId: 0,
      athleteName: '',
      finishTime: '',
      position: results.length + 1,
    });
  }

  function handleSaveEditingResult() {
    if (!editingResult || !editingResult.athleteId || !editingResult.finishTime) {
      alert('Please fill in athlete ID and finish time');
      return;
    }

    const index = results.findIndex(r => r.athleteId === editingResult.athleteId);
    if (index >= 0) {
      const updated = [...results];
      updated[index] = { ...updated[index], ...editingResult } as AthleteResult;
      setResults(updated);
    } else {
      setResults([...results, editingResult as AthleteResult]);
    }

    setEditingResult(null);
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
          onClick={handleAddResult}
          disabled={saving}
        >
          ➕ Add Result
        </button>
        <button 
          className="btn btn-success" 
          onClick={handleUpdateResults}
          disabled={saving || results.length === 0}
        >
          {saving ? 'Saving...' : '💾 Save Results'}
        </button>
        <button 
          className="btn btn-warning" 
          onClick={handleFinalizeResults}
          disabled={saving || gameState.resultsFinalized}
        >
          {gameState.resultsFinalized ? '✅ Results Finalized' : '🔒 Finalize Results'}
        </button>
      </div>

      <div className="results-list">
        {results.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666' }}>No results yet. Add results to get started.</p>
        ) : (
          <table className="results-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Position</th>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Athlete</th>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Country</th>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Gender</th>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Finish Time</th>
                <th style={{ padding: '0.5rem', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, idx) => (
                <tr key={result.athleteId} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '0.5rem' }}>{result.position}</td>
                  <td style={{ padding: '0.5rem' }}>{result.athleteName}</td>
                  <td style={{ padding: '0.5rem' }}>{result.country}</td>
                  <td style={{ padding: '0.5rem' }}>{result.gender}</td>
                  <td style={{ padding: '0.5rem' }}>{result.finishTime}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => setEditingResult(result)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editingResult && (
        <div className="modal" style={{ display: 'flex' }}>
          <div className="modal-overlay" onClick={() => setEditingResult(null)}></div>
          <div className="modal-content">
            <h3>{editingResult.athleteId ? 'Edit Result' : 'Add Result'}</h3>
            <div className="form-group">
              <label>Athlete ID</label>
              <input
                type="number"
                value={editingResult.athleteId || ''}
                onChange={(e) => setEditingResult({ ...editingResult, athleteId: parseInt(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label>Finish Time</label>
              <input
                type="text"
                placeholder="HH:MM:SS"
                value={editingResult.finishTime || ''}
                onChange={(e) => setEditingResult({ ...editingResult, finishTime: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Position</label>
              <input
                type="number"
                value={editingResult.position || ''}
                onChange={(e) => setEditingResult({ ...editingResult, position: parseInt(e.target.value) })}
              />
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setEditingResult(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveEditingResult}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
