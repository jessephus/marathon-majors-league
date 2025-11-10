/**
 * Budget Tracker Component
 * 
 * Displays budget information and validation errors for salary cap draft.
 * Pure component that receives calculated budget data as props.
 */

import React from 'react';
import { validateRoster, DEFAULT_BUDGET } from '@/lib/budget-utils';

interface BudgetTrackerProps {
  roster: Array<{
    slotId: string;
    athleteId: number | null;
    salary: number | null;
  }>;
  totalBudget?: number;
  className?: string;
}

export default function BudgetTracker({ 
  roster, 
  totalBudget = DEFAULT_BUDGET,
  className = '' 
}: BudgetTrackerProps) {
  // Calculate budget validation
  const validation = validateRoster(roster, totalBudget);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  // Calculate percentage spent
  const percentSpent = (validation.spent / validation.totalBudget) * 100;

  return (
    <div className={`budget-tracker ${className}`}>
      {/* Compact Budget Display */}
      <div className="draft-budget-compact">
        <div className="budget-metric">
          <div 
            className={`metric-value budget-remaining ${
              validation.remaining < 0 ? 'over-budget' : ''
            } ${
              validation.remaining === 0 && validation.filledSlots === validation.requiredSlots ? 'perfect' : ''
            }`}
          >
            {formatCurrency(Math.abs(validation.remaining))}
          </div>
          <div className="metric-label">
            {validation.remaining < 0 ? 'Over Budget' : 'Remaining'}
          </div>
        </div>
      </div>

      {/* Budget Progress Bar */}
      <div className="budget-progress-container">
        <div className="budget-progress-bar">
          <div 
            className={`budget-progress-fill ${
              percentSpent > 100 ? 'over-budget' : ''
            }`}
            style={{ width: `${Math.min(percentSpent, 100)}%` }}
          />
        </div>
        <div className="budget-progress-labels">
          <span>Spent: {formatCurrency(validation.spent)}</span>
          <span>Total: {formatCurrency(validation.totalBudget)}</span>
        </div>
      </div>

      {/* Validation Errors */}
      {validation.errors.length > 0 && (
        <div className="budget-validation-errors">
          <div className="validation-error-title">
            ⚠️ Before submitting:
          </div>
          <ul className="validation-error-list">
            {validation.errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Success Message */}
      {validation.isValid && (
        <div className="budget-validation-success">
          ✓ Team is ready to submit
        </div>
      )}
    </div>
  );
}
