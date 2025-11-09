/**
 * Athlete Management Panel
 * 
 * Panel for managing athletes in the database.
 * Integrates with state events and API client.
 */

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useGameState } from '@/lib/state-provider';
import SkeletonLoader from './SkeletonLoader';

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
  const [filter, setFilter] = useState<'all' | 'men' | 'women'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingAthlete, setEditingAthlete] = useState<Partial<Athlete> | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showOnlyConfirmed, setShowOnlyConfirmed] = useState(false);
  const [showOnlyMissingWAID, setShowOnlyMissingWAID] = useState(false);
  const [sortBy, setSortBy] = useState<'id' | 'name' | 'pb' | 'rank'>('id');
  
  // Track if we're already loading to prevent duplicate requests
  const loadingRef = React.useRef(false);

  // Load athletes on mount
  useEffect(() => {
    console.log('[AthletePanel] Initial load on mount');
    loadAthletes();
    loadConfirmedAthletes();
  }, []);

  // Listen for athleteUpdated events
  useEffect(() => {
    const handleAthleteUpdate = (e: any) => {
      console.log('[AthletePanel] Received athleteUpdated event:', e.detail);
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
      if (!racesData || racesData.length === 0) {
        return;
      }
      
      const raceId = racesData[0].id;

      // Fetch confirmed athletes for this race
      const confirmations = await apiClient.athleteRaces.list({ raceId });
      const athleteIds = new Set<number>(
        confirmations.map((c: any) => c.athlete_id)
      );
      
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
      const data = await apiClient.athletes.list();
      
      const allAthletes = [...data.men, ...data.women].map(athlete => ({
        ...athlete,
        // Normalize field names (API returns snake_case, component uses camelCase)
        pb: athlete.personal_best || athlete.pb,
        worldAthleticsId: athlete.world_athletics_id || athlete.worldAthleticsId,
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

  async function handleToggleConfirmation(athleteId: number) {
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
    let filtered = athletes;

    // Gender filter
    if (filter !== 'all') {
      filtered = filtered.filter(a => a.gender.toLowerCase() === filter);
    }

    // NYC Marathon confirmed filter
    if (showOnlyConfirmed) {
      filtered = filtered.filter(a => confirmedAthletes.has(a.id));
    }

    // Missing World Athletics ID filter
    if (showOnlyMissingWAID) {
      filtered = filtered.filter(a => !a.worldAthleticsId && !a.world_athletics_id);
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        a.name.toLowerCase().includes(query) ||
        a.country.toLowerCase().includes(query)
      );
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
      {error && (
        <div className="error-message" style={{ color: 'red', marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#fee', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      {/* Top Controls */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowAddModal(true)}
          disabled={saving}
          style={{
            backgroundColor: '#2C39A2',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '4px',
            border: 'none',
            fontSize: '16px',
            fontWeight: '600',
            cursor: saving ? 'not-allowed' : 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          ADD NEW ATHLETE
        </button>
      </div>

      {/* Filter Checkboxes and Controls */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showOnlyConfirmed}
            onChange={(e) => setShowOnlyConfirmed(e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '14px' }}>Show only confirmed for NYC Marathon</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showOnlyMissingWAID}
            onChange={(e) => setShowOnlyMissingWAID(e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '14px' }}>Show only missing World Athletics ID</span>
        </label>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '14px', fontWeight: '500' }}>Gender:</label>
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'men' | 'women')}
            style={{
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            <option value="all">All</option>
            <option value="men">Men</option>
            <option value="women">Women</option>
          </select>
        </div>
      </div>

      {/* Sort By Control */}
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <label style={{ fontSize: '14px', fontWeight: '500' }}>Sort by:</label>
        <select 
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'id' | 'name' | 'pb' | 'rank')}
          style={{
            padding: '0.5rem',
            borderRadius: '4px',
            border: '1px solid #ddd',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          <option value="id">ID</option>
          <option value="name">Name</option>
          <option value="pb">Personal Best</option>
          <option value="rank">Marathon Rank</option>
        </select>
      </div>

      <div className="athletes-count" style={{ marginBottom: '1rem', fontSize: '14px', color: '#666' }}>
        {filteredAthletes.length} athlete(s) found
      </div>

      <div className="athletes-list" style={{ overflowX: 'auto' }}>
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
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>ID</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Name</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Country</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Gender</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Personal Best</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Marathon Rank</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Age</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>World Athletics ID</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600' }}>NYC Confirmed</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600' }}>Actions</th>
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
                  <td style={{ padding: '0.75rem' }}>{athlete.id}</td>
                  <td style={{ padding: '0.75rem', fontWeight: '500', color: '#2C39A2' }}>{athlete.name}</td>
                  <td style={{ padding: '0.75rem' }}>{athlete.country}</td>
                  <td style={{ padding: '0.75rem', textTransform: 'capitalize' }}>
                    {athlete.gender === 'men' ? 'M' : athlete.gender === 'women' ? 'F' : athlete.gender}
                  </td>
                  <td style={{ padding: '0.75rem' }}>{athlete.pb || athlete.personal_best}</td>
                  <td style={{ padding: '0.75rem' }}>
                    {athlete.marathon_rank ? `#${athlete.marathon_rank}` : '-'}
                  </td>
                  <td style={{ padding: '0.75rem' }}>{athlete.age || '-'}</td>
                  <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>
                    {athlete.worldAthleticsId || athlete.world_athletics_id || '-'}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <button
                      onClick={() => handleToggleConfirmation(athlete.id)}
                      disabled={saving}
                      style={{
                        backgroundColor: confirmedAthletes.has(athlete.id) ? '#28a745' : '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '0.5rem 1rem',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        opacity: saving ? 0.6 : 1,
                        minWidth: '100px',
                      }}
                    >
                      {confirmedAthletes.has(athlete.id) ? '✓ Confirmed' : 'Confirmed'}
                    </button>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button 
                        className="btn btn-sm"
                        onClick={() => setEditingAthlete(athlete)}
                        style={{
                          backgroundColor: '#ff6900',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '0.5rem 1rem',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: 'pointer',
                        }}
                      >
                        Save
                      </button>
                      <button 
                        className="btn btn-sm"
                        onClick={async () => {
                          // Sync athlete data from World Athletics
                          try {
                            setSaving(true);
                            await apiClient.athletes.sync(athlete.id);
                            alert('Athlete synced successfully!');
                            loadAthletes();
                          } catch (err) {
                            alert('Failed to sync athlete');
                          } finally {
                            setSaving(false);
                          }
                        }}
                        disabled={saving}
                        style={{
                          backgroundColor: '#2C39A2',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '0.5rem 1rem',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: saving ? 'not-allowed' : 'pointer',
                          opacity: saving ? 0.6 : 1,
                        }}
                      >
                        Sync
                      </button>
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
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Country *</label>
            <input
              type="text"
              maxLength={3}
              placeholder="USA"
              value={formData.country || ''}
              onChange={(e) => setFormData({ ...formData, country: e.target.value.toUpperCase() })}
              required
            />
          </div>
          <div className="form-group">
            <label>Gender *</label>
            <select
              value={formData.gender || ''}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              required
            >
              <option value="">Select gender</option>
              <option value="men">Men</option>
              <option value="women">Women</option>
            </select>
          </div>
          <div className="form-group">
            <label>Personal Best *</label>
            <input
              type="text"
              placeholder="HH:MM:SS"
              value={formData.pb || ''}
              onChange={(e) => setFormData({ ...formData, pb: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>World Athletics ID</label>
            <input
              type="text"
              value={formData.worldAthleticsId || ''}
              onChange={(e) => setFormData({ ...formData, worldAthleticsId: e.target.value })}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
