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
  pb: string;
  salary?: number;
  worldAthleticsId?: string;
  confirmed?: boolean;
}

export default function AthleteManagementPanel() {
  const { gameState, setGameState } = useGameState();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [filter, setFilter] = useState<'all' | 'men' | 'women'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingAthlete, setEditingAthlete] = useState<Partial<Athlete> | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Track if we're already loading to prevent duplicate requests
  const loadingRef = React.useRef(false);

  // Load athletes on mount
  useEffect(() => {
    console.log('[AthletePanel] Initial load on mount');
    loadAthletes();
  }, []);

  // Listen for athleteUpdated events
  useEffect(() => {
    const handleAthleteUpdate = (e: any) => {
      console.log('[AthletePanel] Received athleteUpdated event:', e.detail);
      loadAthletes();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('athleteUpdated', handleAthleteUpdate);
      return () => window.removeEventListener('athleteUpdated', handleAthleteUpdate);
    }
  }, []);

  async function loadAthletes() {
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
        confirmed: false, // TODO: load confirmation status from athlete_races
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

      await apiClient.athletes.toggleConfirmation(athleteId);

      // Emit athleteUpdated event - listener will reload athletes
      // Don't call loadAthletes() manually here to avoid double-loading
      console.log('[AthletePanel] Emitting athleteUpdated event (confirmed)');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('athleteUpdated', { 
          detail: { action: 'confirmed', athleteId } 
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle confirmation');
    } finally {
      setSaving(false);
    }
  }

  function getFilteredAthletes() {
    let filtered = athletes;

    if (filter !== 'all') {
      filtered = filtered.filter(a => a.gender.toLowerCase() === filter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        a.name.toLowerCase().includes(query) ||
        a.country.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  if (loading) {
    return <SkeletonLoader lines={5} />;
  }

  const filteredAthletes = getFilteredAthletes();

  return (
    <div className="athlete-management-panel">
      <h3>Athlete Management</h3>

      {error && (
        <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div className="panel-controls" style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowAddModal(true)}
          disabled={saving}
        >
          ➕ Add Athlete
        </button>

        <div className="filter-buttons" style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`btn ${filter === 'men' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('men')}
          >
            Men
          </button>
          <button 
            className={`btn ${filter === 'women' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('women')}
          >
            Women
          </button>
        </div>

        <input
          type="text"
          placeholder="Search athletes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
        />
      </div>

      <div className="athletes-count" style={{ marginBottom: '0.5rem', color: '#666' }}>
        Showing {filteredAthletes.length} of {athletes.length} athletes
      </div>

      <div className="athletes-list">
        {filteredAthletes.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666' }}>No athletes found</p>
        ) : (
          <table className="athletes-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Name</th>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Country</th>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Gender</th>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>PB</th>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>WA ID</th>
                <th style={{ padding: '0.5rem', textAlign: 'center' }}>Confirmed</th>
                <th style={{ padding: '0.5rem', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAthletes.map((athlete) => (
                <tr key={athlete.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '0.5rem' }}>{athlete.name}</td>
                  <td style={{ padding: '0.5rem' }}>{athlete.country}</td>
                  <td style={{ padding: '0.5rem' }}>{athlete.gender}</td>
                  <td style={{ padding: '0.5rem' }}>{athlete.pb}</td>
                  <td style={{ padding: '0.5rem' }}>{athlete.worldAthleticsId || '-'}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={athlete.confirmed}
                      onChange={() => handleToggleConfirmation(athlete.id)}
                      disabled={saving}
                    />
                  </td>
                  <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => setEditingAthlete(athlete)}
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
