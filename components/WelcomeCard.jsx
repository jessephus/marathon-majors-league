/**
 * WelcomeCard Component
 * 
 * Landing page welcome card that adapts based on user session state.
 * Server-side rendered with session-aware CTA buttons.
 * 
 * Props:
 * - sessionType: 'anonymous' | 'team' | 'commissioner'
 * - onCreateTeam: callback for creating a new team
 */

import { useState, useEffect } from 'react';
import { SessionType } from '../lib/session-utils';

// Critical CSS for above-the-fold content (inlined for faster first paint)
// Matches legacy welcome-card styling from public/style.css
const criticalStyles = {
  card: {
    background: '#fff',
    borderRadius: '10px',
    padding: '40px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
    maxWidth: '500px',
    margin: '0 auto',
  },
  cardMultiple: {
    background: '#fff',
    borderRadius: '10px',
    padding: '40px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
    maxWidth: '600px',
    margin: '0 auto',
  },
  heading: {
    color: '#ff6900',
    marginBottom: '15px',
    fontSize: '1.875rem',
    fontWeight: 'bold',
  },
  description: {
    color: '#666',
    marginBottom: '30px',
    fontSize: '1rem',
    lineHeight: '1.6',
  },
  section: {
    marginBottom: '20px',
    padding: '30px',
    background: 'linear-gradient(135deg, rgba(255, 105, 0, 0.08) 0%, rgba(44, 57, 162, 0.08) 100%)',
    borderRadius: '12px',
    border: '2px solid #ff6900',
    textAlign: 'center',
  },
  sectionHeading: {
    color: '#ff6900',
    marginBottom: '10px',
    fontSize: '1.4rem',
    fontWeight: '600',
  },
  sectionText: {
    color: '#333',
    marginBottom: '20px',
    fontSize: '1rem',
  },
  button: {
    display: 'inline-block',
    padding: '12px 24px',
    fontSize: '1rem',
    fontWeight: '600',
    color: '#fff',
    backgroundColor: '#2C39A2',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.2s, transform 0.1s',
    textAlign: 'center',
    textDecoration: 'none',
    textTransform: 'uppercase',
  },
  buttonHover: {
    backgroundColor: '#1e2870',
    transform: 'translateY(-2px)',
  },
  secondaryButton: {
    backgroundColor: '#ff6900',
  },
  secondaryButtonHover: {
    backgroundColor: '#e05500',
  },
};

export default function WelcomeCard({ sessionType = SessionType.ANONYMOUS, onCreateTeam }) {
  const [isHovered, setIsHovered] = useState(false);
  const [hasTeamSession, setHasTeamSession] = useState(false);
  const [hasCommissionerSession, setHasCommissionerSession] = useState(false);
  const [teamName, setTeamName] = useState('');

  // Check for both sessions on component mount (client-side)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const anonymousSession = window.anonymousSession;
      const commissionerSession = window.commissionerSession;
      
      const hasTeam = anonymousSession && anonymousSession.token;
      const hasCommissioner = commissionerSession && commissionerSession.isCommissioner;
      
      console.log('[WelcomeCard] Session check:', { hasTeam, hasCommissioner, anonymousSession, commissionerSession });
      
      setHasTeamSession(hasTeam);
      setHasCommissionerSession(hasCommissioner);
      
      // Get team name from session
      if (hasTeam && anonymousSession.displayName) {
        setTeamName(anonymousSession.displayName);
      }
    }
  }, []); // Empty dependency array - only run once on mount
  
  // Also re-check when sessionType prop changes (in case sessions load later)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const anonymousSession = window.anonymousSession;
      const commissionerSession = window.commissionerSession;
      
      const hasTeam = anonymousSession && anonymousSession.token;
      const hasCommissioner = commissionerSession && commissionerSession.isCommissioner;
      
      setHasTeamSession(hasTeam);
      setHasCommissionerSession(hasCommissioner);
      
      if (hasTeam && anonymousSession.displayName) {
        setTeamName(anonymousSession.displayName);
      }
    }
  }, [sessionType]); // Re-run when sessionType changes

  
  // Session-aware content rendering
  const renderContent = () => {
    // Handle dual-session scenario: Show both cards when both sessions are active
    if (hasTeamSession && hasCommissionerSession) {
      return (
        <>
          <h2 style={criticalStyles.heading}>Welcome Back!</h2>
          <p style={criticalStyles.description}>
            You have both a team and commissioner access.
          </p>
          
          {/* Team Card */}
          <div style={criticalStyles.section}>
            <h3 style={criticalStyles.sectionHeading}>🏃‍♂️ Your Team{teamName ? `: ${teamName}` : ''}</h3>
            <p style={criticalStyles.sectionText}>
              Continue drafting or check your roster.
            </p>
            <button 
              data-session-cta
              onClick={() => {
                // Navigate using legacy app.js system for compatibility
                if (typeof window !== 'undefined' && window.showPage) {
                  window.showPage('salary-cap-draft-page');
                }
              }}
              style={{
                ...criticalStyles.button,
                ...(isHovered ? criticalStyles.buttonHover : {})
              }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              View My Team
            </button>
          </div>
          
          {/* Commissioner Card */}
          <div style={{...criticalStyles.section, marginTop: '20px'}}>
            <h3 style={criticalStyles.sectionHeading}>👑 Commissioner Dashboard</h3>
            <p style={criticalStyles.sectionText}>
              Manage your league, enter results, and oversee the competition.
            </p>
            <button 
              onClick={() => {
                // Navigate using app-bridge handleCommissionerMode
                if (typeof window !== 'undefined' && window.handleCommissionerMode) {
                  window.handleCommissionerMode();
                }
              }}
              style={{
                ...criticalStyles.button,
                ...(isHovered ? criticalStyles.buttonHover : {})
              }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              Go to Dashboard
            </button>
          </div>
        </>
      );
    }

    // Original switch statement for single session scenarios
    switch (sessionType) {
      case SessionType.TEAM:
        return (
          <>
            <h2 style={criticalStyles.heading}>Welcome Back{teamName ? `, ${teamName}` : ''}!</h2>
            <p style={criticalStyles.description}>
              Your team is ready. Continue drafting or check your roster.
            </p>
            <div style={criticalStyles.section}>
              <button 
                data-session-cta
                onClick={() => {
                  // Navigate using legacy app.js system for compatibility
                  if (typeof window !== 'undefined' && window.showPage) {
                    window.showPage('salary-cap-draft-page');
                  }
                }}
                style={{
                  ...criticalStyles.button,
                  ...(isHovered ? criticalStyles.buttonHover : {})
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                View My Team
              </button>
            </div>
          </>
        );
      
      case SessionType.COMMISSIONER:
        return (
          <>
            <h2 style={criticalStyles.heading}>Commissioner Dashboard</h2>
            <p style={criticalStyles.description}>
              Manage your league, enter results, and oversee the competition.
            </p>
            <div style={criticalStyles.section}>
              <button 
                onClick={() => {
                  // Navigate using legacy app.js system for compatibility
                  if (typeof window !== 'undefined' && window.handleCommissionerMode) {
                    window.handleCommissionerMode();
                  }
                }}
                style={{
                  ...criticalStyles.button,
                  ...(isHovered ? criticalStyles.buttonHover : {})
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                Go to Dashboard
              </button>
            </div>
          </>
        );
      
      default:
        return (
          <>
            <h2 style={criticalStyles.heading}>Welcome to the Fantasy NY Marathon!</h2>
            <p style={criticalStyles.description}>
              Compete with friends by drafting elite marathon runners.
            </p>
            
            <div style={criticalStyles.section}>
              <h3 style={criticalStyles.sectionHeading}>🏃‍♂️ Join the Competition</h3>
              <p style={criticalStyles.sectionText}>
                Create your team and draft elite runners - no registration required!
              </p>
              <button 
                onClick={onCreateTeam}
                style={{
                  ...criticalStyles.button,
                  ...(isHovered ? criticalStyles.buttonHover : {})
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                Create a New Team
              </button>
            </div>
          </>
        );
    }
  };
  
  return (
    <div style={hasTeamSession && hasCommissionerSession ? criticalStyles.cardMultiple : criticalStyles.card}>
      {renderContent()}
    </div>
  );
}
