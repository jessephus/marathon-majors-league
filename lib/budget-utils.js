/**
 * Budget Calculation Utilities
 * 
 * Pure utility functions for salary cap budget calculations.
 * These functions have no side effects and are easily testable.
 */

/**
 * Default salary cap budget
 */
export const DEFAULT_BUDGET = 30000;

/**
 * Required number of roster slots
 */
export const REQUIRED_SLOTS = 6;

/**
 * Slot configuration
 */
export const SLOT_CONFIG = {
  men: ['M1', 'M2', 'M3'],
  women: ['W1', 'W2', 'W3'],
};

/**
 * Calculate total salary spent on current roster
 * @param {Array} roster - Array of roster slots
 * @returns {number} Total spent
 */
export function calculateTotalSpent(roster) {
  return roster.reduce((total, slot) => {
    return total + (slot.salary || 0);
  }, 0);
}

/**
 * Calculate remaining budget
 * @param {Array} roster - Array of roster slots
 * @param {number} totalBudget - Total budget available
 * @returns {number} Remaining budget
 */
export function calculateBudgetRemaining(roster, totalBudget = DEFAULT_BUDGET) {
  const spent = calculateTotalSpent(roster);
  return totalBudget - spent;
}

/**
 * Check if athlete can be afforded with current roster
 * @param {Array} currentRoster - Current roster slots
 * @param {Object} athlete - Athlete with salary property
 * @param {number} totalBudget - Total budget available
 * @returns {boolean} True if can afford
 */
export function canAffordAthlete(currentRoster, athlete, totalBudget = DEFAULT_BUDGET) {
  const spent = calculateTotalSpent(currentRoster);
  const remaining = totalBudget - spent;
  return athlete.salary <= remaining;
}

/**
 * Validate roster completeness and budget
 * @param {Array} roster - Array of roster slots
 * @param {number} maxBudget - Maximum budget
 * @param {number} requiredSlots - Required number of slots
 * @returns {Object} Validation result with isValid and errors
 */
export function validateRoster(roster, maxBudget = DEFAULT_BUDGET, requiredSlots = REQUIRED_SLOTS) {
  const errors = [];
  const spent = calculateTotalSpent(roster);
  const remaining = maxBudget - spent;
  const filledSlots = roster.filter(slot => slot.athleteId !== null).length;

  // Check if all slots are filled
  if (filledSlots < requiredSlots) {
    errors.push(`Fill all ${requiredSlots} roster slots (${filledSlots}/${requiredSlots} filled)`);
  }

  // Check if over budget
  if (spent > maxBudget) {
    errors.push(`Over budget by $${(spent - maxBudget).toLocaleString()}`);
  }

  // Validate men's slots
  const menSlots = roster.filter(slot => slot.slotId.startsWith('M'));
  const menFilled = menSlots.filter(slot => slot.athleteId !== null).length;
  if (menFilled < SLOT_CONFIG.men.length) {
    errors.push(`Fill all men's slots (${menFilled}/${SLOT_CONFIG.men.length})`);
  }

  // Validate women's slots
  const womenSlots = roster.filter(slot => slot.slotId.startsWith('W'));
  const womenFilled = womenSlots.filter(slot => slot.athleteId !== null).length;
  if (womenFilled < SLOT_CONFIG.women.length) {
    errors.push(`Fill all women's slots (${womenFilled}/${SLOT_CONFIG.women.length})`);
  }

  return {
    totalBudget: maxBudget,
    spent,
    remaining,
    filledSlots,
    requiredSlots,
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check if roster is locked based on lock time
 * @param {string|null} rosterLockTime - ISO timestamp of lock time
 * @param {Date} currentTime - Current time (default: now)
 * @returns {boolean} True if locked
 */
export function isRosterLocked(rosterLockTime, currentTime = new Date()) {
  if (!rosterLockTime) {
    return false; // No lock time set
  }

  const lockTime = new Date(rosterLockTime);
  return currentTime >= lockTime;
}

/**
 * Get time remaining until roster lock
 * @param {string|null} rosterLockTime - ISO timestamp of lock time
 * @param {Date} currentTime - Current time (default: now)
 * @returns {Object|null} Time object with days, hours, minutes, seconds, isPast
 */
export function getTimeUntilLock(rosterLockTime, currentTime = new Date()) {
  if (!rosterLockTime) {
    return null;
  }

  const lockTime = new Date(rosterLockTime);
  const diffMs = lockTime.getTime() - currentTime.getTime();

  if (diffMs < 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isPast: true,
    };
  }

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  return {
    days,
    hours,
    minutes,
    seconds,
    isPast: false,
  };
}

/**
 * Format lock time for display
 * @param {string|null} rosterLockTime - ISO timestamp of lock time
 * @param {boolean} includeTimezone - Whether to include timezone in format
 * @returns {string|null} Formatted time string
 */
export function formatLockTime(rosterLockTime, includeTimezone = true) {
  if (!rosterLockTime) {
    return null;
  }

  const lockTime = new Date(rosterLockTime);
  const options = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    ...(includeTimezone && { timeZoneName: 'short' }),
  };

  return lockTime.toLocaleString('en-US', options);
}

/**
 * Check if athlete is already in roster
 * @param {Array} roster - Array of roster slots
 * @param {number} athleteId - Athlete ID to check
 * @returns {boolean} True if athlete is in roster
 */
export function isAthleteInRoster(roster, athleteId) {
  return roster.some(slot => slot.athleteId === athleteId);
}

/**
 * Find available slot for athlete's gender
 * @param {Array} roster - Array of roster slots
 * @param {string} gender - 'men' or 'women'
 * @returns {string|null} Slot ID or null if all filled
 */
export function findAvailableSlot(roster, gender) {
  const slots = SLOT_CONFIG[gender];

  for (const slotId of slots) {
    const slot = roster.find(s => s.slotId === slotId);
    if (!slot || slot.athleteId === null) {
      return slotId;
    }
  }

  return null; // All slots filled
}
