/**
 * Race Management Panel
 * 
 * Commissioner tool for managing race events:
 * - View all races with details
 * - Create new races
 * - Edit existing races (name, date, location, description)
 * - Delete races
 * - Manage athlete confirmations for each race
 * 
 * UI Migration: Migrated to Chakra UI buttons (Phase 4)
 */

import React, { useState, useEffect } from 'react';
import { apiClient, clearCache } from '@/lib/api-client';
import RaceDetailModal from '@/components/RaceDetailModal';
import { Button, IconButton } from '@/components/chakra';

interface Race {
  id: number;
  name: string;
  date: string;
  location: string;
  distance: string;
  eventType: string;
  worldAthleticsEventId?: string;
  description?: string;
  isActive: boolean;
  lockTime?: string;
  logoUrl?: string;
  backgroundImageUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  createdAt: string;
  updatedAt: string;
}

interface Athlete {
  id: number;
  name: string;
  country: string;
  gender: string;
}

interface RaceFormData {
  name: string;
  date: string;
  location: string;
  distance: string;
  eventType: string;
  worldAthleticsEventId: string;
  description: string;
  isActive: boolean;
  lockTime: string;
  logoUrl: string;
  backgroundImageUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export default function RaceManagementPanel() {
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingRace, setEditingRace] = useState<Race | null>(null);
  const [formData, setFormData] = useState<RaceFormData>({
    name: '',
    date: '',
    location: '',
    distance: 'Marathon (42.195 km)',
    eventType: 'Marathon Majors',
    worldAthleticsEventId: '',
    description: '',
    isActive: true,
    lockTime: '',
    logoUrl: '',
    backgroundImageUrl: '',
    primaryColor: '',
    secondaryColor: '',
    accentColor: ''
  });
  
  // Athletes confirmation state
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [confirmedAthletes, setConfirmedAthletes] = useState<any[]>([]);
  const [showAthleteModal, setShowAthleteModal] = useState(false);
  
  // Race detail modal state
  const [showRaceDetailModal, setShowRaceDetailModal] = useState(false);
  const [selectedRaceId, setSelectedRaceId] = useState<number | null>(null);

  useEffect(() => {
    loadRaces();
  }, []);

  const loadRaces = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.races.list();
      setRaces(response);
    } catch (err: any) {
      setError(err.message || 'Failed to load races');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRace = () => {
    setEditingRace(null);
    setFormData({
      name: '',
      date: '',
      location: '',
      distance: 'Marathon (42.195 km)',
      eventType: 'Marathon Majors',
      worldAthleticsEventId: '',
      description: '',
      isActive: true,
      lockTime: '',
      logoUrl: '',
      backgroundImageUrl: '',
      primaryColor: '',
      secondaryColor: '',
      accentColor: ''
    });
    setShowForm(true);
  };

  const handleEditRace = (race: Race) => {
    setEditingRace(race);
    
    // Format date for input type="date" (expects YYYY-MM-DD)
    let formattedDate = race.date;
    if (race.date) {
      // If date is a timestamp or Date object, extract YYYY-MM-DD
      const dateObj = new Date(race.date);
      if (!isNaN(dateObj.getTime())) {
        formattedDate = dateObj.toISOString().split('T')[0];
      }
    }
    
    // Format lockTime for input type="datetime-local" (expects YYYY-MM-DDTHH:MM)
    let formattedLockTime = '';
    if (race.lockTime) {
      const lockTimeObj = new Date(race.lockTime);
      if (!isNaN(lockTimeObj.getTime())) {
        // datetime-local expects format: YYYY-MM-DDTHH:MM
        formattedLockTime = lockTimeObj.toISOString().slice(0, 16);
      }
    }
    
    setFormData({
      name: race.name,
      date: formattedDate,
      location: race.location,
      distance: race.distance,
      eventType: race.eventType,
      worldAthleticsEventId: race.worldAthleticsEventId || '',
      description: race.description || '',
      isActive: race.isActive,
      lockTime: formattedLockTime,
      logoUrl: race.logoUrl || '',
      backgroundImageUrl: race.backgroundImageUrl || '',
      primaryColor: race.primaryColor || '',
      secondaryColor: race.secondaryColor || '',
      accentColor: race.accentColor || ''
    });
    setShowForm(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    try {
      const payload = {
        name: formData.name,
        date: formData.date,
        location: formData.location,
        distance: formData.distance,
        eventType: formData.eventType,
        worldAthleticsEventId: formData.worldAthleticsEventId || null,
        description: formData.description || null,
        isActive: formData.isActive,
        lockTime: formData.lockTime || null,
        logoUrl: formData.logoUrl || null,
        backgroundImageUrl: formData.backgroundImageUrl || null,
        primaryColor: formData.primaryColor || null,
        secondaryColor: formData.secondaryColor || null,
        accentColor: formData.accentColor || null
      };

      console.log('Submitting race update:', { id: editingRace?.id, payload });

      if (editingRace) {
        // Update existing race
        const result = await apiClient.races.update(editingRace.id, {
          name: payload.name,
          date: payload.date,
          location: payload.location,
          distance: payload.distance,
          event_type: payload.eventType,
          world_athletics_event_id: payload.worldAthleticsEventId,
          description: payload.description,
          is_active: payload.isActive,
          lock_time: payload.lockTime,
          logo_url: payload.logoUrl,
          background_image_url: payload.backgroundImageUrl,
          primary_color: payload.primaryColor,
          secondary_color: payload.secondaryColor,
          accent_color: payload.accentColor
        });
        console.log('Race update result:', result);
        setSuccessMessage(`Race "${formData.name}" updated successfully`);
      } else {
        // Create new race
        const result = await apiClient.races.create({
          name: payload.name,
          date: payload.date,
          location: payload.location,
          distance: payload.distance,
          event_type: payload.eventType,
          world_athletics_event_id: payload.worldAthleticsEventId,
          description: payload.description,
          lock_time: payload.lockTime,
          logo_url: payload.logoUrl,
          background_image_url: payload.backgroundImageUrl,
          primary_color: payload.primaryColor,
          secondary_color: payload.secondaryColor,
          accent_color: payload.accentColor
        });
        console.log('Race create result:', result);
        setSuccessMessage(`Race "${formData.name}" created successfully`);
      }

      setShowForm(false);
      
      // CRITICAL: Clear both in-memory and sessionStorage cache RIGHT BEFORE loadRaces()
      // This ensures the next fetch will get fresh data from the database
      clearCache();
      
      // Now fetch fresh data (cache is cleared, so this will hit the API)
      await loadRaces();
    } catch (err: any) {
      console.error('Error saving race:', err);
      setError(err.message || 'Failed to save race');
    }
  };

  const handleDeleteRace = async (race: Race) => {
    if (!confirm(`Are you sure you want to delete "${race.name}"? This will also remove all athlete confirmations for this race.`)) {
      return;
    }

    try {
      setError(null);
      await apiClient.races.delete(race.id);
      setSuccessMessage(`Race "${race.name}" deleted successfully`);
      
      // Clear both in-memory and sessionStorage cache before reloading to ensure fresh data
      clearCache();
      
      await loadRaces();
    } catch (err: any) {
      setError(err.message || 'Failed to delete race');
    }
  };

  const handleViewAthletes = async (race: Race) => {
    try {
      setSelectedRace(race);
      const response = await apiClient.athleteRaces.list({ raceId: race.id });
      setConfirmedAthletes(response);
      setShowAthleteModal(true);
    } catch (err: any) {
      setError(err.message || 'Failed to load athletes');
    }
  };

  const handleViewRaceDetails = (raceId: number) => {
    setSelectedRaceId(raceId);
    setShowRaceDetailModal(true);
  };

  const handleCloseRaceDetailModal = () => {
    setShowRaceDetailModal(false);
    setSelectedRaceId(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="race-management-panel">
        <h2>Race Management</h2>
        <p>Loading races...</p>
      </div>
    );
  }

  return (
    <div className="race-management-panel">
      <div className="panel-header">
        <h2>Race Management</h2>
        <Button 
          onClick={handleCreateRace} 
          variant="solid"
          colorPalette="primary"
          size="md"
        >
          Add New Race
        </Button>
      </div>

      {error && (
        <div className="alert alert-error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success">
          {successMessage}
        </div>
      )}

      {/* Race Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingRace ? 'Edit Race' : 'Create New Race'}</h3>
              <IconButton 
                className="close-btn" 
                onClick={() => setShowForm(false)}
                aria-label="Close modal"
                variant="ghost"
                colorPalette="navy"
                size="sm"
              >
                ×
              </IconButton>
            </div>
            <form onSubmit={handleSubmitForm}>
              <div className="form-group">
                <label htmlFor="name">Race Name *</label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., NYC Marathon"
                />
              </div>

              <div className="form-group">
                <label htmlFor="date">Date *</label>
                <input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="location">Location *</label>
                <input
                  id="location"
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                  placeholder="e.g., New York City, USA"
                />
              </div>

              <div className="form-group">
                <label htmlFor="distance">Distance</label>
                <input
                  id="distance"
                  type="text"
                  value={formData.distance}
                  onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                  placeholder="Marathon (42.195 km)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="eventType">Event Type</label>
                <input
                  id="eventType"
                  type="text"
                  value={formData.eventType}
                  onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                  placeholder="Marathon Majors"
                />
              </div>

              <div className="form-group">
                <label htmlFor="worldAthleticsEventId">World Athletics Event ID</label>
                <input
                  id="worldAthleticsEventId"
                  type="text"
                  value={formData.worldAthleticsEventId}
                  onChange={(e) => setFormData({ ...formData, worldAthleticsEventId: e.target.value })}
                  placeholder="Optional"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description / News</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  placeholder="Add race details, news, or updates..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="lockTime">Roster Lock Time</label>
                <input
                  id="lockTime"
                  type="datetime-local"
                  value={formData.lockTime}
                  onChange={(e) => setFormData({ ...formData, lockTime: e.target.value })}
                  placeholder="When rosters lock (e.g., race start time)"
                />
                <small style={{ color: '#666', fontSize: '12px' }}>
                  Optional: When should rosters lock for this race?
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="logoUrl">Logo URL</label>
                <input
                  id="logoUrl"
                  type="url"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  placeholder="https://example.com/race-logo.png"
                />
              </div>

              <div className="form-group">
                <label htmlFor="backgroundImageUrl">Background Image URL</label>
                <input
                  id="backgroundImageUrl"
                  type="url"
                  value={formData.backgroundImageUrl}
                  onChange={(e) => setFormData({ ...formData, backgroundImageUrl: e.target.value })}
                  placeholder="https://example.com/race-background.jpg"
                />
              </div>

              <div className="form-group">
                <label>Theme Colors</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label htmlFor="primaryColor" style={{ fontSize: '12px', marginBottom: '4px' }}>
                      Primary
                    </label>
                    <input
                      id="primaryColor"
                      type="color"
                      value={formData.primaryColor || '#007bff'}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      style={{ width: '100%', height: '40px' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label htmlFor="secondaryColor" style={{ fontSize: '12px', marginBottom: '4px' }}>
                      Secondary
                    </label>
                    <input
                      id="secondaryColor"
                      type="color"
                      value={formData.secondaryColor || '#6c757d'}
                      onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                      style={{ width: '100%', height: '40px' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label htmlFor="accentColor" style={{ fontSize: '12px', marginBottom: '4px' }}>
                      Accent
                    </label>
                    <input
                      id="accentColor"
                      type="color"
                      value={formData.accentColor || '#ffc107'}
                      onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                      style={{ width: '100%', height: '40px' }}
                    />
                  </div>
                </div>
                <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                  Colors for race detail page styling
                </small>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  Active Race
                </label>
              </div>

              <div className="form-actions">
                <Button 
                  type="button" 
                  onClick={() => setShowForm(false)} 
                  variant="outline"
                  colorPalette="navy"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="solid"
                  colorPalette="primary"
                >
                  {editingRace ? 'Update Race' : 'Create Race'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Athletes Modal */}
      {showAthleteModal && selectedRace && (
        <div className="modal-overlay" onClick={() => setShowAthleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirmed Athletes for {selectedRace.name}</h3>
              <IconButton 
                className="close-btn" 
                onClick={() => setShowAthleteModal(false)}
                aria-label="Close modal"
                variant="ghost"
                colorPalette="navy"
                size="sm"
              >
                ×
              </IconButton>
            </div>
            <div className="athletes-list">
              {confirmedAthletes.length === 0 ? (
                <p>No athletes confirmed yet.</p>
              ) : (
                <ul>
                  {confirmedAthletes.map((athlete) => (
                    <li key={athlete.id}>
                      {athlete.athlete_name} ({athlete.athlete_country})
                      {athlete.bib_number && ` - Bib #${athlete.bib_number}`}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="form-actions">
              <Button 
                onClick={() => setShowAthleteModal(false)} 
                variant="outline"
                colorPalette="navy"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Race Detail Modal */}
      {showRaceDetailModal && selectedRaceId && (
        <RaceDetailModal 
          raceId={selectedRaceId} 
          onClose={handleCloseRaceDetailModal}
        />
      )}
      {/* Races List */}
      <div className="races-list">
        {races.length === 0 ? (
          <p>No races found. Create your first race to get started.</p>
        ) : (
          <table className="races-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Date</th>
                <th>Location</th>
                <th>Status</th>
                <th>Athletes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {races.map((race) => (
                <tr key={race.id}>
                  <td>
                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleViewRaceDetails(race.id);
                      }}
                      variant="ghost"
                      colorPalette="primary"
                      size="sm"
                      title="View race details"
                      style={{ padding: 0, minHeight: 'auto', fontWeight: '600' }}
                    >
                      {race.name}
                    </Button>
                    {race.description && (
                      <div className="race-description">{race.description.substring(0, 100)}...</div>
                    )}
                  </td>
                  <td>{formatDate(race.date)}</td>
                  <td>{race.location}</td>
                  <td>
                    <span className={`status-badge ${race.isActive ? 'active' : 'inactive'}`}>
                      {race.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <Button 
                      onClick={() => handleViewAthletes(race)} 
                      variant="ghost"
                      colorPalette="primary"
                      size="sm"
                    >
                      View Athletes
                    </Button>
                  </td>
                  <td className="actions-cell">
                    <Button 
                      onClick={() => handleEditRace(race)} 
                      variant="outline"
                      colorPalette="navy"
                      size="xs"
                      style={{ marginRight: '0.5rem' }}
                    >
                      Edit
                    </Button>
                    <Button 
                      onClick={() => handleDeleteRace(race)} 
                      variant="solid"
                      colorPalette="error"
                      size="xs"
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style jsx>{`
        .race-management-panel {
          padding: 20px;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .panel-header h2 {
          margin: 0;
        }

        .alert {
          padding: 12px 16px;
          border-radius: 4px;
          margin-bottom: 16px;
        }

        .alert-error {
          background-color: #fee;
          border: 1px solid #fcc;
          color: #c00;
        }

        .alert-success {
          background-color: #efe;
          border: 1px solid #cfc;
          color: #060;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #ddd;
        }

        .modal-header h3 {
          margin: 0;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-btn:hover {
          color: #000;
        }

        form {
          padding: 20px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .form-group textarea {
          resize: vertical;
        }

        .checkbox-group label {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .checkbox-group input {
          width: auto;
        }

        .form-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          padding: 20px;
          border-top: 1px solid #ddd;
        }

        .races-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .races-table th,
        .races-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }

        .races-table th {
          background: #f5f5f5;
          font-weight: 600;
        }

        .races-table tbody tr:hover {
          background: #f9f9f9;
        }

        .race-description {
          font-size: 12px;
          color: #666;
          margin-top: 4px;
        }

        .race-name-link {
          background: none;
          border: none;
          color: #007bff;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          text-align: left;
          padding: 0;
          text-decoration: none;
          transition: color 0.2s;
          display: inline-block;
          position: relative;
          z-index: 1;
          pointer-events: auto;
        }

        .race-name-link:hover {
          color: #0056b3;
          text-decoration: underline;
        }

        .race-name-link:active {
          opacity: 0.7;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .status-badge.active {
          background: #e7f5e7;
          color: #2d7c2d;
        }

        .status-badge.inactive {
          background: #f5f5f5;
          color: #666;
        }

        .actions-cell {
          display: flex;
          gap: 8px;
        }

        .athletes-list {
          padding: 20px;
        }

        .athletes-list ul {
          list-style: none;
          padding: 0;
        }

        .athletes-list li {
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }

        .btn {
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .btn-primary:hover {
          background: #0056b3;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover {
          background: #545b62;
        }

        .btn-danger {
          background: #dc3545;
          color: white;
        }

        .btn-danger:hover {
          background: #c82333;
        }

        .btn-link {
          background: none;
          color: #007bff;
          padding: 4px 8px;
        }

        .btn-link:hover {
          text-decoration: underline;
        }

        .btn-sm {
          padding: 6px 12px;
          font-size: 12px;
        }

        @media (max-width: 768px) {
          .races-table {
            display: block;
            overflow-x: auto;
          }

          .modal-content {
            max-width: 100%;
            margin: 10px;
          }

          .panel-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
        }
      `}</style>
    </div>
  );
}
