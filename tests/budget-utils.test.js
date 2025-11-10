/**
 * Budget Utilities Tests
 * 
 * Unit tests for budget calculation utilities
 */

import {
  calculateTotalSpent,
  calculateBudgetRemaining,
  canAffordAthlete,
  validateRoster,
  isRosterLocked,
  getTimeUntilLock,
  formatLockTime,
  isAthleteInRoster,
  findAvailableSlot,
  DEFAULT_BUDGET,
} from "../lib/budget-utils.js";

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

// Test data
const emptyRoster = [
  { slotId: 'M1', athleteId: null, salary: null },
  { slotId: 'M2', athleteId: null, salary: null },
  { slotId: 'M3', athleteId: null, salary: null },
  { slotId: 'W1', athleteId: null, salary: null },
  { slotId: 'W2', athleteId: null, salary: null },
  { slotId: 'W3', athleteId: null, salary: null },
];

const partialRoster = [
  { slotId: 'M1', athleteId: 1, salary: 5000 },
  { slotId: 'M2', athleteId: 2, salary: 6000 },
  { slotId: 'M3', athleteId: null, salary: null },
  { slotId: 'W1', athleteId: 3, salary: 4000 },
  { slotId: 'W2', athleteId: null, salary: null },
  { slotId: 'W3', athleteId: null, salary: null },
];

const fullRoster = [
  { slotId: 'M1', athleteId: 1, salary: 5000 },
  { slotId: 'M2', athleteId: 2, salary: 6000 },
  { slotId: 'M3', athleteId: 3, salary: 4500 },
  { slotId: 'W1', athleteId: 4, salary: 4000 },
  { slotId: 'W2', athleteId: 5, salary: 5500 },
  { slotId: 'W3', athleteId: 6, salary: 5000 },
];

const overBudgetRoster = [
  { slotId: 'M1', athleteId: 1, salary: 7000 },
  { slotId: 'M2', athleteId: 2, salary: 7000 },
  { slotId: 'M3', athleteId: 3, salary: 7000 },
  { slotId: 'W1', athleteId: 4, salary: 7000 },
  { slotId: 'W2', athleteId: 5, salary: 7000 },
  { slotId: 'W3', athleteId: 6, salary: 7000 },
];

const testAthlete = {
  id: 10,
  name: 'Test Runner',
  gender: 'men',
  salary: 3000,
};

// Run tests
console.log('\n🧪 Running Budget Utils Tests\n');

let passed = 0;
let failed = 0;

// calculateTotalSpent tests
if (runTest('calculateTotalSpent: empty roster returns 0', () => {
  const spent = calculateTotalSpent(emptyRoster);
  assertEqual(spent, 0, 'Empty roster should have 0 spent');
})) passed++; else failed++;

if (runTest('calculateTotalSpent: partial roster calculates correctly', () => {
  const spent = calculateTotalSpent(partialRoster);
  assertEqual(spent, 15000, 'Partial roster should have correct total');
})) passed++; else failed++;

if (runTest('calculateTotalSpent: full roster calculates correctly', () => {
  const spent = calculateTotalSpent(fullRoster);
  assertEqual(spent, 30000, 'Full roster should have correct total');
})) passed++; else failed++;

// calculateBudgetRemaining tests
if (runTest('calculateBudgetRemaining: empty roster has full budget', () => {
  const remaining = calculateBudgetRemaining(emptyRoster);
  assertEqual(remaining, DEFAULT_BUDGET, 'Empty roster should have full budget remaining');
})) passed++; else failed++;

if (runTest('calculateBudgetRemaining: partial roster has correct remaining', () => {
  const remaining = calculateBudgetRemaining(partialRoster);
  assertEqual(remaining, 15000, 'Partial roster should have 15000 remaining');
})) passed++; else failed++;

if (runTest('calculateBudgetRemaining: full roster has 0 remaining', () => {
  const remaining = calculateBudgetRemaining(fullRoster);
  assertEqual(remaining, 0, 'Full roster should have 0 remaining');
})) passed++; else failed++;

if (runTest('calculateBudgetRemaining: over budget shows negative', () => {
  const remaining = calculateBudgetRemaining(overBudgetRoster);
  assertEqual(remaining, -12000, 'Over budget roster should show negative remaining');
})) passed++; else failed++;

// canAffordAthlete tests
if (runTest('canAffordAthlete: can afford with empty roster', () => {
  const canAfford = canAffordAthlete(emptyRoster, testAthlete);
  assert(canAfford, 'Should be able to afford athlete with empty roster');
})) passed++; else failed++;

if (runTest('canAffordAthlete: can afford with partial roster', () => {
  const canAfford = canAffordAthlete(partialRoster, testAthlete);
  assert(canAfford, 'Should be able to afford athlete with partial roster');
})) passed++; else failed++;

if (runTest('canAffordAthlete: cannot afford with full roster', () => {
  const expensiveAthlete = { ...testAthlete, salary: 1000 };
  const canAfford = canAffordAthlete(fullRoster, expensiveAthlete);
  assert(!canAfford, 'Should not be able to afford athlete with full budget');
})) passed++; else failed++;

// validateRoster tests
if (runTest('validateRoster: empty roster is invalid', () => {
  const validation = validateRoster(emptyRoster);
  assert(!validation.isValid, 'Empty roster should be invalid');
  assert(validation.errors.length > 0, 'Should have validation errors');
})) passed++; else failed++;

if (runTest('validateRoster: partial roster is invalid', () => {
  const validation = validateRoster(partialRoster);
  assert(!validation.isValid, 'Partial roster should be invalid');
  assert(validation.errors.some(e => e.includes('Fill all')), 'Should have "fill all slots" error');
})) passed++; else failed++;

if (runTest('validateRoster: full roster is valid', () => {
  const validation = validateRoster(fullRoster);
  assert(validation.isValid, 'Full roster should be valid');
  assertEqual(validation.errors.length, 0, 'Should have no errors');
  assertEqual(validation.spent, 30000, 'Should show correct spent amount');
  assertEqual(validation.remaining, 0, 'Should show 0 remaining');
})) passed++; else failed++;

if (runTest('validateRoster: over budget roster is invalid', () => {
  const validation = validateRoster(overBudgetRoster);
  assert(!validation.isValid, 'Over budget roster should be invalid');
  assert(validation.errors.some(e => e.includes('Over budget')), 'Should have "over budget" error');
})) passed++; else failed++;

// isRosterLocked tests
if (runTest('isRosterLocked: null lock time is not locked', () => {
  const locked = isRosterLocked(null);
  assert(!locked, 'Null lock time should not be locked');
})) passed++; else failed++;

if (runTest('isRosterLocked: future lock time is not locked', () => {
  const futureTime = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour from now
  const locked = isRosterLocked(futureTime);
  assert(!locked, 'Future lock time should not be locked');
})) passed++; else failed++;

if (runTest('isRosterLocked: past lock time is locked', () => {
  const pastTime = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1 hour ago
  const locked = isRosterLocked(pastTime);
  assert(locked, 'Past lock time should be locked');
})) passed++; else failed++;

// getTimeUntilLock tests
if (runTest('getTimeUntilLock: null returns null', () => {
  const time = getTimeUntilLock(null);
  assertEqual(time, null, 'Null lock time should return null');
})) passed++; else failed++;

if (runTest('getTimeUntilLock: future time returns positive values', () => {
  const futureTime = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours from now
  const time = getTimeUntilLock(futureTime);
  assert(time !== null, 'Should return time object');
  assert(!time.isPast, 'Should not be past');
  assert(time.hours >= 1, 'Should have at least 1 hour');
})) passed++; else failed++;

if (runTest('getTimeUntilLock: past time returns isPast true', () => {
  const pastTime = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1 hour ago
  const time = getTimeUntilLock(pastTime);
  assert(time !== null, 'Should return time object');
  assert(time.isPast, 'Should be past');
})) passed++; else failed++;

// formatLockTime tests
if (runTest('formatLockTime: null returns null', () => {
  const formatted = formatLockTime(null);
  assertEqual(formatted, null, 'Null lock time should return null');
})) passed++; else failed++;

if (runTest('formatLockTime: formats date string', () => {
  const lockTime = '2025-11-02T13:35:00.000Z';
  const formatted = formatLockTime(lockTime);
  assert(formatted !== null, 'Should return formatted string');
  assert(formatted.includes('Nov'), 'Should include month');
})) passed++; else failed++;

// isAthleteInRoster tests
if (runTest('isAthleteInRoster: finds athlete in roster', () => {
  const inRoster = isAthleteInRoster(fullRoster, 1);
  assert(inRoster, 'Should find athlete in roster');
})) passed++; else failed++;

if (runTest('isAthleteInRoster: does not find missing athlete', () => {
  const inRoster = isAthleteInRoster(fullRoster, 999);
  assert(!inRoster, 'Should not find missing athlete');
})) passed++; else failed++;

if (runTest('isAthleteInRoster: handles empty roster', () => {
  const inRoster = isAthleteInRoster(emptyRoster, 1);
  assert(!inRoster, 'Should not find athlete in empty roster');
})) passed++; else failed++;

// findAvailableSlot tests
if (runTest('findAvailableSlot: finds first men slot in empty roster', () => {
  const slot = findAvailableSlot(emptyRoster, 'men');
  assertEqual(slot, 'M1', 'Should find M1 as first available');
})) passed++; else failed++;

if (runTest('findAvailableSlot: finds first women slot in empty roster', () => {
  const slot = findAvailableSlot(emptyRoster, 'women');
  assertEqual(slot, 'W1', 'Should find W1 as first available');
})) passed++; else failed++;

if (runTest('findAvailableSlot: finds next available men slot', () => {
  const slot = findAvailableSlot(partialRoster, 'men');
  assertEqual(slot, 'M3', 'Should find M3 as next available');
})) passed++; else failed++;

if (runTest('findAvailableSlot: returns null when all slots filled', () => {
  const slot = findAvailableSlot(fullRoster, 'men');
  assertEqual(slot, null, 'Should return null when all men slots filled');
})) passed++; else failed++;

// Summary
console.log(`\n${'='.repeat(50)}`);
console.log(`Tests Passed: ${passed}`);
console.log(`Tests Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);
console.log(`${'='.repeat(50)}\n`);

if (failed > 0) {
  process.exit(1);
}
