/**
 * Unit Tests for Formatting Utilities
 * 
 * Comprehensive test suite with 100% coverage for all formatting functions.
 * Tests pure functions with no side effects.
 * 
 */

import {
    formatSplitLabel,
    formatTimeGap,
    formatTimeFromMs,
    formatPacePerMile,
    timeStringToSeconds,
    roundTimeToSecond,
    getOrdinal,
    escapeHtml,
    getRecordBadge,
    getCountryFlag
} from '../utils/formatting.js';

// Test results tracking
let passedTests = 0;
let failedTests = 0;
const failedTestDetails = [];

// Simple test framework
function test(description, fn) {
    try {
        fn();
        passedTests++;
        console.log(`✓ ${description}`);
    } catch (error) {
        failedTests++;
        console.error(`✗ ${description}`);
        console.error(`  ${error.message}`);
        failedTestDetails.push({ description, error: error.message });
    }
}

function assertEquals(actual, expected, message = '') {
    if (actual !== expected) {
        throw new Error(`${message}\n  Expected: ${JSON.stringify(expected)}\n  Actual: ${JSON.stringify(actual)}`);
    }
}

function assertNull(actual, message = '') {
    if (actual !== null) {
        throw new Error(`${message}\n  Expected: null\n  Actual: ${JSON.stringify(actual)}`);
    }
}

console.log('\n=== Testing Formatting Utilities ===\n');

// Test formatSplitLabel
console.log('--- formatSplitLabel() ---');
test('formatSplitLabel: formats 5k correctly', () => {
    assertEquals(formatSplitLabel('5k'), '5K');
});

test('formatSplitLabel: formats 10k correctly', () => {
    assertEquals(formatSplitLabel('10k'), '10K');
});

test('formatSplitLabel: formats half correctly', () => {
    assertEquals(formatSplitLabel('half'), 'Half Marathon');
});

test('formatSplitLabel: formats 30k correctly', () => {
    assertEquals(formatSplitLabel('30k'), '30K');
});

test('formatSplitLabel: formats 35k correctly', () => {
    assertEquals(formatSplitLabel('35k'), '35K');
});

test('formatSplitLabel: formats 40k correctly', () => {
    assertEquals(formatSplitLabel('40k'), '40K');
});

test('formatSplitLabel: formats unknown split to uppercase', () => {
    assertEquals(formatSplitLabel('custom'), 'CUSTOM');
});

test('formatSplitLabel: handles empty string', () => {
    assertEquals(formatSplitLabel(''), 'recent split');
});

test('formatSplitLabel: handles null/undefined', () => {
    assertEquals(formatSplitLabel(null), 'recent split');
});

// Test formatTimeGap
console.log('\n--- formatTimeGap() ---');
test('formatTimeGap: formats whole minutes and seconds', () => {
    assertEquals(formatTimeGap(154), '+2:34');
});

test('formatTimeGap: formats sub-second gaps', () => {
    assertEquals(formatTimeGap(0.5), '+0:00.50');
});

test('formatTimeGap: formats gaps with decimals', () => {
    assertEquals(formatTimeGap(5.75), '+0:05.75');
});

test('formatTimeGap: handles zero gap', () => {
    assertEquals(formatTimeGap(0), '');
});

test('formatTimeGap: handles negative gap', () => {
    assertEquals(formatTimeGap(-10), '');
});

test('formatTimeGap: formats large gaps correctly', () => {
    assertEquals(formatTimeGap(665), '+11:05');
});

test('formatTimeGap: rounds decimals properly', () => {
    assertEquals(formatTimeGap(5.749), '+0:05.75'); // rounds to 2 decimals
});

// Test formatTimeFromMs
console.log('\n--- formatTimeFromMs() ---');
test('formatTimeFromMs: formats time with hours', () => {
    assertEquals(formatTimeFromMs(8130000), '2:15:30');
});

test('formatTimeFromMs: formats time without hours', () => {
    assertEquals(formatTimeFromMs(2720000), '45:20');
});

test('formatTimeFromMs: handles zero time', () => {
    assertEquals(formatTimeFromMs(0), '0:00:00');
});

test('formatTimeFromMs: handles null time', () => {
    assertEquals(formatTimeFromMs(null), '0:00:00');
});

test('formatTimeFromMs: handles negative time', () => {
    assertEquals(formatTimeFromMs(-1000), '0:00:00');
});

test('formatTimeFromMs: pads minutes and seconds', () => {
    assertEquals(formatTimeFromMs(3661000), '1:01:01');
});

test('formatTimeFromMs: handles very large times', () => {
    assertEquals(formatTimeFromMs(36000000), '10:00:00');
});

// Test formatPacePerMile
console.log('\n--- formatPacePerMile() ---');
test('formatPacePerMile: calculates pace correctly', () => {
    // ~5:30/mile pace (330 seconds = 330,000 ms per mile / 1609.34 meters = 205.054)
    assertEquals(formatPacePerMile(205.054), '5:30/mi');
});

test('formatPacePerMile: handles zero pace', () => {
    assertEquals(formatPacePerMile(0), 'N/A');
});

test('formatPacePerMile: handles null pace', () => {
    assertEquals(formatPacePerMile(null), 'N/A');
});

test('formatPacePerMile: handles negative pace', () => {
    assertEquals(formatPacePerMile(-100), 'N/A');
});

test('formatPacePerMile: pads seconds correctly', () => {
    // 4:00/mile pace (240 seconds = 240,000 ms per mile / 1609.34 meters)
    assertEquals(formatPacePerMile(149.13), '4:00/mi');
});

test('formatPacePerMile: handles very fast pace', () => {
    // 3:00/mile pace (180 seconds = 180,000 ms per mile / 1609.34 meters)
    assertEquals(formatPacePerMile(111.85), '3:00/mi');
});

test('formatPacePerMile: handles very slow pace', () => {
    // 10:00/mile pace (600 seconds = 600,000 ms per mile / 1609.34 meters)
    assertEquals(formatPacePerMile(372.83), '10:00/mi');
});

// Test timeStringToSeconds
console.log('\n--- timeStringToSeconds() ---');
test('timeStringToSeconds: parses time correctly', () => {
    assertEquals(timeStringToSeconds('2:15:30'), 8130);
});

test('timeStringToSeconds: handles zero values', () => {
    assertEquals(timeStringToSeconds('0:00:00'), 0);
});

test('timeStringToSeconds: handles single-digit values', () => {
    assertEquals(timeStringToSeconds('1:05:09'), 3909);
});

test('timeStringToSeconds: returns null for dash', () => {
    assertNull(timeStringToSeconds('-'));
});

test('timeStringToSeconds: returns null for empty string', () => {
    assertNull(timeStringToSeconds(''));
});

test('timeStringToSeconds: returns null for invalid format (2 parts)', () => {
    assertNull(timeStringToSeconds('45:20'));
});

test('timeStringToSeconds: returns null for invalid format (4 parts)', () => {
    assertNull(timeStringToSeconds('1:2:3:4'));
});

test('timeStringToSeconds: returns null for null input', () => {
    assertNull(timeStringToSeconds(null));
});

// Test roundTimeToSecond
console.log('\n--- roundTimeToSecond() ---');
test('roundTimeToSecond: rounds up correctly', () => {
    assertEquals(roundTimeToSecond('2:15:30.789'), '2:15:31');
});

test('roundTimeToSecond: rounds down correctly', () => {
    assertEquals(roundTimeToSecond('2:15:30.234'), '2:15:30');
});

test('roundTimeToSecond: rounds to exact half', () => {
    assertEquals(roundTimeToSecond('2:15:30.500'), '2:15:31'); // Math.round rounds .5 up
});

test('roundTimeToSecond: handles 59.5 seconds (carries to next minute)', () => {
    assertEquals(roundTimeToSecond('2:15:59.500'), '2:16:00');
});

test('roundTimeToSecond: handles 59:59.5 (carries to next hour)', () => {
    assertEquals(roundTimeToSecond('2:59:59.500'), '3:00:00');
});

test('roundTimeToSecond: preserves DNF', () => {
    assertEquals(roundTimeToSecond('DNF'), 'DNF');
});

test('roundTimeToSecond: preserves DNS', () => {
    assertEquals(roundTimeToSecond('DNS'), 'DNS');
});

test('roundTimeToSecond: preserves N/A', () => {
    assertEquals(roundTimeToSecond('N/A'), 'N/A');
});

test('roundTimeToSecond: handles null', () => {
    assertNull(roundTimeToSecond(null));
});

test('roundTimeToSecond: returns unchanged for invalid format', () => {
    assertEquals(roundTimeToSecond('45:20'), '45:20');
});

test('roundTimeToSecond: handles time without decimals', () => {
    assertEquals(roundTimeToSecond('2:15:30'), '2:15:30');
});

// Test getOrdinal
console.log('\n--- getOrdinal() ---');
test('getOrdinal: handles 1st', () => {
    assertEquals(getOrdinal(1), '1st');
});

test('getOrdinal: handles 2nd', () => {
    assertEquals(getOrdinal(2), '2nd');
});

test('getOrdinal: handles 3rd', () => {
    assertEquals(getOrdinal(3), '3rd');
});

test('getOrdinal: handles 4th', () => {
    assertEquals(getOrdinal(4), '4th');
});

test('getOrdinal: handles 11th (special case)', () => {
    assertEquals(getOrdinal(11), '11th');
});

test('getOrdinal: handles 12th (special case)', () => {
    assertEquals(getOrdinal(12), '12th');
});

test('getOrdinal: handles 13th (special case)', () => {
    assertEquals(getOrdinal(13), '13th');
});

test('getOrdinal: handles 21st', () => {
    assertEquals(getOrdinal(21), '21st');
});

test('getOrdinal: handles 22nd', () => {
    assertEquals(getOrdinal(22), '22nd');
});

test('getOrdinal: handles 23rd', () => {
    assertEquals(getOrdinal(23), '23rd');
});

test('getOrdinal: handles 100th', () => {
    assertEquals(getOrdinal(100), '100th');
});

test('getOrdinal: handles 101st', () => {
    assertEquals(getOrdinal(101), '101st');
});

test('getOrdinal: handles 111th (special case)', () => {
    assertEquals(getOrdinal(111), '111th');
});

// Test escapeHtml
console.log('\n--- escapeHtml() ---');
test('escapeHtml: escapes less than', () => {
    const result = escapeHtml('<script>');
    assertEquals(result.includes('&lt;'), true, 'Should contain &lt;');
});

test('escapeHtml: escapes greater than', () => {
    const result = escapeHtml('</script>');
    assertEquals(result.includes('&gt;'), true, 'Should contain &gt;');
});

test('escapeHtml: escapes ampersand', () => {
    const result = escapeHtml('Tom & Jerry');
    assertEquals(result.includes('&amp;'), true, 'Should contain &amp;');
});

test('escapeHtml: escapes double quotes', () => {
    const result = escapeHtml('"hello"');
    assertEquals(result.includes('&quot;'), true, 'Should contain &quot;');
});

test('escapeHtml: escapes single quotes', () => {
    const result = escapeHtml("'hello'");
    // Could be &#039; or &apos; depending on implementation
    assertEquals(result.includes('&#039;') || result.includes('&apos;'), true, 'Should escape single quotes');
});

test('escapeHtml: handles empty string', () => {
    assertEquals(escapeHtml('').length, 0);
});

test('escapeHtml: handles normal text unchanged in output', () => {
    const result = escapeHtml('Hello World');
    assertEquals(result, 'Hello World');
});

// Test getRecordBadge
console.log('\n--- getRecordBadge() ---');
test('getRecordBadge: returns empty for NONE', () => {
    assertEquals(getRecordBadge('NONE', 'confirmed'), '');
});

test('getRecordBadge: returns empty for null', () => {
    assertEquals(getRecordBadge(null, 'confirmed'), '');
});

test('getRecordBadge: creates WR badge', () => {
    const result = getRecordBadge('WORLD', 'confirmed');
    assertEquals(result.includes('WR'), true, 'Should contain WR');
    assertEquals(result.includes('World Record'), true, 'Should contain title');
});

test('getRecordBadge: creates CR badge', () => {
    const result = getRecordBadge('COURSE', 'confirmed');
    assertEquals(result.includes('CR'), true, 'Should contain CR');
    assertEquals(result.includes('Course Record'), true, 'Should contain title');
});

test('getRecordBadge: handles BOTH as WR', () => {
    const result = getRecordBadge('BOTH', 'confirmed');
    assertEquals(result.includes('WR'), true, 'Should contain WR for BOTH');
});

test('getRecordBadge: adds provisional styling', () => {
    const result = getRecordBadge('WORLD', 'provisional');
    assertEquals(result.includes('dashed'), true, 'Should have dashed border');
    assertEquals(result.includes('Provisional'), true, 'Should mention provisional');
});

// Test getCountryFlag
console.log('\n--- getCountryFlag() ---');
test('getCountryFlag: returns flag for USA', () => {
    const result = getCountryFlag('USA');
    // Check that it's a 2-character string (emoji flags are 2 code points)
    assertEquals(result.length >= 2, true, 'Should return flag emoji');
});

test('getCountryFlag: returns flag for KEN', () => {
    const result = getCountryFlag('KEN');
    assertEquals(result.length >= 2, true, 'Should return flag emoji');
});

test('getCountryFlag: returns flag for ETH', () => {
    const result = getCountryFlag('ETH');
    assertEquals(result.length >= 2, true, 'Should return flag emoji');
});

test('getCountryFlag: returns code for unknown country', () => {
    assertEquals(getCountryFlag('XYZ'), 'XYZ');
});

test('getCountryFlag: handles GBR correctly', () => {
    const result = getCountryFlag('GBR');
    assertEquals(result.length >= 2, true, 'Should return flag emoji for Great Britain');
});

test('getCountryFlag: handles JPN correctly', () => {
    const result = getCountryFlag('JPN');
    assertEquals(result.length >= 2, true, 'Should return flag emoji for Japan');
});

// Print summary
console.log('\n=== Test Summary ===');
console.log(`Total tests: ${passedTests + failedTests}`);
console.log(`✓ Passed: ${passedTests}`);
console.log(`✗ Failed: ${failedTests}`);

if (failedTests > 0) {
    console.log('\n=== Failed Tests ===');
    failedTestDetails.forEach(({ description, error }) => {
        console.log(`\n${description}`);
        console.log(`  ${error}`);
    });
    process.exit(1);
} else {
    console.log('\n✓ All tests passed!');
    
    // Calculate coverage (we have tests for all 10 functions)
    const totalFunctions = 10;
    const testedFunctions = 10;
    const coverage = (testedFunctions / totalFunctions) * 100;
    console.log(`\nFunction Coverage: ${coverage}%`);
    
    process.exit(0);
}
