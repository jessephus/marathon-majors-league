/**
 * Team Creation Modal Component
 * 
 * Allows users to create a new team with a team name and optional owner name.
 * Creates an anonymous session and redirects to the team page.
 * 
 * Migrated from: pages/index.js (getLegacyPagesHTML)
 * Handler migrated from: public/app-bridge.js (handleTeamCreation)
 * 
 * UI Migration: Migrated to Chakra UI buttons (Phase 4)
 */

import { useState, useEffect, FormEvent } from 'react';
import { 
  Button, 
  IconButton, 
  Input, 
  FormControl, 
  FormLabel, 
  FormHelperText 
} from '@/components/chakra';

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
        <IconButton
          className="modal-close"
          onClick={handleClose}
          aria-label="Close modal"
          variant="ghost"
          colorPalette="navy"
          size="sm"
        >
          &times;
        </IconButton>
        <h2>Create Your Team</h2>
        <p>Enter your team name to get started:</p>
        <form onSubmit={handleSubmit}>
          <FormControl isRequired style={{ marginBottom: '24px' }}>
            <FormLabel htmlFor="team-name">Team Name</FormLabel>
            <Input
              id="team-name"
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g., The Fast Finishers"
              maxLength={50}
              isDisabled={isSubmitting}
              variant="outline"
              size="md"
            />
          </FormControl>
          <FormControl style={{ marginBottom: '24px' }}>
            <FormLabel htmlFor="team-owner">Your Name (optional)</FormLabel>
            <Input
              id="team-owner"
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="e.g., John Smith"
              maxLength={50}
              isDisabled={isSubmitting}
              variant="outline"
              size="md"
            />
            <FormHelperText>This will be displayed on the leaderboard</FormHelperText>
          </FormControl>
          <div className="form-actions">
            <Button
              type="button"
              variant="outline"
              colorPalette="navy"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="solid"
              colorPalette="primary"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              loadingText="Creating..."
            >
              {isSubmitting ? 'Creating...' : 'Create Team'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
