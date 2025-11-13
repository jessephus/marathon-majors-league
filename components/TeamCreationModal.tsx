/**
 * Team Creation Modal Component
 * 
 * Allows users to create a new team with a team name and optional owner name.
 * Creates an anonymous session and redirects to the team page.
 * 
 * Migrated from: pages/index.js (getLegacyPagesHTML)
 * Handler migrated from: public/app-bridge.js (handleTeamCreation)
 */

import { useState, useEffect, FormEvent } from 'react';

interface TeamCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId?: string;
}

export default function TeamCreationModal({ isOpen, onClose, gameId = 'default' }: TeamCreationModalProps) {
  const [teamName, setTeamName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!teamName.trim()) {
      alert('Please enter a team name');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create anonymous session via API
      const response = await fetch('/api/session/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionType: 'player',
          displayName: teamName.trim(),
          gameId: gameId,
          playerCode: teamName.trim(),
          expiryDays: 90
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create session');
      }
      
      const data = await response.json();
      
      // Store session info in localStorage
      const sessionData = {
        token: data.session.token,
        teamName: teamName.trim(),
        playerCode: data.session.playerCode || teamName.trim(),
        ownerName: ownerName.trim() || null,
        expiresAt: data.session.expiresAt
      };
      localStorage.setItem('marathon_fantasy_team', JSON.stringify(sessionData));
      
      // Also store the game ID for compatibility
      localStorage.setItem('current_game_id', gameId);
      
      // Close modal
      onClose();
      
      // Redirect to new team session page with SSR
      window.location.href = `/team/${data.session.token}`;
    } catch (error) {
      console.error('Error creating team:', error);
      alert('Failed to create team. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTeamName('');
    setOwnerName('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal" style={{ display: 'flex' }}>
      <div className="modal-overlay" onClick={handleClose}></div>
      <div className="modal-content">
        <button className="modal-close" onClick={handleClose}>&times;</button>
        <h2>Create Your Team</h2>
        <p>Enter your team name to get started:</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="team-name">Team Name</label>
            <input
              type="text"
              id="team-name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g., The Fast Finishers"
              required
              maxLength={50}
              disabled={isSubmitting}
            />
          </div>
          <div className="form-group">
            <label htmlFor="team-owner">Your Name (optional)</label>
            <input
              type="text"
              id="team-owner"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="e.g., John Smith"
              maxLength={50}
              disabled={isSubmitting}
            />
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Team & Start Drafting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
