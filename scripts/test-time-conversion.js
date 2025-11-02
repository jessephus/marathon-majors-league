// Test timeStringToMs() function in isolation

function timeStringToMs(timeStr) {
  if (!timeStr || timeStr === 'DNS' || timeStr === 'DNF') {
    return null;
  }

  // Normalize format (remove leading zeros if present)
  let normalized = timeStr.trim();
  if (normalized.startsWith('0')) {
    normalized = normalized.substring(1);
  }

  // Debug logging for decimal times
  if (timeStr.includes('.')) {
    console.log('DEBUG: Processing decimal time:', timeStr);
    console.log('DEBUG: Normalized:', normalized);
  }

  // Parse HH:MM:SS or H:MM:SS (with optional decimal seconds)
  const parts = normalized.split(':');
  if (parts.length !== 3) {
    console.warn('Invalid time format:', timeStr);
    return null;
  }

  const numericParts = parts.map(part => Number(part));
  if (numericParts.some(isNaN)) {
    console.warn('Non-numeric parts in time:', timeStr);
    return null;
  }

  const [hours, minutes, seconds] = numericParts;
  
  if (timeStr.includes('.')) {
    console.log('DEBUG: Parsed parts:', { hours, minutes, seconds });
    console.log('DEBUG: seconds type:', typeof seconds);
    console.log('DEBUG: Calculation:', `(${hours} * 3600 + ${minutes} * 60 + ${seconds}) * 1000`);
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    console.log('DEBUG: Total seconds:', totalSeconds);
    const ms = Math.round(totalSeconds * 1000);
    console.log('DEBUG: Milliseconds:', ms);
    return ms;
  }

  // Use Math.round to handle floating-point precision issues
  return Math.round((hours * 3600 + minutes * 60 + seconds) * 1000);
}

// Test cases
const testCases = [
  '02:08:09',      // Kipruto - no decimals
  '02:08:09.03',   // Munyao - 30ms slower
  '2:05:30.123',   // Example with 123ms
  '2:05:30.12',    // Example with 120ms
  '2:05:30.1',     // Example with 100ms
];

console.log('Testing timeStringToMs() function:\n');
testCases.forEach(time => {
  const ms = timeStringToMs(time);
  console.log(`Input: "${time}" → Output: ${ms} (type: ${typeof ms})`);
  console.log('---');
});
