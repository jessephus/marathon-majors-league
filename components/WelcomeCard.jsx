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

import { useState } from 'react';
import { SessionType } from '../lib/session-utils';

// Critical CSS for above-the-fold content (inlined for faster first paint)
const criticalStyles = {
  card: {
    maxWidth: '600px',
    margin: '2rem auto',
    padding: '2rem',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  heading: {
    fontSize: '1.875rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
    color: '#1a1a1a',
  },
  description: {
    fontSize: '1.125rem',
    marginBottom: '2rem',
    color: '#4a5568',
    lineHeight: '1.6',
  },
  section: {
    marginTop: '1.5rem',
  },
  sectionHeading: {
    fontSize: '1.25rem',
    fontWeight: '600',
    marginBottom: '0.5rem',
    color: '#2d3748',
  },
  sectionText: {
    fontSize: '1rem',
    marginBottom: '1rem',
    color: '#4a5568',
  },
  button: {
    display: 'inline-block',
    padding: '0.75rem 1.5rem',
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#fff',
    backgroundColor: '#ff6900',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    textAlign: 'center',
    textDecoration: 'none',
  },
  buttonHover: {
    backgroundColor: '#e05500',
  },
  secondaryButton: {
    backgroundColor: '#4299e1',
  },
};

export default function WelcomeCard({ sessionType = SessionType.ANONYMOUS, onCreateTeam }) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Session-aware content rendering
  const renderContent = () => {
    switch (sessionType) {
      case SessionType.TEAM:
        return (
          <>
            <h2 style={criticalStyles.heading}>Welcome Back!</h2>
            <p style={criticalStyles.description}>
              Your team is ready. Continue drafting or check your roster.
            </p>
            <div style={criticalStyles.section}>
              <a 
                href="/team" 
                style={{
                  ...criticalStyles.button,
                  ...(isHovered ? criticalStyles.buttonHover : {})
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                View My Team
              </a>
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
              <a 
                href="/commissioner" 
                style={{
                  ...criticalStyles.button,
                  ...(isHovered ? criticalStyles.buttonHover : {})
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                Go to Dashboard
              </a>
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
    <div style={criticalStyles.card}>
      {renderContent()}
    </div>
  );
}
