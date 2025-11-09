/**
 * Results Management Panel
 * 
 * Panel for managing race results and finalization.
 * Integrates with state events and API client.
 */

import React, { useState, useEffect, useRef } from 'react';
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

interface NewResultRow {
  athleteId: number;
  athleteName: string;
  country: string;
  gender: string;
  position: number;
  time: string;
}

export default function ResultsManagementPanel() {
  const { gameState, setGameState } = useGameState();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<AthleteResult[]>([]);
  const [editedTimes, setEditedTimes] = useState<Record<number, string>>({});
  const [selectedSplit, setSelectedSplit] = useState<string>('finishTime');
  const [allAthletes, setAllAthletes] = useState<any[]>([]);
  const [newRow, setNewRow] = useState<NewResultRow | null>(null);
  
  // Track if initial load is in progress to prevent duplicate fetches
  const loadingRef = useRef(false);

  // Split options
  const splitOptions = [
    { value: 'finishTime', label: 'Finish Time' },
    { value: 'split5k', label: '5K Split' },
    { value: 'split10k', label: '10K Split' },
    { value: 'splitHalf', label: 'Half Marathon Split' },
    { value: 'split30k', label: '30K Split' },
    { value: 'split35k', label: '35K Split' },
    { value: 'split40k', label: '40K Split' },
  ];

  // Load results on mount
  useEffect(() => {
    // Prevent duplicate fetches during React Strict Mode double-mounting
    if (loadingRef.current) return;
    
    loadingRef.current = true;
    const initializeData = async () => {
      await Promise.all([
        loadResults(),
        loadAthletes()
      ]);
      loadingRef.current = false;
    };

    initializeData();
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

  async function loadAthletes() {
    try {
      const data = await apiClient.athletes.list();
      const combined = [...data.men, ...data.women];
      setAllAthletes(combined);
    } catch (err) {
      console.error('Failed to load athletes:', err);
    }
  }

  async function loadResults() {
    try {
      setLoading(true);
      setError(null);
      
      // Use gameId from state manager
      const gameId = gameState.gameId || 'default';
      
      // Skip DNS athletes for better performance in management panel
      const data: any = await apiClient.results.fetch(gameId, { skipDNS: true });
      
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

  async function handleResetResults() {
    if (!confirm('Are you sure you want to reset ALL results? This will delete all race data and cannot be undone.')) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const gameId = gameState.gameId || 'default';

      // Clear all results by sending empty object
      await apiClient.results.update(gameId, {});

      // Update local state
      setResults([]);
      setEditedTimes({});
      setNewRow(null);

      // Emit resultsUpdated event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('resultsUpdated'));
      }

      // Invalidate cache
      invalidateLeaderboardCache();

      alert('All results have been reset successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset results');
    } finally {
      setSaving(false);
    }
  }

  function handleAddResult() {
    if (newRow) {
      alert('Please save or cancel the current new result before adding another.');
      return;
    }

    // Get athletes not already in results
    const resultAthleteIds = new Set(results.map(r => r.athleteId));
    const availableAthletes = allAthletes.filter(a => !resultAthleteIds.has(a.id));

    if (availableAthletes.length === 0) {
      alert('All athletes already have results. Delete a result to add a different athlete.');
      return;
    }

    // Create new row with first available athlete
    const firstAthlete = availableAthletes[0];
    setNewRow({
      athleteId: firstAthlete.id,
      athleteName: firstAthlete.name,
      country: firstAthlete.country,
      gender: firstAthlete.gender,
      position: 0,
      time: ''
    });
  }

  function handleCancelNewResult() {
    setNewRow(null);
  }

  async function handleSaveNewResult() {
    if (!newRow) return;

    // Validate inputs
    if (!newRow.time.trim()) {
      alert('Please enter a time');
      return;
    }

    const timePattern = /^[0-9]{1,2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,3})?$/;
    const isDNF = newRow.time.trim().toUpperCase() === 'DNF';
    const isDNS = newRow.time.trim().toUpperCase() === 'DNS';
    
    if (!timePattern.test(newRow.time) && !isDNF && !isDNS) {
      alert('Invalid format. Use H:MM:SS or HH:MM:SS (e.g., 2:05:30), or enter DNF/DNS');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const gameId = gameState.gameId || 'default';
      const data: any = await apiClient.results.fetch(gameId);
      const currentResults = data.results || {};

      // Get the API field name for the selected split
      const splitFieldName = getSplitFieldName(selectedSplit);
      const camelCaseField = selectedSplit === 'finishTime' ? 'finishTime' : selectedSplit;

      // Add the new result
      const resultsData = {
        ...currentResults,
        [newRow.athleteId]: {
          ...currentResults[newRow.athleteId],
          [splitFieldName]: newRow.time,
          [camelCaseField]: newRow.time,
          position: newRow.position
        }
      };

      await apiClient.results.update(gameId, resultsData);

      // Reload results from API
      await loadResults();

      // Clear new row
      setNewRow(null);

      // Emit resultsUpdated event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('resultsUpdated'));
      }

      // Invalidate cache
      invalidateLeaderboardCache();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save new result');
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

  // Get the current split value for an athlete
  function getSplitValue(result: AthleteResult): string {
    switch (selectedSplit) {
      case 'finishTime': return result.finishTime;
      case 'split5k': return result.split5k || '';
      case 'split10k': return result.split10k || '';
      case 'splitHalf': return result.splitHalf || '';
      case 'split30k': return result.split30k || '';
      case 'split35k': return result.split35k || '';
      case 'split40k': return result.split40k || '';
      default: return '';
    }
  }

  // Get split field name for API
  function getSplitFieldName(splitType: string): string {
    switch (splitType) {
      case 'finishTime': return 'finish_time';
      case 'split5k': return 'split_5k';
      case 'split10k': return 'split_10k';
      case 'splitHalf': return 'split_half';
      case 'split30k': return 'split_30k';
      case 'split35k': return 'split_35k';
      case 'split40k': return 'split_40k';
      default: return 'finish_time';
    }
  }

  // Save individual result
  async function handleSaveResult(athleteId: number) {
    try {
      const newTime = editedTimes[athleteId];
      if (!newTime || !newTime.trim()) {
        alert('Please enter a valid time');
        return;
      }

      // Validate time format (H:MM:SS, HH:MM:SS, DNF, or DNS)
      const timePattern = /^[0-9]{1,2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,3})?$/;
      const isDNF = newTime.trim().toUpperCase() === 'DNF';
      const isDNS = newTime.trim().toUpperCase() === 'DNS';
      
      if (!timePattern.test(newTime) && !isDNF && !isDNS) {
        alert('Invalid format. Use H:MM:SS or HH:MM:SS (e.g., 2:05:30), or enter DNF/DNS');
        return;
      }

      setSaving(true);

      // Get the API field name for the selected split
      const splitFieldName = getSplitFieldName(selectedSplit);
      const camelCaseField = selectedSplit === 'finishTime' ? 'finishTime' : selectedSplit;

      // Get current result for this athlete only
      const currentResult = results.find(r => r.athleteId === athleteId);
      const gameId = gameState.gameId || 'default';

      // Prepare minimal update - only this athlete's data
      const athleteUpdate = {
        [splitFieldName]: newTime,
        [camelCaseField]: newTime,
        // Preserve existing data
        finish_time: currentResult?.finishTime || '',
        split_5k: currentResult?.split5k || '',
        split_10k: currentResult?.split10k || '',
        split_half: currentResult?.splitHalf || '',
        split_30k: currentResult?.split30k || '',
        split_35k: currentResult?.split35k || '',
        split_40k: currentResult?.split40k || '',
        position: currentResult?.position || 0,
      };

      // Override with the new time
      athleteUpdate[splitFieldName] = newTime;

      // Send only this athlete's update
      const resultsData = {
        [athleteId]: athleteUpdate
      };

      await apiClient.results.update(gameId, resultsData);

      // Update local state immediately (optimistic update)
      setResults(prev => prev.map(r => {
        if (r.athleteId === athleteId) {
          return { ...r, [camelCaseField]: newTime };
        }
        return r;
      }));

      // Clear the edited time
      setEditedTimes(prev => {
        const updated = { ...prev };
        delete updated[athleteId];
        return updated;
      });

      // Don't emit resultsUpdated event here - we're already updating local state
      // Other components can listen to their own data needs
      // if (typeof window !== 'undefined') {
      //   window.dispatchEvent(new CustomEvent('resultsUpdated'));
      // }

      // Invalidate cache for leaderboard
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

      <div className="panel-controls" style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="panel-actions" style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="btn btn-success" 
            onClick={handleAddResult}
            disabled={saving || gameState.resultsFinalized}
            title="Add a new result for an athlete"
          >
            ➕ Add Result
          </button>
          <button 
            className="btn btn-warning" 
            onClick={handleFinalizeResults}
            disabled={saving || gameState.resultsFinalized}
            title="Lock results - cannot be undone"
          >
            {gameState.resultsFinalized ? 'Results Finalized' : '🔒 Finalize Results'}
          </button>
          <button 
            className="btn btn-danger" 
            onClick={handleResetResults}
            disabled={saving || gameState.resultsFinalized || results.length === 0}
            title="Delete all results"
          >
            🔄 Reset Results
          </button>
        </div>

        <div className="split-selector" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label htmlFor="split-select" style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
            Show Split:
          </label>
          <select
            id="split-select"
            className="form-select"
            value={selectedSplit}
            onChange={(e) => setSelectedSplit(e.target.value)}
            style={{
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontSize: '0.9rem',
              minWidth: '180px'
            }}
          >
            {splitOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="results-list">
        {results.length === 0 && !newRow ? (
          <p style={{ textAlign: 'center', color: '#666' }}>No results yet. Add results to get started.</p>
        ) : (
          <table className="results-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '0.5rem', textAlign: 'center' }}>Position</th>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Athlete</th>
                <th style={{ padding: '0.5rem', textAlign: 'center' }}>Country</th>
                <th style={{ padding: '0.5rem', textAlign: 'center' }}>Gender</th>
                <th style={{ padding: '0.5rem', textAlign: 'center' }}>
                  {splitOptions.find(opt => opt.value === selectedSplit)?.label || 'Time'}
                </th>
                <th style={{ padding: '0.5rem', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* New result row (if adding) */}
              {newRow && (
                <tr style={{ borderBottom: '1px solid #eee', backgroundColor: '#f0f9ff' }}>
                  <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                    <input
                      type="number"
                      placeholder="Pos"
                      value={newRow.position || ''}
                      onChange={(e) => setNewRow({ ...newRow, position: parseInt(e.target.value) || 0 })}
                      style={{
                        width: '60px',
                        padding: '0.25rem',
                        textAlign: 'center',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                      }}
                    />
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <select
                      value={newRow.athleteId}
                      onChange={(e) => {
                        const athleteId = parseInt(e.target.value);
                        const athlete = allAthletes.find(a => a.id === athleteId);
                        if (athlete) {
                          setNewRow({
                            ...newRow,
                            athleteId: athlete.id,
                            athleteName: athlete.name,
                            country: athlete.country,
                            gender: athlete.gender
                          });
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '0.25rem',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                      }}
                    >
                      {allAthletes
                        .filter(a => !results.find(r => r.athleteId === a.id))
                        .map(athlete => (
                          <option key={athlete.id} value={athlete.id}>
                            {athlete.name}
                          </option>
                        ))}
                    </select>
                  </td>
                  <td style={{ padding: '0.5rem', textAlign: 'center' }}>{newRow.country}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'center' }}>{newRow.gender}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                    <input
                      type="text"
                      placeholder="H:MM:SS"
                      value={newRow.time}
                      onChange={(e) => setNewRow({ ...newRow, time: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.25rem',
                        textAlign: 'center',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                      }}
                    />
                  </td>
                  <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                    <button 
                      className="btn btn-sm btn-success"
                      onClick={handleSaveNewResult}
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
                      className="btn btn-sm btn-secondary"
                      onClick={handleCancelNewResult}
                      disabled={saving}
                      style={{
                        fontSize: '0.7rem',
                        padding: '0.2rem 0.4rem'
                      }}
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              )}

              {/* Existing results */}
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
                      value={editedTimes[result.athleteId] ?? getSplitValue(result)}
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
                      disabled={saving || !editedTimes.hasOwnProperty(result.athleteId)}
                      title={editedTimes.hasOwnProperty(result.athleteId) ? 'Save changes' : 'No unsaved changes'}
                      style={{ 
                        marginRight: '0.5rem',
                        fontSize: '0.7rem',
                        padding: '0.2rem 0.4rem',
                        opacity: editedTimes.hasOwnProperty(result.athleteId) ? 1 : 0.5,
                        cursor: editedTimes.hasOwnProperty(result.athleteId) ? 'pointer' : 'not-allowed'
                      }}
                    >
                      {editedTimes.hasOwnProperty(result.athleteId) ? '💾 Save' : '🔒 Save'}
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
