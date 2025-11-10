/**
 * Draft Feature Module
 * 
 * Exports all draft-related functionality in a single module.
 * This provides a clean API for consuming the draft feature.
 * 
 * Usage:
 * ```js
 * import { 
 *   validateRoster, 
 *   createInitialState, 
 *   addAthleteToSlot 
 * } from '@/src/features/draft';
 * ```
 */

// Validation functions
export {
  SALARY_CAP_CONFIG,
  validateAllSlotsFilled,
  validateMenSlots,
  validateWomenSlots,
  calculateTotalSpent,
  validateBudget,
  validateNoDuplicates,
  validateSlotGenders,
  validateRoster,
  canAddAthleteToSlot,
} from './validation.js';

// State machine functions
export {
  DRAFT_STATES,
  createInitialState,
  addAthleteToSlot,
  removeAthleteFromSlot,
  clearRoster,
  setSubmitting,
  setSubmitted,
  lockRoster,
  loadRoster,
  canEditRoster,
  canSubmitRoster,
  getRosterValidation,
  getRosterSummary,
  serializeState,
  deserializeState,
} from './state-machine.js';
