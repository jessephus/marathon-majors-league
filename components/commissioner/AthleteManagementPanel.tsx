/**
 * Athlete Management Panel
 * 
 * Panel for managing athletes in the database.
 * Integrates with state events and API client.
 * 
 * UI Migration: Migrated to Chakra UI buttons (Phase 4)
 */

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useGameState } from '@/lib/state-provider';
import SkeletonLoader from './SkeletonLoader';
import { Button, Input, Select, Checkbox, FormControl, FormLabel } from '@/components/chakra';

interface Athlete {
  id: number;
  name: string;
  country: string;
  gender: string;
  personal_best: string; // API returns personal_best
  pb?: string; // Alias for convenience
  salary?: number;
  world_athletics_id?: string;
  worldAthleticsId?: string; // Alias
  marathon_rank?: number;
  age?: number;
  headshot_url?: string;
  confirmed?: boolean;
}

interface AthleteRace {
  athlete_id: number;
  race_id: number;
  confirmed_at: string;
}

export default function AthleteManagementPanel() {
  const { gameState, setGameState } = useGameState();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [confirmedAthletes, setConfirmedAthletes] = useState<Set<number>>(new Set());
  const [editedRows, setEditedRows] = useState<Set<number>>(new Set()); // Track which rows have unsaved changes
  const [pendingConfirmations, setPendingConfirmations] = useState<Map<number, boolean>>(new Map()); // Track pending confirmation changes
  const [filter, setFilter] = useState<'all' | 'men' | 'women'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingAthlete, setEditingAthlete] = useState<Partial<Athlete> | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showOnlyConfirmed, setShowOnlyConfirmed] = useState(false);
  const [showOnlyMissingWAID, setShowOnlyMissingWAID] = useState(false);
  const [editingWaId, setEditingWaId] = useState<number | null>(null);
  const [editingWaIdValue, setEditingWaIdValue] = useState('');
  const [sortBy, setSortBy] = useState<'id' | 'name' | 'pb' | 'rank'>('id');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Track if we're already loading to prevent duplicate requests
  const loadingRef = React.useRef(false);

  // Load athletes on mount
  useEffect(() => {
    console.log('[AthletePanel] Initial load on mount');
    loadAthletes();
    loadConfirmedAthletes();
  }, []);

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Helper function to show toast
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  // Listen for athleteUpdated events
  useEffect(() => {
    const handleAthleteUpdate = (e: any) => {
      console.log('[AthletePanel] Received athleteUpdated event:', e.detail);
      
      // Don't reload table for sync actions - we already updated the row locally
      if (e.detail?.action === 'synced') {
        console.log('[AthletePanel] Skipping reload for sync action');
        return;
      }
      
      loadAthletes();
      loadConfirmedAthletes();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('athleteUpdated', handleAthleteUpdate);
      return () => window.removeEventListener('athleteUpdated', handleAthleteUpdate);
    }
  }, []);

  async function loadConfirmedAthletes() {
    try {
      // Get active race
      const racesData = await apiClient.races.list({ active: true });
      console.log('[AthletePanel] Active races:', racesData);
      if (!racesData || racesData.length === 0) {
        console.log('[AthletePanel] No active races found');
        return;
      }
      
      const raceId = racesData[0].id;
      console.log('[AthletePanel] Loading confirmations for race ID:', raceId);

      // Fetch confirmed athletes for this race
      const confirmations = await apiClient.athleteRaces.list({ raceId });
      console.log('[AthletePanel] API returned confirmations:', confirmations);
      console.log('[AthletePanel] Number of confirmations:', confirmations?.length);
      
      const athleteIds = new Set<number>(
        confirmations.map((c: any) => c.athlete_id)
      );
      console.log('[AthletePanel] Athlete IDs from confirmations:', Array.from(athleteIds));
      
      setConfirmedAthletes(athleteIds);
    } catch (err) {
      console.error('Error loading confirmed athletes:', err);
    }
  }  async function loadAthletes() {
    // Prevent concurrent loads
    if (loadingRef.current) {
      console.log('[AthletePanel] Already loading, skipping duplicate request');
      return;
    }
    
    console.log('[AthletePanel] loadAthletes() called');
    loadingRef.current = true;
    
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.athletes.list({ confirmedOnly: false });
      
      const allAthletes = [...data.men, ...data.women].map(athlete => ({
        ...athlete,
        // Normalize field names (API returns snake_case, component uses camelCase)
        pb: athlete.personal_best || athlete.pb,
        worldAthleticsId: athlete.world_athletics_id || athlete.worldAthleticsId,
        marathon_rank: athlete.marathon_rank || athlete.marathonRank,
      }));

      setAthletes(allAthletes);
      console.log(`[AthletePanel] Loaded ${allAthletes.length} athletes`);
      
      // Don't update game state here - it would trigger athleteUpdated event
      // causing infinite loop since we're listening to that event.
      // Game state should only be updated when athletes are modified, not loaded.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load athletes');
      console.error('[AthletePanel] Load error:', err);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }

  async function handleAddAthlete(athleteData: Partial<Athlete>) {
    try {
      setSaving(true);
      setError(null);

      await apiClient.athletes.add(athleteData);

      setShowAddModal(false);
      
      // Emit athleteUpdated event - listener will reload athletes
      // Don't call loadAthletes() manually here to avoid double-loading
      console.log('[AthletePanel] Emitting athleteUpdated event (added)');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('athleteUpdated', { 
          detail: { action: 'added', athlete: athleteData } 
        }));
      }
      
      alert('Athlete added successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add athlete');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateAthlete(athleteId: number, updates: Partial<Athlete>) {
    try {
      setSaving(true);
      setError(null);

      await apiClient.athletes.update(athleteId, updates);

      setEditingAthlete(null);
      
      // Emit athleteUpdated event - listener will reload athletes
      // Don't call loadAthletes() manually here to avoid double-loading
      console.log('[AthletePanel] Emitting athleteUpdated event (updated)');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('athleteUpdated', { 
          detail: { action: 'updated', athleteId, updates } 
        }));
      }
      
      alert('Athlete updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update athlete');
    } finally {
      setSaving(false);
    }
  }

  // Toggle confirmation status locally (doesn't save to DB yet)
  function handleToggleConfirmation(athleteId: number) {
    const currentStatus = pendingConfirmations.get(athleteId) ?? confirmedAthletes.has(athleteId);
    const newStatus = !currentStatus;
    
    setPendingConfirmations(prev => {
      const next = new Map(prev);
      next.set(athleteId, newStatus);
      return next;
    });
    
    setEditedRows(prev => new Set(prev).add(athleteId));
  }

  // Save World Athletics ID for a specific athlete
  const handleSaveWaId = async (athleteId: number) => {
    try {
      const trimmedId = editingWaIdValue.trim();
      
      if (!trimmedId) {
        setToast({ message: 'World Athletics ID cannot be empty', type: 'error' });
        return;
      }
      
      // Update via API
      await apiClient.athletes.update(athleteId, { 
        worldAthleticsId: trimmedId 
      });
      
      setToast({ 
        message: 'World Athletics ID updated successfully', 
        type: 'success' 
      });
      
      // Clear editing state
      setEditingWaId(null);
      setEditingWaIdValue('');
      
      // Reload athletes to show updated data
      await loadAthletes();
    } catch (error: any) {
      if (error.message?.includes('unique constraint') || 
          error.message?.includes('duplicate key')) {
        setToast({ 
          message: 'This World Athletics ID is already assigned to another athlete', 
          type: 'error' 
        });
      } else {
        setToast({ 
          message: `Failed to update: ${error.message}`, 
          type: 'error' 
        });
      }
    }
  };

  // Save changes for a specific athlete
  async function handleSaveAthlete(athleteId: number) {
    try {
      setSaving(true);
      setError(null);

      // Get active race
      const racesData = await apiClient.races.list({ active: true });
      if (!racesData || racesData.length === 0) {
        alert('No active race found. Please create a race first.');
        setSaving(false);
        return;
      }
      
      const raceId = racesData[0].id;
      
      // Check if there's a pending confirmation change
      if (pendingConfirmations.has(athleteId)) {
        const shouldBeConfirmed = pendingConfirmations.get(athleteId)!;
        const isCurrentlyConfirmed = confirmedAthletes.has(athleteId);

        if (shouldBeConfirmed && !isCurrentlyConfirmed) {
          // Add confirmation
          await apiClient.athleteRaces.confirm(athleteId, raceId);
          setConfirmedAthletes(prev => new Set(prev).add(athleteId));
        } else if (!shouldBeConfirmed && isCurrentlyConfirmed) {
          // Remove confirmation
          await apiClient.athleteRaces.unconfirm(athleteId, raceId);
          setConfirmedAthletes(prev => {
            const next = new Set(prev);
            next.delete(athleteId);
            return next;
          });
        }
        
        // Clear pending change
        setPendingConfirmations(prev => {
          const next = new Map(prev);
          next.delete(athleteId);
          return next;
        });
      }
      
      // Clear edited flag
      setEditedRows(prev => {
        const next = new Set(prev);
        next.delete(athleteId);
        return next;
      });

      // Dispatch event for other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('athleteUpdated', {
          detail: { athleteId, confirmed: pendingConfirmations.get(athleteId) ?? confirmedAthletes.has(athleteId) }
        }));
      }
    } catch (err: any) {
      console.error('Error saving athlete:', err);
      setError(err.message || 'Failed to save athlete');
      showToast(`Failed to save athlete: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      setSaving(false);
    }
  }

  // Sync a single athlete from World Athletics
  async function handleSyncAthlete(athleteId: number) {
    try {
      setSaving(true);
      
      // Call the sync API
      const response: any = await apiClient.athletes.sync(athleteId);
      const updatedAthlete = response.athlete;
      
      // Update only this athlete in the local state
      setAthletes(prev => prev.map(athlete => 
        athlete.id === athleteId 
          ? {
              ...athlete,
              ...updatedAthlete,
              pb: updatedAthlete.pb,
              personal_best: updatedAthlete.pb,
              worldAthleticsId: updatedAthlete.world_athletics_id || updatedAthlete.worldAthleticsId,
              world_athletics_id: updatedAthlete.world_athletics_id || updatedAthlete.worldAthleticsId,
              marathon_rank: updatedAthlete.marathonRank,
              age: updatedAthlete.age,
              season_best: updatedAthlete.seasonBest,
            }
          : athlete
      ));
      
      showToast('Athlete synced successfully!', 'success');
      
      // Dispatch event for other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('athleteUpdated', {
          detail: { athleteId, action: 'synced' }
        }));
      }
    } catch (err: any) {
      console.error('Error syncing athlete:', err);
      showToast(`Failed to sync athlete: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      setSaving(false);
    }
  }

  // Original function - now unused but keeping for reference
  async function handleToggleConfirmationOld(athleteId: number) {
    try {
      setSaving(true);
      setError(null);

      // Get active race
      const racesData = await apiClient.races.list({ active: true });
      if (!racesData || racesData.length === 0) {
        alert('No active race found. Please create a race first.');
        setSaving(false);
        return;
      }
      
      const raceId = racesData[0].id;
      const isCurrentlyConfirmed = confirmedAthletes.has(athleteId);

      if (isCurrentlyConfirmed) {
        // Remove confirmation
        await apiClient.athleteRaces.unconfirm(athleteId, raceId);
        setConfirmedAthletes(prev => {
          const next = new Set(prev);
          next.delete(athleteId);
          return next;
        });
      } else {
        // Add confirmation
        await apiClient.athleteRaces.confirm(athleteId, raceId);
        setConfirmedAthletes(prev => new Set(prev).add(athleteId));
      }

      // Emit athleteUpdated event
      console.log('[AthletePanel] Emitting athleteUpdated event (confirmed)');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('athleteUpdated', { 
          detail: { action: 'confirmed', athleteId } 
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle confirmation');
      // Reload to sync state
      loadConfirmedAthletes();
    } finally {
      setSaving(false);
    }
  }

  function getFilteredAthletes() {
    console.log('[AthletePanel] getFilteredAthletes called');
    console.log('[AthletePanel] Total athletes:', athletes.length);
    console.log('[AthletePanel] showOnlyConfirmed:', showOnlyConfirmed);
    console.log('[AthletePanel] Confirmed athletes set size:', confirmedAthletes.size);
    
    let filtered = athletes;

    // Gender filter
    if (filter !== 'all') {
      filtered = filtered.filter(a => a.gender.toLowerCase() === filter);
      console.log('[AthletePanel] After gender filter:', filtered.length);
    }

    // Active race confirmed filter
    if (showOnlyConfirmed) {
      filtered = filtered.filter(a => confirmedAthletes.has(a.id));
      console.log('[AthletePanel] After confirmed filter:', filtered.length);
    }

    // Missing World Athletics ID filter
    if (showOnlyMissingWAID) {
      filtered = filtered.filter(a => !a.worldAthleticsId && !a.world_athletics_id);
      console.log('[AthletePanel] After missing WAID filter:', filtered.length);
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        a.name.toLowerCase().includes(query) ||
        a.country.toLowerCase().includes(query)
      );
      console.log('[AthletePanel] After search filter:', filtered.length);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'pb':
          return (a.pb || a.personal_best || '').localeCompare(b.pb || b.personal_best || '');
        case 'rank':
          return (a.marathon_rank || 9999) - (b.marathon_rank || 9999);
        case 'id':
        default:
          return a.id - b.id;
      }
    });

    return filtered;
  }

  if (loading) {
    return <SkeletonLoader lines={5} />;
  }

  const filteredAthletes = getFilteredAthletes();

  return (
    <div className="athlete-management-panel">
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: toast.type === 'success' ? '#28a745' : '#dc3545',
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '4px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            zIndex: 9999,
            animation: 'slideInRight 0.3s ease-out',
            maxWidth: '400px',
          }}
        >
          {toast.message}
        </div>
      )}

      {error && (
        <div className="error-message" style={{ color: 'red', marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#fee', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      {/* Top Controls */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Button
          variant="solid"
          colorPalette="primary"
          onClick={() => setShowAddModal(true)}
          disabled={saving}
          size="md"
        >
          ADD NEW ATHLETE
        </Button>
      </div>

      {/* Filter Checkboxes and Controls */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
        <Checkbox
          checked={showOnlyConfirmed}
          onChange={(e) => setShowOnlyConfirmed(e.target.checked)}
          colorPalette="navy"
          size="md"
        >
          Show only confirmed for active race
        </Checkbox>

        <Checkbox
          checked={showOnlyMissingWAID}
          onChange={(e) => setShowOnlyMissingWAID(e.target.checked)}
          colorPalette="navy"
          size="md"
        >
          Show only missing World Athletics ID
        </Checkbox>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '14px', fontWeight: '500' }}>Gender:</label>
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'men' | 'women')}
            options={[
              { value: 'all', label: 'All' },
              { value: 'men', label: 'Men' },
              { value: 'women', label: 'Women' }
            ]}
            variant="outline"
            size="sm"
            style={{ minWidth: '120px' }}
          />
        </div>
      </div>

      {/* Sort By Control */}
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <label style={{ fontSize: '14px', fontWeight: '500' }}>Sort by:</label>
        <Select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'id' | 'name' | 'pb' | 'rank')}
          options={[
            { value: 'id', label: 'ID' },
            { value: 'name', label: 'Name' },
            { value: 'pb', label: 'Personal Best' },
            { value: 'rank', label: 'Marathon Rank' }
          ]}
          variant="outline"
          size="sm"
          style={{ minWidth: '160px' }}
        />
      </div>

      <div className="athletes-count" style={{ marginBottom: '1rem', fontSize: '14px', color: '#666' }}>
        {filteredAthletes.length} athlete(s) found
      </div>

      <div className="athletes-list" style={{ 
        overflowX: 'auto',
        borderRadius: '8px',
        overflow: 'hidden', // This makes border-radius work with table
        border: '1px solid #ddd',
      }}>
        {filteredAthletes.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>No athletes found</p>
        ) : (
          <table className="athletes-table" style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            fontSize: '14px',
          }}>
            <thead>
              <tr style={{ 
                backgroundColor: '#2C39A2',
                color: 'white',
              }}>
                <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: '600', fontSize: '12px', whiteSpace: 'nowrap' }}>Name</th>
                <th style={{ padding: '0.5rem', textAlign: 'center', fontWeight: '600', fontSize: '12px', whiteSpace: 'nowrap' }}>Country</th>
                <th style={{ padding: '0.5rem', textAlign: 'center', fontWeight: '600', fontSize: '12px', whiteSpace: 'nowrap' }}>Gender</th>
                <th style={{ padding: '0.5rem', textAlign: 'center', fontWeight: '600', fontSize: '12px', whiteSpace: 'nowrap' }}>PB</th>
                <th style={{ padding: '0.5rem', textAlign: 'center', fontWeight: '600', fontSize: '12px', whiteSpace: 'nowrap' }}>Rank</th>
                <th style={{ padding: '0.5rem', textAlign: 'center', fontWeight: '600', fontSize: '12px', whiteSpace: 'nowrap' }}>Age</th>
                <th style={{ padding: '0.5rem', textAlign: 'center', fontWeight: '600', fontSize: '12px', whiteSpace: 'nowrap' }}>WA ID</th>
                <th style={{ padding: '0.5rem', textAlign: 'center', fontWeight: '600', fontSize: '12px', whiteSpace: 'nowrap' }}>Confirmed</th>
                <th style={{ padding: '0.5rem', textAlign: 'center', fontWeight: '600', fontSize: '12px', whiteSpace: 'nowrap' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAthletes.map((athlete, index) => (
                <tr 
                  key={athlete.id} 
                  style={{ 
                    borderBottom: '1px solid #eee',
                    backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9',
                  }}
                >
                  <td style={{ padding: '0.75rem', fontWeight: '500', color: '#2C39A2' }}>{athlete.name}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>{athlete.country}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', textTransform: 'capitalize' }}>
                    {athlete.gender === 'men' ? 'M' : athlete.gender === 'women' ? 'F' : athlete.gender}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>{athlete.pb || athlete.personal_best}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    {athlete.marathon_rank ? `#${athlete.marathon_rank}` : '-'}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>{athlete.age || '-'}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', fontFamily: 'monospace' }}>
                    {editingWaId === athlete.id ? (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}>
                        <input
                          type="text"
                          value={editingWaIdValue}
                          onChange={(e) => setEditingWaIdValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveWaId(athlete.id);
                            if (e.key === 'Escape') { setEditingWaId(null); setEditingWaIdValue(''); }
                          }}
                          placeholder="WA ID"
                          style={{
                            width: '100px',
                            padding: '0.25rem 0.5rem',
                            fontSize: '13px',
                            fontFamily: 'monospace',
                            border: '1px solid #cbd5e0',
                            borderRadius: '4px',
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveWaId(athlete.id)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '12px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => { setEditingWaId(null); setEditingWaIdValue(''); }}
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '12px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <span
                        onClick={() => {
                          setEditingWaId(athlete.id);
                          setEditingWaIdValue(athlete.worldAthleticsId || athlete.world_athletics_id || '');
                        }}
                        style={{
                          cursor: 'pointer',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          display: 'inline-block',
                          transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f7fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        title="Click to edit"
                      >
                        {athlete.worldAthleticsId || athlete.world_athletics_id || '-'}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    {/* Toggle Switch for Confirmation Status */}
                    <label 
                      style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={pendingConfirmations.get(athlete.id) ?? confirmedAthletes.has(athlete.id)}
                        onChange={() => handleToggleConfirmation(athlete.id)}
                        style={{ display: 'none' }}
                      />
                      <div
                        style={{
                          width: '44px',
                          height: '24px',
                          backgroundColor: (pendingConfirmations.get(athlete.id) ?? confirmedAthletes.has(athlete.id)) 
                            ? '#28a745' 
                            : '#dc3545',
                          borderRadius: '12px',
                          position: 'relative',
                          transition: 'background-color 0.2s',
                          border: '2px solid',
                          borderColor: (pendingConfirmations.get(athlete.id) ?? confirmedAthletes.has(athlete.id)) 
                            ? '#28a745' 
                            : '#dc3545',
                        }}
                      >
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            backgroundColor: 'white',
                            borderRadius: '50%',
                            position: 'absolute',
                            top: '2px',
                            left: (pendingConfirmations.get(athlete.id) ?? confirmedAthletes.has(athlete.id)) 
                              ? '22px' 
                              : '2px',
                            transition: 'left 0.2s',
                          }}
                        />
                      </div>
                    </label>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <Button
                        variant="solid"
                        colorPalette="primary"
                        onClick={() => handleSaveAthlete(athlete.id)}
                        disabled={!editedRows.has(athlete.id) || saving}
                        title={editedRows.has(athlete.id) ? 'Save changes' : 'No unsaved changes'}
                        size="xs"
                      >
                        {editedRows.has(athlete.id) ? '💾 Save' : '🔒 Save'}
                      </Button>
                      <Button
                        variant="outline"
                        colorPalette="navy"
                        onClick={() => handleSyncAthlete(athlete.id)}
                        disabled={saving}
                        size="xs"
                      >
                        Sync
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Athlete Modal */}
      {showAddModal && (
        <AthleteFormModal
          title="Add Athlete"
          athlete={{}}
          onSave={handleAddAthlete}
          onCancel={() => setShowAddModal(false)}
          saving={saving}
        />
      )}

      {/* Edit Athlete Modal */}
      {editingAthlete && (
        <AthleteFormModal
          title="Edit Athlete"
          athlete={editingAthlete}
          onSave={(data) => handleUpdateAthlete(editingAthlete.id!, data)}
          onCancel={() => setEditingAthlete(null)}
          saving={saving}
        />
      )}
    </div>
  );
}

// Athlete Form Modal Component
interface AthleteFormModalProps {
  title: string;
  athlete: Partial<Athlete>;
  onSave: (athlete: Partial<Athlete>) => void;
  onCancel: () => void;
  saving: boolean;
}

function AthleteFormModal({ title, athlete, onSave, onCancel, saving }: AthleteFormModalProps) {
  const [formData, setFormData] = useState<Partial<Athlete>>(athlete);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.name || !formData.country || !formData.gender || !formData.pb) {
      alert('Please fill in all required fields');
      return;
    }

    onSave(formData);
  }

  return (
    <div className="modal" style={{ display: 'flex' }}>
      <div className="modal-overlay" onClick={onCancel}></div>
      <div className="modal-content">
        <h3>{title}</h3>
        <form onSubmit={handleSubmit}>
          <FormControl isRequired style={{ marginBottom: '20px' }}>
            <FormLabel htmlFor="name">Name</FormLabel>
            <Input
              id="name"
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              variant="outline"
              size="md"
            />
          </FormControl>

          <FormControl isRequired style={{ marginBottom: '20px' }}>
            <FormLabel htmlFor="country">Country</FormLabel>
            <Input
              id="country"
              type="text"
              maxLength={3}
              placeholder="USA"
              value={formData.country || ''}
              onChange={(e) => setFormData({ ...formData, country: e.target.value.toUpperCase() })}
              variant="outline"
              size="md"
            />
          </FormControl>

          <FormControl isRequired style={{ marginBottom: '20px' }}>
            <FormLabel htmlFor="gender">Gender</FormLabel>
            <Select
              id="gender"
              value={formData.gender || ''}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              options={[
                { value: '', label: 'Select gender' },
                { value: 'men', label: 'Men' },
                { value: 'women', label: 'Women' }
              ]}
              variant="outline"
              size="md"
            />
          </FormControl>

          <FormControl isRequired style={{ marginBottom: '20px' }}>
            <FormLabel htmlFor="pb">Personal Best</FormLabel>
            <Input
              id="pb"
              type="text"
              placeholder="HH:MM:SS"
              value={formData.pb || ''}
              onChange={(e) => setFormData({ ...formData, pb: e.target.value })}
              variant="outline"
              size="md"
            />
          </FormControl>

          <FormControl style={{ marginBottom: '20px' }}>
            <FormLabel htmlFor="worldAthleticsId">World Athletics ID</FormLabel>
            <Input
              id="worldAthleticsId"
              type="text"
              value={formData.worldAthleticsId || ''}
              onChange={(e) => setFormData({ ...formData, worldAthleticsId: e.target.value })}
              variant="outline"
              size="md"
            />
          </FormControl>

          <div className="form-actions">
            <Button 
              type="button" 
              variant="outline"
              colorPalette="navy"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="solid"
              colorPalette="primary"
              disabled={saving}
              isLoading={saving}
              loadingText="Saving..."
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
