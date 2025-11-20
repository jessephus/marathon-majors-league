/**
 * Draft State Machine
 * 
 * Manages the state transitions for the salary cap draft process.
 * Pure state management without DOM dependencies.
 * 
 * State Flow:
 * INITIAL -> SELECTING -> ROSTER_COMPLETE -> SUBMITTING -> SUBMITTED -> LOCKED
 */

import { validateRoster, calculateTotalSpent, SALARY_CAP_CONFIG } from './validation.js';

/**
 * Draft state machine states
 */
export const DRAFT_STATES = {
  INITIAL: 'INITIAL',                     // No athletes selected
  SELECTING: 'SELECTING',                 // User is building roster
  ROSTER_COMPLETE: 'ROSTER_COMPLETE',     // All slots filled, ready to submit
  SUBMITTING: 'SUBMITTING',               // Submission in progress
  SUBMITTED: 'SUBMITTED',                 // Team submitted, can still edit
  LOCKED: 'LOCKED',                       // Permanently locked (race started)
};

/**
 * Create initial draft state
 * @param {Object} config - Optional configuration overrides
 * @returns {Object} Initial draft state
 */
export function createInitialState(config = {}) {
  return {
    currentState: DRAFT_STATES.INITIAL,
    slots: {
      M1: null,
      M2: null,
      M3: null,
      W1: null,
      W2: null,
      W3: null,
    },
    totalSpent: 0,
    remainingBudget: config.totalBudget || SALARY_CAP_CONFIG.totalCap,
    currentSlot: null,
    currentGender: null,
    isSubmitted: false,
    isPermanentlyLocked: false,
    lastModified: null,
    sessionToken: null,
    config: {
      totalBudget: config.totalBudget || SALARY_CAP_CONFIG.totalCap,
      ...config,
    },
  };
}

/**
 * Add or replace athlete in a slot
 * @param {Object} state - Current draft state
 * @param {string} slotId - Slot ID (M1, M2, M3, W1, W2, W3)
 * @param {Object} athlete - Athlete object
 * @returns {Object} New state
 */
export function addAthleteToSlot(state, slotId, athlete) {
  if (!state || state.isPermanentlyLocked) {
    return state; // Cannot modify locked state
  }

  const newSlots = {
    ...state.slots,
    [slotId]: athlete,
  };

  const totalSpent = calculateTotalSpent(newSlots);
  const remainingBudget = state.config.totalBudget - totalSpent;
  
  // Check if roster is complete
  const allSlotsFilled = Object.values(newSlots).every(slot => slot !== null);
  const validation = validateRoster(newSlots, state.config);
  
  const newState = allSlotsFilled && validation.isValid
    ? DRAFT_STATES.ROSTER_COMPLETE
    : DRAFT_STATES.SELECTING;

  return {
    ...state,
    slots: newSlots,
    totalSpent,
    remainingBudget,
    currentState: newState,
    lastModified: new Date().toISOString(),
  };
}

/**
 * Remove athlete from a slot
 * @param {Object} state - Current draft state
 * @param {string} slotId - Slot ID
 * @returns {Object} New state
 */
export function removeAthleteFromSlot(state, slotId) {
  if (!state || state.isPermanentlyLocked) {
    return state; // Cannot modify locked state
  }

  const newSlots = {
    ...state.slots,
    [slotId]: null,
  };

  const totalSpent = calculateTotalSpent(newSlots);
  const remainingBudget = state.config.totalBudget - totalSpent;

  return {
    ...state,
    slots: newSlots,
    totalSpent,
    remainingBudget,
    currentState: DRAFT_STATES.SELECTING,
    lastModified: new Date().toISOString(),
  };
}

/**
 * Clear all slots
 * @param {Object} state - Current draft state
 * @returns {Object} New state
 */
export function clearRoster(state) {
  if (!state || state.isPermanentlyLocked) {
    return state;
  }

  return {
    ...state,
    slots: {
      M1: null,
      M2: null,
      M3: null,
      W1: null,
      W2: null,
      W3: null,
    },
    totalSpent: 0,
    remainingBudget: state.config.totalBudget,
    currentState: DRAFT_STATES.INITIAL,
    lastModified: new Date().toISOString(),
  };
}

/**
 * Set submitting state (async operation started)
 * @param {Object} state - Current draft state
 * @returns {Object} New state
 */
export function setSubmitting(state) {
  if (!state || state.isPermanentlyLocked) {
    return state;
  }

  return {
    ...state,
    currentState: DRAFT_STATES.SUBMITTING,
  };
}

/**
 * Set submitted state (team saved to backend)
 * @param {Object} state - Current draft state
 * @returns {Object} New state
 */
export function setSubmitted(state) {
  if (!state) {
    return state;
  }

  return {
    ...state,
    currentState: DRAFT_STATES.SUBMITTED,
    isSubmitted: true,
    lastModified: new Date().toISOString(),
  };
}

/**
 * Lock roster permanently (race has started)
 * @param {Object} state - Current draft state
 * @returns {Object} New state
 */
export function lockRoster(state) {
  if (!state) {
    return state;
  }

  return {
    ...state,
    currentState: DRAFT_STATES.LOCKED,
    isPermanentlyLocked: true,
  };
}

/**
 * Load roster from saved data
 * @param {Object} state - Current draft state
 * @param {Object} savedSlots - Previously saved slots
 * @param {boolean} isLocked - Whether roster is locked
 * @returns {Object} New state
 */
export function loadRoster(state, savedSlots, isLocked = false) {
  const totalSpent = calculateTotalSpent(savedSlots);
  const remainingBudget = state.config.totalBudget - totalSpent;
  
  const allSlotsFilled = Object.values(savedSlots).every(slot => slot !== null);
  const validation = validateRoster(savedSlots, state.config);
  
  let currentState = DRAFT_STATES.SELECTING;
  if (isLocked) {
    currentState = DRAFT_STATES.LOCKED;
  } else if (allSlotsFilled && validation.isValid) {
    currentState = DRAFT_STATES.SUBMITTED;
  } else if (allSlotsFilled) {
    currentState = DRAFT_STATES.ROSTER_COMPLETE;
  }

  return {
    ...state,
    slots: savedSlots,
    totalSpent,
    remainingBudget,
    currentState,
    isSubmitted: isLocked || (allSlotsFilled && validation.isValid),
    isPermanentlyLocked: isLocked,
  };
}

/**
 * Check if state allows editing
 * @param {Object} state - Current draft state
 * @returns {boolean} True if can edit
 */
export function canEditRoster(state) {
  if (!state) return false;
  
  return !state.isPermanentlyLocked && 
         state.currentState !== DRAFT_STATES.LOCKED &&
         state.currentState !== DRAFT_STATES.SUBMITTING;
}

/**
 * Check if state allows submission
 * @param {Object} state - Current draft state
 * @returns {boolean} True if can submit
 */
export function canSubmitRoster(state) {
  if (!state || state.isPermanentlyLocked) return false;
  
  const validation = validateRoster(state.slots, state.config);
  return validation.isValid && 
         state.currentState !== DRAFT_STATES.SUBMITTING &&
         state.currentState !== DRAFT_STATES.LOCKED;
}

/**
 * Get current roster validation status
 * @param {Object} state - Current draft state
 * @returns {Object} Validation result
 */
export function getRosterValidation(state) {
  if (!state) {
    return {
      isValid: false,
      errors: ['No state available'],
    };
  }
  
  return validateRoster(state.slots, state.config);
}

/**
 * Get roster summary
 * @param {Object} state - Current draft state
 * @returns {Object} Summary information
 */
export function getRosterSummary(state) {
  if (!state) {
    return null;
  }

  const filledSlots = Object.values(state.slots).filter(s => s !== null).length;
  const menFilled = [state.slots.M1, state.slots.M2, state.slots.M3].filter(s => s !== null).length;
  const womenFilled = [state.slots.W1, state.slots.W2, state.slots.W3].filter(s => s !== null).length;
  
  const validation = validateRoster(state.slots, state.config);

  return {
    filledSlots,
    totalSlots: 6,
    menFilled,
    menRequired: 3,
    womenFilled,
    womenRequired: 3,
    totalSpent: state.totalSpent,
    remainingBudget: state.remainingBudget,
    maxBudget: state.config.totalBudget,
    isValid: validation.isValid,
    errors: validation.errors,
    canEdit: canEditRoster(state),
    canSubmit: canSubmitRoster(state),
    currentState: state.currentState,
  };
}

/**
 * Serialize state for storage
 * @param {Object} state - Current draft state
 * @returns {string} JSON string
 */
export function serializeState(state) {
  return JSON.stringify({
    slots: state.slots,
    totalSpent: state.totalSpent,
    remainingBudget: state.remainingBudget,
    isSubmitted: state.isSubmitted,
    isPermanentlyLocked: state.isPermanentlyLocked,
    lastModified: state.lastModified,
    config: state.config,
  });
}

/**
 * Deserialize state from storage
 * @param {string} json - JSON string
 * @returns {Object} Draft state
 */
export function deserializeState(json) {
  try {
    const data = JSON.parse(json);
    const state = createInitialState(data.config);
    
    return loadRoster(
      state,
      data.slots,
      data.isPermanentlyLocked
    );
  } catch (error) {
    console.error('Failed to deserialize state:', error);
    return createInitialState();
  }
}
