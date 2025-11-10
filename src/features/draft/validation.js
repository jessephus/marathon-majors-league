/**
 * Draft Validation Module
 * 
 * Pure functions for validating salary cap draft rosters.
 * No DOM dependencies - can be tested in isolation.
 * 
 * Requirements:
 * - 3 men's slots (M1, M2, M3) 
 * - 3 women's slots (W1, W2, W3)
 * - Total budget: $30,000
 * - All slots must be filled
 * - No duplicate athletes
 */

/**
 * Default salary cap configuration
 */
export const SALARY_CAP_CONFIG = {
  totalCap: 30000,
  teamSize: 6,
  menPerTeam: 3,
  womenPerTeam: 3,
  menSlots: ['M1', 'M2', 'M3'],
  womenSlots: ['W1', 'W2', 'W3'],
};

/**
 * Validate that all required slots are filled
 * @param {Object} slots - Roster slots object {M1, M2, M3, W1, W2, W3}
 * @returns {Object} Validation result {isValid, errors}
 */
export function validateAllSlotsFilled(slots) {
  const errors = [];
  const allSlots = [...SALARY_CAP_CONFIG.menSlots, ...SALARY_CAP_CONFIG.womenSlots];
  
  // Check all slots
  const emptySlots = allSlots.filter(slotId => !slots[slotId] || slots[slotId] === null);
  
  if (emptySlots.length > 0) {
    errors.push(`Missing athletes in slots: ${emptySlots.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    filledSlots: allSlots.length - emptySlots.length,
    requiredSlots: allSlots.length,
  };
}

/**
 * Validate men's slots (3M requirement)
 * @param {Object} slots - Roster slots object
 * @returns {Object} Validation result {isValid, errors, filledCount, requiredCount}
 */
export function validateMenSlots(slots) {
  const errors = [];
  const menSlots = SALARY_CAP_CONFIG.menSlots;
  const filledMenSlots = menSlots.filter(slotId => slots[slotId] && slots[slotId] !== null);
  
  if (filledMenSlots.length < SALARY_CAP_CONFIG.menPerTeam) {
    errors.push(
      `Need ${SALARY_CAP_CONFIG.menPerTeam} male athletes, have ${filledMenSlots.length}`
    );
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    filledCount: filledMenSlots.length,
    requiredCount: SALARY_CAP_CONFIG.menPerTeam,
  };
}

/**
 * Validate women's slots (3W requirement)
 * @param {Object} slots - Roster slots object
 * @returns {Object} Validation result {isValid, errors, filledCount, requiredCount}
 */
export function validateWomenSlots(slots) {
  const errors = [];
  const womenSlots = SALARY_CAP_CONFIG.womenSlots;
  const filledWomenSlots = womenSlots.filter(slotId => slots[slotId] && slots[slotId] !== null);
  
  if (filledWomenSlots.length < SALARY_CAP_CONFIG.womenPerTeam) {
    errors.push(
      `Need ${SALARY_CAP_CONFIG.womenPerTeam} female athletes, have ${filledWomenSlots.length}`
    );
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    filledCount: filledWomenSlots.length,
    requiredCount: SALARY_CAP_CONFIG.womenPerTeam,
  };
}

/**
 * Calculate total salary spent on roster
 * @param {Object} slots - Roster slots object
 * @returns {number} Total salary spent
 */
export function calculateTotalSpent(slots) {
  const allSlots = [...SALARY_CAP_CONFIG.menSlots, ...SALARY_CAP_CONFIG.womenSlots];
  
  return allSlots.reduce((total, slotId) => {
    const athlete = slots[slotId];
    if (!athlete) return total;
    
    const salary = athlete.salary || 5000; // Default salary if not specified
    return total + salary;
  }, 0);
}

/**
 * Validate budget constraints
 * @param {Object} slots - Roster slots object
 * @param {number} maxBudget - Maximum budget (default: $30,000)
 * @returns {Object} Validation result {isValid, errors, spent, remaining, overBudget}
 */
export function validateBudget(slots, maxBudget = SALARY_CAP_CONFIG.totalCap) {
  const errors = [];
  const spent = calculateTotalSpent(slots);
  const remaining = maxBudget - spent;
  const overBudget = spent > maxBudget;
  
  if (overBudget) {
    errors.push(
      `Over budget by $${(spent - maxBudget).toLocaleString()}. Spent: $${spent.toLocaleString()}, Cap: $${maxBudget.toLocaleString()}`
    );
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    spent,
    remaining,
    overBudget,
    maxBudget,
  };
}

/**
 * Check for duplicate athletes across roster
 * @param {Object} slots - Roster slots object
 * @returns {Object} Validation result {isValid, errors, duplicates}
 */
export function validateNoDuplicates(slots) {
  const errors = [];
  const duplicates = [];
  const allSlots = [...SALARY_CAP_CONFIG.menSlots, ...SALARY_CAP_CONFIG.womenSlots];
  
  const athleteIds = allSlots
    .map(slotId => slots[slotId])
    .filter(athlete => athlete !== null)
    .map(athlete => athlete.id);
  
  // Find duplicates
  const seen = new Set();
  athleteIds.forEach(id => {
    if (seen.has(id)) {
      duplicates.push(id);
    }
    seen.add(id);
  });
  
  if (duplicates.length > 0) {
    errors.push(`Duplicate athletes found: ${duplicates.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    duplicates,
  };
}

/**
 * Validate gender constraints for each slot
 * @param {Object} slots - Roster slots object
 * @returns {Object} Validation result {isValid, errors, violations}
 */
export function validateSlotGenders(slots) {
  const errors = [];
  const violations = [];
  
  // Check men's slots
  SALARY_CAP_CONFIG.menSlots.forEach(slotId => {
    const athlete = slots[slotId];
    if (athlete && athlete.gender && athlete.gender !== 'men' && athlete.gender !== 'M') {
      violations.push(`${slotId} requires male athlete, got ${athlete.gender}`);
      errors.push(`Slot ${slotId} must contain a male athlete`);
    }
  });
  
  // Check women's slots
  SALARY_CAP_CONFIG.womenSlots.forEach(slotId => {
    const athlete = slots[slotId];
    if (athlete && athlete.gender && athlete.gender !== 'women' && athlete.gender !== 'W') {
      violations.push(`${slotId} requires female athlete, got ${athlete.gender}`);
      errors.push(`Slot ${slotId} must contain a female athlete`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    violations,
  };
}

/**
 * Comprehensive roster validation
 * Runs all validation checks and returns combined results
 * @param {Object} slots - Roster slots object
 * @param {Object} config - Optional configuration overrides
 * @returns {Object} Complete validation result
 */
export function validateRoster(slots, config = {}) {
  const maxBudget = config.maxBudget || SALARY_CAP_CONFIG.totalCap;
  
  // Run all validations
  const allSlotsFilled = validateAllSlotsFilled(slots);
  const menSlots = validateMenSlots(slots);
  const womenSlots = validateWomenSlots(slots);
  const budget = validateBudget(slots, maxBudget);
  const duplicates = validateNoDuplicates(slots);
  const genders = validateSlotGenders(slots);
  
  // Combine all errors
  const allErrors = [
    ...allSlotsFilled.errors,
    ...menSlots.errors,
    ...womenSlots.errors,
    ...budget.errors,
    ...duplicates.errors,
    ...genders.errors,
  ];
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    details: {
      allSlotsFilled,
      menSlots,
      womenSlots,
      budget,
      duplicates,
      genders,
    },
  };
}

/**
 * Check if a specific athlete can be added to a slot
 * @param {Object} slots - Current roster slots
 * @param {string} slotId - Target slot ID (e.g., 'M1', 'W2')
 * @param {Object} athlete - Athlete to add
 * @param {number} maxBudget - Maximum budget
 * @returns {Object} Result {canAdd, errors}
 */
export function canAddAthleteToSlot(slots, slotId, athlete, maxBudget = SALARY_CAP_CONFIG.totalCap) {
  const errors = [];
  
  // Validate slot ID exists
  const allSlots = [...SALARY_CAP_CONFIG.menSlots, ...SALARY_CAP_CONFIG.womenSlots];
  if (!allSlots.includes(slotId)) {
    errors.push(`Invalid slot ID: ${slotId}`);
    return { canAdd: false, errors };
  }
  
  // Check if athlete is already in roster
  const isDuplicate = allSlots.some(id => {
    const existingAthlete = slots[id];
    return existingAthlete && existingAthlete.id === athlete.id && id !== slotId;
  });
  
  if (isDuplicate) {
    errors.push(`Athlete ${athlete.name || athlete.id} is already in the roster`);
  }
  
  // Check gender matches slot
  const isMenSlot = SALARY_CAP_CONFIG.menSlots.includes(slotId);
  const athleteGender = athlete.gender;
  const genderMatch = isMenSlot
    ? athleteGender === 'men' || athleteGender === 'M'
    : athleteGender === 'women' || athleteGender === 'W';
  
  if (!genderMatch) {
    errors.push(`Athlete gender (${athleteGender}) doesn't match slot (${slotId})`);
  }
  
  // Check budget
  const currentSlotAthlete = slots[slotId];
  const currentSlotSalary = currentSlotAthlete ? (currentSlotAthlete.salary || 5000) : 0;
  const totalSpent = calculateTotalSpent(slots);
  const newTotal = totalSpent - currentSlotSalary + (athlete.salary || 5000);
  
  if (newTotal > maxBudget) {
    errors.push(
      `Adding ${athlete.name || athlete.id} would exceed budget. New total: $${newTotal.toLocaleString()}, Cap: $${maxBudget.toLocaleString()}`
    );
  }
  
  return {
    canAdd: errors.length === 0,
    errors,
    budgetImpact: {
      currentTotal: totalSpent,
      newTotal,
      remaining: maxBudget - newTotal,
    },
  };
}
