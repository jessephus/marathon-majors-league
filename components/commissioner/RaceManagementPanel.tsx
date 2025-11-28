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
import { Button, IconButton, Input, Textarea, Checkbox, FormControl, FormLabel, FormHelperText } from '@/components/chakra';

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
  lockTimeZone: string;
  logoUrl: string;
  backgroundImageUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

// Location to timezone mapping helper
const getTimezoneFromLocation = (location: string): string => {
  const loc = location.toLowerCase();
  
  // Common marathon cities and their timezones
  const locationTimezones: Record<string, string> = {
    // US Cities
    'new york': 'America/New_York',
    'nyc': 'America/New_York',
    'boston': 'America/New_York',
    'chicago': 'America/Chicago',
    'los angeles': 'America/Los_Angeles',
    'la': 'America/Los_Angeles',
    'san francisco': 'America/Los_Angeles',
    
    // European Cities
    'london': 'Europe/London',
    'paris': 'Europe/Paris',
    'berlin': 'Europe/Berlin',
    'rome': 'Europe/Rome',
    'madrid': 'Europe/Madrid',
    'barcelona': 'Europe/Madrid',
    'valencia': 'Europe/Madrid',
    'amsterdam': 'Europe/Amsterdam',
    'vienna': 'Europe/Vienna',
    'prague': 'Europe/Prague',
    'copenhagen': 'Europe/Copenhagen',
    'stockholm': 'Europe/Stockholm',
    
    // Asian Cities
    'tokyo': 'Asia/Tokyo',
    'osaka': 'Asia/Tokyo',
    'beijing': 'Asia/Shanghai',
    'shanghai': 'Asia/Shanghai',
    'hong kong': 'Asia/Hong_Kong',
    'singapore': 'Asia/Singapore',
    'dubai': 'Asia/Dubai',
    'mumbai': 'Asia/Kolkata',
    'delhi': 'Asia/Kolkata',
    
    // Other Major Cities
    'sydney': 'Australia/Sydney',
    'melbourne': 'Australia/Melbourne',
    'toronto': 'America/Toronto',
    'vancouver': 'America/Vancouver',
    'mexico city': 'America/Mexico_City',
    'buenos aires': 'America/Argentina/Buenos_Aires',
    'sao paulo': 'America/Sao_Paulo',
    'rio de janeiro': 'America/Sao_Paulo',
    'johannesburg': 'Africa/Johannesburg',
    'cape town': 'Africa/Johannesburg'
  };
  
  // Try to find a matching city in the location string
  for (const [city, timezone] of Object.entries(locationTimezones)) {
    if (loc.includes(city)) {
      return timezone;
    }
  }
  
  // Default to America/New_York if no match
  return 'America/New_York';
};

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
    lockTimeZone: 'America/New_York',
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
      lockTimeZone: 'America/New_York',
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
      lockTimeZone: getTimezoneFromLocation(race.location),
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
      // Format lockTime with timezone for PostgreSQL TIMESTAMPTZ
      let lockTimeWithZone = null;
      if (formData.lockTime && formData.lockTimeZone) {
        // Format: "2025-11-03T08:35:00 America/New_York"
        // PostgreSQL will parse this as TIMESTAMP WITH TIME ZONE
        lockTimeWithZone = `${formData.lockTime}:00 ${formData.lockTimeZone}`;
      }

      const payload = {
        name: formData.name,
        date: formData.date,
        location: formData.location,
        distance: formData.distance,
        eventType: formData.eventType,
        worldAthleticsEventId: formData.worldAthleticsEventId || null,
        description: formData.description || null,
        lockTime: lockTimeWithZone,
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
              <FormControl isRequired style={{ marginBottom: '20px' }}>
                <FormLabel htmlFor="name">Race Name</FormLabel>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., NYC Marathon"
                  variant="outline"
                  size="md"
                />
              </FormControl>

              <FormControl isRequired style={{ marginBottom: '20px' }}>
                <FormLabel htmlFor="date">Date</FormLabel>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  variant="outline"
                  size="md"
                />
              </FormControl>

              <FormControl isRequired style={{ marginBottom: '20px' }}>
                <FormLabel htmlFor="location">Location</FormLabel>
                <Input
                  id="location"
                  type="text"
                  value={formData.location}
                  onChange={(e) => {
                    const newLocation = e.target.value;
                    const detectedTimezone = getTimezoneFromLocation(newLocation);
                    setFormData({ 
                      ...formData, 
                      location: newLocation,
                      lockTimeZone: detectedTimezone
                    });
                  }}
                  placeholder="e.g., New York City, USA"
                  variant="outline"
                  size="md"
                />
              </FormControl>

              <FormControl style={{ marginBottom: '20px' }}>
                <FormLabel htmlFor="distance">Distance</FormLabel>
                <Input
                  id="distance"
                  type="text"
                  value={formData.distance}
                  onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                  placeholder="Marathon (42.195 km)"
                  variant="outline"
                  size="md"
                />
              </FormControl>

              <FormControl style={{ marginBottom: '20px' }}>
                <FormLabel htmlFor="eventType">Event Type</FormLabel>
                <Input
                  id="eventType"
                  type="text"
                  value={formData.eventType}
                  onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                  placeholder="Marathon Majors"
                  variant="outline"
                  size="md"
                />
              </FormControl>

              <FormControl style={{ marginBottom: '20px' }}>
                <FormLabel htmlFor="worldAthleticsEventId">World Athletics Event ID</FormLabel>
                <Input
                  id="worldAthleticsEventId"
                  type="text"
                  value={formData.worldAthleticsEventId}
                  onChange={(e) => setFormData({ ...formData, worldAthleticsEventId: e.target.value })}
                  placeholder="Optional"
                  variant="outline"
                  size="md"
                />
              </FormControl>

              <FormControl style={{ marginBottom: '20px' }}>
                <FormLabel htmlFor="description">Description / News</FormLabel>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add race details, news, or updates..."
                  variant="outline"
                  size="md"
                  rows={4}
                />
              </FormControl>

              <FormControl style={{ marginBottom: '20px' }}>
                <FormLabel htmlFor="lockTime">Roster Lock Time</FormLabel>
                <Input
                  id="lockTime"
                  type="datetime-local"
                  value={formData.lockTime}
                  onChange={(e) => setFormData({ ...formData, lockTime: e.target.value })}
                  variant="outline"
                  size="md"
                />
                <FormHelperText>
                  Optional: When should rosters lock for this race?
                </FormHelperText>
              </FormControl>

              <FormControl style={{ marginBottom: '20px' }}>
                <FormLabel htmlFor="lockTimeZone">Lock Time Timezone</FormLabel>
                <select
                  id="lockTimeZone"
                  value={formData.lockTimeZone}
                  onChange={(e) => setFormData({ ...formData, lockTimeZone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #E2E8F0',
                    fontSize: '16px',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <optgroup label="North America">
                    <option value="America/New_York">Eastern (New York, Boston)</option>
                    <option value="America/Chicago">Central (Chicago)</option>
                    <option value="America/Denver">Mountain (Denver)</option>
                    <option value="America/Los_Angeles">Pacific (Los Angeles)</option>
                    <option value="America/Toronto">Toronto</option>
                  </optgroup>
                  <optgroup label="Europe">
                    <option value="Europe/London">London (GMT/BST)</option>
                    <option value="Europe/Paris">Paris, Berlin (CET/CEST)</option>
                    <option value="Europe/Madrid">Madrid (CET/CEST)</option>
                    <option value="Europe/Amsterdam">Amsterdam (CET/CEST)</option>
                    <option value="Europe/Rome">Rome (CET/CEST)</option>
                    <option value="Europe/Athens">Athens (EET/EEST)</option>
                  </optgroup>
                  <optgroup label="Asia">
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                    <option value="Asia/Shanghai">Beijing, Shanghai (CST)</option>
                    <option value="Asia/Hong_Kong">Hong Kong (HKT)</option>
                    <option value="Asia/Singapore">Singapore (SGT)</option>
                    <option value="Asia/Dubai">Dubai (GST)</option>
                    <option value="Asia/Seoul">Seoul (KST)</option>
                  </optgroup>
                  <optgroup label="Other">
                    <option value="Australia/Sydney">Sydney (AEDT/AEST)</option>
                    <option value="Pacific/Auckland">Auckland (NZDT/NZST)</option>
                    <option value="America/Sao_Paulo">São Paulo (BRT)</option>
                    <option value="Africa/Johannesburg">Johannesburg (SAST)</option>
                  </optgroup>
                </select>
                <FormHelperText>
                  Auto-selected based on race location. Change if needed.
                </FormHelperText>
              </FormControl>

              <FormControl style={{ marginBottom: '20px' }}>
                <FormLabel htmlFor="logoUrl">Logo URL</FormLabel>
                <Input
                  id="logoUrl"
                  type="url"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  placeholder="https://example.com/race-logo.png"
                  variant="outline"
                  size="md"
                />
              </FormControl>

              <FormControl style={{ marginBottom: '20px' }}>
                <FormLabel htmlFor="backgroundImageUrl">Background Image URL</FormLabel>
                <Input
                  id="backgroundImageUrl"
                  type="url"
                  value={formData.backgroundImageUrl}
                  onChange={(e) => setFormData({ ...formData, backgroundImageUrl: e.target.value })}
                  placeholder="https://example.com/race-background.jpg"
                  variant="outline"
                  size="md"
                />
              </FormControl>

              <FormControl style={{ marginBottom: '20px' }}>
                <FormLabel>Theme Colors</FormLabel>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <FormLabel htmlFor="primaryColor" style={{ fontSize: '12px', marginBottom: '4px' }}>
                      Primary
                    </FormLabel>
                    <Input
                      id="primaryColor"
                      type="color"
                      value={formData.primaryColor || '#007bff'}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      variant="outline"
                      size="md"
                      style={{ height: '40px' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <FormLabel htmlFor="secondaryColor" style={{ fontSize: '12px', marginBottom: '4px' }}>
                      Secondary
                    </FormLabel>
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={formData.secondaryColor || '#6c757d'}
                      onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                      variant="outline"
                      size="md"
                      style={{ height: '40px' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <FormLabel htmlFor="accentColor" style={{ fontSize: '12px', marginBottom: '4px' }}>
                      Accent
                    </FormLabel>
                    <Input
                      id="accentColor"
                      type="color"
                      value={formData.accentColor || '#ffc107'}
                      onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                      variant="outline"
                      size="md"
                      style={{ height: '40px' }}
                    />
                  </div>
                </div>
                <FormHelperText>
                  Colors for race detail page styling
                </FormHelperText>
              </FormControl>

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
