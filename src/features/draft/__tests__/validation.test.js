/**
 * Draft Validation Tests
 * 
 * Comprehensive pure unit tests for draft validation logic.
 * Tests the 3M+3W roster requirement and budget constraints.
 * No DOM coupling - pure function testing.
 */

import {
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
} from '../validation.js';

// Test utilities
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
  }
}

function assertDeepEqual(actual, expected, message) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(`${message}\n  Expected: ${expectedStr}\n  Actual: ${actualStr}`);
  }
}

function runTest(name, testFn) {
  try {
    testFn();
    console.log(`✓ ${name}`);
    return true;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  ${error.message}`);
    return false;
  }
}

// Test data fixtures
const createEmptySlots = () => ({
  M1: null,
  M2: null,
  M3: null,
  W1: null,
  W2: null,
  W3: null,
});

const createMaleAthlete = (id, name, salary = 5000) => ({
  id,
  name,
  gender: 'men',
  salary,
});

const createFemaleAthlete = (id, name, salary = 5000) => ({
  id,
  name,
  gender: 'women',
  salary,
});

const createValidRoster = () => ({
  M1: createMaleAthlete(1, 'John Doe', 6000),
  M2: createMaleAthlete(2, 'Mike Smith', 5000),
  M3: createMaleAthlete(3, 'Tom Jones', 4000),
  W1: createFemaleAthlete(4, 'Jane Doe', 6000),
  W2: createFemaleAthlete(5, 'Sarah Smith', 5000),
  W3: createFemaleAthlete(6, 'Emma Jones', 4000),
});

// Run all tests
console.log('\n🧪 Draft Validation Tests\n');

let passed = 0;
let failed = 0;

// Test 1: Configuration constants
if (runTest('SALARY_CAP_CONFIG should have correct defaults', () => {
  assertEqual(SALARY_CAP_CONFIG.totalCap, 30000, 'Total cap should be $30,000');
  assertEqual(SALARY_CAP_CONFIG.teamSize, 6, 'Team size should be 6');
  assertEqual(SALARY_CAP_CONFIG.menPerTeam, 3, 'Men per team should be 3');
  assertEqual(SALARY_CAP_CONFIG.womenPerTeam, 3, 'Women per team should be 3');
  assertDeepEqual(SALARY_CAP_CONFIG.menSlots, ['M1', 'M2', 'M3'], 'Men slots should be M1, M2, M3');
  assertDeepEqual(SALARY_CAP_CONFIG.womenSlots, ['W1', 'W2', 'W3'], 'Women slots should be W1, W2, W3');
})) passed++; else failed++;

// Test 2: Empty roster validation
if (runTest('validateAllSlotsFilled should fail for empty roster', () => {
  const slots = createEmptySlots();
  const result = validateAllSlotsFilled(slots);
  
  assertEqual(result.isValid, false, 'Should be invalid');
  assertEqual(result.errors.length, 1, 'Should have 1 error');
  assertEqual(result.filledSlots, 0, 'Should have 0 filled slots');
  assertEqual(result.requiredSlots, 6, 'Should require 6 slots');
})) passed++; else failed++;

// Test 3: Partially filled roster
if (runTest('validateAllSlotsFilled should fail for partially filled roster', () => {
  const slots = createEmptySlots();
  slots.M1 = createMaleAthlete(1, 'John Doe');
  slots.W1 = createFemaleAthlete(2, 'Jane Doe');
  
  const result = validateAllSlotsFilled(slots);
  
  assertEqual(result.isValid, false, 'Should be invalid');
  assertEqual(result.filledSlots, 2, 'Should have 2 filled slots');
  assertEqual(result.requiredSlots, 6, 'Should require 6 slots');
})) passed++; else failed++;

// Test 4: Fully filled roster
if (runTest('validateAllSlotsFilled should pass for fully filled roster', () => {
  const slots = createValidRoster();
  const result = validateAllSlotsFilled(slots);
  
  assertEqual(result.isValid, true, 'Should be valid');
  assertEqual(result.errors.length, 0, 'Should have no errors');
  assertEqual(result.filledSlots, 6, 'Should have 6 filled slots');
})) passed++; else failed++;

// Test 5: Men's slots validation - empty
if (runTest('validateMenSlots should fail when no men are added', () => {
  const slots = createEmptySlots();
  const result = validateMenSlots(slots);
  
  assertEqual(result.isValid, false, 'Should be invalid');
  assertEqual(result.filledCount, 0, 'Should have 0 men');
  assertEqual(result.requiredCount, 3, 'Should require 3 men');
})) passed++; else failed++;

// Test 6: Men's slots validation - partial
if (runTest('validateMenSlots should fail with only 2 men', () => {
  const slots = createEmptySlots();
  slots.M1 = createMaleAthlete(1, 'John Doe');
  slots.M2 = createMaleAthlete(2, 'Mike Smith');
  
  const result = validateMenSlots(slots);
  
  assertEqual(result.isValid, false, 'Should be invalid');
  assertEqual(result.filledCount, 2, 'Should have 2 men');
  assertEqual(result.requiredCount, 3, 'Should require 3 men');
})) passed++; else failed++;

// Test 7: Men's slots validation - complete
if (runTest('validateMenSlots should pass with 3 men', () => {
  const slots = createEmptySlots();
  slots.M1 = createMaleAthlete(1, 'John Doe');
  slots.M2 = createMaleAthlete(2, 'Mike Smith');
  slots.M3 = createMaleAthlete(3, 'Tom Jones');
  
  const result = validateMenSlots(slots);
  
  assertEqual(result.isValid, true, 'Should be valid');
  assertEqual(result.filledCount, 3, 'Should have 3 men');
  assertEqual(result.errors.length, 0, 'Should have no errors');
})) passed++; else failed++;

// Test 8: Women's slots validation - empty
if (runTest('validateWomenSlots should fail when no women are added', () => {
  const slots = createEmptySlots();
  const result = validateWomenSlots(slots);
  
  assertEqual(result.isValid, false, 'Should be invalid');
  assertEqual(result.filledCount, 0, 'Should have 0 women');
  assertEqual(result.requiredCount, 3, 'Should require 3 women');
})) passed++; else failed++;

// Test 9: Women's slots validation - partial
if (runTest('validateWomenSlots should fail with only 2 women', () => {
  const slots = createEmptySlots();
  slots.W1 = createFemaleAthlete(1, 'Jane Doe');
  slots.W2 = createFemaleAthlete(2, 'Sarah Smith');
  
  const result = validateWomenSlots(slots);
  
  assertEqual(result.isValid, false, 'Should be invalid');
  assertEqual(result.filledCount, 2, 'Should have 2 women');
  assertEqual(result.requiredCount, 3, 'Should require 3 women');
})) passed++; else failed++;

// Test 10: Women's slots validation - complete
if (runTest('validateWomenSlots should pass with 3 women', () => {
  const slots = createEmptySlots();
  slots.W1 = createFemaleAthlete(1, 'Jane Doe');
  slots.W2 = createFemaleAthlete(2, 'Sarah Smith');
  slots.W3 = createFemaleAthlete(3, 'Emma Jones');
  
  const result = validateWomenSlots(slots);
  
  assertEqual(result.isValid, true, 'Should be valid');
  assertEqual(result.filledCount, 3, 'Should have 3 women');
  assertEqual(result.errors.length, 0, 'Should have no errors');
})) passed++; else failed++;

// Test 11: Calculate total spent - empty roster
if (runTest('calculateTotalSpent should return 0 for empty roster', () => {
  const slots = createEmptySlots();
  const total = calculateTotalSpent(slots);
  
  assertEqual(total, 0, 'Total should be 0');
})) passed++; else failed++;

// Test 12: Calculate total spent - with athletes
if (runTest('calculateTotalSpent should sum all athlete salaries', () => {
  const slots = createValidRoster();
  const total = calculateTotalSpent(slots);
  
  // 6000 + 5000 + 4000 + 6000 + 5000 + 4000 = 30000
  assertEqual(total, 30000, 'Total should be $30,000');
})) passed++; else failed++;

// Test 13: Budget validation - under budget
if (runTest('validateBudget should pass when under budget', () => {
  const slots = createEmptySlots();
  slots.M1 = createMaleAthlete(1, 'John Doe', 5000);
  slots.W1 = createFemaleAthlete(2, 'Jane Doe', 5000);
  
  const result = validateBudget(slots);
  
  assertEqual(result.isValid, true, 'Should be valid');
  assertEqual(result.spent, 10000, 'Should have spent $10,000');
  assertEqual(result.remaining, 20000, 'Should have $20,000 remaining');
  assertEqual(result.overBudget, false, 'Should not be over budget');
})) passed++; else failed++;

// Test 14: Budget validation - at budget
if (runTest('validateBudget should pass when exactly at budget', () => {
  const slots = createValidRoster();
  const result = validateBudget(slots);
  
  assertEqual(result.isValid, true, 'Should be valid');
  assertEqual(result.spent, 30000, 'Should have spent $30,000');
  assertEqual(result.remaining, 0, 'Should have $0 remaining');
  assertEqual(result.overBudget, false, 'Should not be over budget');
})) passed++; else failed++;

// Test 15: Budget validation - over budget
if (runTest('validateBudget should fail when over budget', () => {
  const slots = createEmptySlots();
  slots.M1 = createMaleAthlete(1, 'John Doe', 12000);
  slots.M2 = createMaleAthlete(2, 'Mike Smith', 12000);
  slots.M3 = createMaleAthlete(3, 'Tom Jones', 12000);
  
  const result = validateBudget(slots);
  
  assertEqual(result.isValid, false, 'Should be invalid');
  assertEqual(result.spent, 36000, 'Should have spent $36,000');
  assertEqual(result.overBudget, true, 'Should be over budget');
  assert(result.errors.length > 0, 'Should have errors');
})) passed++; else failed++;

// Test 16: Validate no duplicates - no duplicates
if (runTest('validateNoDuplicates should pass with unique athletes', () => {
  const slots = createValidRoster();
  const result = validateNoDuplicates(slots);
  
  assertEqual(result.isValid, true, 'Should be valid');
  assertEqual(result.errors.length, 0, 'Should have no errors');
  assertEqual(result.duplicates.length, 0, 'Should have no duplicates');
})) passed++; else failed++;

// Test 17: Validate no duplicates - with duplicate
if (runTest('validateNoDuplicates should fail with duplicate athletes', () => {
  const slots = createEmptySlots();
  const athlete = createMaleAthlete(1, 'John Doe');
  slots.M1 = athlete;
  slots.M2 = athlete;
  
  const result = validateNoDuplicates(slots);
  
  assertEqual(result.isValid, false, 'Should be invalid');
  assert(result.duplicates.length > 0, 'Should have duplicates');
  assert(result.errors.length > 0, 'Should have errors');
})) passed++; else failed++;

// Test 18: Validate slot genders - correct genders
if (runTest('validateSlotGenders should pass with correct genders', () => {
  const slots = createValidRoster();
  const result = validateSlotGenders(slots);
  
  assertEqual(result.isValid, true, 'Should be valid');
  assertEqual(result.errors.length, 0, 'Should have no errors');
  assertEqual(result.violations.length, 0, 'Should have no violations');
})) passed++; else failed++;

// Test 19: Validate slot genders - wrong gender in men's slot
if (runTest('validateSlotGenders should fail with woman in men\'s slot', () => {
  const slots = createEmptySlots();
  slots.M1 = createFemaleAthlete(1, 'Jane Doe');
  
  const result = validateSlotGenders(slots);
  
  assertEqual(result.isValid, false, 'Should be invalid');
  assert(result.errors.length > 0, 'Should have errors');
  assert(result.violations.length > 0, 'Should have violations');
})) passed++; else failed++;

// Test 20: Validate slot genders - wrong gender in women's slot
if (runTest('validateSlotGenders should fail with man in women\'s slot', () => {
  const slots = createEmptySlots();
  slots.W1 = createMaleAthlete(1, 'John Doe');
  
  const result = validateSlotGenders(slots);
  
  assertEqual(result.isValid, false, 'Should be invalid');
  assert(result.errors.length > 0, 'Should have errors');
  assert(result.violations.length > 0, 'Should have violations');
})) passed++; else failed++;

// Test 21: Comprehensive validation - valid roster
if (runTest('validateRoster should pass with completely valid roster', () => {
  const slots = createValidRoster();
  const result = validateRoster(slots);
  
  assertEqual(result.isValid, true, 'Should be valid');
  assertEqual(result.errors.length, 0, 'Should have no errors');
  assert(result.details.allSlotsFilled.isValid, 'All slots should be filled');
  assert(result.details.menSlots.isValid, 'Men slots should be valid');
  assert(result.details.womenSlots.isValid, 'Women slots should be valid');
  assert(result.details.budget.isValid, 'Budget should be valid');
  assert(result.details.duplicates.isValid, 'No duplicates should exist');
  assert(result.details.genders.isValid, 'Genders should be valid');
})) passed++; else failed++;

// Test 22: Comprehensive validation - multiple errors
if (runTest('validateRoster should accumulate multiple errors', () => {
  const slots = createEmptySlots();
  slots.M1 = createMaleAthlete(1, 'John Doe', 20000); // Over budget
  slots.W1 = createMaleAthlete(2, 'Mike Smith', 15000); // Wrong gender + over budget
  
  const result = validateRoster(slots);
  
  assertEqual(result.isValid, false, 'Should be invalid');
  assert(result.errors.length >= 3, 'Should have multiple errors'); // Missing slots, over budget, wrong gender
})) passed++; else failed++;

// Test 23: Can add athlete - valid addition
if (runTest('canAddAthleteToSlot should allow valid athlete addition', () => {
  const slots = createEmptySlots();
  const athlete = createMaleAthlete(1, 'John Doe', 5000);
  const result = canAddAthleteToSlot(slots, 'M1', athlete);
  
  assertEqual(result.canAdd, true, 'Should be able to add');
  assertEqual(result.errors.length, 0, 'Should have no errors');
  assert(result.budgetImpact.newTotal <= 30000, 'Should be under budget');
})) passed++; else failed++;

// Test 24: Can add athlete - duplicate athlete
if (runTest('canAddAthleteToSlot should reject duplicate athlete', () => {
  const slots = createEmptySlots();
  const athlete = createMaleAthlete(1, 'John Doe', 5000);
  slots.M1 = athlete;
  
  const result = canAddAthleteToSlot(slots, 'M2', athlete);
  
  assertEqual(result.canAdd, false, 'Should not be able to add');
  assert(result.errors.length > 0, 'Should have errors');
})) passed++; else failed++;

// Test 25: Can add athlete - wrong gender
if (runTest('canAddAthleteToSlot should reject wrong gender', () => {
  const slots = createEmptySlots();
  const athlete = createFemaleAthlete(1, 'Jane Doe', 5000);
  
  const result = canAddAthleteToSlot(slots, 'M1', athlete);
  
  assertEqual(result.canAdd, false, 'Should not be able to add');
  assert(result.errors.some(e => e.includes('gender')), 'Should have gender error');
})) passed++; else failed++;

// Test 26: Can add athlete - over budget
if (runTest('canAddAthleteToSlot should reject athlete that exceeds budget', () => {
  const slots = createEmptySlots();
  slots.M1 = createMaleAthlete(1, 'John Doe', 15000);
  slots.M2 = createMaleAthlete(2, 'Mike Smith', 10000);
  
  const expensiveAthlete = createMaleAthlete(3, 'Tom Jones', 10000);
  const result = canAddAthleteToSlot(slots, 'M3', expensiveAthlete);
  
  assertEqual(result.canAdd, false, 'Should not be able to add');
  assert(result.errors.some(e => e.includes('budget')), 'Should have budget error');
})) passed++; else failed++;

// Test 27: Can add athlete - replace existing
if (runTest('canAddAthleteToSlot should allow replacing athlete in same slot', () => {
  const slots = createEmptySlots();
  slots.M1 = createMaleAthlete(1, 'John Doe', 8000);
  
  const newAthlete = createMaleAthlete(2, 'Mike Smith', 7000);
  const result = canAddAthleteToSlot(slots, 'M1', newAthlete);
  
  assertEqual(result.canAdd, true, 'Should be able to replace');
  assertEqual(result.budgetImpact.newTotal, 7000, 'Should calculate new budget correctly');
})) passed++; else failed++;

// Test 28: Can add athlete - invalid slot ID
if (runTest('canAddAthleteToSlot should reject invalid slot ID', () => {
  const slots = createEmptySlots();
  const athlete = createMaleAthlete(1, 'John Doe', 5000);
  
  const result = canAddAthleteToSlot(slots, 'INVALID', athlete);
  
  assertEqual(result.canAdd, false, 'Should not be able to add');
  assert(result.errors.some(e => e.includes('Invalid slot')), 'Should have invalid slot error');
})) passed++; else failed++;

// Test 29: Edge case - athletes with default salary
if (runTest('calculateTotalSpent should handle athletes without salary property', () => {
  const slots = createEmptySlots();
  slots.M1 = { id: 1, name: 'John Doe', gender: 'men' }; // No salary property
  
  const total = calculateTotalSpent(slots);
  
  assertEqual(total, 5000, 'Should use default salary of $5,000');
})) passed++; else failed++;

// Test 30: Edge case - budget validation with custom cap
if (runTest('validateBudget should work with custom budget cap', () => {
  const slots = createEmptySlots();
  slots.M1 = createMaleAthlete(1, 'John Doe', 15000);
  
  const result = validateBudget(slots, 20000);
  
  assertEqual(result.isValid, true, 'Should be valid with custom cap');
  assertEqual(result.maxBudget, 20000, 'Should use custom budget');
  assertEqual(result.remaining, 5000, 'Should calculate remaining correctly');
})) passed++; else failed++;

// Summary
console.log(`\n${'='.repeat(50)}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📊 Total: ${passed + failed}`);
console.log('='.repeat(50));

if (failed > 0) {
  process.exit(1);
}
