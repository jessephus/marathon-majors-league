/**
 * Commissioner TOTP Modal Component
 * 
 * Allows commissioners to authenticate using TOTP (Time-Based One-Time Password).
 * Verifies the 6-digit code and creates a commissioner session.
 * 
 * Migrated from: pages/index.js (getLegacyPagesHTML)
 * Handler migrated from: public/app-bridge.js (handleCommissionerTOTPLogin)
 * 
 * UI Migration: Migrated to Chakra UI buttons (Phase 4)
 */

import { useState, useEffect, FormEvent } from 'react';
import { Button, IconButton } from '@/components/chakra';

interface CommissionerTOTPModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId?: string;
}

export default function CommissionerTOTPModal({ isOpen, onClose, gameId = 'default' }: CommissionerTOTPModalProps) {
  const [totpCode, setTotpCode] = useState('');
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
    
    if (!totpCode.trim() || totpCode.trim().length !== 6) {
      alert('Please enter a 6-digit TOTP code');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Verify TOTP code via API
      const response = await fetch('/api/auth/totp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'commissioner@marathonmajorsfantasy.com', // Default commissioner email
          totpCode: totpCode.trim()
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Invalid TOTP code' }));
        throw new Error(errorData.error || 'Invalid TOTP code');
      }
      
      const data = await response.json();
      
      // Store commissioner session in localStorage
      const commissionerData = {
        isCommissioner: true,
        userId: data.userId || null,
        email: data.email || 'commissioner@marathonmajorsfantasy.com',
        gameId: gameId,
        loginTime: new Date().toISOString()
      };
      localStorage.setItem('marathon_fantasy_commissioner', JSON.stringify(commissionerData));
      
      // Also store game ID
      localStorage.setItem('current_game_id', gameId);
      
      // Dispatch custom event for other components
      window.dispatchEvent(new CustomEvent('commissionerLogin', { detail: commissionerData }));
      
      // Close modal
      onClose();
      
      // Navigate to commissioner dashboard
      window.location.href = '/commissioner';
    } catch (error: any) {
      console.error('Error verifying TOTP:', error);
      alert(error.message || 'Invalid TOTP code. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTotpCode('');
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
        <h2>Commissioner Login</h2>
        <p>Enter your 6-digit TOTP code from your authenticator app:</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="totp-code">TOTP Code</label>
            <input
              type="text"
              id="totp-code"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              autoComplete="off"
              disabled={isSubmitting}
              autoFocus
            />
          </div>
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
              disabled={isSubmitting || totpCode.length !== 6}
              isLoading={isSubmitting}
              loadingText="Verifying..."
            >
              {isSubmitting ? 'Verifying...' : 'Login'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
